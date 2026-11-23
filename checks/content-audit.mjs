// node checks/content-audit.mjs [from] [to] : per-day gaps against collab/qa/content-standard-2026-11-22.md
// (Standard-weight targets per day: notes ≥ 700 words excl. code, ≥ 1 runnable Java program (HLD/GenAI days:
// a code/config block), ≥ 6 interview questions with model answers ≥ 80 words, ≥ 4 MCQs and none with 2 options,
// every MCQ and concept check with ≥ 4 options, a 30-min DSA lane, ≥ 1 video, main blocks = 78 min, and a 4h30m stretch plan on every Saturday/Sunday).
import { S, E, codex, createCodexAdapter } from '../ui/checks/codex-load.mjs';
import { fileURLToPath } from 'node:url';
const A = createCodexAdapter({ S, E, codex });
const stretchPlans = (await import('../day-depth.js')).stretchPlans || {};
const words = s => (s || '').split(/\s+/).filter(Boolean).length;
const textOf = n => n.type === 'code' || n.type === 'links' ? '' : [n.text, n.summary, ...(n.items || []).map(i => typeof i === 'string' ? i : i.title)].filter(Boolean).join(' ');
const start = new Date(codex.START_DATE + 'T00:00:00Z');
export function auditDays(from = 1, to = codex.days.length) {
const rows = [];
for (const d of codex.days.filter(d => d.number >= from && d.number <= to)) {
  const { main, lane } = A.lessonsByDay[d.number];
  const date = new Date(start.getTime() + (d.number - 1) * 864e5);
  const dow = date.getUTCDay(), weekend = dow === 0 || dow === 6;
  const notesWords = main.notes.reduce((a, n) => a + words(textOf(n)), 0);
  const all = [main, lane].filter(Boolean).flatMap(l => l.notes);
  const java = new Set(all.filter(n => n.type === 'code' && n.lang === 'java' && /static\s+void\s+main\s*\(/.test(n.text)).map(n => n.text)).size;
  const otherCode = all.filter(n => n.type === 'code' && n.lang !== 'java').length;
  // Programs in the main lesson itself (not the DSA lane). Reported, not yet enforced: see collab/qa/day-audit-2026-11-23.md (PR B).
  const mainJava = new Set(main.notes.filter(n => n.type === 'code' && n.lang === 'java' && /static\s+void\s+main\s*\(/.test(n.text)).map(n => n.text)).size;
  const iq = main.interview.length, iqGood = main.interview.filter(q => words(q.answer) >= 80).length;
  const mcq = main.quiz.questions.length, two = main.quiz.questions.filter(q => q.options.length <= 2).length;
  // Learner-facing choices: scored quiz questions plus the lettered concept checks rendered inside main, lane and warm-up notes.
  const checkOptions = n => new Set(((n.text || '').match(/^[A-Z]\. /gm) || [])).size;
  const fewQuiz = [main, lane, A.lessonsByDay[d.number].warmup].filter(Boolean).flatMap(l => l.quiz?.questions || []).filter(q => q.options.length < 4).map(q => q.id);
  const fewChecks = [main, lane, A.lessonsByDay[d.number].warmup].filter(Boolean).flatMap(l => l.notes).filter(n => n.type === 'details' && checkOptions(n) && checkOptions(n) < 4).map(n => n.summary);
  const fewOptions = fewQuiz.length + fewChecks.length;
  const vids = main.videos.filter(v => v.kind === 'video').length;
  const mainMin = d.blocks.filter(b => !['revision', 'dsa', 'foundations'].includes(b.id)).reduce((a, b) => a + b.minutes, 0);
  const topics = main.topics.map(t => t.id), packets = topics.filter(t => codex.topicLessons[t]).length;
  const design = /^(h|ai|b)-/.test(main.id) || /System design|AI|deployment/i.test(d.title);
  const gaps = [];
  if (notesWords < 700) gaps.push(`notes ${notesWords}w<700`);
  if (!java && !(design && otherCode)) gaps.push('no runnable Java');
  if (iq < 6) gaps.push(`${iq} IQs<6`);
  if (iqGood < Math.min(iq, 6)) gaps.push(`${iq - iqGood} IQ answers <80w`);
  if (mcq < 4) gaps.push(`${mcq} MCQs<4`);
  if (two) gaps.push(`${two} two-option MCQ`);
  if (fewOptions) gaps.push(`${fewOptions} question(s) with <4 options: ${[...fewQuiz, ...fewChecks].join(' | ')}`);
  if (!lane) gaps.push('no DSA lane');
  if (mainMin !== 78) gaps.push(`main ${mainMin}≠78 min`);
  if (!vids) gaps.push('no video');
  if (packets < topics.length) gaps.push(`packets ${packets}/${topics.length}`);
  if (weekend && !stretchPlans[d.number]) gaps.push('no weekend stretch plan');
  rows.push({ day: d.number, date: date.toISOString().slice(0, 10), dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow], title: d.title, mainId: main.id,
    notesWords, java, mainJava, otherCode, iq, iqGood, mcq, two, fewOptions, lane: !!lane, vids, mainMin, packets: packets + '/' + topics.length, weekend, stretch: !!stretchPlans[d.number], gaps });
}
return rows;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
const from = +(process.argv[2] || 1), to = +(process.argv[3] || codex.days.length);
const rows = auditDays(from, to);
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
else {
  console.log('| Day | Date | Title | Notes w | Java (main) | IQ (≥80w) | MCQ (2-opt) | DSA lane | Video | Main min | Packets | Stretch | Gaps |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.day} | ${r.dow} ${r.date} | ${r.title} | ${r.notesWords} | ${r.java} (${r.mainJava})${r.otherCode ? ' +' + r.otherCode + ' other' : ''} | ${r.iq} (${r.iqGood}) | ${r.mcq} (${r.two}) | ${r.lane ? 'yes' : '**no**'} | ${r.vids} | ${r.mainMin} | ${r.packets} | ${r.weekend ? (r.stretch ? 'yes' : '**no**') : '—'} | ${r.gaps.join('; ') || 'meets standard'} |`);
  console.log(`\n${rows.filter(r => !r.gaps.length).length}/${rows.length} days meet the standard.`);
}
// Any question with fewer than four options fails the run (exit 1), so CI and local runs cannot pass with one.
const short = rows.filter(r => r.fewOptions);
if (short.length) { console.error(`FAIL: questions with fewer than 4 options on day(s) ${short.map(r => r.day).join(', ')}`); process.exitCode = 1; }
}
