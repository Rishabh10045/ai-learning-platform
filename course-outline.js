import { courses, days, START_DATE } from './curriculum.js';

const span = (first, last) => Array.from({ length: last - first + 1 }, (_, n) => first + n);
const trackSpecs = [
  ['java', 'Java', [
    ['language', 'Objects, collections, exceptions, generics and streams', [1, 4, 5, 6]],
    ['concurrency', 'Threads, locks, executors and JVM diagnostics', [2, 3, 7, 46]]
  ]],
  ['spring', 'Spring Boot', [
    ['web', 'Maven, Spring MVC, REST and validation', [9, 10, 11]],
    ['persistence', 'Data access, persistence and integration tests', [16, 47]],
    ['security', 'Security, OAuth and deployment', [33, 34, 48]],
    ['java-ai', 'Spring AI adapter', [37]]
  ]],
  ['sql', 'SQL and data', [
    ['transactions', 'Schema, JDBC, transactions and locking', span(12, 15)],
    ['querying', 'Idempotency and data placement', [20, 21]]
  ]],
  ['lld', 'Low-level design', [
    ['design', 'Class responsibilities, SOLID and lifecycles', [8, 19]],
    ['project', 'Capstone and machine-coding review', [44, 45]]
  ]],
  ['hld', 'System design', [
    ['scale', 'Shared state, requirements, caching and scalability', [17, 18, 22, 23, 24, 25]],
    ['distributed', 'Gateway, messaging and reliability', span(49, 51)]
  ]],
  ['dsa', 'DSA in Java', [
    ['linear', 'Complexity, arrays, windows, lists and stacks', span(26, 29)],
    ['nonlinear', 'Trees, graphs, DP and depth problems', [30, 31, 32, 52, 53, 55]]
  ]],
  ['ai', 'AI engineering', [
    ['llm', 'LLMs, prompts and output contracts', [35, 36]],
    ['grounding', 'Retrieval, evaluation, tools and operational safety', span(38, 43)],
    ['deployment', 'Java-first model deployment', [54]]
  ]]
];

const addedSessions = new Set([1, 2, 3, 8, 13, 14, 15, 17, 19, 20, 24, 36, 37, 40, 42, 44, 45, 46, 48, 51, 54, 55]);
const availableSources = new Set(['java', 'design', 'dsa', 'genai', 'lld', 'supplement']);

function toLesson(number) {
  const day = days[number - 1];
  return {
    id: day.topics[0].toLowerCase(),
    title: day.title,
    source: addedSessions.has(number) ? 'added' : day.sources[0],
    sourceRefs: day.sources.filter(source => availableSources.has(source)),
    estMinutes: day.blocks.filter(block => block.id !== 'revision').reduce((total, block) => total + block.minutes, 0),
    topicIds: day.topics
  };
}

export const courseOutline = {
  startDate: START_DATE, timeZone: 'Asia/Kolkata',
  tracks: trackSpecs.map(([id, title, modules]) => ({ id, title, modules: modules.map(([mid, label, numbers]) => ({
    id: mid, title: label, lessons: numbers.map(toLesson)
  })) })),
  days: days.map(day => ({
    day: day.number,
    lessonIds: [toLesson(day.number).id],
    revisionMinutes: day.blocks.find(block => block.id === 'revision')?.minutes ?? 0,
    plannedMinutes: day.blocks.reduce((total, block) => total + block.minutes, 0)
  }))
};

// These syllabus groups come from the public PDFs, independent of what the course currently schedules.
// The day references indicate where we teach part or all of each group. Empty references are extensions.
const coverageSpecs = [
  ['java', 'GFG · Java Backend', [
    ['OOP, JVM, language contracts and exceptions', [1, 5, 7, 46]],
    ['Generics, collections, hashing and stream pipelines', [4, 6, 26]],
    ['Multithreading, pools, synchronization and executor APIs', [2, 3, 7, 46]],
    ['Maven, Spring MVC and REST', [9, 10, 11]],
    ['JDBC, DDL/DML, JPA, AOP and transactions', [12, 13, 16, 47]],
    ['JUnit, mocks and controller testing', [8, 10, 11, 16, 33]],
    ['Redis, authentication and OAuth 2.0', [22, 33, 48]],
    ['Service boundaries, Kafka, resiliency and deploy', [17, 23, 34, 49, 50]],
    ['Source exercises for expense-sharing and property rental', []]
  ]],
  ['design', 'GFG · System Design', [
    ['Requirements, capacity and scalability', [17, 18, 24]],
    ['Storage, consistency, indexes, replication and cache', [21, 22, 25]],
    ['Multiple messaging patterns and API styles', [23, 49, 50]],
    ['Boundaries, reliability, security and instrumentation', [25, 33, 34, 48, 51]],
    ['Cloud, CI/CD and representative architecture comparisons', [34, 49, 51]],
    ['Full service mesh and GitOps labs', []],
    ['All source capstone implementations', []]
  ]],
  ['dsa', 'GFG · DSA and System Design', [
    ['Complexity, arrays, math, prefix sums and sliding windows', [26, 27, 53]],
    ['Hashing, recursion, search and sorting', [4, 26, 27, 28, 30, 52]],
    ['Lists, stack and queue operations, LRU and backtracking', [28, 29, 31, 52]],
    ['Trees, search ordering and heaps', [30]],
    ['Traversal, shortest paths, greedy and dynamic programming', [31, 32, 52, 53]],
    ['System Design modules shared with the HLD programme', [18, 21, 22, 23, 25, 49, 50, 51]],
    ['Remaining DSA topics and variants listed in the detailed audit', []]
  ]],
  ['genai', 'GFG · AI Engineering', [
    ['Neural foundations, transformers and LLM behavior', [1, 35]],
    ['Prompt design, model selection and transfer-learning decisions', [35, 36, 43]],
    ['Embeddings, semantic retrieval and RAG', [38, 39, 40]],
    ['Local models, agents and the Model Context Protocol', [41, 54]],
    ['Evaluation, operational constraints and deployment', [40, 42, 44, 54]],
    ['Python-only orchestration, training and notebook implementations', []]
  ]]
];

export const coverageCurriculum = {
  title: 'Study Desk · GFG syllabus mapping',
  startDate: START_DATE,
  timeZone: 'Asia/Kolkata',
  tracks: coverageSpecs.map(([id, name, topics]) => ({
    id, name, sourceUrl: courses[id].links[1][1],
    syllabus: topics.map(([title], index) => ({ id: id + '-' + (index + 1), title }))
  })),
  days: days.map(day => ({
    day: day.number,
    title: day.title,
    blocks: coverageSpecs.flatMap(([track, , topics]) => topics.flatMap(([title, numbers], index) =>
      numbers.includes(day.number) ? [{ track, title, topicId: track + '-' + (index + 1) }] : []))
  }))
};
