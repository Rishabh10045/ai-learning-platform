# Engagement data contract v1 (Study Desk)

Owner of this file: Grok (UI). Readers: GPT/Codex (backend: `progress.js`, `app.js`, future sync + reminder job).
Status: **v1, implemented in the UI on branch `grok/engagement-ui`**. Change it by proposing an edit in `collab/COLLAB.md`.

The UI derives everything below from the progress object the host already stores, so it
works today with no backend change. The backend's job is to **store and sync** the new
progress fields, and later to **send the reminder emails**. A host may also send its own
computed numbers (`options.engagement`); the UI then shows those instead, field by field.

Reference implementation (pure JS, runs in the browser and Node): `ui/engine/engagement-engine.js`
(`window.StudyDeskEngagement`). Tests: `ui/checks/engine.test.mjs` (section "engagement").

Lines up with Grok's content-standard audit (2026-11-22, still being written, not in the repo yet). That audit lists as missing: activity log with `lastActiveAt`, points ledger, streaks, badges, notification prefs and a send log, and server-side sync. This contract covers all of them except the send log, which is reserved below. Its limit of at most 6 nudges a day is used as the default.

---

## 1. What the host must do (minimum)

1. Persist these extra top-level progress fields (`normalize()` already keeps unknown keys, `validateProgress()` accepts them):

```js
progress.interview   = { "<questionId>": { lessonId: "JC-05", answeredOn: "2026-11-27" } }
progress.challenges  = { "daily-2026-11-27": { doneOn: "2026-11-27", kind: "teach-back", title: "Teach it back" },
                         "weekly-2026-11-23": { doneOn: "2026-11-29", kind: "show-up", title: "Show up every study day" } }
progress.prefs       = { notifications: { email: false, address: "", intervalHours: 2.5,
                                          quietStart: "00:00", quietEnd: "06:00", timezone: "Asia/Kolkata", maxPerDay: 6 } }
progress.activity    = [ { at: "2026-11-27T15:55:00.000Z", date: "2026-11-27", type: "quiz", id: "JC-05", xp: 30, status?: "complete" } ]  // oldest first, max 1000
progress.lastActiveAt = "2026-11-27T15:55:00.000Z"   // last STUDY action (not settings changes)
progress.tests[id].best   // new: best module-test score (the reducer now writes it)
```

2. Reduce changes with **`StudyDeskEngagement.applyChange(course, progress, change, change.at)`** instead of
   `StudyDeskSchedule.applyChange`. It runs the schedule rules, the engagement checks (challenge goal met,
   prefs valid), and appends the activity entry with its XP delta. The UI stamps every change with
   `change.at` (ISO timestamp). The demo host `ui/index.html` shows the exact wiring.

3. Sync `progress` (including the fields above) to the account, so a server-side reminder job can read
   `lastActiveAt`, `prefs.notifications` and today's task state.

## 2. New change shapes (emitted by the UI via `onChange`)

| change | effect | refused when |
| --- | --- | --- |
| `{ type:"interview", id:questionId, lessonId, answered?:false }` | marks an interview question answered (or un-marks it) | the question is not in `lesson.interview` (or `lesson.coach` fallback) |
| `{ type:"challenge", id:"daily-YYYY-MM-DD" \| "weekly-<monday>" }` | claims a challenge's XP | not today's / this week's challenge, goal not met, already claimed |
| `{ type:"prefs", notifications:{…} }` | saves reminder preferences (merged) | `validateNotificationPrefs` fails: interval outside 2–3 h, bad HH:MM, email on without an address, maxPerDay outside 1–12 |

All existing change types are unchanged. Each change also has `date` (IST study date) and `at` (ISO timestamp).

## 3. Points (XP) per action

| Action | XP | Why |
| --- | --- | --- |
| Lesson complete | **50** | The unit of work (~78 min). Everything else is scaled against it |
| Lesson check passed | **20**, +10 for 100% | Rewards understanding; paid once per lesson (a retake never pays again) |
| Practice item complete | **25**, +10 with evidence | Proof of work pays more than ticking a box |
| Quick revision done | **15** | A 12-minute habit, worth doing every day |
| Interview question answered (self-marked) | **5** each | Small, frequent; adds up across ~5 per lesson |
| Module test passed | **100**, +25 for ≥90% | The biggest single effort and gate |
| Whole session finished | **40** | Finishing bonus: the Scaler-style "day complete" moment |
| Videos logged | **1 per 10 min**, max 12/day | Watching is not the goal; capped so it can't be farmed |
| Daily challenge claimed | **30** | About one more lesson check: worth the extra push |
| Weekly challenge claimed | **150** | About three lessons: rewards consistency over the week |

A full weekday (revision + lesson with check and practice + DSA set + 3 interview answers + session bonus) ≈ 15 + 30 + 35 + 50 + 35 + 50 + 15 + 40 ≈ **270 XP**. A good week ≈ 1,500–1,900 XP.

