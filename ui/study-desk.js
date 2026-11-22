/*
 * Study Desk presentation layer v2 (subject-first). No build step, no dependencies.
 * Needs ui/engine/schedule-engine.js (window.StudyDeskSchedule) loaded first.
 *
 *   const desk = StudyDesk.mount(el, { course, progress, today, sync, onChange, onCoachAsk, headerLinks, engagement });
 *   desk.update({ progress, sync, today, course, engagement });
 *
 * Engagement (XP, level, streak, today's tasks, challenges, badges, activity, reminder
 * preferences) needs ui/engine/engagement-engine.js (window.StudyDeskEngagement). It is
 * derived from progress; options.engagement (collab/engagement-contract.md) overrides
 * field by field, and engagement:false turns the engagement UI off. Every change the UI
 * emits carries change.at (ISO timestamp) for the activity log.
 *
 * The UI never stores anything. Every user action calls onChange(change) with the
 * change shapes documented in schedule-engine.js applyChange(); the host persists
 * (Codex's progress.js / account sync) and calls update(). If onChange returns
 * { ok:false, reason } (or a Promise of it) the reason is shown to the learner.
 */
(function (global) {
  "use strict";
  var S = global.StudyDeskSchedule;
  function E() { return global.StudyDeskEngagement || null; }
  var STATUS = {
    "pending": { label: "Not started", icon: "○", cls: "is-pending" },
    "in-progress": { label: "In progress", icon: "◐", cls: "is-progress" },
    "complete": { label: "Complete", icon: "✓", cls: "is-complete" }
  };
  var TEST = {
    none: { label: "No test", icon: "–", cls: "is-pending" },
    locked: { label: "Test locked", icon: "🔒", cls: "is-locked" },
    unlocked: { label: "Test ready", icon: "▶", cls: "is-ready" },
    failed: { label: "Test: retry", icon: "↻", cls: "is-progress" },
    passed: { label: "Test passed", icon: "✓", cls: "is-complete" }
  };
  var KIND = { foundations: "Java foundations", revision: "Quick revision", lesson: "Main lesson", dsa: "DSA practice", stretch: "Stretch practice" };
  var VIEWS = [
    { id: "plan", label: "Session plan", suffix: "" },
    { id: "learn", label: "Videos & notes", suffix: "/learn" },
    { id: "practice", label: "Practice", suffix: "/practice" },
    { id: "revision", label: "Quick revision", suffix: "/revision" },
    { id: "my-notes", label: "My notes", suffix: "/my-notes" },
    { id: "coach", label: "AI coach", suffix: "/coach" },
    { id: "test", label: "Module test", suffix: "/test", optional: true }
  ];

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  function fmtMin(m) { m = Math.round(m || 0); var hh = Math.floor(m / 60), mm = m % 60; return hh ? hh + "h" + (mm ? " " + mm + "m" : "") : mm + " min"; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso, withYear) {
    if (!iso) return "";
    var p = iso.split("-"), wd = S.DAY_NAMES[S.weekday(iso)].slice(0, 3);
    return wd + ", " + (+p[2]) + " " + MONTHS[+p[1] - 1] + (withYear ? " " + p[0] : "");
  }
  function fmtTime(hhmm) { if (!hhmm) return ""; var p = hhmm.split(":"), H = +p[0]; return ((H + 11) % 12 + 1) + ":" + p[1] + " " + (H < 12 ? "AM" : "PM"); }
  function badge(st, extra) { var s = STATUS[st] || STATUS.pending; return h("span", { class: "sd-badge " + s.cls + (extra ? " " + extra : "") }, h("span", { "aria-hidden": "true", text: s.icon }), " " + s.label); }
  function tbadge(st) { var s = TEST[st] || TEST.none; return h("span", { class: "sd-badge " + s.cls }, h("span", { "aria-hidden": "true", text: s.icon }), " " + s.label); }
  function meter(pct, label) {
    return h("span", { class: "sd-meter", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": label || "Progress" },
      h("span", { style: "width:" + pct + "%" }));
  }
  function sourceChip(src) {
    if (!src) return null;
    return src.kind === "added" ? h("span", { class: "sd-chip sd-chip-added", title: src.note || "Supplementary content", text: "source: added" })
      : h("span", { class: "sd-chip sd-chip-gfg", title: (src.course || "GfG") + (src.ref ? " · " + src.ref : ""), text: "GfG · " + (src.ref || "mapped") });
  }

  function mount(root, opts) {
    if (!S) throw new Error("StudyDesk needs StudyDeskSchedule (ui/engine/schedule-engine.js) loaded first");
    opts = opts || {};
    var data = { course: opts.course, progress: S.normalize(opts.progress), today: opts.today || S.studyDayIST(), sync: opts.sync || null, engagement: opts.engagement };
    var state = { route: { view: "today" }, query: "", navOpen: false, toast: "", openModules: {}, focusLesson: null, drafts: {}, pendingNotes: {} };
    var derived;
    root.classList.add("sd-root");
    root.innerHTML = "";

    function derive() {
      var idx = S.indexCourse(data.course), res = S.resolveSessions(data.course, idx);
      var cal = S.buildCalendar(data.course, data.progress, { idx: idx, resolved: res, today: data.today });
      var tp = S.todayPlan(data.course, data.progress, { idx: idx, resolved: res, today: data.today });
      derived = { idx: idx, res: res, cal: cal, today: tp, cont: S.continueTarget(data.course, data.progress), settings: S.settingsOf(data.course, data.progress) };
      derived.eng = null;
      if (E() && data.engagement !== false) {
        try { derived.eng = E().merge(E().derive(data.course, data.progress, data.today), data.engagement); }
        catch (err) { console.error("Study Desk: engagement could not be derived", err); derived.eng = null; }
      }
    }

    /* ---------- routing ---------- */
    function parseHash() {
      var raw = (location.hash || "").replace(/^#/, ""), hs;
      try { hs = decodeURIComponent(raw); } catch (e) { hs = raw; }   // malformed %-escapes must not crash routing (QA M1)
      var m = /^day-(\d+)(?:\/(learn|practice|revision|my-notes|coach|test))?$/.exec(hs);
      if (m) return { view: m[2] || "plan", day: +m[1], canonical: "day-" + (+m[1]) + (m[2] ? "/" + m[2] : "") };
      m = /^lesson\/(.+)$/.exec(hs);
      if (m) return { view: "lesson", lessonId: m[1] };
      if (hs === "course" || hs === "calendar" || hs === "today" || hs === "activity" || hs === "settings") return { view: hs };
      if (!hs) return { view: "today" };
      return { view: "not-found", raw: hs };
    }
    function sessionOfLesson(id) {
      for (var i = 0; i < derived.res.sessions.length; i++) {
        var r = derived.res.sessions[i];
        if ((r.warmup && r.warmup.id === id) || r.lessons.concat(r.dsa).some(function (l) { return l.id === id; })) return r.n;
      }
      return null;
    }
    function onHash() {
      var r = parseHash();
      if (r.view === "lesson") {
        var n = sessionOfLesson(r.lessonId);
        if (n) { state.focusLesson = r.lessonId; history.replaceState(null, "", "#day-" + n + "/learn"); r = { view: "learn", day: n }; }
        else r = { view: "not-found", raw: "lesson/" + r.lessonId };
      }
      // #day-01 -> #day-1: one URL per page (QA L5).
      if (r.canonical && location.hash !== "#" + r.canonical) history.replaceState(null, "", "#" + r.canonical);
      state.route = r; setNav(false); render(true);
    }

    /* ---------- change plumbing ---------- */
    function emit(change) {
      change.date = change.date || data.today;
      change.at = change.at || new Date().toISOString();   // activity log + last-activity time (engagement contract)
      var out;
      try { out = opts.onChange ? opts.onChange(change) : null; } catch (e) { out = Promise.reject(e); }
      return Promise.resolve(out).then(function (r) {
        if (r && r.ok === false) toast(r.reason || "Could not save that change");
        else if (r && r.result && r.result.total) toast((change.type === "test" ? "Test" : "Lesson check") + ": " + r.result.right + "/" + r.result.total + " (" + r.result.pct + "%). " + (r.result.passed ? "Passed." : "Need " + r.result.passPct + "% to pass.") + (r.result.keptPass ? " Your earlier pass still counts." : ""));
        return r || { ok: true };
      }, function (e) { toast("Host could not save: " + (e && e.message || e)); return { ok: false, reason: String(e && e.message || e) }; });
    }
    // Notes are saved 600 ms after typing stops; anything pending is flushed when the page hides, unloads or the field loses focus (QA M2).
    function flushNotes() {
      Object.keys(state.pendingNotes).forEach(function (k) { var pn = state.pendingNotes[k]; clearTimeout(pn.timer); delete state.pendingNotes[k]; pn.save(); });
    }
    function onVis() { if (document.visibilityState === "hidden") flushNotes(); }
    window.addEventListener("pagehide", flushNotes);
    window.addEventListener("beforeunload", flushNotes);
    document.addEventListener("visibilitychange", onVis);
    function toast(msg) { state.toast = msg; toastEl.textContent = msg; toastEl.hidden = !msg; clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 6000); }

    /* ---------- chrome ---------- */
    var skip = h("a", { class: "sd-skip", href: "#sd-main", onclick: function (e) { e.preventDefault(); main.focus(); } }, "Skip to content");
    var navToggle = h("button", { type: "button", class: "sd-navtoggle", "aria-controls": "sd-sidebar", "aria-expanded": "false", onclick: function () { setNav(!state.navOpen); } }, "☰ Course");
    var brand = h("a", { class: "sd-brand", href: "#today" }, h("span", { class: "sd-logo", "aria-hidden": "true", text: "▤" }), h("span", { class: "sd-brand-txt" }, h("strong", { class: "sd-title" }), h("small", { class: "sd-subtitle" })));
    var syncEl = h("span", { class: "sd-sync", role: "status" });
    var overall = h("div", { class: "sd-overall" });
    var links = h("nav", { class: "sd-toplinks", "aria-label": "Pages" });
    var topbar = h("header", { class: "sd-topbar" }, navToggle, brand, links, syncEl, overall);
    var search = h("input", { type: "search", class: "sd-search", id: "sd-search", placeholder: "Search lessons, sessions, IDs…", autocomplete: "off", "aria-describedby": "sd-search-count" });
    var searchCount = h("p", { class: "sd-search-count", id: "sd-search-count", "aria-live": "polite" });
    var sideNav = h("ul", { class: "sd-sidenav" });
    var tree = h("div", { class: "sd-tree" });
    var sideSessions = h("ol", { class: "sd-daylist", "aria-label": "Sessions" });
    var sessionsBox = h("details", { class: "sd-sessions" }, h("summary", { class: "sd-side-h" }, "All sessions"), sideSessions);
    var navClose = h("button", { type: "button", class: "sd-navclose", onclick: function () { setNav(false); navToggle.focus(); } }, "✕ Close");
    var sidebar = h("nav", { class: "sd-sidebar", id: "sd-sidebar", "aria-label": "Course navigation" }, navClose, sideNav,
      h("label", { class: "sd-search-label", for: "sd-search", text: "Find a lesson or session" }), search, searchCount,
      h("h2", { class: "sd-side-h", text: "Subjects" }), tree, sessionsBox);
    var scrim = h("div", { class: "sd-scrim", hidden: true, onclick: function () { setNav(false); } });
    var main = h("main", { class: "sd-main", id: "sd-main", tabindex: "-1" });
    var toastEl = h("div", { class: "sd-toast", role: "status", "aria-live": "polite", hidden: true });
    root.appendChild(h("div", { class: "sd-shell" }, skip, topbar, h("div", { class: "sd-body" }, sidebar, scrim, main), toastEl));

    search.addEventListener("input", function () { state.query = search.value; renderSidebar(); });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var f = sidebar.querySelector(".sd-tree a, .sd-daylist a"); if (f) f.click(); }
      if (e.key === "ArrowDown") { var g = tree.querySelector("summary, a"); if (g) { e.preventDefault(); g.focus(); } }
    });
    sidebar.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (document.activeElement === search) return;
      var items = Array.prototype.slice.call(sidebar.querySelectorAll(".sd-sidenav a, summary, .sd-tree a, .sd-daylist a")).filter(function (x) { return x.offsetParent !== null; });
      var i = items.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      var nx = items[i + (e.key === "ArrowDown" ? 1 : -1)];
      if (nx) nx.focus();
    });
    function onKey(e) {
      if (!state.navOpen) return;
      if (e.key === "Escape") { setNav(false); navToggle.focus(); return; }
      if (e.key !== "Tab") return;
      // Keep Tab cycling inside the open drawer instead of escaping to the browser chrome (QA M15).
      var f = Array.prototype.filter.call(sidebar.querySelectorAll("a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])"),
        function (el) {
          if (el.disabled || !el.getClientRects().length) return false;
          var d = el.closest("details:not([open])");   // content of a closed <details> is not tabbable, its summary is
          return !d || (el.tagName === "SUMMARY" && el.parentElement === d);
        });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = document.activeElement, inside = sidebar.contains(a);
      if (!inside || (e.shiftKey && a === first) || (!e.shiftKey && a === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    }
    document.addEventListener("keydown", onKey);
    // While the drawer is open, everything outside it is inert so Tab cannot reach content behind the scrim (QA M15).
    function setInert(el, on) { if (!el) return; if (on) { el.setAttribute("inert", ""); el.inert = true; } else { el.removeAttribute("inert"); el.inert = false; } }
    function setNav(open) {
      state.navOpen = open; root.classList.toggle("sd-nav-open", open); navToggle.setAttribute("aria-expanded", open ? "true" : "false"); scrim.hidden = !open;
      [main, topbar, skip, toastEl].forEach(function (el) { setInert(el, open); });
      Array.prototype.forEach.call(document.body.children, function (el) { if (!el.contains(root)) setInert(el, open); });
      if (open) { var f = sidebar.querySelector("a[aria-current], a, input"); if (f) f.focus(); }
    }

    function render(focus) {
      derive(); renderChrome(); renderSidebar(); renderMain();
      if (focus) { var hd = main.querySelector("h1"); if (hd) { hd.setAttribute("tabindex", "-1"); hd.focus({ preventScroll: true }); } window.scrollTo(0, 0); }
      if (state.focusLesson) { var el = document.getElementById("lesson-" + state.focusLesson); if (el) el.scrollIntoView({ block: "start" }); state.focusLesson = null; }
    }

    function renderChrome() {
      var c = data.course;
      brand.querySelector(".sd-title").textContent = c.title || "Study Desk";
      brand.querySelector(".sd-subtitle").textContent = c.subtitle || "";
      links.innerHTML = "";
      (opts.headerLinks || []).forEach(function (l) { links.appendChild(h("a", { class: "sd-toplink", href: l.href, text: l.label })); });
      var sy = data.sync; syncEl.innerHTML = "";
      if (sy) { syncEl.className = "sd-sync is-" + (sy.state || "local"); syncEl.appendChild(h("span", { "aria-hidden": "true", text: sy.state === "signed-in" ? "☁" : sy.state === "error" ? "!" : sy.state === "syncing" ? "↻" : "▣" })); syncEl.appendChild(document.createTextNode(" " + (sy.label || sy.state))); }
      syncEl.hidden = !sy;
      var done = derived.cal.statuses.filter(function (s) { return s.status === "complete"; }).length, total = derived.res.count;
      overall.innerHTML = "";
      overall.appendChild(h("span", { class: "sd-overall-txt", text: done + "/" + total + " sessions" }));
      overall.appendChild(meter(total ? Math.round(done * 100 / total) : 0, "Sessions complete"));
      document.title = titleFor() + " · " + (c.title || "Study Desk");
    }
    function titleFor() {
      var r = state.route;
      if (r.day) { var v = VIEWS.find(function (x) { return x.id === r.view; }); return "Session " + r.day + (v && v.id !== "plan" ? " · " + v.label : ""); }
      return { today: "Today", course: "Course", calendar: "Calendar", activity: "Activity & XP", settings: "Reminder settings" }[r.view] || "Not found";
    }

    function matchText(q, hay) { return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (t) { return hay.toLowerCase().indexOf(t) >= 0; }); }

    function renderSidebar() {
      var r = state.route, q = state.query.trim();
      sideNav.innerHTML = "";
      [["today", "Today", "☀"], ["course", "Course", "▦"], ["calendar", "Calendar", "▤"]].concat(derived.eng ? [["activity", "Activity", "★"], ["settings", "Reminders", "⚙"]] : []).forEach(function (x) {
        sideNav.appendChild(h("li", null, h("a", { href: "#" + x[0], class: "sd-sidelink", "aria-current": r.view === x[0] ? "page" : null }, h("span", { "aria-hidden": "true", text: x[2] + " " }), x[1])));
      });
      tree.innerHTML = "";
      var curLessons = {};
      var focusN = r.day || (derived.cont && derived.cont.n);
      if (focusN) { var rs = derived.res.sessions[focusN - 1]; if (rs) (rs.warmup ? [rs.warmup] : []).concat(rs.lessons, rs.dsa).forEach(function (l) { curLessons[l.id] = r.day ? 1 : 2; }); }
      var hits = 0;
      derived.idx.subjects.forEach(function (s) {
        var sp = S.subjectProgress(s, data.progress), anyHit = false;
        var body = h("div", { class: "sd-tree-body" });
        s.modules.forEach(function (m) {
          var mp = S.moduleProgress(m, data.progress);
          var lis = [];
          m.lessons.forEach(function (l) {
            var hay = [l.id, l.title, s.title, m.title, l.source && l.source.kind === "added" ? "added" : "gfg"].join(" ");
            if (q && !matchText(q, hay)) return;
            hits++; anyHit = true;
            var st = S.lessonState(l, data.progress), n = sessionOfLesson(l.id);
            lis.push(h("li", null, h("a", { class: "sd-treelink " + STATUS[st].cls, href: "#lesson/" + l.id, "aria-current": curLessons[l.id] === 1 ? "true" : null },
              h("span", { class: "sd-ticon", "aria-hidden": "true", text: STATUS[st].icon }),
              h("span", { class: "sd-tl-txt" }, l.title, h("small", { text: l.id + (n ? " · S" + n : "") })),
              h("span", { class: "sd-vh", text: ", " + STATUS[st].label }))));
          });
          if (m.test && (!q || matchText(q, m.title + " test " + m.id))) {
            var ts = S.testState(m, data.progress), tn = derived.res.sessions.find(function (x) { return x.test === m.id; });
            lis.push(h("li", null, h("a", { class: "sd-treelink sd-testlink " + TEST[ts].cls, href: tn ? "#day-" + tn.n + "/test" : "#course" },
              h("span", { class: "sd-ticon", "aria-hidden": "true", text: TEST[ts].icon }), h("span", { class: "sd-tl-txt" }, m.test.title || "Module test", h("small", { text: TEST[ts].label })))));
            anyHit = true;
          }
          if (!lis.length) return;
          var open = q ? true : state.openModules[m.id] != null ? state.openModules[m.id] : lis.length && Object.keys(curLessons).some(function (id) { return m.lessons.some(function (l) { return l.id === id; }); });
          var det = h("details", { class: "sd-mod", open: !!open },
            h("summary", null, h("span", { class: "sd-mod-t", text: m.title }), h("span", { class: "sd-mod-c", text: mp.done + "/" + mp.total }), meter(mp.pct, m.title + " progress")),
            h("ul", null, lis));
          det.addEventListener("toggle", function () { if (!q) state.openModules[m.id] = det.open; });
          body.appendChild(det);
        });
        if (q && !anyHit) return;
        tree.appendChild(h("section", { class: "sd-subj" + (s.dsa ? " sd-subj-dsa" : "") },
          h("div", { class: "sd-subj-h" }, h("span", { class: "sd-dot", style: "background:" + (s.color || "#888"), "aria-hidden": "true" }), h("strong", { text: s.title }),
            s.daily ? h("span", { class: "sd-chip sd-chip-daily", text: "daily" }) : null, h("span", { class: "sd-subj-pct", text: sp.pct + "%" })),
          meter(sp.pct, s.title + " progress"), body));
      });
      sideSessions.innerHTML = "";
      var sHits = 0;
      derived.res.sessions.forEach(function (rs) {
        var subj = derived.idx.subjectById[rs.subjectId] || {}, ent = (derived.cal.byN[rs.n] || [])[0];
        var hay = ["session " + rs.n, "day " + rs.n, "day-" + rs.n, subj.title, rs.lessons.concat(rs.dsa).map(function (l) { return l.id + " " + l.title; }).join(" "), ent ? fmtDate(ent.date, true) : ""].join(" ");
        if (q && !matchText(q, hay)) return;
        sHits++;
        var st = derived.cal.statuses[rs.n - 1].status;
        sideSessions.appendChild(h("li", null, h("a", { class: "sd-daylink " + STATUS[st].cls, href: "#day-" + rs.n, "aria-current": r.day === rs.n ? "page" : null },
          h("span", { class: "sd-daynum", "aria-hidden": "true", text: rs.n }),
          h("span", { class: "sd-tl-txt" }, subj.title || rs.subjectId, h("small", { text: (ent ? fmtDate(ent.date) + " · " : "") + rs.lessons.map(function (l) { return l.id; }).join(", ") })),
          h("span", { class: "sd-vh", text: ", " + STATUS[st].label }))));
      });
      if (q) sessionsBox.open = sHits > 0;
      sessionsBox.querySelector("summary").textContent = "All sessions (" + derived.res.count + ")";
      searchCount.textContent = q ? hits + " lesson" + (hits === 1 ? "" : "s") + ", " + sHits + " session" + (sHits === 1 ? "" : "s") + " match" : "";
    }

    /* ---------- main ---------- */
    function renderMain() {
      main.innerHTML = "";
      var r = state.route;
      main.dataset.view = r.view; main.dataset.day = r.day || "";
      if (data.sync && data.sync.state === "error" && data.sync.detail) main.appendChild(h("div", { class: "sd-alert", role: "alert" }, h("strong", { text: "Not saved: " }), data.sync.detail));
      if (!derived.res.ok) main.appendChild(h("div", { class: "sd-alert", role: "alert" }, h("strong", { text: "Curriculum check failed: " }), derived.res.errors.slice(0, 5).join(" · ") + (derived.res.errors.length > 5 ? " …" : "")));
      if (r.view === "today") return viewToday();
      if (r.view === "course") return viewCourse();
      if (r.view === "calendar") return viewCalendar();
      if (r.view === "activity" && derived.eng) return viewActivity();
      if (r.view === "settings" && derived.eng) return viewSettings();
      if (r.day && derived.res.sessions[r.day - 1]) return viewSession(derived.res.sessions[r.day - 1], r.view);
      main.dataset.view = "not-found";
      add(main, [h("h1", { text: "Not in this plan" }), h("p", { text: "There is no page for “" + (r.raw || "day-" + r.day) + "”. This plan has " + derived.res.count + " sessions." }), h("p", null, h("a", { href: "#today", text: "Go to Today" }))]);
    }

    function blockList(entry, rs) {
      var ol = h("ol", { class: "sd-timeline" });
      entry.blocks.forEach(function (b) {
        var st = blockState(b, rs);
        var target = b.kind === "revision" ? "#day-" + rs.n + "/revision" : b.kind === "dsa" || b.kind === "stretch" ? "#day-" + rs.n + "/practice" : "#day-" + rs.n + "/learn";
        ol.appendChild(h("li", { class: "sd-tblock sd-k-" + b.kind + " " + STATUS[st].cls },
          h("div", { class: "sd-tb-time" }, b.start ? h("span", { text: fmtTime(b.start) }) : h("span", { text: "Any time" }), h("small", { text: fmtMin(b.minutes) })),
          h("div", { class: "sd-tb-body" }, h("span", { class: "sd-kind", text: KIND[b.kind] }), h("a", { href: target, class: "sd-tb-title", text: b.title }),
            b.kind === "stretch" ? h("small", { class: "sd-muted", text: "Extra practice on today’s lessons and DSA. Not needed to finish the session." }) : null,
            b.lessonIds && b.lessonIds.length && b.kind !== "stretch" ? h("small", { class: "sd-muted" }, b.lessonIds.map(function (id) { return h("code", { text: id }); })) : null),
          b.kind === "stretch" ? null : badge(st)));
      });
      return ol;
    }
    function blockState(b, rs) {
      if (b.kind === "revision") return data.progress.revisions[rs.id] ? "complete" : "pending";
      var ls = (b.lessonIds || []).map(function (id) { return derived.idx.lessonById[id] && S.lessonState(derived.idx.lessonById[id].lesson, data.progress); }).filter(Boolean);
      if (!ls.length) return "pending";
      if (ls.every(function (x) { return x === "complete"; })) return "complete";
      return ls.some(function (x) { return x !== "pending"; }) ? "in-progress" : "pending";
    }

    function continueCard() {
      var c = derived.cont;
      if (!c) return h("section", { class: "sd-card sd-continue is-complete" }, h("h2", { text: "All sessions complete" }), h("p", { text: "Every session in this plan is done. Time for interview mode." }));
      var title, href, sub;
      if (c.kind === "test") { var m = derived.idx.moduleById[c.moduleId].module; title = m.test.title; href = "#day-" + c.n + "/test"; sub = TEST[c.state].label; }
      else { title = c.lesson.title; href = c.kind === "dsa" ? "#day-" + c.n + "/practice" : "#lesson/" + c.lesson.id; sub = STATUS[c.state].label + " · " + c.lesson.id; }
      var subj = derived.idx.subjectById[derived.res.sessions[c.n - 1].subjectId];
      return h("section", { class: "sd-card sd-continue", "aria-labelledby": "sd-cont-h" },
        h("div", null, h("p", { class: "sd-eyebrow", text: "Continue studying · Session " + c.n + " · " + (c.kind === "dsa" ? "DSA in Java" : subj.title) }),
          h("h2", { id: "sd-cont-h", text: title }), h("p", { class: "sd-muted", text: sub })),
        h("a", { class: "sd-btn sd-btn-primary sd-cont-btn", href: href }, c.state === "pending" || c.state === "locked" || c.state === "unlocked" ? "Start ▸" : "Resume ▸"));
    }

    function viewToday() {
      var tp = derived.today, e = tp.entry;
      var head = h("header", { class: "sd-hero" });
      var dateLine = fmtDate(data.today, true);
      if (tp.finished) {
        add(head, [h("p", { class: "sd-eyebrow", text: "Today · " + dateLine }), h("h1", { text: "Plan complete" })]);
        add(main, [head, continueCard()]); return;
      }
      if (!e) { add(main, [h("h1", { text: "Today" }), h("p", { text: "No session is scheduled for " + dateLine + "." })]); return; }
      var rs = e.n ? derived.res.sessions[e.n - 1] : derived.res.sessions[e.carries - 1];
      var subj = derived.idx.subjectById[rs.subjectId];
      var eyebrow = tp.beforeStart ? "Starts " + fmtDate(e.date, true) + " · today is " + fmtDate(data.today) : "Today · " + dateLine;
      add(head, [h("p", { class: "sd-eyebrow", text: eyebrow }),
        h("h1", null, (e.unavailable ? "Day off · " : "Session " + e.n + " of " + derived.res.count + " · ") + subj.title + " + DSA"),
        h("div", { class: "sd-hero-meta" },
          e.unavailable ? h("span", { class: "sd-badge is-off" }, h("span", { "aria-hidden": "true", text: "⊘" }), " Unavailable") : badge(e.status, "sd-badge-lg"),
          h("span", { class: "sd-chip sd-chip-budget", text: (e.budget.kind === "weekend" ? "Weekend long day · " + e.budget.dayName + " · " : e.budget.dayName + " · ") + fmtMin(e.budget.minutes) + (e.budget.stretch ? " (" + fmtMin(coreMin()) + " core + " + fmtMin(e.budget.stretch) + " stretch)" : "") }),
          e.carried ? h("span", { class: "sd-chip sd-chip-carry", text: "Carried forward: unfinished from an earlier date" }) : null,
          e.budget.short ? h("span", { class: "sd-chip sd-chip-carry", text: "Short day: the core is scaled down; unfinished work carries forward" }) : null)]);
      if (derived.eng) head.appendChild(engStrip(derived.eng));
      main.appendChild(head);
      main.appendChild(continueCard());
      if (derived.eng) main.appendChild(engToday(derived.eng));
      if (e.unavailable) {
        main.appendChild(h("section", { class: "sd-card sd-offcard" }, h("h2", { text: e.reason === "zero-minutes" ? "0 minutes planned on " + fmtDate(e.date) + ": day off" : "You marked " + fmtDate(e.date) + " as unavailable" }),
          h("p", { text: "Session " + e.carries + " stays pending and moves to your next available date. Nothing is skipped." })));
      } else {
        main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-tl-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-tl-h", text: "Tonight’s plan" }),
          h("a", { href: "#day-" + rs.n, class: "sd-link", text: "Open session " + rs.n + " ▸" })), blockList(e, rs),
          h("p", { class: "sd-muted", text: e.n === 1 ? "Day 1 uses the " + fmtMin(derived.settings.core.revision) + " revision slot for Java foundations (" + (rs.warmup ? rs.warmup.id : "warm-up") + ")." : "From Day 2: " + fmtMin(derived.settings.core.revision) + " revision, " + fmtMin(derived.settings.core.lesson) + " main lesson, " + fmtMin(derived.settings.core.dsa) + " DSA." })));
      }
      main.appendChild(dayControls(e));
      main.appendChild(upcoming(e.date));
    }

    function coreMin() { var c = derived.settings.core; return c.revision + c.lesson + c.dsa; }
    // Minutes: 0 = day off, otherwise min..max. Invalid input is refused with a message (QA M7).
    function readMinutes(input) {
      var v = String(input.value).trim(), lo = S.DEFAULTS.minMinutes, hi = S.DEFAULTS.maxMinutes, n = Math.round(+v);
      if (v === "" || isNaN(n) || (n !== 0 && (n < lo || n > hi))) { toast("Enter 0 (day off) or " + lo + "–" + hi + " minutes."); input.setAttribute("aria-invalid", "true"); input.focus(); return null; }
      input.removeAttribute("aria-invalid"); return n;
    }
    function dayControls(e) {
      var d = e.date, set = derived.settings, wd = S.weekday(d), lo = S.DEFAULTS.minMinutes, hi = S.DEFAULTS.maxMinutes;
      var off = h("input", { type: "checkbox", id: "sd-off", checked: !!set.unavailable[d] });
      off.addEventListener("change", function () { emit({ type: "unavailable", date: d, value: off.checked }); });
      var mins = h("input", { type: "number", id: "sd-mins", min: "0", max: String(hi), step: "15", value: String(e.budget.minutes), class: "sd-num", disabled: !!set.unavailable[d], "aria-describedby": "sd-mins-help" });
      var wdMins = h("input", { type: "number", id: "sd-wdmins", min: "0", max: String(hi), step: "15", value: String(set.dailyMinutes[wd]), class: "sd-num", "aria-describedby": "sd-mins-help" });
      var c = set.core, we = set.dailyMinutes[6], su = set.dailyMinutes[0], wk = set.dailyMinutes[1];
      return h("section", { class: "sd-card sd-controls", "aria-labelledby": "sd-ctl-h" },
        h("h2", { id: "sd-ctl-h", text: "Adjust " + fmtDate(d) }),
        h("div", { class: "sd-ctl-row" }, off, h("label", { for: "sd-off" }, h("strong", { text: "I can’t study on " + fmtDate(d) }), h("small", { class: "sd-muted", text: " The same unfinished session moves to the next available date." }))),
        h("div", { class: "sd-ctl-row" }, h("label", { for: "sd-mins", text: "Minutes on " + fmtDate(d) }), mins,
          h("button", { type: "button", class: "sd-btn", onclick: function () { var n = readMinutes(mins); if (n != null) emit({ type: "minutes", targetDate: d, date: d, minutes: n }); } }, "Save for this date"),
          e.budget.overridden ? h("button", { type: "button", class: "sd-btn sd-btn-ghost", onclick: function () { emit({ type: "minutes", targetDate: d, date: d, minutes: "" }); } }, "Reset") : null),
        h("div", { class: "sd-ctl-row" }, h("label", { for: "sd-wdmins", text: "Default for every " + S.DAY_NAMES[wd] }), wdMins,
          h("button", { type: "button", class: "sd-btn", onclick: function () { var n = readMinutes(wdMins); if (n != null) emit({ type: "minutes", weekday: wd, minutes: n }); } }, "Save default")),
        h("p", { class: "sd-muted", id: "sd-mins-help", text: "0 minutes = day off (the session moves to the next date); otherwise " + lo + "–" + hi + " minutes." }),
        h("p", { class: "sd-muted", text: "Defaults: Saturday " + fmtMin(we) + ", Sunday " + fmtMin(su) + " (" + fmtMin(c.revision + c.lesson + c.dsa) + " core from " + fmtTime(set.sessionStart) + " IST + stretch practice any time); Monday–Friday " + fmtMin(wk) + "." }));
    }

    function upcoming(fromDate) {
      var list = derived.cal.entries.filter(function (x) { return x.date > fromDate; }).slice(0, 6);
      return h("section", { class: "sd-card", "aria-labelledby": "sd-up-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-up-h", text: "Next up" }), h("a", { href: "#calendar", class: "sd-link", text: "Full calendar ▸" })),
        h("ul", { class: "sd-upcoming" }, list.map(calRow)),
        h("p", { class: "sd-muted", text: finishText() }));
    }
    function finishText() { return derived.cal.finishDate ? "Projected finish: " + fmtDate(derived.cal.finishDate, true) + "." : "The plan extends beyond the " + derived.cal.entries.length + "-day calendar window: no finish date yet."; }
    function calRow(x) {
      var rs = x.n ? derived.res.sessions[x.n - 1] : null, subj = rs ? derived.idx.subjectById[rs.subjectId] : null;
      return h("li", { class: "sd-calrow" + (x.unavailable ? " is-off" : "") + (x.isToday ? " is-today" : "") },
        h("span", { class: "sd-cal-date", text: fmtDate(x.date) }),
        x.unavailable ? h("span", { class: "sd-cal-main" }, h("strong", { text: x.reason === "zero-minutes" ? "Day off (0 min)" : "Unavailable" }), h("small", { class: "sd-muted", text: " · session " + x.carries + " moves to the next date" }))
          : h("a", { class: "sd-cal-main", href: "#day-" + x.n }, h("strong", { text: "Session " + x.n }), " · " + subj.title + " + DSA" + (x.carried ? " (carried)" : "")),
        h("span", { class: "sd-cal-min", text: x.unavailable ? "—" : fmtMin(x.budget.minutes) }),
        x.unavailable ? h("span", { class: "sd-badge is-off", text: "⊘ Off" }) : badge(x.status));
    }

    function viewCalendar() {
      add(main, [h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Calendar · starts " + fmtDate(derived.settings.startDate, true) }), h("h1", { text: "Dates and sessions" }),
        h("p", { class: "sd-muted", text: derived.res.count + " study sessions. Study days are not calendar days: an unavailable or missed date keeps the same session pending and pushes the rest forward. " + finishText() }))]);
      var ul = h("ul", { class: "sd-upcoming sd-calendar" });
      derived.cal.entries.forEach(function (x) {
        var row = calRow(x);
        var cb = h("input", { type: "checkbox", checked: !!x.unavailable, "aria-label": "Unavailable on " + fmtDate(x.date, true) });
        cb.addEventListener("change", function () { emit({ type: "unavailable", date: x.date, value: cb.checked }); });
        row.appendChild(h("label", { class: "sd-cal-off" }, cb, h("span", { "aria-hidden": "true", text: "Off" })));
        ul.appendChild(row);
      });
      main.appendChild(h("section", { class: "sd-card" }, ul));
    }

    function viewCourse() {
      add(main, h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Course · Subject → Module → Lesson" }), h("h1", { text: "Your learning path" }),
        h("p", { class: "sd-muted", text: "Main subjects run in order; DSA in Java runs every session alongside them. Tests unlock when every lesson in a module is complete." })));
      main.appendChild(continueCard());
      derived.idx.subjects.forEach(function (s, i) {
        var sp = S.subjectProgress(s, data.progress);
        var sec = h("section", { class: "sd-card sd-subjcard", "aria-labelledby": "sd-s-" + s.id },
          h("div", { class: "sd-card-h" }, h("h2", { id: "sd-s-" + s.id }, h("span", { class: "sd-dot", style: "background:" + (s.color || "#888"), "aria-hidden": "true" }),
            (s.dsa ? "Daily · " : (i + 1) + ". ") + s.title), badge(sp.status)),
          h("div", { class: "sd-progline" }, meter(sp.pct, s.title + " progress"), h("span", { text: sp.done + "/" + sp.total + " items · " + sp.pct + "%" })));
        s.modules.forEach(function (m) {
          var mp = S.moduleProgress(m, data.progress);
          var rows = m.lessons.map(function (l) {
            var st = S.lessonState(l, data.progress), n = sessionOfLesson(l.id), g = S.quizGate(l, data.progress);
            return h("li", { class: "sd-lrow " + STATUS[st].cls },
              h("span", { class: "sd-ticon", "aria-hidden": "true", text: STATUS[st].icon }),
              h("a", { href: "#lesson/" + l.id, class: "sd-lrow-t" }, l.title), h("code", { text: l.id }), sourceChip(l.source),
              g.required ? h("span", { class: "sd-chip " + (g.passed ? "sd-chip-ok" : ""), text: g.passed ? "check passed" : "check pending" }) : null,
              h("span", { class: "sd-muted sd-lrow-n", text: n ? "Session " + n : "unscheduled" }), h("span", { class: "sd-vh", text: STATUS[st].label }));
          });
          if (m.test) {
            var ts = S.testState(m, data.progress), tn = derived.res.sessions.find(function (x) { return x.test === m.id; });
            rows.push(h("li", { class: "sd-lrow sd-testrow " + TEST[ts].cls }, h("span", { class: "sd-ticon", "aria-hidden": "true", text: TEST[ts].icon }),
              tn ? h("a", { href: "#day-" + tn.n + "/test", class: "sd-lrow-t", text: m.test.title }) : h("span", { class: "sd-lrow-t", text: m.test.title }), tbadge(ts)));
          }
          var hasCont = derived.cont && derived.cont.lesson && m.lessons.some(function (l) { return l.id === derived.cont.lesson.id; });
          var det = h("details", { class: "sd-modcard", open: state.openModules["c-" + m.id] != null ? state.openModules["c-" + m.id] : (mp.status === "in-progress" || hasCont) },
            h("summary", null, h("span", { class: "sd-mod-t", text: m.title }), h("span", { class: "sd-mod-c", text: mp.done + "/" + mp.total }), meter(mp.pct, m.title + " progress"), badge(mp.status)),
            h("ul", { class: "sd-lrows" }, rows));
          det.addEventListener("toggle", function () { state.openModules["c-" + m.id] = det.open; });
          sec.appendChild(det);
        });
        main.appendChild(sec);
      });
    }

    /* ---------- session views ---------- */
    function sessionEntry(rs) {
      var list = derived.cal.byN[rs.n] || [];
      return list.find(function (x) { return x.isToday; }) || list[list.length - 1] || list[0];
    }
    function viewSession(rs, view) {
      var subj = derived.idx.subjectById[rs.subjectId], st = derived.cal.statuses[rs.n - 1], ent = sessionEntry(rs), dates = (derived.cal.byN[rs.n] || []).map(function (x) { return x.date; });
      var hd = h("header", { class: "sd-dayhead" },
        h("p", { class: "sd-eyebrow" }, "Session " + rs.n + " of " + derived.res.count + " · " + (dates.length ? dates.map(function (d) { return fmtDate(d, true); }).join(" → ") : "")),
        h("h1", null, subj.title + ": " + rs.lessons.map(function (l) { return l.title; }).join(" · ")),
        h("div", { class: "sd-hero-meta" }, badge(st.status, "sd-badge-lg"), h("span", { class: "sd-chip", text: st.done + "/" + st.total + " required items" }),
          rs.test ? tbadge(S.testState(derived.idx.moduleById[rs.test].module, data.progress)) : null,
          dates.length > 1 ? h("span", { class: "sd-chip sd-chip-carry", text: "Carried over " + (dates.length - 1) + " date" + (dates.length > 2 ? "s" : "") }) : null));
      var tabs = h("nav", { class: "sd-tabs", "aria-label": "Session sections" });
      VIEWS.forEach(function (v) {
        if (v.optional && !rs.test) return;
        tabs.appendChild(h("a", { href: "#day-" + rs.n + v.suffix, class: "sd-tab", "aria-current": v.id === view ? "page" : null, text: v.label }));
      });
      var prev = rs.n > 1 ? h("a", { class: "sd-btn sd-btn-ghost", href: "#day-" + (rs.n - 1) + (view === "plan" ? "" : "/" + view) }, "◂ Session " + (rs.n - 1)) : h("span");
      var next = rs.n < derived.res.count ? h("a", { class: "sd-btn sd-btn-ghost", href: "#day-" + (rs.n + 1) + (view === "plan" || view === "test" ? "" : "/" + view) }, "Session " + (rs.n + 1) + " ▸") : h("span");
      add(main, [hd, tabs]);
      var panel = h("section", { class: "sd-panel", "aria-label": (VIEWS.find(function (v) { return v.id === view; }) || {}).label });
      main.appendChild(panel);
      if (view === "test" && !rs.test) { panel.appendChild(h("p", { class: "sd-emptynote", text: "This session has no module test." })); }
      else ({ plan: vPlan, learn: vLearn, practice: vPractice, revision: vRevision, "my-notes": vNotes, coach: vCoach, test: vTest })[view](panel, rs, ent);
      main.appendChild(h("nav", { class: "sd-pager", "aria-label": "Previous and next session" }, prev, next));
    }
    function sessionLessons(rs) { return (rs.warmup ? [rs.warmup] : []).concat(rs.lessons, rs.dsa); }

    function vPlan(panel, rs, ent) {
      if (ent) {
        panel.appendChild(h("div", { class: "sd-card" }, h("div", { class: "sd-card-h" }, h("h2", { text: (ent.isToday ? "Today · " : ent.projected ? "Planned · " : "") + fmtDate(ent.date, true) }),
          h("span", { class: "sd-chip sd-chip-budget", text: fmtMin(ent.budget.minutes) + (ent.budget.stretch ? " (" + fmtMin(coreMin()) + " core + " + fmtMin(ent.budget.stretch) + " stretch)" : "") })), blockList(ent, rs)));
      }
      var ul = h("ul", { class: "sd-lrows" });
      sessionLessons(rs).forEach(function (l) {
        var e = derived.idx.lessonById[l.id], st = S.lessonState(l, data.progress);
        ul.appendChild(h("li", { class: "sd-lrow " + STATUS[st].cls }, h("span", { class: "sd-ticon", "aria-hidden": "true", text: STATUS[st].icon }),
          h("a", { href: "#lesson/" + l.id, class: "sd-lrow-t", text: l.title }), h("code", { text: l.id }), h("span", { class: "sd-chip", text: e.subject.title }), sourceChip(l.source), badge(st)));
      });
      if (rs.test) { var m = derived.idx.moduleById[rs.test].module, ts = S.testState(m, data.progress); ul.appendChild(h("li", { class: "sd-lrow sd-testrow " + TEST[ts].cls }, h("span", { class: "sd-ticon", "aria-hidden": "true", text: TEST[ts].icon }), h("a", { href: "#day-" + rs.n + "/test", class: "sd-lrow-t", text: m.test.title }), tbadge(ts))); }
      panel.appendChild(h("div", { class: "sd-card" }, h("h2", { text: "What finishes this session" }), ul,
        h("p", { class: "sd-muted", text: "A lesson is complete after its lesson check and practice evidence. The session completes when every item above is done; then the next session moves to your next date." })));
    }

    function lessonActions(l) {
      var st = S.lessonState(l, data.progress), can = S.canCompleteLesson(l, data.progress);
      var wrap = h("div", { class: "sd-lesson-actions" });
      if (st !== "complete") {
        wrap.appendChild(h("button", { type: "button", class: "sd-btn", "aria-pressed": st === "in-progress" ? "true" : "false", disabled: st === "in-progress", onclick: function () { emit({ type: "lesson", id: l.id, status: "in-progress" }); } }, "◐ Mark in progress"));
        wrap.appendChild(h("button", { type: "button", class: "sd-btn sd-btn-primary", "aria-disabled": can.ok ? null : "true", onclick: function () {
          if (!can.ok) { toast(can.reasons.join(" · ")); return; } emit({ type: "lesson", id: l.id, status: "complete" }); } }, "✓ Mark complete"));
        if (!can.ok) wrap.appendChild(h("p", { class: "sd-gate" }, h("span", { "aria-hidden": "true", text: "🔒 " }), can.reasons.join(" · ")));
      } else {
        wrap.appendChild(h("button", { type: "button", class: "sd-btn", onclick: function () { emit({ type: "lesson", id: l.id, status: "in-progress" }); } }, "↺ Reopen"));
        wrap.appendChild(h("button", { type: "button", class: "sd-btn sd-btn-ghost", onclick: function () { emit({ type: "lesson", id: l.id, status: "pending" }); } }, "Uncheck"));
      }
      return wrap;
    }

    function vLearn(panel, rs) {
      sessionLessons(rs).forEach(function (l) {
        var e = derived.idx.lessonById[l.id], st = S.lessonState(l, data.progress);
        var art = h("article", { class: "sd-card sd-lesson " + STATUS[st].cls, id: "lesson-" + l.id, "aria-labelledby": "lh-" + l.id },
          h("div", { class: "sd-card-h" }, h("div", null, h("p", { class: "sd-eyebrow", text: (rs.warmup && rs.warmup.id === l.id ? "Java foundations (Day 1 warm-up) · " : e.subject.dsa ? "DSA in Java · " : e.subject.title + " · ") + e.module.title }),
            h("h2", { id: "lh-" + l.id, text: l.title })), badge(st)),
          h("div", { class: "sd-meta" }, h("code", { text: l.id }), sourceChip(l.source), l.estMinutes ? h("span", { class: "sd-chip", text: "~" + fmtMin(l.estMinutes) }) : null));
        // Videos first.
        (l.videos || []).forEach(function (v) {
          if (v.kind === "article") {   // a reading: link only, nothing to log
            art.appendChild(h("div", { class: "sd-video sd-reading" }, h("div", { class: "sd-video-h" }, h("span", { class: "sd-source", text: "Reading" + (v.source && v.source !== "Reading" ? " · " + v.source : "") })),
              h("a", { href: v.url, target: "_blank", rel: "noopener", class: "sd-video-t", text: v.title + " ↗" })));
            return;
          }
          var w = data.progress.watch[v.id] || { minutes: 0, log: [] };
          var inp = h("input", { type: "number", min: "1", max: "600", class: "sd-num", "aria-label": "Minutes watched of " + v.title, placeholder: "min" });
          art.appendChild(h("div", { class: "sd-video" },
            h("div", { class: "sd-video-h" }, h("span", { class: "sd-source", text: (v.kind === "article" ? "Article · " : "▶ ") + (v.source || "Video") + (v.channel ? " · " + v.channel : "") }),
              h("span", { class: "sd-watch", text: "Suggested watch: " + fmtMin(v.suggestedWatchMin || v.durationMin) + (v.durationMin ? " of " + fmtMin(v.durationMin) : "") + (v.segment ? " · " + v.segment : "") })),
            h("a", { href: v.url, target: "_blank", rel: "noopener", class: "sd-video-t", text: v.title + " ↗" }),
            h("div", { class: "sd-watchlog" }, h("span", { text: "Watched: " + fmtMin(w.minutes) + (w.log.length ? " (" + w.log.map(function (x) { return fmtDate(x.date) + " " + x.minutes + "m"; }).join(", ") + ")" : "") }),
              inp, h("button", { type: "button", class: "sd-btn sd-btn-sm", onclick: function () { emit({ type: "watch", id: v.id, minutes: inp.value }); } }, "Log minutes"))));
        });
        if (l.diagram) art.appendChild(diagram(l.diagram));
        var notes = h("div", { class: "sd-notes" }); renderBlocks(notes, l.notes || []);
        art.appendChild(notes);
        if (l.quiz) art.appendChild(quizForm(l.quiz, "Lesson check", S.quizGate(l, data.progress), function (answers) { emit({ type: "quiz", id: l.id, answers: answers }); }, "q-" + l.id,
          opts.quizLock ? opts.quizLock(l.id) : null, data.progress.quizzes[l.id]));
        art.appendChild(lessonActions(l));
        panel.appendChild(art);
      });
    }
    function diagram(d) {
      var nodes = d.nodes || [];
      return h("figure", { class: "sd-diagram" }, h("ol", { class: "sd-flow", "aria-label": "Diagram: " + nodes.join(" then ") }, nodes.map(function (n, i) {
        return h("li", null, h("span", { class: "sd-node", text: n }), i < nodes.length - 1 ? h("span", { class: "sd-arrow", "aria-hidden": "true", text: "→" }) : null);
      })), d.title ? h("figcaption", { text: "Diagram: " + d.title }) : null);
    }
    function renderBlocks(c, blocks) {
      (typeof blocks === "string" ? [blocks] : blocks).forEach(function (b) {
        if (typeof b === "string") b = { type: "p", text: b };
        switch (b.type) {
          case "h": c.appendChild(h("h3", { text: b.text })); break;
          case "h4": c.appendChild(h("h4", { text: b.text })); break;
          case "details": c.appendChild(h("details", { class: "sd-reveal" }, h("summary", { text: b.summary || "Show" }), notesText(b.text || ""))); break;
          case "links": c.appendChild(h("ul", { class: "sd-links" }, (b.items || []).map(function (it) { return h("li", null, h("a", { href: it.url, target: "_blank", rel: "noopener", text: it.title + " ↗" })); }))); break;
          case "ul": case "ol": c.appendChild(h(b.type, null, (b.items || []).map(function (it) { return h("li", { text: it }); }))); break;
          case "code": c.appendChild(h("pre", { class: "sd-code" }, h("code", { text: b.text }))); break;
          case "callout": c.appendChild(h("p", { class: "sd-callout sd-callout-" + (b.tone || "info"), text: b.text })); break;
          default: c.appendChild(h("p", { text: b.text }));
        }
      });
    }
    function quizForm(quiz, label, gate, onSubmit, key, locked, record) {
      var marks = record && Array.isArray(record.correct) && record.correct.length === quiz.questions.length ? record.correct : null;
      var form = h("form", { class: "sd-quiz" + (gate.passed ? " is-complete" : "") + (locked ? " is-locked" : ""), "data-quiz": key });
      form.appendChild(h("h3", null, label + " ", gate.passed ? h("span", { class: "sd-badge is-complete", text: "✓ Passed" + (gate.best != null ? " (best " + gate.best + "%" + (gate.score != null && gate.score !== gate.best ? ", last " + gate.score + "%" : "") + ")" : gate.score != null ? " (" + gate.score + "%)" : "") }) : gate.score != null ? h("span", { class: "sd-badge is-progress", text: "↻ " + gate.score + "% · retry" }) : h("span", { class: "sd-badge is-pending", text: "Needed to complete" })));
      quiz.questions.forEach(function (q, qi) {
        var fs = h("fieldset", null, h("legend", { text: (qi + 1) + ". " + q.q }));
        q.options.forEach(function (o, oi) {
          var id = key + "-" + qi + "-" + oi;
          fs.appendChild(h("label", { class: "sd-opt", for: id }, h("input", { type: "radio", name: key + "-" + qi, id: id, value: String(oi) }), " " + o));
        });
        if (marks && q.explanation) fs.appendChild(h("p", { class: "sd-callout sd-explain " + (marks[qi] ? "sd-callout-tip" : "sd-callout-warn"), text: (marks[qi] ? "✓ Last attempt correct. " : "✗ Last attempt wrong. ") + q.explanation }));
        form.appendChild(fs);
      });
      if (locked) form.appendChild(h("p", { class: "sd-gate" }, h("span", { "aria-hidden": "true", text: "🔒 " }), locked));
      form.appendChild(h("button", { type: "submit", class: "sd-btn", disabled: !!locked }, gate.passed ? "Retake" : "Check answers"));
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var answers = {};
        quiz.questions.forEach(function (q, qi) { var c = form.querySelector("input[name='" + key + "-" + qi + "']:checked"); if (c) answers[q.id || qi] = +c.value; });
        onSubmit(answers);
      });
      return form;
    }

    function vPractice(panel, rs, ent) {
      var any = false;
      sessionLessons(rs).forEach(function (l) {
        (l.practice || []).forEach(function (p) {
          any = true;
          var ps = S.practiceState(p, data.progress), key = p.id;
          var ev = h("textarea", { class: "sd-evidence", id: "ev-" + p.id, rows: "2", placeholder: "Paste a GitHub / GfG submission link, or a 2-line summary of what you built" });
          ev.value = state.drafts[key] != null ? state.drafts[key] : ps.evidence;
          ev.addEventListener("input", function () { state.drafts[key] = ev.value; });
          function set(s) { var v = ev.value; delete state.drafts[key]; emit({ type: "practice", id: p.id, status: s, evidence: v }); }
          var btns = h("div", { class: "sd-statechoices", role: "group", "aria-label": "Status of " + p.title });
          ["pending", "in-progress", "complete"].forEach(function (s) {
            btns.appendChild(h("button", { type: "button", class: "sd-btn sd-statechoice " + STATUS[s].cls + (ps.status === s ? " is-on" : ""), "aria-pressed": ps.status === s ? "true" : "false", onclick: function () { set(s); } },
              h("span", { "aria-hidden": "true", text: STATUS[s].icon + " " }), STATUS[s].label));
          });
          panel.appendChild(h("article", { class: "sd-card sd-practice " + STATUS[ps.status].cls, id: "practice-" + p.id },
            h("div", { class: "sd-card-h" }, h("div", null, h("p", { class: "sd-eyebrow", text: (derived.idx.lessonById[l.id].subject.dsa ? "DSA in Java · " : "") + l.id }), h("h2", { text: p.title })), badge(ps.status)),
            h("p", { class: "sd-meta" }, [p.platform, p.difficulty, p.minutes ? fmtMin(p.minutes) : null].filter(Boolean).join(" · "), p.url ? h("a", { href: p.url, target: "_blank", rel: "noopener", text: " Open ↗" }) : null),
            p.prompt ? h("p", { text: p.prompt }) : null,
            (p.acceptance || []).length ? h("ul", { class: "sd-checklist" }, p.acceptance.map(function (a) { return h("li", { text: a }); })) : null,
            p.required === false ? h("p", { class: "sd-muted", text: "Optional · does not block completing the lesson." }) : null,
            h("label", { class: "sd-ev-label", for: "ev-" + p.id }, "Assignment evidence" + (p.evidenceRequired ? " (needed to mark complete)" : "")), ev,
            h("div", { class: "sd-ev-actions" }, btns, h("button", { type: "button", class: "sd-btn sd-btn-ghost", onclick: function () { set(ps.status === "pending" ? "in-progress" : ps.status); } }, "Save evidence"))));
        });
      });
      if (ent && ent.budget.stretch) panel.appendChild(h("p", { class: "sd-callout sd-callout-tip", text: "Stretch practice today: " + fmtMin(ent.budget.stretch) + ". Redo today’s practice without notes, then 2–3 extra DSA problems on the same pattern." }));
      if (!any) panel.appendChild(h("p", { class: "sd-emptynote", text: "No practice items in this session." }));
    }

    function vRevision(panel, rs) {
      var key = rs.id, mine = data.progress.notes[key] || "";
      var prevRs = rs.n > 1 ? derived.res.sessions[rs.n - 2] : null, prevNotes = prevRs ? data.progress.notes[prevRs.id] || "" : "";
      var card = h("section", { class: "sd-card sd-mynotes-card", "aria-labelledby": "sd-mn-h" }, h("h2", { id: "sd-mn-h", text: "My notes first" }));
      if (prevRs) card.appendChild(h("h3", { text: "From session " + prevRs.n }));
      card.appendChild(prevRs ? (prevNotes ? notesText(prevNotes) : h("p", { class: "sd-emptynote", text: "No notes written for session " + prevRs.n + "." })) : h("p", { class: "sd-emptynote", text: "Day 1 has no previous session; the revision slot is Java foundations." }));
      if (mine) { card.appendChild(h("h3", { text: "This session" })); card.appendChild(notesText(mine)); }
      card.appendChild(h("p", null, h("a", { href: "#day-" + rs.n + "/my-notes", text: "Write or edit my notes ▸" })));
      panel.appendChild(card);
      var bullets = [];
      (prevRs ? prevRs.lessons.concat(prevRs.dsa) : rs.warmup ? [rs.warmup] : []).forEach(function (l) { (l.revision || []).forEach(function (b) { bullets.push([l.id, b]); }); });
      panel.appendChild(h("section", { class: "sd-card sd-suggested" }, h("h2", { text: "Suggested revision points" }), h("p", { class: "sd-muted", text: "12 minutes: say each point out loud, then test yourself with one question." }),
        bullets.length ? h("ul", null, bullets.map(function (b) { return h("li", null, h("code", { text: b[0] }), " " + b[1]); })) : h("p", { class: "sd-emptynote", text: "No suggested points." })));
      if (prevRs) {
        var done = !!data.progress.revisions[rs.id];
        panel.appendChild(h("button", { type: "button", class: "sd-btn" + (done ? "" : " sd-btn-primary"), onclick: function () { emit({ type: "revision", id: rs.id, done: !done }); } }, done ? "↺ Revision done (undo)" : "✓ Revision done"));
      }
    }
    function notesText(t) { return h("div", { class: "sd-notetext" }, t.split(/\n+/).map(function (line) { return h("p", { text: line }); })); }

    function vNotes(panel, rs) {
      var ta = h("textarea", { class: "sd-notes-ta", id: "sd-notes-ta", rows: "12", placeholder: "Your own words: key ideas, mistakes you made, questions for the coach." });
      ta.value = state.drafts["n-" + rs.id] != null ? state.drafts["n-" + rs.id] : data.progress.notes[rs.id] || "";
      var status = h("p", { class: "sd-muted sd-notes-status", id: "sd-notes-status", "aria-live": "polite" });
      var key = "n-" + rs.id, sid = rs.id;
      if (state.pendingNotes[key]) status.textContent = "Saving…";
      ta.addEventListener("input", function () {
        state.drafts[key] = ta.value; status.textContent = "Saving…";
        var pn = state.pendingNotes[key] || (state.pendingNotes[key] = {});
        clearTimeout(pn.timer);
        pn.save = function () {
          var text = state.drafts[key] != null ? state.drafts[key] : ta.value;
          delete state.drafts[key];
          // "Saved" only after the host confirms (QA M2/M3).
          emit({ type: "note", key: sid, text: text }).then(function (r) {
            var el = document.getElementById("sd-notes-status");
            if (el) el.textContent = r && r.ok === false ? "Not saved: " + (r.reason || "error") : "Saved";
          });
        };
        pn.timer = setTimeout(function () { delete state.pendingNotes[key]; pn.save(); }, 600);
      });
      ta.addEventListener("blur", flushNotes);
      panel.appendChild(h("section", { class: "sd-card" }, h("label", { for: "sd-notes-ta", class: "sd-h2label", text: "My notes · session " + rs.n }), ta, status,
        h("p", { class: "sd-muted", text: "These show first in the next session’s quick revision." })));
      // Per-topic key takeaways (host-provided lesson.topics; saved by the host, e.g. Codex topicTakeaways).
      var topics = [], coachTk = [];
      sessionLessons(rs).forEach(function (l) { (l.topics || []).forEach(function (t) { topics.push(t); }); (l.takeaways || []).forEach(function (t) { coachTk.push(t); }); });
      if (topics.length) {
        var tk = data.progress.takeaways || {};
        var sec = h("section", { class: "sd-card sd-takeaways", "aria-labelledby": "sd-tk-h" }, h("h2", { id: "sd-tk-h", text: "My key takeaways · per topic" }),
          h("p", { class: "sd-muted", text: "Your own rule, one mistake to avoid and an example, in your words. Saved with your progress." }));
        topics.forEach(function (t) {
          var saved = tk[t.id] || "", dk = "tk-" + t.id, tid = "sd-tk-" + t.id;
          var area = h("textarea", { class: "sd-evidence sd-tk-ta", id: tid, rows: "3", "data-topic": t.id, maxlength: "3000" });
          area.value = state.drafts[dk] != null ? state.drafts[dk] : saved;
          area.addEventListener("input", function () { state.drafts[dk] = area.value; });
          var msg = h("span", { class: "sd-muted", "aria-live": "polite" });
          sec.appendChild(h("div", { class: "sd-tk" }, h("label", { for: tid, class: "sd-ev-label" }, t.title + " ", h("code", { text: t.id })), area,
            h("div", { class: "sd-ev-actions" }, h("button", { type: "button", class: "sd-btn sd-btn-sm", "data-save-topic": t.id, onclick: function () {
              var text = area.value; msg.textContent = "Saving…";
              emit({ type: "takeaway", topicId: t.id, text: text, base: saved }).then(function (r) { if (!(r && r.ok === false)) delete state.drafts[dk]; msg.textContent = r && r.ok === false ? "Not saved: " + (r.reason || "error") : "Saved"; });
            } }, "Save takeaway"), msg)));
        });
        panel.appendChild(sec);
      }
      if (coachTk.length) panel.appendChild(h("details", { class: "sd-card sd-reveal sd-coach-tk" }, h("summary", { text: "Coach takeaways (" + coachTk.length + ") · open after writing yours" }),
        h("ul", null, coachTk.map(function (t) { return h("li", null, h("code", { text: t.topicId }), " " + t.text); }))));
    }

    function vCoach(panel, rs) {
      var qs = [];
      sessionLessons(rs).forEach(function (l) { ((E() ? E().questionsOf(l) : l.coach) || []).forEach(function (q) { qs.push({ q: q, lessonId: l.id }); }); });
      if (!qs.length) { panel.appendChild(h("p", { class: "sd-emptynote", text: "No coach prompts for this session." })); return; }
      qs.forEach(function (item) {
        var q = item.q, answered = !!(data.progress.interview && data.progress.interview[q.id]);
        var ans = h("textarea", { rows: "3", class: "sd-evidence", "aria-label": "Your answer to: " + q.prompt, placeholder: "Answer as you would in an interview" });
        var msg = h("p", { class: "sd-muted", "aria-live": "polite" });
        panel.appendChild(h("article", { class: "sd-card sd-iq", "data-iq": q.id }, h("h3", { text: q.prompt }), ans,
          q.answer ? h("details", { class: "sd-reveal sd-model" }, h("summary", { text: "Model answer (open after you answer)" }), notesText(q.answer)) : h("p", { class: "sd-muted sd-noanswer", text: "No model answer yet." }),
          h("div", { class: "sd-ev-actions" },
            h("button", { type: "button", class: "sd-btn", onclick: function () {
              var txt = "Interview question: " + q.prompt + "\nMy answer: " + ans.value + "\nPlease review my answer and ask one follow-up.";
              (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { msg.textContent = "Copied. Paste it to your coach."; }, function () { msg.textContent = "Copy failed. Select the text manually."; });
            } }, "Copy for coach"),
            opts.onCoachAsk ? h("button", { type: "button", class: "sd-btn sd-btn-primary", onclick: function () {
              msg.textContent = "Asking…";
              Promise.resolve(opts.onCoachAsk({ session: rs.n, questionId: q.id, question: q.prompt, answer: ans.value })).then(function (r) { msg.textContent = typeof r === "string" ? r : (r && r.text) || ""; }, function () { msg.textContent = "Coach unavailable."; });
            } }, "Ask coach") : null,
            derived.eng ? h("button", { type: "button", class: "sd-btn" + (answered ? "" : " sd-btn-primary"), "aria-pressed": answered ? "true" : "false", "data-qid": q.id,
              onclick: function () { emit({ type: "interview", id: q.id, lessonId: item.lessonId, answered: !answered }); } },
              answered ? "✓ Answered (undo)" : "Mark answered out loud · +" + E().POINTS.interviewAnswer + " XP") : null), msg));
      });
    }

    function vTest(panel, rs) {
      var me = derived.idx.moduleById[rs.test], m = me.module, ts = S.testState(m, data.progress), rec = data.progress.tests[m.id] || {};
      var card = h("section", { class: "sd-card sd-testcard " + TEST[ts].cls, id: "test-" + m.id }, h("div", { class: "sd-card-h" }, h("h2", { text: m.test.title }), tbadge(ts)),
        h("p", { class: "sd-muted", text: me.subject.title + " · " + m.title + " · pass mark " + (m.test.passPct || derived.settings.testPassPct) + "%" + (rec.attempts ? " · attempts: " + rec.attempts + (rec.score != null ? ", last " + rec.score + "%" : "") : "") }));
      if (ts === "locked") {
        var left = m.lessons.filter(function (l) { return S.lessonState(l, data.progress) !== "complete"; });
        card.appendChild(h("p", { class: "sd-gate" }, h("span", { "aria-hidden": "true", text: "🔒 " }), "Unlocks when every lesson in " + m.title + " is complete. Still open: "));
        card.appendChild(h("ul", null, left.map(function (l) { return h("li", null, h("a", { href: "#lesson/" + l.id, text: l.title }), " ", badge(S.lessonState(l, data.progress))); })));
      } else {
        card.appendChild(quizForm(m.test, "Questions", { passed: ts === "passed", score: rec.score }, function (answers) { emit({ type: "test", id: m.id, answers: answers }); }, "t-" + m.id));
      }
      panel.appendChild(card);
    }

    /* ---------- engagement (XP, streak, tasks, challenges, activity, reminders) ---------- */
    function fmtNum(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function isExample(eng) { return !!(eng.example || eng.source === "example"); }
    function sourceNote(eng) {
      if (isExample(eng)) return h("p", { class: "sd-example", role: "note" }, h("strong", { text: "Example data" }), " · these numbers are sample values to preview the design, not your real progress.");
      return h("p", { class: "sd-muted sd-eng-src", text: eng.source === "host" ? "From your synced progress." : "Calculated in this browser from your progress." });
    }
    function exampleChip(eng) { return isExample(eng) ? h("span", { class: "sd-chip sd-chip-example", text: "Example data" }) : null; }
    function ring(done, total, label) {
      var r = 26, c = 2 * Math.PI * r, pct = total ? done / total : 0;
      var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 64 64"); svg.setAttribute("class", "sd-ring-svg"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
      [["sd-ring-bg", c], ["sd-ring-fg", c * (1 - pct)]].forEach(function (x, i) {
        var ci = document.createElementNS(ns, "circle");
        ci.setAttribute("cx", "32"); ci.setAttribute("cy", "32"); ci.setAttribute("r", String(r)); ci.setAttribute("class", x[0]);
        if (i) { ci.setAttribute("stroke-dasharray", c.toFixed(2)); ci.setAttribute("stroke-dashoffset", x[1].toFixed(2)); ci.setAttribute("transform", "rotate(-90 32 32)"); }
        svg.appendChild(ci);
      });
      return h("div", { class: "sd-ring", role: "img", "aria-label": label }, svg, h("span", { class: "sd-ring-txt", "aria-hidden": "true" }, h("strong", { text: done }), h("small", { text: "/" + total })));
    }
    function engStrip(eng) {
      var lv = eng.level, st = eng.streak || {};
      var streakTxt = st.current ? st.current + "-day streak" : "No streak yet";
      var streakSub = st.todayOff ? "Today is a day off: your streak is safe" : st.todayDone ? "Today counted ✓" : st.atRisk ? "Study tonight to keep it" : "Start one tonight";
      return h("div", { class: "sd-eng-strip", "aria-label": "Your score" },
        h("a", { class: "sd-stat sd-stat-xp", href: "#activity" }, h("span", { class: "sd-stat-ico", "aria-hidden": "true", text: "★" }),
          h("span", { class: "sd-stat-body" }, h("strong", { class: "sd-stat-v", text: fmtNum(eng.xp) + " XP" }), h("small", { text: "+" + fmtNum(eng.todayXp) + " today" }))),
        h("a", { class: "sd-stat sd-stat-lv", href: "#activity" }, h("span", { class: "sd-stat-ico", "aria-hidden": "true", text: "▲" }),
          h("span", { class: "sd-stat-body" }, h("strong", { class: "sd-stat-v", text: "Level " + lv.n + " · " + lv.name }),
            meter(lv.pct, "Level progress: " + lv.pct + "% to level " + (lv.n + 1)), h("small", { text: fmtNum(lv.toNext) + " XP to level " + (lv.n + 1) }))),
        h("a", { class: "sd-stat sd-stat-streak" + (st.atRisk ? " is-risk" : ""), href: "#activity" }, h("span", { class: "sd-stat-ico", "aria-hidden": "true", text: "🔥" }),
          h("span", { class: "sd-stat-body" }, h("strong", { class: "sd-stat-v", text: streakTxt }), h("small", { text: streakSub + (st.best ? " · best " + st.best : "") }))),
        exampleChip(eng));
    }
    function taskRow(t) {
      return h("li", { class: "sd-task" + (t.done ? " is-complete" : ""), "data-task": t.id },
        h("span", { class: "sd-task-ico", "aria-hidden": "true", text: t.done ? "✓" : "○" }),
        h("a", { href: t.href, class: "sd-task-t", text: t.title }),
        t.xp ? h("span", { class: "sd-xp", text: (t.done ? "" : "+") + t.xp + " XP" }) : null,
        h("span", { class: "sd-vh", text: t.done ? ", done" : ", to do" }));
    }
    function challengeCard(c, eng) {
      var mine = !isExample(eng);
      var btn = c.claimed ? h("span", { class: "sd-badge is-complete" }, h("span", { "aria-hidden": "true", text: "✓" }), " Claimed +" + c.xp + " XP")
        : h("button", { type: "button", class: "sd-btn" + (c.met ? " sd-btn-primary" : ""), "aria-disabled": c.met && mine ? null : "true", "data-challenge": c.id,
            onclick: function () { if (!c.met || !mine) { toast(mine ? "Not yet: " + c.text : "Example data: nothing to claim."); return; } emit({ type: "challenge", id: c.id }); } },
          c.met ? "Claim +" + c.xp + " XP" : "Claim +" + c.xp + " XP (locked)");
      return h("article", { class: "sd-chal sd-chal-" + c.period + (c.claimed ? " is-complete" : c.met ? " is-ready" : ""), "data-period": c.period },
        h("p", { class: "sd-eyebrow", text: (c.period === "daily" ? "Daily challenge" : "Weekly challenge") + " · +" + c.xp + " XP" }),
        h("h3", { text: c.title }), h("p", { class: "sd-chal-text", text: c.text }),
        h("div", { class: "sd-progline" }, meter(c.pct, c.title + " progress"), h("span", { class: "sd-muted", text: fmtNum(Math.min(c.value, c.target)) + "/" + fmtNum(c.target) })),
        h("div", { class: "sd-chal-actions" }, btn, c.href && !c.claimed ? h("a", { class: "sd-link", href: c.href, text: "Go ▸" }) : null));
    }
    function engToday(eng) {
      var tk = eng.tasks || { tasks: [] }, wrap = h("div", { class: "sd-eng-grid" });
      var card = h("section", { class: "sd-card sd-tasks", "aria-labelledby": "sd-tasks-h" });
      var head = h("div", { class: "sd-tasks-head" }, ring(tk.done || 0, tk.total || 0, (tk.done || 0) + " of " + (tk.total || 0) + " tasks done today"),
        h("div", null, h("h2", { id: "sd-tasks-h", text: "Today’s tasks" }),
          h("p", { class: "sd-muted", text: tk.off ? "Day off: no tasks today. Your streak is safe." : !tk.total ? "Nothing scheduled." : tk.allDone ? "All done. Session finished for today: well played." : fmtNum(tk.xpAvailable) + " XP still on the table tonight." }),
          exampleChip(eng)));
      card.appendChild(head);
      if (tk.tasks && tk.tasks.length) card.appendChild(h("ul", { class: "sd-tasklist" }, tk.tasks.map(taskRow)));
      wrap.appendChild(card);
      var chs = eng.challenges || [];
      var cc = h("section", { class: "sd-card sd-chals", "aria-labelledby": "sd-chal-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-chal-h", text: "Challenges" }), h("a", { class: "sd-link", href: "#activity", text: "Activity & badges ▸" })));
      if (chs.length) chs.forEach(function (c) { cc.appendChild(challengeCard(c, eng)); }); else cc.appendChild(h("p", { class: "sd-emptynote", text: "No challenge today." }));
      wrap.appendChild(cc);
      return wrap;
    }
    function fmtAt(iso) {
      var ms = Date.parse(iso); if (isNaN(ms)) return "";
      var d = new Date(ms + 330 * 60000), H = d.getUTCHours(), M = d.getUTCMinutes();
      return fmtDate(d.toISOString().slice(0, 10)) + ", " + ((H + 11) % 12 + 1) + ":" + String(M).padStart(2, "0") + " " + (H < 12 ? "AM" : "PM") + " IST";
    }
    var ACT_LABEL = { lesson: "Lesson", practice: "Practice", quiz: "Lesson check", test: "Module test", watch: "Video", note: "Notes", revision: "Revision", interview: "Interview answer", takeaway: "Key takeaway", challenge: "Challenge", prefs: "Reminder settings", unavailable: "Day off", minutes: "Study minutes" };
    // First 10 rows visible, the rest behind a native <details> (keyboard accessible, no JS state).
    function moreList(cls, items, row, noun) {
      var first = items.slice(0, 10), rest = items.slice(10), wrap = h("div", null, h("ul", { class: cls }, first.map(row)));
      if (rest.length) wrap.appendChild(h("details", { class: "sd-more" }, h("summary", { text: "Show " + rest.length + " older " + noun }), h("ul", { class: cls }, rest.map(row))));
      return wrap;
    }
    function viewActivity() {
      var eng = derived.eng, st = eng.streak || {}, lv = eng.level;
      add(main, [h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Activity · " + fmtDate(data.today, true) }), h("h1", { text: "Activity & XP" }), engStrip(eng)), sourceNote(eng)]);
      // last 28 study dates (streak history)
      var hist = (st.history || []).slice(-28);
      var LBL = { active: "studied", off: "day off (streak safe)", missed: "missed", pending: "today, not yet" };
      main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-heat-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-heat-h", text: "Streak" }),
          h("span", { class: "sd-muted", text: "Current " + (st.current || 0) + " · best " + (st.best || 0) + (st.skippedDays ? " · " + st.skippedDays + " day" + (st.skippedDays === 1 ? "" : "s") + " off kept it alive" : "") })),
        hist.length ? h("ol", { class: "sd-heat", "aria-label": "Last " + hist.length + " dates" }, hist.map(function (x) {
          return h("li", { class: "sd-heat-d is-" + x.state, title: fmtDate(x.date) + ": " + LBL[x.state] }, h("span", { class: "sd-vh", text: fmtDate(x.date) + ": " + LBL[x.state] }), h("span", { "aria-hidden": "true", text: +x.date.slice(8) }));
        })) : h("p", { class: "sd-emptynote", text: "No study dates yet. Your first study day starts the streak." }),
        h("ul", { class: "sd-heat-key", "aria-hidden": "true" }, ["active", "off", "missed", "pending"].map(function (k) { return h("li", null, h("span", { class: "sd-heat-sw is-" + k }), LBL[k]); })),
        h("p", { class: "sd-muted", text: "Streaks count study days, not calendar days: a date you mark unavailable (or set to 0 minutes) never breaks it, the same rule that carries your session forward." })));
      // badges
      var bs = eng.badges || [], earned = bs.filter(function (b) { return b.earned; }).length;
      main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-badge-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-badge-h", text: "Badges" }), h("span", { class: "sd-muted", text: earned + " of " + bs.length + " earned" })),
        h("ul", { class: "sd-badges" }, bs.map(function (b) {
          return h("li", { class: "sd-bdg" + (b.earned ? " is-earned" : "") }, h("span", { class: "sd-bdg-ico", "aria-hidden": "true", text: b.earned ? "🏅" : "🔒" }),
            h("span", null, h("strong", { text: b.title }), h("small", { text: b.text + (b.earned ? " · earned" : " · " + fmtNum(b.value) + "/" + fmtNum(b.target)) })));
        }))));
      // points ledger
      var led = (eng.ledger || []).slice(0, 100);
      main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-led-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-led-h", text: "Points history" }), h("span", { class: "sd-muted", text: fmtNum(eng.xp) + " XP total" })),
        led.length ? moreList("sd-ledger", led, function (e) { return h("li", null, h("span", { class: "sd-led-d", text: e.date ? fmtDate(e.date) : "Earlier" }), h("span", { class: "sd-led-t", text: e.label }), h("span", { class: "sd-xp", text: "+" + e.xp })); }, "points")
          : h("p", { class: "sd-emptynote", text: "No points yet. Finish a lesson check or a practice item to earn your first XP." })));
      // activity log
      var log = (eng.activity || []).slice(0, 100);
      main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-log-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-log-h", text: "Activity log" }),
          h("span", { class: "sd-muted", text: eng.lastActiveAt ? "Last study activity: " + fmtAt(eng.lastActiveAt) : "No study activity recorded yet" })),
        log.length ? moreList("sd-ledger sd-actlog", log, function (a) {
          return h("li", null, h("span", { class: "sd-led-d", text: fmtAt(a.at) }), h("span", { class: "sd-led-t" }, h("strong", { text: (ACT_LABEL[a.type] || a.type) + " " }), a.id ? h("code", { text: a.id }) : null, a.status ? " · " + a.status : ""),
            h("span", { class: "sd-xp" + (a.xp < 0 ? " is-neg" : ""), text: a.xp ? (a.xp > 0 ? "+" : "") + a.xp : "" }));
        }, "events") : h("p", { class: "sd-emptynote", text: "Timestamped events appear here as you study (this preview records them from now on)." })));
      // how points work
      var P = E().POINTS;
      var rows = [["Finish a lesson", P.lessonComplete], ["Pass a lesson check", P.quizPass + " (+" + P.quizPerfectBonus + " for 100%)"], ["Practice item done", P.practiceComplete + " (+" + P.practiceEvidenceBonus + " with evidence)"],
        ["Quick revision", P.revisionDone], ["Interview question answered", P.interviewAnswer + " each"], ["Module test passed", P.moduleTestPass + " (+" + P.moduleTestHighBonus + " for 90%+)"],
        ["Whole session finished", P.sessionComplete], ["Videos", P.watchPer10Min + " per 10 min, max " + P.watchDailyCap + "/day"], ["Daily challenge", P.dailyChallenge], ["Weekly challenge", P.weeklyChallenge]];
      main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-pts-h" }, h("h2", { id: "sd-pts-h", text: "How points work" }),
        h("table", { class: "sd-pts" }, h("thead", null, h("tr", null, h("th", { scope: "col", text: "Action" }), h("th", { scope: "col", text: "XP" }))),
          h("tbody", null, rows.map(function (r) { return h("tr", null, h("th", { scope: "row", text: r[0] }), h("td", { text: String(r[1]) })); }))),
        h("p", { class: "sd-muted", text: "Levels: " + E().LEVELS.map(function (l, i) { return (i + 1) + " " + l.name + " (" + fmtNum(l.xp) + ")"; }).join(" · ") + ", then +1,500 XP per level." })));
    }
    function viewSettings() {
      var eng = derived.eng, n = eng.notifications || E().NOTIFY_DEFAULTS;
      add(main, [h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Settings" }), h("h1", { text: "Reminder settings" })),
        h("div", { class: "sd-alert sd-alert-info", role: "note" }, h("strong", { text: "Email sending is not wired yet. " }), "These preferences are saved with your progress (in this browser for the preview) so the reminder job can use them once it exists. No email is sent today.")]);
      var form = h("form", { class: "sd-card sd-prefs", "aria-labelledby": "sd-pref-h", novalidate: true });
      var email = h("input", { type: "checkbox", id: "sd-pref-email", checked: !!n.email });
      var addr = h("input", { type: "email", id: "sd-pref-addr", class: "sd-input", value: n.address || "", autocomplete: "email", placeholder: "you@example.com" });
      var iv = h("select", { id: "sd-pref-iv", class: "sd-input" }, [[2, "Every 2 hours"], [2.5, "Every 2½ hours"], [3, "Every 3 hours"]].map(function (o) { return h("option", { value: String(o[0]), selected: +n.intervalHours === o[0] }, o[1]); }));
      var qs = h("input", { type: "time", id: "sd-pref-qs", class: "sd-input", value: n.quietStart, step: "900" });
      var qe = h("input", { type: "time", id: "sd-pref-qe", class: "sd-input", value: n.quietEnd, step: "900" });
      var mx = h("input", { type: "number", id: "sd-pref-max", class: "sd-input sd-num", min: "1", max: "12", value: String(n.maxPerDay) });
      var err = h("p", { class: "sd-pref-err", id: "sd-pref-err", role: "alert" });
      var nx = eng.nextNudge || {};
      add(form, [h("h2", { id: "sd-pref-h", text: "Email nudges when you go quiet" }),
        h("div", { class: "sd-ctl-row" }, email, h("label", { for: "sd-pref-email" }, h("strong", { text: "Email me when I haven’t studied for a while" }))),
        h("div", { class: "sd-field" }, h("label", { for: "sd-pref-addr", text: "Send reminders to" }), addr),
        h("div", { class: "sd-field" }, h("label", { for: "sd-pref-iv", text: "How often, while there is no activity" }), iv),
        h("fieldset", { class: "sd-field sd-quiet" }, h("legend", { text: "Quiet hours (IST): no emails between" }),
          h("label", { for: "sd-pref-qs", class: "sd-vh", text: "Quiet hours start" }), qs, h("span", { "aria-hidden": "true", text: " and " }), h("label", { for: "sd-pref-qe", class: "sd-vh", text: "Quiet hours end" }), qe),
        h("div", { class: "sd-field" }, h("label", { for: "sd-pref-max", text: "At most this many reminders a day" }), mx),
        err,
        h("div", { class: "sd-ev-actions" }, h("button", { type: "submit", class: "sd-btn sd-btn-primary" }, "Save reminder settings"),
          h("button", { type: "button", class: "sd-btn sd-btn-ghost", onclick: function () { var d = E().NOTIFY_DEFAULTS; emit({ type: "prefs", notifications: { email: false, address: n.address || "", intervalHours: d.intervalHours, quietStart: d.quietStart, quietEnd: d.quietEnd, maxPerDay: d.maxPerDay } }); } }, "Reset to defaults")),
        h("p", { class: "sd-muted", id: "sd-pref-next" }, h("strong", { text: "Preview: " }), nx.at ? "the next reminder would go out around " + nx.label + " (" + nx.reason + ")." : nx.reason + "."),
        h("p", { class: "sd-muted", text: "Defaults: off, every 2½ hours, quiet 12:00 AM–6:00 AM IST, at most 6 a day. No reminder once today’s tasks are done." })]);
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var next = { email: email.checked, address: addr.value.trim(), intervalHours: +iv.value, quietStart: qs.value, quietEnd: qe.value, maxPerDay: Math.round(+mx.value) };
        var bad = E().validateNotificationPrefs(next);
        if (bad.length) { err.textContent = bad.join(". ") + "."; (bad[0].indexOf("address") >= 0 || bad[0].indexOf("email address") >= 0 ? addr : bad[0].indexOf("interval") >= 0 ? iv : bad[0].indexOf("Quiet") >= 0 ? qs : bad[0].indexOf("most") >= 0 ? mx : email).focus(); return; }
        err.textContent = "";
        emit({ type: "prefs", notifications: next }).then(function (r) { if (!r || r.ok !== false) toast("Reminder settings saved. Email sending is not wired yet."); });
      });
      main.appendChild(form);
      main.appendChild(sourceNote(eng));
    }

    /* ---------- lifecycle ---------- */
    var routing = opts.routing !== false;
    if (routing) window.addEventListener("hashchange", onHash);
    state.route = parseHash();
    derive();
    if (routing && (state.route.view === "lesson" || (state.route.canonical && location.hash !== "#" + state.route.canonical))) onHash(); else render(false);

    return {
      update: function (next) {
        next = next || {};
        if (next.course) data.course = next.course;
        if (next.progress) data.progress = S.normalize(next.progress);
        if (next.today) data.today = next.today;
        if ("sync" in next) data.sync = next.sync;
        if ("engagement" in next) data.engagement = next.engagement;
        var a = document.activeElement, aid = a && a.id, sel = null, y = window.scrollY, sig = null;
        try { sel = a && a.selectionStart; } catch (e) {}
        if (a && !aid && root.contains(a)) { var anc = a.parentElement && a.parentElement.closest("[id]"); sig = { anc: anc && anc.id, tag: a.tagName, text: a.textContent.trim(), cls: (a.className || "").split(" ")[1] || "" }; }
        render(false);
        window.scrollTo(0, y);
        var el = aid ? document.getElementById(aid) : null;
        if (!el && sig) {
          var scope = (sig.anc && document.getElementById(sig.anc)) || main;
          var cands = Array.prototype.slice.call(scope.querySelectorAll(sig.tag));
          el = cands.find(function (c) { return c.textContent.trim() === sig.text; }) || (sig.cls ? cands.find(function (c) { return c.classList.contains(sig.cls); }) : null);
        }
        if (el) { el.focus({ preventScroll: true }); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) {} }
      },
      navigate: function (hash) { location.hash = hash; },
      getRoute: function () { return Object.assign({}, state.route); },
      getDerived: function () { return derived; },
      flush: flushNotes,
      destroy: function () { flushNotes(); window.removeEventListener("hashchange", onHash); window.removeEventListener("pagehide", flushNotes); window.removeEventListener("beforeunload", flushNotes); document.removeEventListener("visibilitychange", onVis); document.removeEventListener("keydown", onKey); setNav(false); root.innerHTML = ""; root.classList.remove("sd-root"); }
    };
  }

  global.StudyDesk = { mount: mount, version: "2.0.0" };
})(typeof window !== "undefined" ? window : this);
