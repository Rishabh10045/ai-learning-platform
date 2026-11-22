import { days, START_DATE } from './curriculum.js';
import { courseOutline } from './course-outline.js';
import { element as el } from './lesson-visuals.js';
import { dashboardScore, nextDay, passedAssessment, readinessScore, statusFor, todayInIndia } from './progress.js';
import { assessmentVersion, passCount, sessionQA } from './session-qa.js';
import { availabilityBudget, missedPlanPenalty, reminderCutoff, sessionAgenda } from './study-planner.js';

const field = (label, input) => el('label', { class: 'study-field' }, label, input);
const link = (label, href) => el('a', { href }, label);
const button = (label, attributes = {}) => el('button', { class: 'sd-btn', type: 'button', ...attributes }, label);
const card = (title, ...content) => el('section', { class: 'sd-card study-card' }, el('h2', {}, title), ...content);
const duration = minutes => minutes < 60 ? minutes + ' min' : Math.floor(minutes / 60) + ' h' +
  (minutes % 60 ? ' ' + minutes % 60 + ' min' : '');

export function planAgenda(day, state, save) {
  const today = todayInIndia();
  const scheduled = Object.keys(state.planned).sort().find(date => date >= today && state.planned[date] === day.number);
  const date = el('input', { type: 'date', min: today < START_DATE ? START_DATE : today, value: scheduled || (today < START_DATE ? START_DATE : today), required: true });
  const schedule = button('Plan Day ' + day.number, { type: 'submit', disabled: Boolean(state.sessions[day.number]?.completedOn) });
  const form = el('form', { class: 'study-row study-form' }, field('Study date · IST', date), schedule);
  form.addEventListener('submit', event => {
    event.preventDefault();
    save({ kind: 'plan', date: date.value, day: day.number }, 'Day ' + day.number + ' planned for ' + date.value + '.');
  });
  const output = el('div', { class: 'agenda-output' });
  function renderAgenda() {
    const selected = date.value;
    if (!selected) return output.replaceChildren();
    const budget = availabilityBudget(selected, state.preferences);
    const agenda = sessionAgenda(day, budget);
    const weekDay = new Date(selected + 'T00:00:00Z').getUTCDay();
    output.replaceChildren(
      el('p', { class: 'agenda-total' }, el('strong', {}, duration(budget)), ' planned · ' + duration(agenda.core) +
        ' core from 9–11 PM IST' + (agenda.extra ? ' · ' + duration(agenda.extra) + ' extra practice' : '')),
      el('p', { class: 'sd-muted' }, state.unavailable.includes(selected) ?
        'This date is unavailable. Choose another date to schedule this session.' :
        [0, 6].includes(weekDay) && agenda.extra > 0 ? 'Extra weekend practice can be split across the day.' :
          'Complete the core work first. Carry any unfinished core block forward.'),
      agenda.deep.length ? el('details', { class: 'study-details' }, el('summary', {}, 'See the extra practice plan'),
        el('ol', { class: 'study-list' }, agenda.deep.map(item =>
          el('li', {}, el('strong', {}, item.title + ' · ' + duration(item.minutes)), el('p', {}, item.task))))) : el('span')
    );
  }
  date.addEventListener('change', renderAgenda);
  renderAgenda();
  return card('Plan study time', form, output);
}

export function practiceAudit(day) {
  const qa = sessionQA[day.number];
  return card('Hands-on verification',
    el('p', {}, qa.test),
    el('h3', {}, 'Stretch exercise'),
    el('p', {}, qa.stretch));
}

export function interviewBank(day, positions) {
  const { questions, answers } = sessionQA[day.number];
  const question = el('p', { class: 'sd-callout', 'aria-live': 'polite' });
  const answer = el('p');
  const guidance = el('details', { class: 'study-details interview-guidance' },
    el('summary', {}, 'Reveal model answer'), answer);
  const title = el('strong');
  const next = button('Next question');
  function render() {
    const index = positions.get(day.number) || 0;
    title.textContent = 'Question ' + (index + 1) + ' of ' + questions.length;
    question.textContent = questions[index];
    guidance.open = false;
    answer.textContent = answers[index];
  }
  next.addEventListener('click', () => {
    positions.set(day.number, ((positions.get(day.number) || 0) + 1) % questions.length);
    render();
  });
  render();
  return card('Interview question bank', title, question, guidance, next);
}

