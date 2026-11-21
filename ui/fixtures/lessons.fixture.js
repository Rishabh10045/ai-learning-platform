/*
 * EXAMPLE DATA ONLY: short sample lesson text so every view has something to render.
 * Codex's lesson-content.js supplies the real long-form notes.
 * Keyed by day number. Note blocks are rendered as text (never as raw HTML).
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.lessons = {
  "1": {
    objectives: ["Explain object state in your own words", "Keep a rule (invariant) inside the class that owns the data", "Separate Seat responsibilities from BookingService responsibilities"],
    notes: [
      { type: "h", text: "1. What “state” means" },
      { type: "p", text: "An object's state is the current values of its fields. A Seat can be AVAILABLE or BOOKED, and when it is BOOKED it must also know who booked it. Example text: the real lesson will be much longer." },
      { type: "h", text: "2. Encapsulation protects the invariant" },
      { type: "p", text: "If any class can set seat.status = BOOKED directly, nothing guarantees an owner is recorded. Make fields private and expose intent-revealing methods such as book(userId) and release(userId)." },
      { type: "code", lang: "java", text: "public final class Seat {\n  private SeatStatus status = SeatStatus.AVAILABLE;\n  private String ownerId;\n\n  public void book(String userId) {\n    if (status != SeatStatus.AVAILABLE) throw new IllegalStateException(\"already booked\");\n    status = SeatStatus.BOOKED;\n    ownerId = userId;\n  }\n}" },
      { type: "callout", tone: "tip", text: "Interview tip: say the invariant out loud before writing code." },
      { type: "ul", items: ["Seat: owns status and owner, enforces valid transitions", "BookingService: finds the seat, calls book(), records the booking", "Neither class reaches into the other's fields"] }
    ],
    revision: ["State = current field values", "Invariant: BOOKED ⇒ owner present", "Only Seat changes Seat's status", "Throw on invalid transitions; don't silently ignore"],
    practice: [
      { id: "lab-1-1", title: "LAB-1.1 Seat booking model", platform: "Local Java (JDK 17/21)", difficulty: "Easy", minutes: 45,
        prompt: "Implement Seat and BookingService so a seat can only be booked from AVAILABLE and released only by its owner.",
        acceptance: ["book() on a BOOKED seat throws IllegalStateException", "release() by a non-owner throws", "Fields are private; no public setters for status"],
        url: null }
    ],
    coach: [
      { id: "q1", prompt: "Why should the 'one owner per booked seat' rule live in Seat rather than BookingService?" },
      { id: "q2", prompt: "What breaks if status has a public setter? Give one concrete bug." }
    ]
  },
  "2": {
    objectives: ["Walk through DNS → TCP → TLS → HTTP", "Read a curl -v trace"],
    notes: [
      { type: "h", text: "The request lifecycle" },
      { type: "p", text: "Example text. The browser resolves the domain with DNS, opens a TCP connection, negotiates TLS, then sends an HTTP request. The server returns a status code, headers and a body." },
      { type: "ol", items: ["DNS lookup", "TCP handshake", "TLS handshake", "HTTP request/response", "Rendering"] }
    ],
    revision: ["DNS maps name → IP", "TLS adds encryption + server identity", "Status codes: 2xx ok, 4xx client, 5xx server"],
    practice: [
      { id: "curl-trace", title: "Trace a request with curl -v", platform: "Terminal", difficulty: "Easy", minutes: 20,
        prompt: "Run curl -v https://example.com and label each phase of the output.", acceptance: ["Identify the TLS handshake lines", "Identify request vs response headers"] },
      { id: "hr-java-1", title: "Example: HackerRank Java warm-up", platform: "HackerRank", difficulty: "Easy", minutes: 20,
        prompt: "Example placeholder: availability to be verified before assigning.", url: "https://www.hackerrank.com/domains/java" }
    ],
    coach: [ { id: "q1", prompt: "Explain what happens after you press Enter on a URL, in under two minutes." } ]
  },
  "3": {
    notes: [ { type: "p", text: "Example text about buckets, hash codes and collisions." } ],
    revision: ["equals ⇒ same hashCode", "Average O(1), worst case O(n) / O(log n) with treeified buckets"],
    practice: [ { id: "two-sum", title: "Two Sum with a HashMap", platform: "Any judge", difficulty: "Easy", minutes: 25, prompt: "Return indices of two numbers adding to target in O(n)." } ],
    coach: []
  }
};
