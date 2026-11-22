/*
 * Codex → Study Desk v2 adapter (Grok-owned, ui/**). No build step.
 *
 * Codex owns the curriculum, content and persistence. This adapter never writes Codex's
 * stored progress itself: every learner action in the v2 UI is translated into Codex's own
 * study actions (study-actions.js applyStudyAction / StudySync.save), so the existing storage
 * key ('ai-learning-platform.study-desk.v1'), the account API and Codex's validation rules
 * stay the single source of truth. Existing lesson IDs are Codex's (day.topics[0] lower-case,
 * e.g. Day 1 = "j-oop-01"), exactly as course-outline.js and topic-index.js derive them.
 *
 * What Codex's progress has no field for (interview "answered" marks, challenges, the full
 * reminder object, practice drafts per block, watch logs with dates, the activity log) is kept in
 * a small per-browser UI sidecar. It is listed as adapter questions for Codex in PR #5.
 *
 *   const A = createCodexAdapter({ S, E, codex });
 *   A.course                         -> course contract v2 (ui/README.md)
 *   A.toProgress(codexState, side)   -> progress v2 (derived, never stored)
 *   A.translate(change, codexState, side) -> { actions: [codexAction...], side, result } | { ok:false, reason }
 *   A.quizLock(lessonId, codexState) -> reason string | null
 */
export const SIDECAR_KEY = 'ai-learning-platform.study-desk.ui-sidecar.v1';
export const SIDECAR_VERSION = 1;

export function emptySidecar() {
  return { v: SIDECAR_VERSION, interview: {}, challenges: {}, notifications: null, practice: {}, watchLog: {}, revisions: {}, activity: [], lastActiveAt: null };
}
export function readSidecar(storage) {
  try {
    const raw = JSON.parse(storage.getItem(SIDECAR_KEY) || 'null');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptySidecar();
    const out = emptySidecar();
    for (const k of Object.keys(out)) if (raw[k] != null) out[k] = raw[k];
    if (!Array.isArray(out.activity)) out.activity = [];
    return out;
  } catch { return emptySidecar(); }
}

const clone = value => JSON.parse(JSON.stringify(value));

