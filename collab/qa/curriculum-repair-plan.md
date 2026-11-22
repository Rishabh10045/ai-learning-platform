# Study Desk curriculum repair plan

22 November 2026 IST. The [124-topic audit](curriculum-124-topic-audit.md) measures the original 54 sessions. The [73-item DSA audit](curriculum-dsa-coverage.md) enumerates the selected GFG DSA course in finer detail. Grok’s fixture findings remain useful for UI checks, and its content counts describe the fixture it reviewed.

## Whole paths, missing subtopics and scheduling consequences

| Requirement | Real baseline | Repair |
| --- | --- | --- |
| SQL and databases | A real subject on D12–15 and D20–21. PostgreSQL isolation, locks and EXPLAIN are taught. | Move SQL/JDBC ahead of Spring, keep guarded writes and pool practice, and add joins, grouping, windows, normalization, index shapes and NoSQL choices. |
| Redis and Kafka | D22 and D23 teach cache-aside/TTL and Kafka ordering/replay. D50 teaches outbox and compensations. | Add standalone Spring Redis and Spring Kafka labs with outage, retry, duplicate, deduplication and DLQ checks. |
| Microservices | D17, D49 and D50 teach neighboring concepts. | Add an end-to-end path covering discovery, Feign or WebClient, gateway and Resilience4j. Keep the source’s older Hystrix module as historical context with an explicit modern Java substitute. |
| Git, Docker, CI/CD and deploy | D9 teaches Maven. D34 and D51 include deployment and operations concepts. Git workflow is absent. | Start with a Git workflow lab and add Docker Compose, GitHub Actions, deployment with health gates, rollback, and instrumentation. |
| JUnit, Mockito and Testcontainers | Unit tests at D8, web validation checks at D11 and PostgreSQL integration at D16. | Add a reproducible Java project with JUnit 5 from core Java onward and a Spring suite distinguishing Mockito, web slice, persistence slice and Testcontainers. |
| End-to-end project | A planned Seat Booking capstone and a Java-first policy-help feature are present. Working integrations across all required dependencies are unverified. | Build and execute an integrated project on weekend stretch blocks, with an explicit readiness gate and CI evidence. Reuse its verified building blocks in the separate Splitwise and property-rental exercises. |
| Behavioral and project storytelling | D45 teaches an evidence-based project walkthrough. A STAR practice module is absent. | Schedule story drafting, project demo and behavioral feedback using real evidence. Include team conflict, measured trade-off, failure and ownership. |
| Mock interviews | D45 and the lesson coach offer individual interview practice. | Starting in week 3, rotate timed DSA, LLD machine coding, HLD, Java/Spring and behavioral mocks with rubrics. |
| Spaced revision | Previous-day notes and +3/+7 study-day links exist. Completion and failed-problem tracking are incomplete. | Record due/reviewed state keyed by stable lesson or problem ID at +1/+3/+7. Add a +21 optional maintenance revisit and weekly catch-up. |

## Prerequisite evidence and changes

| Prerequisite | 54-day result | Placement in revised plan |
| --- | --- | --- |
| SQL/JDBC before JPA | Pass. D12–15 precede D16. | DB and JDBC sessions 24–31. JPA later in Spring. |
| HTTP before REST | Pass for the introductory request trace on D1 before D10. Full methods/statuses are taught in D10. | Explicit HTTP methods, caching, idempotency and HTTP contracts in Java APIs before controllers. |
| LLM fundamentals before Spring AI | Pass. D1 and D35 precede D37. | Java model-input, token, context and structured-output bridge immediately before the Spring AI module. Full AI after HLD. |
| Generics before collections and streams | Partial. D4 uses typed collections and equality before formal generics at D6. | Move introductory generics/PECS before collection implementation and streams. OOP uses plain Java objects and can give a small early usage example. |
| Java concurrency before Spring async | Java concurrency taught, Spring async absent. | IO/CPU executors, futures and memory ordering in sessions 15–23. Spring async scheduled after those sessions. |
| Redis/Kafka before microservices and advanced HLD | Concept sequence exists across D22–23 and D49–50. Early two-process run D17 teaches the shared database. | Deploy the modular monolith first. Learn Redis and Kafka independently, then build a split service, then advance to HLD cases. |
| Testing precedes complexity | D8 teaches unit evidence, later tests are reinforced unevenly. | Introduce JUnit and Git in Java core. Add Spring slice/database tests alongside their layer and a module test after its last prerequisite. |

