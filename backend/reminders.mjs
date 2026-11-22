import { createHash } from 'node:crypto';
import { decodeProgress, inTransaction } from './database.mjs';
import { indiaTime, missedPlannedSessions } from '../study-planner.js';

const minute = 60000;
const dayMillis = 24 * 60 * minute;

function eventId(userId, date) {
  return 'study-reminder-' + createHash('sha256').update(userId + ':' + date).digest('hex');
}

export function createReminderSender({ apiKey, from } = {}) {
  if (!apiKey || !from) return null;
  return async ({ id, email, missing }) => {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey, 'Idempotency-Key': id
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        from, to: [email],
        subject: 'Study Desk · Day ' + missing.day + ' is still pending',
        text: 'Your IST study plan for ' + missing.date + ' is incomplete. Day ' + missing.day +
          ' · ' + missing.title + ' stays pending. Open Study Desk to continue where you left off.'
      })
    });
    if (!result.ok) throw new Error('Email provider returned HTTP ' + result.status + '.');
  };
}

export async function runReminderSweep(db, send, now = new Date()) {
  if (!send) return { sent: 0, failed: 0 };
  const timestamp = now.valueOf();
  const earliest = indiaTime(new Date(timestamp - dayMillis)).date;
  const profiles = db.prepare(`
    SELECT users.id, study_progress.document FROM users
    JOIN study_progress ON study_progress.user_id = users.id
  `).all();
  for (const profile of profiles) {
    const state = decodeProgress(profile.document);
    if (!state.preferences.emailReminders) continue;
    for (const missing of missedPlannedSessions(state, now)) {
      if (missing.date < earliest || state.sessions[missing.day]?.completedOn) continue;
      db.prepare(`
        INSERT OR IGNORE INTO reminder_outbox(id, user_id, planned_date, day, status, next_at, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `).run(eventId(profile.id, missing.date), profile.id, missing.date, missing.day, timestamp, timestamp);
    }
  }

  db.prepare(`
    UPDATE reminder_outbox SET status = 'failed'
    WHERE status = 'pending' AND lease_until <= ? AND created_at < ?
  `).run(timestamp, timestamp - 12 * 60 * minute);

  let sent = 0;
  let failed = 0;
  const jobs = db.prepare(`
    SELECT reminder_outbox.*, users.email FROM reminder_outbox
    JOIN users ON users.id = reminder_outbox.user_id
    WHERE status = 'pending' AND next_at <= ? AND lease_until <= ?
    ORDER BY next_at LIMIT 20
  `).all(timestamp, timestamp);
  for (const job of jobs) {
    const claim = inTransaction(db, () => db.prepare(`
      UPDATE reminder_outbox SET lease_until = ?, attempts = attempts + 1
      WHERE id = ? AND status = 'pending' AND lease_until <= ?
    `).run(timestamp + 2 * minute, job.id, timestamp).changes);
    if (!claim) continue;

    const stored = db.prepare('SELECT document FROM study_progress WHERE user_id = ?').get(job.user_id);
    const state = decodeProgress(stored?.document);
    const missing = missedPlannedSessions(state, now).find(item => item.date === job.planned_date && item.day === job.day);
    if (!state.preferences.emailReminders || !missing || state.sessions[job.day]?.completedOn) {
      db.prepare("UPDATE reminder_outbox SET status = 'canceled', lease_until = 0 WHERE id = ?").run(job.id);
      continue;
    }
    try {
      await send({ id: job.id, email: job.email, missing });
      db.prepare("UPDATE reminder_outbox SET status = 'sent', lease_until = 0, sent_at = ? WHERE id = ?")
        .run(timestamp, job.id);
      sent++;
    } catch {
      const attempts = job.attempts + 1;
      db.prepare('UPDATE reminder_outbox SET status = ?, lease_until = 0, next_at = ? WHERE id = ?')
        .run(attempts >= 6 ? 'failed' : 'pending', timestamp + 2 ** attempts * minute, job.id);
      failed++;
    }
  }
  return { sent, failed };
}
