/*
 * Coverage check v3.
 *  1. Does every session resolve to real lessons, and is every lesson scheduled? (engine validator)
 *  2. Plan warnings: time budget per slot, duplicate scheduling.
 *  3. Is every topic of the reference checklist (ui/reference/topics.reference.js) taught somewhere?
 *     Missing subjects and topics show in red (QA M14): "57/57 lessons scheduled" alone said nothing
 *     about SQL, Redis or Kafka being absent.
 * StudyDeskCoverage.mount(root, { course, reference, deskHref }) / .analyze(course) / .analyzeReference(course, reference)
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
      (s.modules || []).forEach(function (m) { (m.lessons || []).forEach(function (l) {
        if (l.source && l.source.kind === "added") added++; else gfg++;
        lessons.push({ id: l.id, title: l.title, module: m.title, source: l.source, sessions: res.scheduled[l.id] || [] });
      }); });
      return { id: s.id, title: s.title, dsa: !!s.dsa, lessons: lessons, gfg: gfg, added: added, unscheduled: lessons.filter(function (l) { return !l.sessions.length; }).length };
    });
    return { sessions: res.count, ok: res.ok, errors: res.errors, warnings: res.warnings || [], unscheduled: res.unscheduled, subjects: subjects, lessonCount: idx.order.length };
  }

  function lessonText(l) {
    var parts = [l.title || ""];
    (l.notes || []).forEach(function (b) { if (typeof b === "string") parts.push(b); else { if (b.text) parts.push(b.text); (b.items || []).forEach(function (x) { parts.push(x); }); } });
    (l.revision || []).forEach(function (x) { parts.push(x); });
    return parts.join(" \n ");
  }
  // A reference topic is covered by lesson.covers[] (exact id) or by a keyword in a lesson of the matching course subject(s).
  // If the course has no subject matching a reference subject, the subject is "missing" and all lessons are searched.
  function analyzeReference(course, ref) {
    var subjects = (course && course.subjects) || [], out = [], total = 0, covered = 0, missingSubjects = 0;
    var all = [];
    subjects.forEach(function (s) { (s.modules || []).forEach(function (m) { (m.lessons || []).forEach(function (l) { all.push({ s: s, l: l, text: lessonText(l) }); }); }); });
    ((ref && ref.subjects) || []).forEach(function (rs) {
      var re = new RegExp(rs.match, "i");
      var own = all.filter(function (x) { return re.test(x.s.title || "") || re.test(x.s.id || ""); });
      var hasSubject = own.length > 0, pool = hasSubject ? own : all;
      var topics = rs.topics.map(function (t) {
        var kw = new RegExp(t[2], "i"), by = [];
        all.forEach(function (x) { if ((x.l.covers || []).indexOf(t[0]) >= 0) by.push(x.l.id); });
        pool.forEach(function (x) { if (by.indexOf(x.l.id) < 0 && kw.test(x.text)) by.push(x.l.id); });
        return { id: t[0], title: t[1], lessons: by, covered: by.length > 0 };
      });
      var c = topics.filter(function (t) { return t.covered; }).length;
      total += topics.length; covered += c;
      var status = !hasSubject && !c ? "missing" : c === topics.length ? "complete" : "partial";
      if (status === "missing") missingSubjects++;
      out.push({ id: rs.id, title: rs.title, hasSubject: hasSubject, status: status, covered: c, total: topics.length, topics: topics });
    });
    return { title: ref && ref.title, subjects: out, covered: covered, total: total, missingSubjects: missingSubjects, ok: total > 0 && covered === total };
  }

  function mount(root, opts) {
    var a = analyze(opts.course), desk = opts.deskHref || "index.html", ref = opts.reference ? analyzeReference(opts.course, opts.reference) : null;
    root.classList.add("sd-root"); root.innerHTML = "";
    var main = h("main", { class: "sd-main", id: "sd-main", style: "margin:0 auto" });
    main.appendChild(h("header", { class: "sd-hero" }, h("p", { class: "sd-eyebrow", text: "Coverage check" + (opts.course.fixture ? " · example fixture" : "") }),
      h("h1", { text: a.ok ? "All " + a.sessions + " sessions resolve to real lessons" : a.errors.length + " problem(s) in the curriculum" }),
      h("div", { class: "sd-hero-meta" },
        h("span", { class: "sd-badge " + (a.ok ? "is-complete" : "is-off"), text: (a.ok ? "✓ " : "✗ ") + a.sessions + " sessions" }),
        h("span", { class: "sd-badge " + (a.unscheduled.length ? "is-progress" : "is-complete"), text: (a.lessonCount - a.unscheduled.length) + "/" + a.lessonCount + " lessons scheduled" }),
        h("span", { class: "sd-badge " + (a.warnings.length ? "is-progress" : "is-complete"), id: "cov-warn-badge", text: a.warnings.length ? "⚠ " + a.warnings.length + " plan warning(s)" : "✓ every session fits its time slots" }),
        ref ? h("span", { class: "sd-badge " + (ref.ok ? "is-complete" : "is-off"), id: "cov-ref-badge", text: (ref.ok ? "✓ " : "✗ ") + ref.covered + "/" + ref.total + " reference topics" + (ref.missingSubjects ? " · " + ref.missingSubjects + " subject(s) missing" : "") }) : null,
        h("a", { href: desk, class: "sd-link", text: "Back to Study Desk ▸" }))));
    if (a.errors.length) main.appendChild(h("section", { class: "sd-card sd-offcard", id: "cov-errors" }, h("h2", { text: "Problems" }), h("ul", null, a.errors.map(function (e) { return h("li", { text: e }); }))));
    if (a.warnings.length) main.appendChild(h("section", { class: "sd-card", id: "cov-warnings" }, h("h2", { text: "Plan warnings" }), h("ul", null, a.warnings.map(function (e) { return h("li", { text: e }); }))));
    if (ref) {
      var sec = h("section", { class: "sd-card", id: "cov-reference" }, h("div", { class: "sd-card-h" }, h("h2", { text: "Reference topics: is everything taught?" }),
        h("span", { class: "sd-muted", text: ref.covered + "/" + ref.total + " covered" })),
        h("p", { class: "sd-muted", text: "Checklist from GfG's public syllabi and common Java backend interview topics (not curriculum content). A topic counts when a lesson lists it in covers[] or mentions it in its title, notes or revision points. Red = not taught anywhere." }));
      ref.subjects.forEach(function (rs) {
        var tb = h("tbody");
        rs.topics.forEach(function (t) {
          tb.appendChild(h("tr", { class: t.covered ? "" : "cov-miss" }, h("td", { text: t.title }), h("td", null, t.covered ? t.lessons.slice(0, 6).map(function (id, i) { return [i ? ", " : "", h("code", { text: id })]; }) : h("strong", { text: "✗ Missing" }))));
        });
        sec.appendChild(h("div", { class: "cov-refsubj cov-" + rs.status, "data-ref": rs.id },
          h("h3", null, rs.title + " · " + rs.covered + "/" + rs.total + " ", h("span", { class: "sd-badge " + (rs.status === "complete" ? "is-complete" : rs.status === "missing" ? "is-off" : "is-progress"), text: rs.status === "missing" ? "✗ Subject missing" : rs.status === "complete" ? "✓ Covered" : "Partly covered" + (rs.hasSubject ? "" : " (no own subject)") })),
          h("div", { style: "overflow-x:auto" }, h("table", { class: "cov-table" }, h("thead", null, h("tr", null, ["Topic", "Lessons"].map(function (x) { return h("th", { text: x }); }))), tb))));
      });
      main.appendChild(sec);
    }
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
    return { analysis: a, reference: ref };
  }
  global.StudyDeskCoverage = { mount: mount, analyze: analyze, analyzeReference: analyzeReference };
})(typeof window !== "undefined" ? window : this);
