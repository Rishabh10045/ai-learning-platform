import { lessonDetails } from './lesson-details.js';
import { lessonDiagrams } from './lesson-diagrams.js';
import { workedExamples } from './worked-examples.js';
import { foundationNotes } from './notes/foundations.js';
import { backendNotes } from './notes/backend.js';
import { systemsNotes } from './notes/systems.js';
import { practiceNotes } from './notes/practice.js';
import { aiNotes } from './notes/ai.js';
import { advancedNotes } from './notes/advanced.js';

export const lessonContent = {
  ...foundationNotes,
  ...backendNotes,
  ...systemsNotes,
  ...practiceNotes,
  ...aiNotes,
  ...advancedNotes,
};

export function coachPrompt(day, mode) {
  const lesson = lessonContent[day.number];
  const extra = lessonDetails[day.number];
  const diagram = lessonDiagrams[day.number];
  const questions = day.blocks.filter(block => block.recall && block.id !== 'revision');
  const interview = questions[0].recall;
  const practice = day.blocks.find(block => block.id === 'practice' || block.id === 'lab');
  const readings = day.blocks.flatMap(block => block.readings || []);
  if (extra?.source) {
    const [title, url] = extra.source;
    if (!readings.some(source => source.url === url)) readings.push({ title, url });
  }
  const conceptTitles = lesson.sections.map(([title]) => title);
  if (extra?.section) conceptTitles.push(extra.section[0]);
  const modeInstructions = mode === 'interview'
    ? 'Begin in mock interview mode after I confirm I have studied. Ask the interview question first and wait. Once I answer, give separate 0–4 scores for correctness, depth, delivery and evidence. Clarify ambiguous wording before scoring. Ask the changed scenario as a separate turn. Share a 60–90 second model answer only after I attempt it or request it.'
    : 'Begin by checking what I already know with one short question. If the topic is unfamiliar, teach from fundamentals using a concrete example and a trace or diagram. Give the coding task in small steps, wait for my attempt and offer one graduated hint at a time. After I demonstrate the task, switch to the interview question and wait for my response.';
  return [
    'Act as my Java backend study coach for Day ' + day.number + ', ' + day.title + ' (' + day.topics.join(', ') + ').',
    'Teach in natural Hinglish. Write durable notes in clear English. Ask one question at a time and wait for my answer. Use Java for examples. Keep technical correctness and delivery separate.',
    modeInstructions,
    'Core concepts: ' + conceptTitles.join('; ') + '.',
    ...(diagram ? ['Walkthrough: ' + diagram.title + '. ' + diagram.question] : []),
    'Worked example: ' + workedExamples[day.number].join(' — '),
    'Assignment: ' + practice.practice,
    ...(practice.checks || []).map(check => 'Acceptance criterion: ' + check),
    'Evidence to verify: ' + lesson.check,
    'Interview question: ' + interview,
    'Changed scenario: ' + lesson.variation,
    'Readings: ' + readings.map(({ title, url }) => title + ' — ' + url).join('\n'),
    'Treat a hinted response as practice. Ask me to explain a trade-off and use evidence from my run before marking mastery. Finish with a brief correction and a revisit after 1, 3 or 7 study days.'
  ].join('\n\n');
}
