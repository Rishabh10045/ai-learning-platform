import { days, courses, phases, tracks, dayTracks, START_DATE } from './curriculum.js';
import { lessonContent } from './lesson-content.js';
import { lessonDetails } from './lesson-details.js';
import { diagramForDay, comparisonForDay, element as el } from './lesson-visuals.js';
import { studyCurriculum, studyLessons } from './study-data.js';
import { plan } from './syllabus.js';
import {
  assignedVideos, checkpoint, completeCount, emptyProgress, nextDay, passedAssessment, readinessScore,
  readProgress, revisionRecalls, statusFor, storageKey, todayInIndia, totalWatchMinutes
} from './progress.js';
import { applyStudyAction } from './study-actions.js';
import { StudySync, defaultSyncOrigin } from './study-sync.js';
import { getTopic, takeawayLimit, topicIndex } from './topic-index.js';
import { topicLessons } from './topic-lessons.js';
import {
  accountCard, assessmentPanel, dashboardPanels, interviewBank, planAgenda, practiceAudit, subjectPageContent
} from './study-panels.js';

const root = document.querySelector('#app');
const notice = document.querySelector('#notice');
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
});
const diagramPositions = new Map();
const reviewPositions = new Map();
const interviewPositions = new Map();
const sync = new StudySync();
const drafts = new Map();
const noteWrites = new Map();
const draftsKey = () => sync.account ?
  'study-desk.drafts:' + encodeURIComponent(sync.account.origin + ' ' + sync.account.email) : 'study-desk.drafts:local';

function storeDrafts() {
  try {
    if (drafts.size) sessionStorage.setItem(draftsKey(), JSON.stringify([...drafts]));
    else sessionStorage.removeItem(draftsKey());
  } catch {}
}

function loadDrafts() {
  drafts.clear();
  try {
    const saved = JSON.parse(sessionStorage.getItem(draftsKey()) || '[]');
    for (const [id, draft] of saved) {
      const known = typeof id === 'string' && id.startsWith('topic:') ? getTopic(id.slice(6)) : days[id - 1];
      if (known && typeof draft?.text === 'string' && typeof draft.base === 'string') drafts.set(id, draft);
    }
  } catch {}
}

loadDrafts();
let state = emptyProgress();
let storageWarning = '';
let desk;
let activeTrack = '';
let searchQuery = '';
let noticeTimer;

try {
  state = readProgress(window.localStorage);
} catch {
  storageWarning = 'Saved progress could not be loaded from this browser.';
}

const formatDate = date => dateFormat.format(new Date(date + 'T00:00:00Z'));
const link = (title, href) => el('a', { href }, title);
const external = (title, href) => el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, title);
const button = (title, action, attrs = {}) => {
  const node = el('button', { class: 'sd-btn', type: 'button', ...attrs }, title);
  if (action) node.addEventListener('click', action);
  return node;
};
const field = (label, input) => el('label', { class: 'study-field' }, label, input);
const panel = (title, ...children) => el('section', { class: 'sd-card study-card' }, el('h2', {}, title), ...children);
const section = (title, intro, ...children) => el('main', { class: 'study-page', tabindex: -1 },
  el('h1', {}, title), intro ? el('p', { class: 'sd-muted study-intro' }, intro) : null, ...children
);

function announce(message) {
  window.clearTimeout(noticeTimer);
  notice.textContent = message;
  noticeTimer = window.setTimeout(() => { notice.textContent = ''; }, 5000);
}

function localProgress() {
  return readProgress(window.localStorage);
}

function adopt(snapshot) {
  if (snapshot) state = snapshot.state;
}

async function persist(action) {
  if (sync.account) {
    try {
      adopt(await sync.save(action));
      storageWarning = '';
      return true;
    } catch (error) {
      adopt(sync.current);
      if (error.status === 0 || error.status === 401 || error.status === 409) storageWarning = error.message;
      throw error;
    }
  }
  let current = state;
  if (!storageWarning) {
    try {
      current = localProgress();
    } catch {
      storageWarning = 'Saved progress could not be read. Work in the current tab can continue.';
    }
  }
  applyStudyAction(current, action, todayInIndia());
  state = current;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    storageWarning = '';
    return true;
  } catch {
    storageWarning = 'Browser storage is unavailable. Progress is kept in this tab until it closes.';
    return false;
  }
}

async function act(action, message, refresh = true) {
  try {
    const saved = await persist(action);
    if (refresh) refreshView();
    if (storageWarning || message) announce(storageWarning || message);
    return saved;
  } catch (error) {
    announce(error.message);
    if (error.status === 409 && refresh) refreshView();
    return false;
  }
}

