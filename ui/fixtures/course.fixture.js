/*
 * EXAMPLE DATA ONLY: subject-first course fixture for the Study Desk UI and schedule engine.
 * This is NOT GPT/Codex's 54-session curriculum (gpt/curriculum 5047d3f was not on GitHub
 * when this was written). It exists so the UI and engine can be built and tested.
 * Codex's curriculum replaces it through the same shape (see ui/README.md, "Course contract v2").
 *
 * Shape: subjects[] -> modules[] -> lessons[] (stable IDs), sessions[] reference lesson IDs.
 * Order: Java core -> Streams/APIs -> Concurrency -> SQL & JDBC -> Spring Boot -> LLD -> HLD -> GenAI.
 * DSA in Java is its own subject (dsa: true) and every session has one DSA problem set.
 * Structure (QA 2026-11-21 fixes): one main lesson per session so lesson + practice fit the 78-min slot and
 * each DSA set fits 30 min; prerequisites in order (generics before collections, SQL/JDBC before JPA,
 * HTTP before REST, LLM basics before Spring AI). Titles of the added example lessons are placeholders,
 * not curriculum content.
 * source.kind "gfg" = mapped to a GfG course module (mapping here is illustrative);
 * source.kind "added" = supplementary content that is not in the GfG syllabus.
 * Video links are YouTube *search* links, not picked videos.
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
(function () {
  function yt(q) { return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q); }
  var GFG = {
    java: "GfG Java Backend Development (example mapping)",
    dsa: "GfG DSA in Java (example mapping)",
    sd: "GfG System Design: LLD + HLD (example mapping)",
    ai: "GfG Generative AI / LLMs (example mapping)"
  };
  // Lesson row: [id, title, source ("gfg:<course>:<ref>" | "added"), minutes, summary, revision[], quiz [q, options, answerIndex], diagram nodes?]
  function lesson(row, extra) {
    var src = row[2] === "added" ? { kind: "added", note: "Supplementary: not in the GfG syllabus" }
      : { kind: "gfg", course: GFG[row[2].split(":")[1]], ref: row[2].split(":").slice(2).join(":") };
    var l = {
      id: row[0], title: row[1], source: src, estMinutes: row[3],
      videos: [{ id: row[0] + "-v1", title: row[1] + " (pick one explainer)", source: "YouTube", channel: "Search results", url: null,
        durationMin: Math.round(row[3] * 0.6), suggestedWatchMin: Math.round(row[3] * 0.35), segment: "Any 20–30 min explainer", kind: "video" }],
      notes: [
        { type: "h", text: row[1] },
        { type: "p", text: "Example notes. " + row[4] },
        { type: "callout", tone: "tip", text: "Explain the idea out loud in two sentences before you start the practice." }
      ],
      revision: row[5],
      practice: [{ id: row[0] + "-p1", title: "Practice: " + row[1], platform: "Local Java (JDK 21)", difficulty: "Easy", minutes: 25,
        prompt: "Example task. Write a small program that demonstrates: " + row[1] + ".", acceptance: ["Compiles and runs", "You can explain each line"],
        evidenceRequired: true }],
      coach: [{ id: row[0] + "-c1", prompt: "Interview check: explain " + row[1] + " and give one real use." }]
    };
    if (row[6]) l.quiz = { passPct: 100, questions: [{ id: "q1", q: row[6][0], options: row[6][1], answer: row[6][2] }] };
    if (row[7]) l.diagram = { title: row[1], nodes: row[7] };
    return Object.assign(l, extra || {});
  }
  function test(title, qs) { return { title: title, passPct: 70, questions: qs.map(function (q, i) { return { id: "t" + (i + 1), q: q[0], options: q[1], answer: q[2] }; }) }; }
  var tf = ["True", "False"];

  var subjects = [
    { id: "java-core", title: "Java core", short: "Java", color: "#c2571a", modules: [
      { id: "jc-basics", title: "Foundations & OOP", lessons: [
        lesson(["JC-01", "Java foundations: JDK, JVM, compile and run", "gfg:java:Module 1", 12, "javac turns .java into bytecode; the JVM loads, verifies and runs it.", ["JDK = tools + JRE", "JVM runs bytecode"], ["The JVM executes Java source code directly.", tf, 1], ["Hello.java", "javac", "Hello.class", "JVM", "Output"]], { practice: [] }),
        lesson(["JC-02", "Types, operators and control flow", "gfg:java:Module 1", 40, "Primitives vs references, switch expressions and loops.", ["int/long/double are primitives", "String is a reference type"], ["Which is a primitive?", ["String", "int", "Integer"], 1]]),
        lesson(["JC-03", "Classes, objects and encapsulation", "gfg:java:Module 2", 45, "Private state, constructors and intent-revealing methods.", ["Keep fields private", "Guard state changes in methods"], ["Encapsulation mainly protects…", ["object state", "speed", "memory"], 0], ["Client", "public method", "invariant check", "private field"]]),
        lesson(["JC-04", "Inheritance, interfaces and polymorphism", "gfg:java:Module 2", 45, "Program to interfaces; override vs overload.", ["Prefer composition", "Interfaces define contracts"], ["Overriding is resolved at…", ["compile time", "run time"], 1]])
      ], test: test("Foundations & OOP test", [["A class can implement many interfaces.", tf, 0], ["Private fields are visible to subclasses.", tf, 1], ["javac produces…", ["bytecode", "machine code"], 0]]) },
      { id: "jc-collections", title: "Collections & exceptions", lessons: [
        lesson(["JC-07", "Generics: bounded types, wildcards and PECS", "gfg:java:Module 3", 40, "Type parameters, bounded types, ? extends / ? super, type erasure.", ["Producer extends, consumer super"], ["List<? extends Number> lets you add an Integer.", tf, 1]]),
        lesson(["JC-05", "Collections: List, Set, Map", "gfg:java:Module 3", 45, "ArrayList vs LinkedList, HashMap internals, iteration.", ["HashMap: buckets + equals/hashCode", "ArrayList: O(1) get"], ["HashMap lookup is on average…", ["O(1)", "O(n)", "O(log n)"], 0], ["key", "hashCode()", "bucket", "equals()", "value"]]),
        lesson(["JC-06", "equals/hashCode and exceptions", "gfg:java:Module 3", 40, "The equals/hashCode contract; checked vs unchecked exceptions.", ["Equal objects -> equal hashCodes", "Checked = must handle"], ["IllegalStateException is…", ["checked", "unchecked"], 1]])
      ], test: test("Collections test", [["Two equal objects must have equal hashCodes.", tf, 0], ["TreeMap keeps keys sorted.", tf, 0], ["ArrayList.get(i) is…", ["O(1)", "O(n)"], 0]]) }
    ] },
    { id: "streams-apis", title: "Streams & APIs", short: "Streams", color: "#7a4cc2", modules: [
      { id: "sa-functional", title: "Lambdas & streams", lessons: [
        lesson(["SA-01", "Lambdas and functional interfaces", "gfg:java:Module 4", 40, "Function, Predicate, Supplier, Consumer and method references.", ["Lambda = instance of a functional interface"], ["A functional interface has exactly one…", ["abstract method", "field"], 0]]),
        lesson(["SA-02", "Stream pipelines: map, filter, reduce", "gfg:java:Module 4", 45, "Source -> intermediate ops (lazy) -> terminal op.", ["Streams are lazy until a terminal op"], ["filter() is a terminal operation.", tf, 1], ["List", "stream()", "filter", "map", "collect"]]),
        lesson(["SA-03", "Collectors, grouping and Optional", "gfg:java:Module 4", 40, "groupingBy, partitioningBy, toMap; Optional instead of null.", ["groupingBy -> Map<K, List<V>>"], ["Optional helps avoid…", ["null checks", "loops"], 0]])
      ] },
      { id: "sa-apis", title: "Useful Java APIs", lessons: [
        lesson(["SA-04", "java.time and the HTTP client", "added", 40, "LocalDate/ZonedDateTime and java.net.http.HttpClient for calling APIs.", ["Use ZoneId.of(\"Asia/Kolkata\")"], ["LocalDate stores a time zone.", tf, 1]])
      ], test: test("Streams & APIs test", [["Streams are lazy.", tf, 0], ["Collectors.groupingBy returns a Map.", tf, 0], ["map() is terminal.", tf, 1]]) }
    ] },
    { id: "concurrency", title: "Concurrency", short: "Concurrency", color: "#1f7a8c", modules: [
      { id: "cc-threads", title: "Threads & synchronization", lessons: [
        lesson(["CC-01", "Threads, Runnable and the thread lifecycle", "gfg:java:Module 5", 40, "NEW -> RUNNABLE -> BLOCKED/WAITING -> TERMINATED.", ["start() not run()"], ["Calling run() starts a new thread.", tf, 1], ["NEW", "RUNNABLE", "WAITING", "TERMINATED"]]),
        lesson(["CC-02", "Race conditions, synchronized and volatile", "gfg:java:Module 5", 45, "Visibility vs atomicity; intrinsic locks.", ["volatile = visibility, not atomicity"], ["volatile makes count++ atomic.", tf, 1]]),
        lesson(["CC-03", "Executors, thread pools and Futures", "gfg:java:Module 5", 40, "ExecutorService, sizing pools, Future.get().", ["Always shut down executors"], ["Executors reuse threads.", tf, 0]])
      ] },
      { id: "cc-advanced", title: "Locks & async", lessons: [
        lesson(["CC-04", "Locks, atomics and concurrent collections", "gfg:java:Module 6", 40, "ReentrantLock, AtomicInteger, ConcurrentHashMap.", ["CAS powers atomics"], ["ConcurrentHashMap allows concurrent reads.", tf, 0]]),
        lesson(["CC-05", "CompletableFuture pipelines", "gfg:java:Module 6", 40, "thenApply, thenCompose, allOf, exception handling.", ["thenCompose flattens"], ["thenCompose is used for dependent async calls.", tf, 0]])
      ], test: test("Concurrency test", [["synchronized gives mutual exclusion.", tf, 0], ["volatile guarantees atomic increments.", tf, 1], ["A thread pool reuses threads.", tf, 0]]) }
    ] },
    { id: "databases", title: "SQL & JDBC", short: "SQL", color: "#6b5a1e", modules: [
      { id: "db-sql", title: "SQL essentials", lessons: [
        lesson(["DB-01", "SQL: joins, grouping and window functions", "gfg:java:MySQL", 45, "INNER/LEFT joins, GROUP BY/HAVING, ROW_NUMBER and RANK.", ["WHERE filters rows, HAVING filters groups"], ["HAVING filters groups after GROUP BY.", tf, 0]]),
        lesson(["DB-02", "Indexes, transactions and isolation levels", "gfg:java:MySQL", 45, "B-tree and composite indexes, ACID, read phenomena per isolation level.", ["Composite index: leftmost prefix"], ["READ COMMITTED prevents dirty reads.", tf, 0]])
      ], test: test("SQL test", [["A composite index (a, b) helps a query filtering only on b.", tf, 1], ["Transactions are atomic.", tf, 0]]) },
      { id: "db-jdbc", title: "JDBC", lessons: [
        lesson(["DB-03", "JDBC, PreparedStatement and connection pools", "gfg:java:JDBC", 40, "Connection, PreparedStatement (no SQL injection), HikariCP.", ["Always use PreparedStatement"], ["PreparedStatement helps prevent SQL injection.", tf, 0]])
      ] }
    ] },
    { id: "spring-boot", title: "Spring Boot", short: "Spring", color: "#2e8b57", modules: [
      { id: "sb-rest", title: "REST APIs", lessons: [
        lesson(["SB-01", "Spring core: IoC, DI and Boot auto-configuration", "gfg:java:Module 7", 40, "Beans, @Component, constructor injection, starters.", ["Prefer constructor injection"], ["Spring creates and wires beans.", tf, 0], ["@SpringBootApplication", "component scan", "beans", "auto-config", "app ready"]]),
        lesson(["SB-09", "HTTP for APIs: methods, status codes and idempotency", "added", 40, "GET/POST/PUT/PATCH/DELETE, 2xx/4xx/5xx, safe vs idempotent methods.", ["PUT is idempotent, POST is not"], ["PUT requests are idempotent.", tf, 0]]),
        lesson(["SB-02", "REST controllers, validation and errors", "gfg:java:Module 7", 45, "@RestController, DTOs, @Valid, @ControllerAdvice.", ["Return DTOs, not entities"], ["@ControllerAdvice handles exceptions globally.", tf, 0]])
      ], test: test("REST test", [["@RestController = @Controller + @ResponseBody.", tf, 0], ["Field injection is preferred.", tf, 1]]) },
      { id: "sb-persistence", title: "Persistence (JPA)", lessons: [
        lesson(["SB-03", "JPA entities and repositories", "gfg:java:Module 8", 45, "@Entity, relationships, Spring Data repositories.", ["Lazy loading + N+1"], ["Spring Data derives queries from method names.", tf, 0]]),
        lesson(["SB-04", "Transactions and query performance", "gfg:java:Module 8", 40, "@Transactional boundaries, fetch joins, pagination.", ["@Transactional on service layer"], ["@Transactional works on private methods.", tf, 1]])
      ] },
      { id: "sb-testing", title: "Testing", lessons: [
        lesson(["SB-05", "JUnit 5, Mockito and slice tests", "gfg:java:Module 9", 45, "Unit tests, @WebMvcTest, @DataJpaTest, Testcontainers.", ["Test behaviour, not implementation"], ["@WebMvcTest loads the full app context.", tf, 1]])
      ] },
      { id: "sb-security", title: "Security & OAuth", lessons: [
        lesson(["SB-06", "Spring Security filter chain and JWT", "gfg:java:Module 10", 45, "SecurityFilterChain, authentication vs authorization, stateless JWT.", ["AuthN = who, AuthZ = what"], ["JWTs are encrypted by default.", tf, 1], ["Request", "Filter chain", "Authentication", "Authorization", "Controller"]]),
        lesson(["SB-07", "Google OAuth2 login", "gfg:java:Module 10", 40, "spring-boot-starter-oauth2-client, redirect flow, user mapping.", ["Authorization code flow"], ["OAuth2 login uses the authorization code flow.", tf, 0]])
      ], test: test("Security test", [["Authorization decides what a user can do.", tf, 0], ["OAuth2 sends the user's Google password to your app.", tf, 1]]) },
      { id: "sb-ai", title: "Spring AI introduction", lessons: [
        lesson(["SB-10", "LLM basics for Spring developers: tokens, context and prompts", "added", 40, "What a model call costs (tokens), context limits, system vs user prompts.", ["Tokens drive cost and latency"], ["Longer prompts use more tokens.", tf, 0]]),
        lesson(["SB-08", "Spring AI: ChatClient, prompts and models", "gfg:java:Spring Boot with AI", 45, "ChatClient, prompt templates, structured output.", ["ChatClient wraps the model API"], ["Spring AI can map model output to Java records.", tf, 0]])
      ] }
    ] },
    { id: "lld", title: "Low-level design", short: "LLD", color: "#b0413e", modules: [
      { id: "lld-principles", title: "Principles & patterns", lessons: [
        lesson(["LLD-01", "SOLID principles", "gfg:sd:LLD Module 1", 45, "Single responsibility through dependency inversion.", ["S-O-L-I-D"], ["The O in SOLID is…", ["Open/closed", "Object"], 0]]),
        lesson(["LLD-02", "Creational patterns", "gfg:sd:LLD Module 2", 40, "Factory, Builder, Singleton (and when not to).", ["Builder for many optional params"], ["Builder suits objects with many optional fields.", tf, 0]]),
        lesson(["LLD-03", "Structural and behavioral patterns", "gfg:sd:LLD Module 2", 45, "Strategy, Observer, Decorator, Adapter.", ["Strategy = swap algorithms"], ["Observer notifies subscribers of changes.", tf, 0]])
      ] },
      { id: "lld-cases", title: "Case studies", lessons: [
        lesson(["LLD-04", "Case study: parking lot", "gfg:sd:LLD Case studies", 50, "Requirements -> entities -> relationships -> APIs -> concurrency.", ["Start from use cases"], ["Start an LLD round by clarifying requirements.", tf, 0], ["Requirements", "Entities", "Relations", "APIs", "Edge cases"]])
      ], test: test("LLD test", [["Strategy pattern swaps behaviour at run time.", tf, 0], ["Singletons are always a good idea.", tf, 1]]) }
    ] },
    { id: "hld", title: "High-level design", short: "HLD", color: "#33658a", modules: [
      { id: "hld-basics", title: "Building blocks", lessons: [
        lesson(["HLD-01", "Request lifecycle and estimates", "gfg:sd:HLD Module 1", 40, "DNS, TCP, TLS, HTTP; back-of-the-envelope numbers.", ["DNS -> TCP -> TLS -> HTTP"], ["DNS maps names to IP addresses.", tf, 0], ["Browser", "DNS", "Load balancer", "App", "DB"]]),
        lesson(["HLD-02", "Scaling, load balancing and caching", "gfg:sd:HLD Module 2", 45, "Vertical vs horizontal, L4/L7, cache-aside.", ["Cache-aside: read DB on miss"], ["Horizontal scaling adds more machines.", tf, 0]]),
        lesson(["HLD-03", "Databases: replication and sharding", "gfg:sd:HLD Module 3", 45, "Leader-follower, partition keys, consistency.", ["Shard by a high-cardinality key"], ["Replication improves read availability.", tf, 0]]),
        lesson(["HLD-04", "Queues, CAP and consistency", "gfg:sd:HLD Module 3", 40, "Async processing, at-least-once, CAP trade-offs.", ["CAP: pick C or A under partition"], ["Under a partition you can keep both C and A.", tf, 1]])
      ] },
      { id: "hld-cases", title: "Case studies", lessons: [
        lesson(["HLD-05", "Design a URL shortener", "gfg:sd:HLD Case studies", 50, "IDs, storage, redirects, caching, analytics.", ["Base62 IDs", "Cache hot links"], ["301 redirects can be cached by browsers.", tf, 0]])
      ], test: test("HLD test", [["A CDN reduces latency for static content.", tf, 0], ["Sharding means copying all data to every node.", tf, 1]]) }
    ] },
    { id: "genai", title: "GenAI & LLMs", short: "GenAI", color: "#8a5a00", modules: [
      { id: "gen-llm", title: "LLM foundations", lessons: [
        lesson(["GEN-01", "How LLMs work: tokens and context", "gfg:ai:Module 1", 40, "Next-token prediction, tokenization, context windows, temperature.", ["LLM = next-token predictor"], ["Temperature 0 makes output more deterministic.", tf, 0]]),
        lesson(["GEN-02", "Prompt engineering", "gfg:ai:Module 2", 40, "Instructions, examples, structured output.", ["Give examples + format"], ["Few-shot prompts include examples.", tf, 0]])
      ] },
      { id: "gen-apps", title: "Building LLM apps", lessons: [
        lesson(["GEN-03", "Embeddings and vector search", "gfg:ai:Module 3", 40, "Vectors, cosine similarity, vector stores.", ["Similar meaning -> close vectors"], ["Embeddings turn text into vectors.", tf, 0]]),
        lesson(["GEN-04", "RAG with Spring AI", "gfg:ai:Module 4", 50, "Chunk, embed, retrieve, augment, generate.", ["Retrieve then generate"], ["RAG retrieves context before generating.", tf, 0], ["Docs", "Chunk", "Embed", "Vector store", "Retrieve", "LLM"]]),
        lesson(["GEN-05", "Evals and guardrails", "added", 40, "Golden sets, LLM-as-judge, prompt injection.", ["Measure before tuning"], ["Prompt injection is a security risk.", tf, 0]])
      ], test: test("GenAI test", [["RAG needs a retrieval step.", tf, 0], ["Embeddings are always 2-dimensional.", tf, 1]]) }
    ] }
  ];

  // DSA in Java: its own subject, one problem set per session.
  var dsaRows = [
    ["DSA-01", "Big-O and complexity drills", "Basics"], ["DSA-02", "Arrays and two pointers", "Basics"], ["DSA-03", "Hashing and frequency maps", "Basics"],
    ["DSA-04", "Sliding window", "Basics"], ["DSA-05", "Prefix sums", "Basics"], ["DSA-06", "Binary search", "Searching & sorting"],
    ["DSA-07", "Sorting: merge and quick sort", "Searching & sorting"], ["DSA-08", "Recursion and backtracking", "Recursion"],
    ["DSA-09", "Stacks and monotonic stack", "Linear structures"], ["DSA-10", "Queues and deques", "Linear structures"], ["DSA-11", "Linked lists", "Linear structures"],
    ["DSA-12", "Binary trees: traversals", "Trees & graphs"], ["DSA-13", "Binary search trees", "Trees & graphs"], ["DSA-14", "Heaps and priority queues", "Trees & graphs"],
    ["DSA-15", "Graphs: BFS and DFS", "Trees & graphs"], ["DSA-16", "Topological sort and shortest paths", "Trees & graphs"],
    ["DSA-17", "Dynamic programming: 1D", "Dynamic programming"], ["DSA-18", "Dynamic programming: 2D", "Dynamic programming"],
    ["DSA-19", "Greedy algorithms", "Dynamic programming"], ["DSA-20", "Tries and mixed revision", "Trees & graphs"]
  ];
  // Example problem-set titles so every session has its own DSA set (placeholders, not a curated list).
  var dsaMore = [
    ["DSA-21", "Strings: palindromes and anagrams", "Basics"], ["DSA-22", "Matrix traversal", "Basics"], ["DSA-23", "Bit manipulation", "Basics"],
    ["DSA-24", "Math: GCD, primes, modular arithmetic", "Basics"], ["DSA-25", "Binary search on the answer", "Searching & sorting"],
    ["DSA-26", "Intervals: merge and insert", "Searching & sorting"], ["DSA-27", "Cyclic sort", "Searching & sorting"],
    ["DSA-28", "Fast and slow pointers", "Linear structures"], ["DSA-29", "Tree DP, diameter and LCA", "Trees & graphs"],
    ["DSA-30", "Top-K and k-way merge", "Trees & graphs"], ["DSA-31", "Two heaps: running median", "Trees & graphs"],
    ["DSA-32", "Union-Find (DSU)", "Trees & graphs"], ["DSA-33", "Dijkstra and minimum spanning trees", "Trees & graphs"],
    ["DSA-34", "Knapsack and partition DP", "Dynamic programming"], ["DSA-35", "LIS, LCS and edit distance", "Dynamic programming"],
    ["DSA-36", "Design data structures: LRU, LFU, min-stack", "Design"],
    ["DSA-37", "Timed mixed set 1", "Timed mixed sets"], ["DSA-38", "Timed mixed set 2", "Timed mixed sets"], ["DSA-39", "Timed mixed set 3", "Timed mixed sets"],
    ["DSA-40", "Timed mixed set 4", "Timed mixed sets"], ["DSA-41", "Timed mixed set 5", "Timed mixed sets"], ["DSA-42", "Timed mixed set 6", "Timed mixed sets"]
  ];
  var byId = {}; dsaRows.concat(dsaMore).forEach(function (r) { byId[r[0]] = r; });
  // Session order of DSA sets: basics -> searching -> recursion -> linear -> trees -> graphs -> DP, with timed mixed sets between blocks.
  dsaRows = ["DSA-01", "DSA-02", "DSA-03", "DSA-04", "DSA-05", "DSA-21", "DSA-22", "DSA-23", "DSA-24", "DSA-06", "DSA-25", "DSA-07", "DSA-26", "DSA-27",
    "DSA-08", "DSA-09", "DSA-10", "DSA-11", "DSA-28", "DSA-37", "DSA-12", "DSA-13", "DSA-29", "DSA-14", "DSA-30", "DSA-31", "DSA-20", "DSA-38",
    "DSA-15", "DSA-32", "DSA-16", "DSA-33", "DSA-39", "DSA-17", "DSA-18", "DSA-34", "DSA-35", "DSA-19", "DSA-36", "DSA-40", "DSA-41", "DSA-42"].map(function (id) { return byId[id]; });
  var dsaModules = [];
  dsaRows.forEach(function (r) {
    var m = dsaModules.find(function (x) { return x.title === r[2]; });
    if (!m) { m = { id: "dsa-" + r[2].toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, ""), title: r[2], lessons: [] }; dsaModules.push(m); }
    m.lessons.push({
      id: r[0], title: r[1], source: { kind: "gfg", course: GFG.dsa, ref: r[2] }, estMinutes: 10,
      videos: [{ id: r[0] + "-v1", title: r[1] + " in Java", source: "YouTube", channel: "Search results", url: null, durationMin: 20, suggestedWatchMin: 8, kind: "video" }],
      notes: [{ type: "p", text: "Example DSA notes for " + r[1] + ": pattern, template, and complexity." }],
      revision: ["Pattern: " + r[1]],
      practice: [{ id: r[0] + "-p1", title: "Problem set: " + r[1], platform: "GfG Practice", difficulty: "Easy–Medium", minutes: 20,
        prompt: "Solve 2 problems on " + r[1] + " in Java and paste your submission link.", url: "https://www.geeksforgeeks.org/explore", evidenceRequired: true }],
      coach: [{ id: r[0] + "-c1", prompt: "State the time and space complexity of your solution for " + r[1] + "." }]
    });
  });
  subjects.push({ id: "dsa", title: "DSA in Java", short: "DSA", color: "#4a5160", dsa: true, daily: true, modules: dsaModules });

  // Search-link prefix per subject (video links are YouTube searches, not picked videos).
  var QUERY = { "java-core": "java", "streams-apis": "java", concurrency: "java", databases: "sql", "spring-boot": "spring boot", lld: "low level design", hld: "system design", genai: "llm", dsa: "java dsa" };
  subjects.forEach(function (s) { s.modules.forEach(function (m) { m.lessons.forEach(function (l) { (l.videos || []).forEach(function (v) { v.url = yt(QUERY[s.id] + " " + l.title); }); }); }); });

  // Sessions: one main lesson + one DSA set each, in subject -> module -> lesson order.
  // A module test sits in the session that schedules the module's last lesson.
  var WARMUP = "JC-01", sessions = [];
  subjects.forEach(function (s) {
    if (s.dsa) return;
    s.modules.forEach(function (m) {
      m.lessons.forEach(function (l, li) {
        if (l.id === WARMUP) return;
        var n = sessions.length;
        var x = { id: "S" + String(n + 1).padStart(2, "0"), subject: s.id, lessons: [l.id], dsa: [dsaRows[n][0]] };
        if (li === m.lessons.length - 1 && m.test) x.test = m.id;
        sessions.push(x);
      });
    });
  });
  sessions[0].warmup = WARMUP;

  window.STUDY_DESK_FIXTURES.course = {
    title: "Study Desk", subtitle: "Subject-first plan · example fixture",
    fixture: true,
    schedule: { startDate: "2026-11-22", sessionStart: "21:00", core: { revision: 12, lesson: 78, dsa: 30 },
      dailyMinutes: { 0: 390, 1: 120, 2: 120, 3: 120, 4: 120, 5: 120, 6: 390 }, day1WarmupLessonId: "JC-01", testPassPct: 70, timeZone: "Asia/Kolkata" },
    subjects: subjects,
    sessions: sessions,
    // Old day-based fixture (v1 contract) -> stable lesson IDs, for migrateProgress().
    legacyMap: {
      // Only Java/DSA blocks map to lessons. v1 HLD/GenAI blocks (4 courses per day) would land on lessons
      // weeks ahead in the subject-first order, so they are kept under progress.legacy instead (QA M11).
      blocks: { "d1-java": "JC-03", "d1-dsa": "DSA-01", "d2-java": "JC-05", "d2-dsa": "DSA-02",
        "d3-java": "JC-06", "d3-dsa": "DSA-03", "d4-java": "CC-01", "d4-dsa": "DSA-04",
        "d5-java": "CC-02", "d5-dsa": "DSA-09", "d6-java": "SB-01", "d6-dsa": "DSA-11" },
      practice: { "d1-dsa": "DSA-01-p1", "d1-java": "JC-03-p1" },
      days: { "1": "S01", "2": "S02", "3": "S03", "4": "S04", "5": "S05", "6": "S06" }
    }
  };
})();
