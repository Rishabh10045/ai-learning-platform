import { days, START_DATE } from './curriculum.js';
import { videosForDay } from './lesson-videos.js';
import { assessmentVersion, gradeAssessment, passCount, sessionQA } from './session-qa.js';
import { defaultPreferences, indiaTime, missedPlanPenalty, missedPlannedSessions } from './study-planner.js';
import { getTopic, takeawayLimit } from './topic-index.js';

export const storageKey = 'ai-learning-platform.study-desk.v1';

export function todayInIndia(now = new Date()) {
  return indiaTime(now).date;
}

export function emptyProgress() {
  return {
    sessions: {}, unavailable: [], videoProgress: {}, personalNotes: {}, udemyLectures: {},
    assessments: {}, planned: {}, topicTakeaways: {}, preferences: { ...defaultPreferences }
  };
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function readProgress(storage) {
  const raw = storage.getItem(storageKey);
  if (!raw) return emptyProgress();
  const parsed = JSON.parse(raw);
  const state = emptyProgress();
  if (Array.isArray(parsed?.unavailable)) {
    state.unavailable = [...new Set(parsed.unavailable.filter(validDate))].sort();
  }
  const preferences = parsed?.preferences || {};
  for (const key of ['weekdayMinutes', 'saturdayMinutes', 'sundayMinutes']) {
    if (validBudget(preferences[key])) state.preferences[key] = preferences[key];
  }
  state.preferences.emailReminders = preferences.emailReminders === true;
  for (const [id, text] of Object.entries(parsed?.topicTakeaways || {})) {
    // Keep retired topic IDs in saved progress while only allowing edits to indexed topics.
    if (/^[a-z]+(?:-[a-z]+)+-\d+$/.test(id) && typeof text === 'string' && text.length <= takeawayLimit && text.trim()) {
      state.topicTakeaways[id] = text;
    }
  }
  for (const [date, number] of Object.entries(parsed?.planned || {})) {
    if (validDate(date) && date >= START_DATE && Number.isInteger(number) && days[number - 1]) state.planned[date] = number;
  }
  for (const day of days) {
    const notes = parsed?.personalNotes?.[day.number];
    if (typeof notes === 'string') state.personalNotes[day.number] = notes;
    const savedLectures = parsed?.udemyLectures?.[day.number];
    const lectures = Array.isArray(savedLectures) ? savedLectures : [savedLectures];
    for (const lecture of lectures) {
      if (!lecture || typeof lecture.title !== 'string' || typeof lecture.url !== 'string') continue;
      try {
        saveUdemyLecture(state, day.number, lecture);
      } catch {
        // Ignore stale or invalid lecture data while preserving the study session.
      }
    }
    for (const video of assignedVideos(state, day.number)) {
      const record = parsed?.videoProgress?.[day.number]?.[video.id];
      if (Number.isInteger(record?.minutes) && record.minutes >= 0 && record.minutes <= 600) {
        (state.videoProgress[day.number] ??= {})[video.id] = { minutes: record.minutes, watched: record.watched === true };
      }
    }
    const record = parsed?.assessments?.[day.number];
    const max = sessionQA[day.number].assessment.length;
    if (Number.isInteger(record?.score) && record.score >= 0 && record.score <= max &&
        Number.isInteger(record.attempts) && record.attempts > 0 && validDate(record.lastAttempt)) {
      const answers = Array.isArray(record.correct) && record.correct.length === max ?
        record.correct.map(value => value === true) : [];
      state.assessments[day.number] = {
        score: record.score, attempts: record.attempts, lastAttempt: record.lastAttempt,
        stale: record.stale === true, correct: answers,
        bankVersion: Number.isInteger(record.bankVersion) && record.bankVersion > 0 ? record.bankVersion : 1
      };
    }
    const saved = parsed?.sessions?.[day.number];
    if (!validDate(saved?.startedOn)) continue;
    const checked = Array.isArray(saved.checked) ? saved.checked : [];
    state.sessions[day.number] = {
      startedOn: saved.startedOn,
      completedOn: validDate(saved.completedOn) ? saved.completedOn : '',
      checked: day.blocks.filter(block => checked.includes(block.id)).map(block => block.id),
      evidence: typeof saved.evidence === 'string' ? saved.evidence : '',
      notes: typeof saved.notes === 'string' ? saved.notes : ''
    };
  }
  return state;
}

export function nextDay(state) {
  return days.find(day => !state.sessions[day.number]?.completedOn);
}

export function completeCount(state) {
  return days.filter(day => state.sessions[day.number]?.completedOn).length;
}

export function statusFor(state, day) {
  const session = state.sessions[day.number];
  if (session?.completedOn) return 'Complete';
  if (session?.startedOn) return 'In progress';
  if (nextDay(state)?.number === day.number) return 'Ready';
  return 'Planned';
}

export function setUnavailable(state, date, unavailable) {
  if (!validDate(date) || date < START_DATE) throw new Error('Choose a date on or after 22 November 2026.');
  const dates = new Set(state.unavailable);
  if (unavailable) dates.add(date);
  else dates.delete(date);
  state.unavailable = [...dates].sort();
}

function assertCanStudy(state, date) {
  if (date < START_DATE) throw new Error('Study opens on 22 November 2026.');
  if (state.unavailable.includes(date)) throw new Error('Today is marked unavailable. Clear that date to resume.');
}

export function beginDay(state, number, date) {
  assertCanStudy(state, date);
  if (nextDay(state)?.number !== number) throw new Error('Finish the current study day before starting this one.');
  state.sessions[number] ??= { startedOn: date, completedOn: '', checked: [], evidence: '', notes: '' };
}

function activeSession(state, number, date) {
  assertCanStudy(state, date);
  const session = state.sessions[number];
  if (nextDay(state)?.number !== number || !session?.startedOn) {
    throw new Error('Begin the current study day to record progress.');
  }
  return session;
}

export function checkBlock(state, number, blockId, done, date) {
  const session = activeSession(state, number, date);
  if (!days[number - 1].blocks.some(block => block.id === blockId)) throw new Error('That study block could not be found.');
  const checks = new Set(session.checked);
  if (done) checks.add(blockId);
  else if (checks.delete(blockId) && state.assessments[number]) state.assessments[number].stale = true;
  session.checked = [...checks];
}

export function saveNotes(state, number, fields, date) {
  const session = activeSession(state, number, date);
  if (typeof fields?.evidence !== 'string' || typeof fields.notes !== 'string') throw new Error('Enter assignment evidence and any notes.');
  const evidence = fields.evidence.trim().slice(0, 6000);
  if (session.evidence !== evidence && state.assessments[number]) state.assessments[number].stale = true;
  session.evidence = evidence;
  session.notes = fields.notes.trim().slice(0, 8000);
}

export function savePersonalNotes(state, number, notes) {
  if (!days[number - 1] || typeof notes !== 'string') throw new Error('That study day could not be found.');
  state.personalNotes[number] = notes.slice(0, 10000);
}

export function saveTopicTakeaway(state, { topicId, text, base }) {
  if (!getTopic(topicId)) throw new Error('That study topic could not be found.');
  if (typeof text !== 'string' || typeof base !== 'string' || text.length > takeawayLimit || base.length > takeawayLimit) {
    throw new Error('Enter a takeaway of up to ' + takeawayLimit + ' characters.');
  }
  const current = state.topicTakeaways[topicId] ?? '';
  const next = text.trim();
  if (current === next) return;
  if (current !== base) throw new Error('This takeaway changed. Compare your draft with the latest saved version.');
  if (next) state.topicTakeaways[topicId] = next;
  else delete state.topicTakeaways[topicId];
}

export function assignedVideos(state, number) {
  return [...(state.udemyLectures[number] || []), ...videosForDay(number)];
}

export function saveUdemyLecture(state, number, { url, title, minutes }) {
  let link;
  try {
    link = new URL(url);
  } catch {
    throw new Error('Enter an Udemy course or lecture URL.');
  }
  const publicOrLecture = /^\/course\/[^/]+(?:\/learn(?:\/lecture\/\d+)?)?\/?$/.test(link.pathname);
  if (link.protocol !== 'https:' || !['udemy.com', 'www.udemy.com'].includes(link.hostname) || !publicOrLecture ||
      link.username || link.password) {
    throw new Error('Use an https://www.udemy.com/course/ link.');
  }
  if (!days[number - 1] || typeof title !== 'string' || !title.trim() || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
    throw new Error('Enter the lecture title and a suggested watch time from 1 to 120 minutes.');
  }
  const id = 'udemy:' + link.pathname.replace(/\/$/, '');
  const lectures = state.udemyLectures[number] ??= [];
  const existing = lectures.findIndex(video => video.id === id);
  const lecture = {
    id, title: title.trim().slice(0, 180), url: 'https://www.udemy.com' + link.pathname,
    minutes, teacher: 'Your course', platform: 'Udemy',
    focus: 'Open the linked lecture through your Udemy account.'
  };
  if (existing === -1) lectures.push(lecture);
  else lectures[existing] = lecture;
}

export function totalWatchMinutes(state) {
  return Object.values(state.videoProgress).flatMap(Object.values).reduce((total, record) => total + record.minutes, 0);
}

export function saveVideoProgress(state, number, id, minutes, watched) {
  if (!assignedVideos(state, number).some(video => video.id === id)) throw new Error('That lecture could not be found.');
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) {
    throw new Error('Enter whole minutes from 0 to 600.');
  }
  (state.videoProgress[number] ??= {})[id] = { minutes, watched: Boolean(watched) };
}

