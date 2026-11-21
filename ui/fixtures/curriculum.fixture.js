/*
 * EXAMPLE DATA ONLY: UI fixture for the Study Desk presentation layer.
 * Not the real curriculum. Codex's curriculum.js replaces this when it lands.
 * The UI derives the day count from days.length; nothing assumes a fixed total.
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.curriculum = {
  title: "Study Desk (example fixture)",
  subtitle: "Sample plan used to preview the UI",
  sessionWindow: "9:00–11:00 PM IST",
  days: [
    {
      day: 1, title: "Objects, state and the first invariant",
      tracks: ["J", "L"], topicIds: ["J-OOP-01", "L-INVARIANTS-01"],
      summary: "Example day: model a seat with valid state transitions and keep rules inside the object.",
      blocks: [
        { id: "d1-b1", kind: "learn", title: "Watch + read: encapsulation and state", topicId: "J-OOP-01", minutes: 40 },
        { id: "d1-b2", kind: "practice", title: "LAB-1.1 Seat booking model", topicId: "L-INVARIANTS-01", minutes: 45 },
        { id: "d1-b3", kind: "revision", title: "Write your own notes", minutes: 15 },
        { id: "d1-b4", kind: "coach", title: "Two interview-style questions", minutes: 20 }
      ]
    },
    {
      day: 2, title: "HTTP request lifecycle",
      tracks: ["H", "B"], topicIds: ["H-REQUEST-01", "B-HTTP-01"],
      summary: "Example day: what happens between typing a URL and seeing a response.",
      revisionOf: 1,
      blocks: [
        { id: "d2-b0", kind: "revision", title: "Quick revision of Day 1", minutes: 12 },
        { id: "d2-b1", kind: "learn", title: "Watch + read: DNS, TCP, TLS, HTTP", topicId: "H-REQUEST-01", minutes: 45 },
        { id: "d2-b2", kind: "practice", title: "Trace a request with curl -v", topicId: "B-HTTP-01", minutes: 40 },
        { id: "d2-b3", kind: "coach", title: "Explain it back", minutes: 20 }
      ]
    },
    {
      day: 3, title: "Hashing and HashMap internals",
      tracks: ["D", "J"], topicIds: ["D-HASHING-01", "J-COLL-02"],
      summary: "Example day: buckets, collisions, equals/hashCode contract.",
      revisionOf: 2,
      blocks: [
        { id: "d3-b0", kind: "revision", title: "Quick revision of Day 2", minutes: 10 },
        { id: "d3-b1", kind: "learn", title: "Watch + read: hashing", topicId: "D-HASHING-01", minutes: 40 },
        { id: "d3-b2", kind: "practice", title: "Two Sum + frequency map", topicId: "D-HASHING-01", minutes: 50 },
        { id: "d3-b3", kind: "coach", title: "Mock question", minutes: 20 }
      ]
    },
    {
      day: 4, title: "Threads and the check-then-act race",
      tracks: ["J"], topicIds: ["J-CONC-01"],
      summary: "Example day: why two threads can book the same seat, and how locks fix it.",
      revisionOf: 3,
      blocks: [
        { id: "d4-b0", kind: "revision", title: "Quick revision of Day 3", minutes: 10 },
        { id: "d4-b1", kind: "learn", title: "Watch + read: threads, races", topicId: "J-CONC-01", minutes: 45 },
        { id: "d4-b2", kind: "practice", title: "Reproduce and fix a race", topicId: "J-CONC-01", minutes: 45 }
      ]
    },
    {
      day: 5, title: "GenAI foundations: tokens and prompts",
      tracks: ["AI"], topicIds: ["AI-FOUNDATIONS-01"],
      summary: "Example day: what an LLM predicts, tokens, context windows.",
      revisionOf: 4,
      blocks: [
        { id: "d5-b0", kind: "revision", title: "Quick revision of Day 4", minutes: 10 },
        { id: "d5-b1", kind: "learn", title: "Read: Generative AI for Beginners, lesson 1", topicId: "AI-FOUNDATIONS-01", minutes: 50 },
        { id: "d5-b2", kind: "practice", title: "Token counting exercise", topicId: "AI-FOUNDATIONS-01", minutes: 30 }
      ]
    },
    {
      day: 6, title: "SQL basics and constraints",
      tracks: ["B"], topicIds: ["B-SQL-01", "B-CONSTRAINTS-01"],
      summary: "Example day: SELECT, JOIN and letting the database enforce invariants.",
      revisionOf: 5,
      blocks: [
        { id: "d6-b0", kind: "revision", title: "Quick revision of Day 5", minutes: 10 },
        { id: "d6-b1", kind: "learn", title: "Read: PostgreSQL tutorial basics", topicId: "B-SQL-01", minutes: 45 },
        { id: "d6-b2", kind: "practice", title: "HackerRank SQL warm-ups", topicId: "B-SQL-01", minutes: 45 }
      ]
    }
  ]
};
