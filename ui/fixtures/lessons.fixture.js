/*
 * EXAMPLE DATA ONLY: short sample lesson text so every view has something to render.
 * Codex's lesson-content.js supplies the real long-form notes.
 * Keyed by day number. Note blocks are rendered as text (never as raw HTML).
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.lessons = {
  "1": {
    objectives: [
      "HLD: describe what happens between typing a URL and seeing a page",
      "DSA: state the Big-O of a loop, a nested loop and a hash lookup",
      "Java: keep a rule (invariant) inside the class that owns the data",
      "GenAI: explain in one sentence what an LLM predicts"
    ],
    notes: [
      { type: "h", text: "System Design: the request lifecycle" },
      { type: "p", text: "Example text. The browser resolves the domain with DNS, opens a TCP connection, negotiates TLS, then sends an HTTP request. The server returns a status code, headers and a body." },
      { type: "ol", items: ["DNS lookup", "TCP handshake", "TLS handshake", "HTTP request/response"] },
      { type: "h", text: "DSA: time and space complexity" },
      { type: "p", text: "Example text. Big-O describes how work grows with input size. One loop over n items is O(n); a loop inside a loop is O(n²); a HashMap lookup is O(1) on average." },
      { type: "h", text: "Java: encapsulation and object state" },
      { type: "p", text: "Example text. An object's state is the current values of its fields. Make fields private and expose methods like book(userId) so the class can refuse invalid transitions." },
      { type: "code", lang: "java", text: "public void book(String userId) {\n  if (status != SeatStatus.AVAILABLE) throw new IllegalStateException(\"already booked\");\n  status = SeatStatus.BOOKED;\n  ownerId = userId;\n}" },
      { type: "h", text: "GenAI: what an LLM is" },
      { type: "p", text: "Example text. A large language model predicts the next token given the tokens so far. Everything else (chat, code, summaries) is built on that one ability." },
      { type: "callout", tone: "tip", text: "Example tip: explain each topic out loud in two sentences before moving on." }
    ],
    revision: ["DNS → TCP → TLS → HTTP", "Nested loop over n = O(n²)", "Private fields + intent-revealing methods", "LLM = next-token predictor"],
    practice: [
      { id: "d1-dsa", title: "Example: count pairs in O(n²), then think about O(n)", platform: "Any judge", difficulty: "Easy", minutes: 15, prompt: "Write the brute-force version first and state its Big-O." },
      { id: "d1-java", title: "Example: Seat with a guarded book() method", platform: "Local Java (JDK 17/21)", difficulty: "Easy", minutes: 15,
        prompt: "book() must only work from AVAILABLE.", acceptance: ["Booking twice throws IllegalStateException", "No public setter for status"] }
    ],
    coach: [
      { id: "q1", prompt: "Walk me through what happens after you press Enter on a URL." },
      { id: "q2", prompt: "Why should the 'one owner per booked seat' rule live in Seat?" }
    ]
  },
  "2": {
    notes: [ { type: "p", text: "Example text for Day 2." } ],
    revision: ["Example revision point"],
    practice: [],
    coach: []
  }
};
