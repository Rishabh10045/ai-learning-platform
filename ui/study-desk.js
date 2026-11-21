/*
 * Study Desk: presentation layer (UI only).
 *
 * Renders a searchable day index, a lesson sidebar and six views from data the
 * host passes in. It does not fetch, store or schedule anything: progress and
 * note edits are reported through callbacks and the host decides what to keep.
 *
 *   const desk = StudyDesk.mount(rootEl, {
 *     curriculum, lessons, videos, progress,
 *     onProgressChange(change) {}, onNoteChange(day, text) {}, onCoachAsk(req) {}
 *   });
 *   desk.update({ progress });   // re-render with new data
 *   desk.navigate(3, "learn");   // same as setting location.hash = "#day-3/learn"
 *   desk.destroy();
 *
 * Data shapes are documented in ui/README.md.
 */
(function (global) {
  "use strict";

  var VIEWS = [
    { id: "plan", slug: "", label: "Session plan", icon: "▤" },
    { id: "learn", slug: "learn", label: "Videos & notes", icon: "▶" },
    { id: "practice", slug: "practice", label: "Practice", icon: "⌨" },
    { id: "revision", slug: "revision", label: "Quick revision", icon: "↺" },
    { id: "my-notes", slug: "my-notes", label: "My notes", icon: "✎" },
    { id: "coach", slug: "coach", label: "AI coach", icon: "◆" }
  ];
  var VIEW_BY_SLUG = {};
  VIEWS.forEach(function (v) { VIEW_BY_SLUG[v.slug] = v; });

  var STATUS = {
    "pending": { label: "Not started", icon: "○", cls: "sd-st-pending" },
    "in-progress": { label: "In progress", icon: "◐", cls: "sd-st-progress" },
    "complete": { label: "Complete", icon: "✓", cls: "sd-st-complete" }
  };
  var NEXT_STATUS = { "pending": "in-progress", "in-progress": "complete", "complete": "pending" };

  /* ---------- helpers ---------- */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, "");
        else el.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(typeof child === "object" ? child : document.createTextNode(String(child)));
  }
  function byKey(map, day) {
    if (!map) return undefined;
    return map[day] !== undefined ? map[day] : map[String(day)];
  }
  function normStatus(s) { return STATUS[s] ? s : "pending"; }
  function fmtMin(m) {
    if (m == null || isNaN(m)) return null;
    m = Math.round(m);
    if (m < 60) return m + " min";
    var hr = Math.floor(m / 60), r = m % 60;
    return hr + " h" + (r ? " " + r + " min" : "");
  }
  function badge(status, extra) {
    var s = STATUS[normStatus(status)];
    return h("span", { class: "sd-badge " + s.cls + (extra ? " " + extra : "") },
      h("span", { class: "sd-badge-ic", "aria-hidden": "true", text: s.icon }), s.label);
  }
  function safeUrl(u) {
    if (!u || typeof u !== "string") return null;
    var scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(u);
    return !scheme || /^https?$/i.test(scheme[1]) ? u : null; // relative paths or http(s) only
  }

  /* "2026-11-22" -> Date at UTC midnight (date-only, no time-zone drift) */
  function parseISODate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function fmtDate(dt, long) {
    if (!dt) return null;
    try {
      return dt.toLocaleDateString("en-IN", long ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
        : { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    } catch (e) { return dt.toISOString().slice(0, 10); }
  }
  /* "21:00" + minutes -> "9:00 PM" */
  function clock(start, addMin) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(start || "");
    if (!m) return null;
    var t = (+m[1] * 60 + +m[2] + (addMin || 0)) % 1440, hr = Math.floor(t / 60), mi = t % 60;
    return ((hr % 12) || 12) + ":" + (mi < 10 ? "0" : "") + mi + " " + (hr < 12 ? "AM" : "PM");
  }

  /* ---------- routing ---------- */

  function parseHash(hash) {
    var m = /^#day-(\d+)(?:\/([a-z-]+))?\/?$/.exec(hash || "");
    if (!m) return null;
    var view = VIEW_BY_SLUG[m[2] || ""];
    return { day: parseInt(m[1], 10), view: view ? view.id : "plan", validView: !!view };
  }
  function hashFor(day, viewId) {
    var v = VIEWS.filter(function (x) { return x.id === viewId; })[0] || VIEWS[0];
    return "#day-" + day + (v.slug ? "/" + v.slug : "");
  }

  /* ---------- mount ---------- */

  function mount(root, options) {
    if (!root) throw new Error("StudyDesk.mount: root element is required");
    var opts = Object.assign({ routing: true }, options || {});
    var data = { curriculum: opts.curriculum || { days: [] }, lessons: opts.lessons || {}, videos: opts.videos || {}, progress: opts.progress || { days: {} } };
    var state = { day: null, view: "plan", query: "", navOpen: false };
    var noteTimer = null;

    function days() { return (data.curriculum && data.curriculum.days) || []; }
    function tracks() { return (data.curriculum && data.curriculum.tracks) || []; }
    function trackOf(id) { return tracks().filter(function (t) { return t.id === id; })[0] || null; }
    function trackName(id, short) { var t = trackOf(id); return t ? (short && t.short) || t.name : id; }
    function dayDate(d) {
      if (d.date) return parseISODate(d.date);
      var start = parseISODate(data.curriculum && data.curriculum.startDate);
      var idx = days().indexOf(d);
      return start && idx >= 0 ? new Date(start.getTime() + idx * 86400000) : null;
    }
    function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
    function dayTracks(d) { return d.tracks || uniq((d.blocks || []).map(function (b) { return b.track; })); }
    function dayTopicIds(d) { return d.topicIds || uniq((d.blocks || []).map(function (b) { return b.topicId; })); }
    function findDay(n) { return days().filter(function (d) { return d.day === n; })[0]; }
    function dayProgress(n) { return byKey(data.progress && data.progress.days, n) || {}; }
    function dayStatus(d) {
      var p = dayProgress(d.day);
      if (p.status) return normStatus(p.status);
      var blocks = d.blocks || [];
      if (!blocks.length) return "pending";
      var st = blocks.map(function (b) { return normStatus((p.blocks || {})[b.id]); });
      if (st.every(function (s) { return s === "complete"; })) return "complete";
      if (st.some(function (s) { return s !== "pending"; })) return "in-progress";
      return "pending";
    }
    function defaultDay() {
      var list = days();
      if (!list.length) return null;
      var cur = data.progress && data.progress.currentDay;
      if (cur && findDay(cur)) return cur;
      var open = list.filter(function (d) { return dayStatus(d) !== "complete"; })[0];
      return (open || list[0]).day;
    }

    function emitProgress(change) {
      if (typeof opts.onProgressChange === "function") opts.onProgressChange(change);
    }

    /* skeleton */
    root.classList.add("sd-root");
    root.textContent = "";
    var skip = h("a", { class: "sd-skip", href: "#sd-main" , onclick: function (e) { e.preventDefault(); main.focus(); } }, "Skip to lesson");
    var navToggle = h("button", { class: "sd-navtoggle", type: "button", "aria-expanded": "false", "aria-controls": "sd-sidebar",
      onclick: function () { setNav(!state.navOpen); } }, h("span", { "aria-hidden": "true", text: "☰" }), " Days");
    var titleEl = h("div", { class: "sd-brand" });
    var overall = h("div", { class: "sd-overall" });
    var links = (opts.headerLinks || []).filter(function (l) { return l && l.label && safeUrl(l.href); });
    var linksEl = links.length ? h("nav", { class: "sd-toplinks", "aria-label": "Study Desk pages" },
      links.map(function (l) { return h("a", { class: "sd-toplink", href: l.href }, l.label); })) : null;
    var topbar = h("header", { class: "sd-topbar" }, navToggle, titleEl, linksEl, overall);

    var search = h("input", { type: "search", class: "sd-search", id: "sd-search", placeholder: "Search days, topics, IDs…", autocomplete: "off", "aria-describedby": "sd-search-count" });
    var searchCount = h("p", { class: "sd-search-count", id: "sd-search-count", "aria-live": "polite" });
    var dayList = h("ol", { class: "sd-daylist", "aria-label": "Days" });
    var sidebar = h("nav", { class: "sd-sidebar", id: "sd-sidebar", "aria-label": "Day index" },
      h("label", { class: "sd-search-label", for: "sd-search", text: "Find a day" }), search, searchCount, dayList);
    var scrim = h("div", { class: "sd-scrim", hidden: true, onclick: function () { setNav(false); } });
    var main = h("main", { class: "sd-main", id: "sd-main", tabindex: "-1" });
    root.appendChild(h("div", { class: "sd-shell" }, skip, topbar, h("div", { class: "sd-body" }, sidebar, scrim, main)));

    search.addEventListener("input", function () { state.query = search.value; renderDayList(); });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var first = dayList.querySelector("a.sd-daylink"); if (first) first.click(); }
      if (e.key === "ArrowDown") { var f = dayList.querySelector("a"); if (f) { e.preventDefault(); f.focus(); } }
    });
    dayList.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var links = Array.prototype.slice.call(dayList.querySelectorAll("a"));
      var i = links.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var next = links[i + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) next.focus(); else if (e.key === "ArrowUp") search.focus();
    });
    function onKey(e) { if (e.key === "Escape" && state.navOpen) { setNav(false); navToggle.focus(); } }
    document.addEventListener("keydown", onKey);

    function setNav(open) {
      state.navOpen = open;
      if (open) root.style.setProperty("--sd-drawer-top", Math.max(0, Math.round(topbar.getBoundingClientRect().bottom)) + "px");
      root.classList.toggle("sd-nav-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      scrim.hidden = !open;
      if (open) search.focus();
    }

    /* ---------- render: chrome ---------- */

    function renderChrome() {
      var c = data.curriculum || {};
      titleEl.textContent = "";
      append(titleEl, [h("span", { class: "sd-logo", "aria-hidden": "true", text: "◧" }),
        h("span", { class: "sd-brand-txt" }, h("strong", { text: c.title || "Study Desk" }), c.subtitle ? h("small", { text: c.subtitle }) : null)]);
      var list = days(), done = 0, prog = 0;
      list.forEach(function (d) { var s = dayStatus(d); if (s === "complete") done++; else if (s === "in-progress") prog++; });
      var pct = list.length ? Math.round(done * 100 / list.length) : 0;
      overall.textContent = "";
      append(overall, [
        h("span", { class: "sd-overall-txt" }, h("strong", { text: done + "/" + list.length }), h("span", { class: "sd-overall-words", text: " days complete" })),
        h("span", { class: "sd-meter", role: "progressbar", "aria-label": "Days complete", "aria-valuemin": "0", "aria-valuemax": String(list.length), "aria-valuenow": String(done) },
          h("span", { style: "width:" + pct + "%" }))
      ]);
    }

    function matches(d, q) {
      if (!q) return true;
      var hay = ["day " + d.day, "day-" + d.day, d.title, d.summary, dayTracks(d).map(function (t) { return t + " " + trackName(t); }).join(" "), dayTopicIds(d).join(" "), fmtDate(dayDate(d), true) || "",
        (d.blocks || []).map(function (b) { return b.title + " " + (b.topicId || ""); }).join(" ")].join(" ").toLowerCase();
      return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (t) { return hay.indexOf(t) >= 0; });
    }

    function renderDayList() {
      var list = days(), q = state.query.trim();
      dayList.textContent = "";
      var shown = 0;
      list.forEach(function (d) {
        if (!matches(d, q)) return;
        shown++;
        var st = dayStatus(d), active = d.day === state.day;
        var link = h("a", { class: "sd-daylink", href: hashFor(d.day, "plan"), "aria-current": active ? "page" : null, "data-day": d.day },
          h("span", { class: "sd-daynum " + STATUS[st].cls, "aria-hidden": "true" }, h("span", { text: STATUS[st].icon })),
          h("span", { class: "sd-daytxt" },
            h("span", { class: "sd-daylabel", text: "Day " + d.day + (dayDate(d) ? " · " + fmtDate(dayDate(d)) : "") }),
            h("span", { class: "sd-daytitle", text: d.title || "" })),
          h("span", { class: "sd-vh", text: ", " + STATUS[st].label }));
        var li = h("li", { class: "sd-dayitem" + (active ? " is-active" : "") }, link);
        if (active) {
          var sub = h("ul", { class: "sd-lessonnav", "aria-label": "Day " + d.day + " lesson sections" });
          VIEWS.forEach(function (v) {
            var cur = v.id === state.view;
            sub.appendChild(h("li", null, h("a", { href: hashFor(d.day, v.id), "aria-current": cur ? "page" : null, class: cur ? "is-current" : null },
              h("span", { class: "sd-lnic", "aria-hidden": "true", text: v.icon }), v.label)));
          });
          li.appendChild(sub);
        }
        dayList.appendChild(li);
      });
      searchCount.textContent = q ? (shown ? shown + " of " + list.length + " days match" : "No days match “" + q + "”") : list.length + " days";
      root.setAttribute("data-visible-days", String(shown));
    }

    /* ---------- render: main ---------- */

    function renderMain() {
      main.textContent = "";
      var d = state.day != null ? findDay(state.day) : null;
      if (!d) {
        main.setAttribute("data-view", "not-found");
        var first = days()[0];
        append(main, h("section", { class: "sd-empty" },
          h("h1", { text: days().length ? "Day " + state.day + " is not in this plan" : "No days in the plan yet" }),
          h("p", { text: days().length ? "The plan has " + days().length + " days." : "Waiting for curriculum data." }),
          first ? h("a", { class: "sd-btn sd-btn-primary", href: hashFor(first.day, "plan"), text: "Go to Day " + first.day }) : null));
        return;
      }
      main.setAttribute("data-view", state.view);
      main.setAttribute("data-day", String(d.day));
      var st = dayStatus(d), list = days(), idx = list.indexOf(d);
      var totalMin = (d.blocks || []).reduce(function (a, b) { return a + (b.minutes || 0); }, 0);

      var head = h("header", { class: "sd-dayhead" },
        h("div", { class: "sd-crumbs" },
          h("span", { text: "Day " + d.day + " of " + list.length }),
          dayDate(d) ? h("time", { class: "sd-date", datetime: dayDate(d).toISOString().slice(0, 10), text: fmtDate(dayDate(d), true) }) : null,
          dayTracks(d).map(function (t) { return h("span", { class: "sd-chip", title: trackName(t), text: trackName(t, true) }); })),
        h("div", { class: "sd-dayhead-row" },
          h("h1", { class: "sd-daytitle-main", text: d.title || "Day " + d.day }),
          badge(st, "sd-badge-lg")),
        h("p", { class: "sd-meta" },
          totalMin ? h("span", { text: "⏱ " + fmtMin(totalMin) + " planned" }) : null,
          data.curriculum.sessionWindow ? h("span", { text: "🕘 " + data.curriculum.sessionWindow }) : null,
          dayTopicIds(d).length ? h("span", null, "Topics: ", dayTopicIds(d).map(function (t) { return h("code", { text: t }); })) : null));

      var tabs = h("nav", { class: "sd-tabs", "aria-label": "Lesson views" });
      VIEWS.forEach(function (v) {
        var cur = v.id === state.view;
        tabs.appendChild(h("a", { class: "sd-tab" + (cur ? " is-current" : ""), href: hashFor(d.day, v.id), "aria-current": cur ? "page" : null, id: "sd-tab-" + v.id },
          h("span", { "aria-hidden": "true", text: v.icon }), " " + v.label));
      });

      var panel = h("section", { class: "sd-panel sd-view-" + state.view, "aria-labelledby": "sd-tab-" + state.view });
      var lesson = byKey(data.lessons, d.day) || {};
      ({ plan: viewPlan, learn: viewLearn, practice: viewPractice, revision: viewRevision, "my-notes": viewNotes, coach: viewCoach })[state.view](panel, d, lesson);

      var prev = list[idx - 1], next = list[idx + 1];
      var pager = h("nav", { class: "sd-pager", "aria-label": "Day navigation" },
        prev ? h("a", { class: "sd-btn", href: hashFor(prev.day, "plan") }, "← Day " + prev.day) : h("span"),
        next ? h("a", { class: "sd-btn", href: hashFor(next.day, "plan") }, "Day " + next.day + " →") : h("span"));

      append(main, [head, tabs, panel, pager]);
      var curTab = tabs.querySelector(".is-current");
      if (curTab && tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft = Math.max(0, curTab.offsetLeft - (tabs.clientWidth - curTab.offsetWidth) / 2);
    }

    function sectionTitle(text, sub) {
      return h("div", { class: "sd-sectitle" }, h("h2", { text: text }), sub ? h("p", { class: "sd-muted", text: sub }) : null);
    }
    function emptyNote(text) { return h("p", { class: "sd-emptynote", text: text }); }

    function statusButton(current, label, onChange) {
      var s = normStatus(current), nx = NEXT_STATUS[s];
      return h("button", { type: "button", class: "sd-stbtn " + STATUS[s].cls, "aria-label": label + ": " + STATUS[s].label + ". Activate to mark " + STATUS[nx].label.toLowerCase(),
        title: "Mark " + STATUS[nx].label.toLowerCase(), onclick: function () { onChange(nx); } },
        h("span", { "aria-hidden": "true", text: STATUS[s].icon }), h("span", { class: "sd-stbtn-txt", text: STATUS[s].label }));
    }

    /* Session plan */
    function viewPlan(panel, d, lesson) {
      var p = dayProgress(d.day), st = dayStatus(d);
      append(panel, sectionTitle("Session plan", d.summary || null));
      if (d.revisionOf != null) {
        var rd = findDay(d.revisionOf);
        append(panel, h("div", { class: "sd-callout sd-callout-rev" },
          h("strong", { text: "Start with a quick revision" }), " of Day " + d.revisionOf + (rd && rd.title ? ": " + rd.title : "") + ". ",
          h("a", { href: hashFor(d.revisionOf, "revision"), text: "Open Day " + d.revisionOf + " revision" })));
      }
      var ol = h("ol", { class: "sd-blocks" });
      var startAt = data.curriculum.sessionStart, elapsed = 0;
      (d.blocks || []).forEach(function (b, i) {
        var slot = startAt && b.minutes ? clock(startAt, elapsed) + "–" + clock(startAt, elapsed + b.minutes) : null;
        elapsed += b.minutes || 0;
        var course = b.track ? trackName(b.track) : (b.kind === "revision" ? "Quick revision" : null);
        var bs = normStatus((p.blocks || {})[b.id]);
        var href = b.kind === "revision" && i === 0 && d.revisionOf != null ? hashFor(d.revisionOf, "revision")
          : ({ learn: 1, practice: 1, revision: 1, coach: 1 }[b.kind] ? hashFor(d.day, b.kind) : null);
        ol.appendChild(h("li", { class: "sd-block " + STATUS[bs].cls },
          h("span", { class: "sd-block-idx", "aria-hidden": "true", text: String(i + 1) }),
          h("div", { class: "sd-block-body" },
            course ? h("div", { class: "sd-block-course" + (b.track ? " sd-trk-" + String(b.track).toLowerCase() : "") , text: course }) : null,
            h("div", { class: "sd-block-title" }, href ? h("a", { href: href, text: b.title }) : h("span", { text: b.title })),
            h("div", { class: "sd-block-meta" },
              slot ? h("span", { class: "sd-slot", text: "🕘 " + slot }) : null,
              b.minutes ? h("span", { text: fmtMin(b.minutes) }) : null,
              b.kind && !b.track ? h("span", { class: "sd-chip sd-chip-kind", text: b.kind }) : null,
              b.topicId ? h("code", { text: b.topicId }) : null)),
          statusButton(bs, b.title, function (nx) { emitProgress({ day: d.day, scope: "block", id: b.id, status: nx }); })));
      });
      if (!(d.blocks || []).length) append(panel, emptyNote("No blocks in this day's plan yet."));
      else {
        append(panel, ol);
        var win = data.curriculum.sessionStart && data.curriculum.sessionEnd ? (function () {
          var a = data.curriculum.sessionStart.split(":"), z = data.curriculum.sessionEnd.split(":");
          return ((+z[0] * 60 + +z[1]) - (+a[0] * 60 + +a[1]) + 1440) % 1440;
        })() : null;
        append(panel, h("p", { class: "sd-total" + (win && elapsed > win ? " sd-total-over" : "") },
          h("strong", { text: "Total " + fmtMin(elapsed) }),
          win ? (elapsed > win ? " · ⚠ " + fmtMin(elapsed - win) + " over the " + fmtMin(win) + " session" : " · fits the " + fmtMin(win) + " session") : null));
      }
      if ((lesson.objectives || []).length) {
        append(panel, h("div", { class: "sd-card" }, h("h3", { text: "By the end of this session you can" }),
          h("ul", { class: "sd-checklist" }, lesson.objectives.map(function (o) { return h("li", { text: o }); }))));
      }
      var actions = h("div", { class: "sd-dayactions", role: "group", "aria-label": "Day status" },
        h("span", { class: "sd-muted", text: "Day status:" }));
      ["pending", "in-progress", "complete"].forEach(function (s) {
        actions.appendChild(h("button", { type: "button", class: "sd-btn sd-statechoice " + STATUS[s].cls + (st === s ? " is-on" : ""), "aria-pressed": st === s ? "true" : "false",
          onclick: function () { emitProgress({ day: d.day, scope: "day", id: null, status: s }); } },
          h("span", { "aria-hidden": "true", text: STATUS[s].icon + " " }), STATUS[s].label));
      });
      append(panel, actions);
    }

    /* Videos & notes: video source + watch time first, then long-form notes */
    function viewLearn(panel, d, lesson) {
      var vids = byKey(data.videos, d.day) || [];
      var watch = vids.reduce(function (a, v) { return a + (v.suggestedWatchMin || 0); }, 0);
      append(panel, sectionTitle("Watch first", vids.length ? vids.length + " source" + (vids.length > 1 ? "s" : "") + (watch ? " · suggested " + fmtMin(watch) + " total" : "") : null));
      if (!vids.length) append(panel, emptyNote("No video or reading source attached to this day yet."));
      var grid = h("div", { class: "sd-videos" });
      vids.forEach(function (v) {
        var url = safeUrl(v.url);
        grid.appendChild(h("article", { class: "sd-video" },
          h("div", { class: "sd-video-top" },
            h("span", { class: "sd-source" }, h("span", { "aria-hidden": "true", text: v.kind === "article" ? "📄 " : "▶ " }), v.source || "Source"),
            v.suggestedWatchMin ? h("span", { class: "sd-watch" }, h("strong", { text: fmtMin(v.suggestedWatchMin) }), v.kind === "article" ? " suggested reading" : " suggested watch") : null),
          v.track ? h("p", { class: "sd-block-course sd-trk-" + String(v.track).toLowerCase(), text: trackName(v.track) }) : null,
          h("h3", { class: "sd-video-title", text: v.title || "Untitled" }),
          h("p", { class: "sd-video-meta" },
            v.channel ? h("span", { text: v.channel }) : null,
            v.durationMin ? h("span", { text: "Full length " + fmtMin(v.durationMin) }) : null,
            v.segment ? h("span", { text: "Watch " + v.segment }) : null),
          v.note ? h("p", { class: "sd-muted", text: v.note }) : null,
          url ? h("a", { class: "sd-btn sd-btn-primary", href: url, target: "_blank", rel: "noopener noreferrer" }, (v.kind === "article" ? "Open reading" : "Open video") + " ↗", h("span", { class: "sd-vh", text: " (opens in a new tab)" })) : null));
      });
      if (vids.length) append(panel, grid);

      append(panel, sectionTitle("Notes", "Long-form lesson notes"));
      var art = h("article", { class: "sd-notes" });
      renderBlocks(art, lesson.notes || []);
      if (!(lesson.notes || []).length) art.appendChild(emptyNote("Notes for this day haven't been added yet."));
      append(panel, art);
    }

    function renderBlocks(container, blocks) {
      blocks.forEach(function (b) {
        if (typeof b === "string") b = { type: "p", text: b };
        switch (b.type) {
          case "h": container.appendChild(h("h3", { text: b.text })); break;
          case "h4": container.appendChild(h("h4", { text: b.text })); break;
          case "ul": case "ol": container.appendChild(h(b.type, null, (b.items || []).map(function (it) { return h("li", { text: it }); }))); break;
          case "code": container.appendChild(h("pre", { class: "sd-code", "data-lang": b.lang || null, tabindex: "0" }, h("code", { text: b.text }))); break;
          case "callout": container.appendChild(h("div", { class: "sd-callout sd-callout-" + (b.tone || "info") }, b.text)); break;
          default: container.appendChild(h("p", { text: b.text || "" }));
        }
      });
    }

    /* Practice */
    function viewPractice(panel, d, lesson) {
      var items = lesson.practice || [], p = dayProgress(d.day);
      append(panel, sectionTitle("Practice", items.length ? "Write code yourself first, then paste it for review." : null));
      if (!items.length) { append(panel, emptyNote("No practice items for this day yet.")); return; }
      items.forEach(function (it) {
        var s = normStatus((p.practice || {})[it.id]), url = safeUrl(it.url);
        append(panel, h("article", { class: "sd-card sd-practice " + STATUS[s].cls },
          h("div", { class: "sd-practice-head" },
            h("h3", { text: it.title }),
            statusButton(s, it.title, function (nx) { emitProgress({ day: d.day, scope: "practice", id: it.id, status: nx }); })),
          h("p", { class: "sd-block-meta" },
            it.platform ? h("span", { text: it.platform }) : null,
            it.difficulty ? h("span", { class: "sd-chip", text: it.difficulty }) : null,
            it.minutes ? h("span", { text: fmtMin(it.minutes) }) : null),
          it.prompt ? h("p", { text: it.prompt }) : null,
          (it.acceptance || []).length ? h("div", null, h("h4", { text: "Acceptance criteria" }), h("ul", { class: "sd-checklist" }, it.acceptance.map(function (a) { return h("li", { text: a }); }))) : null,
          url ? h("a", { class: "sd-btn", href: url, target: "_blank", rel: "noopener noreferrer" }, "Open on " + (it.platform || "site") + " ↗", h("span", { class: "sd-vh", text: " (opens in a new tab)" })) : null));
      });
    }

    /* Quick revision: My notes first, suggested bullets second */
    function viewRevision(panel, d, lesson) {
      var notes = (dayProgress(d.day).notes || "").trim();
      append(panel, sectionTitle("Quick revision", "Your own notes come first."));
      var mine = h("section", { class: "sd-card sd-mynotes-card", "aria-labelledby": "sd-rev-mine" },
        h("div", { class: "sd-card-head" }, h("h3", { id: "sd-rev-mine", text: "✎ My notes" }), h("a", { href: hashFor(d.day, "my-notes"), text: notes ? "Edit" : "Write notes" })));
      if (notes) mine.appendChild(h("div", { class: "sd-notetext" }, notes.split(/\n+/).map(function (line) { return h("p", { text: line }); })));
      else mine.appendChild(emptyNote("You haven't written notes for this day. Writing a few lines in your own words helps more than re-reading."));
      append(panel, mine);
      var bullets = lesson.revision || [];
      append(panel, h("section", { class: "sd-card sd-suggested", "aria-labelledby": "sd-rev-sugg" },
        h("h3", { id: "sd-rev-sugg", text: "Suggested revision points" }),
        bullets.length ? h("ul", null, bullets.map(function (b) { return h("li", { text: b }); })) : emptyNote("No suggested points for this day.")));
    }

    /* My notes */
    function viewNotes(panel, d) {
      var current = dayProgress(d.day).notes || "";
      append(panel, sectionTitle("My notes", "Write in your own words. Hinglish is fine."));
      var status = h("p", { class: "sd-muted sd-savestate", "aria-live": "polite", text: typeof opts.onNoteChange === "function" ? "" : "Read-only preview: no host is listening for note changes." });
      var ta = h("textarea", { class: "sd-textarea", id: "sd-note-" + d.day, rows: "14", "aria-label": "My notes for Day " + d.day, placeholder: "What did you learn today? What is still unclear?" });
      ta.value = current;
      ta.addEventListener("input", function () {
        if (typeof opts.onNoteChange !== "function") return;
        status.textContent = "Typing…";
        clearTimeout(noteTimer);
        var val = ta.value, day = d.day;
        noteTimer = setTimeout(function () {
          var r = opts.onNoteChange(day, val);
          status.textContent = "Sent to host";
          if (r && typeof r.then === "function") r.then(function () { status.textContent = "Saved by host"; }, function () { status.textContent = "Host could not save"; });
        }, 400);
      });
      append(panel, [h("label", { class: "sd-vh", for: "sd-note-" + d.day, text: "My notes for Day " + d.day }), ta, status]);
    }

    /* AI coach */
    function viewCoach(panel, d, lesson) {
      var qs = lesson.coach || [];
      var notes = dayProgress(d.day).notes || "";
      append(panel, sectionTitle("AI coach", "One question at a time. Answer in your own words."));
      if (!qs.length) append(panel, emptyNote("No coach questions for this day yet."));
      qs.forEach(function (q, i) {
        var box = h("article", { class: "sd-card sd-coachq" },
          h("p", { class: "sd-muted", text: "Question " + (i + 1) + " of " + qs.length }),
          h("h3", { text: q.prompt }));
        var copyText = "Day " + d.day + ": " + (d.title || "") + "\nTopics: " + dayTopicIds(d).join(", ") + "\nQuestion: " + q.prompt + (notes ? "\nMy notes:\n" + notes : "") + "\nMy answer: ";
        var msg = h("span", { class: "sd-muted", "aria-live": "polite" });
        var row = h("div", { class: "sd-btnrow" },
          h("button", { type: "button", class: "sd-btn", onclick: function () {
            var done = function () { msg.textContent = "Copied"; }, fail = function () { msg.textContent = "Copy failed. Select the text manually."; };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(copyText).then(done, fail); else fail();
          } }, "Copy prompt for a chat coach"), msg);
        box.appendChild(row);
        if (typeof opts.onCoachAsk === "function") {
          var ans = h("textarea", { class: "sd-textarea", rows: "4", "aria-label": "Your answer to question " + (i + 1), placeholder: "Type your answer…" });
          var out = h("div", { class: "sd-coachout", "aria-live": "polite" });
          var ask = h("button", { type: "button", class: "sd-btn sd-btn-primary", onclick: function () {
            out.textContent = "Waiting for coach…";
            Promise.resolve(opts.onCoachAsk({ day: d.day, questionId: q.id, question: q.prompt, answer: ans.value })).then(function (r) {
              out.textContent = typeof r === "string" ? r : (r && r.text) || "";
            }, function () { out.textContent = "Coach is unavailable right now."; });
          } }, "Get feedback");
          append(box, [ans, h("div", { class: "sd-btnrow" }, ask), out]);
        }
        append(panel, box);
      });
      if (typeof opts.onCoachAsk !== "function") append(panel, h("p", { class: "sd-muted sd-small", text: "No AI coach is connected to this page. Use the copy button and paste the prompt into your chat coach." }));
    }

    /* ---------- routing glue ---------- */

    function applyRoute(r) {
      if (!r) { state.day = defaultDay(); state.view = "plan"; }
      else { state.day = r.day; state.view = r.view; }
      renderAll();
      setNav(false);
    }
    function onHash() {
      var r = parseHash(location.hash);
      applyRoute(r);
      if (r) main.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    function renderAll() { renderChrome(); renderDayList(); renderMain(); updateTitle(); }
    function updateTitle() {
      var d = findDay(state.day), v = VIEWS.filter(function (x) { return x.id === state.view; })[0];
      if (opts.setDocumentTitle !== false) document.title = (d ? "Day " + d.day + " · " + v.label + " · " : "") + ((data.curriculum && data.curriculum.title) || "Study Desk");
    }

    if (opts.routing) {
      window.addEventListener("hashchange", onHash);
      var initial = parseHash(location.hash);
      if (!initial && days().length) { var dd = defaultDay(); history.replaceState(null, "", hashFor(dd, "plan")); initial = parseHash(location.hash); }
      applyRoute(initial);
    } else {
      applyRoute({ day: opts.initialDay || defaultDay(), view: opts.initialView || "plan" });
    }

    return {
      update: function (next) {
        ["curriculum", "lessons", "videos", "progress"].forEach(function (k) { if (next && next[k] !== undefined) data[k] = next[k]; });
        var a = document.activeElement, activeId = a && root.contains(a) && a.id;
        var sel = activeId && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null;
        var y = window.scrollY;
        renderAll();
        var b = activeId && document.getElementById(activeId);
        if (b) { b.focus({ preventScroll: true }); if (sel && b.setSelectionRange) b.setSelectionRange(sel[0], sel[1]); }
        window.scrollTo(0, y);
      },
      navigate: function (day, view) {
        if (opts.routing) location.hash = hashFor(day, view || "plan");
        else applyRoute({ day: day, view: view || "plan" });
      },
      getRoute: function () { return { day: state.day, view: state.view }; },
      destroy: function () {
        window.removeEventListener("hashchange", onHash);
        document.removeEventListener("keydown", onKey);
        clearTimeout(noteTimer);
        root.textContent = "";
        root.classList.remove("sd-root", "sd-nav-open");
      }
    };
  }

  global.StudyDesk = { mount: mount, VIEWS: VIEWS.map(function (v) { return { id: v.id, slug: v.slug, label: v.label }; }), parseHash: parseHash, hashFor: hashFor, STATUSES: Object.keys(STATUS) };
})(window);
