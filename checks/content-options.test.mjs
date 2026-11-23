// node --test checks/content-options.test.mjs : PR A regressions (Grok, 2026-11-23).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { S, E, codex, createCodexAdapter, memoryStorage } from '../ui/checks/codex-load.mjs';
import { auditDays } from './content-audit.mjs';
import { assessmentScenarios } from '../assessment-scenarios.js';
import { readProgress, passedAssessment } from '../progress.js';

const A = createCodexAdapter({ S, E, codex });
const key = JSON.parse(readFileSync(new URL('./fixtures/answer-key-fffabc9.json', import.meta.url), 'utf8'));

test('every learner-facing question has at least four options (content-audit fails otherwise)', () => {
  for (const r of auditDays(1, 56)) assert.equal(r.fewOptions, 0, 'Day ' + r.day + ': ' + r.gaps.join('; '));
  for (const [day, [, options]] of Object.entries(assessmentScenarios)) {
    assert.ok(options.length >= 4, 'scenario ' + day);
    assert.equal(new Set(options).size, options.length, 'duplicate option on scenario ' + day);
  }
  for (const [id, p] of Object.entries(codex.topicLessons)) if (p.check) {
    assert.ok(p.check[1].length >= 4, 'concept check ' + id);
    assert.equal(new Set(p.check[1]).size, p.check[1].length, 'duplicate option in ' + id);
  }
});

test('question IDs, correct answers and pass thresholds match the fffabc9 answer key', () => {
  const now = {};
  for (let d = 1; d <= 56; d++) {
    const m = A.lessonsByDay[d].main;
    now['pass' + d] = codex.passCount(d) + '/' + m.quiz.questions.length + '/' + m.quiz.passPct;
    for (const q of m.quiz.questions) now[q.id] = q.q + ' => ' + q.options[q.answer];
  }
  for (const [id, p] of Object.entries(codex.topicLessons)) if (p.check) now['chk:' + id] = p.check[0] + ' => ' + p.check[1][p.check[2]];
  assert.deepEqual(now, key);
});

test('a score saved before the option change is kept and still counts as passed', () => {
  const max = codex.sessionQA[3].assessment.length, score = codex.passCount(3);
  const saved = { assessments: { 3: { score, attempts: 1, lastAttempt: '2026-11-24', correct: Array.from({ length: max }, (_, i) => i < score), bankVersion: 5 } } };
  const state = readProgress(memoryStorage({ [codex.storageKey]: JSON.stringify(saved) }));
  assert.equal(codex.storageKey, 'ai-learning-platform.study-desk.v1');
  assert.equal(state.assessments[3].score, score);
  assert.equal(state.assessments[3].bankVersion, 5);
  assert.equal(passedAssessment(state, 3), true);
});

test('learner-facing notes and day blocks contain no Hindi/Hinglish sentences', () => {
  const W = /\b(hai|hain|karta|karte|karo|kab|chahiye|toh|jaayen|sakta|sakte|nahi|nahin|aur|mein|kya|hota|hoti|yeh|woh|kyun|matlab|pehle|phir|agar|lekin|liye|dekho|samjho|ke|ka|ki|se|ko)\b/gi;
  const hinglish = t => new Set((String(t).match(W) || []).map(x => x.toLowerCase())).size >= 2;
  for (const d of codex.days) for (const b of d.blocks) for (const f of ['concept', 'example', 'practice', 'recall', 'title'])
    if (b[f]) assert.ok(!hinglish(b[f]), `Day ${d.number} block ${b.id}.${f}: ${b[f]}`);
  for (let d = 1; d <= 56; d++) for (const l of Object.values(A.lessonsByDay[d]).filter(Boolean))
    for (const n of l.notes) if (n.type !== 'code') {
      const t = [n.text, n.summary, ...(n.items || []).map(i => typeof i === 'string' ? i : i.title)].filter(Boolean).join(' ');
      assert.ok(!hinglish(t), `Day ${d} ${l.id}: ${t.slice(0, 120)}`);
    }
});
