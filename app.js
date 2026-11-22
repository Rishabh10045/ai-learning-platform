// Study Desk root host (GitHub Pages root and backend/server.mjs).
// Real Codex data + Codex persistence, rendered by the Study Desk v2 UI through ui/adapters/codex-adapter.js.
// Storage key, progress shape and account API are unchanged (progress.js / study-sync.js), so existing
// browser progress and study accounts keep working. ?today=YYYY-MM-DD pins the IST study date (tests only).
// Root switch done by Grok on 2026-11-22 while Codex was offline; the previous v1 host is in git history (app.js @ 76d7e56).
import { days, courses, START_DATE } from './curriculum.js';
import { courseOutline } from './course-outline.js';
import { studyLessons } from './study-data.js';
import { sessionQA, passCount, assessmentVersion } from './session-qa.js';
import { topicLessons } from './topic-lessons.js';
import { getTopic } from './topic-index.js';
import { lessonDiagrams } from './lesson-diagrams.js';
import { videosForDay } from './lesson-videos.js';
import { emptyProgress, passedAssessment, readProgress, storageKey, todayInIndia } from './progress.js';
import { applyStudyAction } from './study-actions.js';
import { defaultPreferences } from './study-planner.js';
import { StudySync, defaultSyncOrigin } from './study-sync.js';
import { accountCard } from './study-panels.js';
import { warmupLessons, depthPackets, stretchPlans } from './day-depth.js';
import { createCodexAdapter, createCodexHost } from './ui/adapters/codex-adapter.js';

const S = window.StudyDeskSchedule, E = window.StudyDeskEngagement, qs = new URLSearchParams(location.search);
const codex = { days, courses, START_DATE, courseOutline, studyLessons, sessionQA, passCount, assessmentVersion, topicLessons, getTopic,
  lessonDiagrams, videosForDay, passedAssessment, readProgress, emptyProgress, storageKey, applyStudyAction, defaultPreferences, todayInIndia,
  warmupLessons, depthPackets, stretchPlans };
const pinned = S.isISO(qs.get('today')) ? qs.get('today') : null;
const today = () => pinned || todayInIndia();
const noticeEl = document.getElementById('notice');
const notice = text => { noticeEl.textContent = text || ''; noticeEl.hidden = !text; };

const adapter = createCodexAdapter({ S, E, codex });
const sync = new StudySync();
const host = createCodexHost({ S, E, adapter, codex, storage: localStorage, sync, today, onError: notice });
window.STUDY_DESK = { adapter, host };
let desk;

const pill = () => sync.account ? { state: sync.current ? 'signed-in' : 'syncing', label: 'Account · ' + sync.account.email }
  : { state: 'local', label: 'Saved in this browser' };
function refresh() {
  desk?.update({ progress: host.progress(), sync: pill(), today: today() });
  renderAccount();
}
function localHasProgress() {
  try { const s = readProgress(localStorage); return Boolean(Object.keys(s.sessions).length || Object.keys(s.personalNotes).length || Object.keys(s.topicTakeaways).length); } catch { return false; }
}
let accountSlot = null;
function renderAccount(slot) {
  if (slot) accountSlot = slot;
  const body = accountSlot;
  if (!body || !body.isConnected) return;
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
  if (!res.ok) console.error('Study Desk: curriculum errors', res.errors);
  desk = window.StudyDesk.mount(document.getElementById('app'), {
    course: adapter.course, progress: host.progress(), today: today(), sync: pill(), quizLock: id => host.quizLock(id),
    headerLinks: [{ label: 'Account', href: '#account' }], renderAccount,
    onChange: async change => { const r = await host.change(change); refresh(); return r; }
  });
  window.STUDY_DESK.desk = desk;
  window.STUDY_DESK_PREVIEW = window.STUDY_DESK; // name kept for ui/checks
  document.body.dataset.previewReady = 'true';
  document.body.dataset.ready = 'true';
}
window.addEventListener('storage', event => {
  if (sync.account || (event.key !== storageKey && event.key !== null && !String(event.key).includes('ui-sidecar'))) return;
  host.reload(); refresh();
});
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !sync.account || document.querySelector('textarea:focus')) return;
  try { await sync.pull(); host.adopt(sync.current.state); refresh(); } catch {}
});
start().catch(error => { console.error(error); notice('Study Desk could not start: ' + error.message); });