## Required cases

Keep one question, one diagram or trace, and distinct evaluation criteria for each case. `GfG + added` means a source case has added requirements. Adjacent cases can share code, and each gets its own problem definition and evidence.

| Track | Case coverage to schedule |
| --- | --- |
| LLD core and classic cases | Parking Lot (added), BookMyShow/movie booking (GfG LLD p. 3 + added multi-show/expiry), Airline Booking (GfG LLD p. 3), Splitwise (GfG Java 12–13/17), Elevator (added), LRU/LFU (GfG DSA class 12 LRU + added LFU), Rate Limiter (added LLD), Vending Machine (added), board game with selectable rules (added), Chess (added), Library Management (added), ATM (added), logger/notification with Observer or Chain of Responsibility (added), and Food Delivery (added). The existing one-seat capstone demonstrates a useful invariant. The other cases get separate work and acceptance checks. |
| HLD cases | URL Shortener (GfG H21–22), Realtime Chat (GfG H23–24), Rate Limiter (GfG H9/16/22 + added distributed case), News Feed (added), Notification Delivery (added), Video Streaming (added), Nearby/Rides (added), Ticketing (GfG LLD p. 3 + added scale case), Payments/e-wallet (GfG Java rental context + added independent ledger), Distributed Cache (GfG H5–6 + added system case), Web Crawler (added), Typeahead (added), Object Store (GfG H17 + added storage-system case). |

## Revised allocation · 96 proposed study sessions

Each learner day has one main lesson plus a Java DSA lane. Reserve 12 minutes for review, 78 for main teaching and practice, and 30 for DSA. Day 1 uses the 12-minute slot to introduce Java foundations. Monday through Friday total 120 minutes. Saturday and Sunday total 390 minutes with 270 minutes of project, case, mock or catch-up work. Continue the same required lesson after an unavailable day. 96 sessions give 192 core hours including 48 hours of Java DSA. This is a planning target to validate while authoring, with a protected final catch-up day.

| Slots | Count | Main lesson and exercises | Change to baseline |
| --- | ---: | --- | --- |
| 1–8 | 8 | Git/JDK setup and first object plus JUnit, JVM/bytecode/JIT, strings and values, OOP/substitution, records/immutability/sealed Java, exceptions/resources, generics/PECS, collections and ordering | Split D1/D4/D5/D6/D46 by prerequisite. Keep those IDs, add missing Java lessons. |
| 9–14 | 6 | Functional interfaces and refs, streams/laziness/flatMap/reduce, collectors and Optional, parallel streams, time and NIO, HTTP/HttpClient and request semantics | Extract D6 and D1 HTTP into focused content. Cover collection-dependent streams after generics. |
| 15–23 | 9 | Lifecycle/start/join, deterministic races, monitors/volatile/JMM, executor/pool bounds, atomics and locks, latches/barriers/semaphores, producer/consumer and concurrent collections, CompletableFuture, runtime diagnosis/deadlock/virtual threads | Deepen D2/D3/D7/D46. Put async Java before Spring async. |
| 24–31 | 8 | Schema, keys and normalization, joins/aggregates/subqueries, windows, JDBC/PreparedStatement/pools, ACID/MVCC/isolation, atomic writes/locks, indexes/EXPLAIN, relational vs NoSQL | Move and deepen D12–15/D21/D47 JDBC before Spring and JPA. |
| 32–46 | 15 | Maven and reproducibility, DI/bean lifecycle, auto-config/profiles, REST MVC, DTO validation/errors, pagination/version/OpenAPI, JDBC-to-JPA/N+1, transaction/lock integration, JUnit/Mockito/slices/Testcontainers, filters/credentials/CORS/CSRF, JWT/resource server, OAuth GitHub then Google comparison, async/scheduling, LLM fundamentals bridge, Spring AI structured output | Reorder D9–11/D16/D33/D36–37/D47–48. Keep HTTP before MVC and tokens before ChatClient. Teach Spring AOP at transaction/async boundaries. |
| 47–55 | 9 | Redis cache-aside and failure, Kafka pub/sub, Kafka replay/DLQ/outbox, gateway/discovery/Feign, resilience and rate-limiter integration, Docker Compose, CI/deploy/rollback, Actuator/Micrometer/tracing, integrated readiness gate | Reinforce D17/D20/D22–24/D34/D49–51 with executable integrations. |
| 56–69 | 14 | UML and SOLID in a first Parking Lot model, creational patterns with booking, structural patterns with airline inventory, behavioral patterns with Splitwise, Elevator, LRU/LFU, Rate Limiter, Vending Machine, board game, Chess, Library, ATM, logger/notification, Food Delivery | Reuse D8/D19/D29/D44 as building blocks. Extend UML, patterns and independent machines. Weekend labs handle longer implementations. |
| 70–86 | 17 | Four foundation sessions on estimation/contracts, consistency/sharding/hashing, caching/networking and distributed workflows/observability. Then thirteen independent case sessions in the order listed above. | Split D17–25/D44/D49–51 into proof-oriented foundations and separate cases. Mark source-only operations extensions below. |
| 87–94 | 8 | Transformer/attention and model selection, prompting/tuning decisions, embeddings/similarity, retrieval/chunking/hybrid/reranking, Java Spring AI RAG and evaluator, agent tools/MCP, defense and latency/cost, local/hosted deploy | Deepen D35–43/D54. Keep Python-specific vendor workflows labeled and teach Java equivalents for core capabilities. |
| 95–96 | 2 | Evidence-linked project/demo and behavioral review. Final reassessment, recovery and buffer. | Promote D45 and staged capstone verification to schedule gates. The final buffer day is included in 96. |

