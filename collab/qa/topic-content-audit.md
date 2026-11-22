# Study Desk topic content and backend audit

Reviewed the local 55-session course at `64fa8b4` on 22 November 2026 IST and checked its normal lesson routes. The index now exposes 116 named topic IDs, each linked to its study day and its original stable lesson ID. The existing [124-item requirements audit](curriculum-124-topic-audit.md) measures an independent syllabus and interview checklist against the frozen 54-session baseline. Its 19 covered, 85 partial and 20 missing rows describe the baseline and should remain comparable as the authored topics expand. A single checklist item can refer to several topics, so the two counts have different denominators.

## What the index and lessons currently support

| Subject | Indexed topics | Dedicated topic material | Important remaining teaching gaps |
| --- | ---: | ---: | --- |
| Java, Streams/APIs and concurrency | 14 | 3 | Strings and pool behavior, records/sealed classes, CompletableFuture, collector examples, executor rejection and compare-the-locks fixtures. The current dedicated lessons cover equality/hash codes, stream laziness and monitor visibility. |
| SQL and data | 10 | 1 | Real joins, aggregates, window-query outputs, normalization, composite-index plans and JDBC pool saturation. The transaction topic now explains two-connection isolation with expected results. |
| Spring Boot and backend | 17 | 1 | Bean lifecycle/configuration, global error handling, async/scheduling, OAuth login, container tests and working Redis/Kafka integrations. The validation topic now separates decoding, DTO validation, domain checks and write evidence. |
| Low-level design | 8 | 1 | Structured practice across creational, structural and behavioral patterns, independent cases and code-backed UML. The class and sequence diagrams topic includes a changed requirement and an invariant test. |
| System design | 22 | 1 | Consistent hashing, PACELC, rate limiting, cache strategies, operational trade-offs and independent case studies. The estimation topic now has measured units, hot-key and cache math, and failure reasoning. |
| DSA in Java | 26 | 1 | The [73-row GFG DSA audit](curriculum-dsa-coverage.md) records the granular gaps. High-priority repairs include sieve, monotone feasibility, explicit backtracking cases, tree/heap operations and DP variants. Union-Find has its own explanation and a runnable example in its parent session. |
| AI engineering | 19 | 1 | Attention worked trace, reranking measurement, runnable agent/MCP exercise and a reproducible Java RAG integration. The RAG topic now includes distinct retrieval and grounding failure tests. |

Nine topics have dedicated learning content. The other 107 have an index, a link to their parent session and a personal takeaway field. A parent lesson can teach one or more of those topics, and still require a narrower teaching explanation or diagnostic questions. The index makes that status visible. Keep the [96-session plan](curriculum-repair-plan.md) open for explicitly missing topics that do not have existing scheduled IDs.

## Is the current material sufficient?

| Item | Verified at baseline | Consequence |
| --- | --- | --- |
| English notes | All 55 sessions render notes. 51 have under 400 words including their worked example. | A word count is a screening signal. For a bundled topic, check whether the mechanism, conditions, examples and failure cases are actually explained. Most sessions are an introduction with applied prompts. |
| Worked teaching evidence | All 55 have written worked examples. 26 have interactive diagrams. Three sessions display self-contained Java examples already executed under Java 21. | Add runnable Java, checked SQL or a testable design artifact where that is the learning goal. Written instructions alone leave the expected output and diagnosis uncertain. |
| Interviews | 167 day-level questions with answers, ranging from three to five per day. | A three-question bank can cover a narrow lesson well. On a day with several concepts, inspect mapping and answer quality per topic. The nine dedicated packets add 30 topic-specific questions. |
| MCQ and revision | 53 daily quizzes have three questions, and two have five. All 55 sessions provide revision prompts. | A quiz score mainly measures recognition. Follow a wrong answer with the underlying explanation or a changed case, and use coding/diagramming for application. Eight new focused topics have diagnostic checks and UML uses explanation instead. |
| Learner evidence | Every current session includes at least one explicitly rendered acceptance check on each practice item. | Acceptance criteria guide the learner. Individual Java, SQL and integration labs still need execution evidence before being reported as tested. |

## Authoring criteria per topic

