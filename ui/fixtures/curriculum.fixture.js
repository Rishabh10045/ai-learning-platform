/*
 * EXAMPLE DATA ONLY: UI fixture for the Study Desk presentation layer.
 * Not the real curriculum. Codex's curriculum.js replaces this when it lands.
 *
 * - The UI derives the day count from days.length; nothing assumes a fixed total.
 * - Calendar dates: a day's own `date` wins; otherwise startDate + (day - 1).
 *   Pushing dates forward for skipped days is the host's job.
 * - Each day has one topic block per course track (4 tracks), plus a quick revision of the
 *   previous day from Day 2 onward. Every day adds up to 120 min (9:00–11:00 PM).
 * - tracks[].syllabus lists each course's topics. A few are deliberately NOT scheduled
 *   so that coverage.html has something to report.
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
(function () {
  var tracks = [
    { id: "HLD", name: "System Design (HLD)", short: "HLD", syllabus: [
      { id: "H-REQUEST-01", title: "Request lifecycle: DNS, TCP, TLS, HTTP" },
      { id: "H-ESTIMATE-01", title: "Back-of-the-envelope estimates" },
      { id: "H-SCALE-01", title: "Vertical vs horizontal scaling" },
      { id: "H-LB-01", title: "Load balancers" },
      { id: "H-CACHE-01", title: "Caching strategies" },
      { id: "H-DB-01", title: "SQL vs NoSQL, replication" },
      { id: "H-QUEUE-01", title: "Message queues" },
      { id: "H-CAP-01", title: "CAP theorem and consistency models" }
    ] },
    { id: "DSA", name: "DSA", short: "DSA", syllabus: [
      { id: "D-COMPLEX-01", title: "Time and space complexity (Big-O)" },
      { id: "D-ARRAY-01", title: "Arrays and two pointers" },
      { id: "D-HASHING-01", title: "Hashing and frequency maps" },
      { id: "D-SLIDING-01", title: "Sliding window" },
      { id: "D-STACK-01", title: "Stacks and queues" },
      { id: "D-LIST-01", title: "Linked lists" },
      { id: "D-TREE-01", title: "Binary trees and traversals" },
      { id: "D-GRAPH-01", title: "Graphs: BFS and DFS" }
    ] },
    { id: "JAVA", name: "Java · Multithreading · Spring Boot (+ Spring AI)", short: "Java/Spring", syllabus: [
      { id: "J-OOP-01", title: "OOP, encapsulation and object state" },
      { id: "J-COLL-01", title: "Collections, equals and hashCode" },
      { id: "J-EXC-01", title: "Exceptions and error handling" },
      { id: "J-CONC-01", title: "Threads and race conditions" },
      { id: "J-CONC-02", title: "synchronized, locks and volatile" },
      { id: "B-SPRING-01", title: "Spring Boot REST basics" },
      { id: "J-EXEC-01", title: "Executors and CompletableFuture" },
      { id: "B-SPRINGAI-01", title: "Spring AI: ChatClient basics" }
    ] },
    { id: "AI", name: "GenAI / LLM", short: "GenAI", syllabus: [
      { id: "AI-FOUND-01", title: "What an LLM is and how it predicts" },
      { id: "AI-TOKENS-01", title: "Tokens and context windows" },
      { id: "AI-PROMPT-01", title: "Prompt engineering basics" },
      { id: "AI-EMBED-01", title: "Embeddings and similarity" },
      { id: "AI-RAG-01", title: "Retrieval-augmented generation (RAG)" },
      { id: "AI-EVAL-01", title: "Hallucinations and evaluation" },
      { id: "AI-AGENTS-01", title: "Tool use and agents" },
      { id: "AI-FINETUNE-01", title: "Fine-tuning vs RAG" }
    ] }
  ];
  var byId = {};
  tracks.forEach(function (t) { t.syllabus.forEach(function (s) { byId[s.id] = { track: t.id, title: s.title }; }); });

  // [day title, HLD topic, DSA topic, Java topic, AI topic]
  var plan = [
    ["Foundations across all four courses", "H-REQUEST-01", "D-COMPLEX-01", "J-OOP-01", "AI-FOUND-01"],
    ["Estimates, arrays and collections", "H-ESTIMATE-01", "D-ARRAY-01", "J-COLL-01", "AI-TOKENS-01"],
    ["Scaling, hashing and exceptions", "H-SCALE-01", "D-HASHING-01", "J-EXC-01", "AI-PROMPT-01"],
    ["Load balancers, sliding window and threads", "H-LB-01", "D-SLIDING-01", "J-CONC-01", "AI-EMBED-01"],
    ["Caching, stacks and locking", "H-CACHE-01", "D-STACK-01", "J-CONC-02", "AI-RAG-01"],
    ["Databases, linked lists and Spring Boot", "H-DB-01", "D-LIST-01", "B-SPRING-01", "AI-EVAL-01"]
  ];

  var days = plan.map(function (row, i) {
    var day = i + 1, blocks = [];
    var each = day === 1 ? 30 : 27; // Day 1: 4 × 30 = 120; later days: 12 + 4 × 27 = 120
    if (day > 1) blocks.push({ id: "d" + day + "-rev", kind: "revision", title: "Quick revision of Day " + (day - 1), minutes: 12 });
    row.slice(1).forEach(function (topicId) {
      var t = byId[topicId];
      blocks.push({ id: "d" + day + "-" + t.track.toLowerCase(), kind: "learn", track: t.track, topicId: topicId, title: t.title, minutes: each });
    });
    return { day: day, title: row[0], summary: "Example day: one topic from each of the four courses.", revisionOf: day > 1 ? day - 1 : undefined, blocks: blocks };
  });

  window.STUDY_DESK_FIXTURES.curriculum = {
    title: "Study Desk (example fixture)",
    subtitle: "Sample plan used to preview the UI",
    startDate: "2026-11-22",
    timeZone: "Asia/Kolkata",
    sessionStart: "21:00",
    sessionEnd: "23:00",
    sessionWindow: "9:00–11:00 PM IST",
    tracks: tracks,
    days: days
  };
})();
