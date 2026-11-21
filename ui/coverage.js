/*
 * Coverage check v2: does every session resolve to real lessons, and is every lesson scheduled?
 * StudyDeskCoverage.mount(root, { course, deskHref }) / StudyDeskCoverage.analyze(course)
 * Needs ui/engine/schedule-engine.js.
 */
(function (global) {
  "use strict";
  var S = global.StudyDeskSchedule;
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { var v = attrs[k]; if (v == null) return; if (k === "text") el.textContent = v; else if (k === "class") el.className = v; else el.setAttribute(k, v); });
    for (var i = 2; i < arguments.length; i++) (function add(c) { if (c == null || c === false) return; if (Array.isArray(c)) return c.forEach(add); el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c); })(arguments[i]);
    return el;
  }
  function analyze(course) {
    var idx = S.indexCourse(course), res = S.resolveSessions(course, idx);
    var subjects = idx.subjects.map(function (s) {
      var lessons = [], gfg = 0, added = 0;
      s.modules.forEach(function (m) { m.lessons.forEach(function (l) {
        if (l.source && l.source.kind === "added") added++; else gfg++;
        lessons.push({ id: l.id, title: l.title, module: m.title, source: l.source, sessions: res.scheduled[l.id] || [] });
      }); });
      return { id: s.id, title: s.title, dsa: !!s.dsa, lessons: lessons, gfg: gfg, added: added, unscheduled: lessons.filter(function (l) { return !l.sessions.length; }).length };
    });
    return { sessions: res.count, ok: res.ok, errors: res.errors, unscheduled: res.unscheduled, subjects: subjects, lessonCount: idx.order.length };
  }
  function mount(root, opts) {
    var a = analyze(opts.course), desk = opts.deskHref || "index.html";
    root.classList.add("sd-root"); root.innerHTML = "";
    var main = h("main", { class: "sd-main", id: "sd-main", style: "margin:0 auto" });
    main.appendChild(h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Coverage check" + (opts.course.fixture ? " · example fixture" : "") }),
      h("h1", { text: a.ok ? "All " + a.sessions + " sessions resolve to real lessons" : a.errors.length + " problem(s) in the curriculum" }),
      h("div", { class: "sd-hero-meta" },
        h("span", { class: "sd-badge " + (a.ok ? "is-complete" : "is-off"), text: (a.ok ? "✓ " : "✗ ") + a.sessions + " sessions" }),
        h("span", { class: "sd-badge " + (a.unscheduled.length ? "is-progress" : "is-complete"), text: (a.lessonCount - a.unscheduled.length) + "/" + a.lessonCount + " lessons scheduled" }),
        h("a", { href: desk, class: "sd-link", text: "Back to Study Desk ▸" }))));
    if (a.errors.length) main.appendChild(h("section", { class: "sd-card sd-offcard", id: "cov-errors" }, h("h2", { text: "Problems" }), h("ul", null, a.errors.map(function (e) { return h("li", { text: e }); }))));
    a.subjects.forEach(function (s) {
      var tb = h("tbody");
      s.lessons.forEach(function (l) {
        tb.appendChild(h("tr", { class: l.sessions.length ? "" : "cov-miss" },
          h("td", null, h("code", { text: l.id })), h("td", { text: l.title }), h("td", { text: l.module }),
          h("td", null, h("span", { class: "sd-chip " + (l.source && l.source.kind === "added" ? "sd-chip-added" : "sd-chip-gfg"), text: l.source && l.source.kind === "added" ? "source: added" : "GfG · " + ((l.source && l.source.ref) || "") })),
          h("td", null, l.sessions.length ? l.sessions.map(function (n, i) { return [i ? ", " : "", h("a", { href: desk + "#day-" + n, text: "S" + n })]; }) : h("strong", { text: "Not scheduled" }))));
      });
      main.appendChild(h("section", { class: "sd-card" }, h("div", { class: "sd-card-h" }, h("h2", { text: s.title + (s.dsa ? " (daily)" : "") }),
        h("span", { class: "sd-muted", text: s.lessons.length + " lessons · " + s.gfg + " GfG · " + s.added + " added · " + s.unscheduled + " unscheduled" })),
        h("div", { style: "overflow-x:auto" }, h("table", { class: "cov-table" }, h("thead", null, h("tr", null, ["ID", "Lesson", "Module", "Source", "Sessions"].map(function (t) { return h("th", { text: t }); }))), tb))));
    });
    root.appendChild(main);
    return a;
  }
  global.StudyDeskCoverage = { mount: mount, analyze: analyze };
})(typeof window !== "undefined" ? window : this);