export function finishDay(state, number, date) {
  const session = activeSession(state, number, date);
  const remaining = days[number - 1].blocks.filter(block => !session.checked.includes(block.id));
  if (remaining.length) throw new Error('Complete the remaining study blocks first.');
  if (!session.evidence.trim()) throw new Error('Add and save the assignment evidence first.');
  if (!passedAssessment(state, number)) throw new Error('Pass the self-check before finishing this study day.');
  session.completedOn = date;
}

export function reopenDay(state, number, date) {
  assertCanStudy(state, date);
  const session = state.sessions[number];
  if (!session?.completedOn) throw new Error('This session is already open.');
  if (state.assessments[number]) state.assessments[number].stale = true;
  session.completedOn = '';
}

function validBudget(minutes) {
  return Number.isInteger(minutes) && minutes >= 120 && minutes <= 420 && minutes % 15 === 0;
}

export function setStudyPreferences(state, fields) {
  for (const key of ['weekdayMinutes', 'saturdayMinutes', 'sundayMinutes']) {
    if (!validBudget(fields[key])) throw new Error('Study budgets must be 120–420 minutes in 15-minute increments.');
  }
  if (typeof fields.emailReminders !== 'boolean') throw new Error('Choose whether to enable email reminders.');
  state.preferences = {
    weekdayMinutes: fields.weekdayMinutes, saturdayMinutes: fields.saturdayMinutes,
    sundayMinutes: fields.sundayMinutes, emailReminders: fields.emailReminders
  };
}