async function pullAccount({ show = false, refresh = true } = {}) {
  if (!sync.account) return;
  try {
    const previous = sync.current?.revision;
    adopt(await sync.pull());
    storageWarning = '';
    if (refresh && (show || previous !== sync.current?.revision)) refreshView();
    if (show) announce('Progress refreshed from the database.');
  } catch (error) {
    storageWarning = error.message;
    if (show || !sync.current) {
      renderRoute(false);
      announce(error.message);
    }
  }
}

function localHasProgress() {
  try {
    const local = localProgress();
    return Boolean(Object.keys(local.sessions).length || Object.keys(local.personalNotes).length ||
      Object.keys(local.topicTakeaways).length ||
      Object.keys(local.udemyLectures).length || Object.keys(local.videoProgress).length || local.unavailable.length ||
      Object.keys(local.planned).length);
  } catch {
    return false;
  }
}

function syncPanel() {
  return accountCard({
    sync, defaultOrigin: defaultSyncOrigin(), localHasProgress: localHasProgress(), storageWarning,
    login: async (origin, email, password) => {
      adopt(await sync.signIn(origin, email, password));
      loadDrafts();
      storageWarning = '';
      refreshView();
      announce('Study account connected.');
    },
    logout: async () => {
      storeDrafts();
      await sync.signOut();
      loadDrafts();
      try { state = localProgress(); } catch { state = emptyProgress(); }
      storageWarning = '';
      refreshView();
      announce('Signed out. Showing this browser’s local progress.');
    },
    pull: () => pullAccount({ show: true }),
    importLocal: async () => {
      try {
        adopt(await sync.importLocal(localProgress()));
        refreshView();
        announce('This browser’s progress was imported.');
      } catch (error) {
        adopt(sync.current);
        refreshView();
        announce(error.message);
      }
    }
  });
}

function sessionState(day, today) {
  const current = nextDay(state)?.number === day.number;
  const session = state.sessions[day.number];
  const unavailable = state.unavailable.includes(today);
  const available = today >= START_DATE && !unavailable;
  return { current, session, unavailable, available, editable: Boolean(current && session && available) };
}

function uiProgress() {
  const today = todayInIndia();
  const currentDay = nextDay(state)?.number;
  return {
    currentDay,
    days: Object.fromEntries(days.map(day => {
      const session = state.sessions[day.number];
      const paused = day.number === currentDay && state.unavailable.includes(today);
      const status = session?.completedOn ? 'complete' : session?.startedOn && !paused ? 'in-progress' : 'pending';
      const blocks = Object.fromEntries((session?.checked || []).map(id => [id, 'complete']));
      return [day.number, {
        status, blocks, practice: blocks,
        canEdit: day.number === currentDay && Boolean(session?.startedOn) && !paused && today >= START_DATE,
        notes: state.personalNotes[day.number] ?? session?.notes ?? ''
      }];
    }))
  };
}

function uiVideos() {
  return Object.fromEntries(days.map(day => [day.number, assignedVideos(state, day.number).map(video => ({
    id: video.id, title: video.title, source: video.platform, channel: video.teacher,
    url: video.url, note: video.focus, suggestedWatchMin: video.minutes, kind: 'video'
  }))]));
}

function refreshView() {
  if (!desk) return renderRoute(false);
  desk.update({ curriculum: scheduledCurriculum(), progress: uiProgress(), videos: uiVideos() });
  attachHostControls(desk.getRoute());
}

function handleProgress({ day, scope, id, status }) {
  if (!['block', 'practice'].includes(scope)) return;
  void act({ kind: 'block', day, id, done: status !== 'pending' }, '');
}

async function handleNote(day, notes) {
  const draft = drafts.get(day);
  if (draft?.conflict || (draft && draft.text !== notes)) return;
  const existing = state.personalNotes[day] ?? state.sessions[day]?.notes ?? '';
  if (existing === notes) {
    if (draft) {
      drafts.delete(day);
      storeDrafts();
    }
    return;
  }
  if (draft && sync.account && draft.base !== existing) {
    draft.conflict = true;
    storeDrafts();
    if (desk?.getRoute()?.view === 'my-notes') refreshView();
    throw new Error('Another browser changed this note. Compare the saved version with your draft.');
  }
  const pending = noteWrites.get(day);
  if (pending?.text === notes) return pending.promise;
  const promise = persist({ kind: 'notes', day, text: notes });
  noteWrites.set(day, { text: notes, promise });
  try {
    if (!await promise) throw new Error(storageWarning);
    const latest = drafts.get(day);
    if (latest?.text === notes) drafts.delete(day);
    else if (latest) latest.base = notes;
    storeDrafts();
    const route = desk?.getRoute();
    if (route && route.view !== 'my-notes') refreshView();
  } catch (error) {
    if (error.status === 409 && drafts.get(day)) {
      drafts.get(day).conflict = true;
      storeDrafts();
      if (desk?.getRoute()?.view === 'my-notes') refreshView();
    }
    announce(error.message);
    throw error;
  } finally {
    if (noteWrites.get(day)?.promise === promise) noteWrites.delete(day);
  }
}

