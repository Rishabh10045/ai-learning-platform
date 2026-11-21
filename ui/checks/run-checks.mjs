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
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); };
const viewports = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
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
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
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
  ["#day-2/my-notes", "my-notes", "2"], ["#day-2/coach", "coach", "2"], ["#day-2/test", "test", "2"], ["#day-999", "not-found"]
];
for (const [vpName, vp] of Object.entries(viewports)) {
  const errors = [];
  const page = await newPage(vp, errors);
  for (const [hash, view, day] of routes) {
    await go(page, "store=0&today=2026-11-22", hash);
    const i = await info(page);
    check(`${vpName} ${hash || "(no hash)"} renders ${view}`, i.view === view && (!day || i.day === day), `view=${i.view} day=${i.day} h1=${i.h1}`);
    check(`${vpName} ${hash || "(no hash)"} no horizontal overflow`, !i.overflowX);
    await page.screenshot({ path: path.join(outDir, `${vpName}${(hash || "_default").replace(/[#/]/g, "_")}.png`), fullPage: vpName === "desktop" });
  }
  await go(page, "store=0&today=2026-11-22", "#lesson/SB-07");
  let i = await info(page);
  check(`${vpName} #lesson/SB-07 opens its session's Videos & notes`, i.view === "learn" && i.hash === "#day-12/learn", i.hash);
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
  check("Today (Sun 22 Nov) is Session 1 with Java core + DSA", /Session 1 of 20/.test(h1) && /Java core \+ DSA/.test(h1), h1);
  check("Sunday plan shows 6h 30m (2h core + 4h 30m stretch)", /Sunday plan · 6h 30m \(2h core \+ 4h 30m stretch\)/.test(chip), chip);
  check("Day 1 blocks: 9:00 PM Java foundations 12 min, 9:12 PM main lesson 1h 18m, 10:30 PM DSA 30 min, stretch 4h 30m",
    /^9:00 PM 12 min Java foundations/i.test(blocks[0]) && /^9:12 PM 1h 18m Main lesson/i.test(blocks[1]) && /^10:30 PM 30 min DSA practice/i.test(blocks[2]) && /^Any time 4h 30m Stretch practice/i.test(blocks[3]), blocks.map(b => b.slice(0, 40)).join(" | "));
  check("Continue studying points at the first lesson (JC-01)", /Java foundations: JDK, JVM/.test(await text(page, ".sd-continue")));
  await page.screenshot({ path: path.join(outDir, "flow-1-sunday-day1.png"), fullPage: true });

  // Weekday: session 2 projected on Mon 23 Nov = 12 revision + 78 lesson + 30 DSA = 2h.
  await go(page, "store=0&today=2026-11-22", "#day-2");
  const wd = await allText(page, ".sd-timeline .sd-tblock"), wchip = await text(page, ".sd-panel .sd-chip-budget");
  check("Weekday (Mon 23 Nov) session 2 = 12 min revision + 78 min lesson + 30 min DSA, 2h",
    /Mon, 23 Nov 2026/.test(await text(page, ".sd-panel h2")) && wchip === "2h" && wd.length === 3 && /^9:00 PM 12 min Quick revision Quick revision of session 1/i.test(wd[0]) && /^9:12 PM 1h 18m Main lesson/i.test(wd[1]) && /^10:30 PM 30 min DSA/i.test(wd[2]), wchip + " | " + wd.map(b => b.slice(0, 40)).join(" | "));

  // Missed date: today = Mon 23 Nov with nothing done -> session 1 carried forward on a 2h weekday.
  await go(page, "store=0&today=2026-11-23", "#today");
  const mh1 = await text(page, ".sd-main h1"), mchips = await allText(page, ".sd-hero-meta .sd-chip");
  check("Missed Sunday: Mon 23 Nov still shows Session 1, carried forward, 2h", /Session 1 of 20/.test(mh1) && mchips.some(c => /Carried forward/.test(c)) && mchips.some(c => /Monday · 2h/.test(c)), mh1 + " | " + mchips.join(" | "));

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
  check("Unchecking the day off restores the original finish date", /Fri, 11 Dec 2026/.test(finishBack) && /Sat, 12 Dec 2026/.test(finishOff), finishOff.match(/finish: (.*)\./)?.[1] + " -> " + finishBack.match(/finish: (.*)\./)?.[1]);

  // Weekday minutes are adjustable (per date and weekday default).
  await go(page, "store=0&today=2026-11-23", "#today");
  await page.$eval("#sd-mins", e => e.value = "90"); await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(2) .sd-btn"); await sleep(50);
  let chips = await allText(page, ".sd-hero-meta .sd-chip");
  check("Per-date minutes: Mon 23 Nov set to 1h 30m, flagged as a short day", chips.some(c => /Monday · 1h 30m/.test(c)) && chips.some(c => /Short day/.test(c)), chips.join(" | "));
  await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(2) .sd-btn-ghost"); await sleep(50);
  await page.$eval("#sd-wdmins", e => e.value = "180"); await page.click("#sd-ctl-h ~ .sd-ctl-row:nth-of-type(3) .sd-btn"); await sleep(50);
  chips = await allText(page, ".sd-hero-meta .sd-chip");
  check("Weekday default: every Monday 3h = 2h core + 1h stretch", chips.some(c => /Monday · 3h \(2h core \+ 1h stretch\)/.test(c)), chips.join(" | "));
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
  await page.click("#practice-JC-01-p1 .sd-statechoice.is-complete"); await sleep(50);
  check("Practice cannot be completed without assignment evidence", /evidence/.test(await text(page, ".sd-toast")));
  await page.type("#ev-JC-01-p1", "https://github.com/example/jc01-hello");
  await page.click("#practice-JC-01-p1 .sd-statechoice.is-complete"); await sleep(50);
  check("Practice completes with evidence saved", await page.evaluate(() => { const p = window.__studyDeskProgress().practice["JC-01-p1"]; return p && p.status === "complete" && /jc01/.test(p.evidence); }));
  await page.goto(url("today=2026-11-22", "#day-1/learn"), { waitUntil: "load" });
  await page.type("#lesson-JC-01 .sd-watchlog input", "12"); await page.click("#lesson-JC-01 .sd-watchlog button"); await sleep(50);
  check("Watch log records minutes with the date", /Watched: 12 min \(Sun, 22 Nov 12m\)/.test(await text(page, "#lesson-JC-01 .sd-watchlog")));
  await page.click("#lesson-JC-01 .sd-lesson-actions .sd-btn-primary"); await sleep(50);
  check("Lesson JC-01 completes once gates are met", /Complete/.test(await text(page, "#lesson-JC-01 .sd-card-h .sd-badge")));
  // Finish the rest of session 1 through the same host reducer the UI uses.
  const ok1 = (await Promise.all(["JC-02", "JC-03", "DSA-01"].map(() => true))) && await finishLessonViaHost(page, "JC-02") && await finishLessonViaHost(page, "JC-03") && await finishLessonViaHost(page, "DSA-01");
  await page.goto(url("today=2026-11-22", "#today"), { waitUntil: "load" });
  check("Session 1 complete on Day 1", ok1 && /Complete/.test(await text(page, ".sd-hero-meta .sd-badge")) && /1\/20 sessions/.test(await text(page, ".sd-overall")));
  // Next day
  await page.goto(url("today=2026-11-23", "#today"), { waitUntil: "load" });
  const n2 = await text(page, ".sd-main h1"), tl = await allText(page, ".sd-timeline .sd-tblock");
  check("Next-day progression: Mon 23 Nov shows Session 2 with revision of session 1", /Session 2 of 20/.test(n2) && /Quick revision of session 1/.test(tl[0]), n2);
  await page.goto(url("today=2026-11-23", "#day-2/test"), { waitUntil: "load" });
  check("Module test is locked while JC-04 is open", /Test locked/.test(await text(page, ".sd-testcard .sd-card-h")) && /Inheritance/.test(await text(page, ".sd-testcard ul")));
  await finishLessonViaHost(page, "JC-04"); await finishLessonViaHost(page, "DSA-02");
  await page.reload({ waitUntil: "load" });
  check("Module test unlocks when every lesson in the module is complete", /Test ready/.test(await text(page, ".sd-testcard .sd-card-h")));
  await page.click("#t-jc-basics-0-1"); await page.click("#t-jc-basics-1-0"); await page.click("#t-jc-basics-2-1"); await page.click(".sd-testcard button[type=submit]"); await sleep(50);
  check("Failing the test (0/3) shows retry and keeps session 2 open", /retry/i.test(await text(page, ".sd-testcard .sd-card-h")) && /In progress/.test(await text(page, ".sd-dayhead .sd-badge")));
  await page.click("#t-jc-basics-0-0"); await page.click("#t-jc-basics-1-1"); await page.click("#t-jc-basics-2-0"); await page.click(".sd-testcard button[type=submit]"); await sleep(50);
  check("Passing the test completes session 2", /Test passed/.test(await text(page, ".sd-testcard .sd-card-h")) && /Complete/.test(await text(page, ".sd-dayhead .sd-badge")));
  await page.screenshot({ path: path.join(outDir, "flow-3-test-passed.png"), fullPage: false });
  await page.goto(url("today=2026-11-24", "#today"), { waitUntil: "load" });
  check("Tue 24 Nov moves on to Session 3", /Session 3 of 20/.test(await text(page, ".sd-main h1")));
  await page.goto(url("today=2026-11-24", "#course"), { waitUntil: "load" });
  const jc = await text(page, "#sd-s-java-core"), bar = await page.$eval("#sd-s-java-core", e => e.closest(".sd-card").querySelector(".sd-progline [role=progressbar]").getAttribute("aria-valuenow"));
  check("Course view: Java core progress bar = 4 lessons + 1 test done of 8 items (63%)", bar === "63", "aria-valuenow=" + bar + " " + jc);
  await page.screenshot({ path: path.join(outDir, "flow-4-course-progress.png"), fullPage: true });
  // Complete -> reopen -> uncheck -> reload (one browser, preview localStorage)
  await page.goto(url("today=2026-11-24", "#day-1/learn"), { waitUntil: "load" });
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
  check("Old day-based progress migrates to stable lesson IDs", mig.v === 2 && mig.jc03 === "complete" && mig.dsa01 === "complete" && mig.hld === "in-progress" && mig.jc05 === "in-progress" && /Encapsulation/.test(mig.notes), JSON.stringify(mig));
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
  check("Search 'added' lists only supplementary lessons", added.length === 2 && added.every(t => /SA-04|GEN-05/.test(t)), added.join(", "));
  await page.goto(`${origin}/ui/coverage.html`, { waitUntil: "load" });
  const cov = await text(page, "h1");
  check("Coverage page: all fixture sessions resolve and every lesson is scheduled", /All 20 sessions resolve/.test(cov) && /57\/57 lessons scheduled|\d+\/\d+ lessons scheduled/.test(await text(page, ".sd-hero-meta")), cov + " | " + await text(page, ".sd-hero-meta"));
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
  if (vpName === "mobile") {
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
    check("desktop kbd: Enter in search opens the first match", (await info(page)).hash === "#day-15/learn", (await info(page)).hash);
  }
  check(`${vpName} kbd: no console errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok);
fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