1. **Notes.** Explain the mental model, mechanism or invariant, inputs and preconditions, one traced case, one failure or misconception, and the trade-off. Include a verified direct source. A visual belongs where state, ordering or architecture changes the answer.
2. **Interview practice.** A narrow topic gets three questions covering explanation, outcome or debugging, and a changed scenario. A broader interview topic gets four or five adding implementation, proof or trade-offs. Give an answer and observable evidence to look for. Render model answers collapsed. Limit a live practice round to five priorities and use one follow-up at a time.
3. **Takeaways.** Coach takeaways summarize three or four portable rules. The learner writes a personal rule, mistake and example in their own words. Practice and revision use the learner’s retained notes separately from the coach copy.
4. **MCQs.** Use one or two diagnostic items when an output, invariant or plausible misconception can be isolated. Explain the distinction after the attempt. Use a coding task, SQL result or diagram for topics where the judgment would be artificial as multiple choice.
5. **Practice and readiness.** Use a task with observable output and a failure or boundary case. Treat topic notes, questions and links as authoring evidence. Record execution separately for a runnable lab and keep any content gaps visible.

## Backend changes and open work

- Private topic takeaways now use stable topic IDs alongside the original day notes. They use the existing browser store and authenticated SQLite revision API. A stale save retains the learner draft and shows the current value for comparison. Notes on two topics within a day remain separate. Saved topic takeaways also appear under day revision.
- A dedicated topic route exposes the teaching record, interview questions, practice, optional concept check, references and coach takeaways. Questions reveal their answers only by opening them. The new checks give instant formative feedback. Daily scored assessments remain the completion gate.
- Open work includes authoring the other topic records and entirely missing lessons, recording item-level mock/MCQ attempts and misconceptions, and tracked per-topic revision at +1/+3/+7. The current revision feature links day recalls and displays personal notes. Video playback still needs independent verification. The 96-slot proposal requires schedule migration.
- The personal editor accepts typed takeaways. Its contents belong to the learner and are not prefilled with coach notes. There is no image upload workflow for photos of handwritten notebooks in this change.
- The local branch contains the verified host and backend. The public GitHub connection previously rejected branch pushes and PR comments with HTTP 403. An online deployment must also have the authenticated SQLite server to support sharing takeaways across devices.

## Work split for Grok

Codex owns the topic IDs, data, technical lesson accuracy, authoring checks and private persistence. Grok can independently adapt the v2 UI to the index and dedicated materials, render a searchable topic tree with explicit materials status, show coach and learner takeaways separately, and test the routes, mobile layout and answer reveal. Use exact IDs and let the host persist through the action contract below. For parallel content preparation, Grok can draft independent LLD machine-coding cases in its own branch for technical review before they become canonical lessons.

| Interface | Read or action |
| --- | --- |
| Index | `topic-index.js` exports `topicIndex[]` records with `id`, `title`, `subject`, `day` and `lessonId`. |
| Materials | `topic-lessons.js` exports `topicLessons[id]` with `notes`, `interview`, `takeaways`, `practice`, optional `check` and `references`. Absent records still have a valid parent-day link. |
| Learner state | `progress.topicTakeaways[id]` contains the learner’s saved text. |
| Save | Send `{ kind: 'topicTakeaway', topicId, text, base }` through the normal revisioned progress action. `base` is the text last seen by the editor. A stale account revision or outdated base refuses the overwrite. Preserve the draft and let the learner compare versions. |

## Topic-by-topic inventory

A session link means the existing day material is available. Dedicated means the individual topic has its own notes, questions, takeaways and practice in this checkpoint. The learner takeaway editor uses the exact topic ID on every row.