export function setPlannedDay(state, plannedDate, number, today) {
  if (!validDate(plannedDate) || plannedDate < START_DATE) throw new Error('Choose a valid study date.');
  if (number === null) {
    delete state.planned[plannedDate];
    return;
  }
  if (plannedDate < today) throw new Error('Choose today or a future date.');
  if (!Number.isInteger(number) || !days[number - 1] || state.sessions[number]?.completedOn) {
    throw new Error('Choose an unfinished study day.');
  }
  if (state.unavailable.includes(plannedDate)) throw new Error('That date is marked unavailable.');
  state.planned[plannedDate] = number;
}

export function readinessScore(state, number) {
  const session = state.sessions[number];
  if (!session || !days[number - 1]) return 0;
  const blocks = days[number - 1].blocks;
  return Math.floor(blocks.filter(block => session.checked.includes(block.id)).length * 70 / blocks.length) +
    (session.evidence.trim() ? 30 : 0);
}

export function passedAssessment(state, number) {
  const record = state.assessments[number];
  return Boolean(record && !record.stale && record.score >= passCount(number));
}

export function submitAssessment(state, number, choices, date, bankVersion) {
  activeSession(state, number, date);
  if (readinessScore(state, number) < 100) throw new Error('Complete every block and save assignment evidence to unlock the self-check.');
  if (bankVersion !== assessmentVersion) throw new Error('The self-check changed. Reload the study desk and answer the current questions.');
  const score = gradeAssessment(number, choices);
  const correct = sessionQA[number].assessment.map((item, index) => item.answer === choices[index]);
  state.assessments[number] = {
    score, correct, bankVersion, attempts: (state.assessments[number]?.attempts || 0) + 1, lastAttempt: date, stale: false
  };
}

export function dashboardScore(state, now) {
  const earned = days.reduce((sum, day) => sum + readinessScore(state, day.number) +
    (passedAssessment(state, day.number) ? 25 : 0), 0);
  const missed = missedPlannedSessions(state, now);
  return { earned, missed, deductions: missed.length * missedPlanPenalty, total: Math.max(0, earned - missed.length * missedPlanPenalty) };
}

export function revisionRecalls(day) {
  if (day.number === 1) return [];
  return days[day.number - 2].blocks
    .filter(block => block.recall && (day.number > 2 || block.id !== 'review'))
    .map(block => block.recall);
}

export function checkpoint(state, day, date) {
  const session = state.sessions[day.number];
  const done = day.blocks.filter(block => session?.checked.includes(block.id));
  const todo = day.blocks.filter(block => !session?.checked.includes(block.id));
  const next = session?.completedOn ? days[day.number] : day;
  return [
    'Study day / date: Day ' + day.number + ' / ' + date + ' (IST)',
    'Status: ' + statusFor(state, day),
    'Readiness: ' + readinessScore(state, day.number) + '/100',
    'Active topic: ' + day.topics.join(', '),
    'Completed blocks: ' + (done.map(block => block.title).join('; ') || 'None recorded'),
    'Evidence / repository links: ' + (session?.evidence || 'Pending'),
    'Needs practice / teach from basics / later topics: ' + (session?.notes || 'None recorded'),
    'Own revision notes: ' + (state.personalNotes[day.number]?.trim() || 'None recorded'),
    'Notes destination: Study Desk, browser storage',
    'Pending assignment: ' + (todo.map(block => block.title).join('; ') || 'None'),
    'Next lesson: ' + (next ? 'Day ' + next.number + ' · ' + next.title : 'Roadmap complete')
  ].join('\n');
}
