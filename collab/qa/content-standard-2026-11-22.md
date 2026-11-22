# Study Desk content standard and backend requirements (22 Nov 2026, IST)

Prepared by Grok for Deepak and GPT. The repo is `Rishabh10045/ai-learning-platform`.

**What was audited**
- At 09:05 IST on 22 Nov, `origin` has only `main`, `grok/lesson-ui`, `grok/lesson-ui-2` and `grok/subject-first`.
- GPT's backend and 54-session curriculum are **still not on GitHub**, so nothing of GPT's could be audited.
- What was audited:
  - the 42-session **example** course in `ui/fixtures/course.fixture.js` on `grok/subject-first` (PR #3, not merged)
  - the data contract in `ui/README.md` (Course contract v2 / Progress v2)

**Sources used to mark GfG vs added**
- GfG Java Backend Development (JBDL) course page, https://www.geeksforgeeks.org/courses/java-backend-live: skills, tech stack, projects, Sessions 1–4.
- GfG's published 12-week JBDL session list (S1–S24), https://www.geeksforgeeks.org/blogs/best-online-courses-with-certifications/.
- GfG System Design course modules 1–4, https://www.geeksforgeeks.org/courses/system-design-training-program.
- GfG Mastering System Design topic list (LLD: OOP, principles, patterns; HLD: requirements, data modelling, LB, proxies, WebSockets, microservices, OAuth/JWT, CDN, caching, DNS, HTTPS, hashing).
- The GfG "AI Toolkit for Developers" module list: prompting, spec-driven development, RAG/embeddings/vector DBs, and an evaluation framework covering accuracy, context, cost and latency.
- "added" means interviews expect the topic but the GfG pages do not list it.
- Session numbers like "S16" refer to that GfG list.

Nothing here was committed or pushed. Files:
- this document
- `/workspace/qa/content-standard/hashmap-internals.topic.json`: the sample topic, valid JSON
- `/workspace/qa/hm/*.java`: the 3 sample programs, run on JDK 21 with the outputs shown in the sample

---

## TL;DR

1. **The index is about 26 % complete.** Against a recommended index of **164 topics in 13 subjects** (DSA in Java is assessed separately):
   - **26** are covered as a lesson
   - **42** appear only as a one-line mention
   - **96 (59 %) are missing**

   Whole subjects are absent:
   - Redis/Kafka/microservices (0/9 full)
   - Git/Docker/CI-CD/deploy (0/7)
   - Projects (0/7)
   - Interview readiness/behavioural (0/6)
   - Mock interviews (0/5 full)

   Testing is a single lesson.
2. **Depth is bare minimum on every topic, 0 of 85 lessons meet even the "light" standard below.**
   - Notes average **18.8 words** (max 36).
   - There are **0 code examples** and 10 one-line flow "diagrams".
   - **0 verified videos**: all 85 are YouTube *search* links.
   - Quizzes: **1 question per lesson** with 2–3 options and no explanations, and none on DSA.
   - **0 interview questions with model answers**: there are 85 one-line "explain X" prompts.
   - 1–2 revision bullets per lesson.
   - 0 flashcards, cheat sheets, prerequisites, common mistakes or confidence ratings.
3. **The per-topic numbers I decided are in §3.** Topics are weighted **Core / Standard / Light**:
   - Notes: 1200 / 700 / 350 words
   - Interview questions: 10 / 6 / 4
   - MCQs: 8 / 6 / 4 (pass 75 %)
   - Coach takeaways: 7 / 6 / 5
   - Flashcards: 8 / 5 / 3, revised at 1/3/7/21 days
   - My takeaways: required before "Complete", at least 3 bullets and 30 words, shown first, with the coach's takeaways revealed after you save yours

   A fully filled sample (HashMap internals) is in §3.4 and in the separate JSON file.
4. **At this depth the full index needs about 14 weeks (~247 h of main-subject study, DSA extra), not 54 sessions.** §1.15 does the arithmetic. The choices are:
   - **A (recommended):** ~14–15 weeks at full depth.
   - **B:** a Core-first plan of ~54 sessions. Standard topics get a 25-min quick format and Light topics are dropped. Even this realistically needs ~9 weeks.
5. **The backend is missing everything engagement needs** (§4):
   - per-stage topic progress
   - an activity log with `lastActiveAt`
   - points ledger, streaks and badges
   - attempt history for MCQs, tests and mocks
   - spaced-repetition state
   - notification preferences and a send log
   - server-side progress sync
6. **Email nudges every 2–3 h are feasible for free** (§5).
   - **Recommended:** a *private* GitHub repo `study-desk-data` holding the synced `progress.json`, plus a GitHub Actions cron (hourly, `timezone: Asia/Kolkata`) that sends through Gmail SMTP with an app password. Quiet hours 00:00–06:00 IST, at most 6 nudges a day.
   - If GPT's account-sync backend has a database, the same cron reads that instead.
   - **What Deepak must provide:** the target email, a Gmail app password, the private repo, and a fine-grained token.

---

## 1. Course index audit (all subjects)

**Legend.**
- **Weight:** Core (high-frequency in interviews, deep), Standard, or Light.
- **Source:** GfG or added.
- **Current:**
  - ✅ means a lesson exists. It is still bare-minimum depth (see §2).
  - ⚠ means the topic is only a phrase inside another lesson's one-line note.
  - ❌ means it is not in the index.

Testing sits inside Spring Boot, plus JUnit practice in projects. Git, Docker, CI/CD and deployment form their own subject.

### 1.0 Summary

| Subject | Topics (C/S/L) | ✅ lesson | ⚠ one-liner | ❌ missing |
|---|---|---|---|---|
| Java core | 24 (8/13/3) | 4 | 7 | **13** |
| Streams & Java APIs | 10 (2/3/5) | 5 | 2 | **3** |
| Concurrency | 14 (7/6/1) | 3 | 4 | **7** |
| SQL & JDBC | 10 (5/3/2) | 1 | 5 | **4** |
| Spring Boot | 22 (9/10/3) | 6 | 9 | **7** |
| Redis, Kafka & microservices | 9 (3/6/0) | 0 | 1 | **8** |
| Git, build, Docker, CI/CD & deployment | 7 (0/5/2) | 0 | 0 | **7** |
| Low-level design | 14 (6/6/2) | 2 | 4 | **8** |
| High-level design | 23 (11/9/3) | 3 | 5 | **15** |
| GenAI & LLMs | 13 (4/9/0) | 2 | 4 | **7** |
| Projects | 7 (3/4/0) | 0 | 0 | **7** |
| Interview readiness & behavioral | 6 (1/3/2) | 0 | 0 | **6** |
| Mock interviews | 5 (0/4/1) | 0 | 1 | **4** |
| **Total (excl. DSA)** | **164** (59/81/24) | **26** | **42** | **96 (59 %)** |

Subjects missing entirely: **Redis/Kafka/microservices** (only Kafka is mentioned, as a one-liner in HLD-04), **Git/Docker/CI-CD/deploy**, **Projects**, **Interview readiness/behavioural**, and **Mock interviews** (only the DSA timed sets exist).

### 1.1 Java core
Source basis: GfG JBDL S1–S4, S6 + Master Java; Java 17/21 items added.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| JVM & language basics | JDK/JRE/JVM, bytecode, class loading, JIT | Standard | GfG | ✅ JC-01 (bare) |
|  | Primitives vs wrappers, autoboxing, Integer cache | Standard | GfG | ⚠ one-liner in JC-02 |
|  | Pass-by-value semantics | Light | added | ❌ missing |
|  | String immutability, String pool, StringBuilder/StringBuffer | Core | GfG | ❌ missing |
|  | static, final, this/super, constructors, init order | Standard | GfG | ❌ missing |
| OOP | Classes, objects, encapsulation | Standard | GfG | ✅ JC-03 (bare) |
|  | Inheritance, polymorphism, overloading vs overriding rules | Core | GfG | ⚠ one-liner in JC-04 |
|  | Abstract class vs interface, default/static methods | Core | GfG | ⚠ one-liner in JC-04 |
|  | Immutability (final class, defensive copies) and records | Core | added | ❌ missing |
|  | Composition over inheritance | Light | added | ❌ missing |
| Exceptions | Checked vs unchecked, hierarchy, finally/return, propagation | Core | GfG | ⚠ one-liner in JC-06 |
|  | try-with-resources, custom exceptions, exception best practices | Standard | GfG | ❌ missing |
| Generics & collections | Generics: bounded types, wildcards, PECS, type erasure | Standard | GfG | ✅ JC-07 (bare) |
|  | Collections framework overview: List/Set/Map/Queue, ArrayList vs LinkedList | Standard | GfG | ✅ JC-05 (bare) |
|  | HashMap internals (hashing, treeify, resize) | Core | GfG | ⚠ one-liner in JC-05 |
|  | equals/hashCode contract, Comparable vs Comparator | Core | GfG | ⚠ one-liner in JC-06 |
|  | LinkedHashMap (LRU), TreeMap, sets, iterators (fail-fast vs fail-safe) | Standard | GfG | ❌ missing |
|  | Queue, Deque, PriorityQueue | Standard | GfG | ❌ missing |
| JVM memory & modern Java | Stack vs heap, GC basics (G1/ZGC), memory leaks, OOM types | Core | added | ❌ missing |
|  | Java 17/21: records, sealed, pattern matching, switch expressions, text blocks, var | Standard | added | ⚠ one-liner in JC-02 |
|  | Reflection and annotations (how Spring uses them) | Standard | added | ❌ missing |
|  | Serialization, transient, Cloneable pitfalls | Light | added | ❌ missing |
|  | Singleton (thread-safe, enum) in Java | Standard | GfG | ❌ missing |
|  | Build tools: Maven basics (pom, lifecycle, dependencies) | Standard | GfG | ❌ missing |

**Missing from the current index (13):** Pass-by-value semantics; String immutability, String pool, StringBuilder/StringBuffer; static, final, this/super, constructors, init order; Immutability (final class, defensive copies) and records; Composition over inheritance; try-with-resources, custom exceptions, exception best practices; LinkedHashMap (LRU), TreeMap, sets, iterators (fail-fast vs fail-safe); Queue, Deque, PriorityQueue; Stack vs heap, GC basics (G1/ZGC), memory leaks, OOM types; Reflection and annotations (how Spring uses them); Serialization, transient, Cloneable pitfalls; Singleton (thread-safe, enum) in Java; Build tools: Maven basics (pom, lifecycle, dependencies).

### 1.2 Streams & Java APIs
Source basis: GfG JBDL S3–S4.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Functional Java | Lambdas, functional interfaces, method references | Standard | GfG | ✅ SA-01 (bare) |
|  | Stream pipeline, laziness, short-circuiting; map vs flatMap; reduce | Core | GfG | ✅ SA-02 (bare) |
|  | Collectors: groupingBy, partitioningBy, toMap (merge), joining | Core | GfG | ✅ SA-03 (bare) |
|  | Optional: right and wrong uses | Standard | GfG | ⚠ one-liner in SA-03 |
|  | Primitive streams, iterate/generate | Light | GfG | ⚠ one-liner in SA-02 |
|  | Parallel streams, ForkJoin common pool, when not to use | Standard | GfG | ❌ missing |
|  | Side effects and stateful lambdas pitfalls | Light | added | ❌ missing |
| Useful APIs | java.time (LocalDate, ZonedDateTime, Instant, Duration) | Light | added | ✅ SA-04 (bare) |
|  | HttpClient | Light | added | ✅ SA-04 (bare) |
|  | File I/O and NIO (Files, Path) | Light | GfG | ❌ missing |

**Missing from the current index (3):** Parallel streams, ForkJoin common pool, when not to use; Side effects and stateful lambdas pitfalls; File I/O and NIO (Files, Path).

### 1.3 Concurrency
Source basis: GfG JBDL S5; JMM/virtual threads added.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Threads & safety | Thread lifecycle, Runnable/Callable, start vs run | Standard | GfG | ✅ CC-01 (bare) |
|  | Race conditions, synchronized, volatile | Core | GfG | ✅ CC-02 (bare) |
|  | Java Memory Model, happens-before, safe publication, double-checked locking | Core | added | ❌ missing |
|  | wait/notify, producer-consumer, BlockingQueue | Core | GfG | ❌ missing |
|  | Deadlock, livelock, starvation: detection and prevention | Standard | GfG | ❌ missing |
| Executors & utilities | ExecutorService, pool sizing (CPU vs IO), rejection policies, shutdown | Core | GfG | ⚠ one-liner in CC-03 |
|  | ReentrantLock, ReadWriteLock, Condition, tryLock, fairness | Standard | GfG | ⚠ one-liner in CC-04 |
|  | Atomics/CAS, ABA, LongAdder | Standard | added | ⚠ one-liner in CC-04 |
|  | ConcurrentHashMap internals, CopyOnWriteArrayList | Core | GfG | ⚠ one-liner in CC-04 |
|  | CountDownLatch, CyclicBarrier, Semaphore | Standard | added | ❌ missing |
|  | ThreadLocal and leaks in pools | Light | added | ❌ missing |
| Async & modern | CompletableFuture (thenApply/thenCompose/allOf, exceptionally, executors) | Core | added | ✅ CC-05 (bare) |
|  | Virtual threads (Java 21), structured concurrency, pinning | Standard | added | ❌ missing |
|  | Classic coding: odd/even printer, bounded buffer, thread-safe LRU, rate limiter | Core | added | ❌ missing |

**Missing from the current index (7):** Java Memory Model, happens-before, safe publication, double-checked locking; wait/notify, producer-consumer, BlockingQueue; Deadlock, livelock, starvation: detection and prevention; CountDownLatch, CyclicBarrier, Semaphore; ThreadLocal and leaks in pools; Virtual threads (Java 21), structured concurrency, pinning; Classic coding: odd/even printer, bounded buffer, thread-safe LRU, rate limiter.

### 1.4 SQL & JDBC
Source basis: GfG JBDL S11 (JDBC), MySQL in tech stack; GfG System Design M3–M4.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| SQL querying | Joins, group by/having, subqueries | Core | GfG | ⚠ one-liner in DB-01 |
|  | Window functions, top-N per group, Nth highest salary | Core | added | ⚠ one-liner in DB-01 |
| Design & performance | Keys, constraints, normalization (1NF–BCNF) vs denormalization | Standard | GfG | ❌ missing |
|  | Indexes: B-tree, composite/leftmost prefix, covering, EXPLAIN | Core | GfG | ⚠ one-liner in DB-02 |
|  | Transactions: ACID, isolation levels, anomalies, MVCC | Core | GfG | ⚠ one-liner in DB-02 |
|  | Locking: row/table, SELECT … FOR UPDATE, optimistic vs pessimistic, deadlocks | Core | added | ❌ missing |
|  | SQL vs NoSQL; key-value/document/wide-column | Standard | GfG | ❌ missing |
| JDBC | JDBC: Connection, PreparedStatement, SQL injection, batching | Standard | GfG | ✅ DB-03 (bare) |
|  | Connection pooling (HikariCP) | Light | GfG | ⚠ one-liner in DB-03 |
|  | Schema migrations (Flyway/Liquibase) | Light | added | ❌ missing |

**Missing from the current index (4):** Keys, constraints, normalization (1NF–BCNF) vs denormalization; Locking: row/table, SELECT … FOR UPDATE, optimistic vs pessimistic, deadlocks; SQL vs NoSQL; key-value/document/wide-column; Schema migrations (Flyway/Liquibase).

### 1.5 Spring Boot
Source basis: GfG JBDL S7–S10, S12, S15–S17, S19–S21, S24.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Spring core | IoC/DI, bean scopes, bean lifecycle, constructor injection, circular deps | Core | GfG | ⚠ one-liner in SB-01 |
|  | Auto-configuration, starters, @Conditional, profiles, @ConfigurationProperties | Standard | GfG | ⚠ one-liner in SB-01 |
|  | AOP and proxies (why self-invocation skips @Transactional) | Core | GfG | ❌ missing |
|  | Lombok and logging (SLF4J/Logback) | Light | GfG | ❌ missing |
| REST APIs | HTTP for APIs: methods, status codes, idempotency | Standard | added | ✅ SB-09 (bare) |
|  | Controllers, DTOs, validation (@Valid), @ControllerAdvice/ProblemDetail | Core | GfG | ✅ SB-02 (bare) |
|  | Pagination/sorting, versioning, OpenAPI/Swagger | Standard | added | ❌ missing |
| Persistence | JPA/Hibernate entities, relationships, lazy vs eager | Core | GfG | ✅ SB-03 (bare) |
|  | N+1 problem: fetch join, EntityGraph, batch size | Core | GfG | ⚠ one-liner in SB-04 |
|  | @Transactional: propagation, isolation, rollback rules, readOnly | Core | GfG | ⚠ one-liner in SB-04 |
|  | Optimistic (@Version) vs pessimistic locking in JPA | Standard | added | ❌ missing |
| Testing | JUnit 5 + Mockito unit tests | Core | GfG | ⚠ one-liner in SB-05 |
|  | Slice tests (@WebMvcTest, @DataJpaTest) and Testcontainers | Standard | added | ⚠ one-liner in SB-05 |
| Security | Security filter chain, authN/authZ, password encoding, RBAC, CORS/CSRF | Core | GfG | ⚠ one-liner in SB-06 |
|  | JWT + OAuth2 resource server, refresh tokens | Core | GfG | ⚠ one-liner in SB-06 |
|  | OAuth2 login (Google/GitHub), authorization code + PKCE | Standard | GfG | ✅ SB-07 (bare) |
| Production features | @Async, @Scheduled, TaskExecutor config | Standard | added | ❌ missing |
|  | Actuator, health/readiness, Micrometer metrics, structured logs, tracing | Standard | GfG | ❌ missing |
|  | Rate limiting (Bucket4j / gateway) | Light | added | ❌ missing |
| Spring AI | LLM basics for Spring developers | Light | added | ✅ SB-10 (bare) |
|  | Spring AI ChatClient, prompt templates, structured output | Standard | GfG | ✅ SB-08 (bare) |
|  | Spring AI advisors, tool calling, VectorStore, MCP | Standard | added | ⚠ one-liner in GEN-04 |

**Missing from the current index (7):** AOP and proxies (why self-invocation skips @Transactional); Lombok and logging (SLF4J/Logback); Pagination/sorting, versioning, OpenAPI/Swagger; Optimistic (@Version) vs pessimistic locking in JPA; @Async, @Scheduled, TaskExecutor config; Actuator, health/readiness, Micrometer metrics, structured logs, tracing; Rate limiting (Bucket4j / gateway).

### 1.6 Redis, Kafka & microservices
Source basis: GfG JBDL S16, S20, S21 + Airbnb project.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Caching | Redis data structures, TTL, eviction policies | Standard | GfG | ❌ missing |
|  | Spring Cache + Redis (@Cacheable, cache-aside, invalidation, stampede) | Core | GfG | ❌ missing |
| Messaging | Kafka basics: topics, partitions, ordering, consumer groups, offsets | Core | GfG | ⚠ one-liner in HLD-04 |
|  | Spring Kafka: producer/consumer, retries, DLQ, idempotent consumer, outbox | Core | GfG | ❌ missing |
| Microservices | Monolith vs microservices, service boundaries | Standard | GfG | ❌ missing |
|  | Spring Cloud Gateway, service discovery, config server | Standard | GfG | ❌ missing |
|  | Resilience4j: circuit breaker, retry, timeout, bulkhead | Standard | added | ❌ missing |
|  | Inter-service calls: Feign/WebClient, REST vs gRPC vs events | Standard | added | ❌ missing |
|  | Saga pattern and distributed transactions | Standard | GfG | ❌ missing |

**Missing from the current index (8):** Redis data structures, TTL, eviction policies; Spring Cache + Redis (@Cacheable, cache-aside, invalidation, stampede); Spring Kafka: producer/consumer, retries, DLQ, idempotent consumer, outbox; Monolith vs microservices, service boundaries; Spring Cloud Gateway, service discovery, config server; Resilience4j: circuit breaker, retry, timeout, bulkhead; Inter-service calls: Feign/WebClient, REST vs gRPC vs events; Saga pattern and distributed transactions.

### 1.7 Git, build, Docker, CI/CD & deployment
Source basis: GfG JBDL tech stack (Git & GitHub), S6 Maven, S24 deployment, Airbnb containerized deploy; GfG System Design (GitHub Actions, Prometheus, Grafana).

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Tooling | Git: branching, rebase vs merge, PRs, resolving conflicts | Standard | GfG | ❌ missing |
|  | Maven/Gradle builds, dependency management, profiles | Light | GfG | ❌ missing |
| Ship it | Docker: Dockerfile for Spring Boot, layers, docker-compose (app+MySQL+Redis+Kafka) | Standard | GfG | ❌ missing |
|  | CI/CD with GitHub Actions: build, test, image push | Standard | GfG | ❌ missing |
|  | Deploying a Spring Boot app (cloud VM/PaaS), env config and secrets | Standard | GfG | ❌ missing |
|  | Observability: logs, metrics (Prometheus/Grafana), traces, alerts | Standard | GfG | ❌ missing |
|  | Kubernetes basics (pods, deployments, services) | Light | GfG | ❌ missing |

**Missing from the current index (7):** Git: branching, rebase vs merge, PRs, resolving conflicts; Maven/Gradle builds, dependency management, profiles; Docker: Dockerfile for Spring Boot, layers, docker-compose (app+MySQL+Redis+Kafka); CI/CD with GitHub Actions: build, test, image push; Deploying a Spring Boot app (cloud VM/PaaS), env config and secrets; Observability: logs, metrics (Prometheus/Grafana), traces, alerts; Kubernetes basics (pods, deployments, services).

### 1.8 Low-level design
Source basis: GfG Mastering System Design (LLD): OOP, principles, patterns, UML.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Foundations | Class relationships, UML class + sequence diagrams | Standard | GfG | ❌ missing |
|  | SOLID | Core | GfG | ✅ LLD-01 (bare) |
|  | DRY/KISS/YAGNI, GRASP | Light | GfG | ❌ missing |
| Design patterns | Creational: Factory, Abstract Factory, Builder, Singleton, Prototype | Core | GfG | ⚠ one-liner in LLD-02 |
|  | Structural: Adapter, Decorator, Facade, Proxy, Composite | Standard | GfG | ⚠ one-liner in LLD-03 |
|  | Behavioral: Strategy, Observer, Command, State, Chain of Responsibility, Template | Core | GfG | ⚠ one-liner in LLD-03 |
| Machine coding | Approach: requirements → entities → APIs → classes → code → concurrency → extensibility | Core | added | ⚠ one-liner in LLD-04 |
|  | Case: parking lot | Standard | GfG | ✅ LLD-04 (bare) |
|  | Case: BookMyShow seat booking (seat locking) | Core | GfG | ❌ missing |
|  | Case: Splitwise (split strategies, simplify debts) | Core | GfG | ❌ missing |
|  | Case: elevator system | Standard | added | ❌ missing |
|  | Case: LRU cache (thread-safe) | Standard | added | ❌ missing |
|  | Case: rate limiter / logger / notification system | Standard | added | ❌ missing |
|  | Case: vending machine / Snake & Ladder / Tic-Tac-Toe | Light | added | ❌ missing |

**Missing from the current index (8):** Class relationships, UML class + sequence diagrams; DRY/KISS/YAGNI, GRASP; Case: BookMyShow seat booking (seat locking); Case: Splitwise (split strategies, simplify debts); Case: elevator system; Case: LRU cache (thread-safe); Case: rate limiter / logger / notification system; Case: vending machine / Snake & Ladder / Tic-Tac-Toe.

### 1.9 High-level design
Source basis: GfG System Design course M1–M4 + caching, APIs, microservices, Kafka, chat case study.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Framework & basics | Interview framework: FR/NFR, estimates, API, data model, deep dives | Core | GfG | ❌ missing |
|  | Back-of-envelope estimation (QPS, storage, bandwidth) | Standard | GfG | ⚠ one-liner in HLD-01 |
|  | DNS, CDN, proxies, HTTP/HTTPS/TLS, WebSockets/SSE/long polling | Standard | GfG | ⚠ one-liner in HLD-01 |
| Scalability | Scaling, stateless services, load balancers (L4/L7, algorithms) | Core | GfG | ✅ HLD-02 (bare) |
|  | Caching strategies, eviction, stampede, invalidation | Core | GfG | ⚠ one-liner in HLD-02 |
|  | Replication, sharding, hot keys | Core | GfG | ✅ HLD-03 (bare) |
|  | Consistent hashing | Core | GfG | ❌ missing |
|  | CAP, PACELC, consistency models | Core | GfG | ⚠ one-liner in HLD-04 |
|  | Queues, Kafka semantics, delivery guarantees | Core | GfG | ⚠ one-liner in HLD-04 |
| Reliability | Idempotency keys, retries with backoff + jitter, timeouts | Core | added | ❌ missing |
|  | Rate limiting algorithms, distributed rate limiter | Standard | GfG | ❌ missing |
|  | Microservices patterns: gateway, discovery, saga, circuit breaker, CQRS/event sourcing | Standard | GfG | ❌ missing |
|  | Distributed IDs (Snowflake), leader election, consensus overview | Light | added | ❌ missing |
|  | Blob storage, search (inverted index) | Light | GfG | ❌ missing |
|  | Observability, SLO/SLA/SLI, alerting; DR and multi-region | Standard | added | ❌ missing |
| Case studies | URL shortener | Standard | GfG | ✅ HLD-05 (bare) |
|  | Rate limiter service | Standard | added | ❌ missing |
|  | Chat system (WhatsApp) | Core | GfG | ❌ missing |
|  | News feed / Twitter timeline | Core | added | ❌ missing |
|  | Notification service | Standard | added | ❌ missing |
|  | Ticket booking / payment system | Core | added | ❌ missing |
|  | File storage (Dropbox) / video (YouTube) | Standard | GfG | ❌ missing |
|  | Nearby / ride-hailing (geohash) | Light | added | ❌ missing |

**Missing from the current index (15):** Interview framework: FR/NFR, estimates, API, data model, deep dives; Consistent hashing; Idempotency keys, retries with backoff + jitter, timeouts; Rate limiting algorithms, distributed rate limiter; Microservices patterns: gateway, discovery, saga, circuit breaker, CQRS/event sourcing; Distributed IDs (Snowflake), leader election, consensus overview; Blob storage, search (inverted index); Observability, SLO/SLA/SLI, alerting; DR and multi-region; Rate limiter service; Chat system (WhatsApp); News feed / Twitter timeline; Notification service; Ticket booking / payment system; File storage (Dropbox) / video (YouTube); Nearby / ride-hailing (geohash).

### 1.10 GenAI & LLMs
Source basis: GfG AI Toolkit for Developers (prompting, RAG, evaluation) + GfG GenAI tutorials.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Foundations | Neural nets → transformers: attention intuition | Standard | GfG | ❌ missing |
|  | Tokens, context window, temperature/top-p | Standard | GfG | ✅ GEN-01 (bare) |
|  | Prompt engineering: zero/few-shot, CoT, structured output | Standard | GfG | ✅ GEN-02 (bare) |
|  | Hallucinations and mitigation | Standard | GfG | ❌ missing |
| Building apps | Embeddings, similarity, vector DBs, ANN (HNSW) | Core | GfG | ⚠ one-liner in GEN-03 |
|  | RAG: chunking, hybrid search, reranking, citations, failure modes | Core | GfG | ⚠ one-liner in GEN-04 |
|  | Tool/function calling, agents (ReAct), memory | Core | GfG | ❌ missing |
|  | MCP (Model Context Protocol) | Standard | added | ❌ missing |
|  | Fine-tuning vs RAG vs prompting (LoRA concept) | Standard | GfG | ❌ missing |
| Production | Evals: golden sets, LLM-as-judge, RAG metrics | Standard | GfG | ⚠ one-liner in GEN-05 |
|  | Guardrails, prompt injection, PII | Standard | GfG | ⚠ one-liner in GEN-05 |
|  | Cost and latency: caching, streaming, model routing | Standard | GfG | ❌ missing |
|  | GenAI system design: RAG support bot at scale | Core | added | ❌ missing |

**Missing from the current index (7):** Neural nets → transformers: attention intuition; Hallucinations and mitigation; Tool/function calling, agents (ReAct), memory; MCP (Model Context Protocol); Fine-tuning vs RAG vs prompting (LoRA concept); Cost and latency: caching, streaming, model routing; GenAI system design: RAG support bot at scale.

### 1.11 Projects
Source basis: GfG JBDL projects: Splitwise, Splitwise + AI agents (JUnit, Redis, Security RBAC), Airbnb backend (Gateway, containers, monitoring).

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Project 1: Splitwise backend (weekend stretch) | Requirements, HLD, data model, API spec | Standard | GfG | ❌ missing |
|  | Core flows: users, groups, expenses, settle up (JPA + REST + validation) | Core | GfG | ❌ missing |
|  | Hardening: JUnit/Mockito + Testcontainers, Redis cache, Spring Security RBAC | Core | GfG | ❌ missing |
|  | Docker + GitHub Actions + deploy, README with architecture diagram | Standard | GfG | ❌ missing |
| Project 2: booking backend (microservices) or Splitwise+AI | Booking with seat/room locking, idempotent payments (saga), Kafka events | Core | GfG | ❌ missing |
|  | Spring AI feature: RAG over expenses/listings or an agent with tools | Standard | added | ❌ missing |
|  | Observability and load test; write-up for interviews | Standard | added | ❌ missing |

**Missing from the current index (7):** Requirements, HLD, data model, API spec; Core flows: users, groups, expenses, settle up (JPA + REST + validation); Hardening: JUnit/Mockito + Testcontainers, Redis cache, Spring Security RBAC; Docker + GitHub Actions + deploy, README with architecture diagram; Booking with seat/room locking, idempotent payments (saga), Kafka events; Spring AI feature: RAG over expenses/listings or an agent with tools; Observability and load test; write-up for interviews.

### 1.12 Interview readiness & behavioral
Source basis: added (GfG lists biweekly soft-skills sessions only).

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Story bank | Resume walkthrough and 'tell me about yourself' (2 min) | Standard | added | ❌ missing |
|  | Project deep-dive: architecture, trade-offs, numbers | Core | added | ❌ missing |
|  | STAR stories: hardest bug, conflict, failure, ownership, deadline | Standard | added | ❌ missing |
|  | Why switch / salary / notice-period answers | Light | added | ❌ missing |
| Process | Spaced revision system (1/3/7/21 days), weak-topic list | Standard | added | ❌ missing |
|  | Company research + question bank per round | Light | added | ❌ missing |

**Missing from the current index (6):** Resume walkthrough and 'tell me about yourself' (2 min); Project deep-dive: architecture, trade-offs, numbers; STAR stories: hardest bug, conflict, failure, ownership, deadline; Why switch / salary / notice-period answers; Spaced revision system (1/3/7/21 days), weak-topic list; Company research + question bank per round.

### 1.13 Mock interviews
Source basis: added.

| Module | Topic | Weight | Source | Current |
|---|---|---|---|---|
| Weekly mocks (from week 3) | Timed DSA: 2 problems / 45 min | Standard | added | ⚠ one-liner in DSA-37 |
|  | Java + Spring rapid-fire (30 questions / 30 min) | Standard | added | ❌ missing |
|  | LLD machine coding: 90 min | Standard | added | ❌ missing |
|  | HLD design round: 45 min | Standard | added | ❌ missing |
|  | Behavioral round: 30 min | Light | added | ❌ missing |

**Missing from the current index (4):** Java + Spring rapid-fire (30 questions / 30 min); LLD machine coding: 90 min; HLD design round: 45 min; Behavioral round: 30 min.

### 1.14 DSA in Java (daily 30-min thread, separate from the 164 topics)
**Current:** 42 one-session patterns (DSA-01…36) plus 6 "timed mixed sets". The pattern list is now broad: arrays, hashing, sliding window, prefix sums, strings, matrix, bits, math, binary search (and on the answer), sorting, intervals, cyclic sort, recursion/backtracking, stacks/monotonic stack, queues, linked lists, fast/slow pointers, trees, BST, tree DP/LCA, heaps, top-K, two heaps, tries, BFS/DFS, DSU, topo sort, Dijkstra/MST, DP 1D/2D/knapsack/LIS-LCS, greedy, and design-DS.

**What's missing is depth, not breadth:**

| Gap | Now | Standard |
|---|---|---|
| Named problems | 0. Every practice item links to `geeksforgeeks.org/explore` and says "solve 2 problems" | 6–10 named problems per pattern (2 easy, 4–6 medium, 1–2 hard) with verified GfG Practice / LeetCode links. Each pattern needs at least 1 GfG problem (Source: GfG DSA Self-Paced) |
| Sessions per pattern | 1 × 30 min | 1 for small patterns; **3–4 for trees, graphs and DP**; 2 for heaps/backtracking/binary search |
| Pattern notes | 1 line | a "when to use" signal list, a Java template, a complexity table, and 3 classic mistakes (≥350 words, Light weight) |
| Acceptance | none for DSA | accepted submission link + stated time/space + one edge case you tested |
| Revisit | none | failed or slow problems come back automatically at +3 and +7 days |
| Timed practice | 6 mixed sets | **weekly** contest (Saturday): 2 problems / 45 min, scored |
| Missing patterns | — | segment tree / Fenwick (optional), string matching (KMP/Z), line sweep, graph cycles, 0-1 BFS, bitmask DP (light) |

### 1.15 Will this fit in 54 sessions? No. The arithmetic:
- **Time per topic at the §3 standard** (video + notes + code + MCQ + interview questions + takeaways + practice + flashcards):
  - Core about 123 min (the HashMap sample adds up exactly), Standard about 80 min, Light about 45 min.
  - Index total: 59 × 123 + 81 × 80 + 24 × 45 = **14,817 min ≈ 247 h** of main-subject study. DSA is extra.
- **Weekly capacity for main content under D6/D7:**
  - Mon–Fri: 5 × 78 min.
  - Sat/Sun: 2 × (78 core + 270 stretch).
  - Total = **1,086 min/week**.
- 14,817 / 1,086 ≈ **13.6 weeks**. With a 10 % buffer for missed days that is **~15 weeks**: from Day 1 (Sun 22 Nov 2026) to about **early March 2027**.
- **Option A (recommended): ~14–15 weeks at full depth.** Session count is just `sessions.length`; the engine has no 54-session assumption.
- **Option B: keep ~54 sessions (~8 weeks), cut to Core-first.**
  - All 59 Core topics get full depth.
  - Standard topics get a 25-min "quick" format: cheat sheet + 4 MCQs + 4 interview questions + 3 flashcards.
  - Light topics move to weekend stretch or are dropped.
  - Even this needs ~9 weeks (59 × 123 + 81 × 25 ≈ 9,300 min).
- Deepak needs to choose; GPT should not decide this silently.

---

## 2. Depth verdict: is the current study and question content sufficient?

**Verdict: bare minimum for every one of the 85 lessons (43 subject lessons + 42 DSA). 0/85 meet even the Light standard.** The fixture is labelled example data, so this is expected. The point is that the *contract* in `ui/README.md` has no fields for most of what is needed (see §3 and §4). GPT's data will be bare too unless the schema demands more.

### 2.1 Counts (measured on `ui/fixtures/course.fixture.js` @ `0e97dfa`)
| Element | Current total | Per lesson | Standard (Light → Core) | Lessons meeting it |
|---|---|---|---|---|
| Notes words | 1,597 words total | avg **18.8**, max 36 | 350 → 1,200 | **0/85** |
| Note layers (intuition → real-world) | 0 | 0 | 6 layers | 0/85 |
| Runnable Java code | **0** | 0 | 1 → 3 programs | 0/85 |
| Diagrams | 10 (linear node chains) | 0–1 | 0–1 → 2 (class/sequence/architecture) | 0/85 at Core |
| Videos | 85 | 1 | 1–2 *verified* with timestamps | **0/85** (all are `youtube.com/results?search_query=…`) |
| Readings (GfG article / official docs) | 0 | 0 | 1 → 3 | 0/85 |
| Lesson MCQs | **43 questions** on 43 lessons; DSA 0 | 1, with 2–3 options, **pass 100 %** | 4 → 8 with an explanation per option | 0/85 |
| Option explanations | 0 | 0 | every option | 0 |
| Module tests | 10 of 27 modules, 24 questions total | 2–3 questions | every module, 15–20 questions | 0/27 |
| Interview questions with model answer | **0** | 0 | 4 → 10 (basic/intermediate/advanced/scenario) | 0/85 |
| Coach prompts (one-line "explain X") | 85 | 1 | replaced by interview questions with follow-ups | n/a |
| Coach takeaways (revision bullets) | 92 | 1–2 | 5 → 7 | 0/85 |
| My takeaways (per topic) | none. Only free-form *session* notes | n/a | required, ≥3 bullets / 30 words | n/a |
| Practice | 84 items; subject practice = "write a small program that demonstrates X" + 2 generic criteria; DSA = "solve 2 problems", link `geeksforgeeks.org/explore`, 0 criteria | 1 | 1 → 2 with ≥3 testable acceptance criteria | 0/85 |
| Flashcards / cheat sheet / prerequisites / common mistakes / confidence | 0 / 0 / 0 / 0 / 0 | 0 | see §3 | 0/85 |

### 2.2 Per subject (current lessons)
| Subject | Lessons | Notes words (avg) | Code | Diagrams | MCQ questions | Module-test questions | Interview Qs with answers | Verified videos |
|---|---|---|---|---|---|---|---|---|
| Java core | 7 | 27.6 | 0 | 3 | 7 | 6 | 0 | 0 |
| Streams & APIs | 4 | 26.5 | 0 | 1 | 4 | 3 | 0 | 0 |
| Concurrency | 5 | 24.4 | 0 | 1 | 5 | 3 | 0 | 0 |
| SQL & JDBC | 3 | 28.0 | 0 | 0 | 3 | 2 | 0 | 0 |
| Spring Boot | 10 | 26.6 | 0 | 2 | 10 | 4 | 0 | 0 |
| LLD | 4 | 24.3 | 0 | 1 | 4 | 2 | 0 | 0 |
| HLD | 5 | 24.2 | 0 | 1 | 5 | 2 | 0 | 0 |
| GenAI | 5 | 23.8 | 0 | 1 | 5 | 2 | 0 | 0 |
| DSA | 42 | 11.6 | 0 | 0 | 0 | 0 | 0 | 0 |

**Teaching quality in one line:** the lessons name the topic but don't teach it. Deepak cannot learn HashMap internals, `@Transactional` propagation or isolation levels from a 20-word note and one true/false question. Interview questions with model answers are completely absent, and interviews are the goal.

---

## 3. Per-topic content standard (what the backend must provide for every topic)

### 3.1 Topic weight decides every number
GPT assigns `weight` per topic; §1 gives my recommendation for every topic.
- **Core:** asked in most interviews, and you must explain internals and trade-offs. Examples: HashMap internals, `@Transactional`, isolation levels, consistent hashing, RAG.
- **Standard:** asked often; you must use it correctly and explain it.
- **Light:** awareness, one or two questions at most.

| Component | Core | Standard | Light | Hard rule (backend validation rejects the topic if broken) |
|---|---|---|---|---|
| Notes, words (excl. code) | **≥ 1,200** | **≥ 700** | **≥ 350** | all 6 layers present (Light: intuition, how-it-works, pitfalls, trade-offs at minimum) |
| Diagrams | **≥ 2** | **≥ 1** | 0–1 | each has `alt` text; Mermaid or SVG source, no images of text |
| Runnable Java code | **≥ 3** programs (1 must be "broken → fixed") | **≥ 2** | **≥ 1** (HLD/GenAI: config, pseudo-code or curl instead) | each has `runCommand` + `expectedOutput`; compiles on JDK 21 in CI |
| Videos | 1–2 | 1 | 0–1 | real video URL + `startSec/endSec` + `verifiedOn`; **search URLs rejected** |
| Readings | 2–3 | 1–2 | 1 | ≥ 1 GfG article for GfG-sourced topics; official docs preferred |
| Interview questions | **10** | **6** | **4** | difficulty split below; each has model answer, 30-sec version, ≥ 1 follow-up with answer, ≥ 1 common wrong answer |
| MCQs (lesson check) | **8** | **6** | **4** | pass **75 %** (6/8, 5/6, 3/4); explanation on *every* option; ≥ 2 misconception-type |
| Coach takeaways | **7** | **6** | **5** | ≤ 25 words each |
| My takeaways | required | required | required | ≥ 3 bullets **and** ≥ 30 words before "Mark complete" |
| Flashcards | **8** | **5** | **3** | front ≤ 15 words, back ≤ 30 words |
| Common mistakes | **5** | **3** | **2** | mistake + why + fix |
| Cheat sheet | ≤ 10 lines | ≤ 8 | ≤ 5 | fits one phone screen |
| Practice | **2** (1 guided build + 1 problem/scenario) | **1** | **1** small | ≥ 3 *testable* acceptance criteria; evidence type |
| Prerequisites / unlocks | required | required | required | topic IDs that exist; no cycles; the validator checks order |
| Est. minutes (per part) | ≈ 120 → `sessionsNeeded: 2` | ≈ 80 → 1 | ≈ 45 → ½ | sum of parts = total; a part ≤ 78 min for a weekday slot |
| LLD/HLD/DSA connections | ≥ 2 | ≥ 1 | optional | IDs or titles |
| Mini-project hook | ≥ 1 | optional | — | `projectId` + feature + when |
| Self-rating prompt | yes | yes | yes | 1–5 after notes, MCQ and interview questions |

### 3.2 Each component in detail

**a) Notes: depth in layers.** Every topic is written in these six layers, in this order, in plain English.
1. **Intuition:** an analogy plus why it exists and why interviewers care (~10 %).
2. **How it works:** the mechanism step by step, with numbers and defaults (~35 %).
3. **Code:** what each program shows; the programs themselves live in `code[]` (~10 %).
4. **Edge cases & pitfalls:** what breaks, and how it shows up in production (~20 %).
5. **Trade-offs:** when to use what, with a comparison table (~15 %).
6. **Real-world usage:** where it shows up in a Spring service or a system design, plus a short incident story (~10 %).

