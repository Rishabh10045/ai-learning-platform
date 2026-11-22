// node --test ui/checks/late-depth.test.mjs : Grok's Days 26–56 content (late-depth.js) stays complete and in sync.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { lateLanes, lateDepthPackets, lateDistractors, lateExplanations, lateAssessment, lateStretchPlans, lateInterviewGuides } from '../../late-depth.js';
import { auditDays } from '../../checks/content-audit.mjs';
import { codex } from './codex-load.mjs';

const finished = Object.keys(lateLanes).map(Number);   // a day gets its lane when its whole batch is finished

test('late-depth.js day maps: lanes, distractors, stretch plans and packets stay on Days 26–56; guides and extra MCQs also fix Days 2–3', () => {
  for (const map of [lateLanes, lateDistractors, lateExplanations, lateStretchPlans])
    for (const k of Object.keys(map)) assert.ok(+k >= 26 && +k <= 56, 'day ' + k);
  for (const map of [lateAssessment, lateInterviewGuides])
    for (const k of Object.keys(map)) assert.ok((+k >= 26 && +k <= 56) || +k === 2 || +k === 3, 'day ' + k);
  for (const id of Object.keys(lateDepthPackets)) {
    const day = codex.days.find(d => d.topics.some(t => t.toLowerCase() === id.replace(/\.dsa$/, '')));
    assert.ok(day && day.number >= 26, id + ' is scheduled on Day 26–56');
  }
});

test('every embedded Java program is a verbatim copy of notes/java-examples/<Class>.java', () => {
  for (const [id, p] of Object.entries(lateDepthPackets)) {
    if (!p.code) continue;
    const cls = p.code.text.match(/public\s+class\s+(\w+)/)[1];
    const file = new URL('../../notes/java-examples/' + cls + '.java', import.meta.url);
    assert.ok(existsSync(file), id + ': notes/java-examples/' + cls + '.java exists');
    assert.equal(readFileSync(file, 'utf8'), p.code.text, id + ': ' + cls + '.java in sync');
    assert.ok(p.code.output && p.code.output.length > 5, id + ': expected output present');
  }
});

test('every finished day meets the content standard (checks/content-audit.mjs)', () => {
  assert.ok(finished.length >= 1);
  for (const r of auditDays(26, 56).filter(r => finished.includes(r.day))) assert.deepEqual(r.gaps, [], 'Day ' + r.day + ': ' + r.gaps.join('; '));
});

test('distractors and explanations line up with the two-option pairs; references are https', () => {
  for (const [day, pairs] of Object.entries(lateDistractors)) {
    assert.equal(lateExplanations[day]?.length, pairs.length, 'Day ' + day + ' explanations');
    for (const extra of pairs) assert.equal(extra.length, 2, 'Day ' + day + ' two extra options');
  }
  for (const p of Object.values(lateDepthPackets)) for (const [, url] of p.references || []) assert.match(url, /^https:\/\//);
  for (const lane of Object.values(lateLanes)) for (const r of lane.readings) assert.match(r.url, /^https:\/\//);
});

test('weekend stretch plans add up to 270 minutes', () => {
  for (const [day, plan] of Object.entries(lateStretchPlans)) {
    const total = Object.values(plan.assign || {}).reduce((a, b) => a + b, 0) + (plan.extra || []).reduce((a, x) => a + x.minutes, 0);
    assert.equal(total, 270, 'Day ' + day);
  }
});

test('fuller session answers: three per day, 80–200 words each', () => {
  for (const [day, answers] of Object.entries(lateInterviewGuides)) {
    assert.equal(answers.length, 3, 'Day ' + day);
    for (const a of answers) { const w = a.split(/\s+/).length; assert.ok(w >= 80 && w <= 200, 'Day ' + day + ': ' + w + ' words'); }
  }
});

test('fuller topic answers match an existing Codex question and are 80–200 words', async () => {
  const { lateTopicAnswers } = await import('../../late-depth.js');
  const { topicLessons } = await import('../../topic-lessons.js');
  for (const [id, answers] of Object.entries(lateTopicAnswers)) {
    const questions = (topicLessons[id]?.interview || []).map(([q]) => q);
    for (const [q, a] of Object.entries(answers)) {
      assert.ok(questions.includes(q), id + ': question not found (Codex may have reworded it): ' + q);
      assert.equal(topicLessons[id].interview.find(([x]) => x === q)[1], a, id + ': fuller answer applied');
      const w = a.split(/\s+/).length; assert.ok(w >= 80 && w <= 200, id + ': ' + w + ' words');
    }
  }
});