export function assessmentPanel(day, state, submit) {
  const qa = sessionQA[day.number];
  const score = readinessScore(state, day.number);
  const record = state.assessments[day.number];
  const total = qa.assessment.length;
  const passed = passedAssessment(state, day.number);
  const completed = state.sessions[day.number]?.completedOn;
  const current = nextDay(state)?.number === day.number;
  const unavailable = state.unavailable.includes(todayInIndia());
  const intro = el('p', {}, 'Readiness ' + score + '/100 · Pass ' + passCount(day.number) + ' of ' + total +
    ' · Self-check questions');
  const content = card('Day ' + day.number + ' test', intro);
  if (record) {
    const result = 'Last score ' + record.score + '/' + total + ' · ' + record.attempts + ' attempt' + (record.attempts === 1 ? '' : 's');
    content.append(el('p', { class: 'sd-callout' }, result + (record.stale ? ' · Retake after changes.' : passed ? ' · Passed.' : ' · Try again.')));
    if (!record.stale && record.bankVersion === assessmentVersion && record.correct.some(answer => !answer)) {
      content.append(el('details', { class: 'study-details assessment-review' }, el('summary', {}, 'Review missed answers'),
        el('ul', {}, qa.assessment.filter((_, index) => record.correct[index] === false)
          .map(item => el('li', {}, el('strong', {}, item.question), el('p', {}, item.explanation))))));
    }
  }
  if (completed || (current && passed)) {
    content.append(link('Return to the session plan', '#day-' + day.number));
    return content;
  }
  if (!current || unavailable || score < 100) {
    content.append(el('p', {}, unavailable ? 'This study date is unavailable.' : !current ?
      'Finish the earlier study day to open this test.' : 'Finish each core block and save assignment evidence to unlock the test.'),
      link('Open session plan', '#day-' + day.number));
    return content;
  }
  const actions = button('Submit self-check', { type: 'submit', class: 'sd-btn sd-btn-primary' });
  const form = el('form', { class: 'study-assessment' }, qa.assessment.map((item, index) =>
    el('fieldset', {}, el('legend', {}, (index + 1) + '. ' + item.question), item.choices.map((choice, option) =>
      el('label', { class: 'assessment-option' },
        el('input', { type: 'radio', name: 'q' + index, value: option, required: true }), choice)))),
    actions);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const answers = new FormData(form);
    actions.disabled = true;
    try {
      await submit({ kind: 'assessment', day: day.number,
        bankVersion: assessmentVersion,
        choices: qa.assessment.map((_, index) => Number(answers.get('q' + index))) }, 'Self-check recorded.');
    } finally {
      actions.disabled = false;
    }
  });
  content.append(form);
  return content;
}

export function dashboardPanels(state, { save, signedIn, remindersConfigured }) {
  const score = dashboardScore(state);
  const badges = el('div', { class: 'study-stat-grid' }, [
    ['Study score', score.total + ' pts'], ['Evidence and tests', '+' + score.earned],
    ['Missed plan deduction', '−' + score.deductions], ['Passed self-checks', String(days.filter(day => passedAssessment(state, day.number)).length)]
  ].map(([label, value]) => el('div', { class: 'study-stat' }, el('strong', {}, value), el('span', {}, label))));
  const progress = card('Score and study consistency', badges, el('p', { class: 'sd-muted' },
    'Per session: up to 70 points for checked blocks, 30 for recorded evidence, and 25 for passing the self-check. Each missed planned date deducts ' +
      missedPlanPenalty + ' points after ' + reminderCutoff + ' IST. Unavailable dates are exempt.'));
  const today = todayInIndia();
  const missed = new Set(score.missed.map(item => item.date));
  const planned = Object.entries(state.planned).sort(([a], [b]) => a.localeCompare(b)).reverse();
  const schedule = card('Planned study dates',
    planned.length ? el('ol', { class: 'study-day-list' }, planned.map(([date, day]) => {
      const status = state.unavailable.includes(date) ? 'Unavailable' : missed.has(date) ? 'Missed · Day ' + day + ' can be continued' :
        state.sessions[day]?.completedOn ? 'Complete' : 'Planned · ' + duration(availabilityBudget(date, state.preferences));
      const remove = button('Clear plan', { 'aria-label': 'Clear plan for ' + date });
      remove.addEventListener('click', () => save({ kind: 'plan', date, day: null }, 'Study date removed.'));
      return el('li', { class: 'study-row' }, el('div', {}, link(date + ' · Day ' + day, '#day-' + day),
        el('span', { class: 'sd-muted' }, status)), date >= today ? remove : null);
    })) : el('p', {}, 'Open a session to schedule its study date.'));

  const daysFields = [['weekdayMinutes', 'Monday to Friday'], ['saturdayMinutes', 'Saturday'], ['sundayMinutes', 'Sunday']];
  const budgetFields = Object.fromEntries(daysFields.map(([key]) =>
    [key, el('input', { type: 'number', min: 120, max: 420, step: 15, required: true, value: state.preferences[key] })]));
  const email = el('input', { type: 'checkbox', checked: state.preferences.emailReminders,
    disabled: !signedIn || !remindersConfigured });
  const emailSettings = el('label', { class: 'watch-label' }, email, 'Email me when a planned day is missed');
  const form = el('form', { class: 'study-form' }, daysFields.map(([key, label]) =>
    field(label + ' · minutes', budgetFields[key])), emailSettings, button('Save preferences', { type: 'submit' }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    save({ kind: 'preferences',
      ...Object.fromEntries(daysFields.map(([key]) => [key, Number(budgetFields[key].value)])),
      emailReminders: email.checked && !email.disabled }, 'Study preferences saved.');
  });
  const settings = card('Study preferences', form, el('p', { class: 'sd-muted' },
    remindersConfigured ? 'Reminders use your sync account email and respect marked absences.' :
      'Email delivery is available after an account connects to a configured reminder server.'));
  return [progress, schedule, settings];
}

