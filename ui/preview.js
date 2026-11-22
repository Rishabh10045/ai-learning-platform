// Integrated preview host: real Codex data + Codex persistence, rendered by StudyDesk v2.
// ?today=YYYY-MM-DD pins the IST study date (tests). Progress is stored by Codex's own rules
// (storage key ai-learning-platform.study-desk.v1, or the account API when signed in).
import { days, courses, START_DATE } from '../curriculum.js';
import { courseOutline } from '../course-outline.js';
import { studyLessons } from '../study-data.js';
import { sessionQA, passCount, assessmentVersion } from '../session-qa.js';
import { topicLessons } from '../topic-lessons.js';
import { getTopic } from '../topic-index.js';
import { lessonDiagrams } from '../lesson-diagrams.js';
import { videosForDay } from '../lesson-videos.js';
import { emptyProgress, passedAssessment, readProgress, storageKey, todayInIndia } from '../progress.js';
import { applyStudyAction } from '../study-actions.js';
import { defaultPreferences } from '../study-planner.js';
import { StudySync, defaultSyncOrigin } from '../study-sync.js';
import { accountCard } from '../study-panels.js';
import { warmupLessons, depthPackets, stretchPlans } from '../day-depth.js';
import { createCodexAdapter, createCodexHost } from './adapters/codex-adapter.js';

const S = window.StudyDeskSchedule, E = window.StudyDeskEngagement, qs = new URLSearchParams(location.search);
const codex = { days, courses, START_DATE, courseOutline, studyLessons, sessionQA, passCount, assessmentVersion, topicLessons, getTopic,
  lessonDiagrams, videosForDay, passedAssessment, readProgress, emptyProgress, storageKey, applyStudyAction, defaultPreferences, todayInIndia,
  warmupLessons, depthPackets, stretchPlans };
const pinned = S.isISO(qs.get('today')) ? qs.get('today') : null;
const today = () => pinned || todayInIndia();
const noticeEl = document.getElementById('pv-notice');
const notice = text => { noticeEl.textContent = text || ''; noticeEl.hidden = !text; };

const adapter = createCodexAdapter({ S, E, codex });
window.STUDY_DESK_PREVIEW = { adapter };
const sync = new StudySync();
let host = createCodexHost({ S, E, adapter, codex, storage: localStorage, sync, today, onError: notice });
let desk;

const pill = () => sync.account ? { state: sync.current ? 'signed-in' : 'syncing', label: 'Account · ' + sync.account.email }
  : { state: 'local', label: 'Real data · this browser' };
function refresh() {
  document.getElementById('pv-mode').textContent = sync.account ? 'Progress: study account ' + sync.account.email + ' (Codex account API).' : 'Progress: this browser (Codex storage key).';
  desk?.update({ progress: host.progress(), sync: pill(), today: today() });
  renderAccount();
}
function localHasProgress() {
  try { const s = readProgress(localStorage); return Boolean(Object.keys(s.sessions).length || Object.keys(s.personalNotes).length || Object.keys(s.topicTakeaways).length); } catch { return false; }
}
function renderAccount() {
  const body = document.getElementById('pv-account-body');
  body.replaceChildren(accountCard({ sync, defaultOrigin: defaultSyncOrigin(), localHasProgress: localHasProgress(), storageWarning: '',
    login: async (origin, email, password) => { await sync.signIn(origin, email, password); host.adopt(sync.current.state); refresh(); },
    logout: async () => { await sync.signOut(); host.reload(); refresh(); },
    pull: async () => { try { await sync.pull(); host.adopt(sync.current.state); refresh(); } catch (e) { notice(e.message); } },
    importLocal: async () => { try { await sync.importLocal(readProgress(localStorage)); host.adopt(sync.current.state); refresh(); } catch (e) { notice(e.message); } }
  }));
}

async function start() {
  if (sync.account) {
    try { await sync.pull(); host.adopt(sync.current.state); } catch (e) { notice(e.message); }
  }
  const res = S.resolveSessions(adapter.course);
  if (!res.ok) console.error('Study Desk preview: curriculum errors', res.errors);
  desk = window.StudyDesk.mount(document.getElementById('study-desk'), {
    course: adapter.course, progress: host.progress(), today: today(), sync: pill(), quizLock: id => host.quizLock(id),
    onChange: async change => {
      const r = await host.change(change);
      refresh();
      return r;
    }
  });
  renderAccount();
  window.STUDY_DESK_PREVIEW.desk = desk;
  window.STUDY_DESK_PREVIEW.host = host;
  document.body.dataset.previewReady = 'true';
}
window.addEventListener('storage', event => {
  if (sync.account || (event.key !== storageKey && event.key !== null && !String(event.key).includes('ui-sidecar'))) return;
  host.reload(); refresh();
});
start();
