// Headless UI checks for the Study Desk preview (ui/index.html with fixtures).
// Usage: node ui/checks/run-checks.mjs [outDir]
// Needs puppeteer-core resolvable (e.g. NODE_PATH) and Chrome at $CHROME or /usr/bin/google-chrome.
// Serves the repo root over a local static server so the page loads like GitHub Pages.
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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = path.join(repoRoot, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(repoRoot) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/ui/index.html`;

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); };

const routes = [
  ["", "plan", null], ["#day-1", "plan", 1], ["#day-1/learn", "learn", 1], ["#day-1/practice", "practice", 1],
  ["#day-1/revision", "revision", 1], ["#day-1/my-notes", "my-notes", 1], ["#day-2/coach", "coach", 2], ["#day-99", "not-found", null]
];
const viewports = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };

for (const [vpName, vp] of Object.entries(viewports)) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text() + " @ " + ((m.location() || {}).url || "")); });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("requestfailed", r => errors.push("requestfailed " + r.url()));

  for (const [hash, view, day] of routes) {
    await page.goto("about:blank");
    await page.goto(base + hash, { waitUntil: "load" });
    const info = await page.evaluate(() => {
      const m = document.querySelector(".sd-main");
      const cur = document.querySelector(".sd-lessonnav a[aria-current=page]");
      return { view: m && m.dataset.view, day: m && m.dataset.day, hash: location.hash, cur: cur && cur.textContent.trim(),
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    const ok = info.view === view && (day == null || info.day === String(day));
    check(`${vpName} ${hash || "(no hash)"} renders ${view}`, ok, `view=${info.view} day=${info.day} hash=${info.hash} sidebar=${info.cur}`);
    check(`${vpName} ${hash || "(no hash)"} no horizontal overflow`, !info.overflowX);
    const slug = (hash || "default").replace(/[#/]/g, "_");
    await page.screenshot({ path: path.join(outDir, `${vpName}${slug}.png`), fullPage: vpName === "desktop" });
  }

  // Learn view order: video source + watch time before notes.
  await page.goto(base + "#day-1/learn", { waitUntil: "load" });
  const order = await page.evaluate(() => {
    const v = document.querySelector(".sd-video"), n = document.querySelector(".sd-notes");
    return { hasSource: !!document.querySelector(".sd-video .sd-source"), hasWatch: !!document.querySelector(".sd-video .sd-watch"),
      videoFirst: !!(v && n && (v.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)) };
  });
  check(`${vpName} learn: source + watch time shown before notes`, order.hasSource && order.hasWatch && order.videoFirst, JSON.stringify(order));

  // Revision: My notes card precedes suggested bullets.
  await page.goto(base + "#day-1/revision", { waitUntil: "load" });
  const rev = await page.evaluate(() => {
    const a = document.querySelector(".sd-mynotes-card"), b = document.querySelector(".sd-suggested");
    return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  check(`${vpName} revision: My notes above suggested points`, rev);

  // Back/forward.
  await page.goto(base + "#day-1", { waitUntil: "load" });
  await page.evaluate(() => { location.hash = "#day-3/practice"; });
  await page.waitForFunction(() => document.querySelector(".sd-main").dataset.view === "practice");
  await page.goBack();
  await page.waitForFunction(() => document.querySelector(".sd-main").dataset.view === "plan");
  const back = await page.evaluate(() => document.querySelector(".sd-main").dataset.day);
  await page.goForward();
  await page.waitForFunction(() => document.querySelector(".sd-main").dataset.view === "practice");
  const fwd = await page.evaluate(() => document.querySelector(".sd-main").dataset.day);
  check(`${vpName} back/forward restores routes`, back === "1" && fwd === "3", `back=day${back} fwd=day${fwd}`);

  // Search filter (open drawer on mobile first).
  await page.goto(base + "#day-1", { waitUntil: "load" });
  if (vpName === "mobile") { await page.click(".sd-navtoggle"); await new Promise(r => setTimeout(r, 300)); }
  await page.type("#sd-search", "hashing");
  const s1 = await page.evaluate(() => [document.querySelector(".sd-root").dataset.visibleDays, [...document.querySelectorAll(".sd-daylink")].map(a => a.dataset.day).join(",")]);
  check(`${vpName} search "hashing" filters days`, s1[0] === "1" && s1[1] === "3", `visible=${s1[0]} days=${s1[1]}`);
  if (vpName === "mobile") await page.screenshot({ path: path.join(outDir, `mobile_drawer_search.png`) });
  await page.click("#sd-search", { clickCount: 3 }); await page.keyboard.press("Backspace");
  await page.type("#sd-search", "zzzz-nothing");
  const s2 = await page.evaluate(() => [document.querySelector(".sd-root").dataset.visibleDays, document.querySelector(".sd-search-count").textContent]);
  check(`${vpName} search with no match shows message`, s2[0] === "0" && /No days match/.test(s2[1]), s2[1]);
  await page.click("#sd-search", { clickCount: 3 }); await page.keyboard.press("Backspace");
  await page.type("#sd-search", "J-CONC");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#day-4" && document.querySelector(".sd-main").dataset.day === "4");
  check(`${vpName} search Enter opens first match`, true, "#day-4");

  // Status toggle emits change and re-renders with text label.
  await page.goto(base + "#day-3", { waitUntil: "load" });
  await page.click(".sd-block .sd-stbtn");
  const st = await page.evaluate(() => [document.querySelector(".sd-block .sd-stbtn-txt").textContent, document.querySelector(".sd-badge-lg").textContent]);
  check(`${vpName} block status toggle updates labels`, st[0] === "In progress" && /In progress/.test(st[1]), st.join(" / "));

  // Keyboard: on a fresh load, first Tab reaches the skip link.
  await page.goto("about:blank");
  await page.goto(base + "#day-1", { waitUntil: "load" });
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => document.activeElement.className);
  check(`${vpName} first Tab focuses skip link`, /sd-skip/.test(firstFocus), firstFocus);

  // ---- Keyboard checks ----
  const focusInfo = () => page.evaluate(() => {
    const a = document.activeElement, cs = getComputedStyle(a);
    return { cls: a.className || "", id: a.id || "", tag: a.tagName, day: a.dataset ? a.dataset.day : undefined, href: a.getAttribute("href"),
      text: (a.textContent || "").trim().slice(0, 40), outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2,
      matchesFV: a.matches(":focus-visible") };
  });
  await page.goto("about:blank");
  await page.goto(base + "#day-1", { waitUntil: "load" });
  if (vpName === "desktop") {
    // Tab order: skip link -> search -> Day 1 link -> Day 1 lesson-nav links (6) -> Day 2 link
    const seq = [];
    for (let i = 0; i < 11; i++) { await page.keyboard.press("Tab"); seq.push(await focusInfo()); }
    const label = f => f.cls.includes("sd-skip") ? "skip" : f.id === "sd-search" ? "search" : f.day ? "day" + f.day : f.href ? f.href : f.tag;
    const order = seq.map(label);
    const expected = ["skip", "coverage.html", "search", "day1", "#day-1", "#day-1/learn", "#day-1/practice", "#day-1/revision", "#day-1/my-notes", "#day-1/coach", "day2"];
    check(`${vpName} keyboard: Tab order skip → Coverage link → search → day index → lesson sidebar`, JSON.stringify(order) === JSON.stringify(expected), order.join(" > "));
    check(`${vpName} keyboard: focus ring visible on every tabbed element`, seq.every(f => f.outline && f.matchesFV), seq.filter(f => !f.outline).map(label).join(",") || "all have ≥2px outline");
    // Enter on a lesson-sidebar link
    await page.goto("about:blank"); await page.goto(base + "#day-1", { waitUntil: "load" });
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab"); // -> #day-1/learn
    const onLearn = await focusInfo();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => location.hash === "#day-1/learn" && document.querySelector(".sd-main").dataset.view === "learn");
    const cur = await page.evaluate(() => document.querySelector(".sd-lessonnav a[aria-current=page]").getAttribute("href"));
    check(`${vpName} keyboard: Enter on lesson-sidebar link opens view, aria-current moves`, onLearn.href === "#day-1/learn" && cur === "#day-1/learn", `focused=${onLearn.href} current=${cur}`);
    // Skip link moves focus to main
    await page.goto("about:blank"); await page.goto(base + "#day-1", { waitUntil: "load" });
    await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
    const afterSkip = await focusInfo();
    await page.keyboard.press("Tab");
    const afterSkipTab = await focusInfo();
    check(`${vpName} keyboard: skip link jumps to lesson content`, afterSkip.id === "sd-main" && afterSkipTab.cls.includes("sd-tab"), `${afterSkip.id} then ${afterSkipTab.text}`);
    // Tabs strip reachable and Enter activates
    await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); // -> Practice tab
    const tabF = await focusInfo();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => location.hash === "#day-1/practice" && document.querySelector(".sd-main").dataset.view === "practice");
    check(`${vpName} keyboard: view tabs reachable by Tab, Enter opens view`, tabF.href === "#day-1/practice" && tabF.outline, tabF.href);
  } else {
    // Mobile: Tab -> skip -> Days toggle; Enter opens drawer and focuses search; Esc closes and returns focus
    await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
    const tog = await focusInfo();
    await page.keyboard.press("Enter");
    await new Promise(r => setTimeout(r, 300));
    const opened = await page.evaluate(() => [document.querySelector(".sd-navtoggle").getAttribute("aria-expanded"), document.activeElement.id]);
    check(`${vpName} keyboard: Tab reaches Days toggle (focus visible), Enter opens drawer and focuses search`, tog.cls.includes("sd-navtoggle") && tog.outline && opened[0] === "true" && opened[1] === "sd-search", `toggle=${tog.cls} expanded=${opened[0]} focus=${opened[1]}`);
    await page.keyboard.press("Escape");
    const closed = await page.evaluate(() => [document.querySelector(".sd-navtoggle").getAttribute("aria-expanded"), document.activeElement.className]);
    check(`${vpName} keyboard: Esc closes drawer and returns focus to toggle`, closed[0] === "false" && closed[1].includes("sd-navtoggle"), closed.join(" / "));
    await page.keyboard.press("Enter"); await new Promise(r => setTimeout(r, 300));
  }
  // Arrow navigation in day index (both viewports): search ↓ day1 ↓ lesson links … ↑ back to search
  if (vpName === "desktop") { await page.goto("about:blank"); await page.goto(base + "#day-1", { waitUntil: "load" }); }
  await page.focus("#sd-search");
  await page.keyboard.press("ArrowDown");
  const a1 = await focusInfo();
  await page.keyboard.press("ArrowDown");
  const a2 = await focusInfo();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowDown");
  const a3 = await focusInfo();
  await page.screenshot({ path: path.join(outDir, `${vpName}_keyboard_focus.png`) });
  await page.keyboard.press("ArrowUp");
  const a4 = await focusInfo();
  check(`${vpName} keyboard: ArrowDown from search enters day index; arrows walk day links and lesson sidebar`,
    a1.day === "1" && a2.href === "#day-1" && a3.day === "2" && a4.href === "#day-1/coach" && a1.outline && a3.outline,
    `${a1.day && "day" + a1.day} > ${a2.href} > … > day${a3.day} ↑ ${a4.href}`);
  await page.focus(".sd-daylink[data-day='1']");
  await page.keyboard.press("ArrowUp");
  const a5 = await focusInfo();
  check(`${vpName} keyboard: ArrowUp from first day returns to search`, a5.id === "sd-search", a5.id);
  await page.focus(".sd-daylink[data-day='3']");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => location.hash === "#day-3" && document.querySelector(".sd-main").dataset.day === "3");
  const cur3 = await page.evaluate(() => document.querySelector(".sd-daylink[aria-current=page]").dataset.day);
  check(`${vpName} keyboard: Enter on a day link opens it, aria-current updates`, cur3 === "3", "aria-current=day" + cur3);
  // Status toggle operable by keyboard (Space)
  await page.focus(".sd-block .sd-stbtn");
  await page.keyboard.press("Space");
  const sp = await page.evaluate(() => document.querySelector(".sd-block .sd-stbtn-txt").textContent);
  check(`${vpName} keyboard: Space toggles block status`, sp === "In progress", sp);

  // ---- Status defaults: nothing started ----
  await page.goto("about:blank");
  await page.goto(base + "#day-1", { waitUntil: "load" });
  const st0 = await page.evaluate(() => ({
    days: document.querySelectorAll(".sd-daylink").length,
    notPending: [...document.querySelectorAll(".sd-daynum")].filter(e => !e.classList.contains("sd-st-pending")).length,
    badge: document.querySelector(".sd-badge-lg").textContent.trim(),
    blockBtns: [...document.querySelectorAll(".sd-block .sd-stbtn-txt")].map(e => e.textContent),
    overall: document.querySelector(".sd-overall-txt").textContent,
    pendingWord: /\bPending\b/.test(document.body.innerText)
  }));
  check(`${vpName} status: every day and block is "Not started" on load`,
    st0.notPending === 0 && /Not started/.test(st0.badge) && st0.blockBtns.every(t => t === "Not started") && /^0\/\d+/.test(st0.overall) && !st0.pendingWord,
    `days=${st0.days} nonPending=${st0.notPending} badge=${st0.badge} overall=${st0.overall}`);

  // ---- Session plan: dates, 4 course blocks, time slots, totals (every day, count from data) ----
  const plan = [];
  for (let n = 1; n <= st0.days; n++) {
    await page.evaluate(n => { location.hash = "#day-" + n; }, n);
    await page.waitForFunction(n => document.querySelector(".sd-main").dataset.day === String(n), {}, n);
    plan.push(await page.evaluate(() => ({
      date: (document.querySelector(".sd-dayhead time") || {}).getAttribute?.("datetime"),
      label: document.querySelector(".sd-daylink[aria-current=page] .sd-daylabel").textContent,
      courses: [...document.querySelectorAll(".sd-block .sd-block-course")].map(e => e.textContent),
      slots: [...document.querySelectorAll(".sd-block .sd-slot")].map(e => e.textContent.replace("🕘 ", "")),
      mins: [...document.querySelectorAll(".sd-block .sd-block-meta")].map(e => e.textContent),
      total: document.querySelector(".sd-total").textContent
    })));
  }
  const want = ["System Design (HLD)", "DSA", "Java · Multithreading · Spring Boot (+ Spring AI)", "GenAI / LLM"];
  const d1 = plan[0];
  check(`${vpName} plan: Day 1 is 2026-11-22 with 4 course blocks 9:00–11:00 PM`,
    d1.date === "2026-11-22" && JSON.stringify(d1.courses) === JSON.stringify(want) && d1.slots[0] === "9:00 PM–9:30 PM" && d1.slots[3] === "10:30 PM–11:00 PM" && /Total 2 h/.test(d1.total) && /fits/.test(d1.total),
    `${d1.date} | ${d1.courses.length} blocks | ${d1.slots.join(", ")} | ${d1.total}`);
  const later = plan.slice(1);
  const datesOk = plan.every((p, i) => p.date === new Date(Date.UTC(2026, 10, 22 + i)).toISOString().slice(0, 10));
  check(`${vpName} plan: dates run consecutively from start date (${plan.length} days, from data)`, datesOk && plan.length >= 6, plan.map(p => p.date).join(" "));
  check(`${vpName} plan: Day 2+ start with a 12-min quick revision, then the 4 courses, total 2 h`,
    later.every(p => p.courses[0] === "Quick revision" && /12 min/.test(p.mins[0]) && p.slots[0] === "9:00 PM–9:12 PM" &&
      JSON.stringify(p.courses.slice(1)) === JSON.stringify(want) && p.slots[p.slots.length - 1].endsWith("11:00 PM") && /fits/.test(p.total)),
    later.map(p => p.courses.length + " blocks/" + p.total.split(" · ")[0]).join("; "));
  check(`${vpName} plan: day index shows calendar dates`, /Day 1 · Sun, 22 Nov/.test(plan[0].label), plan[0].label);
  if (vpName === "desktop") { await page.goto(base + "#day-2", { waitUntil: "load" }); await page.screenshot({ path: path.join(outDir, "desktop_day-2_plan.png"), fullPage: true }); }

  // ---- Header link to coverage ----
  await page.goto("about:blank");
  await page.goto(base + "#day-1", { waitUntil: "load" });
  const link = await page.$eval(".sd-toplink", a => [a.textContent, a.getAttribute("href")]);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.click(".sd-toplink")]);
  check(`${vpName} header: "Coverage check" link opens coverage page`, link[0] === "Coverage check" && /coverage\.html$/.test(page.url()), link.join(" → "));

  // ---- Coverage page ----
  await page.goto("about:blank");
  await page.goto(base.replace("index.html", "coverage.html"), { waitUntil: "load" });
  const cov = await page.evaluate(() => ({
    tracks: [...document.querySelectorAll("section[data-track]")].map(s => ({ id: s.dataset.track, rows: s.querySelectorAll("tr[data-topic]").length,
      miss: [...s.querySelectorAll("tr[data-covered=no]")].map(r => r.dataset.topic), gap: !!s.querySelector(".cv-gap") })),
    sched: document.querySelector("[data-stat=scheduled] strong").textContent,
    unsched: document.querySelector("[data-stat=unscheduled] strong").textContent,
    rollup: document.querySelectorAll("#unscheduled li").length,
    firstLink: (document.querySelector("tr[data-covered=yes] a") || {}).getAttribute?.("href"),
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1
  }));
  check(`${vpName} coverage: 4 tracks with per-topic day mapping`, cov.tracks.length === 4 && cov.tracks.every(t => t.rows === 8) && cov.firstLink === "index.html#day-1",
    cov.tracks.map(t => t.id + ":" + t.rows).join(" ") + " firstLink=" + cov.firstLink);
  check(`${vpName} coverage: unscheduled topics listed per track and rolled up`, cov.sched === "24/32" && cov.unsched === "8" && cov.rollup === 8 && cov.tracks.every(t => t.miss.length === 2 && t.gap),
    cov.tracks.map(t => t.id + "→" + t.miss.join("+")).join("; "));
  check(`${vpName} coverage: no horizontal overflow`, !cov.overflowX);
  await page.screenshot({ path: path.join(outDir, `${vpName}_coverage.png`), fullPage: vpName === "desktop" });
  await page.click("tr[data-covered=yes] a");
  await page.waitForFunction(() => location.hash === "#day-1" && document.querySelector(".sd-main") && document.querySelector(".sd-main").dataset.day === "1");
  check(`${vpName} coverage: day link opens Study Desk at that day`, true, "index.html#day-1");

  check(`${vpName} no console/page errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok);
fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots in ${outDir}`);
process.exit(failed.length ? 1 : 0);
