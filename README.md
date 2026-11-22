# Study Desk

Study Desk has a Java-first curriculum with 56 implemented sessions, a subject tree and a daily study schedule. Sessions include English notes, readings or videos, interactive examples where relevant, hands-on assignments, quizzes and interview questions. Day 1 starts on Sunday, 22 November 2026. The standard session is two hours from 9–11 PM IST, with a 12-minute recap from Day 2. Saturday and Sunday default to 390 minutes, including the two-hour core. Preferences can change the budget without changing what counts as a completed session.

## Run with account sync

Use Node.js 24 or later. The server runs without package installation.

1. Set `STUDY_DB` to an SQLite file in a persistent directory owned by the server process. It defaults to `.study-desk/study.sqlite`.
2. Provision your account with `node backend/account.mjs you@example.com` and supply a password on standard input. The command takes a minimum of 12 characters. Provision the same email with a new password to revoke its active sessions while retaining progress.
3. Start the server with `node backend/server.mjs`. It serves the app and API at `http://127.0.0.1:8000`. Adjust `HOST` and `PORT` to suit deployment. Put the public endpoint behind HTTPS.
4. Open **Progress** and sign in. Use the same account in every browser. Same-origin local use pre-fills the server address. A GitHub Pages client takes the HTTPS origin of the deployed study server. Set `STUDY_ALLOWED_ORIGINS` to the allowed frontend origin, for example `https://rishabh10045.github.io` for the project Pages site.

The authenticated account and its progress live in SQLite. The default unsigned-in mode saves to the current browser. You can explicitly import that legacy progress into an empty account. A stale revision receives the current snapshot and an error. Notes keep the unsaved draft for a deliberate conflict resolution. Reopening a completed day preserves evidence and later records. Recheck the modified session to pass its test again.

Keep a backup of the database, including a safe SQLite backup procedure for WAL mode. Use one active app instance for the local SQLite file. Serving GitHub Pages requires pushing the static frontend to the repository. Connecting different devices also requires a separately reachable HTTPS server with persistent storage.

## Study score and reminders

Check a session’s core blocks and save assignment evidence to reach 100 readiness points and unlock its objective self-check. Pass it to gain 25 further study points and finish the session. Interview prompts remain companion practice, and the app does not grade the correctness of submitted Java code by itself. Each explicitly planned date missed after 23:05 IST carries one five-point deduction. Dates marked unavailable are exempt.

For email delivery, configure `RESEND_API_KEY` and `STUDY_EMAIL_FROM` on the server with a verified sender. A learner must opt in under Progress. The running server checks due plans every minute, records reminders in a durable outbox and retries transient provider failures under a stable idempotency key. A published frontend alone cannot send background mail.

## QA

```sh
node --test checks/study-backend.test.mjs
CHROME=/usr/bin/chromium node checks/integrated.mjs
CHROME=/usr/bin/chromium node checks/qa-browser.mjs
```

The Chromium checks need `puppeteer-core` available in `NODE_PATH` or installed in a local test environment. Backend tests use isolated databases and a simulated mail provider. The cross-browser check signs into one database account from two isolated Chromium contexts and verifies completion, reopening and reload. The app is tested at the GitHub Pages project path as well as the backend origin.

## Coordination

Read [the Grok collaboration log](collab/COLLAB.md) before starting. GPT’s curriculum baseline and GFG mapping are in `course-outline.js`. Keep the stable lesson IDs when changing scheduling order. `ui/` is owned by Grok.

See the [124-topic baseline audit](collab/qa/curriculum-124-topic-audit.md), [topic-by-topic DSA evidence](collab/qa/curriculum-dsa-coverage.md), [96-session repair plan](collab/qa/curriculum-repair-plan.md), and [audit checkpoint](collab/qa/curriculum-audit-checkpoint.md).
