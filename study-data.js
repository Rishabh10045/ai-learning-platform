import { days, dayTracks, tracks } from './curriculum.js';
import { lessonContent, coachPrompt } from './lesson-content.js';
import { workedExamples } from './worked-examples.js';
import { lessonDetails } from './lesson-details.js';
import { plan } from './syllabus.js';
import { sessionQA } from './session-qa.js';

const practiceIds = new Set(['lab', 'practice', 'http', 'ai', 'dsa']);

function blockKind(block) {
  if (block.id === 'revision') return 'revision';
  if (block.id === 'review') return 'coach';
  return practiceIds.has(block.id) ? 'practice' : 'learn';
}

export const studyCurriculum = {
  title: 'Study Desk', subtitle: 'Java Backend & AI', sessionWindow: plan.slot,
  days: days.map(day => ({
    day: day.number,
    title: day.title,
    summary: day.intro,
    tracks: dayTracks(day).map(id => tracks[id]),
    topicIds: day.topics,
    revisionOf: day.number > 1 ? day.number - 1 : undefined,
    blocks: day.blocks.map(block => ({ ...block, kind: blockKind(block) }))
  }))
};

function toTypedNotes(day) {
  const detail = lessonDetails[day.number];
  const [exampleTitle, example] = workedExamples[day.number];
  const sections = [...lessonContent[day.number].sections];
  if (detail?.section) sections.push(detail.section);
  const paragraphs = sections.flatMap(([title, ...body]) => [
    { type: 'h', text: title },
    ...body.map(text => ({ type: 'p', text }))
  ]);
  const code = detail?.code;
  return [
    ...paragraphs, { type: 'h', text: 'Worked example · ' + exampleTitle }, { type: 'p', text: example },
    ...(code ? [{ type: 'h4', text: code[0] }, { type: 'code', lang: code[1], text: code[2] }] : [])
  ];
}

export const studyLessons = Object.fromEntries(days.map(day => {
  const lesson = lessonContent[day.number];
  const qa = sessionQA[day.number];
  const practice = day.blocks.filter(block => practiceIds.has(block.id)).map(block => ({
    id: block.id, title: block.title, minutes: block.minutes, prompt: block.practice,
    acceptance: block.checks || (block.id === 'practice' ? [qa.test] : [])
  }));
  return [day.number, {
    objectives: [lesson.check], notes: toTypedNotes(day), revision: lesson.quick, practice,
    coach: [
      { id: 'study', label: 'Study mode', prompt: 'Learn the concept and get feedback on your coding attempt.',
        copyLabel: 'Copy study prompt', copyText: coachPrompt(day, 'teach') },
      { id: 'interview', label: 'Mock interview', prompt: qa.questions.length + ' topic questions with follow-ups and a changed scenario.',
        copyLabel: 'Copy interview prompt', copyText: coachPrompt(day, 'interview') +
          '\n\nAsk the following in order, one per turn. After each answer, give technical and delivery feedback: ' +
          qa.questions.map((question, index) => '\n' + (index + 1) + '. ' + question).join('') }
    ]
  }];
}));