Word counts exclude code. Required diagrams:
- Concepts: a flow diagram.
- LLD: a class diagram plus a sequence diagram.
- HLD: an architecture diagram plus a request flow.
- Concurrency: a timeline or interleaving diagram.

**b) Interview questions: count and difficulty split.**

| Weight | Basic | Intermediate | Advanced | Scenario/debugging | Total |
|---|---|---|---|---|---|
| Core | 3 | 3 | 2 | 2 | **10** |
| Standard | 2 | 2 | 1 | 1 | **6** |
| Light | 2 | 1 | 0 | 1 | **4** |

- **Fields for each question:**
  - `q`
  - `modelAnswer`: 80–200 words, and it must name numbers and trade-offs
  - `sayItIn30s`
  - `followUps[]`: ≥1 for Light, ≥2 for Core, each with its answer
  - `commonWrongAnswers[]`
  - `frequency`: very-high / high / medium
  - `tags`
- **UI behaviour:** Deepak answers aloud or types first, then reveals the model answer and self-grades (Nailed / Partly / Missed).
  - "Missed" or "Partly" puts the question on the weak list.
  - Weak questions resurface at +1, +3 and +7 days.
- **Across a subject**, the subject's interview questions must include the top-5 high-frequency questions listed in the QA report §B10.

