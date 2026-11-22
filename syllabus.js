export const plan = {
  coreSessions: 45,
  depthSessions: 10,
  slot: '9–11 PM IST',
  description: 'The first 45 two-hour sessions develop the Java-first project and interview foundations. Ten follow-up sessions deepen selected topics, including a supplemental Union-Find and minimum spanning tree lesson. See the curriculum audit for outstanding syllabus gaps.',
  sourceNotes: [
    {
      title: 'Java Backend · 24 source sessions',
      coverage: 'Sessions 1–6 map to Java objects, OOP, exceptions, generics, collections, streams, JVM, synchronization and executors. Sessions 7–12 map to Maven, Spring DI and MVC, REST, SQL, JDBC, JPA and cross-cutting concerns. Sessions 13–18 map to tests, Redis and Spring Security. Sessions 19–24 map to service boundaries, Kafka, gateway, resilience and deployment.',
      adaptation: 'The Seat Booking Lab supplies the project thread in place of the source’s expense-sharing and property-rental exercises. Use current Resilience4j concepts when studying the role shown for Hystrix. Treat Lombok, Cursor and framework-specific conveniences as optional. PostgreSQL supplies concrete SQL and concurrency examples.'
    },
    {
      title: 'System Design · 24 source modules',
      coverage: 'Modules 1–2 map to requirements, API contracts, estimation and scaling. Modules 3–6 map to data models, consistency, indexing, replication, sharding and caching. Modules 7–10 map to messaging, API styles, CDC, event workflows and real-time delivery. Modules 11–16 map to boundaries, resilience, security and observability. Modules 17–24 map to cloud, CI/CD, SLOs and design cases.',
      adaptation: 'The booking lab is the end-to-end capstone. Study URL shortener and real-time chat as comparison cases. Deep Kubernetes, service mesh, cloud-service labs, compliance certification and the full source capstone lineup are extension topics.'
    },
    {
      title: 'DSA and System Design · 24 DSA classes plus HLD',
      coverage: 'Classes 1–5 map to complexity, math, arrays, windows and two pointers. Classes 6–10 map to hashing, recursion, binary search, sorting and matrices. Classes 11–16 map to linked lists, stacks, queues, LRU and backtracking. Classes 17–19 map to trees, BSTs and heaps. Classes 20–24 map to graph traversal, shortest paths, greedy choice and dynamic programming.',
      adaptation: 'Implement selected representative problems in Java. The HLD track consolidates System Design modules across both brochures. The plan includes matrix-chain multiplication as a stretch exercise. The Sieve of Eratosthenes, N-Queens and palindrome partitioning are missing from the 54-day baseline and are tracked in the detailed DSA coverage audit.'
    },
    {
      title: 'AI Engineering · Foundations through deployment',
      coverage: 'The brochure maps from neural network foundations and transformers to prompts and transfer learning, then embeddings, RAG, local models, tools, MCP, evaluation and deployment.',
      adaptation: 'Use Java and Spring AI for the practical integration, PostgreSQL or fixture vectors for retrieval, and a deterministic evaluator with optional model scoring and a Java HTTP service. Python-specific packages, Python fine-tuning implementations and notebook exercises are optional reference material. A separate Python runtime is useful only if you choose a Python-only library or training exercise.'
    }
  ],
  scope: 'The current 110-hour plan develops a Java backend interview and project path. The coverage audit lists missing topics and source case studies to schedule in the expanded plan.',
  additions: [
    'Before Spring: use a verified JDK and Maven, understand HTTP and show deterministic thread interleavings. Review patterns using one real domain requirement.',
    'Use a fixed lab and evidence to distinguish JVM memory and diagnostics, database isolation levels, token protocols, and the effects of input size on algorithm cost.',
    'Before two application instances: learn database constraints, atomic writes, transaction isolation, lock scope and idempotency.',
    'Before AI integration: practice typed contracts, provider timeouts, deterministic test doubles, grounding and evaluation.',
    'Before claiming interview readiness: run the program, explain it in your own words, handle a changed scenario and discuss a trade-off.'
  ]
};
