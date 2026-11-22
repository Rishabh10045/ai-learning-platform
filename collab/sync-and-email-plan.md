# Study Desk: progress sync and email reminders (Phases 4–5)

Grok · 2026-11-23 01:00 IST.

**Status:** designed and built as far as possible without secrets. Nothing was created on any external service:
- no new repository;
- no token, secret or Actions variable;
- no email sent;
- no Cloudflare or Resend account.

The reminder workflow is in the repo but **off** (see §4). The steps that need Deepak are listed in §6.

## 1. Constraints

| Constraint | Consequence |
| --- | --- |
| Free hosting only. | GitHub Pages, GitHub Actions and free tiers only. No paid server. |
| The site is public and static (GitHub Pages). | A write token must **never** be in the site's code, the repo or the built files. Anything shipped in JS is public. |
| Reminders must know tonight's real progress. | The reminder job needs a recent copy of the progress. Today it only lives in Deepak's browser (`localStorage`). |
| Quiet hours are 00:00–06:00 IST. Reminders come every 2–3 h, at most 6 a day, and stop once the session is done. | These rules are enforced by `scripts/reminders/reminder.mjs` and covered by tests (`checks/reminders.test.mjs`). |

Existing pieces:
- Codex's `backend/server.mjs` already has accounts, sync and a Resend outbox. It needs an always-on Node host, which is not free static hosting, so it is kept as the "own server later" path.
- The engagement engine already stores the reminder preferences (address, interval, quiet hours, max per day) inside the progress data.

## 2. Options compared

Facts were checked on 2026-11-23:
- `github.com/login/device/code` and `/login/oauth/access_token` answer a CORS preflight from `rishabh10045.github.io` with **404 and no `Access-Control-Allow-Origin`**.
- `api.github.com` answers with `access-control-allow-origin: *`.
- Cloudflare Workers Free allows 100,000 requests a day, 10 ms CPU per request and 5 Cron Triggers. Workers KV Free allows 1,000 writes a day. (developers.cloudflare.com, limits pages)
- GitHub Actions scheduled runs:
  - the shortest interval is 5 min;
  - runs can be delayed at the top of the hour;
  - schedules in a *public* repo are disabled after 60 days without repo activity.
  (docs.github.com, "Events that trigger workflows")
- Resend's free plan is 3,000 emails a month. Without a verified domain, the `onboarding@resend.dev` sender can only send to the account owner's own address, which is fine for Deepak emailing himself.

| | **A. GitHub OAuth device flow from the browser** | **B. Free serverless function (Cloudflare Worker)** | **C. GitHub Actions reads a progress snapshot** |
| --- | --- | --- | --- |
| How it works | The site asks GitHub for a device code. Deepak approves it on github.com. The site gets a user token and writes the progress JSON to a private repo. | A Worker hosts the sync API: GitHub sign-in via the OAuth web flow (the client secret stays in the Worker), progress in KV/D1, and a Worker Cron Trigger sends the emails. | The site saves a snapshot (`{ localStorage key: value }`) to a private data repo. A scheduled workflow reads it with a **read-only** token and sends the email. |
| Works from a static site? | **No.** The device-flow endpoints have no CORS (verified), so the browser can't finish the flow without a proxy. A proxy makes it option B. | Yes. The site calls the Worker, which is not static. | Yes. The browser write goes to `api.github.com` (CORS ok), using a fine-grained token Deepak pastes into **his own browser** (§3). |
| Where secrets live | The token is in the browser after sign-in. | Only in the Worker's encrypted secrets. Nothing write-capable reaches the browser. | Write token: Deepak's browser only, never in code. Read token and email key: Actions secrets. |
| New accounts | GitHub OAuth App, plus a proxy anyway. | Cloudflare account, GitHub OAuth App and Resend. | Private data repo, two fine-grained tokens and Resend (or Gmail SMTP). |
| Cost | Free. | Free within the limits above. | Free. Actions minutes in a public repo are free; the data repo is only read. |
| Main risk | Not possible without a proxy. | More moving parts: a Worker to maintain, KV write limits (fine for one learner, at about 200 writes a day). | A script injected on the `*.github.io` origin could read the pasted token. Mitigation: a single-repo token with `Contents: read and write` only and a 30–90 day expiry. |
| Effort | Low, but blocked. | About 1 day. | About 2–3 h. Most of it is already built: the job, templates, tests and workflow. |

## 3. Recommendation

1. **Reminders now: option C.** It needs no server and no new runtime, and it is mostly built.
   - The workflow reads one JSON file from a **private** repo with a **read-only**, single-repo token.
   - It runs the real engine (`tasksFor`, `streak`, notification prefs), so "session done" means exactly what the Today page shows.