**c) Key takeaways: mine and the coach's, side by side.**
- **My takeaways** (handwritten by Deepak):
  - Editable at any time, and **shown first**: left column on desktop, top on mobile.
  - **Required before Mark complete:** ≥ 3 bullets and ≥ 30 words. Writing them in your own words is the retrieval practice that makes the topic stick, which is why this is required and not optional.
  - Stored per topic, with history.
- **Coach takeaways** (5–7 bullets from the content):
  - Shown **after My takeaways is saved**: "Compare with the coach". This avoids copying.
  - A "Skip, show now" button exists but is logged and earns no takeaway points.
- **Spaced revision:** both sets appear side by side in the revisions.

**d) MCQs: use them where they help understanding, not as trivia.**
- **Types:**
  - `concept`
  - `misconception`: the wrong options are the common wrong beliefs. At least 2 per topic.
  - `code-output`: required for Java, Spring and concurrency topics.
  - `scenario`: required for LLD, HLD and GenAI.
- **Counts and pass mark:** 8 / 6 / 4, pass **75 %**. Options are shuffled. Every option has an explanation, shown after submit.
- **Retakes:** a pass is sticky (already implemented). On a retake the question order changes; if there is a bank of 1.5× questions, a different subset is drawn.
- **Module test:** 15–20 questions drawn from the module's topics plus new integrative ones, pass 70 %.
- **Subject test:** 25–30 questions, pass 70 %.
- **DSA:** only 3 complexity/pattern-recognition MCQs per pattern. The real check is the solved problems.

