import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createStudyServer } from '../backend/server.mjs';
import { accountPasswordHash, openStudyDatabase, setAccount } from '../backend/database.mjs';
import { days } from '../curriculum.js';
import { courseOutline, coverageCurriculum } from '../course-outline.js';
import { dashboardScore, emptyProgress, passedAssessment, readProgress } from '../progress.js';
import { assessmentScenarios } from '../assessment-scenarios.js';
import { assessmentVersion, gradeAssessment, sessionQA } from '../session-qa.js';
import { availabilityBudget, sessionAgenda, subjectModules } from '../study-planner.js';
import { applyStudyAction } from '../study-actions.js';
import { getTopic, topicIndex } from '../topic-index.js';
import { topicLessons } from '../topic-lessons.js';

const testPassword = 'study test password only';
const email = 'learner@example.test';
const firstDate = '2026-11-22';
const dayOneAnswers = sessionQA[1].assessment.map(item => item.answer);

async function setup(t, sender) {
  const dir = await mkdtemp(join(tmpdir(), 'study-desk-'));
  const db = openStudyDatabase(join(dir, 'state.sqlite'));
  const password = await accountPasswordHash(testPassword);
  setAccount(db, email, password);
  setAccount(db, 'second@example.test', password);
  let now = new Date('2026-11-22T15:30:00Z');
  const run = createStudyServer({ db, now: () => now, sendReminder: sender || null });
  await new Promise(resolve => run.server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + run.server.address().port;
  async function request(path, { method = 'GET', token, body, origin } = {}) {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    if (origin) headers.Origin = origin;
    const response = await fetch(base + '/api/v1/' + path,
      { method, headers, body: body && JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
  }
  async function login(address = email, password = testPassword) {
    return request('session', { method: 'POST', body: { email: address, password } });
  }
  function save(token, revision, action) {
    return request('progress', { method: 'PATCH', token, body: { revision, action } });
  }
  t.after(async () => {
    await new Promise(resolve => run.server.close(resolve));
    await run.settleReminders();
    db.close();
    await rm(dir, { recursive: true, force: true });
  });
  return { ...run, db, login, save, request, time: clock => { now = new Date(clock); } };
}

test('all sessions have a subject, multiple interview questions, boundary tests and exact study budgets', () => {
  assert.equal(Object.keys(sessionQA).length, days.length);
  const lessons = courseOutline.tracks.flatMap(track => track.modules.flatMap(module => module.lessons));
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, days.length);
  assert.equal(new Set(subjectModules.flatMap(track => track.modules.flatMap(module => module.days))).size, days.length);
  let interviewQuestionCount = 0;
  let quizQuestionCount = 0;
  for (const day of days) {
    const qa = sessionQA[day.number];
    const label = 'Day ' + day.number;
    assert.ok(qa.test.length > 30 && qa.stretch.length > 30);
    assert.equal(new Set(qa.questions).size, day.number === 1 ? 5 : 3, label);
    assert.equal(qa.answers.length, qa.questions.length, label);
    assert.ok(qa.answers.every(answer => answer.length > 100), label);
    assert.equal(qa.assessment.length, [1, 55].includes(day.number) ? 5 : 3, label);
    assert.ok(qa.assessment.every(item => item.explanation.length > 15 && item.choices[item.answer] &&
      item.choices.length === new Set(item.choices).size), label);
    const [scenario, choices] = assessmentScenarios[day.number];
    const applied = qa.assessment.find(item => item.question === scenario);
    assert.equal(applied.choices.length, 3, label);
    assert.equal(applied.choices[applied.answer], choices[0], label);
    assert.equal(gradeAssessment(day.number, qa.assessment.map(item => item.answer)), qa.assessment.length, label);
    assert.equal(gradeAssessment(day.number, qa.assessment.map(item => (item.answer + 1) % item.choices.length)), 0, label);
    interviewQuestionCount += qa.questions.length;
    quizQuestionCount += qa.assessment.length;
    assert.equal(day.blocks.reduce((sum, block) => sum + block.minutes, 0), 120);
    if (day.number > 1) assert.equal(day.blocks[0].minutes, 12);
  }
  assert.equal(interviewQuestionCount, 3 * days.length + 2);
  assert.equal(quizQuestionCount, 3 * days.length + 4);
  assert.equal(lessons.find(lesson => lesson.id === 'd-union-find-01').source, 'added');
  assert.equal(lessons.find(lesson => lesson.id === 'd-bits-01').source, 'dsa');
  assert.deepEqual(courseOutline.days.at(-1).lessonIds, ['d-bits-01']);
  for (const topic of topicIndex.filter(topic => [1, 56].includes(topic.day))) {
    assert.ok(topicLessons[topic.id], topic.id);
  }
  assert.equal(availabilityBudget('2026-11-28'), 390);
  assert.equal(coverageCurriculum.tracks.length, 4);
  const sunday = sessionAgenda(days[0], availabilityBudget(firstDate));
  assert.equal(sunday.core + sunday.extra, 390);
  assert.equal(sunday.deep.reduce((sum, block) => sum + block.minutes, sunday.core), 390);
  assert.equal(availabilityBudget('2026-11-23'), 120);
});

test('earlier quiz scores remain readable after the question set changes', () => {
  const state = readProgress({ getItem: () => JSON.stringify({ assessments: {
    1: { score: 4, correct: [true, true, true, true, false], attempts: 1, lastAttempt: firstDate }
  } }) });
  assert.equal(state.assessments[1].bankVersion, 1);
  assert.equal(state.assessments[1].score, 4);
  assert.ok(passedAssessment(state, 1));
});

test('indexed topics resolve to stable lessons and dedicated material has answer and evidence coverage', () => {
  const mapped = days.flatMap(day => day.topics.filter(id => !id.startsWith('LAB-')).map(id => id.toLowerCase()));
  assert.deepEqual(topicIndex.map(topic => topic.id), mapped);
  assert.equal(new Set(mapped).size, mapped.length);
  for (const topic of topicIndex) {
    assert.ok(topic.title && topic.subject, topic.id);
    assert.ok(courseOutline.days.find(item => item.day === topic.day)?.lessonIds.includes(topic.lessonId), topic.id);
  }
  for (const [id, topic] of Object.entries(topicLessons)) {
    assert.ok(getTopic(id), id);
    assert.ok(topic.notes.length >= 3 && topic.takeaways.length >= 3, id);
    assert.ok(topic.practice[0] && topic.practice[1].length >= 2, id);
    assert.ok(topic.interview.length >= 3 && topic.interview.length <= 5, id);
    assert.ok(topic.interview.every(([question, answer]) => question && answer), id);
    assert.ok(topic.references.every(([, url]) => url.startsWith('https://')), id);
    if (topic.check) {
      const [question, options, answer, explanation] = topic.check;
      assert.ok(question && explanation && options[answer] && new Set(options).size === options.length, id);
    }
  }
});

test('takeaways are private per topic and account and preserve the earlier save during conflicts', async t => {
  const api = await setup(t);
  const a = (await api.login()).data;
  const b = (await api.login()).data;
  const other = (await api.login('second@example.test')).data;
  const first = { kind: 'topicTakeaway', topicId: 'j-oop-01', text: 'Keep ownership private · हिन्दी', base: '' };
  assert.equal((await api.save(a.token, 0, { ...first, topicId: 'unknown-topic-01' })).status, 422);
  assert.equal((await api.save(a.token, 0, { ...first, text: 'x'.repeat(3001) })).status, 422);
  const saved = await api.save(a.token, 0, first);
  assert.equal(saved.status, 200);
  assert.equal(saved.data.state.topicTakeaways[first.topicId], first.text);
  const stale = await api.save(b.token, 0, { ...first, text: 'An older draft' });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.state.topicTakeaways[first.topicId], first.text);
  assert.equal((await api.save(b.token, saved.data.revision, { ...first, text: 'An older draft' })).status, 422);
  const second = await api.save(b.token, saved.data.revision, { ...first, topicId: 'l-invariants-01', text: 'One winner' });
  assert.equal(second.status, 200);
  const trimmed = await api.save(a.token, second.data.revision, { ...first, text: '  ', base: first.text });
  assert.deepEqual(trimmed.data.state.topicTakeaways, { 'l-invariants-01': 'One winner' });
  assert.deepEqual((await api.request('progress', { token: other.token })).data.state.topicTakeaways, {});
  assert.deepEqual((await api.request('progress', { token: a.token })).data.state.personalNotes, {});
});

test('score deductions respect the IST cutoff and explicitly unavailable dates', () => {
  const state = emptyProgress();
  applyStudyAction(state, { kind: 'plan', date: firstDate, day: 1 }, firstDate);
  assert.equal(dashboardScore(state, new Date('2026-11-22T17:34:59Z')).deductions, 0);
  assert.equal(dashboardScore(state, new Date('2026-11-22T17:35:00Z')).deductions, 5);
  applyStudyAction(state, { kind: 'availability', date: firstDate, unavailable: true }, firstDate);
  assert.equal(dashboardScore(state, new Date('2026-11-22T18:00:00Z')).deductions, 0);
});

test('two authenticated clients share database state and a stale version cannot overwrite it', async t => {
  const api = await setup(t);
  assert.equal((await api.request('progress')).status, 401);
  assert.equal((await api.login(email, 'wrong password')).status, 401);
  assert.equal((await api.request('session', { origin: 'https://other.example.test' })).status, 403);
  const a = (await api.login()).data;
  const b = (await api.login()).data;
  const other = (await api.login('second@example.test')).data;
  assert.notEqual(a.token, b.token);
  let revision = 0;
  async function put(action) {
    const result = await api.save(a.token, revision, action);
    assert.equal(result.status, 200, result.data.message);
    revision = result.data.revision;
    return result.data.state;
  }
  await put({ kind: 'begin', day: 1 });
  assert.equal((await api.save(a.token, revision, { kind: 'finish', day: 1 })).status, 422);
  for (const block of days[0].blocks) await put({ kind: 'block', day: 1, id: block.id, done: true });
  await put({ kind: 'evidence', day: 1, evidence: 'U1 remains owner · हिन्दी evidence', notes: '' });
  assert.equal((await api.save(a.token, revision, { kind: 'finish', day: 1 })).status, 422);
  const outdated = await api.save(a.token, revision, { kind: 'assessment', day: 1, bankVersion: 1, choices: dayOneAnswers });
  assert.equal(outdated.status, 422);
  assert.match(outdated.data.message, /self-check changed/);
  const failed = await put({ kind: 'assessment', day: 1, bankVersion: assessmentVersion,
    choices: dayOneAnswers.map(answer => answer === 0 ? 1 : 0) });
  assert.equal(failed.assessments[1].score, 0);
  assert.equal(failed.assessments[1].bankVersion, assessmentVersion);
  await put({ kind: 'assessment', day: 1, bankVersion: assessmentVersion, choices: dayOneAnswers });
  await put({ kind: 'finish', day: 1 });
  const complete = (await api.request('progress', { token: b.token })).data;
  assert.equal(complete.state.sessions[1].completedOn, firstDate);
  assert.deepEqual((await api.request('progress', { token: other.token })).data.state.sessions, {});
  await put({ kind: 'reopen', day: 1 });
  const stale = await api.save(b.token, complete.revision, { kind: 'notes', day: 1, text: 'stale write' });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.state.sessions[1].completedOn, '');
  assert.equal(stale.data.state.assessments[1].stale, true);
  assert.equal(stale.data.state.sessions[1].evidence, 'U1 remains owner · हिन्दी evidence');
  await put({ kind: 'block', day: 1, id: 'lab', done: false });
  const current = (await api.request('progress', { token: b.token })).data;
  assert.ok(!current.state.sessions[1].checked.includes('lab'));
  assert.equal((await api.request('session', { method: 'DELETE', token: b.token })).status, 200);
  assert.equal((await api.request('progress', { token: b.token })).status, 401);
});