The DSA lane allocates 51 thirty-minute equivalents to the GFG gaps estimated in the granular audit, 15 to existing patterns plus retrieval practice, 19 to added interview patterns, and 11 to mixed drills, reassessment and buffer. The 51 is an estimate of missing or partial work, including short lessons that can share a slot. This allocation is a starting budget to confirm against runnable exercise duration.

| DSA progression | Teach and test |
| --- | --- |
| Foundations | Complexity, arrays, number bases/bit operations, prime/sieve/GCD/LCM, rotation, prefix/suffix, Kadane, majority vote. |
| Selection | Hashing, pair/triplet, fixed/variable windows, monotone feasibility and binary search on the answer, elementary/efficient sorting, matrices, merged intervals/meeting rooms. |
| Structures and recursion | Base cases and stack, Hanoi, combinatorics, maze/queens/Sudoku, singly/doubly/circular lists, Floyd cycle/midpoint, stack/queue/deque, monotone stack, LRU/LFU/min-stack. |
| Trees and graphs | BST/height/LCA/diameter, heaps/top-K/two-heaps/merge, BFS/DFS/flood fill, topological sorting, Dijkstra with negative-edge caveat, Union-Find/Kruskal, added shortest path or prefix-tree exercises. |
| Optimization | Activity selection, fractional/0-1/unbounded knapsack, coin-change variants, LIS/LCS/LPS, edit distance, partition, MCM and palindrome partitioning. |
| Retrieval | Mixed sets, 1/3/7 due reviews, timed rounds and retry on previously missed variants. |

## Source obligations beyond the 124 checklist

This supplement records independently confirmed omissions and outline-specific cases. Each selected GFG row stays part of the audit scope, with the cited source and status. Full line-by-line reconciliation of the non-DSA syllabi continues under the checkpoint. These obligations use teaching, exercises and verified evidence as completion criteria.