export function createCodexAdapter({ S, E, codex }) {
  const {
    days, courses, courseOutline, studyLessons, sessionQA, passCount, assessmentVersion, topicLessons, getTopic,
    lessonDiagrams, videosForDay, passedAssessment, defaultPreferences, START_DATE
  } = codex;

  const sourceCourse = { java: 'Java Backend', design: 'System Design', dsa: 'DSA + System Design', genai: 'AI Engineering' };
  const blockPractice = block => block.id !== 'dsa' && block.id !== 'revision';
  const mainIdOf = day => day.topics[0].toLowerCase();
  const laneIdOf = day => {
    if (!day.blocks.some(block => block.id === 'dsa')) return null;
    const d = day.topics.find(topic => /^D-/.test(topic) && topic.toLowerCase() !== mainIdOf(day));
    return d ? d.toLowerCase() : mainIdOf(day) + '.dsa';
  };
  const sessionId = n => 'S' + String(n).padStart(2, '0');
  const videoId = (n, id) => n + '~' + id;

  function sourceOf(outlineLesson, day) {
    if (outlineLesson.source === 'added') return { kind: 'added', note: 'Independently added to the GfG syllabus (course-outline.js addedSessions)' };
    if (sourceCourse[outlineLesson.source]) return { kind: 'gfg', course: courses[outlineLesson.source]?.title || sourceCourse[outlineLesson.source], ref: 'Day ' + day.number + ' mapping' };
    return { kind: 'added', note: (courses[outlineLesson.source]?.title || outlineLesson.source) + ' (not a GfG syllabus)' };
  }

  function diagramOf(n) {
    const d = lessonDiagrams?.[n];
    const first = d?.scenarios?.[0];
    return first ? { title: d.title, nodes: first.steps.map(step => step.label) } : null;
  }
  function diagramNotes(n) {
    const d = lessonDiagrams?.[n];
    if (!d?.scenarios?.length) return [];
    return [{ type: 'h', text: 'Diagram walkthrough · ' + d.title }, d.question ? { type: 'p', text: d.question } : null,
      ...d.scenarios.flatMap(s => [{ type: 'h4', text: s.label }, { type: 'ol', items: s.steps.map(step => step.label + ': ' + step.explanation) }])].filter(Boolean);
  }

  function typedNotes(n) {
    return (studyLessons[n]?.notes || []).map(block => block.type === 'h4' ? { type: 'h4', text: block.text } : block);
  }

  function packetNotes(topicId) {
    const packet = topicLessons[topicId];
    if (!packet) return [];
    const topic = getTopic(topicId);
    const out = [{ type: 'h', text: 'Topic packet · ' + (topic?.title || topicId) }, ...(packet.notes || []).map(text => ({ type: 'p', text }))];
    if (packet.check) {
      const [q, options, answer, why] = packet.check;
      out.push({ type: 'details', summary: 'Concept check: ' + q, text: options.map((o, i) => String.fromCharCode(65 + i) + '. ' + o).join('\n') + '\n\nAnswer: ' + String.fromCharCode(65 + answer) + '. ' + options[answer] + (why ? '\n' + why : '') });
    }
    if (packet.references?.length) out.push({ type: 'links', items: packet.references.map(([title, url]) => ({ title, url })) });
    return out;
  }

  function blockGuide(block) {
    const out = [{ type: 'h', text: block.title + ' · ' + (block.kind || '') + ' · ' + block.minutes + ' min' }];
    if (block.concept) out.push({ type: 'p', text: block.concept });
    if (block.example) out.push({ type: 'callout', tone: 'tip', text: 'Example: ' + block.example });
    if (block.readings?.length) out.push({ type: 'links', items: block.readings.map(r => ({ title: r.title, url: r.url })) });
    return out;
  }

  function practiceOf(lessonId, block, n) {
    const qa = sessionQA[n];
    return {
      id: lessonId + '.' + block.id, block: block.id, day: n, title: block.title, platform: block.kind, minutes: block.minutes,
      prompt: block.practice || '', acceptance: block.checks || (block.id === 'practice' ? [qa.test] : []),
      evidenceRequired: block.id === 'review'
    };
  }

  function readingsOf(n, blocks, topicIds) {
    const seen = new Set(), out = [];
    const push = (title, url) => { if (!url || seen.has(url)) return; seen.add(url); out.push({ id: n + '~read~' + out.length, title, url, source: 'Reading', kind: 'article' }); };
    blocks.forEach(block => (block.readings || []).forEach(r => push(r.title, r.url)));
    topicIds.forEach(id => (topicLessons[id]?.references || []).forEach(([title, url]) => push(title, url)));
    return out;
  }

  function buildLessons(day) {
    const n = day.number, mainId = mainIdOf(day), laneId = laneIdOf(day), qa = sessionQA[n];
    const topicIds = day.topics.filter(t => !t.startsWith('LAB-')).map(t => t.toLowerCase());
    const mainBlocks = day.blocks.filter(blockPractice);
    const laneBlocks = day.blocks.filter(block => block.id === 'dsa');
    const packetIds = topicIds.filter(id => topicLessons[id] && id !== laneId);
    const videos = videosForDay(n).map(v => ({ id: videoId(n, v.id), codexId: v.id, title: v.title, source: v.platform || 'Video', channel: v.teacher,
      url: v.url, suggestedWatchMin: v.minutes, segment: v.focus, kind: 'video' }));
    const interview = qa.questions.map((prompt, i) => ({ id: mainId + '-iq' + (i + 1), prompt, answer: qa.answers?.[i] || '' }));
    packetIds.forEach(id => (topicLessons[id].interview || []).forEach(([prompt, answer], i) => interview.push({ id: id + '-tq' + (i + 1), prompt, answer, topicId: id })));
    const takeaways = packetIds.flatMap(id => (topicLessons[id].takeaways || []).map(text => ({ topicId: id, text })));
    const packetPractice = packetIds.filter(id => topicLessons[id].practice).map(id => {
      const [prompt, acceptance] = topicLessons[id].practice;
      return { id: id + '.packet', block: null, day: n, title: 'Topic packet practice · ' + (getTopic(id)?.title || id), platform: 'Java', prompt, acceptance: acceptance || [], required: false };
    });
    const lessonCheck = studyLessons[n]?.objectives?.[0];
    const main = {
      // estMinutes 0: Codex block minutes are on the practice items (the engine adds both).
      id: mainId, title: day.title, estMinutes: 0, day: n,
      videos: [...videos, ...readingsOf(n, mainBlocks, packetIds)],
      diagram: diagramOf(n),
      notes: [
        ...(day.intro ? [{ type: 'callout', tone: 'info', text: day.intro }] : []),
        ...(lessonCheck ? [{ type: 'callout', tone: 'tip', text: 'Lesson goal: ' + lessonCheck }] : []),
        ...typedNotes(n), ...diagramNotes(n), ...mainBlocks.flatMap(blockGuide), ...packetIds.flatMap(packetNotes)
      ],
      revision: [...(studyLessons[n]?.revision || []), ...day.blocks.filter(b => b.recall && b.id !== 'revision').map(b => 'Recall: ' + b.recall)],
      practice: [...mainBlocks.map(block => practiceOf(mainId, block, n)), ...packetPractice,
        ...(qa.stretch ? [{ id: mainId + '.stretch', block: null, day: n, title: 'Stretch practice', platform: 'Java', prompt: qa.stretch, acceptance: [], required: false }] : [])],
      quiz: { passPct: Math.ceil(passCount(n) * 100 / qa.assessment.length), questions: qa.assessment.map((item, i) => ({ id: mainId + '-q' + (i + 1), q: item.question, options: item.choices, answer: item.answer, explanation: item.explanation })) },
      interview, takeaways,
      topics: topicIds.map(id => ({ id, title: getTopic(id)?.title || id, subject: getTopic(id)?.subject || '' })),
      coach: (studyLessons[n]?.coach || []).map(c => ({ id: mainId + '-coach-' + c.id, prompt: c.prompt, copyText: c.copyText, copyLabel: c.copyLabel }))
    };
    const lane = laneId ? {
      id: laneId, title: laneBlocks[0].title, estMinutes: 0, day: n, lane: true,
      source: { kind: 'gfg', course: courses.dsa.title, ref: 'Day ' + n + ' DSA block' },
      notes: laneBlocks.flatMap(blockGuide), revision: laneBlocks.filter(b => b.recall).map(b => 'Recall: ' + b.recall),
      practice: laneBlocks.map(block => practiceOf(laneId, block, n)), videos: readingsOf(n, laneBlocks, [])
    } : null;
    return { main, lane };
  }

  // ---- course ----
  const lessonsByDay = {}, byLesson = {}, byPractice = {}, byVideo = {}, byQuestion = {};
  days.forEach(day => { lessonsByDay[day.number] = buildLessons(day); });
  const dayOfTrack = {};
  const subjects = courseOutline.tracks.map(track => ({
    id: track.id, title: track.title, short: track.title,
    modules: track.modules.map(m => ({ id: track.id + '-' + m.id, title: m.title, lessons: m.lessons.map(ol => {
      const day = days.find(d => mainIdOf(d) === ol.id);
      dayOfTrack[day.number] = track.id;
      return { ...lessonsByDay[day.number].main, source: sourceOf(ol, day), sourceRefs: ol.sourceRefs };
    }) }))
  }));
  const laneLessons = days.map(d => lessonsByDay[d.number].lane).filter(Boolean);
  subjects.push({ id: 'dsa-lane', title: 'DSA in Java · daily 30-minute lane', short: 'DSA lane', dsa: true, daily: true,
    modules: [{ id: 'dsa-lane-1', title: 'Daily DSA practice', lessons: laneLessons }] });
  const course = {
    title: 'Study Desk', subtitle: 'Java Backend & AI · real curriculum (Codex)',
    schedule: { startDate: START_DATE, sessionStart: '21:00', dayCutoff: '04:00', minMinutes: 30, maxMinutes: 960,
      core: { revision: 12, lesson: 78, dsa: 30 }, dailyMinutes: { 0: 390, 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 390 },
      testPassPct: 70, subjectOrder: 'free', dsaRequired: false },
    subjects,
    sessions: days.map(day => ({ id: sessionId(day.number), subject: dayOfTrack[day.number], lessons: [mainIdOf(day)],
      dsa: lessonsByDay[day.number].lane ? [lessonsByDay[day.number].lane.id] : [] }))
  };
  subjects.forEach(s => s.modules.forEach(m => m.lessons.forEach(l => {
    byLesson[l.id] = l;
    (l.practice || []).forEach(p => { byPractice[p.id] = { practice: p, lesson: l }; });
    (l.videos || []).forEach(v => { byVideo[v.id] = { video: v, lesson: l }; });
    (l.interview || []).forEach(q => { byQuestion[q.id] = l; });
  })));

  // ---- progress (derived) ----
  function toProgress(state, side = emptySidecar()) {
    const p = S.normalize({});
    for (const day of days) {
      const n = day.number, { main, lane } = lessonsByDay[n], session = state.sessions[n];
      const checked = new Set(session?.checked || []);
      const dated = session?.completedOn || session?.startedOn || null;
      [main, lane].filter(Boolean).forEach(lesson => (lesson.practice || []).forEach(pr => {
        const extra = side.practice[pr.id] || {};
        const evidence = pr.block === 'review' ? (session?.evidence || '') : (extra.evidence || '');
        if (pr.block && checked.has(pr.block)) p.practice[pr.id] = { status: 'complete', evidence, completedOn: extra.completedOn || dated };
        else if (!pr.block && extra.status) p.practice[pr.id] = { status: extra.status, evidence, completedOn: extra.status === 'complete' ? extra.completedOn || null : null };
        else if (extra.status === 'in-progress' || evidence) p.practice[pr.id] = { status: 'in-progress', evidence, completedOn: null };
      }));
      if (session?.completedOn) p.lessons[main.id] = { status: 'complete', completedOn: session.completedOn };
      else if (session?.startedOn) p.lessons[main.id] = { status: 'in-progress', completedOn: null };
      if (lane && checked.has('dsa')) p.lessons[lane.id] = { status: 'complete', completedOn: side.practice[lane.id + '.dsa']?.completedOn || dated };
      const a = state.assessments[n];
      if (a) {
        const pct = Math.round(a.score * 100 / sessionQA[n].assessment.length), passed = passedAssessment(state, n);
        p.quizzes[main.id] = { score: pct, best: pct, passed, takenOn: a.lastAttempt, passedOn: passed ? a.lastAttempt : null, attempts: a.attempts, stale: a.stale, correct: a.correct };
      }
      for (const [vid, rec] of Object.entries(state.videoProgress[n] || {})) {
        const id = videoId(n, vid);
        if (byVideo[id]) p.watch[id] = { minutes: rec.minutes, watched: rec.watched, log: side.watchLog[id] || [] };
      }
      if (state.personalNotes[n]) p.notes[sessionId(n)] = state.personalNotes[n];
      if (checked.has('revision')) p.revisions[sessionId(n)] = { doneOn: side.revisions[sessionId(n)]?.doneOn || session?.startedOn || null };
    }
    const prefs = { ...defaultPreferences, ...(state.preferences || {}) };
    p.schedule.dailyMinutes = { 0: prefs.sundayMinutes, 1: prefs.weekdayMinutes, 2: prefs.weekdayMinutes, 3: prefs.weekdayMinutes, 4: prefs.weekdayMinutes, 5: prefs.weekdayMinutes, 6: prefs.saturdayMinutes };
    (state.unavailable || []).forEach(date => { p.schedule.unavailable[date] = true; });
    p.takeaways = { ...(state.topicTakeaways || {}) };
    p.interview = clone(side.interview || {});
    p.challenges = clone(side.challenges || {});
    p.prefs = { notifications: { ...(side.notifications || {}), email: prefs.emailReminders === true } };
    p.activity = clone(side.activity || []);
    if (side.lastActiveAt) p.lastActiveAt = side.lastActiveAt;
    return p;
  }

  const fail = reason => ({ ok: false, reason });
  const nextDayNumber = state => days.find(day => !state.sessions[day.number]?.completedOn)?.number;
  const begin = (state, n) => state.sessions[n] ? [] : [{ kind: 'begin', day: n }];

  function quizLock(lessonId, state) {
    const lesson = byLesson[lessonId];
    if (!lesson || lesson.lane) return null;
    const n = lesson.day, session = state.sessions[n];
    if (!session) return nextDayNumber(state) === n ? 'Start this study day, finish every block and save the review evidence to unlock the self-check.' : 'Finish the current study day first.';
    const left = days[n - 1].blocks.filter(b => !session.checked.includes(b.id)).map(b => b.title);
    if (left.length || !session.evidence.trim()) return 'Unlocks after every block is done and the review evidence is saved' + (left.length ? ' (still open: ' + left.join('; ') + ')' : '') + '.';
    return null;
  }

  // v2 change -> Codex actions (+ sidecar patch). Codex rules are enforced when the actions are applied.
  function translate(change, state, sideIn) {
    const side = clone(sideIn || emptySidecar()), date = change.date;
    switch (change.type) {
      case 'lesson': {
        const lesson = byLesson[change.id]; if (!lesson) return fail('Unknown lesson ' + change.id);
        const n = lesson.day, session = state.sessions[n];
        if (lesson.lane) {
          if (change.status === 'complete') return (session?.checked || []).includes('dsa') ? { actions: [], side } : fail('Finish practice: ' + lesson.practice[0].title);
          return { actions: (session?.checked || []).includes('dsa') ? [{ kind: 'block', day: n, id: 'dsa', done: false }] : [], side };
        }
        if (change.status === 'complete') return { actions: [...begin(state, n), { kind: 'finish', day: n }], side };
        if (session?.completedOn) return { actions: [{ kind: 'reopen', day: n }], side };
        return { actions: begin(state, n), side };
      }
      case 'practice': {
        const entry = byPractice[change.id]; if (!entry) return fail('Unknown practice ' + change.id);
        const pr = entry.practice, n = pr.day, session = state.sessions[n], actions = [];
        const evidence = change.evidence != null ? String(change.evidence) : null;
        if (!pr.block) {
          side.practice[pr.id] = { ...(side.practice[pr.id] || {}), status: change.status || side.practice[pr.id]?.status || 'in-progress', evidence: evidence ?? side.practice[pr.id]?.evidence ?? '', completedOn: change.status === 'complete' ? date : null };
          return { actions, side };
        }
        actions.push(...begin(state, n));
        if (pr.block === 'review') {
          if (evidence != null && evidence.trim() !== (session?.evidence || '')) actions.push({ kind: 'evidence', day: n, evidence, notes: session?.notes || '' });
          if (change.status === 'complete' && !(evidence ?? session?.evidence ?? '').trim()) return fail('Add assignment evidence (link or summary) before marking complete');
        } else if (evidence != null) side.practice[pr.id] = { ...(side.practice[pr.id] || {}), evidence };
        const isChecked = (session?.checked || []).includes(pr.block);
        if (change.status === 'complete' && !isChecked) { actions.push({ kind: 'block', day: n, id: pr.block, done: true }); side.practice[pr.id] = { ...(side.practice[pr.id] || {}), completedOn: date }; }
        if (change.status && change.status !== 'complete' && isChecked) actions.push({ kind: 'block', day: n, id: pr.block, done: false });
        if (change.status) side.practice[pr.id] = { ...(side.practice[pr.id] || {}), status: change.status === 'complete' ? undefined : change.status };
        return { actions, side };
      }
      case 'quiz': {
        const lesson = byLesson[change.id]; if (!lesson?.quiz) return fail('No quiz for ' + change.id);
        const choices = lesson.quiz.questions.map(q => change.answers?.[q.id]);
        if (choices.some(c => c == null)) return fail('Answer every question before checking.');
        const right = lesson.quiz.questions.filter((q, i) => q.answer === choices[i]).length, total = choices.length, pct = Math.round(right * 100 / total);
        return { actions: [{ kind: 'assessment', day: lesson.day, choices, bankVersion: assessmentVersion }], side,
          result: { right, total, pct, passPct: lesson.quiz.passPct, passed: right >= passCount(lesson.day) } };
      }
      case 'watch': {
        const entry = byVideo[change.id]; if (!entry || entry.video.kind === 'article') return fail('Unknown video ' + change.id);
        const m = Math.max(0, Math.round(+change.minutes || 0)); if (!m) return fail('Enter minutes watched');
        const n = entry.lesson.day, old = state.videoProgress[n]?.[entry.video.codexId]?.minutes || 0, total = Math.min(600, old + m);
        if (old + m > 600) return fail('Codex progress stores at most 600 minutes per video');
        (side.watchLog[change.id] = side.watchLog[change.id] || []).push({ date, minutes: m });
        return { actions: [{ kind: 'watch', day: n, id: entry.video.codexId, minutes: total, watched: total >= (entry.video.suggestedWatchMin || 1) }], side };
      }
      case 'note': {
        const m = /^S(\d+)$/.exec(change.key || ''); if (!m || !days[+m[1] - 1]) return fail('Notes are saved per session');
        return { actions: [{ kind: 'notes', day: +m[1], text: String(change.text || '') }], side };
      }
      case 'takeaway':
        return { actions: [{ kind: 'topicTakeaway', topicId: change.topicId, text: String(change.text || ''), base: String(change.base ?? state.topicTakeaways?.[change.topicId] ?? '') }], side };
      case 'revision': {
        const m = /^S(\d+)$/.exec(change.id || ''); if (!m) return fail('Unknown revision ' + change.id);
        const n = +m[1], session = state.sessions[n];
        if (!days[n - 1].blocks.some(b => b.id === 'revision')) return fail('This session has no revision block');
        const isChecked = (session?.checked || []).includes('revision');
        if (change.done) side.revisions[change.id] = { doneOn: date }; else delete side.revisions[change.id];
        return { actions: [...begin(state, n), ...(change.done && !isChecked ? [{ kind: 'block', day: n, id: 'revision', done: true }] : !change.done && isChecked ? [{ kind: 'block', day: n, id: 'revision', done: false }] : [])], side };
      }
      case 'interview': {
        if (!byQuestion[change.id]) return fail('Unknown interview question ' + change.id);
        if (change.answered === false) delete side.interview[change.id]; else side.interview[change.id] = { lessonId: change.lessonId, answeredOn: date };
        return { actions: [], side };
      }
      case 'challenge':
        if (change.done === false) delete side.challenges[change.id]; else side.challenges[change.id] = { doneOn: date, kind: change.kind || null, title: change.title || null };
        return { actions: [], side };
      case 'prefs': {
        const merged = { ...(side.notifications || {}), ...(change.notifications || {}) };
        side.notifications = merged;
        const prefs = { ...defaultPreferences, ...(state.preferences || {}) };
        const email = merged.email === true;
        return { actions: email !== (prefs.emailReminders === true) ? [{ kind: 'preferences', weekdayMinutes: prefs.weekdayMinutes, saturdayMinutes: prefs.saturdayMinutes, sundayMinutes: prefs.sundayMinutes, emailReminders: email }] : [], side };
      }
      case 'unavailable':
        return { actions: [{ kind: 'availability', date: change.date, unavailable: !!change.value }], side };
      case 'minutes': {
        if (change.weekday == null || change.weekday === '') return fail('Per-date minutes are not stored in Codex progress yet. Mark the date unavailable, or change the weekday default.');
        const wd = +change.weekday, mm = change.minutes == null || change.minutes === '' ? null : Math.round(+change.minutes);
        const prefs = { ...defaultPreferences, ...(state.preferences || {}) }, next = { weekdayMinutes: prefs.weekdayMinutes, saturdayMinutes: prefs.saturdayMinutes, sundayMinutes: prefs.sundayMinutes, emailReminders: prefs.emailReminders === true };
        const key = wd === 0 ? 'sundayMinutes' : wd === 6 ? 'saturdayMinutes' : 'weekdayMinutes';
        next[key] = mm == null ? defaultPreferences[key] : mm;
        return { actions: [{ kind: 'preferences', ...next }], side };
      }
      default: return fail('Unknown change ' + change.type);
    }
  }

  return { course, toProgress, translate, quizLock, lessonsByDay, sessionId, mainIdOf, laneIdOf };
}

