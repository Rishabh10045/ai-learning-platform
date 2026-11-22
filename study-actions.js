import {
  beginDay, checkBlock, finishDay, reopenDay, saveNotes, savePersonalNotes, saveUdemyLecture, saveVideoProgress,
  saveTopicTakeaway, setPlannedDay, setStudyPreferences, setUnavailable, submitAssessment
} from './progress.js';
import { days } from './curriculum.js';

const operations = {
  begin: (state, action, today) => beginDay(state, action.day, today),
  block: (state, action, today) => checkBlock(state, action.day, action.id, action.done, today),
  evidence: (state, action, today) => saveNotes(state, action.day, action, today),
  notes: (state, action) => savePersonalNotes(state, action.day, action.text),
  topicTakeaway: (state, action) => saveTopicTakeaway(state, action),
  lecture: (state, action) => saveUdemyLecture(state, action.day, action),
  watch: (state, action) => saveVideoProgress(state, action.day, action.id, action.minutes, action.watched),
  finish: (state, action, today) => finishDay(state, action.day, today),
  reopen: (state, action, today) => reopenDay(state, action.day, today),
  availability: (state, action) => setUnavailable(state, action.date, action.unavailable),
  plan: (state, action, today) => setPlannedDay(state, action.date, action.day, today),
  preferences: (state, action) => setStudyPreferences(state, action),
  assessment: (state, action, today) => submitAssessment(state, action.day, action.choices, today, action.bankVersion)
};

const dayActions = new Set(['begin', 'block', 'evidence', 'notes', 'lecture', 'watch', 'finish', 'reopen', 'assessment']);

export function applyStudyAction(state, action, today) {
  if (!action || typeof action.kind !== 'string' || !Object.hasOwn(operations, action.kind)) {
    throw new Error('Unknown study action.');
  }
  if ((action.kind === 'block' && typeof action.done !== 'boolean') ||
      (action.kind === 'availability' && typeof action.unavailable !== 'boolean') ||
      (action.kind === 'watch' && typeof action.watched !== 'boolean')) throw new Error('Choose a valid status.');
  if (dayActions.has(action.kind) &&
      (!Number.isInteger(action.day) || !days[action.day - 1])) throw new Error('Unknown study day.');
  operations[action.kind](state, action, today);
}
