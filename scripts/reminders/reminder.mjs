// Study Desk reminder job (Grok, 2026-11-23). Run by .github/workflows/study-reminders.yml, which is disabled until
// Deepak adds the secrets listed in collab/sync-and-email-plan.md. Works without secrets in --dry-run mode.
//
//   node scripts/reminders/reminder.mjs --snapshot fixture.json --now 2026-11-23T15:37:00Z --dry-run
//
// Rules (same as ui/engine/engagement-engine.js nextNudge and the engagement contract §9):
//   - quiet hours 00:00–06:00 IST: never send;
//   - at most one email per scheduled slot; the workflow has 6 slots, 3 h apart (max 6/day, every 3 h);
//   - no email when reminders are off, the plan is finished, today is a day off, or tonight's core session is done;
//   - no email when the learner studied in the last 2 hours (they are already at it).
import { readFile } from 'node:fs/promises';
import { pick, fill } from './templates.mjs';

const QUIET_START = 0, QUIET_END = 6 * 60, RECENT_MS = 2 * 3600000;
export const SLOTS_IST = ['06:37', '09:37', '12:37', '15:37', '18:37', '21:37'];   // matches the workflow cron (UTC 01:07 … 16:07)

function istMinutes(ms) { const d = new Date(ms + 330 * 60000); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
function istDate(ms) { return new Date(ms + 330 * 60000).toISOString().slice(0, 10); }
export function slotIndex(ms) {
  const m = istMinutes(ms);
  let idx = -1;
  SLOTS_IST.forEach((s, i) => { const [h, mm] = s.split(':').map(Number); if (m >= h * 60 + mm) idx = i; });
  return idx;
}

// Loads the real course and turns a localStorage snapshot ({ key: rawString }) into engine progress.
export async function loadProgress(snapshot) {
  const { S, E, codex, createCodexAdapter, createCodexHost, memoryStorage } = await import('../../ui/checks/codex-load.mjs');
  const A = createCodexAdapter({ S, E, codex });
  const host = createCodexHost({ S, E, adapter: A, codex, storage: memoryStorage(snapshot || {}) });
  return { S, E, A, codex, progress: host.progress() };
}

export function decide({ S, E, A, codex, progress }, nowMs, o = {}) {
  const prefs = E.notificationPrefs(progress), m = istMinutes(nowMs);
  const today = S.studyDayIST(nowMs);   // the study day runs until 04:00 IST
  if (!o.ignorePrefs && !prefs.email) return { send: false, reason: 'Email reminders are off in Study Desk settings' };
  if (m >= QUIET_START && m < QUIET_END) return { send: false, reason: 'Quiet hours (00:00–06:00 IST)' };
  const slot = slotIndex(nowMs);
  if (slot < 0) return { send: false, reason: 'Before the first reminder slot' };
  if (slot >= Math.min(prefs.maxPerDay, SLOTS_IST.length)) return { send: false, reason: 'Daily limit of ' + prefs.maxPerDay + ' reached' };
  const tk = E.tasksFor(A.course, progress, today);
  if (tk.finished) return { send: false, reason: 'Plan complete' };
  if (tk.off) return { send: false, reason: 'Today is a day off' };
  if (!tk.sessionN) return { send: false, reason: 'No session scheduled today' };
  if (tk.allDone) return { send: false, reason: 'Tonight’s session is done' };
  const last = Date.parse(progress.lastActiveAt || '');
  if (!isNaN(last) && nowMs - last < RECENT_MS) return { send: false, reason: 'Studied in the last 2 hours' };
  const day = codex.days[tk.sessionN - 1], main = A.lessonsByDay[tk.sessionN].main;
  const topic = (main.topics && main.topics[0] && main.topics[0].title) || main.title || day.title;
  const minutes = tk.tasks.filter(t => !t.done).length ? (day.blocks || []).reduce((a, b) => a + (b.minutes || 0), 0) || 120 : 0;
  const streak = E.streak(A.course, progress, today).current;
  const tpl = pick(istDate(nowMs), slot);
  const vars = { name: o.name || 'Deepak', day: tk.sessionN, topic, minutes, streak, link: o.link || 'https://rishabh10045.github.io/ai-learning-platform/#today' };
  return { send: true, slot, template: tpl.id, to: prefs.address || null, subject: fill(tpl.subject, vars), text: fill(tpl.body, vars),
    reason: 'Day ' + tk.sessionN + ' pending (' + tk.done + '/' + tk.total + ' core tasks done)' };
}

// Reads the snapshot from a file, or from a private GitHub repo with a READ-ONLY token (never a write token).
async function readSnapshot(args, env) {
  if (args.snapshot) return JSON.parse(await readFile(args.snapshot, 'utf8'));
  if (!env.PROGRESS_REPO || !env.PROGRESS_READ_TOKEN) throw new Error('Set PROGRESS_REPO and PROGRESS_READ_TOKEN, or pass --snapshot <file>');
  const path = env.PROGRESS_PATH || 'study-desk/progress.json';
  const r = await fetch(`https://api.github.com/repos/${env.PROGRESS_REPO}/contents/${path}`, {
    headers: { Authorization: 'Bearer ' + env.PROGRESS_READ_TOKEN, Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) throw new Error('Could not read the progress snapshot: HTTP ' + r.status);
  return r.json();
}

async function sendEmail(env, mail, idempotencyKey) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: env.REMINDER_FROM, to: [env.REMINDER_TO || mail.to], subject: mail.subject, text: mail.text })
  });
  if (!r.ok) throw new Error('Email provider returned HTTP ' + r.status);
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--ignore-prefs') a.ignorePrefs = true;
    else if (argv[i].startsWith('--')) a[argv[i].slice(2)] = argv[++i];
  }
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2)), env = process.env;
  const nowMs = args.now ? Date.parse(args.now) : Date.now();
  const ctx = await loadProgress(await readSnapshot(args, env));
  const d = decide(ctx, nowMs, { ignorePrefs: args.ignorePrefs, name: env.REMINDER_NAME });
  console.log(JSON.stringify({ at: new Date(nowMs).toISOString(), ...d, text: undefined }, null, 1));
  if (!d.send) process.exit(0);
  if (args.dryRun || !env.RESEND_API_KEY || !env.REMINDER_FROM) { console.log('--- dry run, not sent ---\n' + d.subject + '\n\n' + d.text); process.exit(0); }
  await sendEmail(env, d, 'study-desk-' + istDate(nowMs) + '-slot' + d.slot);
  console.log('sent');
}