**Levels** (start XP): 1 Rookie 0 · 2 Learner 200 · 3 Builder 500 · 4 Problem Solver 1,000 · 5 Engineer 1,750 · 6 Senior Engineer 2,750 · 7 Architect 4,000, then +1,500 XP per level. Level 2 arrives on Day 1; level 4 in the first week; Architect around week 3–4, so the curve keeps moving for the whole plan.

XP is a **pure function of progress** (`ledger(course, progress)`): undoing an action removes its XP and nothing is double-counted. Each ledger entry carries the IST date it was earned (`null` for migrated items).

## 4. Daily task checklist (today's study day)

`tasksFor(course, progress, today)` → `{ date, sessionN, tasks:[{ id, kind, title, xp, done, href }], done, total, pct, xpAvailable, allDone, off }`

Built from the session the calendar puts on `today` (carry-forward applies):
- Day 2 on: quick revision of the previous session (`revision-Sxx`). Day 1: the Java foundations warm-up lesson.
- For each lesson and DSA set: lesson check (if it has one), each practice item, then lesson complete.
- Interview: answer `min(3, n)` interview questions from the main lesson(s).
- My notes: write your own key takeaways (0 XP, needed for the "teach it back" challenge and revision).
- Module test, when the session has one.
- An unavailable or 0-minute date has **no tasks** (`off: true`), and the streak is safe.

## 5. Challenges

`dailyChallenge()` picks one per date (deterministic hash of the date) from the ones that fit tonight's session:
- **Sharp shooter**: 100% on the main lesson check in one attempt.
- **Interview sprint**: answer all of tonight's interview questions today.
- **Teach it back**: at least 3 lines of takeaways in My notes.
- **Show your code**: finish tonight's DSA set with a submission link.

`weeklyChallenge()` runs Monday–Sunday IST and alternates by week:
- **Show up every study day**: be active on every *available* day. Unavailable days and days before the plan start don't count. A partial first week is always this one.
- **600 XP week**.

Shape: `{ id, period:"daily"|"weekly", kind, title, text, target, value, met, pct, xp, claimed, claimedOn, href }`.
XP is paid only when the learner **claims** it. The claim is refused unless `met`, and only today's or this week's challenge can be claimed.

## 6. Streak (study-day based)

`streak(course, progress, today)` → `{ current, best, todayDone, atRisk, todayOff, skippedDays, history:[{date, state:"active"|"off"|"missed"|"pending", streak}] }`

- A date is **active** if anything was earned or logged on it (ledger dates, video log, study entries in the activity log).
- **Unavailable dates and 0-minute days are skipped**: they never break the streak and never add to it. This is the carry-forward rule applied to streaks.
- An available date with no activity **breaks** the streak. The exception is *today*, which stays `pending` and `atRisk` until the study day ends (04:00 IST cutoff).

## 7. Activity log and last activity

`progress.activity` entries: `{ at (ISO UTC), date (IST study date), type, id, xp (delta), status? }`. Newest last, capped at 1,000.
- Every accepted change is logged; refused changes are not.
- `lastActiveAt` updates only for **study** types: lesson, practice, quiz, test, watch, note, revision, interview, challenge. Settings changes (prefs, unavailable, minutes) are logged but don't count, so they can't silence a reminder.

## 8. Badges

`badges()` → `[{ id, title, text, value, target, earned }]`, all derived: first-step, streak-3/7/14/30, dsa-10, perfect-10, module-1, interview-25, challenge-5, subject-1, xp-1000.

## 9. Notification preferences and the reminder rule (email sending NOT wired yet)

Defaults: `email:false, intervalHours:2.5 (allowed 2–3), quietStart:"00:00", quietEnd:"06:00" IST, maxPerDay:6, timezone:"Asia/Kolkata"`.

`nextNudge(prefs, lastActiveAt, nowMs, { todayDone, sentToday })` gives when the next email *would* go out:
- off → none
- today's tasks all done → none
- `sentToday ≥ maxPerDay` → none
- otherwise every `intervalHours` after the last study action (the next slot on that grid after now); a slot inside quiet hours moves to the end of quiet hours

The reminder job (GitHub Actions cron, hourly, per the audit §5) should call the same function, or port it, with `sentToday` from a send log.

**Reserved for the backend (not used by the UI yet):** `progress.notifyLog = [{ at, channel:"email", subject, topic }]`.

## 10. `StudyDesk.mount(el, { …, engagement })`

- `engagement` omitted → derived locally (`source:"derived"`, shown as "Calculated in this browser from your progress").
- `engagement` object → merged over the derived view-model field by field. `source` defaults to `"host"`; if `xp` is given without `level`, the level is recomputed.
- `engagement: { example: true }` (or `source:"example"`) → every number is visibly labelled **Example data**, and claiming is disabled.
- `engagement: false` → the engagement UI is hidden (pre-engagement behaviour, no #activity / #settings routes).

The full view-model (`derive()`): `{ contractVersion:1, source, example, today, xp, todayXp, level:{n,name,from,to,pct,toNext}, streak, tasks, challenges[], badges[], ledger[] (newest first), activity[] (newest first), lastActiveAt, notifications, nextNudge:{at,label,reason} }`.