| Subject | Topic | Topic ID | Day and parent lesson ID | Dedicated material | Interview questions | Diagnostic MCQ |
| --- | --- | --- | --- | --- | ---: | --- |
| Java | Objects, encapsulation and ownership | `j-oop-01` | 1 · `j-oop-01` | Session link | — | — |
| Java | Thread interleavings and races | `j-concurrency-01` | 2 · `j-concurrency-01` | Session link | — | — |
| Java | Synchronization, visibility and atomicity | `j-concurrency-02` | 3 · `j-concurrency-02` | Written | 4 | Yes |
| Java | Equality and hash codes | `j-equality-01` | 4 · `j-equality-01` | Written | 3 | Yes |
| Java | Collection choice and stable keys | `j-collections-01` | 4 · `j-equality-01` | Session link | — | — |
| Java | Java method and type contracts | `j-oop-02` | 5 · `j-oop-02` | Session link | — | — |
| Java | Exceptions and failure outcomes | `j-exceptions-01` | 5 · `j-oop-02` | Session link | — | — |
| Java | Generics and wildcards | `j-generics-01` | 6 · `j-generics-01` | Session link | — | — |
| Java | Lazy stream pipelines | `j-streams-01` | 6 · `j-generics-01` | Written | 3 | Yes |
| Java | Executors, futures and bounded work | `j-executors-01` | 7 · `j-executors-01` | Session link | — | — |
| Java | Thread stacks and shared objects | `j-jvm-01` | 7 · `j-executors-01` | Session link | — | — |
| Java | Maven builds and the application context | `j-build-01` | 9 · `j-build-01` | Session link | — | — |
| Java | JVM diagnostics and memory | `j-jvm-02` | 46 · `j-jvm-02` | Session link | — | — |
| Java | Virtual threads and resource limits | `j-executors-02` | 46 · `j-jvm-02` | Session link | — | — |
| Low-level design | Domain invariants | `l-invariants-01` | 1 · `j-oop-01` | Session link | — | — |
| Low-level design | Domain and service responsibilities | `l-responsibilities-01` | 5 · `j-oop-02` | Session link | — | — |
| Low-level design | Class and sequence diagrams | `l-uml-01` | 8 · `l-uml-01` | Written | 3 | — |
| Low-level design | SOLID and dependency boundaries | `l-solid-01` | 8 · `l-uml-01` | Session link | — | — |
| Low-level design | Hold states and expiry | `l-invariants-02` | 19 · `l-invariants-02` | Session link | — | — |
| Low-level design | Machine coding with a cache invariant | `l-machine-01` | 29 · `d-lru-02` | Session link | — | — |
| Low-level design | Cross-instance invariant tests | `l-machine-02` | 44 · `h-case-up-01` | Session link | — | — |
| Low-level design | Machine-coding interview practice | `l-review-01` | 45 · `l-review-01` | Session link | — | — |
| System design | Browser-to-server request flow | `h-request-01` | 1 · `j-oop-01` | Session link | — | — |
| System design | Multiple application instances | `h-scaling-01` | 17 · `h-scaling-01` | Session link | — | — |
| System design | Functional and non-functional requirements | `h-requirements-01` | 18 · `h-requirements-01` | Session link | — | — |
| System design | Capacity estimates and hot keys | `h-estimates-01` | 18 · `h-requirements-01` | Written | 3 | Yes |
| System design | Recovery after a lost response | `h-reliability-01` | 20 · `b-http-02` | Session link | — | — |
| System design | Replication, partitioning and sharding | `h-databases-01` | 21 · `h-databases-01` | Session link | — | — |
| System design | Cache staleness and invalidation | `h-caching-01` | 22 · `b-caching-01` | Session link | — | — |
| System design | Message redelivery and deduplication | `h-queues-01` | 23 · `b-messaging-01` | Session link | — | — |
| System design | Load balancing and traffic experiments | `h-loadbalance-01` | 24 · `h-loadbalance-01` | Session link | — | — |
| System design | Latency percentiles and queue wait | `h-observability-01` | 24 · `h-loadbalance-01` | Session link | — | — |
| System design | Consistency choices during a partition | `h-consistency-01` | 25 · `h-consistency-01` | Session link | — | — |
| System design | Timeouts and degraded operation | `h-reliability-02` | 25 · `h-consistency-01` | Session link | — | — |
| System design | Readiness, liveness and request signals | `h-observability-02` | 34 · `b-deployment-01` | Session link | — | — |
| System design | Seat Booking capstone architecture | `h-case-up-01` | 44 · `h-case-up-01` | Session link | — | — |
| System design | Project architecture walkthrough | `h-review-01` | 45 · `l-review-01` | Session link | — | — |
| System design | Token audience, scope and ownership | `h-security-01` | 48 · `b-security-02` | Session link | — | — |
| System design | Gateway, REST, GraphQL and gRPC | `h-api-01` | 49 · `h-api-01` | Session link | — | — |
| System design | SSE, WebSockets and replay | `h-realtime-01` | 49 · `h-api-01` | Session link | — | — |
| System design | Transactional outbox and idempotent consumer | `h-queues-02` | 50 · `h-queues-02` | Session link | — | — |
| System design | Saga compensation and failure isolation | `h-reliability-03` | 50 · `h-queues-02` | Session link | — | — |
| System design | Release pipeline and deployment | `h-cloud-01` | 51 · `h-cloud-01` | Session link | — | — |
| System design | Service level indicators and error budgets | `h-observability-03` | 51 · `h-cloud-01` | Session link | — | — |
| AI engineering | Training, inference and application boundaries | `ai-foundations-01` | 1 · `j-oop-01` | Session link | — | — |
| AI engineering | Neural networks, attention and token prediction | `ai-foundations-02` | 35 · `ai-foundations-02` | Session link | — | — |
| AI engineering | Model comparison and inference budgets | `ai-models-01` | 35 · `ai-foundations-02` | Session link | — | — |
| AI engineering | Prompt instructions, examples and constraints | `ai-prompting-01` | 36 · `ai-prompting-01` | Session link | — | — |
| AI engineering | Structured output and semantic validation | `ai-structured-01` | 36 · `ai-prompting-01` | Session link | — | — |
| AI engineering | Java model-provider adapter | `ai-model-api-01` | 37 · `ai-model-api-01` | Session link | — | — |
| AI engineering | Embeddings and vector similarity | `ai-embeddings-01` | 38 · `ai-embeddings-01` | Session link | — | — |
| AI engineering | Hybrid retrieval and metadata filters | `ai-retrieval-01` | 38 · `ai-embeddings-01` | Session link | — | — |
| AI engineering | Retrieval and grounded generation | `ai-rag-01` | 39 · `ai-rag-01` | Written | 4 | Yes |
| AI engineering | Evaluate retrieval and answer support | `ai-evaluation-01` | 40 · `ai-evaluation-01` | Session link | — | — |
| AI engineering | Measure AI behavior in production | `ai-operations-01` | 40 · `ai-evaluation-01` | Session link | — | — |
| AI engineering | Tool calling and authorization | `ai-tools-01` | 41 · `ai-tools-01` | Session link | — | — |
| AI engineering | MCP clients, servers and trust boundaries | `ai-mcp-01` | 41 · `ai-tools-01` | Session link | — | — |
| AI engineering | Model input and output safeguards | `ai-security-01` | 42 · `ai-security-01` | Session link | — | — |
| AI engineering | Model timeouts, costs and fallback | `ai-operations-02` | 42 · `ai-security-01` | Session link | — | — |
| AI engineering | Prompting, RAG and model customization | `ai-customization-01` | 43 · `ai-customization-01` | Session link | — | — |
| AI engineering | Explain and demonstrate AI design decisions | `ai-review-01` | 45 · `l-review-01` | Session link | — | — |
| AI engineering | Local and hosted Java model deployment | `ai-operations-03` | 54 · `ai-operations-03` | Session link | — | — |
| AI engineering | Grounding and independent booking checks | `ai-review-02` | 54 · `ai-operations-03` | Session link | — | — |
| DSA in Java | Find duplicate IDs with a set | `d-hashing-01` | 1 · `j-oop-01` | Session link | — | — |
| DSA in Java | Hash collisions and lookup costs | `d-hashing-02` | 4 · `j-equality-01` | Session link | — | — |
| DSA in Java | Cache capacity and eviction trade-offs | `d-lru-01` | 22 · `b-caching-01` | Session link | — | — |
| DSA in Java | Time, space and input size | `d-complexity-01` | 26 · `d-complexity-01` | Session link | — | — |
| DSA in Java | Array scans and prefix sums | `d-arrays-01` | 26 · `d-complexity-01` | Session link | — | — |
| DSA in Java | Recursion, factorial and Fibonacci | `d-recursion-02` | 26 · `d-complexity-01` | Session link | — | — |
| DSA in Java | Two pointers and sliding windows | `d-pointers-01` | 27 · `d-pointers-01` | Session link | — | — |
| DSA in Java | Binary search and lower bound | `d-search-01` | 27 · `d-pointers-01` | Session link | — | — |
| DSA in Java | Sorting and stability | `d-sort-01` | 28 · `d-sort-01` | Session link | — | — |
| DSA in Java | Linked-list reversal | `d-linkedlist-01` | 28 · `d-sort-01` | Session link | — | — |
| DSA in Java | Stacks and delimiter validation | `d-stacks-01` | 28 · `d-sort-01` | Session link | — | — |
| DSA in Java | Implement an LRU cache | `d-lru-02` | 29 · `d-lru-02` | Session link | — | — |
| DSA in Java | Queues and recency operations | `d-queues-01` | 29 · `d-lru-02` | Session link | — | — |
| DSA in Java | Recursion in tree traversal | `d-recursion-01` | 30 · `d-recursion-01` | Session link | — | — |
| DSA in Java | Binary trees and BST traversal | `d-trees-01` | 30 · `d-recursion-01` | Session link | — | — |
| DSA in Java | Priority queues and top-k | `d-heaps-01` | 30 · `d-recursion-01` | Session link | — | — |
| DSA in Java | Graph traversal, BFS and DFS | `d-graphs-01` | 31 · `d-graphs-01` | Session link | — | — |
| DSA in Java | Greedy interval selection | `d-greedy-01` | 32 · `d-greedy-01` | Session link | — | — |
| DSA in Java | Dynamic programming for weighted intervals | `d-dp-01` | 32 · `d-greedy-01` | Session link | — | — |
| DSA in Java | Backtracking and valid pruning | `d-backtracking-01` | 52 · `d-backtracking-01` | Session link | — | — |
| DSA in Java | Topological order and weighted paths | `d-graphs-02` | 52 · `d-backtracking-01` | Session link | — | — |
| DSA in Java | Euclid’s GCD algorithm | `d-math-01` | 53 · `d-math-01` | Session link | — | — |
| DSA in Java | Matrix rotation and rectangular dimensions | `d-matrix-01` | 53 · `d-math-01` | Session link | — | — |
| DSA in Java | Subset sum and interval DP | `d-dp-02` | 53 · `d-math-01` | Session link | — | — |
| DSA in Java | Union-Find and dynamic connectivity | `d-union-find-01` | 55 · `d-union-find-01` | Written | 4 | Yes |
| DSA in Java | Kruskal and minimum spanning forests | `d-mst-01` | 55 · `d-union-find-01` | Session link | — | — |
| Spring Boot & backend | Unit tests around real domain behavior | `b-testing-01` | 8 · `l-uml-01` | Session link | — | — |
| Spring Boot & backend | Spring constructor injection | `b-di-01` | 9 · `j-build-01` | Session link | — | — |
| Spring Boot & backend | HTTP methods and status codes | `b-http-01` | 10 · `b-http-01` | Session link | — | — |
| Spring Boot & backend | REST endpoints | `b-rest-01` | 10 · `b-http-01` | Session link | — | — |
| Spring Boot & backend | Request validation and API errors | `b-validation-01` | 11 · `b-validation-01` | Written | 3 | Yes |
| Spring Boot & backend | JPA entities, flush and N+1 | `b-jpa-01` | 16 · `b-jpa-01` | Session link | — | — |
| Spring Boot & backend | PostgreSQL integration tests | `b-testing-02` | 16 · `b-jpa-01` | Session link | — | — |
| Spring Boot & backend | Idempotency keys | `b-http-02` | 20 · `b-http-02` | Session link | — | — |
| Spring Boot & backend | Redis cache-aside and eviction | `b-caching-01` | 22 · `b-caching-01` | Session link | — | — |
| Spring Boot & backend | Kafka partitions, consumer groups and offsets | `b-messaging-01` | 23 · `b-messaging-01` | Session link | — | — |
| Spring Boot & backend | Authentication and resource authorization | `b-security-01` | 33 · `b-security-01` | Session link | — | — |
| Spring Boot & backend | Security regression tests | `b-testing-03` | 33 · `b-security-01` | Session link | — | — |
| Spring Boot & backend | Packaging a Java service | `b-deployment-01` | 34 · `b-deployment-01` | Session link | — | — |
| Spring Boot & backend | Spring AI ChatClient boundary | `b-ai-01` | 37 · `ai-model-api-01` | Session link | — | — |
| Spring Boot & backend | Spring proxies and cross-cutting concerns | `b-di-02` | 47 · `b-di-02` | Session link | — | — |
| Spring Boot & backend | OAuth 2.0 and OIDC in Spring | `b-security-02` | 48 · `b-security-02` | Session link | — | — |
| Spring Boot & backend | Demonstrate an end-to-end Java build | `b-deployment-02` | 54 · `ai-operations-03` | Session link | — | — |
| SQL and data | Relational schema and constraints | `b-sql-01` | 12 · `b-sql-01` | Session link | — | — |
| SQL and data | Schema migrations | `b-schema-01` | 12 · `b-sql-01` | Session link | — | — |
| SQL and data | JDBC and parameter binding | `b-jdbc-01` | 13 · `b-jdbc-01` | Session link | — | — |
| SQL and data | Transaction boundaries and isolation | `b-transactions-01` | 13 · `b-jdbc-01` | Written | 3 | Yes |
| SQL and data | Atomic conditional writes | `b-transactions-02` | 14 · `b-transactions-02` | Session link | — | — |
| SQL and data | Pessimistic and optimistic locking | `b-transactions-03` | 15 · `b-transactions-03` | Session link | — | — |
| SQL and data | Atomic hold confirmation | `b-transactions-04` | 19 · `l-invariants-02` | Session link | — | — |
| SQL and data | SQL indexes and query plans | `b-sql-02` | 21 · `h-databases-01` | Session link | — | — |
| SQL and data | JdbcTemplate and row mapping | `b-jdbc-02` | 47 · `b-di-02` | Session link | — | — |
| SQL and data | Spring rollback and transaction propagation | `b-transactions-05` | 47 · `b-di-02` | Session link | — | — |