// Browser host: Codex persistence (local storage or StudySync account) + the UI sidecar.
export function createCodexHost({ S, E, adapter, codex, storage, sync = null, today = () => codex.todayInIndia(), onError = () => {} }) {
  let state, side = readSidecar(storage), queue = Promise.resolve(), backup = null;
  const readLocal = () => codex.readProgress(storage);
  try { state = sync?.current ? sync.current.state : readLocal(); }
  catch (error) { state = codex.emptyProgress(); backup = storage.getItem(codex.storageKey); onError('Saved progress could not be read; it was left untouched in storage.'); }
  const writeSide = () => { try { storage.setItem(SIDECAR_KEY, JSON.stringify(side)); } catch {} };

  async function persist(actions) {
    if (sync?.account) {
      for (const action of actions) state = (await sync.save(action)).state;
      return;
    }
    const current = readLocal();
    for (const action of actions) codex.applyStudyAction(current, action, today());
    storage.setItem(codex.storageKey, JSON.stringify(current));
    state = current;
  }

  function change(ch) {
    const run = async () => {
      ch = { ...ch, date: today() };
      const before = adapter.toProgress(state, side);
      if (ch.type === 'challenge' || ch.type === 'prefs') {
        const v = E.applyChange(adapter.course, before, ch, ch.at);
        if (!v.ok) return v;
        if (ch.type === 'challenge') ch = { ...ch, kind: v.progress.challenges[ch.id]?.kind, title: v.progress.challenges[ch.id]?.title };
      }
      const t = adapter.translate(ch, state, side);
      if (t.ok === false) return t;
      // Dry run on a copy first so a refused action leaves storage, account and sidecar untouched.
      if (!sync?.account) {
        try { const probe = clone(state); for (const action of t.actions) codex.applyStudyAction(probe, action, today()); }
        catch (error) { return { ok: false, reason: error.message }; }
      }
      try { await persist(t.actions); }
      catch (error) { if (sync?.current) state = sync.current.state; return { ok: false, reason: error.message }; }
      side = t.side;
      const after = E.recordActivity(adapter.course, before, adapter.toProgress(state, side), ch, ch.at);
      side.activity = after.activity; side.lastActiveAt = after.lastActiveAt || side.lastActiveAt;
      writeSide();
      return { ok: true, result: t.result };
    };
    const p = queue.then(run, run);
    queue = p.catch(() => {});
    return p;
  }

  return {
    change,
    progress: () => adapter.toProgress(state, side),
    state: () => state,
    sidecar: () => side,
    quizLock: id => adapter.quizLock(id, state),
    reload() { try { state = sync?.current ? sync.current.state : readLocal(); } catch {} side = readSidecar(storage); },
    adopt(next) { state = next; },
    backup: () => backup
  };
}