export function subjectPageContent(state) {
  const indexed = new Map(courseOutline.days.flatMap(day => day.lessonIds.map(id => [id, day.day])));
  return courseOutline.tracks.map(track => card(track.title, track.modules.map(module => {
    const completed = module.lessons.filter(lesson => state.sessions[indexed.get(lesson.id)]?.completedOn).length;
    return el('details', { class: 'study-details subject-module' },
      el('summary', {}, module.title + ' · ' + completed + '/' + module.lessons.length + ' complete'),
      el('progress', { value: completed, max: module.lessons.length, 'aria-label': module.title + ' progress' }),
      el('ul', { class: 'study-list' }, module.lessons.map(lesson => {
        const day = days[indexed.get(lesson.id) - 1];
        return el('li', {}, link(lesson.title, '#day-' + day.number),
          el('span', { class: 'sd-muted' }, ' · Day ' + day.number + ' · ' + statusFor(state, day)));
      })));
  })));
}

export function accountCard({ sync, defaultOrigin, localHasProgress, storageWarning, login, logout, pull, importLocal }) {
  if (sync.account) {
    const account = sync.account;
    const body = card('Study account',
      el('p', {}, account.email + ' · ' + (sync.current ? 'Progress saved to your account.' : 'Connecting to your account…')),
      storageWarning ? el('p', { role: 'status' }, storageWarning) : null);
    const reload = button('Refresh from database');
    const exit = button('Sign out');
    reload.addEventListener('click', pull);
    exit.addEventListener('click', logout);
    const actions = el('div', { class: 'study-row' }, reload, exit);
    if (sync.current?.revision === 0 && localHasProgress) {
      const transfer = button('Import this browser’s progress');
      transfer.addEventListener('click', importLocal);
      actions.append(transfer);
    }
    body.append(actions);
    return body;
  }

  const origin = el('input', { type: 'url', required: true, value: defaultOrigin, placeholder: 'https://your-study-server.example' });
  const email = el('input', { type: 'email', required: true, autocomplete: 'username' });
  const password = el('input', { type: 'password', required: true, autocomplete: 'current-password' });
  const submit = button('Sign in to sync', { type: 'submit', class: 'sd-btn sd-btn-primary' });
  const message = el('p', { role: 'status' });
  const form = el('form', { class: 'study-form' }, field('Sync server', origin), field('Account email', email),
    field('Password', password), submit, message);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    message.textContent = 'Signing in…';
    try {
      await login(origin.value, email.value, password.value);
    } catch (error) {
      message.textContent = error.message;
    } finally {
      password.value = '';
      submit.disabled = false;
    }
  });
  return card('Study account', el('p', {}, 'Progress currently saves in this browser. Sign in with the same study account on each browser to sync through the database.'),
    form);
}