## Cross-check against Grok’s content standard · 22 November 2026 IST

Grok's [fixture audit and sample](content-standard-2026-11-22.md) reviewed the 42-session UI preview. The real curriculum on draft PR #5 has 55 sessions and 116 indexed topics. The fixture's 164-topic target excludes DSA and its 96 missing items belong to that fixture. The 124-item baseline checklist, 73 published DSA outline bullets, real index and Grok proposal measure different sets. Keep their revisions and denominators in the audit.

| Finding in Grok’s preview | Evidence in the real snapshot at `dd96648` | Remaining work |
| --- | --- | --- |
| Redis, Kafka and microservices need teaching | Day 22 predicts cache-aside and TTL behavior. Day 23 traces offsets and replay. Days 49–50 cover gateways and compensations in neighboring scope. | Executable Redis/Kafka labs and a standalone service integration covering discovery and resilience. |
| Git, Docker, CI and deployment need a track | Days 9, 34 and 51 cover Maven, service readiness and release concepts. | Git workflow, a runnable Compose environment, CI checks and a verified rollback. |
| Projects, behavioral coaching and mocks need separate tracks | Days 44–45 have a Seat Booking capstone, checks and an architecture walkthrough. | Independent Splitwise and rental projects, behavioral STAR drills and timed rubric-driven mocks across subjects. |
| Notes, quiz feedback, video and interview evidence were thin | The real program renders 55 written worked examples, 167 day-level answered interview questions, dedicated reading links and day quizzes. In the published snapshot 51 sessions still had short instructional text and three displayed verified standalone Java snippets. | Inspect depth per topic. Check video playback and lab outputs independently. Improve questions by misconception and outcome. |
| Streaks, synchronization, and email require a backend | Account-backed SQLite progress and opt-in reminder outbox exist locally. Saved topic takeaways are keyed independently. | Deploy the account API and verify it online. Missing items include item-level attempts, spaced-revision due state and a durable engagement ledger. A provider and verified sender are needed for live email. |
| HashMap sample and three teaching levels | Day 4 had equality and hashing and a stable-ID collections topic linked to the parent session. | Adopt the useful format by teaching scope and time budget. The fixed word and question quotas, mandatory takeaway gate, and +21 reminder are proposals pending agreement. |

### First repaired topic

Day 4 now gives `j-collections-01` a dedicated Java 21 HashMap lesson, a collision trace, five model answers, a diagnostic check and a 20-minute exercise with expected outcomes. Existing day and topic IDs are retained. The index has 10 dedicated packets across 116 topics after this change. The lesson links the runnable HashIndex and BrokenKey examples and uses OpenJDK's implementation to qualify the sample's tree-bin and worst-case claims. The sample's placeholder project URL and instructor video remain outside the published lesson.

Next editorial batch maps the individual Java core rows in Grok's audit to the real topic IDs and verifies source locators. The source coverage audit resumes at LLD PDF p. 2. The DSA repair sequence still starts with Class 1 bit operations and Class 2 primes/sieve/LCM. [Coverage checkpoint](curriculum-audit-checkpoint.md)

Verification passed with Java 21 for all three Grok programs. Nine Node tests passed. Chromium verified 30 route and layout cases, matching Learn and Coach content for all 55 sessions, and two independent clients sharing the same account. The revised browser test checks the HashMap page's lab link, five answered interview questions and independent topic takeaways. The shared HashMap concurrency total varies across executions because the sample intentionally demonstrates an unsafe update.