function flushNotes() {
  const route = desk?.getRoute();
  if (route?.view !== 'my-notes') return;
  const draft = drafts.get(route.day);
  if (draft && !draft.conflict) handleNote(route.day, draft.text).catch(() => {});
}

function watchControls(day, video) {
  const stored = state.videoProgress[day]?.[video.id];
  const minutes = el('input', { name: 'minutes', type: 'number', min: 0, max: 600, step: 1, required: true,
    value: stored?.minutes ?? 0, 'aria-label': 'Minutes watched for ' + video.title });
  const watched = el('input', { name: 'watched', type: 'checkbox', checked: stored?.watched });
  const status = el('p', { class: 'sd-muted', role: 'status' }, stored ? 'Logged ' + stored.minutes + ' min' : '');
  const form = el('form', { class: 'study-form video-log', 'data-video-id': video.id },
    field('Minutes watched', minutes), el('label', { class: 'watch-label' }, watched, 'Finished'),
    button('Save watch log', null, { type: 'submit' }), status);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const saved = await persist({ kind: 'watch', day, id: video.id, minutes: Number(minutes.value), watched: watched.checked });
      status.textContent = saved ? 'Logged ' + minutes.value + ' min' : storageWarning;
    } catch (error) {
      status.textContent = error.message;
    }
  });
  return form;
}

function udemyPanel(day) {
  const title = el('input', { type: 'text', maxlength: 180, required: true });
  const url = el('input', { type: 'url', required: true });
  const minutes = el('input', { type: 'number', min: 1, max: 120, value: 10, required: true });
  const form = el('form', { class: 'study-form udemy-form' },
    field('Lecture title', title), field('Udemy course or lecture URL', url), field('Suggested watch minutes', minutes),
    button('Save Udemy link', null, { type: 'submit' }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    act({ kind: 'lecture', day, title: title.value, url: url.value, minutes: Number(minutes.value) },
      'Udemy lecture saved.');
  });
  return el('details', { class: 'sd-card study-details' }, el('summary', {}, 'Add a lecture from your Udemy account'), form);
}

function planStatus(day) {
  const today = todayInIndia();
  const { current, session, available, unavailable } = sessionState(day, today);
  let message;
  if (session?.completedOn) message = 'Completed ' + formatDate(session.completedOn) + '.';
  else if (current && unavailable) message = 'Unavailable today. Day ' + day.number + ' stays pending.';
  else if (current && !available) message = 'Study opens ' + formatDate(START_DATE) + '.';
  else if (current && session) message = 'Check a block when you can show its outcome.';
  else if (current) message = 'Begin this study day when you are ready.';
  else message = 'Preview this day. Complete the active day to unlock progress tracking.';
  return el('div', { class: 'sd-callout study-session-status' },
    el('div', {}, el('strong', {}, formatDate(today) + ' · IST'), el('p', {}, message),
      el('small', {}, sync.account ? 'Study account' : 'Progress on this browser')),
    el('div', { class: 'study-row' },
      current && available && !session ? button('Begin Day ' + day.number,
        () => act({ kind: 'begin', day: day.number }, 'Day ' + day.number + ' started.'),
        { class: 'sd-btn sd-btn-primary' }) : null,
      link('Test · ' + (passedAssessment(state, day.number) ? 'Passed' : readinessScore(state, day.number) === 100 && current && available ? 'Ready' : 'Locked'),
        '#day-' + day.number + '/assessment'),
      session?.completedOn && available ? button('Reopen Day ' + day.number,
        () => act({ kind: 'reopen', day: day.number }, 'Day ' + day.number + ' is in progress.')) : null,
      link('Manage availability', '#progress')
    )
  );
}

async function copyCheckpoint(day, panelNode) {
  const value = checkpoint(state, day, todayInIndia());
  try {
    await navigator.clipboard.writeText(value);
    announce('Checkpoint copied.');
  } catch {
    panelNode.querySelector('[data-copy-checkpoint]')?.remove();
    const field = el('textarea', { class: 'sd-textarea', readonly: true, rows: 7,
      'data-copy-checkpoint': true, 'aria-label': 'Checkpoint to copy' });
    field.value = value;
    panelNode.append(field);
    field.select();
    field.focus();
    announce('Checkpoint selected. Press Ctrl+C or Command+C.');
  }
}

