import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  changeProgress, closeAccessSession, decodeProgress, findSessionAccount, getProgress, normalizeEmail,
  openAccessSession, openStudyDatabase, verifyAccount
} from './database.mjs';
import { createReminderSender, runReminderSweep } from './reminders.mjs';
import { applyStudyAction } from '../study-actions.js';
import { todayInIndia } from '../progress.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiPrefix = '/api/v1';
const publicFiles = new Set([
  'index.html', 'app.js', 'styles.css', 'assessment-scenarios.js', 'course-outline.js', 'curriculum.js', 'interview-guides.js',
  'lesson-content.js', 'lesson-details.js',
  'lesson-diagrams.js', 'lesson-videos.js', 'lesson-visuals.js', 'progress.js', 'session-qa.js',
  'study-actions.js', 'study-data.js', 'study-panels.js', 'study-planner.js', 'study-sync.js', 'syllabus.js',
  'topic-index.js', 'topic-lessons.js', 'worked-examples.js', 'day-depth.js',
  'ui/study-desk.css', 'ui/study-desk.js', 'ui/engine/schedule-engine.js', 'ui/engine/engagement-engine.js',
  'ui/adapters/codex-adapter.js'
]);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const privateHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(response, status, value) {
  response.writeHead(status, { ...privateHeaders, 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function input(request, limit = 32768) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    throw new HttpError(415, 'Send a JSON request.');
  }
  if (Number(request.headers['content-length']) > limit) throw new HttpError(413, 'The request is too large.');
  const chunks = [];
  let length = 0;
  for await (const part of request) {
    length += part.length;
    if (length > limit) throw new HttpError(413, 'The request is too large.');
    chunks.push(part);
  }
  try {
    return JSON.parse(Buffer.concat(chunks, length).toString('utf8'));
  } catch {
    throw new HttpError(400, 'The request body is invalid JSON.');
  }
}

function requireRevision(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new HttpError(400, 'A valid save revision is required.');
}

async function serveApp(path, method, response) {
  if (method !== 'GET' && method !== 'HEAD') throw new HttpError(404, 'Route not found.');
  const filename = path.slice(1) || 'index.html';
  if (!publicFiles.has(filename) && !/^notes\/(advanced|ai|backend|foundations|practice|systems)\.js$/.test(filename)) {
    throw new HttpError(404, 'Page not found.');
  }
  const location = resolve(root, filename);
  const info = await stat(location);
  response.writeHead(200, {
    'Content-Type': types[extname(filename)], 'Content-Length': info.size, 'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"
  });
  if (method === 'HEAD') response.end();
  else createReadStream(location).pipe(response);
}

export function createStudyServer({
  db = openStudyDatabase(), now = () => new Date(),
  allowedOrigins = (process.env.STUDY_ALLOWED_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean),
  sendReminder = createReminderSender({ apiKey: process.env.RESEND_API_KEY, from: process.env.STUDY_EMAIL_FROM })
} = {}) {
  const allowed = new Set(allowedOrigins);
  const loginAttempts = new Map();
  let activeLogins = 0;
  async function serveApi(request, response, path) {
    const origin = request.headers.origin;
    if (origin) {
      const host = request.headers.host;
      const sameOrigin = origin === 'http://' + host || origin === 'https://' + host;
      if (!sameOrigin && !allowed.has(origin)) throw new HttpError(403, 'This app origin is not allowed.');
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        ...privateHeaders, 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600'
      });
      response.end();
      return;
    }

    const clock = now();
    const timestamp = clock.valueOf();
    const token = (request.headers.authorization || '').replace(/^Bearer /, '');
    if (path === '/session' && request.method === 'POST') {
      const body = await input(request, 4096);
      const address = normalizeEmail(body?.email);
      const ip = request.socket.remoteAddress || 'unknown';
      if (loginAttempts.size > 1024) {
        for (const [key, record] of loginAttempts) if (record.reset <= timestamp) loginAttempts.delete(key);
      }
      if (loginAttempts.size > 4096 || activeLogins >= 4) throw new HttpError(429, 'Try signing in again shortly.');
      const keys = ['ip:' + ip, 'account:' + (address || 'invalid')];
      for (const key of keys) {
        const record = loginAttempts.get(key);
        if (record && record.reset > timestamp && record.count >= (key.startsWith('ip:') ? 40 : 10)) {
          throw new HttpError(429, 'Too many sign-in attempts. Try again later.');
        }
      }
      for (const key of keys) {
        const record = loginAttempts.get(key);
        loginAttempts.set(key, record && record.reset > timestamp ?
          { count: record.count + 1, reset: record.reset } : { count: 1, reset: timestamp + 600000 });
      }
      activeLogins++;
      let user;
      try {
        user = await verifyAccount(db, body?.email, body?.password);
      } finally {
        activeLogins--;
      }
      if (!user) throw new HttpError(401, 'The email or password did not match.');
      loginAttempts.delete(keys[1]);
      json(response, 200, { ...openAccessSession(db, user, timestamp), email: user.email,
        remindersConfigured: Boolean(sendReminder), ...getProgress(db, user.id) });
      return;
    }

    const user = findSessionAccount(db, token, timestamp);
    if (!user) throw new HttpError(401, 'Sign in to sync your study progress.');
    if (path === '/session' && request.method === 'DELETE') {
      closeAccessSession(db, token);
      json(response, 200, {});
    } else if (path === '/progress' && request.method === 'GET') {
      json(response, 200, { email: user.email, remindersConfigured: Boolean(sendReminder), ...getProgress(db, user.id) });
    } else if (path === '/progress' && request.method === 'PATCH') {
      const body = await input(request);
      requireRevision(body?.revision);
      const result = changeProgress(db, user.id, body.revision, timestamp, state => {
        try {
          if (body.action?.kind === 'preferences' && body.action.emailReminders && !sendReminder) {
            throw new Error('Email delivery must be configured on the server first.');
          }
          applyStudyAction(state, body.action, todayInIndia(clock));
        } catch (error) {
          throw new HttpError(422, error.message);
        }
        return state;
      });
      json(response, result.conflict ? 409 : 200, result);
    } else if (path === '/import' && request.method === 'POST') {
      const body = await input(request, 1500000);
      if (body?.revision !== 0 || !body.state || typeof body.state !== 'object' || Array.isArray(body.state)) {
        throw new HttpError(422, 'Import is available only for an unused online account.');
      }
      const result = changeProgress(db, user.id, 0, timestamp, () => {
        const imported = decodeProgress(JSON.stringify(body.state));
        imported.preferences.emailReminders = false;
        imported.assessments = {};
        return imported;
      });
      json(response, result.conflict ? 409 : 200, result);
    } else {
      throw new HttpError(404, 'Route not found.');
    }
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      const path = decodeURIComponent(url.pathname);
      if (path.startsWith(apiPrefix + '/')) await serveApi(request, response, path.slice(apiPrefix.length));
      else await serveApp(path, request.method, response);
    } catch (error) {
      if (response.headersSent || response.destroyed) return;
      const status = error.status || (error instanceof URIError ? 400 : 500);
      if (status === 500) console.error('Study Desk request failed:', error.code || error.name);
      json(response, status, { message: status === 500 ? 'A server error interrupted the request.' : error.message });
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  let activeSweep = null;
  const runReminders = () => activeSweep ??= runReminderSweep(db, sendReminder, now())
    .finally(() => { activeSweep = null; });
  const timer = sendReminder ? setInterval(() => {
    runReminders().catch(error => console.error('Study Desk reminder sweep failed:', error.code || error.name));
  }, 60000) : null;
  timer?.unref();
  server.on('close', () => clearInterval(timer));
  return { server, db, runReminders, settleReminders: () => activeSweep };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server, db, settleReminders } = createStudyServer();
  const port = Number(process.env.PORT || 8000);
  const host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () => console.log('Study Desk server listening on ' + host + ':' + port));
  const shutdown = () => server.close(async () => {
    await settleReminders()?.catch(() => {});
    db.close();
  });
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