**e) Everything else that was missing**
- **Practice / coding assignment:**
  - `kind`: guided build / problem / debugging / design.
  - A starter repo path or problem URL (verified).
  - ≥ 3 testable acceptance criteria. Prefer JUnit tests to pass.
  - An evidence type: GitHub link, accepted-submission link, or screenshot.
- **Flashcards:** counts as above. The schedule is **1 / 3 / 7 / 21 days** after completion, with grading Again / Hard / Good:
  - Again: reset to day 1.
  - Hard: repeat the same interval.
  - Good: move to the next interval.
  - A card graded Good at 21 days is "mastered".
- **Cheat sheet:** one screen, for the 12-min revision slot and for the night before an interview.
- **Prerequisites / unlocks:** topic IDs. The validator rejects a topic scheduled before a prerequisite (same rule as M12).
- **Estimated minutes:** broken down by part (video, notes, code, MCQ, interview questions, takeaways, practice, flashcards). The schedule engine places parts across sessions with `sessionsNeeded` and `sessionSplit`.
- **Videos and readings:** real URLs only, with `verifiedOn`. A weekly link check job marks broken links.
- **Self-rating confidence (1–5):** asked after notes, MCQ and interview questions. A rating below 3 adds an extra revision at +2 days and puts the topic on the weak list.
- **Common mistakes:** each with mistake + why + fix.
- **Connections:** to related LLD/HLD/DSA/concurrency topics, so revision and mocks can pull related questions.
- **Mini-project hooks:** which project feature uses this topic, so projects reuse lessons (Splitwise / booking).
- **Completion rule (for the engine): a topic is Complete when all of these are true:**
  - notes opened, and the video watched or explicitly skipped
  - MCQ passed
  - My takeaways saved
  - required practice has evidence
  - interview questions self-graded, at least once each

  Flashcards and revisions do not block completion; they feed streaks and points.

### 3.3 Schema (types)
```text
Topic {
  schemaVersion: 1, id: string (stable), title, subjectId, moduleId,
  weight: "core"|"standard"|"light", status: "draft"|"reviewed", reviewedBy, updatedAt (ISO, +05:30),
  source: { kind: "gfg"|"added", course, ref, url },
  prerequisites: id[], unlocks: id[], learningObjectives: string[3..6],
  estMinutes: { video, notes, code, mcq, interview, takeaways, practice, flashcards, total },
  sessionsNeeded: 0.5|1|2, sessionSplit: [{ part, covers: string[] }],
  videos: [{ id, title, channel, url, startSec, endSec, durationMin, suggestedWatchMin, language, verifiedOn }],
  readings: [{ title, url, kind: "article"|"official-doc"|"source"|"paper", verifiedOn }],
  notes: { minWords, layers: [{ layer: "intuition"|"how-it-works"|"code"|"edge-cases"|"trade-offs"|"real-world", title, blocks: Block[] }] },
  Block = { type: "p"|"ul"|"ol"|"callout"|"table"|"code-ref", text?|items?|rows?|ref? },
  diagrams: [{ id, title, kind: "mermaid"|"svg", alt, source }],
  code: [{ id, title, file, language, javaVersion, runCommand, demonstrates[], source, expectedOutput }],
  commonMistakes: [{ mistake, why, fix }], cheatSheet: string[],
  coachTakeaways: string[5..7],
  myTakeaways: { required, minBullets, minWords, revealCoachTakeawaysAfterSave, showFirst, editable },
  mcqs: { passPct: 75, shuffleOptions, showExplanations: "after-submit",
          questions: [{ id, type: "concept"|"misconception"|"code-output"|"scenario", difficulty, q, code?, options: [{ text, correct, explanation }] }] },
  interviewQuestions: [{ id, difficulty: "basic"|"intermediate"|"advanced"|"scenario", frequency, q, modelAnswer, sayItIn30s,
                         followUps: [{ q, a }], commonWrongAnswers: string[], tags? }],
  practice: [{ id, kind: "guided"|"problem"|"debugging"|"design", difficulty, minutes, title, prompt?, url?, starter?, acceptance: string[3..], evidence: { type, required } }],
  flashcards: [{ id, front, back }], revision: { offsetsDays: [1,3,7,21], items: string[] },
  connections: { lld[], hld[], dsa[], concurrency[] }, miniProjectHooks: [{ projectId, feature, when }],
  selfRating: { scale: 5, askAfter: string[], lowThreshold: 3, onLow }, tags: string[]
}
```
This extends the current lesson shape in `ui/README.md`: `notes[]` becomes `notes.layers[]`, `quiz` becomes `mcqs`, `coach` becomes `interviewQuestions`, and `revision` splits into `coachTakeaways` and `flashcards`. I will update the UI and the validator to this schema once GPT confirms it, and keep a v2 adapter so old data still renders.

### 3.4 Sample: "HashMap internals" (Core), fully filled
- Full JSON is in **Appendix A** and in `/workspace/qa/content-standard/hashmap-internals.topic.json` (valid JSON).
- **Sample counts:**
  - notes: 1,219 words in 6 layers
  - 2 Mermaid diagrams
  - 3 runnable programs, run on JDK 21 with outputs recorded
  - 10 interview questions (3 basic / 3 intermediate / 2 advanced / 2 scenario), each with model answer, follow-ups and wrong answers
  - 8 MCQs with per-option explanations
  - 7 coach takeaways, 8 flashcards, 5 common mistakes, a 9-line cheat sheet, 2 practice items, connections and project hooks
- The only placeholder is the **video**: it must be a real video picked and checked by GPT. YouTube blocks automated checks from my box, so I could not verify one.
- The 3 readings and the GfG practice problem were checked to load (HTTP 200) on 22 Nov.

---

## 4. Backend gaps: what GPT's backend must add for the UI, scoring and notifications

The current Progress v2 (in `ui/README.md`) has lessons, practice, quizzes, tests, watch, notes, revisions and schedule. It lives **only in browser localStorage**. Everything below is missing.

### 4.1 Content side (served with the course)
| # | Gap | Needed for |
|---|---|---|
| C1 | Topic schema of §3.3 (`weight`, layered notes, code, diagrams, `interviewQuestions`, `mcqs` with explanations, `coachTakeaways`, `flashcards`, `cheatSheet`, `commonMistakes`, `prerequisites`, `estMinutes` parts, `sessionsNeeded`, verified `videos`/`readings`, `connections`, `miniProjectHooks`) | depth, interview prep, revision |
| C2 | `schemaVersion` + `contentVersion` per topic, `status: reviewed` | the UI shows "draft" banners; progress survives content edits |
| C3 | Module tests (15–20 Qs) for **every** module, subject tests (25–30), mock-interview definitions (type, duration, rubric) | tests, mocks |
| C4 | Validation script in CI: word counts, counts per weight, pass marks, link check (no search URLs), Java code compiles and output matches, prerequisites order | keeps quality from regressing |
| C5 | Weekly challenges and daily task templates (e.g. "Finish 5/5 weekday sessions", "30 flashcards", "Saturday DSA contest") | Scaler-style challenges |

