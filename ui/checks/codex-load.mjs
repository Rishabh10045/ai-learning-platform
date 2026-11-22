// Loads Codex's real modules + the v2 engines in Node, for adapter checks.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || globalThis;
export const S = require('../engine/schedule-engine.js');
export const E = require('../engine/engagement-engine.js');
const r = p => import(new URL('../../' + p, import.meta.url));
const [cur, co, sd, qa, tl, ti, dg, lv, pr, sa, sp] = await Promise.all(['curriculum.js', 'course-outline.js', 'study-data.js', 'session-qa.js',
  'topic-lessons.js', 'topic-index.js', 'lesson-diagrams.js', 'lesson-videos.js', 'progress.js', 'study-actions.js', 'study-planner.js'].map(r));
const depth = await r('day-depth.js');
export const codex = { days: cur.days, courses: cur.courses, START_DATE: cur.START_DATE, courseOutline: co.courseOutline, studyLessons: sd.studyLessons,
  sessionQA: qa.sessionQA, passCount: qa.passCount, assessmentVersion: qa.assessmentVersion, topicLessons: tl.topicLessons, getTopic: ti.getTopic,
  topicIndex: ti.topicIndex, lessonDiagrams: dg.lessonDiagrams, videosForDay: lv.videosForDay, passedAssessment: pr.passedAssessment, readProgress: pr.readProgress,
  emptyProgress: pr.emptyProgress, storageKey: pr.storageKey, applyStudyAction: sa.applyStudyAction, defaultPreferences: sp.defaultPreferences,
  todayInIndia: pr.todayInIndia, readinessScore: pr.readinessScore, warmupLessons: depth.warmupLessons, depthPackets: depth.depthPackets, stretchPlans: depth.stretchPlans };
export const { createCodexAdapter, createCodexHost, emptySidecar, SIDECAR_KEY } = await import('../adapters/codex-adapter.js');
export function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), dump: () => Object.fromEntries(m) };
}
// The Codex v1 blob exactly as Codex's app.js@76d7e56 writes it: its own reducer + JSON.stringify under its storage key.
export function codexBlob(actions, today = '2026-11-22') {
  const state = codex.emptyProgress();
  for (const [a, d] of actions) codex.applyStudyAction(state, a, d || today);
  return state;
}
