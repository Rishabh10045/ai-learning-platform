/*
 * Study Desk: coverage check (UI only).
 * Reads the same curriculum input as StudyDesk and reports, per course track:
 *   - every syllabus topic and the day(s) that cover it
 *   - syllabus topics not scheduled on any day
 *   - scheduled topics that are not in that track's syllabus list
 *
 *   StudyDeskCoverage.mount(rootEl, { curriculum, deskHref: "index.html" });
 *   StudyDeskCoverage.analyze(curriculum)  // returns the same result as plain data
 */
(function (global) {
  "use strict";

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v; else if (k === "text") el.textContent = v; else el.setAttribute(k, String(v));
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { add(el, x); });
    el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  }
  function parseISODate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  function fmtDate(dt) { try { return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }); } catch (e) { return dt.toISOString().slice(0, 10); } }

  function analyze(curriculum) {
    var c = curriculum || {}, days = c.days || [], tracks = c.tracks || [];
    var start = parseISODate(c.startDate);
    var dateOf = function (d, i) { var dt = d.date ? parseISODate(d.date) : (start ? new Date(start.getTime() + i * 86400000) : null); return dt ? fmtDate(dt) : null; };
    var where = {}; // topicId -> [{day, date, track, title}]
    days.forEach(function (d, i) {
      (d.blocks || []).forEach(function (b) {
        if (!b.topicId) return;
        (where[b.topicId] = where[b.topicId] || []).push({ day: d.day, date: dateOf(d, i), track: b.track || null, title: b.title || "" });
      });
    });
    var inSyllabus = {};
    var result = tracks.map(function (t) {
      var topics = (t.syllabus || []).map(function (s) {
        inSyllabus[s.id] = t.id;
        return { id: s.id, title: s.title || s.id, days: where[s.id] || [] };
      });
      var extra = [];
      Object.keys(where).forEach(function (id) {
        if (where[id].some(function (w) { return w.track === t.id; }) && !(t.syllabus || []).some(function (s) { return s.id === id; }))
          extra.push({ id: id, title: where[id][0].title, days: where[id] });
      });
      return { id: t.id, name: t.name || t.id, topics: topics,
        scheduled: topics.filter(function (x) { return x.days.length; }), unscheduled: topics.filter(function (x) { return !x.days.length; }), extra: extra };
    });
    var untracked = Object.keys(where).filter(function (id) { return !inSyllabus[id] && !where[id].some(function (w) { return tracks.some(function (t) { return t.id === w.track; }); }); })
      .map(function (id) { return { id: id, title: where[id][0].title, days: where[id] }; });
    return { dayCount: days.length, tracks: result, untracked: untracked };
  }

  function mount(root, opts) {
    opts = opts || {};
    var desk = opts.deskHref || "index.html";
    var r = analyze(opts.curriculum);
    var total = 0, sched = 0;
    r.tracks.forEach(function (t) { total += t.topics.length; sched += t.scheduled.length; });
    root.classList.add("sd-root");
    root.textContent = "";
    var dayLink = function (w) { return h("a", { href: desk + "#day-" + w.day, text: "Day " + w.day + (w.date ? " · " + w.date : "") }); };
    var joinLinks = function (ws) { var out = []; ws.forEach(function (w, i) { if (i) out.push(", "); out.push(dayLink(w)); }); return out; };

    var wrap = h("main", { class: "cv-wrap", id: "cv-main" },
      h("p", { class: "sd-muted" }, h("a", { href: desk, text: "← Back to Study Desk" })),
      h("h1", { class: "sd-daytitle-main", text: "Coverage check" }),
      h("p", { class: "sd-muted", text: "Compares each course's syllabus list with the topics scheduled across all " + r.dayCount + " days of the plan." }),
      h("div", { class: "cv-summary" },
        h("div", { class: "cv-stat", "data-stat": "tracks" }, h("strong", { text: String(r.tracks.length) }), h("span", { text: "course tracks" })),
        h("div", { class: "cv-stat", "data-stat": "scheduled" }, h("strong", { text: sched + "/" + total }), h("span", { text: "syllabus topics scheduled" })),
        h("div", { class: "cv-stat", "data-stat": "unscheduled" }, h("strong", { text: String(total - sched) }), h("span", { text: "not scheduled on any day" })),
        h("div", { class: "cv-stat", "data-stat": "days" }, h("strong", { text: String(r.dayCount) }), h("span", { text: "days in the plan" }))));

    if (!r.tracks.length) add(wrap, h("p", { class: "sd-emptynote", text: "This curriculum has no tracks[].syllabus lists, so coverage can't be checked yet." }));

    r.tracks.forEach(function (t) {
      var sec = h("section", { class: "cv-track", id: "track-" + t.id, "data-track": t.id, "aria-labelledby": "cv-h-" + t.id },
        h("h2", { id: "cv-h-" + t.id, text: t.name }),
        h("p", { class: "sd-muted", text: t.scheduled.length + " of " + t.topics.length + " syllabus topics scheduled" }));
      var tbody = h("tbody");
      t.topics.forEach(function (x) {
        tbody.appendChild(h("tr", { "data-topic": x.id, "data-covered": x.days.length ? "yes" : "no" },
          h("td", null, h("code", { text: x.id })),
          h("td", { text: x.title }),
          h("td", null, x.days.length ? joinLinks(x.days) : h("span", { class: "sd-muted", text: "—" })),
          h("td", null, x.days.length ? h("span", { class: "cv-ok", text: "✓ Scheduled" }) : h("span", { class: "cv-miss", text: "⚠ Not scheduled" }))));
      });
      add(sec, h("div", { class: "cv-table-wrap" }, h("table", { class: "cv-table" },
        h("caption", { class: "sd-vh", text: t.name + " syllabus coverage" }),
        h("thead", null, h("tr", null, h("th", { scope: "col", text: "ID" }), h("th", { scope: "col", text: "Topic" }), h("th", { scope: "col", text: "Covered on" }), h("th", { scope: "col", text: "Status" }))),
        tbody)));
      if (t.unscheduled.length) add(sec, h("div", { class: "cv-gap", "data-gap": t.id },
        h("h3", { text: "Not scheduled on any day (" + t.unscheduled.length + ")" }),
        h("ul", null, t.unscheduled.map(function (x) { return h("li", null, h("code", { text: x.id }), " " + x.title); }))));
      else add(sec, h("p", { class: "cv-allgood", text: "✓ Every syllabus topic in this track is scheduled." }));
      if (t.extra.length) add(sec, h("div", { class: "cv-gap" },
        h("h3", { text: "Scheduled but not in this track's syllabus list (" + t.extra.length + ")" }),
        h("ul", null, t.extra.map(function (x) { return h("li", null, h("code", { text: x.id }), " " + x.title + " · ", joinLinks(x.days)); }))));
      add(wrap, sec);
    });
    if (r.untracked.length) add(wrap, h("section", { class: "cv-track" }, h("h2", { text: "Scheduled topics without a track" }),
      h("ul", null, r.untracked.map(function (x) { return h("li", null, h("code", { text: x.id }), " " + x.title + " · ", joinLinks(x.days)); }))));

    // "Not scheduled" roll-up across all tracks
    var all = [];
    r.tracks.forEach(function (t) { t.unscheduled.forEach(function (x) { all.push({ t: t, x: x }); }); });
    add(wrap, h("section", { class: "cv-track", id: "unscheduled", "aria-labelledby": "cv-h-all" },
      h("h2", { id: "cv-h-all", text: "All unscheduled topics (" + all.length + ")" }),
      all.length ? h("ul", null, all.map(function (a) { return h("li", null, h("strong", { text: a.t.name + ": " }), h("code", { text: a.x.id }), " " + a.x.title); }))
        : h("p", { class: "cv-allgood", text: "✓ Every syllabus topic is scheduled." })));
    root.appendChild(wrap);
    return r;
  }

  global.StudyDeskCoverage = { mount: mount, analyze: analyze };
})(window);