test('restart preserves the persisted account and progress file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'study-desk-restart-'));
  const filename = join(dir, 'data.sqlite');
  let db = openStudyDatabase(filename);
  const user = setAccount(db, email, await accountPasswordHash(testPassword));
  try {
    const { changeProgress, getProgress } = await import('../backend/database.mjs');
    changeProgress(db, user.id, 0, Date.now(), state => {
      applyStudyAction(state, { kind: 'notes', day: 1, text: 'after restart' }, firstDate);
      return state;
    });
    db.close();
    db = openStudyDatabase(filename);
    assert.equal(getProgress(db, user.id).state.personalNotes[1], 'after restart');
    assert.equal(getProgress(db, user.id).revision, 1);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('opted-in pending reminders send once, suppress skipped days and retry a provider failure safely', async t => {
  const sent = [];
  const failing = new Set();
  const api = await setup(t, async job => {
    sent.push(job);
    if (job.missing.day === 1 && !failing.has(job.id)) {
      failing.add(job.id);
      throw new Error('Synthetic provider interruption');
    }
  });
  const a = (await api.login()).data;
  const b = (await api.login('second@example.test')).data;
  const prefs = { kind: 'preferences', weekdayMinutes: 120, saturdayMinutes: 180, sundayMinutes: 390, emailReminders: true };
  assert.equal((await api.save(a.token, 0, prefs)).status, 200);
  assert.equal((await api.save(b.token, 0, prefs)).status, 200);
  assert.equal((await api.save(a.token, 1, { kind: 'plan', date: firstDate, day: 1 })).status, 200);
  assert.equal((await api.save(b.token, 1, { kind: 'plan', date: firstDate, day: 1 })).status, 200);
  assert.equal((await api.save(b.token, 2, { kind: 'availability', date: firstDate, unavailable: true })).status, 200);
  api.time('2026-11-22T17:34:00Z');
  assert.equal((await api.runReminders()).sent, 0);
  api.time('2026-11-22T17:36:00Z');
  assert.equal((await api.runReminders()).failed, 1);
  api.time('2026-11-22T17:39:00Z');
  assert.equal((await api.runReminders()).sent, 1);
  assert.equal((await api.runReminders()).sent, 0);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].id, sent[1].id);
  assert.ok(sent.every(message => message.email === email));
});

test('only an empty account accepts a legacy import and live email requires a provider', async t => {
  const api = await setup(t);
  const user = (await api.login()).data;
  assert.equal((await api.save(user.token, 0, {
    kind: 'preferences', weekdayMinutes: 120, saturdayMinutes: 180, sundayMinutes: 390, emailReminders: true
  })).status, 422);
  const old = { sessions: {}, personalNotes: { 1: 'legacy browser note' }, topicTakeaways: { 'j-equality-01': 'my topic note' } };
  const importState = { method: 'POST', token: user.token, body: { revision: 0, state: old } };
  assert.equal((await api.request('import', importState)).status, 200);
  assert.equal((await api.request('import', importState)).status, 409);
  const restored = (await api.request('progress', { token: user.token })).data.state;
  assert.equal(restored.personalNotes[1], 'legacy browser note');
  assert.equal(restored.topicTakeaways['j-equality-01'], 'my topic note');
  assert.equal(restored.preferences.emailReminders, false);
});