function evidencePanel(day, view) {
  const { session, editable } = sessionState(day, todayInIndia());
  if (!session) return null;
  const evidence = el('textarea', { id: 'evidence-' + day.number, class: 'sd-textarea', maxlength: 6000, rows: 4,
    readonly: !editable, placeholder: 'Run output, a repository link or a short explanation' }, session.evidence);
  const notes = el('textarea', { id: 'session-notes-' + day.number, class: 'sd-textarea', maxlength: 8000, rows: 3,
    readonly: !editable, placeholder: 'What needs another pass?' }, session.notes);
  const status = el('p', { class: 'sd-muted', role: 'status' }, editable ? 'Save evidence before opening the test.' : '');
  const box = panel('Assignment evidence', field('What you ran or explained', evidence),
    field('Carry-forward topics', notes), status);
  const finish = button('Finish Day ' + day.number, () =>
    act({ kind: 'finish', day: day.number }, 'Day ' + day.number + ' completed.'),
    { class: 'sd-btn sd-btn-primary', id: 'finish-day' });
  const copy = button('Copy checkpoint', () => copyCheckpoint(day, box));
  const buttons = el('div', { class: 'study-row' }, copy);
  if (editable && view === 'plan') {
    const allChecked = day.blocks.every(block => session.checked.includes(block.id));
    const updateFinish = () => { finish.disabled = !allChecked || !evidence.value.trim() || !passedAssessment(state, day.number); };
    updateFinish();
    buttons.append(finish);
    box.append(el('p', { class: 'sd-muted' }, 'Complete every core block, save evidence and pass the test to finish.'));
    evidence.addEventListener('input', updateFinish);
  } else if (session.completedOn) {
    buttons.append(link('Open the next study day', '#today'));
  }
  if (editable) {
    const save = button('Save evidence', async () => {
      save.disabled = true;
      try {
        const saved = await persist({ kind: 'evidence', day: day.number, evidence: evidence.value, notes: notes.value });
        if (saved) refreshView();
        else status.textContent = storageWarning;
      } catch (error) {
        status.textContent = error.message;
      } finally {
        save.disabled = false;
      }
    });
    buttons.prepend(save);
  }
  box.append(buttons);
  return box;
}

function revisionExtras(day) {
  const recall = revisionRecalls(day);
  if (!recall.length) return null;
  const previous = days[day.number - 2];
  const revisits = [3, 7].map(distance => days[day.number - distance - 1])
    .filter(item => item && state.sessions[item.number]?.completedOn);
  const question = el('p', { class: 'sd-callout', 'aria-live': 'polite' });
  const box = panel('12-minute recall from Day ' + previous.number, question);
  const updateQuestion = () => {
    const index = reviewPositions.get(day.number) || 0;
    question.textContent = recall[index];
  };
  updateQuestion();
  if (recall.length > 1) {
    box.append(button('Next recall prompt', () => {
      reviewPositions.set(day.number, ((reviewPositions.get(day.number) || 0) + 1) % recall.length);
      updateQuestion();
    }));
  }
  if (revisits.length) box.append(el('p', {}, 'Spaced review ', revisits.map(item => link('Day ' + item.number + ' ', '#day-' + item.number + '/revision'))));
  return box;
}

function readingPanel(day) {
  const readings = day.blocks.flatMap(block => block.readings || []);
  if (lessonDetails[day.number]?.source) {
    const [title, url] = lessonDetails[day.number].source;
    if (!readings.some(item => item.url === url)) readings.push({ title, url });
  }
  return panel('Reference reading', el('ul', {}, readings.map(item => el('li', {}, external(item.title, item.url)))));
}

function topicLink(topic) {
  return link(topic.title, '#topic/' + topic.id);
}

function dayTopics(day) {
  return day.topics.map(id => getTopic(id.toLowerCase())).filter(Boolean);
}

function topicLinks(day) {
  return panel('Study by topic', el('ul', {}, dayTopics(day).map(topic => el('li', {}, topicLink(topic)))));
}