| Source or independent reference | Confirmed gap or correction | Plan location |
| --- | --- | --- |
| GFG Java 2/7/9/10 | Finally and hierarchy in detail, Maven plugins/archetypes, Lombok trade-offs, and JDBC Template CRUD beyond a RowMapper | Java resources, Spring Maven/config, SQL/JDBC |
| GFG Java 12–13/17 | Expense creation, settlement, user/group management and Redis/Security/test integration as a separate Splitwise project | LLD Splitwise plus weekend backend implementation |
| GFG Java 18 | GitHub provider login, with consent and scope. Google login is independently added. | Spring OAuth session |
| GFG Java 19–24 | Feign, Spring Cloud configuration, Kafka integration, service-level deployment, independent property search and booking/rental project | Spring integrations then property rental weekend project |
| GFG System Design 3–8 | PACELC, Consistent Hashing, multi-tier and geo caches, Redis Cluster versus Memcached, broker alternatives and CQRS | Foundation sessions and cache/distributed cases |
| GFG System Design 9–16 | GraphQL subscriptions and webhook delivery, service discovery, jitter/circuit breaker, observability tracing and applicable data-protection boundaries | API, operations and HLD foundation/project labs |
| GFG System Design 17–20 | AWS and VPC pieces, deployment strategies, Kubernetes, platform/GitOps, serverless and edge | Core roles in deploy/hld sessions and individually cited weekend extension labs. Retain specific source concepts until checked. |
| GFG System Design 21–24 | Production URL shortener and chat, including ID/TTL/analytics, persistence/receipts/fan-out and production cases | Independent HLD capstones |
| GFG LLD/HLD PDF 2–3 | Constructors, UML activity/object/state notation, GRASP, Bridge, Template and Iterator; separately teach movie and airline booking | Java/LLD and separate case practice |
| GFG current AI modules 1–3 | Feedforward/backpropagation, transformer attention, model ecosystem, transfer and LoRA/quantization | LLM foundation and tuning sessions with Java inference |
| GFG current AI modules 4–9 | Prompts, orchestration, vector retrieval, hybrid/rerank/query decomposition and advanced RAG cases | Prompt and RAG sessions. Source tooling and Java substitutions each get clear labels. |
| GFG current AI modules 10–16 and bonus | Ollama, agent frameworks/memory/MCP, review agents, evaluation tools, semantic cache/router, containerization and demo | Java-first agent/evaluation/production sessions and weekend capstone. Label Python-only framework practice and provide a Java lab for the capability. |
| GFG DSA Class 23 · plus independent counterexample | Largest-first coin change can fail. With 1/3/4 and target 6 it uses three coins while 3+3 uses two. | Corrected Day 32 teaching; a dedicated minimum-coin coding slot remains in the DSA plan. |
| Princeton Union–Find and MST | Selected GFG DSA Track 1 does not explicitly list Union-Find or MST and the original lessons omitted both. | Implemented Day 55, `d-union-find-01`, `source: added`. |
| Java/Spring/architecture interviews · added | CompletableFuture, records/sealed classes, Spring async, typed configuration, bounded timeouts, safe deployment practice, LCA/trie/LIS and truthful behavioral storytelling | Required independent rows in the 124-topic audit. Use official Java/Spring and independent algorithm references during authorship. |

[Princeton Union–Find](https://algs4.cs.princeton.edu/15uf/) · [Princeton minimum spanning trees](https://algs4.cs.princeton.edu/43mst/) · [Spring Boot reference](https://docs.spring.io/spring-boot/reference/) · [Java 21 documentation](https://docs.oracle.com/en/java/javase/21/)

## Release criteria and current implementation

- Deepen all 51 baseline lessons below 400 words with worked material. Give code-heavy lessons runnable Java; provide checked SQL, manifests or structured design exercises where that is the appropriate executable artifact. The lesson table flags 53 baseline lessons without confirmed runnable Java, including a Day 1 fragment that assumes a service. Pair real references with useful on-topic takeaways and verified watch segments when available.
- Add exact diagrams for state, concurrency, transfer and architecture where indicated. Give each assignment one success, failure and boundary check. Grow quizzes to 4–6 items with a pass mark of at least 70% and add module tests after their lessons. Preserve earlier pass history when quiz banks change.
- Build one weekend project increment at a time: Spring REST + Postgres/JPA, authorization/OAuth and tests, Redis under contention, Kafka plus transactional outbox/replay, Compose and deployment with observability, and a Spring AI RAG endpoint whose failure does not change booking outcomes. Finish with checked commands from a clean clone and evidence for rollback, concurrency and provider failure.
- Implement v2 schedule migration with a mapping from every old stable lesson ID, numeric day, progress record and evidence item. Preserve the IDs when lesson order changes. Existing users' settings stay in effect. Grok owns UI and the v2 adapter coordination.
- Current branch implements Day 55 with Java, a walkthrough, a scenario quiz and interview answers, the Day 32 correction, and the 390-minute Saturday default for new profiles. The 96-slot allocation is a revised plan. Remaining lessons, migration, complete external source reconciliation and live deployment are tracked as open work.
