# Audit of the 54-session curriculum

Compared the actual 54-session baseline at `83318bd` with all 124 checklist IDs from Grok’s branch at `0e97dfa`, the published course outlines, and the earlier DSA verification. Grok’s counts describe the example UI fixture. This report inspects the real lessons. The baseline remains fixed for comparison while the repair branch adds lessons.

A topic is covered when the notes and a worked trace, exercise or evidence check teach the main requested concept. A bundled row is partial whenever a material portion is missing. A video-only mention does not meet the rule. These are editorial topic judgments. The teaching-quality table separately records runnable code, lesson anatomy and checks.

Source locators use J for Java Backend public session, D for DSA public class, H for dedicated System Design module, AI for current AI Engineering module, and L for the supplementary LLD/HLD PDF. Added means independently required for Deepak’s interview path beyond the relevant selected source scope. A mixed row names the GfG source for the overlap and labels the added parts separately in the evidence.

- [Grok’s report and 10-point checklist](https://github.com/Rishabh10045/ai-learning-platform/blob/grok/subject-first/collab/qa/study-desk-qa-2026-11-21.md)
- [Java Backend](https://www.geeksforgeeks.org/courses/Java-backend-live) · [PDF](https://media.geeksforgeeks.org/courses/syllabus/168b174933486cd366a5d51dff5738b6.pdf)
- [DSA + System Design](https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course) · [PDF](https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf) · [73-row DSA audit](curriculum-dsa-coverage.md)
- [Dedicated System Design](https://www.geeksforgeeks.org/courses/system-design-training-program) · [PDF](https://media.geeksforgeeks.org/courses/syllabus/973f73599e070cabefcf71cd54e1ff1f.pdf) · [LLD/HLD supplement](https://media.geeksforgeeks.org/courses/syllabus/f968df9d7b7f24623e8c14b2c22bbd45.pdf)
- [AI Engineering](https://www.geeksforgeeks.org/courses/ai-engineering-course-generative-agentic-ai) · [Current PDF](https://media.geeksforgeeks.org/courses/syllabus/9e2e6c838d855413f1805def9a931bbb.pdf)

## Status by subject

| Subject | Covered | Partial | Missing |
| --- | ---: | ---: | ---: |
| Java core | 1 | 7 | 2 |
| Streams & Java APIs | 0 | 5 | 2 |
| Concurrency | 1 | 8 | 1 |
| SQL & databases | 1 | 4 | 3 |
| Spring Boot | 3 | 10 | 1 |
| Caching & messaging (Redis, Kafka) | 0 | 3 | 0 |
| Microservices, Docker & delivery | 0 | 5 | 1 |
| Low-level design | 3 | 5 | 3 |
| High-level design | 0 | 14 | 3 |
| GenAI & LLMs | 6 | 6 | 0 |
| DSA patterns | 3 | 16 | 3 |
| Interview readiness | 1 | 2 | 1 |
| Total | 19 | 85 | 20 |

## Topic evidence

| Subject | Topic | In the 54-session plan? | Source | Evidence and required repair |
| --- | --- | --- | --- | --- |
| Java core | JDK/JRE/JVM, bytecode, class loading | Partial<br>46 · `j-jvm-02`<br>7 · `j-executors-01` | GfG J 1 + added | Heap, frames, metadata and diagnostics. Add bytecode, loader delegation, JIT and a javap exercise. |
| Java core | OOP pillars, abstract class vs interface | Partial<br>1 · `j-oop-01`<br>5 · `j-oop-02`<br>8 · `l-uml-01` | GfG J 1–2 | Encapsulation, interfaces and composition. Add abstraction, polymorphism and inheritance with substitution tests. |
| Java core | String immutability, String pool, StringBuilder | MISSING | added | Add String pool, literal vs new, equals vs ==, intern, StringBuilder and repeated concatenation costs. |
| Java core | equals/hashCode contract, Comparable vs Comparator | Partial<br>4 · `j-equality-01`<br>28 · `d-sort-01` | GfG J 4, D 6 + added | Immutable keys, collisions and stable ties. Add natural order vs alternate comparators and TreeSet consistency. |
| Java core | Immutability and records | Partial<br>4 · `j-equality-01`<br>6 · `j-generics-01` | added | Stable map keys and unmodifiable projections. Add defensive copying, mutable components in records and value tests. |
| Java core | Exceptions: checked vs unchecked, try-with-resources | Partial<br>5 · `j-oop-02`<br>13 · `b-jdbc-01` | GfG J 2 | Checked vs unchecked, propagation, cause and JDBC cleanup. Add finally and suppressed exceptions with runnable code. |
| Java core | Generics: bounds, wildcards, PECS, erasure | Partial<br>6 · `j-generics-01` | GfG J 4 | Bounds, wildcards and erasure described. Add PECS copy and type-inference lab before generic collections. |
| Java core | Collections internals (HashMap, ArrayList, TreeMap) | Partial<br>4 · `j-equality-01`<br>7 · `j-executors-01`<br>29 · `d-lru-02`<br>30 · `d-recursion-01` | GfG J 3–4, D 12,19 | Hash lookup, collision, sorted containers and LRU. Add resize/treeification caveats, ArrayList growth, TreeMap and iterators. |
| Java core | Memory model basics: stack/heap, GC | Covered<br>7 · `j-executors-01`<br>46 · `j-jvm-02` | GfG J 1 + added | Frames, heap, object reachability, GC and a controlled JVM diagnostic exercise. Collectors and leak diagnosis need a further lab. |
| Java core | Java 17/21: records, sealed classes, pattern matching | MISSING | added | Add records, sealed hierarchies and exhaustive pattern switch, with a Java 17/21 feature compatibility matrix. |
| Streams & Java APIs | Lambdas, functional interfaces, method references | Partial<br>6 · `j-generics-01` | GfG J 3 | Lambdas and functional interfaces. Add method references and standard Predicate/Function/Consumer/Supplier. |
| Streams & Java APIs | Stream pipeline, laziness, map/filter/reduce/flatMap | Partial<br>6 · `j-generics-01` | GfG J 4 | Filter/map, laziness and terminal collection. Add flatMap, reduce, short-circuiting and primitive streams. |
| Streams & Java APIs | Collectors: groupingBy, partitioningBy, toMap | MISSING | added | Implement groupingBy, partitioningBy and toMap with a deliberate duplicate and a merge strategy. |
| Streams & Java APIs | Optional | Partial<br>6 · `j-generics-01` | added | findFirst may return no match. Add Optional mapping, orElseGet, false defaults and API return-type examples. |
| Streams & Java APIs | Parallel streams and when not to use them | Partial<br>6 · `j-generics-01`<br>7 · `j-executors-01` | GfG J 4 | Parallelism and side effects mentioned. Add ordered results, ForkJoin pool costs, measurements, and when to stay sequential. |
| Streams & Java APIs | java.time | Partial<br>19 · `l-invariants-02` | added | Injectable clock and expiry checks. Add Instant, Duration, LocalDate, ZonedDateTime and a DST fixture. |
| Streams & Java APIs | File I/O / NIO | MISSING | added | Add Path/Files, streaming reads, character encodings and resource ownership in Java. |
| Concurrency | Thread lifecycle, Runnable/Callable | Partial<br>2 · `j-concurrency-01`<br>7 · `j-executors-01` | GfG J 5 | Interleaving, tasks and Future errors. Add start vs run/join and thread states. |
| Concurrency | synchronized, volatile, race conditions | Covered<br>2 · `j-concurrency-01`<br>3 · `j-concurrency-02` | GfG J 5 | Controlled lost update, volatile visibility, common monitor and exactly-one-winner checks. |
| Concurrency | Java Memory Model, happens-before | Partial<br>3 · `j-concurrency-02`<br>46 · `j-jvm-02` | GfG J 5 + added | Monitor and volatile happens-before. Add start/join, safe publication, immutability and double-checked locking. |
| Concurrency | Executors, thread pools, Futures | Partial<br>7 · `j-executors-01`<br>46 · `j-jvm-02` | GfG J 5 | Pools, bounded downstream capacity, futures, deadlines and shutdown. Add queue/rejection policy experiment. |
| Concurrency | Locks, atomics, CAS | Partial<br>3 · `j-concurrency-02`<br>46 · `j-jvm-02` | GfG J 5 + added | CAS and monitor examples. Add ReentrantLock, condition and try/finally ownership, read/write locks, LongAdder and ABA intuition. |
| Concurrency | Concurrent collections, BlockingQueue, producer-consumer | Partial<br>46 · `j-jvm-02` | GfG J 3,5 + added | ConcurrentHashMap operations and compound invariants. Add BlockingQueue producer/consumer and copy-on-write trade-off. |
| Concurrency | CountDownLatch, CyclicBarrier, Semaphore | Partial<br>2 · `j-concurrency-01`<br>3 · `j-concurrency-02`<br>46 · `j-jvm-02` | added | Barriers/latches in races and semaphore bulkhead. Add compare-the-primitives code plus termination and interruption tests. |
| Concurrency | Deadlock, livelock, starvation | Partial<br>3 · `j-concurrency-02`<br>15 · `b-transactions-03`<br>46 · `j-jvm-02` | GfG J 5 + added | Barrier misuse and DB lock ordering. Add JVM lock-order recovery, livelock and starvation with thread dumps. |
| Concurrency | CompletableFuture | MISSING | added | Add thenApply/thenCompose/allOf, failure and timeout paths, managed executor and cancellation boundaries. |
| Concurrency | Virtual threads (Java 21) | Partial<br>7 · `j-executors-01`<br>46 · `j-jvm-02` | added | Downstream limiting and diagnostics for virtual threads. Add version-specific pinning experiment and explain structured-concurrency preview status. |
| SQL & databases | Joins, GROUP BY/HAVING, subqueries | MISSING | added | Add inner/left joins, GROUP BY/HAVING and equivalent subqueries with duplicate/NULL cases. |
| SQL & databases | Window functions (ROW_NUMBER, RANK) | MISSING | added | Add ROW_NUMBER, RANK, ties, running totals and top-N per group. |
| SQL & databases | Normalization vs denormalization | Partial<br>12 · `b-sql-01` | GfG H 3 + added | Keys and constraints are taught. Add functional dependencies, 1NF–3NF/BCNF and when to denormalize. |
| SQL & databases | Indexes (B-tree, composite), EXPLAIN plans | Partial<br>21 · `h-databases-01` | GfG H 3–4 | Index trade-offs and EXPLAIN/ANALYZE. Add B-tree, composite order, covering index and planner fixture. |
| SQL & databases | Transactions, ACID, isolation levels | Partial<br>13 · `b-jdbc-01`<br>14 · `b-transactions-02`<br>15 · `b-transactions-03` | GfG J 11, H 3 | Commit/rollback and PostgreSQL Read Committed/Repeatable Read/Serializable. Add ACID terminology, anomaly matrix and MVCC trace. |
| SQL & databases | Locking: optimistic vs pessimistic, FOR UPDATE | Covered<br>14 · `b-transactions-02`<br>15 · `b-transactions-03`<br>16 · `b-jpa-01` | GfG J 11 + added | Guarded writes, FOR UPDATE, version conflict, transaction scope and lock ordering. |
| SQL & databases | JDBC, PreparedStatement, connection pooling | Partial<br>13 · `b-jdbc-01`<br>47 · `b-di-02` | GfG J 10 | Prepared SQL, second connection and RowMapper. Add DataSource pool config, lifecycle and saturation lab. |
| SQL & databases | SQL vs NoSQL | MISSING | GfG H 3 | Add relational vs document, key-value and wide-column selection with workload and correctness trade-offs. |
| Spring Boot | IoC/DI, bean scopes and lifecycle | Partial<br>9 · `j-build-01` | GfG J 8 + added | Constructor DI and ambiguous beans. Add lifecycle, PostConstruct, scopes, proxies and circular dependencies. |
| Spring Boot | Auto-configuration, profiles, configuration properties | Partial<br>9 · `j-build-01` | added | Bean profile selection stretch. Add starter/auto-configuration condition reports and typed external config. |
| Spring Boot | AOP and proxies | Covered<br>47 · `b-di-02` | GfG J 9 | Proxy-based interception and self-invocation, with separate-connection rollback check. |
| Spring Boot | HTTP basics for APIs (methods, status codes, idempotency) | Covered<br>1 · `j-oop-01`<br>10 · `b-http-01`<br>20 · `b-http-02` | GfG J 8, H 9 | Request flow, methods/statuses, idempotency key conflicts and retries. |
| Spring Boot | REST controllers, DTOs, validation, global error handling | Partial<br>10 · `b-http-01`<br>11 · `b-validation-01` | GfG J 8,17 + added | DTO validation, public error codes, 400/404/409. Add @ControllerAdvice and ProblemDetail runnable integration. |
| Spring Boot | Pagination, sorting, API versioning, OpenAPI | Partial<br>16 · `b-jpa-01` | added | JPA paging trade-offs mentioned. Teach offset/keyset, stable tiebreaker, sorting, versioning and OpenAPI. |
| Spring Boot | JPA/Hibernate entities, relationships, N+1 | Covered<br>16 · `b-jpa-01` | GfG J 11 + added | Managed/detached state, relationship mapping, N+1 SQL-count fixture and projection/join-fetch selection. |
| Spring Boot | @Transactional propagation, isolation, pitfalls | Partial<br>13 · `b-jdbc-01`<br>47 · `b-di-02` | GfG J 11 + added | REQUIRED/REQUIRES_NEW, rollbacks and proxy trap. Add rollback-only test, readOnly caveat and isolation with nested boundary. |
| Spring Boot | JUnit 5, Mockito, slice tests, Testcontainers | Partial<br>8 · `l-uml-01`<br>11 · `b-validation-01`<br>16 · `b-jpa-01`<br>33 · `b-security-01` | GfG J 14,17 + added | Unit and real-DB checks. Add demonstrated Mockito, @WebMvcTest, @DataJpaTest and reproducible Testcontainers setup. |
| Spring Boot | Spring Security filter chain, JWT | Partial<br>33 · `b-security-01`<br>48 · `b-security-02` | GfG J 16–18, H 15 | Auth boundaries, token claims and ownership. Add filter chain trace, password encoding and CORS/CSRF. |
| Spring Boot | OAuth2 login / resource server | Partial<br>48 · `b-security-02` | GfG J 18 + added | Code flow, PKCE, scopes, issuer/audience. Add GitHub login exercise from source and distinct Google adaptation/refresh handling. |
| Spring Boot | @Async, @Scheduled, task executors | MISSING | added | Add Spring @Async and @Scheduled after concurrency, proxy boundary, error handling and named bounded TaskExecutor. |
| Spring Boot | Actuator, metrics, logging | Partial<br>34 · `b-deployment-01`<br>51 · `h-cloud-01` | GfG J 23, H 14 + added | Conceptual readiness, liveness and logs. Implement Actuator, Micrometer and a trace correlated with a failing request. |
| Spring Boot | Spring AI: ChatClient, prompts, structured output | Partial<br>36 · `ai-prompting-01`<br>37 · `ai-model-api-01`<br>39 · `ai-rag-01` | GfG AI 5,7 + added | Schema/grounding distinction, Spring AI adapter, RAG design. Add a compiled prompt/structured-output/VectorStore integration. |
| Caching & messaging (Redis, Kafka) | Redis caching (@Cacheable, TTL, eviction) | Partial<br>22 · `b-caching-01` | GfG J 15,17, H 5–6 | Cache-aside, TTL/eviction, stale-fill test. Add actual Spring Redis setup, @Cacheable and cache-loss integration case. |
| Caching & messaging (Redis, Kafka) | Kafka producers/consumers, groups, offsets | Partial<br>23 · `b-messaging-01`<br>50 · `h-queues-02` | GfG J 20, H 7–8 | Partitions, groups, offsets and replay explained. Add actual Spring Kafka producer/consumer plus rebalance/retry fixture. |
| Caching & messaging (Redis, Kafka) | Delivery semantics, retries, DLQ, idempotent consumers | Partial<br>23 · `b-messaging-01`<br>50 · `h-queues-02` | GfG J 20, H 7–8 | Redelivery, deduplication and outbox. Add DLQ replay, at-most/at-least distinctions and exactly-once scope. |
| Microservices, Docker & delivery | Git and GitHub workflow | MISSING | added | Add branch/commit/PR, conflict resolution and revert using a disposable repo. |
| Microservices, Docker & delivery | Maven/Gradle builds | Partial<br>9 · `j-build-01` | GfG J 6–7 + added | Maven lifecycle and wrapper. Add dependency/tree/reproducible build and a brief Gradle comparison. |
| Microservices, Docker & delivery | Docker and docker-compose | Partial<br>34 · `b-deployment-01`<br>51 · `h-cloud-01` | GfG J 23, H 18, AI 15 | Container deployment and health practice. Add Compose for Spring/Postgres/Redis/Kafka with reproducible commands. |
| Microservices, Docker & delivery | CI/CD (GitHub Actions) and deployment | Partial<br>34 · `b-deployment-01`<br>51 · `h-cloud-01` | GfG J 23–24, H 19 | Pipeline stage and rollback design. Add checked-in GitHub Actions, non-production deployment and rollback evidence. |
| Microservices, Docker & delivery | Microservices: gateway, discovery, resilience | Partial<br>17 · `h-scaling-01`<br>49 · `h-api-01`<br>50 · `h-queues-02` | GfG J 19–24, H 11–13 | Two JVMs, gateway, outbox/sagas and circuit-breaker concept. Add actual discovery, Feign and Resilience4j fixture. |
| Microservices, Docker & delivery | Logs, metrics, traces, SLOs | Partial<br>34 · `b-deployment-01`<br>40 · `ai-evaluation-01`<br>51 · `h-cloud-01` | GfG J 23, H 14,19, AI 14 | Signals, SLO definitions and evidence. Add a runnable metrics/traces dashboard/alert and review an outage. |
| Low-level design | UML: class and sequence diagrams | Covered<br>8 · `l-uml-01`<br>19 · `l-invariants-02` | GfG L pp. 2–3 | Class and sequence diagrams assigned with explicit object responsibilities. Activity/object/state notation is a separate gap. |
| Low-level design | SOLID, DRY, KISS, composition over inheritance | Partial<br>1 · `j-oop-01`<br>5 · `j-oop-02`<br>8 · `l-uml-01` | GfG L p. 2 | SOLID and composition examples. Add GRASP, DRY/KISS and a refactor/change test. |
| Low-level design | Creational patterns | Partial<br>5 · `j-oop-02`<br>8 · `l-uml-01` | GfG J 2, L p. 2 + added | Singleton use and caveat. Add Factory Method, Abstract Factory, Builder and Prototype exercises. |
| Low-level design | Structural patterns | Partial<br>8 · `l-uml-01`<br>37 · `ai-model-api-01` | GfG L p. 2 + added | Adapter and boundary examples. Add Composite, Proxy, Bridge, Decorator and Facade with cases. |
| Low-level design | Behavioral patterns | Partial<br>8 · `l-uml-01`<br>19 · `l-invariants-02` | GfG L p. 2 + added | Strategy/State motivated. Add Observer, Command, Template, Iterator and Chain of Responsibility. |
| Low-level design | Concurrency in machine coding | Covered<br>2 · `j-concurrency-01`<br>3 · `j-concurrency-02`<br>8 · `l-uml-01`<br>19 · `l-invariants-02`<br>29 · `d-lru-02` | GfG J 5 + added | Booking with one winner, hold expiry and thread-safe LRU prompt. Connect to additional machine-coding cases. |
| Low-level design | Case: parking lot | MISSING | added | Implement spot types, allocation/pricing strategies and competing entry gates. |
| Low-level design | Case: BookMyShow / seat booking | Partial<br>1 · `j-oop-01`<br>19 · `l-invariants-02`<br>44 · `h-case-up-01` | GfG L p. 3 + added | Seat invariant, expiry and two-instance booking. Add multi-show inventory, search/hold/payment boundaries and cancellation. |
| Low-level design | Case: Splitwise | MISSING | GfG J 12–13,17 | Add multiple split types, precision, balances and settlement invariants in an independent app. |
| Low-level design | Case: elevator | MISSING | added | Add requests, dispatch policy, state machine and simulation fixtures. |
| Low-level design | Case: LRU cache | Covered<br>29 · `d-lru-02` | GfG D 12 + added | Capacity, linked/map invariants and independent eviction exercise. |
| High-level design | Interview framework and requirements (FR/NFR) | Partial<br>18 · `h-requirements-01`<br>44 · `h-case-up-01`<br>45 · `l-review-01` | GfG H 1 | Clear FR/NFR and trade-offs. Add source-listed interview frameworks and timed API/data-model/deep-dive practice. |
| High-level design | Back-of-the-envelope estimation | Partial<br>18 · `h-requirements-01`<br>24 · `h-loadbalance-01` | GfG H 1–2 | Worked QPS and peak/hot-key estimation. Add bandwidth, storage and numerical capacity/degradation drills. |
| High-level design | DNS, CDN, proxies, HTTP/TLS, WebSockets | Partial<br>1 · `j-oop-01`<br>49 · `h-api-01`<br>51 · `h-cloud-01` | GfG H 2,6,9–10 | DNS/HTTP/TLS and gateway/realtime choices. Add CDN invalidation, proxy types, L4/L7 and long polling. |
| High-level design | Load balancing and stateless scaling | Partial<br>17 · `h-scaling-01`<br>24 · `h-loadbalance-01` | GfG H 2 | Horizontal and stateless scaling, algorithms and health. Add L4/L7, sticky routing/selection and measured failure experiment. |
| High-level design | Caching strategies and invalidation | Partial<br>22 · `b-caching-01` | GfG H 5–6 | Cache-aside/stale-fill/coalescing. Add read/write-through/back, invalidation failures and multi-tier cache design. |
| High-level design | Replication and sharding | Partial<br>17 · `h-scaling-01`<br>21 · `h-databases-01`<br>25 · `h-consistency-01` | GfG H 3–4 | Replica lag, sharding/hot keys and authoritative write. Add multi-leader, quorum and resharding trade-offs. |
| High-level design | Consistent hashing | MISSING | GfG H 4, L p. 4 | Existing video link alone. Add ring, virtual nodes, replication and movement measurement. |
| High-level design | CAP, PACELC, consistency models | Partial<br>25 · `h-consistency-01` | GfG H 3 | Partitions and chosen read/write consistency. Add explicit CAP model, PACELC and linearizable vs eventual/read-your-writes trace. |
| High-level design | Queues, Kafka semantics, outbox | Partial<br>23 · `b-messaging-01`<br>50 · `h-queues-02` | GfG H 7–8 | Kafka basics, deduplication and outbox. Add broker comparison, replay/DLQ fixture and event-order guarantees. |
| High-level design | Idempotency, retries, backoff, timeouts | Partial<br>20 · `b-http-02`<br>25 · `h-consistency-01`<br>42 · `ai-security-01` | GfG H 7,12–13 + added | Keys, retention, deadlines and backoff. Add jitter, retry budgets and overload simulation. |
| High-level design | Rate limiting algorithms | MISSING | GfG H 9,16,22 + added | A video is linked in D24/D49. Add token bucket, sliding window, distributed time/state and fairness exercise. |
| High-level design | Microservices, saga, event-driven, CQRS | Partial<br>17 · `h-scaling-01`<br>49 · `h-api-01`<br>50 · `h-queues-02` | GfG H 8,11–13 | Gateway, saga, outbox and failure isolation. Add CQRS projection/replay, discovery and consensus boundaries. |
| High-level design | Observability: logs, metrics, traces | Partial<br>34 · `b-deployment-01`<br>51 · `h-cloud-01` | GfG H 14 | Logs/metrics/traces and SLI/SLO. Add alert routing, burn-rate and actionable SLO/incident cases. |
| High-level design | Case: URL shortener | Partial<br>49 · `h-api-01` | GfG H 21–22 | Brief redirect/cache comparison. Add ID/collision, custom aliases, TTL, analytics and productionization case. |
| High-level design | Case: chat system | Partial<br>49 · `h-api-01` | GfG H 23–24 | Realtime transport sketch. Add ordering/receipts/offline replay, Kafka fan-out and partitioning case. |
| High-level design | Case: news feed | MISSING | added | Add recency ranking, fan-out on read/write, celebrity skew and cache pagination case. |
| High-level design | Case: payments / booking | Partial<br>20 · `b-http-02`<br>44 · `h-case-up-01`<br>50 · `h-queues-02` | GfG J 21–22, L p. 3 + added | Booking idempotency/holds and saga evidence. Add separate payment ledger, reversals and reconciliation case. |
| GenAI & LLMs | Transformer and attention intuition | Partial<br>35 · `ai-foundations-02` | GfG AI 1–2 | Attention intuition in the D35 notes and model comparison. Add numerical attention trace, positional signals, next-token and encoder/decoder comparison. |
| GenAI & LLMs | Tokens, context window, sampling | Partial<br>1 · `j-oop-01`<br>35 · `ai-foundations-02`<br>42 · `ai-security-01` | GfG AI 2,4 | Tokens, context and budgets. Add tokenizer example and decoding temperature/top-p experiment. |
| GenAI & LLMs | Prompt engineering, structured output | Covered<br>36 · `ai-prompting-01` | GfG AI 5 + added | Structured schema with semantic validation and positive/negative evidence fixtures. |
| GenAI & LLMs | Embeddings and vector search | Covered<br>38 · `ai-embeddings-01` | GfG AI 6 + added | Similarity/ranking, exact vs approximate HNSW and metadata filter check. |
| GenAI & LLMs | RAG pipeline | Covered<br>39 · `ai-rag-01`<br>40 · `ai-evaluation-01` | GfG AI 7–9 | Retrieval→generation→grounding and distinct missing/unsupported outcome fixtures. |
| GenAI & LLMs | Chunking, hybrid search, reranking | Partial<br>38 · `ai-embeddings-01`<br>39 · `ai-rag-01` | GfG AI 7,9 | Chunks, hybrid retrieval and metadata. Add overlap/reranking/rewriting with controlled recall and latency comparisons. |
| GenAI & LLMs | Function/tool calling and agents | Partial<br>41 · `ai-tools-01` | GfG AI 11–12 | Validated tool proposal and access checks. Add a bounded Java agent loop, memory/evaluation and human escalation. |
| GenAI & LLMs | Model Context Protocol (MCP) | Covered<br>41 · `ai-tools-01` | GfG AI 12–13 + added | Architecture and authorization boundary through a read-only tool trace. Extend to a runnable Spring client/server lab. |
| GenAI & LLMs | Evals: golden sets, LLM-as-judge | Covered<br>40 · `ai-evaluation-01` | GfG AI 14 | Labeled data, hit/recall, supported claims, abstention and judge-calibration notes/exercise. |
| GenAI & LLMs | Guardrails, prompt injection | Covered<br>36 · `ai-prompting-01`<br>41 · `ai-tools-01`<br>42 · `ai-security-01` | GfG AI 14–16 + added | Schema and grounding checks, defensive trust boundaries and failure/fallback cases. |
| GenAI & LLMs | Fine-tuning vs RAG vs prompting | Partial<br>43 · `ai-customization-01` | GfG AI 3,4 | Fine-tuning versus prompt/retrieval decision. Add LoRA/QLoRA intuition and contamination-safe evaluation. |
| GenAI & LLMs | Cost and latency control | Partial<br>42 · `ai-security-01`<br>54 · `ai-operations-03` | GfG AI 14–16 | Latency, budget and fallback. Add a routing/cache/streaming cost-quality experiment. |
| DSA patterns | Big-O analysis | Covered<br>26 · `d-complexity-01` | GfG D 1 | Worst-case and expected costs, input model and memory checked on independent fixtures. |
| DSA patterns | Arrays and two pointers | Partial<br>26 · `d-complexity-01`<br>27 · `d-pointers-01` | GfG D 3,5 | Linear array scans and monotone windows. Add pair/triplet sum, array rotations and Dutch flag. |
| DSA patterns | Hashing | Covered<br>1 · `j-oop-01`<br>4 · `j-equality-01`<br>26 · `d-complexity-01` | GfG D 6, J 4 | Set membership, equality/collisions and costs. Add a later target-sum frequency drill. |
| DSA patterns | Sliding window | Partial<br>27 · `d-pointers-01` | GfG D 4–5,14 | Longest-distinct insertion/removal and repeated index checks. Add fixed sums and monotone deque maximum. |
| DSA patterns | Prefix sums | Covered<br>26 · `d-complexity-01` | GfG D 4 | Range sum prefix invariant, empty and mixed fixtures and cost comparison. |
| DSA patterns | Strings | Partial<br>27 · `d-pointers-01`<br>28 · `d-sort-01` | GfG D 5,15,24 + added | Distinct windows and delimiter validation. Add anagram counts, palindrome routines and pattern matching. |
| DSA patterns | Binary search (incl. on the answer) | Partial<br>27 · `d-pointers-01` | GfG D 8 + added | Iterative and recursive lower bound verified. Add rotated search and monotone feasibility on an answer space. |
| DSA patterns | Sorting | Partial<br>28 · `d-sort-01` | GfG D 9 | Merge sort and stability. Add quicksort partition, elementary sorts, cyclic sort and Shell sort. |
| DSA patterns | Intervals | Partial<br>32 · `d-greedy-01` | GfG D 23 + added | Activity selection and weighted scheduling. Add merge/insert and meeting-room counting with tie rules. |
| DSA patterns | Recursion and backtracking | Partial<br>26 · `d-complexity-01`<br>30 · `d-recursion-01`<br>52 · `d-backtracking-01` | GfG D 7,15–16 | Explicit recursion and choose/undo. Add Hanoi, permutations/combinations/subsets and maze/queens/Sudoku. |
| DSA patterns | Stacks / monotonic stack | Partial<br>28 · `d-sort-01` | GfG D 13–14 | Ordinary stack application. Add monotone stack, duplicate comparisons and previous/next greater fixtures. |
| DSA patterns | Linked lists, fast/slow pointers | Partial<br>28 · `d-sort-01`<br>29 · `d-lru-02` | GfG D 11–12 | Reversal and doubly linked LRU. Add slow/fast midpoint, Floyd cycle and entry, circular lists and intersection. |
| DSA patterns | Trees, BST, LCA | Partial<br>30 · `d-recursion-01` | GfG D 17–18 + added | Recursive traversals and BST order. Add BST mutation, LCA, diameter and tree DP. |
| DSA patterns | Heaps, top-K, two heaps | Partial<br>30 · `d-recursion-01` | GfG D 19 + added | Bounded top-K and ties. Add heapify, two-heaps median and k-way merge. |
| DSA patterns | Graphs: BFS/DFS, topo sort | Partial<br>31 · `d-graphs-01`<br>52 · `d-backtracking-01` | GfG D 20–22 | BFS/DFS and dependency tests. Add explicit Kahn/DFS builds, directed/undirected cycles and flood fill. |
| DSA patterns | Shortest paths, MST | Partial<br>31 · `d-graphs-01`<br>52 · `d-backtracking-01` | GfG D 22 + added | BFS minimum hops and Dijkstra weight assumptions. Add executable Dijkstra, negative-weight alternative and MST (implemented in new D55). |
| DSA patterns | Union-Find | MISSING | added | Union-Find was absent from the DSA Track 1 listing and baseline. New D55 implements it with Kruskal. |
| DSA patterns | Dynamic programming | Partial<br>32 · `d-greedy-01`<br>53 · `d-math-01` | GfG D 23–24 + added | Weighted intervals, subset sum and matrix-chain. Add knapsack, coin-change variants, LIS/LCS/LPS, edit distance and cuts. |
| DSA patterns | Greedy | Partial<br>32 · `d-greedy-01` | GfG D 23 | Earliest-finish exchange. Add fractional knapsack and greedy coin-change counterexample (notes repaired). |
| DSA patterns | Tries | MISSING | added | Add prefix insert/search, exact end markers and a memory-cost comparison. |
| DSA patterns | Bit manipulation | MISSING | GfG D 1 | Add masking, shifts, parity and bit set/unset with signed/unsigned tests. |
| DSA patterns | Design data structures (LRU, LFU) | Partial<br>29 · `d-lru-02` | GfG D 12 + added | LRU implemented as an assignment. Add LFU tie handling and min-stack cases. |
| Interview readiness | Behavioral / STAR stories | MISSING | added | Add truthful STAR stories, ownership and evidence rubric with practice for conflict, failure and trade-offs. |
| Interview readiness | Project walkthrough and storytelling | Covered<br>44 · `h-case-up-01`<br>45 · `l-review-01`<br>54 · `ai-operations-03` | added | Evidence-linked architecture walkthrough, run/demo and limitation. Add a rehearsed timed version and independent review. |
| Interview readiness | Mock interviews (DSA, LLD, HLD) | Partial<br>45 · `l-review-01` | added | Mock mode prompt and one independent exercise. Schedule weekly DSA, LLD, HLD, Java/Spring and behavioral mocks with rubrics. |
| Interview readiness | Spaced revision (1/3/7 days) | Partial<br>2 · `j-concurrency-01`<br>45 · `l-review-01` | added | Prior-day recap and +3/+7 links; own notes return. Add per-topic tracked due queue, failed DSA problems and optional +21 retention. |

## Lesson-by-lesson teaching checks

Word counts include English paragraphs and the worked example. Grok’s depth target is ≥400 words, four to six questions and a pass mark ≥70%. Deepak’s requested minimum of more than one question is separately met by all baseline days. A diagram is useful for state changes, traces, architectural boundaries and competing calls. A missing interactive diagram is only a failure when one is requested in the notes below.

Every baseline day has an assigned direct URL for reading and at least one listed video. The audit found zero search links in the assigned video catalog. Publisher articles, landing pages and direct watch links are distinguishable in the catalog. Actual video playback, exact timestamps for most videos and subscription-only media still require verification. Every baseline day provides 3–4 revision points. D1 provides a primary assignment with four acceptance checks and three smaller exercises with no separately rendered acceptance checks. D2–D4 have three or four checks. D5–D54 use one combined acceptance entry per assignment.

| Day | Stable lesson ID | Notes words | Checked Java example | Interactive diagram | Linked videos | Practice checks per task | Quiz | Revision bullets | Time split |
| ---: | --- | ---: | --- | --- | ---: | --- | --- | ---: | --- |
| 1 | `j-oop-01` | 514 | Snippet needs dependencies | Present | 2 | 4/0/0/0 | 5 (4 to pass) | 4 | 45/25/20/15/15 |
| 2 | `j-concurrency-01` | 290 (short) | Missing | Present | 1 | 4 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 3 | `j-concurrency-02` | 285 (short) | Missing | Present | 1 | 4 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 4 | `j-equality-01` | 285 (short) | Missing | Present | 1 | 3 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 5 | `j-oop-02` | 270 (short) | Missing | — | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 6 | `j-generics-01` | 265 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 7 | `j-executors-01` | 362 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 8 | `l-uml-01` | 387 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 9 | `j-build-01` | 250 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 10 | `b-http-01` | 238 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 11 | `b-validation-01` | 326 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 12 | `b-sql-01` | 232 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 13 | `b-jdbc-01` | 335 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 14 | `b-transactions-02` | 245 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 15 | `b-transactions-03` | 217 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 16 | `b-jpa-01` | 313 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 17 | `h-scaling-01` | 186 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 18 | `h-requirements-01` | 210 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 19 | `l-invariants-02` | 302 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 20 | `b-http-02` | 318 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 21 | `h-databases-01` | 213 (short) | Missing | Recommended | 2 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 22 | `b-caching-01` | 199 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 23 | `b-messaging-01` | 192 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 24 | `h-loadbalance-01` | 181 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 25 | `h-consistency-01` | 201 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 26 | `d-complexity-01` | 591 | Ran on Java 21 | Recommended | 1 | 1 | 3 (2 to pass) | 4 | 12/28/65/15 |
| 27 | `d-pointers-01` | 402 | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 28 | `d-sort-01` | 195 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 29 | `d-lru-02` | 264 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 30 | `d-recursion-01` | 202 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 31 | `d-graphs-01` | 264 (short) | Missing | Present | 2 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 32 | `d-greedy-01` | 184 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 33 | `b-security-01` | 189 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 34 | `b-deployment-01` | 174 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 35 | `ai-foundations-02` | 219 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 36 | `ai-prompting-01` | 194 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 37 | `ai-model-api-01` | 182 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 38 | `ai-embeddings-01` | 287 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 39 | `ai-rag-01` | 187 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 40 | `ai-evaluation-01` | 328 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 41 | `ai-tools-01` | 178 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 42 | `ai-security-01` | 185 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 43 | `ai-customization-01` | 188 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 44 | `h-case-up-01` | 184 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 45 | `l-review-01` | 186 (short) | Missing | — | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 46 | `j-jvm-02` | 299 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 47 | `b-di-02` | 256 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 48 | `b-security-02` | 304 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 49 | `h-api-01` | 232 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 50 | `h-queues-02` | 193 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 51 | `h-cloud-01` | 188 (short) | Missing | Recommended | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 52 | `d-backtracking-01` | 200 (short) | Missing | Recommended | 2 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 53 | `d-math-01` | 257 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |
| 54 | `ai-operations-03` | 205 (short) | Missing | Present | 1 | 1 | 3 (2 to pass) | 3 | 12/28/65/15 |

Day 1’s split is 45 Java/LLD, 25 HTTP, 20 AI, 15 DSA and 15 review. Days 2–54 split 12 revision, 28 teaching, 65 practice and 15 review. The 120-minute totals pass, and the subject-first 78/30 allocation fails on the entire baseline. D26’s recursion occupies 30 minutes inside its practice block rather than an independent daily lane. The repair plan assigns separate lanes and keeps the existing numeric day IDs until migration is ready.

See the [repair plan](curriculum-repair-plan.md) for distinct case studies, source-only gaps, the prerequisite audit, a revised 96-session allocation and the implementation status.
