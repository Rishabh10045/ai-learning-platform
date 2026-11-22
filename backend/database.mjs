import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { emptyProgress, readProgress } from '../progress.js';

const derive = promisify(scrypt);
const tokenHash = token => createHash('sha256').update(token).digest('hex');
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const dummyDigest = Buffer.alloc(64);

export const defaultDatabase = () => process.env.STUDY_DB || '.study-desk/study.sqlite';

export function openStudyDatabase(filename = defaultDatabase()) {
  if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS access_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS session_expiration ON access_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS study_progress (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL CHECK(revision >= 0),
      document TEXT NOT NULL CHECK(json_valid(document)),
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reminder_outbox (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      planned_date TEXT NOT NULL,
      day INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'sent', 'canceled', 'failed')),
      attempts INTEGER NOT NULL DEFAULT 0,
      next_at INTEGER NOT NULL,
      lease_until INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      sent_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS outbox_ready ON reminder_outbox(status, next_at, lease_until);
  `);
  return db;
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : '';
}

export async function accountPasswordHash(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new Error('Use a password between 12 and 256 characters.');
  }
  const salt = randomBytes(16).toString('hex');
  const digest = await derive(password, salt, 64);
  return salt + ':' + digest.toString('hex');
}

export function setAccount(db, email, passwordHash) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Enter a valid email address.');
  return inTransaction(db, () => {
    const user = db.prepare(`
      INSERT INTO users(email, password_hash) VALUES (?, ?)
      ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
      RETURNING id, email
    `).get(normalized, passwordHash);
    db.prepare('DELETE FROM access_sessions WHERE user_id = ?').run(user.id);
    return user;
  });
}

export async function verifyAccount(db, email, password) {
  const address = normalizeEmail(email);
  const user = address && db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(address);
  if (typeof password !== 'string' || password.length > 256) return null;
  const [salt, digest] = user ? user.password_hash.split(':') : ['d6b42312a728118f687bf245495515a0', null];
  const actual = await derive(password, salt, 64);
  const expected = digest ? Buffer.from(digest, 'hex') : dummyDigest;
  return timingSafeEqual(actual, expected) && user ? { id: user.id, email: user.email } : null;
}

export function openAccessSession(db, user, now) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = now + sessionLifetime;
  db.prepare('DELETE FROM access_sessions WHERE expires_at <= ?').run(now);
  db.prepare('INSERT INTO access_sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash(token), user.id, expiresAt);
  return { token, expiresAt };
}

export function findSessionAccount(db, token, now) {
  if (!token || !/^[\w-]{43}$/.test(token)) return null;
  return db.prepare(`
    SELECT users.id, users.email
    FROM access_sessions JOIN users ON users.id = access_sessions.user_id
    WHERE access_sessions.token_hash = ? AND access_sessions.expires_at > ?
  `).get(tokenHash(token), now);
}

export function closeAccessSession(db, token) {
  if (token) db.prepare('DELETE FROM access_sessions WHERE token_hash = ?').run(tokenHash(token));
}

export function inTransaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = action();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function decodeProgress(document) {
  return document ? readProgress({ getItem: () => document }) : emptyProgress();
}

export function getProgress(db, userId) {
  const entry = db.prepare('SELECT revision, document FROM study_progress WHERE user_id = ?').get(userId);
  return { revision: entry?.revision ?? 0, state: decodeProgress(entry?.document) };
}

export function changeProgress(db, userId, revision, now, newState) {
  return inTransaction(db, () => {
    const current = getProgress(db, userId);
    if (current.revision !== revision) return { conflict: true, ...current };
    const state = newState(current.state);
    const next = { revision: revision + 1, state };
    db.prepare(`
      INSERT INTO study_progress(user_id, revision, document, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        revision = excluded.revision, document = excluded.document, updated_at = excluded.updated_at
    `).run(userId, next.revision, JSON.stringify(state), now);
    return { conflict: false, ...next };
  });
}
