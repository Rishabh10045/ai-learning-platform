// Headless Chrome checks for Study Desk v2 (ui/index.html with the example fixture).
// Usage: NODE_PATH=<dir with puppeteer-core> node ui/checks/run-checks.mjs [outDir]
// Chrome: $CHROME or /usr/bin/google-chrome. Serves the repo root like GitHub Pages.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer-core");
let AXE = null; try { AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"); } catch (e) { /* reported as a failed check below */ }
// The fixture, read in Node so expectations follow the data instead of hard-coded session numbers.
globalThis.window = globalThis.window || {};
const SE = require("../engine/schedule-engine.js");
require("../fixtures/course.fixture.js");
const COURSE = window.STUDY_DESK_FIXTURES.course, N = COURSE.sessions.length;
const RES = SE.resolveSessions(COURSE);
const sessionOf = id => Math.min(...RES.scheduled[id]);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtD = iso => SE.DAY_NAMES[SE.weekday(iso)].slice(0, 3) + ", " + (+iso.slice(8)) + " " + MON[+iso.slice(5, 7) - 1] + " " + iso.slice(0, 4);
const BASE_FINISH = SE.addDays(COURSE.schedule.startDate, N - 1);
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const outDir = path.resolve(process.argv[2] || "study-desk-checks");
fs.mkdirSync(outDir, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const p = path.join(repoRoot, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(repoRoot) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = (q, hash = "") => `${origin}/ui/index.html${q ? "?" + q : ""}${hash}`;

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const results = [];
const blockedList = [];
const blocked = (name, detail = "") => { blockedList.push({ name, detail }); console.log(`BLOCKED  ${name}${detail ? "  (" + detail + ")" : ""}`); };
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); };
const viewports = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  mobile320: { width: 320, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function newPage(vp, errors) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("requestfailed", r => errors.push("requestfailed " + r.url()));
  return page;
}
async function go(page, q, hash) { await page.goto("about:blank"); await page.goto(url(q, hash), { waitUntil: "load" }); }
const info = page => page.evaluate(() => {
  const m = document.querySelector(".sd-main");
  return { view: m && m.dataset.view, day: m && m.dataset.day, hash: location.hash, h1: (document.querySelector(".sd-main h1") || {}).textContent,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
});
const text = (page, sel) => page.$eval(sel, e => e.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
const allText = (page, sel) => page.$$eval(sel, es => es.map(e => e.innerText.replace(/\s+/g, " ").trim()));
async function apply(page, change) { return page.evaluate(c => window.__studyDeskApply(c), change); }
async function finishLessonViaHost(page, id) {
  return page.evaluate(id => {
    const S = window.StudyDeskSchedule, c = window.STUDY_DESK_FIXTURES.course, l = S.indexCourse(c).lessonById[id].lesson, out = [];
    if (l.quiz) { const a = {}; l.quiz.questions.forEach(q => a[q.id] = q.answer); out.push(window.__studyDeskApply({ type: "quiz", id, answers: a }).ok); }
    (l.practice || []).forEach(p => out.push(window.__studyDeskApply({ type: "practice", id: p.id, status: "complete", evidence: "https://github.com/example/" + p.id }).ok));
    out.push(window.__studyDeskApply({ type: "lesson", id, status: "complete" }).ok);
    return out.every(Boolean);
  }, id);
}

/* ---------- 1. routes, both viewports ---------- */
const routes = [
  ["", "today"], ["#today", "today"], ["#course", "course"], ["#calendar", "calendar"],
  ["#day-1", "plan", "1"], ["#day-1/learn", "learn", "1"], ["#day-1/practice", "practice", "1"], ["#day-2/revision", "revision", "2"],
  ["#day-2/my-notes", "my-notes", "2"], ["#day-2/coach", "coach", "2"], ["#day-3/test", "test", "3"], ["#day-999", "not-found"],
  ["#day-0", "not-found"], ["#%E0%A4%A", "not-found"], ["#lesson/NOPE", "not-found"],
  ["#activity", "activity"], ["#settings", "settings"]
];
for (const [vpName, vp] of Object.entries(viewports)) {
  const errors = [];
  const page = await newPage(vp, errors);
  for (const [hash, view, day] of routes) {
    await go(page, "store=0&today=2026-11-22", hash);
    const i = await info(page);
    check(`${vpName} ${hash || "(no hash)"} renders ${view}`, i.view === view && (!day || i.day === day), `view=${i.view} day=${i.day} h1=${i.h1}`);
    check(`${vpName} ${hash || "(no hash)"} no horizontal overflow (QA M8)`, !i.overflowX, `scrollWidth=${i.sw} clientWidth=${i.cw}`);
    await page.screenshot({ path: path.join(outDir, `${vpName}${(hash || "_default").replace(/[#/]/g, "_")}.png`), fullPage: vpName === "desktop" });
  }
  await go(page, "store=0&today=2026-11-22", "#lesson/SB-07");
  let i = await info(page);
  check(`${vpName} #lesson/SB-07 opens its session's Videos & notes`, i.view === "learn" && i.hash === `#day-${sessionOf("SB-07")}/learn`, i.hash);
  // reload + back/forward on a deep link
  await go(page, "store=0&today=2026-11-22", "#day-3/practice");
  await page.reload({ waitUntil: "load" });
  i = await info(page);
  check(`${vpName} reload keeps #day-3/practice`, i.view === "practice" && i.day === "3");
  await page.evaluate(() => { location.hash = "#day-4/learn"; }); await sleep(50);
  await page.goBack(); await sleep(50); i = await info(page);
  check(`${vpName} back returns to #day-3/practice`, i.view === "practice" && i.day === "3", i.hash);
  await page.goForward(); await sleep(50); i = await info(page);
  check(`${vpName} forward returns to #day-4/learn`, i.view === "learn" && i.day === "4", i.hash);
  check(`${vpName} no console errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

/* ---------- 2. schedule views (desktop) ---------- */
{
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  // Day 1: Sunday 22 Nov 2026, 6h 30m = 2h core + 4h 30m stretch; revision slot = Java foundations.
  await go(page, "store=0&today=2026-11-22", "#today");
  const h1 = await text(page, ".sd-main h1"), chip = await text(page, ".sd-chip-budget");
  const blocks = await allText(page, ".sd-timeline .sd-tblock");
  check("Today (Sun 22 Nov) is Session 1 with Java core + DSA", new RegExp(`Session 1 of ${N}\\b`).test(h1) && /Java core \+ DSA/.test(h1), h1);
  check("Sunday Day 1 shows Weekend long day 6h 30m (2h core + 4h 30m stretch)", /Weekend long day · Sunday · 6h 30m \(2h core \+ 4h 30m stretch\)/.test(chip), chip);
  check("Day 1 blocks: 9:00 PM Java foundations 12 min, 9:12 PM main lesson 1h 18m, 10:30 PM DSA 30 min, stretch 4h 30m",
    /^9:00 PM 12 min Java foundations/i.test(blocks[0]) && /^9:12 PM 1h 18m Main lesson/i.test(blocks[1]) && /^10:30 PM 30 min DSA practice/i.test(blocks[2]) && /^Any time 4h 30m Stretch practice/i.test(blocks[3]), blocks.map(b => b.slice(0, 40)).join(" | "));
  check("Continue studying points at the first lesson (JC-01)", /Java foundations: JDK, JVM/.test(await text(page, ".sd-continue")));
  await page.screenshot({ path: path.join(outDir, "flow-1-sunday-day1.png"), fullPage: true });

  // Weekday: session 2 projected on Mon 23 Nov = 12 revision + 78 lesson + 30 DSA = 2h.
  await go(page, "store=0&today=2026-11-22", "#day-2");
  const wd = await allText(page, ".sd-timeline .sd-tblock"), wchip = await text(page, ".sd-panel .sd-chip-budget");
  check("Weekday (Mon 23 Nov) session 2 = 12 min revision + 78 min lesson + 30 min DSA, 2h",
    /Mon, 23 Nov 2026/.test(await text(page, ".sd-panel h2")) && wchip === "2h" && wd.length === 3 && /^9:00 PM 12 min Quick revision Quick revision of session 1/i.test(wd[0]) && /^9:12 PM 1h 18m Main lesson/i.test(wd[1]) && /^10:30 PM 30 min DSA/i.test(wd[2]), wchip + " | " + wd.map(b => b.slice(0, 40)).join(" | "));

  // Saturday 28 Nov: weekend long day, same 6h 30m shape (session 7 projected).
  await go(page, "store=0&today=2026-11-28", "#today");
  // Sessions 1-6 finished on their own dates (22-27 Nov), through the host reducer the UI uses.
  const seeded = await page.evaluate(() => {
    const S = window.StudyDeskSchedule, c = window.STUDY_DESK_FIXTURES.course, idx = S.indexCourse(c), res = S.resolveSessions(c, idx); let ok = true;
    res.sessions.slice(0, 6).forEach((r, i) => {
      const date = S.addDays("2026-11-22", i);
      (r.warmup ? [r.warmup] : []).concat(r.lessons, r.dsa).forEach(l => {
        if (l.quiz) { const a = {}; l.quiz.questions.forEach(q => a[q.id] = q.answer); ok = window.__studyDeskApply({ type: "quiz", id: l.id, answers: a, date }).ok && ok; }
        (l.practice || []).forEach(p => { ok = window.__studyDeskApply({ type: "practice", id: p.id, status: "complete", evidence: "https://github.com/example/" + p.id, date }).ok && ok; });
        ok = window.__studyDeskApply({ type: "lesson", id: l.id, status: "complete", date }).ok && ok;
      });
      if (r.test) { const a = {}; idx.moduleById[r.test].module.test.questions.forEach(q => a[q.id] = q.answer); ok = window.__studyDeskApply({ type: "test", id: r.test, answers: a, date }).ok && ok; }
    });
    return ok;
  });
  const sh1 = await text(page, ".sd-main h1"), schip = await text(page, ".sd-chip-budget"), sb = await allText(page, ".sd-timeline .sd-tblock");
  check("Saturday (28 Nov) Today: Weekend long day 6h 30m = 12 revision + 78 lesson + 30 DSA + 4h 30m stretch",
    /Weekend long day · Saturday · 6h 30m \(2h core \+ 4h 30m stretch\)/.test(schip) && sb.length === 4 && /^9:00 PM 12 min Quick revision/i.test(sb[0]) && /^9:12 PM 1h 18m Main lesson/i.test(sb[1]) && /^10:30 PM 30 min DSA/i.test(sb[2]) && /^Any time 4h 30m Stretch/i.test(sb[3]) && seeded && new RegExp(`Session 7 of ${N}\\b`).test(sh1) && new RegExp(`6/${N} sessions`).test(await text(page, ".sd-overall")), sh1 + " | " + schip);
  await page.screenshot({ path: path.join(outDir, "flow-5-saturday-today.png"), fullPage: true });
  await page.setViewport(viewports.mobile);
  await page.screenshot({ path: path.join(outDir, "mobile-saturday-today.png"), fullPage: false });
  await page.setViewport(viewports.desktop);
  await go(page, "store=0&today=2026-11-22", "#day-6");
  check("Friday (27 Nov) stays a 2h weekday", /Fri, 27 Nov 2026/.test(await text(page, ".sd-panel h2")) && (await text(page, ".sd-panel .sd-chip-budget")) === "2h");

  // Missed date: today = Mon 23 Nov with nothing done -> session 1 carried forward on a 2h weekday.
  await go(page, "store=0&today=2026-11-23", "#today");
  const mh1 = await text(page, ".sd-main h1"), mchips = await allText(page, ".sd-hero-meta .sd-chip");
  check("Missed Sunday: Mon 23 Nov still shows Session 1, carried forward, 2h", new RegExp(`Session 1 of ${N}\\b`).test(mh1) && mchips.some(c => /Carried forward/.test(c)) && mchips.some(c => /Monday · 2h/.test(c)), mh1 + " | " + mchips.join(" | "));

  // Unavailable date through the UI.
  await go(page, "store=0&today=2026-11-22", "#today");
  await page.click("#sd-off"); await sleep(50);
  const off = await text(page, ".sd-offcard");
  check("Marking Sun 22 Nov unavailable shows the day off and keeps Session 1 pending", /Session 1 stays pending/.test(off), off.slice(0, 80));
  await go(page, "store=0&today=2026-11-22", "#calendar"); // fresh in-memory progress
  await page.click(".sd-calendar li:nth-child(1) .sd-cal-off input"); await sleep(50);
  const cal = await allText(page, ".sd-calendar li");
  check("Calendar: 22 Nov off, Session 1 moves to Mon 23 Nov, Session 2 to Tue 24 Nov", /Sun, 22 Nov Unavailable/.test(cal[0]) && /Mon, 23 Nov Session 1/.test(cal[1]) && /Tue, 24 Nov Session 2/.test(cal[2]), cal.slice(0, 3).map(c => c.slice(0, 32)).join(" | "));
  const finishOff = await page.evaluate(() => document.querySelector(".sd-hero .sd-muted").textContent);
  await page.screenshot({ path: path.join(outDir, "flow-2-unavailable-calendar.png"), fullPage: false });
  await page.click(".sd-calendar li:nth-child(1) .sd-cal-off input"); await sleep(50);
  const finishBack = await page.evaluate(() => document.querySelector(".sd-hero .sd-muted").textContent);
  check("Unchecking the day off restores the original finish date", finishBack.includes(fmtD(BASE_FINISH)) && finishOff.includes(fmtD(SE.addDays(BASE_FINISH, 1))), finishOff.match(/finish: (.*)\./)?.[1] + " -> " + finishBack.match(/finish: (.*)\./)?.[1]);

  // Weekday minutes are adjustable (per date and weekday default).
  await go(page, "store=0&today=2026-11-23", "#today");
  await page.$eval("#sd-mins", e => e.value = "90"); await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(2) .sd-btn"); await sleep(50);
  let chips = await allText(page, ".sd-hero-meta .sd-chip");
  check("Per-date minutes: Mon 23 Nov set to 1h 30m, flagged as a short day", chips.some(c => /Monday · 1h 30m/.test(c)) && chips.some(c => /Short day/.test(c)), chips.join(" | "));
  await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(2) .sd-btn-ghost"); await sleep(50);
  await page.$eval("#sd-wdmins", e => e.value = "180"); await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(3) .sd-btn"); await sleep(50);
  chips = await allText(page, ".sd-hero-meta .sd-chip");
  check("Weekday default: every Monday 3h = 2h core + 1h stretch", chips.some(c => /Monday · 3h \(2h core \+ 1h stretch\)/.test(c)), chips.join(" | "));
  const sched = await page.evaluate(() => window.__studyDeskProgress().schedule);
  check("QA H2: Save default stores the Monday default (not a one-date override)", sched.dailyMinutes[1] === 180 && !sched.dateMinutes["2026-11-23"], JSON.stringify(sched));
  await page.evaluate(() => { location.hash = "#calendar"; }); await sleep(80);
  const mon30 = (await allText(page, ".sd-calendar li")).find(t => /Mon, 30 Nov/.test(t)) || "";
  check("QA H2: the default applies to the next Monday too (30 Nov = 3h)", /\b3h\b/.test(mon30), mon30.slice(0, 90));
  check("schedule views: no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

/* ---------- 3. gates, test unlock, next-day progression, reopen/uncheck/reload (localStorage) ---------- */
{
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  await go(page, "today=2026-11-22", "#day-1/learn");
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "load" });
  // Quiz gate
  await page.click("#lesson-JC-01 .sd-lesson-actions .sd-btn-primary"); await sleep(50);
  check("Mark complete is refused before the lesson check and practice (gate shown)",
    /Pass the lesson check/.test(await text(page, ".sd-toast")) && !(await page.evaluate(() => window.__studyDeskProgress().lessons["JC-01"])), await text(page, ".sd-toast"));
  await page.click("#lesson-JC-01 .sd-quiz input[value='0']"); await page.click("#lesson-JC-01 .sd-quiz button[type=submit]"); await sleep(50);
  check("Wrong lesson-check answer does not pass the gate", /0\/1/.test(await text(page, ".sd-toast")) && /retry/.test(await text(page, "#lesson-JC-01 .sd-quiz h3")));
  await page.click("#lesson-JC-01 .sd-quiz input[value='1']"); await page.click("#lesson-JC-01 .sd-quiz button[type=submit]"); await sleep(50);
  check("Correct lesson-check answer passes the gate", /Passed/.test(await text(page, "#lesson-JC-01 .sd-quiz h3")));
  // Evidence gate on practice
  await page.goto(url("today=2026-11-22", "#day-1/practice"), { waitUntil: "load" });
  await page.click("#practice-JC-02-p1 .sd-statechoice.is-complete"); await sleep(50);
  check("Practice cannot be completed without assignment evidence", /evidence/.test(await text(page, ".sd-toast")));
  await page.type("#ev-JC-02-p1", "https://github.com/example/jc02-types");
  await page.click("#practice-JC-02-p1 .sd-statechoice.is-complete"); await sleep(50);
  check("Practice completes with evidence saved", await page.evaluate(() => { const p = window.__studyDeskProgress().practice["JC-02-p1"]; return p && p.status === "complete" && /jc02/.test(p.evidence); }));
  await page.goto(url("today=2026-11-22", "#day-1/learn"), { waitUntil: "load" });
  await page.type("#lesson-JC-01 .sd-watchlog input", "12"); await page.click("#lesson-JC-01 .sd-watchlog button"); await sleep(50);
  check("Watch log records minutes with the date", /Watched: 12 min \(Sun, 22 Nov 12m\)/.test(await text(page, "#lesson-JC-01 .sd-watchlog")));
  await page.click("#lesson-JC-01 .sd-lesson-actions .sd-btn-primary"); await sleep(50);
  check("Lesson JC-01 completes once gates are met", /Complete/.test(await text(page, "#lesson-JC-01 .sd-card-h .sd-badge")));
  // Finish the rest of session 1 through the same host reducer the UI uses.
  const ok1 = await finishLessonViaHost(page, "JC-02") && await finishLessonViaHost(page, "DSA-01");
  await page.goto(url("today=2026-11-22", "#today"), { waitUntil: "load" });
  check("Session 1 complete on Day 1", ok1 && /Complete/.test(await text(page, ".sd-hero-meta .sd-badge")) && new RegExp(`1/${N} sessions`).test(await text(page, ".sd-overall")));
  // Next day
  await page.goto(url("today=2026-11-23", "#today"), { waitUntil: "load" });
  const n2 = await text(page, ".sd-main h1"), tl = await allText(page, ".sd-timeline .sd-tblock");
  check("Next-day progression: Mon 23 Nov shows Session 2 with revision of session 1", new RegExp(`Session 2 of ${N}\\b`).test(n2) && /Quick revision of session 1/.test(tl[0]), n2);
  await finishLessonViaHost(page, "JC-03"); await finishLessonViaHost(page, "DSA-02");   // session 2 on Mon 23 Nov
  await page.goto(url("today=2026-11-24", "#day-3/test"), { waitUntil: "load" });
  check("Module test is locked while JC-04 is open", /Test locked/.test(await text(page, ".sd-testcard .sd-card-h")) && /Inheritance/.test(await text(page, ".sd-testcard ul")));
  await finishLessonViaHost(page, "JC-04"); await finishLessonViaHost(page, "DSA-03");
  await page.reload({ waitUntil: "load" });
  check("Module test unlocks when every lesson in the module is complete", /Test ready/.test(await text(page, ".sd-testcard .sd-card-h")));
  await page.click("#t-jc-basics-0-1"); await page.click("#t-jc-basics-1-0"); await page.click("#t-jc-basics-2-1"); await page.click(".sd-testcard button[type=submit]"); await sleep(50);
  check("Failing the test (0/3) shows retry and keeps session 3 open", /retry/i.test(await text(page, ".sd-testcard .sd-card-h")) && /In progress/.test(await text(page, ".sd-dayhead .sd-badge")));
  await page.click("#t-jc-basics-0-0"); await page.click("#t-jc-basics-1-1"); await page.click("#t-jc-basics-2-0"); await page.click(".sd-testcard button[type=submit]"); await sleep(50);
  check("Passing the test completes session 3", /Test passed/.test(await text(page, ".sd-testcard .sd-card-h")) && /Complete/.test(await text(page, ".sd-dayhead .sd-badge")));
  await page.screenshot({ path: path.join(outDir, "flow-3-test-passed.png"), fullPage: false });
  await page.goto(url("today=2026-11-25", "#today"), { waitUntil: "load" });
  check("Wed 25 Nov moves on to Session 4", new RegExp(`Session 4 of ${N}\\b`).test(await text(page, ".sd-main h1")));
  await page.goto(url("today=2026-11-25", "#course"), { waitUntil: "load" });
  const jc = await text(page, "#sd-s-java-core"), bar = await page.$eval("#sd-s-java-core", e => e.closest(".sd-card").querySelector(".sd-progline [role=progressbar]").getAttribute("aria-valuenow"));
  check("Course view: Java core progress bar = 4 lessons + 1 test done of 9 items (56%)", bar === "56", "aria-valuenow=" + bar + " " + jc);
  await page.screenshot({ path: path.join(outDir, "flow-4-course-progress.png"), fullPage: true });
  // Complete -> reopen -> uncheck -> reload (one browser, preview localStorage)
  await page.goto(url("today=2026-11-25", "#day-1/learn"), { waitUntil: "load" });
  await page.click("#lesson-JC-02 .sd-lesson-actions .sd-btn"); await sleep(50); // Reopen
  await page.reload({ waitUntil: "load" });
  const re = await text(page, "#lesson-JC-02 .sd-card-h .sd-badge");
  check("Reopen survives reload (JC-02 In progress)", /In progress/.test(re), re);
  await page.click("#practice-JC-02-p1, #lesson-JC-02 .sd-lesson-actions .sd-btn-primary").catch(() => {});
  await page.evaluate(() => window.__studyDeskApply({ type: "practice", id: "JC-02-p1", status: "pending", evidence: "" }));
  await page.evaluate(() => window.__studyDeskApply({ type: "lesson", id: "JC-02", status: "pending" }));
  await page.reload({ waitUntil: "load" });
  const un = await page.evaluate(() => ({ rec: window.__studyDeskProgress().lessons["JC-02"] || null, badge: document.querySelector("#lesson-JC-02 .sd-card-h .sd-badge").textContent }));
  check("Uncheck survives reload (JC-02 no longer complete; session 1 reopened)", !un.rec && !/Complete/.test(un.badge) && /In progress/.test(await text(page, ".sd-dayhead .sd-badge")), JSON.stringify(un));
  await page.evaluate(() => localStorage.clear());
  check("progress flow: no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

/* ---------- 4. migration, ordering, search, coverage ---------- */
{
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  await go(page, "store=0&migrate=1&today=2026-11-23", "#day-2/revision");
  const mig = await page.evaluate(() => { const p = window.__studyDeskProgress(); return { v: p.schemaVersion, jc03: (p.lessons["JC-03"] || {}).status, dsa01: (p.lessons["DSA-01"] || {}).status, hld: (p.lessons["HLD-01"] || {}).status, jc05: (p.lessons["JC-05"] || {}).status, notes: p.notes.S01 }; });
  check("Old day-based progress migrates to stable lesson IDs (QA M11: the v1 HLD block stays legacy, no future lesson touched)", mig.v === 2 && mig.jc03 === "complete" && mig.dsa01 === "complete" && mig.hld === undefined && mig.jc05 === "in-progress" && /Encapsulation/.test(mig.notes), JSON.stringify(mig));
  const order = await page.evaluate(() => { const a = document.querySelector(".sd-mynotes-card"), b = document.querySelector(".sd-suggested"); return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)) && /Encapsulation/.test(a.textContent); });
  check("Quick revision: my migrated notes from session 1 come before suggested points", order);
  await go(page, "store=0&today=2026-11-22", "#day-1/learn");
  const vf = await page.evaluate(() => { const v = document.querySelector("#lesson-JC-02 .sd-video"), n = document.querySelector("#lesson-JC-02 .sd-notes"); return !!(v && n && v.querySelector(".sd-source") && v.querySelector(".sd-watch") && (v.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)); });
  check("Videos & notes: source + suggested watch time before the notes", vf);
  check("Diagrams render as a labelled flow", await page.$eval("#lesson-JC-01 .sd-flow", e => e.getAttribute("aria-label")).then(a => /Hello.java then javac/.test(a)).catch(() => false));
  check("Every lesson shows its source label (GfG mapping or source: added)", await page.evaluate(() => [...document.querySelectorAll(".sd-lesson")].every(a => a.querySelector(".sd-chip-gfg, .sd-chip-added"))));
  await page.type("#sd-search", "oauth"); await sleep(50);
  const sc = await text(page, "#sd-search-count"), links = await allText(page, ".sd-tree .sd-treelink");
  check("Search 'oauth' finds the Google OAuth2 lesson", links.length >= 1 && links.some(l => /Google OAuth2/.test(l)) && /match/.test(sc), sc + " | " + links.join(" | "));
  await page.$eval("#sd-search", e => { e.value = ""; e.dispatchEvent(new Event("input")); });
  await page.type("#sd-search", "added"); await sleep(50);
  const added = await allText(page, ".sd-tree .sd-treelink small");
  const addedIds = COURSE.subjects.flatMap(x => x.modules.flatMap(m => m.lessons)).filter(l => l.source.kind === "added").map(l => l.id);
  check("Search 'added' lists only supplementary lessons", added.length === addedIds.length && added.every(t => addedIds.some(id => t.includes(id))), added.join(", "));
  await page.goto(`${origin}/ui/coverage.html`, { waitUntil: "load" });
  const cov = await text(page, "h1");
  const lc = Object.keys(SE.indexCourse(COURSE).lessonById).length;
  check("Coverage page: all fixture sessions resolve and every lesson is scheduled", new RegExp(`All ${N} sessions resolve`).test(cov) && new RegExp(`${lc}/${lc} lessons scheduled`).test(await text(page, ".sd-hero-meta")), cov + " | " + await text(page, ".sd-hero-meta"));
  const refBadge = await text(page, "#cov-ref-badge"), opsState = await page.$eval("[data-ref=ref-ops]", e => e.className).catch(() => "");
  check("QA M14: coverage shows missing reference topics in red (fixture is not 100% covered; delivery subject missing)", /^✗ \d+\/\d+ reference topics/.test(refBadge) && /cov-missing/.test(opsState) && await page.$$eval("#cov-reference .cov-miss", r => r.length) > 0, refBadge + " | " + opsState);
  check("QA M13: coverage shows every session fits its time slots", /every session fits/.test(await text(page, "#cov-warn-badge")));
  await page.screenshot({ path: path.join(outDir, "coverage.png"), fullPage: true });
  check("migration/search/coverage: no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

/* ---------- 5. keyboard ---------- */
for (const [vpName, vp] of Object.entries(viewports)) {
  const errors = [];
  const page = await newPage(vp, errors);
  await go(page, "store=0&today=2026-11-22", "#day-1");
  await page.focus("#demo-reset"); await page.keyboard.press("Tab");
  check(`${vpName} kbd: first Tab into Study Desk lands on the skip link`, await page.evaluate(() => document.activeElement.classList.contains("sd-skip")));
  await page.keyboard.press("Enter");
  check(`${vpName} kbd: skip link moves focus to main`, await page.evaluate(() => document.activeElement.id === "sd-main"));
  const ring = await page.evaluate(() => { const t = document.querySelector(".sd-tab"); t.focus(); const cs = getComputedStyle(t); return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2; });
  check(`${vpName} kbd: focus ring visible on tabs`, ring);
  await page.focus(".sd-tab:nth-child(2)"); await page.keyboard.press("Enter"); await sleep(60);
  check(`${vpName} kbd: Enter on a tab opens Videos & notes and focuses the heading`, (await info(page)).view === "learn" && await page.evaluate(() => document.activeElement.tagName === "H1"));
  // Quiz by keyboard: focus radio, arrow to "False", Space, submit with Enter.
  await page.focus("#q-JC-01-0-0"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("Space");
  await page.focus("#lesson-JC-01 .sd-quiz button[type=submit]"); await page.keyboard.press("Enter"); await sleep(60);
  check(`${vpName} kbd: lesson check answered and submitted by keyboard`, /Passed/.test(await text(page, "#lesson-JC-01 .sd-quiz h3")));
  if (vpName.startsWith("mobile")) {
    await page.focus(".sd-navtoggle"); await page.keyboard.press("Enter"); await sleep(250);
    const open = await page.evaluate(() => document.querySelector(".sd-root").classList.contains("sd-nav-open") && document.querySelector(".sd-sidebar").contains(document.activeElement));
    check("mobile kbd: Enter opens the course drawer and moves focus into it", open);
    await page.screenshot({ path: path.join(outDir, "mobile-drawer.png") });
    await page.keyboard.press("Escape"); await sleep(250);
    check("mobile kbd: Esc closes the drawer and returns focus to the toggle", await page.evaluate(() => !document.querySelector(".sd-root").classList.contains("sd-nav-open") && document.activeElement.classList.contains("sd-navtoggle")));
  } else {
    await page.focus(".sd-sidenav a"); await page.keyboard.press("ArrowDown");
    check("desktop kbd: ArrowDown moves through sidebar links", await page.evaluate(() => document.activeElement.textContent.includes("Course")));
    const sum = await page.evaluate(() => { const s = [...document.querySelectorAll(".sd-tree summary")].find(x => !x.parentElement.open); s.focus(); return s.textContent; });
    await page.keyboard.press("Enter"); await sleep(30);
    check("desktop kbd: Enter on a module summary expands it", await page.evaluate(() => document.activeElement.parentElement.open), sum);
    await page.focus("#sd-search"); await page.type("#sd-search", "parking"); await page.keyboard.press("Enter"); await sleep(80);
    check("desktop kbd: Enter in search opens the first match", (await info(page)).hash === `#day-${sessionOf("LLD-04")}/learn`, (await info(page)).hash);
  }
  check(`${vpName} kbd: no console errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

/* ---------- 6. QA 2026-11-21 regressions (browser) ---------- */
{
  const errors = [];
  const KEY = "studydesk.preview.v2";
  const page = await newPage(viewports.desktop, errors);
  const stored = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || "null"), KEY);
  const keys = () => page.evaluate(() => Object.keys(localStorage));
  // M1: malformed hash on a fresh load renders not-found, never a blank page.
  const fresh = await browser.newPage(); const fe = [];
  fresh.on("pageerror", e => fe.push(String(e))); await fresh.setViewport(viewports.desktop);
  await fresh.goto(url("store=0&today=2026-11-22", "#%E0%A4%A"), { waitUntil: "load" });
  check("QA M1: malformed URL hash on fresh load shows 'not found' (no blank page, no crash)", fe.length === 0 && await fresh.$eval("#study-desk", e => e.textContent.length > 50) && /Not in this plan|no page/i.test(await text(fresh, ".sd-main")), fe.join(" | "));
  await fresh.close();
  // L5: #day-01 is canonicalised.
  await go(page, "store=0&today=2026-11-22", "#day-01");
  check("QA L5: #day-01 is rewritten to the canonical #day-1", await page.evaluate(() => location.hash) === "#day-1", await page.evaluate(() => location.hash));
  // H3: study day = IST date with a 04:00 cutoff, re-evaluated without reload.
  await page.goto(url("", "#today"), { waitUntil: "load" });
  const ist = (d, t) => Date.parse(d + "T" + t + ":00+05:30");
  const t1 = await page.evaluate(ms => window.__studyDeskTick(ms), ist("2026-11-23", "00:30"));
  const h1a = await text(page, ".sd-hero-meta");
  const t2 = await page.evaluate(ms => window.__studyDeskTick(ms), ist("2026-11-23", "04:01"));
  const h1b = await text(page, ".sd-hero-meta");
  check("QA H3: 00:30 IST still counts as the previous study day; 04:01 rolls over without reload", t1 === "2026-11-22" && t2 === "2026-11-23" && h1a !== h1b, `${t1} / ${t2} | ${h1a} -> ${h1b}`);
  // M7: 0-minute day = day off; 10 minutes is refused with a message.
  await go(page, "store=0&today=2026-11-23", "#today");
  await page.$eval("#sd-mins", e => e.value = "10"); await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(2) .sd-btn"); await sleep(50);
  check("QA M7: 10 minutes is refused with a reason (0 or 30–960)", /30/.test(await text(page, ".sd-toast")) && !(await page.evaluate(() => window.__studyDeskProgress().schedule.dateMinutes["2026-11-23"])), await text(page, ".sd-toast"));
  await page.$eval("#sd-mins", e => e.value = "0"); await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(2) .sd-btn"); await sleep(50);
  check("QA M7: 0 minutes makes the date a day off (session moves on, no 'short day')", /0 minutes planned .*day off/.test(await text(page, ".sd-main")) && !/Short day/.test(await text(page, ".sd-main")), (await text(page, ".sd-main h2")).slice(0, 80));
  // L6: revision done is tracked.
  await go(page, "store=0&today=2026-11-23", "#day-2/revision");
  await page.evaluate(() => [...document.querySelectorAll(".sd-main button")].find(b => /✓ Revision done/.test(b.textContent)).click()); await sleep(50);
  check("QA L6: 'Revision done' is recorded and survives re-render", !!(await page.evaluate(() => window.__studyDeskProgress().revisions["S02"])) && /Revision done \(undo\)/.test(await text(page, ".sd-main")));
  // M2: notes typed and reloaded immediately are not lost.
  await page.goto(url("today=2026-11-22", "#day-1/my-notes"), { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "load" });
  await page.type("#sd-notes-ta", "flush me please");
  await page.reload({ waitUntil: "load" });   // well inside the 600 ms debounce
  check("QA M2: notes typed then reloaded immediately are saved (flush on pagehide)", ((await stored()) || { notes: {} }).notes.S01 === "flush me please" && await page.$eval("#sd-notes-ta", e => e.value) === "flush me please");
  // M3: storage full -> visible "Not saved", not a fake "Saved".
  const filled = await page.evaluate(() => { let i = 0; for (const size of [1 << 20, 1 << 16, 1 << 10, 64, 1]) { const chunk = "x".repeat(size); try { for (;;) localStorage.setItem("filler" + (i++), chunk); } catch (e) {} } return i; });
  await page.type("#sd-notes-ta", " + more text"); await sleep(800);
  const st = await text(page, "#sd-notes-status"), alertT = await text(page, ".sd-alert");
  check("QA M3: storage full shows 'Not saved' (status + alert), never 'Saved'", /Not saved/.test(st) && /full/.test(alertT), st + " | " + alertT + " | fillers " + filled);
  await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("filler")).forEach(k => localStorage.removeItem(k)));
  // M4: corrupt / invalid data is backed up, not wiped.
  await page.evaluate(k => localStorage.setItem(k, "{not json"), KEY); await page.reload({ waitUntil: "load" });
  let ks = await keys(); const bk = ks.find(k => k.startsWith(KEY + ".backup."));
  check("QA M4: corrupt JSON is backed up and a notice is shown", !!bk && await page.evaluate(k => localStorage.getItem(k), bk) === "{not json" && /backup|copy/i.test(await text(page, "#host-notice")), (bk || "no backup") + " | " + await text(page, "#host-notice"));
  await page.evaluate(k => { Object.keys(localStorage).forEach(x => localStorage.removeItem(x)); localStorage.setItem(k, JSON.stringify({ schemaVersion: 2, schedule: { unavailable: "oops" } })); }, KEY); await page.reload({ waitUntil: "load" });
  ks = await keys();
  check("QA M4: structurally invalid progress is backed up instead of crashing later", ks.some(k => k.startsWith(KEY + ".backup.")) && errors.length === 0, ks.join(", "));
  // M5: two tabs do not overwrite each other.
  await page.evaluate(() => localStorage.clear()); await page.goto(url("today=2026-11-22", "#day-1/my-notes"), { waitUntil: "load" });
  const tabB = await newPage(viewports.desktop, errors);
  await tabB.goto(url("today=2026-11-22", "#day-2/my-notes"), { waitUntil: "load" });
  await page.type("#sd-notes-ta", "from tab A"); await sleep(800);
  await tabB.type("#sd-notes-ta", "from tab B"); await sleep(800);
  const both = (await stored()).notes;
  check("QA M5: notes from two open tabs are both kept (storage-event sync)", both.S01 === "from tab A" && both.S02 === "from tab B", JSON.stringify(both));
  await tabB.close();
  // M6: Reset asks first and keeps a copy.
  page.once("dialog", d => d.dismiss()); await page.click("#demo-reset"); await sleep(80);
  check("QA M6: cancelling Reset keeps progress", ((await stored()) || { notes: {} }).notes.S01 === "from tab A");
  page.once("dialog", d => d.accept()); await page.click("#demo-reset"); await sleep(150);
  const lastReset = await page.evaluate(k => JSON.parse(localStorage.getItem(k + ".lastReset") || "null"), KEY);
  check("QA M6: confirming Reset clears progress but keeps a .lastReset copy", lastReset && lastReset.notes.S01 === "from tab A" && !((await stored()) || { notes: {} }).notes.S01);
  // M10: a failed retake does not reopen a passed lesson check.
  await page.evaluate(() => localStorage.clear()); await page.goto(url("today=2026-11-22", "#day-1/learn"), { waitUntil: "load" });
  await page.click("#lesson-JC-01 .sd-quiz input[value='1']"); await page.click("#lesson-JC-01 .sd-quiz button[type=submit]"); await sleep(50);
  await page.click("#lesson-JC-01 .sd-lesson-actions .sd-btn-primary"); await sleep(50);
  await page.click("#lesson-JC-01 .sd-quiz input[value='0']"); await page.click("#lesson-JC-01 .sd-quiz button[type=submit]"); await sleep(50);
  const q = await page.evaluate(() => window.__studyDeskProgress().quizzes["JC-01"]);
  check("QA M10: failed retake keeps the earlier pass and the lesson stays complete", q.passed && q.best === 100 && q.score === 0 && /Complete/.test(await text(page, "#lesson-JC-01 .sd-card-h .sd-badge")) && /earlier pass/.test(await text(page, ".sd-toast")), JSON.stringify(q));
  await page.evaluate(() => localStorage.clear());
  check("QA regressions: no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  // L1: root index opens the Study Desk: a link/redirect (placeholder) or, since gpt/topic-index, the real app shell itself.
  const rootErrors = [];
  page.removeAllListeners("console"); page.removeAllListeners("pageerror");
  page.on("pageerror", e => rootErrors.push(String(e))); page.on("console", m => { if (m.type() === "error") rootErrors.push(m.text()); });
  await page.goto(`${origin}/index.html`, { waitUntil: "load" }); await sleep(300);
  check("QA L1: root index.html opens the Study Desk", await page.evaluate(() => !!document.querySelector('a[href="ui/"], a[href="ui/index.html"], meta[http-equiv="refresh" i]') || (!!document.querySelector("#app") && !!document.querySelector('script[src$="app.js"]'))));
  // Root = Codex's app.js. It still calls the v1 StudyDesk API (parseHash, curriculum/days); reported, not counted, until Codex switches to ui/adapters/codex-adapter.js.
  if (rootErrors.length) blocked("Root app (Codex app.js) mounts StudyDesk v2 without errors", "owner Codex: " + rootErrors.slice(0, 2).join(" | "));
  else check("Root app (Codex app.js) mounts StudyDesk v2 without errors", true);
  await page.close();
}

/* ---------- 7. drawer focus trap + light-theme contrast (axe) ---------- */
for (const vpName of ["mobile", "mobile320"]) {
  const errors = [];
  const page = await newPage(viewports[vpName], errors);
  await go(page, "store=0&today=2026-11-22", "#today");
  await page.click(".sd-navtoggle"); await sleep(80);
  const inertMain = await page.evaluate(() => document.querySelector(".sd-main").inert || !!document.querySelector(".sd-main").closest("[inert]"));
  const outside = [];
  for (let k = 0; k < 220; k++) { await page.keyboard.press("Tab"); const inside = await page.evaluate(() => !!document.activeElement.closest("#sd-sidebar")); if (!inside) outside.push(await page.evaluate(() => document.activeElement.outerHTML.slice(0, 60))); }
  check(`QA M15 ${vpName}: open drawer traps Tab inside the sidebar and makes the page inert`, inertMain && outside.length === 0, outside.slice(0, 2).join(" | "));
  await page.keyboard.press("Escape"); await sleep(50);
  check(`QA M15 ${vpName}: Escape closes the drawer, page is interactive again`, await page.evaluate(() => !document.querySelector(".sd-main").closest("[inert]") && document.activeElement.classList.contains("sd-navtoggle")));
  await page.close();
}
{
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  check("axe-core available for the contrast check", !!AXE, "npm i axe-core into NODE_PATH");
  const bad = [];
  if (AXE) for (const [q, h] of [["store=0&today=2026-11-22", "#today"], ["store=0&today=2026-11-22", "#day-1/learn"], ["store=0&today=2026-11-22", "#day-1/practice"], ["store=0&today=2026-11-22", "#calendar"], ["store=0&today=2026-11-22", "#course"], ["store=0&today=2026-11-23", "#day-2/revision"], ["store=0&today=2026-11-22", "#day-3/test"],
    ["store=0&today=2026-11-22", "#activity"], ["store=0&today=2026-11-22", "#settings"], ["engagement=example", "#today"], ["engagement=example", "#activity"], ["engagement=example", "#settings"], ["engagement=example", "#day-5/coach"]]) {
    await go(page, q, h); await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["color-contrast"] })).violations.flatMap(x => x.nodes.map(n => n.target.join(" ") + " " + (n.any[0] && n.any[0].data ? n.any[0].data.contrastRatio : ""))));
    v.forEach(x => bad.push(h + " " + x));
  }
  if (AXE) { await page.goto(`${origin}/ui/coverage.html`, { waitUntil: "load" }); await page.addScriptTag({ content: AXE });
    (await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["color-contrast"] })).violations.flatMap(x => x.nodes.map(n => n.target.join(" "))))).forEach(x => bad.push("coverage " + x)); }
  check("QA M9: light theme has no axe color-contrast violations (Today, Learn, Practice, Calendar, Course, Revision, Test, Coverage, Activity, Reminders, example engagement)", AXE && bad.length === 0, bad.slice(0, 4).join(" | "));
  // Dark theme on the new engagement views
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  const badDark = [];
  if (AXE) for (const [q, h] of [["engagement=example", "#today"], ["engagement=example", "#activity"], ["engagement=example", "#settings"]]) {
    await go(page, q, h); await page.addScriptTag({ content: AXE });
    (await page.evaluate(async () => (await window.axe.run(document.querySelector(".sd-main"), { runOnly: ["color-contrast"] })).violations.flatMap(x => x.nodes.map(n => n.target.join(" ") + " " + (n.any[0] && n.any[0].data ? n.any[0].data.contrastRatio : "")))))
      .forEach(x => badDark.push(h + " " + x));
  }
  check("Engagement: dark theme has no axe color-contrast violations (example Today, Activity, Reminders)", AXE && badDark.length === 0, badDark.slice(0, 4).join(" | "));
  await page.close();
}

/* ---------- 8. engagement: XP / level / streak, tasks, challenges, activity, reminder settings ---------- */
{
  const shotDir = process.env.ENG_SHOTS || path.join(outDir, "engagement");
  fs.mkdirSync(shotDir, { recursive: true });
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  // Fresh learner, Day 1
  await go(page, "store=0&today=2026-11-22", "#today");
  const strip = await text(page, ".sd-eng-strip");
  check("Engagement: Today shows XP, level and streak header (fresh: 0 XP, level 1, no streak)", /0 XP/.test(strip) && /Level 1 · Rookie/.test(strip) && /No streak yet/.test(strip), strip);
  const ringLabel = await page.$eval(".sd-tasks .sd-ring", e => e.getAttribute("aria-label")).catch(() => "");
  const nTasks = await page.$$eval(".sd-tasklist .sd-task", es => es.length);
  check("Engagement: today's tasks checklist with an accessible progress ring", nTasks >= 6 && ringLabel === `0 of ${nTasks} tasks done today`, ringLabel + " / " + nTasks);
  check("Engagement: daily and weekly challenge cards", (await page.$$eval(".sd-chal", es => es.map(e => e.dataset.period))).join(",") === "daily,weekly");
  check("Engagement: no 'Example data' label on real (derived) numbers", !(await page.$(".sd-chip-example")));
  // A locked challenge cannot be claimed
  await page.click(".sd-chal-daily button[data-challenge]"); await sleep(80);
  check("Engagement: a locked challenge explains what is missing instead of claiming", /Not yet/.test(await text(page, ".sd-toast")) && !(await page.evaluate(() => (window.__studyDeskProgress().challenges || {})["daily-2026-11-22"])));
  // Finish the warm-up through the host: XP, ring and activity log update
  const ok = await finishLessonViaHost(page, "JC-01"); await sleep(50);
  const xpAfter = await page.evaluate(() => window.__studyDesk.getDerived().eng.xp);
  check("Engagement: finishing JC-01 (check 100% + lesson) earns 80 XP and ticks two tasks", ok && xpAfter === 80 && /80 XP/.test(await text(page, ".sd-eng-strip")) &&
    (await page.$eval(".sd-tasks .sd-ring", e => e.getAttribute("aria-label"))) === `2 of ${nTasks} tasks done today`, "xp=" + xpAfter);
  check("Engagement: streak starts on the first study action", /1-day streak/.test(await text(page, ".sd-eng-strip")));
  const prog = await page.evaluate(() => window.__studyDeskProgress());
  check("Engagement: every change is logged with an ISO timestamp and lastActiveAt is set", Array.isArray(prog.activity) && prog.activity.length === 2 && prog.activity.every(a => /^\d{4}-\d\d-\d\dT.*Z$/.test(a.at) && a.date === "2026-11-22") && prog.lastActiveAt === prog.activity[1].at,
    JSON.stringify(prog.activity && prog.activity[1]));
  // Claim the teach-back / interview / etc challenge after meeting it
  const ch = await page.evaluate(() => window.__studyDesk.getDerived().eng.challenges[0]);
  await page.evaluate(() => {
    const S = window.StudyDeskSchedule, c = window.STUDY_DESK_FIXTURES.course, E = window.StudyDeskEngagement, r = S.resolveSessions(c).sessions[0];
    r.lessons.concat(r.dsa).forEach(l => {
      if (l.quiz) { const a = {}; l.quiz.questions.forEach(q => a[q.id] = q.answer); window.__studyDeskApply({ type: "quiz", id: l.id, answers: a }); }
      (l.practice || []).forEach(p => window.__studyDeskApply({ type: "practice", id: p.id, status: "complete", evidence: "https://github.com/example/" + p.id }));
      window.__studyDeskApply({ type: "lesson", id: l.id, status: "complete" });
      E.questionsOf(l).forEach(q => window.__studyDeskApply({ type: "interview", id: q.id, lessonId: l.id }));
    });
    window.__studyDeskApply({ type: "note", key: r.id, text: "one\ntwo\nthree" });
  });
  await sleep(50);
  const chBtn = await page.$(".sd-chal-daily button[data-challenge]");
  const enabled = chBtn && await chBtn.evaluate(b => b.getAttribute("aria-disabled") !== "true");
  const xpBefore = await page.evaluate(() => window.__studyDesk.getDerived().eng.xp);
  if (chBtn) { await chBtn.focus(); await page.keyboard.press("Enter"); await sleep(80); }
  const xpClaim = await page.evaluate(() => window.__studyDesk.getDerived().eng.xp);
  check(`Engagement: a met daily challenge (${ch.kind}) is claimable by keyboard and pays 30 XP`, enabled && xpClaim - xpBefore === 30 && /Claimed \+30 XP/.test(await text(page, ".sd-chal-daily")), `${xpBefore} -> ${xpClaim}`);
  const tk = await page.evaluate(() => window.__studyDesk.getDerived().eng.tasks);
  check("Engagement: all of Day 1's tasks done -> ring full and 'All done' message", tk.allDone && /All done/.test(await text(page, ".sd-tasks")), `${tk.done}/${tk.total}`);
  await page.screenshot({ path: path.join(shotDir, "desktop-today-day1-all-done.png"), fullPage: true });
  // Activity view
  await page.evaluate(() => { location.hash = "#activity"; }); await sleep(80);
  const act = await text(page, ".sd-main");
  check("Engagement: #activity says numbers are calculated locally and shows streak, badges, points history, activity log with IST times, and the points table",
    /Calculated in this browser from your progress/.test(act) && /Streak/.test(act) && /Badges/.test(act) && /Points history/.test(act) && /Activity log/.test(act) && /Last study activity: Sun, 22 Nov, \d+:\d\d (AM|PM) IST/.test(act) && /How points work/.test(act) && /First step/.test(act), act.slice(0, 120));
  check("Engagement: sidebar links to Activity and Reminders", (await allText(page, ".sd-sidenav a")).join("|").includes("Activity") && (await allText(page, ".sd-sidenav a")).join("|").includes("Reminders"));
  // Coach: mark an interview answer
  await go(page, "store=0&today=2026-11-23", "#day-2/coach");
  const qBtn = await page.$("button[data-qid]");
  check("Engagement: coach questions have a 'Mark answered' toggle", !!qBtn && /Mark answered/.test(await qBtn.evaluate(b => b.textContent)) && (await qBtn.evaluate(b => b.getAttribute("aria-pressed"))) === "false");
  if (qBtn) { await qBtn.click(); await sleep(60); }
  check("Engagement: marking an answer stores it and earns 5 XP", await page.evaluate(() => Object.keys(window.__studyDeskProgress().interview || {}).length === 1 && window.__studyDesk.getDerived().eng.xp === 5) &&
    (await page.$eval("button[data-qid]", b => b.getAttribute("aria-pressed"))) === "true");
  check("Engagement: no console errors (desktop flow)", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}
{
  // Reminder settings: validation, save, persistence (localStorage host), 'not wired' notice
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  await go(page, "today=2026-11-22", "#settings");
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "load" });
  check("Engagement: settings say email sending is not wired yet", /Email sending is not wired yet/.test(await text(page, ".sd-main")));
  check("Engagement: reminder defaults are off, every 2½ h, quiet 00:00–06:00, max 6", await page.evaluate(() =>
    !document.getElementById("sd-pref-email").checked && document.getElementById("sd-pref-iv").value === "2.5" && document.getElementById("sd-pref-qs").value === "00:00" && document.getElementById("sd-pref-qe").value === "06:00" && document.getElementById("sd-pref-max").value === "6"));
  await page.click("#sd-pref-email"); await page.click("button[type=submit]"); await sleep(60);
  check("Engagement: turning email on without an address is refused with a message and focus on the address field",
    /email address/i.test(await text(page, "#sd-pref-err")) && await page.evaluate(() => document.activeElement.id === "sd-pref-addr") && !(await page.evaluate(() => (window.__studyDeskProgress().prefs || {}).notifications)));
  await page.type("#sd-pref-addr", "deepak@example.com"); await page.select("#sd-pref-iv", "3");
  await page.$eval("#sd-pref-qs", e => { e.value = "23:30"; }); await page.$eval("#sd-pref-qe", e => { e.value = "07:00"; });
  await page.click("button[type=submit]"); await sleep(80);
  const n = await page.evaluate(() => (window.__studyDeskProgress().prefs || {}).notifications);
  check("Engagement: valid reminder settings are saved with progress", n && n.email === true && n.address === "deepak@example.com" && n.intervalHours === 3 && n.quietStart === "23:30" && n.quietEnd === "07:00", JSON.stringify(n));
  check("Engagement: save confirmation repeats that email is not wired", /not wired/.test(await text(page, ".sd-toast")));
  await page.reload({ waitUntil: "load" }); await sleep(50);
  check("Engagement: reminder settings survive a reload", await page.evaluate(() => document.getElementById("sd-pref-email").checked && document.getElementById("sd-pref-addr").value === "deepak@example.com" && document.getElementById("sd-pref-qs").value === "23:30"));
  check("Engagement: settings preview the next reminder time in IST", /would go out around .* IST|No study activity/.test(await text(page, "#sd-pref-next")), await text(page, "#sd-pref-next"));
  check("Engagement: settings changes are logged but do not count as study activity", await page.evaluate(() => { const p = window.__studyDeskProgress(); return p.activity.some(a => a.type === "prefs") && !p.lastActiveAt; }));
  await page.evaluate(() => localStorage.clear());
  check("Engagement: no console errors (settings)", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}
{
  // Example data mode, host override, engagement:false, 320px and screenshots
  const shotDir = process.env.ENG_SHOTS || path.join(outDir, "engagement");
  for (const [vpName, vp] of [["desktop", viewports.desktop], ["mobile320", viewports.mobile320]]) {
    const errors = [];
    const page = await newPage(vp, errors);
    for (const [hash, name] of [["#today", "today"], ["#activity", "activity"], ["#settings", "settings"], ["#day-5/coach", "coach"]]) {
      await go(page, "engagement=example", hash);
      const i = await info(page);
      const labelled = await page.evaluate(() => /Example data/.test(document.body.innerText));
      check(`Engagement example ${vpName} ${hash}: labelled 'Example data', no horizontal overflow`, labelled && !i.overflowX, `sw=${i.sw} cw=${i.cw}`);
      await page.screenshot({ path: path.join(shotDir, `${vpName}-example-${name}.png`), fullPage: true });
    }
    await go(page, "engagement=example", "#today");
    const strip = await text(page, ".sd-eng-strip");
    check(`Engagement example ${vpName}: example history shows a 5-day streak, level 4 and an 'Example data' chip`, /5-day streak/.test(strip) && /Level 4/.test(strip) && /Example data/.test(strip), strip);
    for (const [hash, name] of [["#today", "today"], ["#activity", "activity"], ["#settings", "settings"]]) {
      await go(page, "store=0&today=2026-11-22", hash);
      await page.screenshot({ path: path.join(shotDir, `${vpName}-fresh-${name}.png`), fullPage: true });
    }
    check(`Engagement ${vpName}: no console errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
    await page.close();
  }
  const errors = [];
  const page = await newPage(viewports.desktop, errors);
  await go(page, "store=0&today=2026-11-22", "#today");
  await page.evaluate(() => window.__studyDesk.update({ engagement: { xp: 2000, source: "host", streak: { current: 9 } } })); await sleep(50);
  const st = await text(page, ".sd-eng-strip");
  check("Engagement: host-supplied options.engagement overrides derived numbers (level recomputed)", /2,000 XP/.test(st) && /Level 5/.test(st) && /9-day streak/.test(st) && !(await page.$(".sd-chip-example")), st);
  await go(page, "store=0&today=2026-11-22&engagement=off", "#today");
  const offOk = !(await page.$(".sd-eng-strip")) && !(await page.$(".sd-tasks")) && (await allText(page, ".sd-sidenav a")).length === 3;
  await go(page, "store=0&today=2026-11-22&engagement=off", "#activity");
  check("Engagement: engagement:false keeps the old UI (no strip, no tasks, 3 nav links, #activity not found)", offOk && (await info(page)).view === "not-found");
  // Keyboard: the stat links and task links are reachable with Tab
  await go(page, "store=0&today=2026-11-22", "#today");
  const seen = new Set();
  for (let k = 0; k < 60; k++) { await page.keyboard.press("Tab"); seen.add(await page.evaluate(() => (document.activeElement.className || "") + "")); }
  check("Engagement: XP/streak links and task links are keyboard reachable", [...seen].some(c => /sd-stat/.test(c)) && [...seen].some(c => /sd-task-t/.test(c)), [...seen].slice(0, 8).join(","));
  check("Engagement: no console errors (override/off)", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok);
fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed` + (blockedList.length ? ` · ${blockedList.length} blocked (not counted): ` + blockedList.map(b => b.name).join("; ") : ""));
process.exit(failed.length ? 1 : 0);