### 4.2 Progress side (per user)
| # | Gap | Shape (sketch) | Needed for |
|---|---|---|---|
| P1 | **Per-topic stage progress** | `topics[id] = { stages: { video, notes, code, mcq, interview, takeaways, practice }, completedOn, contentVersion }` | completion rule, "continue where you left off" |
| P2 | **My takeaways** per topic, with history | `takeaways[id] = { text, bullets, updatedAt, history[] }` | §3c |
| P3 | **Attempt history** for MCQs, module/subject tests and mocks | `attempts[] = { kind, refId, at, score, pct, passed, answers, durationSec }` | best/last scores, weak areas |
| P4 | **Interview question self-grades** | `iq[topicId][qid] = { grade: nailed|partly|missed, at, dueOn }` | weak list, revision |
| P5 | **Spaced repetition state** | `srs[cardId] = { box, intervalDays, dueOn, lapses, lastGrade }` | flashcards 1/3/7/21 |
| P6 | **Confidence ratings** | `confidence[topicId] = [{ at, stage, value 1..5 }]` | weak topics |
| P7 | **Activity log + lastActiveAt** | `activity[] = { at (ISO +05:30), type, refId, minutes?, device }`, `lastActiveAt` | nudges, streaks, "time studied" |
| P8 | **Points ledger** (append-only; the total is derived) | `points[] = { at, rule, refId, delta }` | scoring |
| P9 | **Streaks** | `streak = { current, longest, lastQualifyingDay, freezes }` | streak emails |
| P10 | **Badges** | `badges[] = { id, earnedAt }` | engagement |
| P11 | **Notification preferences** | `notify = { email, enabled, quietStart "00:00", quietEnd "06:00", tz "Asia/Kolkata", minGapHours 2, maxGapHours 3, maxPerDay 6, tone "hinglish", snoozeUntil, unsubToken }` | nudges |
| P12 | **Notification log** | `sent[] = { at, template, topicId, reason }` | rate limiting; no duplicate copy |
| P13 | **Server-side sync** of the whole progress | `updatedAt` per record, `deviceId`, last-writer-wins per key; backups | multi-device; email job can read it |
| P14 | **Weak list** (derived) | from P3/P4/P6 + failed DSA | revision + mock question picks |

### 4.3 Scoring system (concrete, so GPT and the UI agree)
| Action | Points | Cap |
|---|---|---|
| Notes read (all layers opened) | 10 | once per topic |
| Video watched (≥ 80 % of the suggested time) | 10 | once per topic |
| MCQ passed | 20 (+10 if 100 % first try) | once per topic |
| My takeaways saved (meets minimum) | 15 | once per topic |
| Interview question self-graded | 3 each | once per question |
| Practice with evidence | 30 (guided build 40) | per item |
| Topic complete | 50 | once |
| Flashcard reviewed | 2 | 40/day |
| Session complete on its planned date | 25 bonus | daily |
| Module test pass / subject test pass | 100 / 250 | once each |
| Saturday DSA contest | 20 per solved problem | weekly |
| Mock interview done (rubric filled) | 150 | weekly |
| Streak bonus | 5 × min(current streak, 10) | daily |

- **Streak rules:**
  - A *qualifying study day* uses the 04:00 IST cutoff. It needs ≥ 30 min of logged activity, or the day's session completed.
  - A day marked **unavailable** in the planner neither breaks nor extends the streak.
  - Every 7-day streak earns 1 freeze, up to 2.
- **Levels:** every 1,000 points.
- **Badges:**
  - First topic
  - 7-day streak and 30-day streak
  - Java core complete, and each other subject complete
  - 50 flashcards mastered
  - first mock
  - "Night owl": a session done before the 04:00 cutoff
  - Comeback: back within 24 h after a 2-day gap

**Activity that counts for nudges and streaks:**
- stage completions
- MCQ, test and mock attempts
- takeaways saved
- flashcard reviews
- practice evidence
- note edits longer than 30 seconds

Simply opening the site does **not** count.

### 4.4 Account sync: the one decision that blocks notifications
Today, progress exists only in one browser. An email job cannot see "no activity for 2 h" unless progress is synced somewhere a server can read. **Either GPT's account-sync backend stores Progress (with P7 `lastActiveAt`), or we use the private-repo option in §5.** The UI side is mine: `onChange` → `sync.push()`, plus the `sync` pill and error alert that already exist.

---

## 5. Engagement and email nudges: feasibility (honest version)

**Short answer: yes, it can be done for free, with two preconditions.** The site is a static GitHub Pages site and progress lives in browser localStorage. GitHub Pages cannot run code or send email, and nothing on a server can see localStorage. So we need:
- **(a)** progress synced somewhere a scheduled job can read it, and
- **(b)** a free scheduler plus a free sender.