function takeawayForm(topic) {
  const key = 'topic:' + topic.id;
  const saved = state.topicTakeaways[topic.id] ?? '';
  const draft = drafts.get(key);
  const base = draft?.base ?? saved;
  const changed = base !== saved;
  const input = el('textarea', { id: 'topic-takeaway', rows: 5, maxlength: takeawayLimit });
  input.value = draft?.text ?? saved;
  const submit = button(changed ? 'Save my draft over the saved takeaway' : 'Save my takeaway', null, { type: 'submit' });
  const status = el('p', { role: 'status' });
  const form = el('form', { class: 'study-form evidence-form' },
    field('Explain this topic in your own words', input), submit, status);
  input.addEventListener('input', () => {
    drafts.set(key, { text: input.value, base: drafts.get(key)?.base ?? base });
    storeDrafts();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const text = input.value;
    const account = draftsKey();
    submit.disabled = true;
    try {
      const persisted = await persist({ kind: 'topicTakeaway', topicId: topic.id, text,
        base: changed ? saved : drafts.get(key)?.base ?? base });
      if (draftsKey() !== account) return;
      if (!persisted) {
        status.textContent = storageWarning;
        return;
      }
      const latest = drafts.get(key);
      if (latest?.text === text) drafts.delete(key);
      else if (latest) latest.base = text.trim();
      storeDrafts();
      if (location.hash === '#topic/' + topic.id) {
        renderRoute(false);
        announce(latest && latest.text !== text ? 'Takeaway saved. Your newer edit remains a draft.' : 'Takeaway saved.');
      }
    } catch (error) {
      if (draftsKey() !== account) return;
      if (!drafts.has(key)) drafts.set(key, { text, base });
      storeDrafts();
      if (location.hash === '#topic/' + topic.id && (error.status === 409 || saved !== (state.topicTakeaways[topic.id] ?? ''))) {
        renderRoute(false);
        announce(error.message);
      } else {
        status.textContent = error.message;
      }
    } finally {
      submit.disabled = false;
    }
  });
  return panel('My takeaways',
    el('p', {}, 'Write a rule you can recall, one mistake to avoid, and one example.'),
    changed ? el('details', { class: 'study-details', open: true },
      el('summary', {}, 'Your saved takeaway changed. Compare before replacing it.'),
      el('pre', { class: 'study-note-compare' }, saved || '(Empty)')) : null,
    form);
}

function topicMaterials(details) {
  const list = values => el('ul', {}, values.map(value => el('li', {}, value)));
  const [prompt, criteria] = details.practice;
  const content = [
    panel('Study notes', details.notes.map(note => el('p', {}, note))),
    panel('Practice', el('p', {}, prompt), list(criteria)),
    panel('Interview practice', details.interview.map(([question, answer]) =>
      el('details', { class: 'study-details' }, el('summary', {}, question), el('p', {}, answer)))),
    panel('Coach takeaways', list(details.takeaways)),
    panel('Reading', el('ul', {}, details.references.map(([title, url]) => el('li', {}, external(title, url)))))
  ];
  if (details.check) {
    const [question, options, answer, explanation] = details.check;
    const response = el('p', { role: 'status' });
    const form = el('form', { class: 'study-assessment topic-self-check' },
      el('fieldset', {}, el('legend', {}, question), options.map((option, index) => el('label', { class: 'assessment-option' },
        el('input', { type: 'radio', name: 'answer', value: index, required: true }), option))),
      button('Check answer', null, { type: 'submit' }), response);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const choice = new FormData(form).get('answer');
      if (choice !== null) response.textContent = (Number(choice) === answer ? 'Correct. ' : 'Try again. ') + explanation;
    });
    content.splice(2, 0, panel('Concept check', form));
  }
  return content;
}

function topicPage(topic) {
  const details = topicLessons[topic.id];
  return section(topic.title, topic.subject + ' · Day ' + topic.day,
    el('nav', { class: 'study-row', 'aria-label': 'Topic navigation' }, link('All topics', '#topics'),
      link('Open Day ' + topic.day + ' lesson', '#day-' + topic.day + '/learn')),
    details ? topicMaterials(details) : panel('Study materials',
      el('p', {}, 'This topic is indexed under Day ' + topic.day + '. Its dedicated notes and questions are still being written.')),
    takeawayForm(topic));
}

function topicsPage() {
  const groups = Map.groupBy(topicIndex, topic => topic.subject);
  const search = el('input', { type: 'search' });
  const results = el('div');
  const order = ['Java', 'SQL and data', 'Spring Boot & backend', 'Low-level design', 'System design', 'AI engineering', 'DSA in Java'];
  function renderTopics() {
    const query = search.value.trim().toLowerCase();
    const matches = order.flatMap(subject => {
      const topics = (groups.get(subject) || []).filter(topic =>
        (topic.title + ' ' + topic.id + ' ' + subject).toLowerCase().includes(query));
      return topics.length ? [panel(subject, el('ul', {}, topics.map(topic => el('li', {},
        topicLink(topic), ' · Day ' + topic.day + (topicLessons[topic.id] ? ' · Topic materials' : ' · Session materials')))))] : [];
    });
    results.replaceChildren(...(matches.length ? matches : [el('p', { role: 'status' }, 'No indexed topics match this search.')]));
  }
  search.addEventListener('input', renderTopics);
  renderTopics();
  return section('Course topic index', 'Open a topic to study its materials and save your own takeaways.',
    field('Search topics', search), results);
}