2. **Getting progress into the private repo** has two choices, in increasing safety:
   - **C1 (manual, zero risk):** Deepak downloads the progress file, using the existing "Export progress" or a one-click button we add, and commits it to the private repo. Simple, but reminders only see the last export, so the "stop after session done" rule needs an export after studying.
   - **C2 (automatic):** Study Desk gets a "Back up to GitHub" setting. Deepak pastes a fine-grained token (only the data repo, `Contents: read and write`, 90-day expiry) into his own browser. After each study action, the site writes the snapshot with `PUT /repos/{owner}/{repo}/contents/{path}`. The token is kept in that browser's storage only. It is never in the code, never committed, and never sent anywhere except `api.github.com`.
3. **If Deepak doesn't want any token in the browser: option B** (Cloudflare Worker). It is the safest of the three, but it needs one more account and about a day of work. It also replaces Codex's Node server with something that runs free.

**Grok's suggestion:** start with C1 today, so reminders work at once with no write token anywhere. Then add C2 only if Deepak accepts the browser-token trade-off. Otherwise move to B.

## 4. What is built (this branch)

- `scripts/reminders/reminder.mjs`: the decision and send script. `--dry-run` works without secrets. Its rules:
  - quiet hours 00:00–06:00 IST;
  - one email per slot;
  - six slots, 3 h apart (06:37, 09:37, 12:37, 15:37, 18:37, 21:37 IST), capped by the saved `maxPerDay` (default 6);
  - no email when reminders are off in Settings, today is a day off, the plan is finished, **tonight's core session is done**, or there was study activity in the last 2 hours.
  - The template rotates by date and slot, so the same day never repeats a template.
  - Sending uses the Resend HTTP API with an idempotency key `study-desk-<date>-slot<n>`, so a retried run never double-sends.
- `scripts/reminders/templates.mjs`: five Hinglish, food-delivery-style templates. Each one names the pending topic:
  - "{topic} thanda ho raha hai 🥶"
  - "Ek plate {topic}, extra Java ke saath? ☕"
  - "Delivery partner wait kar raha hai 🛵"
  - "{topic} abhi bhi cart mein pada hai 🛒"
  - "Last call! Kitchen band hone wali hai 🔔"
- `.github/workflows/study-reminders.yml`: cron `7 1,4,7,10,13,16 * * *` (UTC), which is 06:37 to 21:37 IST.
  - **Off:** the job only runs when the repo variable `REMINDERS_ENABLED` is `true`.
  - Even then it exits without sending while the data-repo settings are missing. It prints a dry run while the email secrets are missing.
  - A manual run defaults to dry run. Permissions: `contents: read`.
- `checks/reminders.test.mjs`: tests for the slot spacing (it reads the workflow cron), the templates, sending a reminder that names the topic, and every skip rule (off, quiet hours, recent study, session done, day off, daily cap).

Not built yet, because each one depends on Deepak's choice:
- the C2 "Back up to GitHub" setting;
- the Worker (option B).

## 5. Data written and its privacy

The snapshot contains Codex progress (sessions, answers, notes, preferences) and the UI sidecar (XP activity, the reminder address). It belongs in a **private** repo, never in this public one. The reminder address can also live in the `REMINDER_TO` secret, so it never needs to be in the snapshot.

## 6. Exactly what Deepak needs to do or provide (about 15 minutes)

Choose the sync path first: **C1** (manual export), **C2** (browser token) or **B** (Worker). The steps below are for C1/C2.

1. **Create a private repo** for the data, for example `Rishabh10045/study-desk-data`. Add `study-desk/progress.json`, either by exporting from Study Desk or by letting C2 write it.
2. **Read token for Actions:** create a fine-grained personal access token.
   - Repository access: only `study-desk-data`.
   - Permissions: **Contents: Read-only**.
   - Expiry: 90 days.
   - Save it in *this* repo as the Actions secret `PROGRESS_READ_TOKEN`.
3. **Email sender:** create a free Resend account with the address the reminders should go to.
   - Create an API key with "Sending access" only.
   - Save these Actions secrets:
     - `RESEND_API_KEY`
     - `REMINDER_FROM` = `Study Desk <onboarding@resend.dev>` (or a verified domain)
     - `REMINDER_TO` = his address
   - Alternative: if he prefers Gmail, say so. We would switch the script to SMTP with a Gmail **app password**, which needs 2-Step Verification.
4. **Actions variables** in this repo:
   - `PROGRESS_REPO` = `Rishabh10045/study-desk-data`
   - optionally `PROGRESS_PATH`
   - `REMINDERS_ENABLED` = `true`, set **last**, after a manual dry run.
5. In Study Desk → **Reminders**, turn email on, so the snapshot says reminders are wanted.
6. **For C2 only:** a second fine-grained token, used only in his own browser.
   - Repository access: only `study-desk-data`.
   - Permissions: **Contents: Read and write**.
   - Expiry: 30–90 days.
   - Never paste it anywhere else.
7. Approve the first manual dry run (Actions → Study reminders → Run workflow, dry run ✓), then a real run.

Grok will not create any of these. Each one needs Deepak's own account and approval.
