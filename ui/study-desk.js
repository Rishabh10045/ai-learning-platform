/*
 * Study Desk presentation layer v2 (subject-first). No build step, no dependencies.
 * Needs ui/engine/schedule-engine.js (window.StudyDeskSchedule) loaded first.
 *
 *   const desk = StudyDesk.mount(el, { course, progress, today, sync, onChange, onCoachAsk, headerLinks });
 *   desk.update({ progress, sync, today, course });
 *
 * The UI never stores anything. Every user action calls onChange(change) with the
 * change shapes documented in schedule-engine.js applyChange(); the host persists
 * (Codex's progress.js / account sync) and calls update(). If onChange returns
 * { ok:false, reason } (or a Promise of it) the reason is shown to the learner.
 */
(function (global) {
  "use strict";
  var S = global.StudyDeskSchedule;
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
    var data = { course: opts.course, progress: S.normalize(opts.progress), today: opts.today || S.todayIST(), sync: opts.sync || null };
    var state = { route: { view: "today" }, query: "", navOpen: false, toast: "", openModules: {}, focusLesson: null, drafts: {} };
    var derived;
    root.classList.add("sd-root");
    root.innerHTML = "";

    function derive() {
      var idx = S.indexCourse(data.course), res = S.resolveSessions(data.course, idx);
      var cal = S.buildCalendar(data.course, data.progress, { idx: idx, resolved: res, today: data.today });
      var tp = S.todayPlan(data.course, data.progress, { idx: idx, resolved: res, today: data.today });
      derived = { idx: idx, res: res, cal: cal, today: tp, cont: S.continueTarget(data.course, data.progress), settings: S.settingsOf(data.course, data.progress) };
    }

    /* ---------- routing ---------- */
    function parseHash() {
      var hs = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      var m = /^day-(\d+)(?:\/(learn|practice|revision|my-notes|coach|test))?$/.exec(hs);
      if (m) return { view: m[2] || "plan", day: +m[1] };
      m = /^lesson\/(.+)$/.exec(hs);
      if (m) return { view: "lesson", lessonId: m[1] };
      if (hs === "course" || hs === "calendar" || hs === "today") return { view: hs };
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
      state.route = r; setNav(false); render(true);
    }

    /* ---------- change plumbing ---------- */
    function emit(change) {
      change.date = change.date || data.today;
      var out = opts.onChange ? opts.onChange(change) : null;
      Promise.resolve(out).then(function (r) {
        if (r && r.ok === false) toast(r.reason || "Could not save that change");
        else if (r && r.result && r.result.total) toast((change.type === "test" ? "Test" : "Lesson check") + ": " + r.result.right + "/" + r.result.total + " (" + r.result.pct + "%). " + (r.result.passed ? "Passed." : "Need " + r.result.passPct + "% to pass."));
      }, function (e) { toast("Host could not save: " + (e && e.message || e)); });
    }
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
    var sidebar = h("nav", { class: "sd-sidebar", id: "sd-sidebar", "aria-label": "Course navigation" }, sideNav,
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
    function onKey(e) { if (e.key === "Escape" && state.navOpen) { setNav(false); navToggle.focus(); } }
    document.addEventListener("keydown", onKey);
    function setNav(open) {
      state.navOpen = open; root.classList.toggle("sd-nav-open", open); navToggle.setAttribute("aria-expanded", open ? "true" : "false"); scrim.hidden = !open;
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
      return { today: "Today", course: "Course", calendar: "Calendar" }[r.view] || "Not found";
    }

    function matchText(q, hay) { return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (t) { return hay.toLowerCase().indexOf(t) >= 0; }); }

    function renderSidebar() {
      var r = state.route, q = state.query.trim();
      sideNav.innerHTML = "";
      [["today", "Today", "☀"], ["course", "Course", "▦"], ["calendar", "Calendar", "▤"]].forEach(function (x) {
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
      if (!derived.res.ok) main.appendChild(h("div", { class: "sd-alert", role: "alert" }, h("strong", { text: "Curriculum check failed: " }), derived.res.errors.slice(0, 5).join(" · ") + (derived.res.errors.length > 5 ? " …" : "")));
      if (r.view === "today") return viewToday();
      if (r.view === "course") return viewCourse();
      if (r.view === "calendar") return viewCalendar();
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
      if (b.kind === "revision") return rs.n > 1 && derived.cal.statuses[rs.n - 2].status === "complete" ? (data.progress.notes["rev-" + rs.id] ? "complete" : "pending") : "pending";
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
          h("span", { class: "sd-chip sd-chip-budget", text: (e.budget.kind === "sunday" ? "Sunday plan · " : e.budget.dayName + " · ") + fmtMin(e.budget.minutes) + (e.budget.stretch ? " (2h core + " + fmtMin(e.budget.stretch) + " stretch)" : "") }),
          e.carried ? h("span", { class: "sd-chip sd-chip-carry", text: "Carried forward: unfinished from an earlier date" }) : null,
          e.budget.short ? h("span", { class: "sd-chip sd-chip-carry", text: "Short day: the core is scaled down; unfinished work carries forward" }) : null)]);
      main.appendChild(head);
      main.appendChild(continueCard());
      if (e.unavailable) {
        main.appendChild(h("section", { class: "sd-card sd-offcard" }, h("h2", { text: "You marked " + fmtDate(e.date) + " as unavailable" }),
          h("p", { text: "Session " + e.carries + " stays pending and moves to your next available date. Nothing is skipped." })));
      } else {
        main.appendChild(h("section", { class: "sd-card", "aria-labelledby": "sd-tl-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-tl-h", text: "Tonight’s plan" }),
          h("a", { href: "#day-" + rs.n, class: "sd-link", text: "Open session " + rs.n + " ▸" })), blockList(e, rs),
          h("p", { class: "sd-muted", text: e.n === 1 ? "Day 1 uses the 12-minute revision slot for Java foundations (" + (rs.warmup ? rs.warmup.id : "warm-up") + ")." : "From Day 2: 12 min revision, 78 min main lesson, 30 min DSA." })));
      }
      main.appendChild(dayControls(e));
      main.appendChild(upcoming(e.date));
    }

    function dayControls(e) {
      var d = e.date, set = derived.settings, wd = S.weekday(d);
      var off = h("input", { type: "checkbox", id: "sd-off", checked: !!set.unavailable[d] });
      off.addEventListener("change", function () { emit({ type: "unavailable", date: d, value: off.checked }); });
      var mins = h("input", { type: "number", id: "sd-mins", min: "30", max: "960", step: "15", value: String(e.budget.minutes), class: "sd-num", disabled: !!set.unavailable[d] });
      var wdMins = h("input", { type: "number", id: "sd-wdmins", min: "30", max: "960", step: "15", value: String(set.dailyMinutes[wd]), class: "sd-num" });
      return h("section", { class: "sd-card sd-controls", "aria-labelledby": "sd-ctl-h" },
        h("h2", { id: "sd-ctl-h", text: "Adjust " + fmtDate(d) }),
        h("div", { class: "sd-ctl-row" }, off, h("label", { for: "sd-off" }, h("strong", { text: "I can’t study on " + fmtDate(d) }), h("small", { class: "sd-muted", text: " The same unfinished session moves to the next available date." }))),
        h("div", { class: "sd-ctl-row" }, h("label", { for: "sd-mins", text: "Minutes on " + fmtDate(d) }), mins,
          h("button", { type: "button", class: "sd-btn", onclick: function () { emit({ type: "minutes", date: d, minutes: mins.value }); } }, "Save for this date"),
          e.budget.overridden ? h("button", { type: "button", class: "sd-btn sd-btn-ghost", onclick: function () { emit({ type: "minutes", date: d, minutes: "" }); } }, "Reset") : null),
        h("div", { class: "sd-ctl-row" }, h("label", { for: "sd-wdmins", text: "Default for every " + S.DAY_NAMES[wd] }), wdMins,
          h("button", { type: "button", class: "sd-btn", onclick: function () { emit({ type: "minutes", weekday: wd, minutes: wdMins.value }); } }, "Save default")),
        h("p", { class: "sd-muted", text: "Defaults: Sunday 6h 30m (2h core + 4h 30m stretch); other days 2h, 9:00–11:00 PM IST." }));
    }

    function upcoming(fromDate) {
      var list = derived.cal.entries.filter(function (x) { return x.date > fromDate; }).slice(0, 6);
      return h("section", { class: "sd-card", "aria-labelledby": "sd-up-h" }, h("div", { class: "sd-card-h" }, h("h2", { id: "sd-up-h", text: "Next up" }), h("a", { href: "#calendar", class: "sd-link", text: "Full calendar ▸" })),
        h("ul", { class: "sd-upcoming" }, list.map(calRow)),
        h("p", { class: "sd-muted", text: "Projected finish: " + fmtDate(derived.cal.finishDate, true) + "." }));
    }
    function calRow(x) {
      var rs = x.n ? derived.res.sessions[x.n - 1] : null, subj = rs ? derived.idx.subjectById[rs.subjectId] : null;
      return h("li", { class: "sd-calrow" + (x.unavailable ? " is-off" : "") + (x.isToday ? " is-today" : "") },
        h("span", { class: "sd-cal-date", text: fmtDate(x.date) }),
        x.unavailable ? h("span", { class: "sd-cal-main" }, h("strong", { text: "Unavailable" }), h("small", { class: "sd-muted", text: " · session " + x.carries + " moves to the next date" }))
          : h("a", { class: "sd-cal-main", href: "#day-" + x.n }, h("strong", { text: "Session " + x.n }), " · " + subj.title + " + DSA" + (x.carried ? " (carried)" : "")),
        h("span", { class: "sd-cal-min", text: x.unavailable ? "—" : fmtMin(x.budget.minutes) }),
        x.unavailable ? h("span", { class: "sd-badge is-off", text: "⊘ Off" }) : badge(x.status));
    }

    function viewCalendar() {
      add(main, [h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Calendar · starts " + fmtDate(derived.settings.startDate, true) }), h("h1", { text: "Dates and sessions" }),
        h("p", { class: "sd-muted", text: derived.res.count + " study sessions. Study days are not calendar days: an unavailable or missed date keeps the same session pending and pushes the rest forward. Projected finish: " + fmtDate(derived.cal.finishDate, true) + "." }))]);
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
          h("span", { class: "sd-chip sd-chip-budget", text: fmtMin(ent.budget.minutes) + (ent.budget.stretch ? " (2h core + " + fmtMin(ent.budget.stretch) + " stretch)" : "") })), blockList(ent, rs)));
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
        if (l.quiz) art.appendChild(quizForm(l.quiz, "Lesson check", S.quizGate(l, data.progress), function (answers) { emit({ type: "quiz", id: l.id, answers: answers }); }, "q-" + l.id));
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
          case "ul": case "ol": c.appendChild(h(b.type, null, (b.items || []).map(function (it) { return h("li", { text: it }); }))); break;
          case "code": c.appendChild(h("pre", { class: "sd-code" }, h("code", { text: b.text }))); break;
          case "callout": c.appendChild(h("p", { class: "sd-callout sd-callout-" + (b.tone || "info"), text: b.text })); break;
          default: c.appendChild(h("p", { text: b.text }));
        }
      });
    }
    function quizForm(quiz, label, gate, onSubmit, key) {
      var form = h("form", { class: "sd-quiz" + (gate.passed ? " is-complete" : "") });
      form.appendChild(h("h3", null, label + " ", gate.passed ? h("span", { class: "sd-badge is-complete", text: "✓ Passed" + (gate.score != null ? " (" + gate.score + "%)" : "") }) : gate.score != null ? h("span", { class: "sd-badge is-progress", text: "↻ " + gate.score + "% · retry" }) : h("span", { class: "sd-badge is-pending", text: "Needed to complete" })));
      quiz.questions.forEach(function (q, qi) {
        var fs = h("fieldset", null, h("legend", { text: (qi + 1) + ". " + q.q }));
        q.options.forEach(function (o, oi) {
          var id = key + "-" + qi + "-" + oi;
          fs.appendChild(h("label", { class: "sd-opt", for: id }, h("input", { type: "radio", name: key + "-" + qi, id: id, value: String(oi) }), " " + o));
        });
        form.appendChild(fs);
      });
      form.appendChild(h("button", { type: "submit", class: "sd-btn" }, gate.passed ? "Retake" : "Check answers"));
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
        var done = !!data.progress.notes["rev-" + rs.id];
        panel.appendChild(h("button", { type: "button", class: "sd-btn" + (done ? "" : " sd-btn-primary"), onclick: function () { emit({ type: "note", key: "rev-" + rs.id, text: done ? "" : "done" }); } }, done ? "↺ Revision done (undo)" : "✓ Revision done"));
      }
    }
    function notesText(t) { return h("div", { class: "sd-notetext" }, t.split(/\n+/).map(function (line) { return h("p", { text: line }); })); }

    function vNotes(panel, rs) {
      var ta = h("textarea", { class: "sd-notes-ta", id: "sd-notes-ta", rows: "12", placeholder: "Your own words: key ideas, mistakes you made, questions for the coach." });
      ta.value = state.drafts["n-" + rs.id] != null ? state.drafts["n-" + rs.id] : data.progress.notes[rs.id] || "";
      var status = h("p", { class: "sd-muted", "aria-live": "polite" });
      var t;
      ta.addEventListener("input", function () {
        state.drafts["n-" + rs.id] = ta.value; status.textContent = "Saving…"; clearTimeout(t);
        t = setTimeout(function () { delete state.drafts["n-" + rs.id]; emit({ type: "note", key: rs.id, text: ta.value }); status.textContent = "Saved"; }, 600);
      });
      panel.appendChild(h("section", { class: "sd-card" }, h("label", { for: "sd-notes-ta", class: "sd-h2label", text: "My notes · session " + rs.n }), ta, status,
        h("p", { class: "sd-muted", text: "These show first in the next session’s quick revision." })));
    }

    function vCoach(panel, rs) {
      var qs = [];
      sessionLessons(rs).forEach(function (l) { (l.coach || []).forEach(function (q) { qs.push(q); }); });
      if (!qs.length) { panel.appendChild(h("p", { class: "sd-emptynote", text: "No coach prompts for this session." })); return; }
      qs.forEach(function (q) {
        var ans = h("textarea", { rows: "3", class: "sd-evidence", "aria-label": "Your answer to: " + q.prompt, placeholder: "Answer as you would in an interview" });
        var msg = h("p", { class: "sd-muted", "aria-live": "polite" });
        panel.appendChild(h("article", { class: "sd-card" }, h("h3", { text: q.prompt }), ans,
          h("div", { class: "sd-ev-actions" },
            h("button", { type: "button", class: "sd-btn", onclick: function () {
              var txt = "Interview question: " + q.prompt + "\nMy answer: " + ans.value + "\nPlease review my answer and ask one follow-up.";
              (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { msg.textContent = "Copied. Paste it to your coach."; }, function () { msg.textContent = "Copy failed. Select the text manually."; });
            } }, "Copy for coach"),
            opts.onCoachAsk ? h("button", { type: "button", class: "sd-btn sd-btn-primary", onclick: function () {
              msg.textContent = "Asking…";
              Promise.resolve(opts.onCoachAsk({ session: rs.n, questionId: q.id, question: q.prompt, answer: ans.value })).then(function (r) { msg.textContent = typeof r === "string" ? r : (r && r.text) || ""; }, function () { msg.textContent = "Coach unavailable."; });
            } }, "Ask coach") : null), msg));
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

    /* ---------- lifecycle ---------- */
    var routing = opts.routing !== false;
    if (routing) window.addEventListener("hashchange", onHash);
    state.route = parseHash();
    derive();
    if (state.route.view === "lesson") onHash(); else render(false);

    return {
      update: function (next) {
        next = next || {};
        if (next.course) data.course = next.course;
        if (next.progress) data.progress = S.normalize(next.progress);
        if (next.today) data.today = next.today;
        if ("sync" in next) data.sync = next.sync;
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
      destroy: function () { window.removeEventListener("hashchange", onHash); document.removeEventListener("keydown", onKey); root.innerHTML = ""; root.classList.remove("sd-root"); }
    };
  }

  global.StudyDesk = { mount: mount, version: "2.0.0" };
})(typeof window !== "undefined" ? window : this);