function coachActions(day) {
  const entries = studyLessons[day.number].coach;
  const buttons = el('div', { class: 'study-row' }, entries.map(item => button(item.copyLabel,
    async event => {
      const parent = event.target.closest('section');
      try {
        await navigator.clipboard.writeText(item.copyText);
        announce('Coach prompt copied.');
      } catch {
        parent.querySelector('[data-copy-prompt]')?.remove();
        const field = el('textarea', { class: 'sd-textarea', readonly: true, rows: 7, 'data-copy-prompt': true,
          'aria-label': 'Coach prompt to copy' }, item.copyText);
        parent.append(field);
        field.focus();
        field.select();
      }
    })));
  return panel('Copy a coaching prompt', buttons);
}

function attachHostControls(route) {
  const day = days[route.day - 1];
  const section = root.querySelector('.sd-panel');
  if (!day || !section) return;
  section.querySelectorAll('[data-host-controls]').forEach(item => item.remove());
  const beginning = el('div', { 'data-host-controls': true });
  const end = el('div', { 'data-host-controls': true });
  const beforeNotes = el('div', { 'data-host-controls': true });

  if (route.view === 'plan') {
    beginning.append(planStatus(day));
    end.append(planAgenda(day, state, act));
  }
  if (route.view === 'plan' || route.view === 'practice') {
    const editable = sessionState(day, todayInIndia()).editable;
    for (const [index, control] of Array.from(section.querySelectorAll('.sd-stbtn')).entries()) {
      const block = route.view === 'plan' ? day.blocks[index] : studyLessons[day.number].practice[index];
      if (!block) continue;
      const done = state.sessions[day.number]?.checked.includes(block.id);
      control.id = (route.view === 'plan' ? 'block-' : 'practice-') + block.id;
      control.disabled = !editable;
      control.setAttribute('aria-label', (done ? 'Uncheck ' : 'Complete ') + block.title);
    }
    if (route.view === 'practice') end.append(practiceAudit(day));
    const evidence = evidencePanel(day, route.view);
    if (evidence) end.append(evidence);
  }

  if (route.view === 'learn') {
    const videos = uiVideos()[day.number];
    for (const [index, card] of Array.from(section.querySelectorAll('.sd-video')).entries()) {
      if (videos[index]) card.append(el('div', { 'data-host-controls': true }, watchControls(day.number, videos[index])));
    }
    const diagram = diagramForDay(day.number, diagramPositions);
    beforeNotes.append(udemyPanel(day.number));
    if (diagram) beforeNotes.append(diagram);
    const grid = section.querySelector('.sd-videos');
    if (grid) grid.after(beforeNotes);
    else section.prepend(beforeNotes);
    const comparison = comparisonForDay(day.number);
    if (comparison) end.append(comparison);
    end.append(readingPanel(day), topicLinks(day));
  }
  if (route.view === 'revision') {
    const revision = revisionExtras(day);
    if (revision) end.append(revision);
    const takeaways = dayTopics(day).filter(topic => state.topicTakeaways[topic.id]);
    if (takeaways.length) beginning.append(panel('My topic takeaways', takeaways.map(topic =>
      el('details', { class: 'study-details' }, el('summary', {}, topic.title),
        el('pre', { class: 'study-note-compare' }, state.topicTakeaways[topic.id])))));
  }
  if (route.view === 'my-notes') {
    const input = section.querySelector('textarea');
    if (input) input.maxLength = 10000;
    const draft = drafts.get(day.number);
    if (input && draft) {
      input.value = draft.text;
      if (sync.account && draft.base !== (state.personalNotes[day.number] ?? state.sessions[day.number]?.notes ?? '')) {
        draft.conflict = true;
        storeDrafts();
      }
    }
    if (draft?.conflict && input) {
      const draftAction = button('Save my draft over the account note', async () => {
        draft.conflict = false;
        draft.base = state.personalNotes[day.number] ?? state.sessions[day.number]?.notes ?? '';
        storeDrafts();
        try { await handleNote(day.number, input.value); }
        catch {}
        refreshView();
      });
      const saved = state.personalNotes[day.number] ?? state.sessions[day.number]?.notes ?? '';
      end.append(panel('Compare notes from both browsers',
        el('p', {}, 'Your draft remains in the editor. The latest saved account note is shown below.'),
        el('pre', { class: 'study-note-compare' }, saved || '(Empty)'), draftAction));
    }
    end.append(topicLinks(day));
  }
  if (route.view === 'coach') end.append(coachActions(day), interviewBank(day, interviewPositions),
    el('details', { class: 'sd-card study-details' }, el('summary', {}, 'Changed scenario after your first attempt'),
      el('p', {}, lessonContent[day.number].variation)));
  if (beginning.childElementCount) section.prepend(beginning);
  if (end.childElementCount) section.append(end);
}

