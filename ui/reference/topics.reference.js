/*
 * Reference checklist for the coverage page (QA 2026-11-21, M14).
 * NOT curriculum content: it is the list of topics a Java backend + LLD + HLD + DSA + GenAI interview
 * plan is expected to teach, taken from GfG's public syllabi (Java Backend live course, Mastering
 * System Design, AI Engineering / GenAI tutorials, Master Java) and common interview expectations.
 * See collab/qa/study-desk-qa-2026-11-21.md, Section B.
 *
 * A topic counts as covered when a lesson lists its id in lesson.covers[], or when one of its
 * keywords (case-insensitive regex) appears in a lesson's title, notes or revision bullets.
 * Row: [topicId, title, "keyword|keyword"].
 */
window.STUDY_DESK_REFERENCE = {
  title: "Interview-plan reference checklist (Grok QA 2026-11-21)",
  subjects: [
    { id: "ref-java", title: "Java core", match: "java core|core java", topics: [
      ["java.jvm", "JDK/JRE/JVM, bytecode, class loading", "jvm|bytecode|class ?load"],
      ["java.oop", "OOP pillars, abstract class vs interface", "inheritance|polymorphism|encapsulation|interface"],
      ["java.strings", "String immutability, String pool, StringBuilder", "string pool|immutable string|stringbuilder"],
      ["java.equals", "equals/hashCode contract, Comparable vs Comparator", "equals/hashcode|hashcode|comparator"],
      ["java.immutability", "Immutability and records", "immutab|record"],
      ["java.exceptions", "Exceptions: checked vs unchecked, try-with-resources", "exception"],
      ["java.generics", "Generics: bounds, wildcards, PECS, erasure", "generic|wildcard|pecs"],
      ["java.collections", "Collections internals (HashMap, ArrayList, TreeMap)", "collection|hashmap|arraylist"],
      ["java.memory", "Memory model basics: stack/heap, GC", "garbage|\\bgc\\b|heap memory|stack vs heap"],
      ["java.modern", "Java 17/21: records, sealed classes, pattern matching", "sealed|pattern matching|java 21|java 17"]
    ] },
    { id: "ref-streams", title: "Streams & Java APIs", match: "stream", topics: [
      ["streams.lambdas", "Lambdas, functional interfaces, method references", "lambda|functional interface"],
      ["streams.pipeline", "Stream pipeline, laziness, map/filter/reduce/flatMap", "stream pipeline|map, filter|flatmap|lazy"],
      ["streams.collectors", "Collectors: groupingBy, partitioningBy, toMap", "collector|groupingby"],
      ["streams.optional", "Optional", "optional"],
      ["streams.parallel", "Parallel streams and when not to use them", "parallel stream"],
      ["streams.time", "java.time", "java\\.time|localdate"],
      ["streams.io", "File I/O / NIO", "\\bnio\\b|file i/o|files\\."]
    ] },
    { id: "ref-concurrency", title: "Concurrency", match: "concurren|multithread", topics: [
      ["cc.threads", "Thread lifecycle, Runnable/Callable", "thread lifecycle|runnable"],
      ["cc.sync", "synchronized, volatile, race conditions", "synchronized|volatile|race condition"],
      ["cc.jmm", "Java Memory Model, happens-before", "happens-before|memory model"],
      ["cc.executors", "Executors, thread pools, Futures", "executor|thread pool"],
      ["cc.locks", "Locks, atomics, CAS", "reentrantlock|atomic|\\bcas\\b"],
      ["cc.collections", "Concurrent collections, BlockingQueue, producer-consumer", "concurrenthashmap|blockingqueue|producer"],
      ["cc.sync-aids", "CountDownLatch, CyclicBarrier, Semaphore", "countdownlatch|cyclicbarrier|semaphore"],
      ["cc.deadlock", "Deadlock, livelock, starvation", "deadlock"],
      ["cc.cf", "CompletableFuture", "completablefuture"],
      ["cc.virtual", "Virtual threads (Java 21)", "virtual thread"]
    ] },
    { id: "ref-sql", title: "SQL & databases", match: "sql|database|jdbc", topics: [
      ["sql.joins", "Joins, GROUP BY/HAVING, subqueries", "join|group by|having"],
      ["sql.window", "Window functions (ROW_NUMBER, RANK)", "window function|row_number|rank"],
      ["sql.normalization", "Normalization vs denormalization", "normaliz"],
      ["sql.indexes", "Indexes (B-tree, composite), EXPLAIN plans", "index|explain"],
      ["sql.tx", "Transactions, ACID, isolation levels", "isolation|acid|transaction"],
      ["sql.locking", "Locking: optimistic vs pessimistic, FOR UPDATE", "optimistic|pessimistic|for update|locking"],
      ["sql.jdbc", "JDBC, PreparedStatement, connection pooling", "jdbc|preparedstatement|connection pool|hikari"],
      ["sql.nosql", "SQL vs NoSQL", "nosql"]
    ] },
    { id: "ref-spring", title: "Spring Boot", match: "spring", topics: [
      ["sb.ioc", "IoC/DI, bean scopes and lifecycle", "\\bioc\\b|dependency injection|\\bdi\\b|bean"],
      ["sb.config", "Auto-configuration, profiles, configuration properties", "auto-configuration|profile|configurationproperties"],
      ["sb.aop", "AOP and proxies", "\\baop\\b|proxy|proxies"],
      ["sb.http", "HTTP basics for APIs (methods, status codes, idempotency)", "status code|http method|idempoten"],
      ["sb.rest", "REST controllers, DTOs, validation, global error handling", "restcontroller|rest controller|@valid|controlleradvice"],
      ["sb.pagination", "Pagination, sorting, API versioning, OpenAPI", "paginat|openapi|swagger"],
      ["sb.jpa", "JPA/Hibernate entities, relationships, N+1", "\\bjpa\\b|hibernate|n\\+1"],
      ["sb.tx", "@Transactional propagation, isolation, pitfalls", "@transactional|propagation"],
      ["sb.testing", "JUnit 5, Mockito, slice tests, Testcontainers", "junit|mockito|testcontainers"],
      ["sb.security", "Spring Security filter chain, JWT", "security|jwt"],
      ["sb.oauth", "OAuth2 login / resource server", "oauth"],
      ["sb.async", "@Async, @Scheduled, task executors", "@async|@scheduled|taskexecutor"],
      ["sb.actuator", "Actuator, metrics, logging", "actuator|micrometer|observab"],
      ["sb.ai", "Spring AI: ChatClient, prompts, structured output", "spring ai|chatclient"]
    ] },
    { id: "ref-messaging", title: "Caching & messaging (Redis, Kafka)", match: "redis|kafka|messaging|caching", topics: [
      ["msg.redis", "Redis caching (@Cacheable, TTL, eviction)", "redis|@cacheable"],
      ["msg.kafka", "Kafka producers/consumers, groups, offsets", "kafka"],
      ["msg.semantics", "Delivery semantics, retries, DLQ, idempotent consumers", "at-least-once|exactly-once|dead letter|\\bdlq\\b"]
    ] },
    { id: "ref-ops", title: "Microservices, Docker & delivery", match: "microservice|docker|deploy|devops", topics: [
      ["ops.git", "Git and GitHub workflow", "\\bgit\\b|github"],
      ["ops.build", "Maven/Gradle builds", "maven|gradle"],
      ["ops.docker", "Docker and docker-compose", "docker"],
      ["ops.ci", "CI/CD (GitHub Actions) and deployment", "ci/cd|github actions|deploy"],
      ["ops.micro", "Microservices: gateway, discovery, resilience", "microservice|gateway|circuit breaker|resilience4j"],
      ["ops.observability", "Logs, metrics, traces, SLOs", "tracing|observab|slo\\b"]
    ] },
    { id: "ref-lld", title: "Low-level design", match: "low-level|lld", topics: [
      ["lld.uml", "UML: class and sequence diagrams", "uml|class diagram|sequence diagram"],
      ["lld.solid", "SOLID, DRY, KISS, composition over inheritance", "solid"],
      ["lld.creational", "Creational patterns", "creational|factory|builder|singleton"],
      ["lld.structural", "Structural patterns", "structural|adapter|decorator|facade|proxy"],
      ["lld.behavioral", "Behavioral patterns", "behavio|strategy|observer|command|state pattern"],
      ["lld.concurrency", "Concurrency in machine coding", "concurren|thread-safe|locking"],
      ["lld.parking", "Case: parking lot", "parking"],
      ["lld.booking", "Case: BookMyShow / seat booking", "bookmyshow|seat booking|ticket booking"],
      ["lld.splitwise", "Case: Splitwise", "splitwise"],
      ["lld.elevator", "Case: elevator", "elevator"],
      ["lld.lru", "Case: LRU cache", "\\blru\\b"]
    ] },
    { id: "ref-hld", title: "High-level design", match: "high-level|hld|system design", topics: [
      ["hld.framework", "Interview framework and requirements (FR/NFR)", "requirement|framework"],
      ["hld.estimates", "Back-of-the-envelope estimation", "estimat|back-of-the-envelope"],
      ["hld.network", "DNS, CDN, proxies, HTTP/TLS, WebSockets", "dns|cdn|proxy|websocket|tls"],
      ["hld.lb", "Load balancing and stateless scaling", "load balanc|horizontal"],
      ["hld.caching", "Caching strategies and invalidation", "cache-aside|write-through|caching"],
      ["hld.replication", "Replication and sharding", "replication|shard|partition"],
      ["hld.consistent-hashing", "Consistent hashing", "consistent hashing"],
      ["hld.cap", "CAP, PACELC, consistency models", "\\bcap\\b|pacelc|consistency"],
      ["hld.queues", "Queues, Kafka semantics, outbox", "queue|kafka|outbox"],
      ["hld.idempotency", "Idempotency, retries, backoff, timeouts", "idempoten|retry|backoff"],
      ["hld.ratelimit", "Rate limiting algorithms", "rate limit|token bucket"],
      ["hld.micro", "Microservices, saga, event-driven, CQRS", "saga|event-driven|cqrs|event sourcing"],
      ["hld.observability", "Observability: logs, metrics, traces", "observab|tracing|metrics"],
      ["hld.case-url", "Case: URL shortener", "url shortener"],
      ["hld.case-chat", "Case: chat system", "chat system|whatsapp"],
      ["hld.case-feed", "Case: news feed", "news feed|timeline"],
      ["hld.case-payment", "Case: payments / booking", "payment|e-wallet|booking system"]
    ] },
    { id: "ref-genai", title: "GenAI & LLMs", match: "genai|llm|generative", topics: [
      ["ai.transformers", "Transformer and attention intuition", "transformer|attention"],
      ["ai.tokens", "Tokens, context window, sampling", "token|context window|temperature"],
      ["ai.prompting", "Prompt engineering, structured output", "prompt"],
      ["ai.embeddings", "Embeddings and vector search", "embedding|vector"],
      ["ai.rag", "RAG pipeline", "\\brag\\b|retriev"],
      ["ai.chunking", "Chunking, hybrid search, reranking", "chunk|rerank|hybrid search"],
      ["ai.tools", "Function/tool calling and agents", "tool calling|function calling|agent"],
      ["ai.mcp", "Model Context Protocol (MCP)", "\\bmcp\\b|model context protocol"],
      ["ai.evals", "Evals: golden sets, LLM-as-judge", "eval|golden set|llm-as-judge"],
      ["ai.guardrails", "Guardrails, prompt injection", "guardrail|prompt injection"],
      ["ai.finetune", "Fine-tuning vs RAG vs prompting", "fine-tun|lora"],
      ["ai.cost", "Cost and latency control", "cost|latency"]
    ] },
    { id: "ref-dsa", title: "DSA patterns", match: "dsa|algorithm", topics: [
      ["dsa.complexity", "Big-O analysis", "big-o|complexity"],
      ["dsa.two-pointers", "Arrays and two pointers", "two pointer"],
      ["dsa.hashing", "Hashing", "hashing|frequency map"],
      ["dsa.window", "Sliding window", "sliding window"],
      ["dsa.prefix", "Prefix sums", "prefix sum"],
      ["dsa.strings", "Strings", "string|palindrome|anagram"],
      ["dsa.binsearch", "Binary search (incl. on the answer)", "binary search"],
      ["dsa.sorting", "Sorting", "sort"],
      ["dsa.intervals", "Intervals", "interval"],
      ["dsa.recursion", "Recursion and backtracking", "recursion|backtrack"],
      ["dsa.stack", "Stacks / monotonic stack", "stack"],
      ["dsa.linked", "Linked lists, fast/slow pointers", "linked list|fast and slow"],
      ["dsa.trees", "Trees, BST, LCA", "tree|\\bbst\\b"],
      ["dsa.heaps", "Heaps, top-K, two heaps", "heap|top-k"],
      ["dsa.graphs", "Graphs: BFS/DFS, topo sort", "graph|bfs|dfs|topolog"],
      ["dsa.shortest", "Shortest paths, MST", "dijkstra|shortest path|spanning"],
      ["dsa.dsu", "Union-Find", "union-find|\\bdsu\\b"],
      ["dsa.dp", "Dynamic programming", "dynamic programming|\\bdp\\b|knapsack"],
      ["dsa.greedy", "Greedy", "greedy"],
      ["dsa.tries", "Tries", "trie"],
      ["dsa.bits", "Bit manipulation", "bit manipulation"],
      ["dsa.design", "Design data structures (LRU, LFU)", "\\blru\\b|\\blfu\\b|min-stack"]
    ] },
    { id: "ref-interview", title: "Interview readiness", match: "interview readiness|behavioral|mock interview", topics: [
      ["iv.behavioral", "Behavioral / STAR stories", "behavioral interview|behavioural interview|star method|star stor"],
      ["iv.project", "Project walkthrough and storytelling", "project walkthrough|storytelling|capstone|project"],
      ["iv.mock", "Mock interviews (DSA, LLD, HLD)", "mock interview"],
      ["iv.spaced", "Spaced revision (1/3/7 days)", "spaced|1/3/7"]
    ] }
  ]
};