### 5.1 Options compared
| | **A. GitHub Actions cron + Gmail SMTP (recommended)** | B. Grok Bot routine + Gmail connector | C. GPT's backend sends (if it is a real server) |
|---|---|---|---|
| Reads progress from | `progress.json` in a **private** repo (or GPT's sync DB via a secret key) | the same synced progress, via the GitHub connector | its own DB |
| Scheduler | Actions `schedule` cron, hourly, `timezone: Asia/Kolkata`. The shortest interval is 5 min, and runs can be delayed at busy times | a Grok Bot routine every 2–3 h | the backend's cron |
| Sender | `smtp.gmail.com:465` with a **Gmail app password** (needs 2-Step Verification); limit 500 mails/day | the user's Gmail connector. **Not installed today**, and my own bot inbox can't send until it is turned on | any SMTP/API |
| Cost | Free. A private repo uses about 18 runs/day ≈ 540 of 2,000 free min/month; a public repo is unlimited | **every run uses Grok Bot plan usage** (~8 runs/day ≈ 240/month) | depends on hosting; a free tier may sleep |
| Email copy | templates plus the engine's "today's pending topic"; deterministic | AI-written, freshest copy | templates |
| Reliability | good. Runs can be delayed during busy times. A *public* repo's scheduled workflows auto-disable after 60 days without repository activity; a private repo has no such rule | depends on the routine and the connector staying connected | unknown until GPT pushes code |
| Privacy | the progress JSON and the app password stay in a private repo and its encrypted secrets | the bot reads the data through a connector | GPT's stack |

**Recommendation: A, in a new private repo `study-desk-data`**, kept separate from the public Pages repo so progress and notes stay private:
1. **Sync:** the Study Desk writes `progress.json` to that repo through the GitHub Contents API.
   - It uses a **fine-grained personal access token limited to that one repo** with *Contents: read & write*, entered once on Deepak's own device.
   - It is saved in that browser only, not in code.
   - Pushes are debounced (at most one commit per 5 min, plus on `pagehide`).
   - If GPT's backend lands with a database, swap the sync target; the email job keeps working.
2. **Job:** `.github/workflows/nudge.yml` runs `17 6-23 * * *` with `timezone: "Asia/Kolkata"`. Minute 17 avoids the top-of-hour delays.
   - It runs Node and **reuses `ui/engine/schedule-engine.js`** (it is UMD) to compute today's session and the pending topic from the same rules as the UI.
   - It sends with nodemailer through Gmail SMTP and appends to `sent.json` (P12).
3. **Nudge rule:** send only if **all** of these hold:
   - not in quiet hours, 00:00–06:00 IST
   - today's study day (04:00 cutoff) is not marked unavailable or a day off
   - today's session is not complete
   - `now − lastActiveAt ≥ 2 h`
   - `now − lastNudgeAt ≥ random(2 h, 3 h)`
   - nudges today < 6
   - `snoozeUntil` has passed

   **Fixed touchpoints:**
   - 08:00 "today's plan"
   - 20:45 "starts in 15 min"
   - 23:00 "streak at risk", only if not done

   After the session is complete, no more nudges that day. One optional "flashcards due" mail can go at 18:00.
   - **Escalation:**
     - first nudge friendly
     - third nudge "Zomato-style" cheeky
     - from 2 missed days, a "comeback" mail with a 20-min mini-plan
4. **Every mail has:**
   - the pending topic name and minutes left
   - points and streak
   - a deep link (`…/ui/#day-N/learn`)
   - "Snooze 3 h" and "Pause today" links. These open the Study Desk, which writes `snoozeUntil`; no server endpoint is needed.

**What Deepak must provide (one time, about 15 min):**
1. The email address to receive nudges.
2. 2-Step Verification on the sending Gmail, plus an **app password** (myaccount.google.com/apppasswords), saved as repo secret `GMAIL_APP_PASSWORD` together with `GMAIL_USER`. Sending to himself from his own Gmail is fine.
3. Create the private repo `study-desk-data`, or let me create it with his OK.
4. A **fine-grained token** scoped to that repo only (Contents read/write), entered in the Study Desk settings on his device.
5. Confirm the quiet hours. His voice note said "twelve P M till six P M"; I read it as **00:00–06:00 IST (midnight to 6 AM)**. Also confirm the max of 6 mails/day and that Hinglish tone is OK.
6. A Gmail filter that labels and stars `from:me subject:(Study Desk)`, so the mails don't get lost or land in Promotions.

**Limits to be honest about:**
- Nudges are only as fresh as the last sync. If he studies offline in a tab that never syncs, he may get a nudge anyway; the mail says "ignore if you're already on it".
- Cron runs can be a few minutes late.
- An app password is revoked if the Google password changes.

Option B is a good add-on later for a **weekly AI-written digest** (what he did, weak topics, next week's plan), where AI-written copy is worth the usage. I would not use it for 2–3-hourly nudges.

### 5.2 Sample nudge emails (Hinglish, Zomato-style; the topic is filled from today's pending session)
1. **Subject:** `HashMap ne yaad kiya 🥺 2 ghante se koi khabar nahi`
   **Body:** Deepak, aaj ka main course ready hai: **HashMap internals** (78 min). Buckets garam hain, load factor 0.75 pe set… bas tumhara wait hai. Pehle 8 MCQs khatam karo, **+20 points pakke**. 👉 *Abhi shuru karo* · *Snooze 3h*
2. **Subject:** `Order ready! 🍱 Aaj ka combo: Race conditions + Sliding Window`
   **Body:** Main course: **CC-02 Race conditions, synchronized & volatile** (78 min) · Side dish: **DSA Sliding window** (30 min) · Delivery time: **9:00 PM**. Cancel karne ka button nahi hai 😉 Streak abhi **12 din** ki hai, thandi mat hone do. 👉 *Order track karo*
3. **Subject:** `🔥 12 din ki streak… aaj raat toot na jaye!`
   **Body:** 11 baj gaye aur **Session 9: Collectors & groupingBy** abhi pending hai. Pura nahi ho raha? Sirf **30 min DSA** ya **10 flashcards** kar lo, streak bach jayegi (freeze bacha ke rakho). 👉 *2-minute mein shuru*
4. **Subject:** `@Transactional bol raha hai: "mujhe rollback mat karo" 😅`
   **Body:** Interviewers ka favourite topic wait kar raha hai: propagation, isolation, self-invocation. **10 interview questions** ready hain, 3 toh 30-second wale hain. Ek baar answer bolo, model answer se match karo, **+30 points**. 👉 *Interview mode kholo*
5. *(comeback, after 2 missed days)* **Subject:** `Miss kiya tumhe 💔 sirf 20 minute do`
   **Body:** Do din se Study Desk suna pada hai. Koi baat nahi, plan already shift ho gaya hai (study days ≠ calendar days). Aaj bas **cheat sheet + 4 MCQs of HashMap internals**. Comeback badge tumhara intezaar kar raha hai 🏅

---

## 6. Decisions needed and next steps
**Deepak decides:**
1. **Plan length:** Option A, ~14–15 weeks at full depth (recommended), or Option B, ~54 sessions Core-first (~9 weeks). See §1.15.
2. **Per-topic numbers in §3.1:** accept them as they are, or change any.
3. **Notifications:** approve option A, provide the items in §5.1, and confirm the quiet hours.

**GPT does:**
1. Push `gpt/curriculum` and `gpt/qa`.
2. Adopt the §3.3 topic schema, or reply in COLLAB.md with changes.
3. Fill topics to the counts in §3.1, starting with the Core topics of the first 2 weeks (Java core), and run the C4 validation.
4. Add the P1–P14 progress fields and account sync.

**Grok (UI) does, after GPT's schema lands** (nothing built yet):
- a topic page with layered notes and code blocks
- My takeaways and Coach takeaways side by side
- MCQ explanations
- interview-question cards with reveal and self-grade
- flashcards (1/3/7/21)
- a points, streak and badges header
- a settings page for notification preferences and the sync token
- an updated validator and coverage page for the new counts
- the nudge workflow, once Deepak provides the secrets

---

## Appendix A: Sample topic JSON ("HashMap internals", Core)

```json
{
  "schemaVersion": 1,
  "id": "JC-HM",
  "title": "HashMap internals",
  "subjectId": "java-core",
  "moduleId": "jc-collections",
  "weight": "core",
  "status": "reviewed",
  "reviewedBy": "GPT (content) + Grok (QA)",
  "updatedAt": "2026-11-22T09:30:00+05:30",
  "source": {
    "kind": "gfg",
    "course": "GfG Java Backend Development (JBDL)",
    "ref": "Session 4: Generics, Streams API and HashMap, Hashing algorithms",
    "url": "https://www.geeksforgeeks.org/courses/java-backend-live"
  },
  "prerequisites": [
    "JC-03",
    "JC-06",
    "JC-07"
  ],
  "unlocks": [
    "CC-04",
    "DSA-03",
    "DSA-36",
    "HLD-CONSISTENT-HASHING"
  ],
  "learningObjectives": [
    "Explain how put/get find a bucket: hashCode → spread → (n-1) & hash",
    "Explain collisions, chaining, treeification (8 / 64) and untreeify (6)",
    "Explain load factor 0.75, threshold and resize (doubling, lo/hi split)",
    "Apply the equals/hashCode contract and avoid mutable keys",
    "Choose HashMap vs LinkedHashMap vs TreeMap vs ConcurrentHashMap"
  ],
  "estMinutes": {
    "video": 15,
    "notes": 20,
    "code": 10,
    "mcq": 8,
    "interview": 15,
    "takeaways": 5,
    "practice": 45,
    "flashcards": 5,
    "total": 123
  },
  "sessionsNeeded": 2,
  "sessionSplit": [
    {
      "part": 1,
      "covers": [
        "video",
        "notes",
        "code",
        "mcq",
        "takeaways"
      ]
    },
    {
      "part": 2,
      "covers": [
        "practice",
        "interview",
        "flashcards"
      ]
    }
  ],
  "videos": [
    {
      "id": "JC-HM-v1",
      "title": "<picked explainer on HashMap internals>",
      "channel": "<channel>",
      "url": "https://www.youtube.com/watch?v=<id>",
      "startSec": 0,
      "endSec": 900,
      "durationMin": 15,
      "suggestedWatchMin": 15,
      "language": "en",
      "verifiedOn": "<YYYY-MM-DD, after opening it>",
      "_note": "A real video id is required: no search URLs. The backend rejects a video without verifiedOn."
    }
  ],
  "readings": [
    {
      "title": "Internal working of HashMap in Java (GfG)",
      "url": "https://www.geeksforgeeks.org/java/internal-working-of-hashmap-java/",
      "kind": "article",
      "verifiedOn": "2026-11-22"
    },
    {
      "title": "HashMap (Java SE 21 API)",
      "url": "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html",
      "kind": "official-doc",
      "verifiedOn": "2026-11-22"
    },
    {
      "title": "OpenJDK HashMap.java source",
      "url": "https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java",
      "kind": "source",
      "verifiedOn": "2026-11-22"
    }
  ],
  "notes": {
    "minWords": 1200,
    "layers": [
      {
        "layer": "intuition",
        "title": "A row of lockers",
        "blocks": [
          {
            "type": "p",
            "text": "Think of a HashMap as a row of numbered lockers. To store a value you turn its key into a locker number (the hash), go straight to that locker and put the entry there. To find it again you compute the same number and open only that locker. That is why get and put are O(1) on average: you never scan the whole row."
          },
          {
            "type": "p",
            "text": "Two different keys can land on the same locker. That is a collision. The locker then holds a small list of entries, and HashMap uses equals() to pick the right one. Everything that can go wrong with HashMap comes from these two steps: a bad locker number (hashCode) or a bad comparison (equals)."
          },
          {
            "type": "p",
            "text": "Why does this matter for interviews? HashMap is the most-used data structure in Java backend code: request caches, counters, groupings, deduplication, and indexes built before a join. Interviewers use it to test whether you understand hashing, the equals/hashCode contract, amortised complexity and thread safety in one question. If you can draw the bucket array and walk through put() on the whiteboard, most follow-ups become easy."
          }
        ]
      },
      {
        "layer": "how-it-works",
        "title": "put and get, step by step (Java 8+)",
        "blocks": [
          {
            "type": "ol",
            "items": [
              "The table is an array of Node<K,V> buckets. It is created lazily on the first put with capacity 16 (always a power of two).",
              "hash = h ^ (h >>> 16), where h = key.hashCode(). XOR-ing the high 16 bits into the low bits matters because the index uses only the low bits.",
              "index = (n - 1) & hash, which equals hash % n when n is a power of two, but is cheaper.",
              "Empty bucket: store a new Node. Otherwise walk the bucket: if a node has the same hash and (same reference or equals()), replace its value and return the old one.",
              "No match: append the node at the tail (Java 8; Java 7 inserted at the head).",
              "If the bucket now has 8 or more nodes (TREEIFY_THRESHOLD) and the table has at least 64 buckets (MIN_TREEIFY_CAPACITY), the bucket becomes a red-black tree, so the worst case is O(log n) instead of O(n). With fewer than 64 buckets, HashMap resizes instead.",
              "After an insert, if size > threshold (capacity × loadFactor, 16 × 0.75 = 12 by default), the table doubles. Each old bucket splits into a 'lo' list (same index) and a 'hi' list (index + oldCapacity) by checking one bit, hash & oldCap. No full rehash is needed and order is kept.",
              "A tree bin that shrinks to 6 or fewer nodes during a resize/split turns back into a list (UNTREEIFY_THRESHOLD)."
            ]
          },
          {
            "type": "p",
            "text": "get() repeats steps 2-4 without inserting. A null key is allowed once and always hashes to 0 (bucket 0). Null values are allowed too, which is why get() returning null is ambiguous: use containsKey() or getOrDefault()."
          },
          {
            "type": "p",
            "text": "Inside a bucket the comparison is ordered for speed: first the cached hash int is compared (cheap), then the references (==), and only then equals(). So a fast, well-distributed hashCode() and a correct equals() are both needed: the hash narrows the search to one bucket and one candidate, and equals confirms it. Each Node stores the hash, the key, the value and a next pointer, about 32 bytes of overhead per entry on a 64-bit JVM with compressed pointers, plus the boxed key and value."
          },
          {
            "type": "p",
            "text": "Useful Java 8 methods build on the same lookup: getOrDefault(k, d) avoids a null check; putIfAbsent(k, v) inserts only when missing; computeIfAbsent(k, f) creates a value lazily (the classic map.computeIfAbsent(dept, x -> new ArrayList<>()).add(emp) for grouping); merge(k, 1, Integer::sum) is the idiomatic counter. Each does one bucket lookup instead of the two you would do with get() followed by put()."
          },
          {
            "type": "p",
            "text": "Amortised cost: a single put() that triggers a resize is O(n), because every entry is moved. Since the capacity doubles, the total cost of n inserts is still O(n), so each put is O(1) amortised. That is the same argument as ArrayList growth, and interviewers like to hear it named."
          }
        ]
      },
      {
        "layer": "code",
        "title": "See it run",
        "blocks": [
          {
            "type": "p",
            "text": "Run the three programs in `code` with `java File.java` (JDK 21, no build tool). HashIndex prints bucket numbers and shows a real collision (\"Aa\" and \"BB\" both hash to 2112). BrokenKey shows what happens when equals() is overridden without hashCode(), and when a key is mutated after insertion. FailFastAndThreads shows ConcurrentModificationException, the removeIf fix, and lost updates when threads share a HashMap."
          }
        ]
      },
      {
        "layer": "edge-cases",
        "title": "Pitfalls interviewers probe",
        "blocks": [
          {
            "type": "ul",
            "items": [
              "equals() without hashCode(): equal keys land in different buckets, so get() misses.",
              "Mutable keys: changing a field used in hashCode() after put() strands the entry; get() returns null but size() still counts it.",
              "A constant hashCode() (return 1) makes every key collide. Java 8 treeifies, so you get O(log n), and only if keys are Comparable; otherwise ordering falls back to class name and identity hash, which is still slow.",
              "Iteration order is not insertion order and can change after a resize. Use LinkedHashMap if order matters.",
              "Fail-fast iterators: a structural change during a for-each (except through the iterator) throws ConcurrentModificationException. It is best-effort, not a guarantee.",
              "Not thread-safe: concurrent puts lose updates and can corrupt a bin. (Java 7's head insertion could even create a cycle during resize, an infinite loop on get.)",
              "Presizing: to hold n entries without resizing use new HashMap<>((int) (n / 0.75f) + 1), or HashMap.newHashMap(n) in Java 19+."
            ]
          }
        ]
      },
      {
        "layer": "trade-offs",
        "title": "When to use what",
        "blocks": [
          {
            "type": "ul",
            "items": [
              "HashMap: fastest general-purpose map, no order, one null key, not thread-safe.",
              "LinkedHashMap: keeps insertion (or access) order with a doubly linked list. Access order + removeEldestEntry gives an LRU cache.",
              "TreeMap: sorted keys, O(log n), floor/ceiling/range queries, no null keys.",
              "ConcurrentHashMap: thread-safe, lock-free reads, per-bin locking with CAS on writes, no null keys or values, atomic compute/merge.",
              "Hashtable / Collections.synchronizedMap: one lock for the whole map, legacy, avoid.",
              "Load factor: lower means fewer collisions and more memory; higher means less memory and longer chains. 0.75 is the default compromise."
            ]
          },
          {
            "type": "p",
            "text": "Memory versus speed: every entry is a separate Node object, so a HashMap of a million Integer → Integer pairs costs tens of megabytes. For huge primitive maps, specialised libraries (fastutil, Eclipse Collections) or arrays indexed by id are far smaller. For a few fixed keys, an EnumMap (for enum keys) or Map.of (immutable, up to 10 pairs inline) is simpler and faster. Pick the structure from the access pattern: point lookups, ordered iteration, range queries or concurrent writes."
          }
        ]
      },
      {
        "layer": "real-world",
        "title": "Where you meet it at work",
        "blocks": [
          {
            "type": "ul",
            "items": [
              "Caches and lookups keyed by id (userId → session) inside a Spring service. Use ConcurrentHashMap if the bean is a singleton shared by request threads.",
              "Counting / grouping (Collectors.groupingBy builds a HashMap). Use merge() for counters.",
              "Deduplication with HashSet, which is a HashMap with dummy values.",
              "HashDoS: untrusted keys crafted to collide degrade a server. Treeification in Java 8 limits the damage; frameworks also cap request parameter counts.",
              "The same idea scales out as consistent hashing (HLD) and as Redis hash slots."
            ]
          },
          {
            "type": "p",
            "text": "A typical production bug: a team caches user permissions in a static HashMap inside a Spring @Service. Under load, two request threads put() at the same time during a resize, one update is lost, and a user intermittently sees 403 errors that nobody can reproduce locally. The fix is a ConcurrentHashMap with computeIfAbsent, or better a real cache (Caffeine locally, Redis across instances) with a TTL so stale permissions expire. When you tell this story in an interview, name the root cause (unsynchronised shared mutable state), the detection (logs plus a load test) and the fix with its trade-off (per-instance cache vs shared Redis)."
          }
        ]
      }
    ]
  },
  "diagrams": [
    {
      "id": "JC-HM-d1",
      "title": "put(key, value) flow",
      "kind": "mermaid",
      "alt": "Flowchart: hashCode, spread, index, empty bucket or walk the chain, treeify at 8 when capacity is at least 64, resize when size exceeds the threshold.",
      "source": "flowchart TD\n A[key.hashCode] --> B[h ^ h>>>16]\n B --> C[index = n-1 & hash]\n C --> D{bucket empty?}\n D -- yes --> E[new Node]\n D -- no --> F{same hash and equals?}\n F -- yes --> G[replace value]\n F -- no --> H[append at tail]\n H --> I{bin >= 8 nodes?}\n I -- yes, table >= 64 --> J[treeify bin]\n I -- yes, table < 64 --> K[resize]\n E --> L{size > threshold?}\n H --> L\n L -- yes --> K[resize: double, lo/hi split]"
    },
    {
      "id": "JC-HM-d2",
      "title": "Table with a chained bucket and a tree bucket",
      "kind": "mermaid",
      "alt": "An array of 16 buckets; bucket 0 holds Aa then BB as a linked chain; bucket 5 holds a red-black tree.",
      "source": "flowchart LR\n subgraph table[Node array, n = 16]\n b0[0] --- b1[1] --- b5[5] --- b15[15]\n end\n b0 --> n1[Aa:1] --> n2[BB:2]\n b5 --> t1((root)) --> t2((left))\n t1 --> t3((right))"
    }
  ],
  "code": [
    {
      "id": "JC-HM-c1",
      "title": "Bucket index and a real collision",
      "file": "HashIndex.java",
      "language": "java",
      "javaVersion": "21",
      "runCommand": "java HashIndex.java",
      "demonstrates": [
        "spread",
        "index",
        "collision",
        "null key"
      ],
      "source": "import java.util.*;\n\npublic class HashIndex {\n    // Same spreading HashMap uses (Java 8+): mix high bits into low bits.\n    static int spread(Object key) {\n        int h;\n        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);\n    }\n    static int bucket(Object key, int capacity) { return (capacity - 1) & spread(key); }\n\n    public static void main(String[] args) {\n        int capacity = 16;                       // default table size\n        for (String k : List.of(\"apple\", \"banana\", \"cherry\", \"Aa\", \"BB\")) {\n            System.out.printf(\"%-7s hashCode=%-11d bucket=%d%n\", k, k.hashCode(), bucket(k, capacity));\n        }\n        // \"Aa\" and \"BB\" have the same hashCode (2112): a real collision, same bucket.\n        Map<String, Integer> m = new HashMap<>();\n        m.put(\"Aa\", 1); m.put(\"BB\", 2); m.put(null, 0); // one null key is allowed (bucket 0)\n        System.out.println(m.get(\"Aa\") + \" \" + m.get(\"BB\") + \" \" + m.get(null));\n        // Threshold = capacity * loadFactor = 16 * 0.75 = 12: the 13th put doubles the table to 32.\n    }\n}\n",
      "expectedOutput": "apple   hashCode=93029210    bucket=1\nbanana  hashCode=-1396355227 bucket=0\ncherry  hashCode=-1361513063 bucket=1\nAa      hashCode=2112        bucket=0\nBB      hashCode=2112        bucket=0\n1 2 0"
    },
    {
      "id": "JC-HM-c2",
      "title": "Broken equals/hashCode and mutable keys",
      "file": "BrokenKey.java",
      "language": "java",
      "javaVersion": "21",
      "runCommand": "java BrokenKey.java",
      "demonstrates": [
        "contract",
        "records",
        "mutable key"
      ],
      "source": "import java.util.*;\n\npublic class BrokenKey {\n    // equals() overridden but hashCode() NOT: breaks the contract.\n    static final class Point {\n        final int x, y;\n        Point(int x, int y) { this.x = x; this.y = y; }\n        @Override public boolean equals(Object o) {\n            return o instanceof Point p && p.x == x && p.y == y;\n        }\n    }\n    // Fixed version: equal objects must have equal hash codes.\n    record FixedPoint(int x, int y) { }\n\n    public static void main(String[] args) {\n        Map<Point, String> broken = new HashMap<>();\n        broken.put(new Point(1, 2), \"A\");\n        System.out.println(\"broken get  -> \" + broken.get(new Point(1, 2)));   // almost always null\n\n        Map<FixedPoint, String> fixed = new HashMap<>();\n        fixed.put(new FixedPoint(1, 2), \"A\");\n        System.out.println(\"record get  -> \" + fixed.get(new FixedPoint(1, 2))); // A\n\n        // Mutable key pitfall: mutate after insert and the entry is \"lost\".\n        List<Integer> key = new ArrayList<>(List.of(1));\n        Map<List<Integer>, String> m = new HashMap<>();\n        m.put(key, \"v\");\n        key.add(2);                                   // hashCode changes\n        System.out.println(\"mutated key -> \" + m.get(key) + \", size=\" + m.size()); // null, size=1\n    }\n}\n",
      "expectedOutput": "broken get  -> null\nrecord get  -> A\nmutated key -> null, size=1"
    },
    {
      "id": "JC-HM-c3",
      "title": "Fail-fast iteration and lost updates",
      "file": "FailFastAndThreads.java",
      "language": "java",
      "javaVersion": "21",
      "runCommand": "java FailFastAndThreads.java",
      "demonstrates": [
        "ConcurrentModificationException",
        "removeIf",
        "thread safety"
      ],
      "source": "import java.util.*;\nimport java.util.concurrent.*;\n\npublic class FailFastAndThreads {\n    public static void main(String[] args) throws Exception {\n        Map<String, Integer> stock = new HashMap<>(Map.of(\"pen\", 0, \"book\", 3, \"bag\", 0));\n        try {\n            for (String k : stock.keySet()) if (stock.get(k) == 0) stock.remove(k); // structural change mid-iteration\n        } catch (ConcurrentModificationException e) {\n            System.out.println(\"fail-fast: \" + e.getClass().getSimpleName());\n        }\n        stock.values().removeIf(v -> v == 0);       // correct way\n        System.out.println(\"after removeIf: \" + stock);\n\n        // Lost updates: HashMap is not thread-safe. ConcurrentHashMap.merge is atomic per key.\n        System.out.println(\"HashMap total = \" + count(new HashMap<>()) + \" (expected 80000; usually less, may even throw)\");\n        System.out.println(\"ConcurrentHashMap total = \" + count(new ConcurrentHashMap<>()));\n    }\n\n    static int count(Map<Integer, Integer> map) throws InterruptedException {\n        ExecutorService pool = Executors.newFixedThreadPool(8);\n        for (int t = 0; t < 8; t++) pool.submit(() -> {\n            for (int i = 0; i < 10_000; i++) map.merge(i % 100, 1, Integer::sum);\n        });\n        pool.shutdown();\n        pool.awaitTermination(10, TimeUnit.SECONDS);\n        return map.values().stream().mapToInt(Integer::intValue).sum();\n    }\n}\n",
      "expectedOutput": "fail-fast: ConcurrentModificationException\nafter removeIf: {book=3}\nHashMap total = <varies, usually < 80000> (...)\nConcurrentHashMap total = 80000"
    }
  ],
  "commonMistakes": [
    {
      "mistake": "Overriding equals() but not hashCode()",
      "why": "Equal keys get different hashes, so they land in different buckets",
      "fix": "Override both from the same fields, or use a record"
    },
    {
      "mistake": "Using a mutable object as a key and changing it later",
      "why": "The stored hash no longer matches, so the entry is unreachable",
      "fix": "Use immutable keys (String, Integer, records)"
    },
    {
      "mistake": "Saying 'HashMap is O(1) always'",
      "why": "That is the average case; the worst case is O(n) for a list bin or O(log n) for a tree bin",
      "fix": "Say 'O(1) average, O(log n) worst case since Java 8'"
    },
    {
      "mistake": "Removing inside for-each",
      "why": "A structural change bumps modCount, so the iterator throws CME",
      "fix": "Use iterator.remove() or removeIf()"
    },
    {
      "mistake": "Sharing a HashMap across request threads",
      "why": "Lost updates and corrupted bins",
      "fix": "Use ConcurrentHashMap with compute/merge"
    }
  ],
  "cheatSheet": [
    "index = (n-1) & (h ^ h>>>16); n is a power of 2, default 16",
    "threshold = n × 0.75 → resize doubles n, lo/hi split by (hash & oldCap)",
    "treeify: bin ≥ 8 AND n ≥ 64 (else resize); untreeify ≤ 6",
    "Java 8 tail insert; Java 7 head insert (resize loop bug)",
    "1 null key (bucket 0), null values OK; CHM allows neither",
    "equals ⇒ same hashCode; never mutate keys",
    "for-each + remove → CME; use removeIf / iterator.remove",
    "Presize: n/0.75 + 1 or HashMap.newHashMap(n)",
    "Ordered → LinkedHashMap; sorted → TreeMap; threads → ConcurrentHashMap"
  ],
  "coachTakeaways": [
    "Bucket = (n-1) & spread(hashCode); n is always a power of two.",
    "Collisions chain in a list; a bin turns into a red-black tree at 8 nodes once the table has 64+ buckets.",
    "Resize happens past 0.75 × capacity, doubles the table, and splits each bin into lo/hi without a full rehash.",
    "equals and hashCode must agree; keys should be immutable.",
    "O(1) average, O(log n) worst case (Java 8+), never 'always O(1)'.",
    "HashMap is not thread-safe or ordered; pick LinkedHashMap, TreeMap or ConcurrentHashMap by need.",
    "Presize when you know the count to avoid repeated resizes."
  ],
  "myTakeaways": {
    "required": true,
    "minBullets": 3,
    "minWords": 30,
    "revealCoachTakeawaysAfterSave": true,
    "showFirst": true,
    "editable": true
  },
  "mcqs": {
    "passPct": 75,
    "shuffleOptions": true,
    "showExplanations": "after-submit",
    "questions": [
      {
        "id": "m1",
        "type": "concept",
        "difficulty": "basic",
        "q": "Default initial capacity and load factor of new HashMap<>()?",
        "options": [
          {
            "text": "16 and 0.75",
            "correct": true,
            "explanation": "Correct. The table is allocated lazily on the first put; threshold = 12."
          },
          {
            "text": "10 and 0.75",
            "correct": false,
            "explanation": "10 is ArrayList's default capacity, not HashMap's."
          },
          {
            "text": "16 and 1.0",
            "correct": false,
            "explanation": "1.0 would save memory but give longer chains; the default is 0.75."
          },
          {
            "text": "11 and 0.75",
            "correct": false,
            "explanation": "11 is Hashtable's legacy default; HashMap capacities are powers of two."
          }
        ]
      },
      {
        "id": "m2",
        "type": "misconception",
        "difficulty": "intermediate",
        "q": "A bucket reaches 8 entries while the table has 16 buckets. What happens?",
        "options": [
          {
            "text": "The bucket becomes a red-black tree",
            "correct": false,
            "explanation": "Only when the table has at least 64 buckets (MIN_TREEIFY_CAPACITY)."
          },
          {
            "text": "The table is resized instead",
            "correct": true,
            "explanation": "Correct. Below 64 buckets, resizing spreads the entries out more cheaply than a tree."
          },
          {
            "text": "An exception is thrown",
            "correct": false,
            "explanation": "HashMap never fails because of collisions."
          },
          {
            "text": "Nothing; buckets are unbounded lists",
            "correct": false,
            "explanation": "True before Java 8; Java 8 added treeify/resize."
          }
        ]
      },
      {
        "id": "m3",
        "type": "code-output",
        "difficulty": "intermediate",
        "q": "A class overrides equals() but not hashCode(). map.put(new P(1,2), \"A\"); then map.get(new P(1,2)) returns…",
        "options": [
          {
            "text": "\"A\"",
            "correct": false,
            "explanation": "The two objects have different identity hash codes, so the lookup goes to a different bucket."
          },
          {
            "text": "null (almost always)",
            "correct": true,
            "explanation": "Correct. Different buckets; equals() is never even called."
          },
          {
            "text": "Compilation error",
            "correct": false,
            "explanation": "It compiles; the contract is not enforced by the compiler."
          },
          {
            "text": "ClassCastException",
            "correct": false,
            "explanation": "No cast is involved."
          }
        ]
      },
      {
        "id": "m4",
        "type": "concept",
        "difficulty": "basic",
        "q": "Why does HashMap compute h ^ (h >>> 16)?",
        "options": [
          {
            "text": "To make hash codes positive",
            "correct": false,
            "explanation": "The result can still be negative; the & with (n-1) handles the index."
          },
          {
            "text": "To mix high bits into the low bits the index uses",
            "correct": true,
            "explanation": "Correct. With small tables only the low bits pick the bucket, so without the mix many keys would collide."
          },
          {
            "text": "For security against HashDoS",
            "correct": false,
            "explanation": "Treeification, not spreading, limits HashDoS damage."
          },
          {
            "text": "To encrypt the key",
            "correct": false,
            "explanation": "Hashing here is not cryptographic."
          }
        ]
      },
      {
        "id": "m5",
        "type": "scenario",
        "difficulty": "intermediate",
        "q": "You need an LRU cache of 1,000 entries in a single thread. Best starting point?",
        "options": [
          {
            "text": "LinkedHashMap with accessOrder=true and removeEldestEntry",
            "correct": true,
            "explanation": "Correct. Access order moves hits to the end; removeEldestEntry evicts the oldest."
          },
          {
            "text": "TreeMap",
            "correct": false,
            "explanation": "It is sorted by key, not by recency."
          },
          {
            "text": "HashMap plus sorting on every get",
            "correct": false,
            "explanation": "O(n log n) per operation."
          },
          {
            "text": "Hashtable",
            "correct": false,
            "explanation": "Legacy, synchronized, and keeps no order."
          }
        ]
      },
      {
        "id": "m6",
        "type": "misconception",
        "difficulty": "intermediate",
        "q": "Which statement about the Java 8+ HashMap is true?",
        "options": [
          {
            "text": "Iteration order is insertion order",
            "correct": false,
            "explanation": "That is LinkedHashMap. HashMap order is by bucket and can change after a resize."
          },
          {
            "text": "It allows one null key and many null values",
            "correct": true,
            "explanation": "Correct. The null key hashes to 0."
          },
          {
            "text": "It is safe for concurrent writes",
            "correct": false,
            "explanation": "Concurrent puts can lose updates; use ConcurrentHashMap."
          },
          {
            "text": "get() is O(n) in the worst case",
            "correct": false,
            "explanation": "A treeified bin gives O(log n) worst case since Java 8."
          }
        ]
      },
      {
        "id": "m7",
        "type": "code-output",
        "difficulty": "advanced",
        "q": "List<Integer> k = new ArrayList<>(List.of(1)); map.put(k, \"v\"); k.add(2); What do map.get(k) and map.size() return?",
        "options": [
          {
            "text": "\"v\", 1",
            "correct": false,
            "explanation": "k's hashCode changed, so the lookup goes to another bucket."
          },
          {
            "text": "null, 1",
            "correct": true,
            "explanation": "Correct. The entry is stranded under the old hash."
          },
          {
            "text": "null, 0",
            "correct": false,
            "explanation": "The entry is still stored, so size stays 1."
          },
          {
            "text": "It throws ConcurrentModificationException",
            "correct": false,
            "explanation": "Mutating a key is not an iteration over the map."
          }
        ]
      },
      {
        "id": "m8",
        "type": "concept",
        "difficulty": "advanced",
        "q": "During a resize from 16 to 32, where does an entry in old bucket 5 go?",
        "options": [
          {
            "text": "Bucket 5 or bucket 21, decided by hash & 16",
            "correct": true,
            "explanation": "Correct. One extra bit decides lo (same index) or hi (index + oldCap)."
          },
          {
            "text": "A fully recomputed random bucket",
            "correct": false,
            "explanation": "No full rehash is needed in Java 8."
          },
          {
            "text": "Always bucket 10",
            "correct": false,
            "explanation": "The index never doubles; it is either unchanged or shifted by oldCap."
          },
          {
            "text": "Bucket 5 always",
            "correct": false,
            "explanation": "Half the entries, on average, move to the hi bucket."
          }
        ]
      }
    ]
  },
  "interviewQuestions": [
    {
      "id": "iq1",
      "difficulty": "basic",
      "frequency": "very-high",
      "q": "How does HashMap work internally?",
      "modelAnswer": "It is an array of buckets. put() takes key.hashCode(), spreads it (h ^ h>>>16), and picks the bucket with (n-1) & hash. If the bucket is empty it stores a node; otherwise it walks the bucket comparing hash and equals(), and replaces the value or appends at the tail. When a bin reaches 8 nodes and the table has 64+ buckets it becomes a red-black tree. When size exceeds capacity × 0.75 the table doubles and every bin splits into lo/hi. get() follows the same path without inserting. That gives O(1) average and O(log n) worst case.",
      "sayItIn30s": "Array of buckets; hash → index; chain on collision, tree at 8; resize at 75% full; O(1) average.",
      "followUps": [
        {
          "q": "Why is the capacity a power of two?",
          "a": "So (n-1) & hash replaces the modulo and the resize split needs only one bit."
        },
        {
          "q": "What changed in Java 8?",
          "a": "Treeification, tail insertion, a simpler hash spread, and the lo/hi resize split."
        }
      ],
      "commonWrongAnswers": [
        "'It is always O(1)'",
        "'It uses equals() to find the bucket'",
        "Forgetting the 64-bucket condition for treeify"
      ]
    },
    {
      "id": "iq2",
      "difficulty": "basic",
      "frequency": "very-high",
      "q": "What is the equals/hashCode contract and what breaks if you violate it?",
      "modelAnswer": "If a.equals(b) then a.hashCode() == b.hashCode(). Equal hash codes do not imply equality. If you override equals without hashCode, two equal keys hash to different buckets, so get() returns null and duplicates appear in a HashSet. Generate both from the same immutable fields, or use a record.",
      "sayItIn30s": "Equal objects need equal hashes, or lookups miss and sets hold duplicates.",
      "followUps": [
        {
          "q": "Can two unequal objects have the same hashCode?",
          "a": "Yes, that is a collision; equals() then separates them."
        },
        {
          "q": "Why do records solve it?",
          "a": "They generate equals/hashCode/toString from all their components."
        }
      ],
      "commonWrongAnswers": [
        "'Same hashCode means equal'",
        "'Only equals matters for HashMap'"
      ]
    },
    {
      "id": "iq3",
      "difficulty": "basic",
      "frequency": "high",
      "q": "HashMap vs Hashtable vs ConcurrentHashMap?",
      "modelAnswer": "HashMap is unsynchronized and allows one null key and null values. Hashtable is legacy: every method is synchronized on one lock and no nulls are allowed. ConcurrentHashMap is thread-safe with lock-free reads and CAS/per-bin locking on writes; it allows no nulls and has atomic compute/merge. Use ConcurrentHashMap for shared state, HashMap otherwise.",
      "sayItIn30s": "HashMap single-thread; Hashtable legacy global lock; CHM fine-grained and the right concurrent choice.",
      "followUps": [
        {
          "q": "Why does CHM forbid null?",
          "a": "With null, get() returning null is ambiguous (absent or null value), and you cannot re-check atomically under concurrency."
        },
        {
          "q": "Is size() exact in CHM?",
          "a": "It is an estimate under concurrent updates (it sums counter cells)."
        }
      ],
      "commonWrongAnswers": [
        "'CHM locks the whole map'",
        "'Collections.synchronizedMap is the same as CHM'"
      ]
    },
    {
      "id": "iq4",
      "difficulty": "intermediate",
      "frequency": "high",
      "q": "What are load factor and rehashing? How do you avoid repeated resizes?",
      "modelAnswer": "The load factor (0.75) sets the threshold = capacity × 0.75. Past it, the table doubles and entries are redistributed with the lo/hi split. Each resize is O(n), so for a known size presize with n / 0.75 + 1, or HashMap.newHashMap(n) in Java 19+.",
      "sayItIn30s": "75% full → double; presize to skip resizes.",
      "followUps": [
        {
          "q": "What if the load factor is 1.0?",
          "a": "Less memory, more collisions, slower lookups."
        },
        {
          "q": "Does a resize ever shrink the table?",
          "a": "No, HashMap never shrinks."
        }
      ],
      "commonWrongAnswers": [
        "'new HashMap<>(1000) holds 1000 entries without resizing'; its threshold is 768 (capacity rounds to 1024 × 0.75)"
      ]
    },
    {
      "id": "iq5",
      "difficulty": "intermediate",
      "frequency": "high",
      "q": "Why did Java 8 add treeification, and when does it happen?",
      "modelAnswer": "To bound the worst case. With many collisions (bad hashCode or HashDoS) a list bin makes lookups O(n). Java 8 converts a bin to a red-black tree when it has 8+ nodes and the table has 64+ buckets (otherwise it resizes first), and back to a list at 6 or fewer. Tree order uses compareTo if keys are Comparable, otherwise a tie-break.",
      "sayItIn30s": "8 nodes and 64 buckets → tree, so the worst case is O(log n); back to a list at 6.",
      "followUps": [
        {
          "q": "Why 8?",
          "a": "With a good hash, bin sizes follow a Poisson distribution; 8 is extremely unlikely (~10^-8), so trees appear only in pathological cases."
        }
      ],
      "commonWrongAnswers": [
        "Forgetting the 64 minimum",
        "'Trees make HashMap sorted'"
      ]
    },
    {
      "id": "iq6",
      "difficulty": "scenario",
      "frequency": "medium",
      "q": "A teammate reports that map.get(key) returns null even though map.size() grew after put(key, v). The key is a mutable object. What happened?",
      "modelAnswer": "The entry stays in the bucket chosen by the old hash. Lookups with the mutated key compute a new hash and miss, so get() returns null while size() still counts the entry: a memory leak and a logic bug. Keys should be immutable.",
      "sayItIn30s": "The entry gets stranded under the old hash; use immutable keys.",
      "followUps": [
        {
          "q": "Why is String a good key?",
          "a": "It is immutable and caches its hashCode."
        }
      ],
      "commonWrongAnswers": [
        "'HashMap rehashes the key automatically'"
      ]
    },
    {
      "id": "iq7",
      "difficulty": "intermediate",
      "frequency": "medium",
      "q": "What is a fail-fast iterator? How do you remove while iterating?",
      "modelAnswer": "HashMap iterators check modCount. A structural change not made through the iterator throws ConcurrentModificationException on the next step. It is best-effort, not a thread-safety guarantee. Remove with iterator.remove() or map.entrySet()/values().removeIf(...). Concurrent collections have weakly consistent iterators that never throw CME.",
      "sayItIn30s": "modCount check → CME; use iterator.remove or removeIf.",
      "followUps": [
        {
          "q": "Does changing a value with put on an existing key throw CME?",
          "a": "No, replacing a value is not a structural change."
        }
      ],
      "commonWrongAnswers": [
        "'CME only happens with multiple threads'"
      ]
    },
    {
      "id": "iq8",
      "difficulty": "advanced",
      "frequency": "medium",
      "q": "What goes wrong when multiple threads write to a HashMap?",
      "modelAnswer": "Lost updates (two puts race on the same bin or on size), entries vanishing during a resize, and corrupted bins. In Java 7, head insertion during a concurrent resize could create a cycle, so get() looped forever. Java 8 uses tail insertion, which avoids that loop, but it is still not thread-safe. Use ConcurrentHashMap and its atomic merge/compute.",
      "sayItIn30s": "Races lose data; Java 7 could infinite-loop; use CHM.",
      "followUps": [
        {
          "q": "Is map.put(k, map.get(k) + 1) safe on CHM?",
          "a": "No, check-then-act is not atomic; use merge(k, 1, Integer::sum)."
        }
      ],
      "commonWrongAnswers": [
        "'Making the field volatile fixes it'"
      ]
    },
    {
      "id": "iq9",
      "difficulty": "advanced",
      "frequency": "medium",
      "q": "Design an LRU cache with O(1) get/put.",
      "modelAnswer": "Use a HashMap from key to node plus a doubly linked list ordered by recency. get moves the node to the head; put inserts at the head and evicts the tail when over capacity. In Java you can extend LinkedHashMap(capacity, 0.75f, true) and override removeEldestEntry. For concurrency, use a lock or Caffeine.",
      "sayItIn30s": "HashMap + doubly linked list, or LinkedHashMap with accessOrder.",
      "followUps": [
        {
          "q": "How would you make it thread-safe?",
          "a": "Use a ReentrantLock around operations, segment it, or use Caffeine (W-TinyLFU)."
        }
      ],
      "commonWrongAnswers": [
        "Using a TreeMap keyed by timestamp (O(log n) and duplicate timestamps)"
      ]
    },
    {
      "id": "iq10",
      "difficulty": "scenario",
      "frequency": "medium",
      "q": "A service's p99 latency jumps and profiling shows time in HashMap.get on a map keyed by a custom class. What do you check?",
      "modelAnswer": "Check hashCode() quality: is it constant, does it use few fields, or does it match the input pattern? Check that equals/hashCode agree, whether keys are mutable, and whether the map is shared between threads without synchronization (corruption or contention). Also check the map size against capacity (repeated resizes). Fix the hash (Objects.hash or a record), make keys immutable, presize, or switch to ConcurrentHashMap.",
      "sayItIn30s": "Bad hashCode → long chains; check the contract, mutability, sharing and presizing.",
      "followUps": [
        {
          "q": "How can you prove it is collisions?",
          "a": "Count distinct hashCodes against the map size, or run a JMH micro-benchmark."
        }
      ],
      "commonWrongAnswers": [
        "'Increase the heap'",
        "'Switch to TreeMap' without fixing the hash"
      ]
    }
  ],
  "practice": [
    {
      "id": "JC-HM-p1",
      "kind": "guided",
      "difficulty": "medium",
      "minutes": 25,
      "title": "Build a mini HashMap",
      "prompt": "Implement MyHashMap<K,V> with put/get/remove/size using an array of linked nodes, the same spread + (n-1) & hash indexing, and resize at 0.75 that doubles and redistributes. No java.util maps.",
      "starter": "https://github.com/<deepak>/study-desk-practice/tree/main/JC-HM",
      "acceptance": [
        "All 12 JUnit tests in MyHashMapTest pass (put/get/overwrite/remove/null key/collision/resize)",
        "Resize happens exactly when size > threshold (test asserts capacity 32 after the 13th put)",
        "No java.util.Map used inside",
        "README explains your hash and resize in 5 lines"
      ],
      "evidence": {
        "type": "github-link",
        "required": true
      }
    },
    {
      "id": "JC-HM-p2",
      "kind": "problem",
      "difficulty": "medium",
      "minutes": 20,
      "title": "Design HashMap (GfG Practice)",
      "url": "https://www.geeksforgeeks.org/problems/design-hashmap/1",
      "acceptance": [
        "Accepted on GfG",
        "State time and space complexity in the evidence note"
      ],
      "evidence": {
        "type": "link-or-screenshot",
        "required": true
      }
    }
  ],
  "flashcards": [
    {
      "id": "f1",
      "front": "Bucket index formula?",
      "back": "(n-1) & (h ^ (h >>> 16)), n = power of two"
    },
    {
      "id": "f2",
      "front": "Default capacity / load factor / threshold?",
      "back": "16 / 0.75 / 12"
    },
    {
      "id": "f3",
      "front": "When does a bin treeify?",
      "back": "≥ 8 nodes AND table ≥ 64 buckets (else resize); untreeify at ≤ 6"
    },
    {
      "id": "f4",
      "front": "Resize: where do entries from old bucket i go?",
      "back": "i or i + oldCap, decided by hash & oldCap"
    },
    {
      "id": "f5",
      "front": "equals/hashCode contract?",
      "back": "equals ⇒ same hashCode; same hashCode does not imply equals"
    },
    {
      "id": "f6",
      "front": "Null rules: HashMap vs ConcurrentHashMap?",
      "back": "HashMap: 1 null key, null values. CHM: no nulls"
    },
    {
      "id": "f7",
      "front": "Remove while iterating safely?",
      "back": "iterator.remove() or removeIf(); for-each + map.remove → CME"
    },
    {
      "id": "f8",
      "front": "Worst-case get since Java 8?",
      "back": "O(log n) for tree bins (O(n) for list bins before treeify)"
    }
  ],
  "revision": {
    "offsetsDays": [
      1,
      3,
      7,
      21
    ],
    "items": [
      "flashcards",
      "cheatSheet",
      "myTakeaways",
      "missedMcqs",
      "weakInterviewQuestions"
    ]
  },
  "connections": {
    "lld": [
      "LRU cache design (LinkedHashMap)",
      "In-memory key-value store machine-coding round"
    ],
    "hld": [
      "Consistent hashing for sharding",
      "Redis hash slots",
      "Distributed cache design"
    ],
    "dsa": [
      "DSA-03 Hashing and frequency maps",
      "DSA-36 Design data structures: LRU"
    ],
    "concurrency": [
      "CC-04 ConcurrentHashMap internals"
    ]
  },
  "miniProjectHooks": [
    {
      "projectId": "splitwise-backend",
      "feature": "In-memory balance cache Map<UserId, BigDecimal> as a ConcurrentHashMap, later replaced by Redis",
      "when": "after SB-03"
    },
    {
      "projectId": "splitwise-backend",
      "feature": "Idempotency-key store (key → response) with TTL eviction",
      "when": "after HLD idempotency"
    }
  ],
  "selfRating": {
    "scale": 5,
    "askAfter": [
      "notes",
      "mcq",
      "interview"
    ],
    "lowThreshold": 3,
    "onLow": "add an extra revision on day +2 and mark the topic weak"
  },
  "tags": [
    "collections",
    "hashing",
    "interview-core",
    "java-8"
  ]
}
```
