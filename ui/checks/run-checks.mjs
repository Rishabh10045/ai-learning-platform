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
  await page.waitForFunction(() => location.hash === "#day-4");
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

  check(`${vpName} no console/page errors`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok);
fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots in ${outDir}`);
process.exit(failed.length ? 1 : 0);