function dayList(items, empty) {
  if (!items.length) return el('p', { class: 'sd-muted' }, empty);
  const pausedDay = state.unavailable.includes(todayInIndia()) ? nextDay(state)?.number : null;
  return el('ol', { class: 'study-day-list' }, items.map(day => {
    const status = day.number === pausedDay ? 'Pending' : statusFor(state, day);
    return el('li', {}, link('Day ' + day.number + ' · ' + day.title, '#day-' + day.number),
      el('span', { class: 'sd-muted' }, status));
  }));
}

function progressPage() {
  const today = todayInIndia();
  const date = el('input', { type: 'date', min: START_DATE, value: today < START_DATE ? START_DATE : today, required: true });
  const form = el('form', { class: 'study-form study-row' }, field('Unavailable date', date),
    button('Mark unavailable', null, { type: 'submit', class: 'sd-btn sd-btn-primary' }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    act({ kind: 'availability', date: date.value, unavailable: true }, formatDate(date.value) + ' marked unavailable.');
  });
  const unavailable = state.unavailable.map(day => el('li', { class: 'study-row' }, formatDate(day), button('Clear ' + formatDate(day),
    () => act({ kind: 'availability', date: day, unavailable: false }, 'Unavailable date cleared.'))));
  const availability = panel('Availability', el('p', {}, 'A date you miss keeps your current study day pending and preserves its work.'),
    form, unavailable.length ? el('ul', { class: 'study-availability-list' }, unavailable) : null);
  const started = days.filter(day => state.sessions[day.number]?.startedOn).reverse();
  const current = nextDay(state);
  const summary = completeCount(state) + ' of ' + days.length + ' study days completed · ' +
    totalWatchMinutes(state) + ' video minutes logged in this browser.';
  const standby = state.unavailable.includes(today) && current ?
    el('p', { class: 'sd-callout' }, 'Today is unavailable. Day ' + current.number + ' stays pending.') : null;
  return section('Study progress', summary, syncPanel(), standby, availability,
    dashboardPanels(state, { save: act, signedIn: Boolean(sync.account), remindersConfigured: sync.current?.remindersConfigured }),
    panel('Study history', dayList(started, 'Your history starts when you begin Day 1.')));
}

function roadmapPage() {
  const results = el('div', { class: 'study-roadmap-results' });
  const search = el('input', { type: 'search', value: searchQuery, placeholder: 'Topic, subtopic or study day' });
  const filter = el('select', {}, el('option', { value: '' }, 'All tracks'),
    Object.entries(tracks).map(([id, title]) => el('option', { value: id }, title)));
  filter.value = activeTrack;
  function renderResults() {
    const query = searchQuery.trim().toLowerCase();
    const groups = phases.map(phase => {
      const items = days.filter(day => day.number >= phase.from && day.number <= phase.to &&
        (!activeTrack || dayTracks(day).includes(activeTrack)) &&
        (!query || ['Day ' + day.number, day.title, ...day.topics,
          ...lessonContent[day.number].sections.map(([title]) => title),
          lessonDetails[day.number]?.section?.[0] || ''].join(' ').toLowerCase().includes(query)));
      return items.length ? panel(phase.title, el('p', { class: 'sd-muted' }, phase.description), dayList(items)) : null;
    }).filter(Boolean);
    results.replaceChildren(...(groups.length ? groups : [el('p', {}, 'No study days match this search.')]));
  }
  search.addEventListener('input', () => { searchQuery = search.value; renderResults(); });
  filter.addEventListener('change', () => { activeTrack = filter.value; renderResults(); });
  renderResults();
  return section('Course roadmap', plan.description,
    el('div', { class: 'study-form study-row study-filters' }, field('Search the syllabus', search), field('Track', filter)), results);
}

function sourcesPage() {
  const mapping = plan.sourceNotes.map(item => el('section', { class: 'study-source-mapping' },
    el('h3', {}, item.title), el('p', {}, item.coverage), el('p', {}, item.adaptation)));
  return section('Curriculum sources', plan.scope,
    panel('Syllabus mapping', mapping, el('h3', {}, 'Prerequisites and additional depth'),
      el('ul', {}, plan.additions.map(item => el('li', {}, item)))),
    el('div', { class: 'study-source-grid' }, Object.values(courses).map(source =>
      panel(source.title, el('p', {}, source.sections), el('p', {}, source.context),
        el('ul', {}, source.links.map(([title, url]) => el('li', {}, external(title, url)))))))
  );
}

