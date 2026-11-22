import { days } from './curriculum.js';
import { sessionQA } from './session-qa.js';

export const defaultPreferences = Object.freeze({
  weekdayMinutes: 120, saturdayMinutes: 390, sundayMinutes: 390, emailReminders: false
});

const indiaClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
  minute: '2-digit', hourCycle: 'h23'
});

export function indiaTime(now = new Date()) {
  const fields = Object.fromEntries(indiaClock.formatToParts(now).map(({ type, value }) => [type, value]));
  return { date: [fields.year, fields.month, fields.day].join('-'), time: fields.hour + ':' + fields.minute };
}

export function availabilityBudget(date, profile = defaultPreferences) {
  const weekday = new Date(date + 'T00:00:00Z').getUTCDay();
  if (weekday === 0) return profile.sundayMinutes;
  if (weekday === 6) return profile.saturdayMinutes;
  return profile.weekdayMinutes;
}

const dayOneDeepPractice = [
  { title: 'Validation and assignment evidence', minutes: 65, task: 'Run initial-state, U1, U2, repeat, unknown-seat and whitespace fixtures in Java. Preserve exact outcomes.' },
  { title: 'Object design and a second test harness', minutes: 45, task: 'Draw class responsibilities. Drive the original one-seat service from tests so ownership stays encapsulated.' },
  { title: 'HTTP request and failure timelines', minutes: 40, task: 'Sketch successful and conflicting responses and show where request validation and authoritative state sit.' },
  { title: 'Hashing and duplicate detection', minutes: 40, task: 'Implement the Set scan, test empty/mixed/duplicate lists and compare with a nested-loop baseline.' },
  { title: 'LLM output validation', minutes: 30, task: 'Write valid, unsupported and ambiguous refund-policy responses. State the deterministic outcome for each.' },
  { title: 'Interview drills and a changed scenario', minutes: 30, task: 'Use the five Day 1 interview questions. Explain a cancelled seat or stale browser display before checking notes.' },
  { title: 'Review, corrections and recovery time', minutes: 20, task: 'Record one failed test, the fix, the evidence and anything to carry forward.' }
];

export function sessionAgenda(day, budget) {
  const core = day.blocks.reduce((total, block) => total + block.minutes, 0);
  const extra = Math.max(0, budget - core);
  if (day.number === 1 && extra === 270) return { core, extra, deep: dayOneDeepPractice };
  if (!extra) return { core, extra, deep: [] };
  const weights = [0.45, 0.25, 0.2, 0.1];
  const titles = ['Stretch exercise', 'Boundary and failure tests', 'Interview practice', 'Evidence and revision'];
  const tasks = [sessionQA[day.number].stretch, sessionQA[day.number].test,
    'Answer the applied questions and explain a trade-off in your own words.', 'Save reproducible evidence and write the point to revisit.'];
  const minutes = weights.map(weight => Math.floor(extra * weight / 5) * 5);
  minutes[3] += extra - minutes.reduce((total, item) => total + item, 0);
  return { core, extra, deep: titles.map((title, index) => ({ title, minutes: minutes[index], task: tasks[index] })).filter(item => item.minutes) };
}

export const reminderCutoff = '23:05';
export const missedPlanPenalty = 5;

export function missedPlannedSessions(state, now = new Date()) {
  const { date, time } = indiaTime(now);
  return Object.entries(state.planned || {}).flatMap(([plannedDate, day]) => {
    const completed = state.sessions[day]?.completedOn;
    const due = plannedDate < date || (plannedDate === date && time >= reminderCutoff);
    return due && !state.unavailable.includes(plannedDate) && (!completed || completed > plannedDate)
      ? [{ date: plannedDate, day, title: days[day - 1].title }] : [];
  }).sort((first, second) => first.date.localeCompare(second.date));
}

const span = (first, last) => Array.from({ length: last - first + 1 }, (_, n) => first + n);

export const subjectModules = [
  { title: 'Java', modules: [
    { title: 'Language, objects and collections', days: [1, 4, 5, 6, 8] },
    { title: 'Threads, locks, executors and JVM', days: [2, 3, 7, 46] }
  ] },
  { title: 'Spring Boot', modules: [
    { title: 'Maven, dependency injection, MVC and REST', days: [9, 10, 11] },
    { title: 'Persistence, testing and transactions', days: [13, 16, 47] },
    { title: 'Security, OAuth and deployment', days: [33, 34, 48] }
  ] },
  { title: 'SQL and data', modules: [
    { title: 'Schema, JDBC and locking', days: span(12, 16) },
    { title: 'Holds, idempotency, indexes and caching', days: span(19, 22) }
  ] },
  { title: 'Low-level design', modules: [
    { title: 'Contracts, invariants and responsibilities', days: [1, 5, 8] },
    { title: 'Holds, LRU and capstone', days: [19, 29, 44, 45] }
  ] },
  { title: 'System design', modules: [
    { title: 'Request lifecycle, scaling and estimates', days: [1, 10, 17, 18, 21, 24] },
    { title: 'Consistency, events and resilience', days: [20, 22, 23, 25, 49, 50, 51] }
  ] },
  { title: 'DSA in Java', modules: [
    { title: 'Hashing, arrays, two pointers and sorting', days: [4, ...span(26, 28)] },
    { title: 'LRU, heaps, graphs and dynamic programming', days: [...span(29, 32), 52, 53, 55] }
  ] },
  { title: 'AI engineering', modules: [
    { title: 'LLMs, prompting and Spring AI interfaces', days: span(35, 37) },
    { title: 'Retrieval, RAG, evaluation and tools', days: span(38, 43) },
    { title: 'Integrated capstone and Java-first deployment', days: [44, 45, 54] }
  ] }
];