function subjectPage() {
  return section('Subjects', 'Browse the curriculum by subject. Use Today to follow your study sequence.',
    link('Browse the full topic index', '#topics'),
    el('div', { class: 'study-source-grid subject-grid' }, subjectPageContent(state)));
}

function scheduledCurriculum() {
  const today = todayInIndia();
  const nextByDay = {};
  for (const [date, number] of Object.entries(state.planned).sort(([a], [b]) => a.localeCompare(b))) {
    if (date >= today && !state.unavailable.includes(date)) nextByDay[number] ??= date;
  }
  return { ...studyCurriculum, sessionStart: '21:00', sessionEnd: '23:00',
    days: studyCurriculum.days.map(day => ({ ...day,
      date: nextByDay[day.day] || state.sessions[day.day]?.startedOn || undefined })) };
}

function openDesk(route) {
  root.dataset.studyReal = 'true';
  if (desk) {
    desk.update({ curriculum: scheduledCurriculum(), progress: uiProgress(), videos: uiVideos() });
    desk.navigate(route.day, route.view);
  } else {
    desk = window.StudyDesk.mount(root, {
      curriculum: scheduledCurriculum(), lessons: studyLessons, videos: uiVideos(), progress: uiProgress(),
      routing: false, initialDay: route.day, initialView: route.view,
      onProgressChange: handleProgress, onNoteChange: handleNote
    });
  }
  attachHostControls(route);
}

function renderRoute(focus = true) {
  flushNotes();
  const hash = location.hash;
  if (hash === '#app') return;
  const pages = {
    '#roadmap': roadmapPage, '#subjects': subjectPage, '#progress': progressPage, '#sources': sourcesPage, '#topics': topicsPage
  };
  const testMatch = /^#day-(\d+)\/assessment$/.exec(hash);
  const topicMatch = /^#topic\/(.+)$/.exec(hash);
  const testDay = testMatch && days[Number(testMatch[1]) - 1];
  const topic = topicMatch && getTopic(topicMatch[1]);
  const page = Object.hasOwn(pages, hash) ? pages[hash] : topicMatch ? () => topic ? topicPage(topic) :
    section('Topic not found', '', link('Browse the topic index', '#topics')) : null;
  for (const item of document.querySelectorAll('[data-nav]')) {
    if (item.dataset.nav === (page ? hash.slice(1) : 'today')) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
  const waiting = Boolean(sync.account && !sync.current);
  const current = nextDay(state);
  const route = window.StudyDesk.parseHash(hash) || (current && { day: current.number, view: 'plan' });
  if (!page && !testDay && route && !waiting) {
    openDesk(route);
    if (focus) root.querySelector('main')?.focus({ preventScroll: true });
  } else {
    desk?.destroy();
    desk = undefined;
    delete root.dataset.studyReal;
    root.classList.add('sd-root');
    const screen = waiting ? section('Account progress', 'Complete the account refresh to view your data.', syncPanel())
      : testDay ? section('Session assessment', testDay.title, assessmentPanel(testDay, state, act))
      : page ? page() : section('Roadmap complete', 'Open Progress to revisit your evidence and checkpoints.',
        link('View study progress', '#progress'));
    root.replaceChildren(screen);
    document.title = root.querySelector('h1').textContent + ' · Study Desk';
    if (focus) root.querySelector('main').focus({ preventScroll: true });
  }
  if (focus) window.scrollTo(0, 0);
}

root.addEventListener('input', event => {
  const route = desk?.getRoute();
  if (route?.view === 'my-notes' && event.target.matches('.sd-view-my-notes textarea')) {
    const previous = drafts.get(route.day);
    drafts.set(route.day, { text: event.target.value.slice(0, 10000), conflict: previous?.conflict,
      base: previous?.base ?? state.personalNotes[route.day] ?? state.sessions[route.day]?.notes ?? '' });
    storeDrafts();
  }
});

document.querySelector('.site-skip').addEventListener('click', event => {
  event.preventDefault();
  (root.querySelector('main') || root).focus();
});
window.addEventListener('hashchange', () => renderRoute());
window.addEventListener('storage', event => {
  if (sync.account || (event.key !== storageKey && event.key !== null)) return;
  try {
    flushNotes();
    state = readProgress(window.localStorage);
    refreshView();
  } catch {
    announce('An update from another tab could not be loaded.');
  }
});
window.addEventListener('pagehide', flushNotes);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !root.querySelector('textarea:focus')) void pullAccount();
});
window.setInterval(() => {
  if (document.visibilityState === 'visible' && !root.querySelector('textarea:focus')) void pullAccount();
}, 15000);

renderRoute(false);
if (sync.account) void pullAccount();
else if (storageWarning) announce(storageWarning);
