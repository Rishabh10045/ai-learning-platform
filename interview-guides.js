// Guidance follows the question order in session-qa.js. Write answers as evidence a learner can explain aloud.
export const interviewGuides = {
  1: [
    'Start with A1 unowned. The first valid claim changes the owner to U1 and returns success. The second sees U1 and returns a conflict without mutating the seat. Assert both return values and the final owner. This sequential trace establishes the invariant before Day 2 exercises overlapping calls.',
    'Add a transition from booked to unowned. Authorize the current owner or an explicitly authorized staff operation first. Check the identity against the current booking in the same protected operation that releases it, and keep a record of the cancellation.',
    'The browser submits a request. The API validates its shape and identity, then the service attempts a guarded write in the authoritative store. The API maps a committed creation or lost race to the appropriate response. A cached GET or an older UI snapshot can still show A1 as free.',
    'Training adjusts model parameters using data. Inference uses existing parameters and the supplied prompt to produce help text. An answer about the cancellation policy can be generated and checked against evidence. Authorization, seat ownership and conflict decisions remain ordinary application/database rules.',
    'While scanning n IDs, add each to a set and detect a duplicate when an insert finds an existing entry. Expected O(n) time and O(u) space for u distinct seen IDs, assuming suitable hashing and bounded key costs. All-unique input makes u=n and defeats early exit. An early duplicate shortens the actual run.'
  ],
  2: [
    'Split claim into read, decide and write. Both threads read null, each independently decides it can claim, and each stores its own ID. Both can report success while the final owner shows just one value. Put a barrier after the read in the intentionally unsafe fixture to reproduce this sequence.',
    'Different Seat objects have independent fields. Two successes show that a canonical ID can be represented twice without coordination. To demonstrate the original race, give both workers the same instance and synchronize their read boundary. For multiple instances of an application use a shared owner record.',
    'Collect both futures before asserting. Two successful return values for one shared A1 violate the rule regardless of log order. Read the final owner from the joined test thread and compare it to the reported outcomes. Loosely interleaved log lines alone cannot establish which state changes committed.'
  ],
  3: [
    'Visibility determines which writes a read can observe. Exclusive access around the whole check and update makes the transition atomic for competing callers that use the same monitor. A volatile owner provides visibility and ordering, but both callers can still see null before either writes. Assert exactly one success and the matching owner.',
    'Route both processes through one authoritative store. For example, use a conditional UPDATE with owner IS NULL and treat an affected-row count of one as a candidate success, returning success only after commit. A JVM monitor coordinates threads that share that particular monitor object.',
    'A monitor unlock synchronizes-with a subsequent lock of the same monitor. Writes in the first critical section happen-before reads in the second through program order. A different monitor does not supply this ordering. Keep reads of guarded state under the monitor or use an explicit appropriate publication mechanism.'
  ],
  4: [
    'If two keys are equal, their hash codes must match. Distinct keys may collide, so the map still uses equality. Equality and hashing use stable fields for the life of a map entry. Prove it by inserting one key and retrieving with a separately constructed equal key.',
    'Define a canonical seat-ID grammar at the domain boundary, then construct immutable keys from the normalized form. If IDs use ASCII case-insensitivity, normalize consistently, for example with Locale.ROOT. Test equality, equal hash codes and lookup across A1 and a1, plus a collision between unequal keys.',
    'The entry was located by the key hash at insertion. Changing a field involved in equality or hashing can make lookup and removal miss the old entry. Use an immutable key and put changing state in the map value. Compare a lookup before and after the mutation to demonstrate the failure.'
  ],
  5: [
    'A blank caller ID is invalid input and can raise a documented argument error. A valid claim on an already owned seat is an expected domain outcome. Represent it as false for a two-outcome method, or use a typed result when callers must distinguish several outcomes. Verify the failure leaves state unchanged.',
    'Validate identifiers and use explicit outcomes for missing seat and occupied seat. Invalid caller identity can become an argument error or a typed invalid outcome according to the contract. Map them at the API boundary, for example to 404, 409 and 400 for these fixtures. Authentication failures have their own 401 path.',
    'Handle failures at a layer that can recover or translate them. A DAO can translate SQLException into a storage exception retaining the cause. The service lets an unexpected storage error roll back the unit of work and the API emits a safe response. Keep a competing booking as a normal domain result.'
  ],
  6: [
    'Start with a typed collection such as List<Seat>. Filter active or free seats, map each survivor to its ID, and trigger traversal with a terminal operation. Trace one removed input and one returned output. State the collection order and whether the returned list supports mutation.',
    'Use the same predicate and traverse the same ordered source. The loop returns at its first match. An ordered stream with filter and findFirst guarantees the first encounter-order match and returns empty when none qualifies. Use test cases with multiple matches and with no match.',
    'An unmodifiable list prevents structural changes via its mutators. The Seat references inside can still point to mutable objects. A read-only view can also reflect changes in its source collection. For a stable snapshot, copy the container and snapshot or replace mutable elements as required.'
  ],
  7: [
    'Tasks are units of work and can outnumber worker threads. The executor runs some immediately and may queue or reject others according to its policy. A captured Seat reference may be shared regardless of which worker runs a task. Inspect every Future and bound the test shutdown.',
    'Protect the eight database connections first. Choose a small queue and explicit rejection or backpressure based on measurement of connection wait and request deadlines. Test a burst with more admitted work than the pool can serve. Raising worker count alone can increase queueing and tail latency.',
    'Future.get with a timeout limits how long the caller waits. The task may continue. cancel(true) requests interruption when possible, and code or dependencies must cooperate. Bound the underlying I/O and define what a caller can safely do after a timeout with an unknown write outcome.'
  ],
  8: [
    'Seat enforces valid local state transitions. The service locates the seat and coordinates the use case, including a repository boundary for persistence. The queued or synchronous notification interface owns delivery, as appropriate. Assert real final ownership after a rejected claim and use a small sequence sketch to show calls.',
    'Publish or send confirmation after the booking is committed. Keep the seat model unaware of delivery. Verify a successful commit produces a notification request, and a conflict produces none. For reliable asynchronous delivery, persist an outbox entry in the booking transaction and exercise the replay case later.',
    'Use Adapter when two notification providers expose different APIs. Use Strategy when a real varying policy, such as hold duration, needs substitutable calculations. Use State when rules for allowed actions differ substantially by lifecycle state. Show an actual change and why a smaller refactor becomes insufficient.'
  ],
  9: [
    'Spring builds the application context, registers candidate bean definitions and resolves the constructor argument by type and qualifiers. It invokes the constructor with that dependency. A plain unit test can instantiate the class with a fake directly. Removing a required bean should fail context startup with a dependency error.',
    'Activate one repository implementation per environment with profiles or configuration, or qualify both if both must coexist. Test startup for each relevant configuration and verify the expected implementation is injected. Preserve the same service contract across the real and test repositories.',
    'Inspect the injection point, candidate bean names and active profiles. Determine whether two candidates are intentional. Narrow selection with a qualifier, use a primary bean for a true default, or fix accidental scanning. A context smoke test verifies the selected dependency rather than inferring it from compilation.'
  ],
  10: [
    'GET observes availability and should be safe. POST attempts to create a booking and can change durable state. Return 201 after a successful creation and 409 for the described competing claim. The GET representation can go stale before the POST and cannot reserve anything by itself.',
    'Have the caller send a stable idempotency key for the logical operation. Store it with the normalized request identity and committed outcome in an appropriate caller scope. An identical retry can then retrieve the recorded response. A different request using that key should receive a documented conflict.',
    'A safe method has read-only intended semantics. An idempotent method has the same intended server effect when repeated, though status codes can differ. Resolving a lost response requires identifying a particular operation and possibly replaying the original outcome, even when the method alone says little about that outcome.'
  ],
  11: [
    'The HTTP layer handles decoding and request shape and returns documented errors. The domain or application layer still guards required identities and the valid state transition because internal callers can bypass HTTP. Prove both paths, including an invalid direct call that leaves ownership untouched.',
    'Validate required identifiers and actor eligibility before the protected change. Keep ownership and the occupancy guard beside the use case that performs the write. The HTTP-only format and JSON diagnostics stay at the controller boundary. Test a valid-shaped direct call from an unauthorized actor.',
    'A valid-looking actor ID does not prove authorization. Resolve the caller from the trusted job or service identity and check the requested action and resource there. The seat must also be claimable when the write executes. Test a valid-shaped request denied by the internal service, and assert state did not change.'
  ],
  12: [
    'A primary key prevents duplicate row identity, a foreign key protects references, and a check constraint protects a condition on the row. All database clients share those rules. Use NOT NULL for fields where SQL UNKNOWN would otherwise pass the check. Demonstrate violations with direct inserts.',
    'Keep historical bookings with their status and timestamps. Enforce one active booking per seat, for example with a partial unique index on active rows in PostgreSQL. Change the old booking status transactionally when canceling. Verify the old history stays visible while a new active booking can be created.',
    'Enforce uniqueness and referential integrity in the shared schema when multiple writers can bypass a Java check. An active booking can use a unique active-seat constraint. Auth and transition rules still require guarded operations. Show an independent insert failing the constraint.'
  ],
  13: [
    'Turn off JDBC auto-commit for the unit of work, update on one connection and observe from another. A PostgreSQL Read Committed query sees committed changes at its statement snapshot. After commit a new statement can see the change. Rollback discards it. An existing PostgreSQL Repeatable Read snapshot can remain unchanged.',
    'Put both writes on one connection and transaction. If the audit insert fails, roll back instead of returning booking success. Verify the seat and audit state from a separate connection. Use try-with-resources and correct connection-pool reset behavior when returning the connection.',
    'A serialization failure says the attempted concurrent outcome could not be ordered consistently. Begin a fresh transaction and reread all decision inputs before retrying the whole unit, with a bound. A single-statement retry inside the failed transaction runs on stale or aborted state.'
  ],
  14: [
    'Combine ownership and change in one UPDATE with a predicate such as seat_id = ? AND owner IS NULL. Concurrent writers cannot both commit that transition. Treat row count zero according to the API contract, since the row could be missing or already claimed. Confirm successful commit before replying.',
    'Run both guarded updates in one transaction and assert two affected seats before committing. Roll back if either update fails so the first seat is released by rollback. Acquire in a stable order to reduce deadlocks. Exercise a fixture where the second seat is owned.',
    'Zero means no row satisfied all predicates when the guarded statement executed. It could be an unknown seat or an existing seat that was already occupied. Define whether the API intentionally combines those cases. If it distinguishes them, check existence using appropriate transaction and concurrency semantics without replacing the guarded write.'
  ],
  15: [
    'Optimistic updates use a version or predicate and detect staleness on write, useful when conflicts are rare. A short pessimistic lock can serialize a hot row when retries cost more than waiting. Measure wait, retries and high-percentile latency under representative contention. Keep a simple guarded update when it fully expresses the rule.',
    'For one hot seat, pessimistic requests can queue, while optimistic attempts can repeatedly collide and add database load. Cap retries, back off where appropriate and return the domain conflict once a different winner exists. Compare tail latency and completed useful work, not only average throughput.',
    'Transactions holding A and B in opposite orders can wait for each other. Request locks in a shared deterministic order wherever possible, handle the database deadlock result and retry only a safe whole transaction under a bound. Reproduce with two connections and a bounded test.'
  ],
  16: [
    'An entity in the persistence context is managed. Dirty changes can be translated into SQL by flush before the transaction commits. A rollback can undo flushed SQL, and a detached object is no longer dirty-tracked. Verify committed state from a separate context or connection.',
    'Count the booking query and lazy owner lookups using realistic data, a fresh context and controlled caching. Compare with a targeted join fetch, projection or batch strategy. Check row multiplication and pagination before choosing an eager approach. Show before and after query counts.',
    'Create several bookings with distinct owners. Begin with a new persistence context and observe emitted SQL while the endpoint reads the owner for each booking. Compare query count as the list grows, then repeat with the chosen fetch strategy. A repeated lookup might be hidden by a warm persistence context.'
  ],
  17: [
    'Two JVMs have different object identities and monitors. A claims path can protect the invariant by making both processes write through the same PostgreSQL rule. Run both on distinct ports, record request response pairs and verify the single committed owner independently.',
    'A lagging replica may serve an explicitly stale availability view if the product allows it. A confirmation or ownership decision must use the authoritative write path, and a read-your-write requirement needs a suitable primary or consistency mechanism. Test a lagging display followed by the decisive conflict.',
    'A lock keyed by seat ID only coordinates requests inside its process. A second process can acquire its own lock while the first still holds its lock. Demonstrate both processes and a shared datastore constraint. Process restart should also preserve the authoritative owner.'
  ],
  18: [
    'Express average and peak requests per second, their mix, sizes and hot-key concentration. A read burst can justify caching the seat map. Concentrated claims may call for protecting the authoritative write instead. Connect the estimate to one measurable decision and vary an assumption.',
    'Refresh traffic raises read RPS at the gateway and availability service. With a cache hit ratio h, approximate origin reads as arrival reads times (1−h) plus other flows and cold fills. Reestimate network, latency budget and hot reads before modifying write capacity solely because total traffic doubled.',
    'Use peak and percentile observations from the path the decision concerns. If most requests target one event, the hot key and its per-key queue may matter before aggregate CPU. Compare measured request mix or cache hit ratio against the stated assumption and recalculate the affected resource.'
  ],
  19: [
    'If a hold is confirmable only when now < expiry, equality is expired. Confirm using the same protected storage operation that checks hold identity, owner, state and expiry. Read the authoritative clock once with semantics appropriate to the claim. Test just before, at and just after the boundary.',
    'A claim can treat an expired hold as reclaimable in its guarded write. Cleanup becomes housekeeping. Check the previous hold identity or version and the expiry condition when confirming, renewing or cleaning. A stale cleanup worker must be unable to remove a replacement or renewed hold.',
    'Use a defined authoritative clock and state precisely when it is sampled. With strict now < expiry, the equality case loses. If PostgreSQL owns this rule, choose a database clock function with the intended transaction versus statement timing. Use a fixed-clock or controlled SQL fixture to prove the boundary.'
  ],
  20: [
    'A client timeout can occur after commit. Use the same idempotency key and semantic request identity on retry. Query the stored status or replay its committed outcome. Protect the key record and domain effect atomically, and verify a lost response produces one booking and one recorded result.',
    'After the recorded key expires, the replay guarantee ends. Retain a separate durable booking lookup or business uniqueness rule when the product requires it. Document the window and run a late-retry fixture. A surviving business constraint can prevent a second claim without replaying the original HTTP response.',
    'If the same key already belongs to a request with a different normalized payload, reject it as key reuse within the retention window and preserve the original result. Scope keys to the caller and operation. Check that payload order or formatting differences are handled according to a documented canonicalization rule.'
  ],
  21: [
    'A replica can answer lag-tolerant display or analytics if clients know the freshness limits. Keep decisions that must reflect committed ownership on the authoritative path. A read-your-write endpoint can route the client to the primary or wait for a verified replication position.',
    'Event ID can distribute unrelated events while concentrating all traffic for one popular event on one placement unit. Measure skew, read/write ratio and lock or queue wait on that unit. Separate caching of reads from protecting contested writes before deciding how to split storage.',
    'Compare plans with representative table size, selectivity and current statistics. A sequential scan can be cheaper on a tiny table or a broad filter. An eligible selective index can help on larger data at write and storage cost. Read actual rows, time and buffers rather than assuming index use.'
  ],
  22: [
    'The cache mirrors an availability read and can lag the row. Use the authoritative guarded write for booking. Trace a reader installing an old available value after a writer commits and invalidates. The UI may report stale availability, but the write still rejects a second booking.',
    'Allow selected availability requests to fall back only within database capacity. Coalesce fills or rate-limit and shed excess load. A cached or static degraded response may be acceptable for browsing if labeled. Preserve the booking path and verify the DB connection pool is not saturated by read fallback.',
    'Expiry bounds how long a cached entry is reused after its insertion under the defined TTL. Eviction makes room under memory pressure. Invalidation responds to a known change but can race with a concurrent fill. Explain which one addresses freshness, capacity and the stale-fill sequence.'
  ],
  23: [
    'With at-least-once delivery, a handler may apply its effect before recording acknowledgment. A restart or acknowledgment loss can cause redelivery. For a DB effect, record the stable event ID and the effect together in one local transaction. Replay the identical ID and verify one resulting change.',
    'Use a provider-supported idempotency key if the email system offers it, and persist workflow state and reconcile ambiguous responses. A local dedup record written after the provider call leaves a crash gap. State the actual delivery promise and what happens when the provider cannot deduplicate.',
    'If a consumer acks before its database transaction commits, a crash between those events can lose the effect. Commit the effect and dedup record first, then acknowledge. If a crash occurs after commit and before acknowledgment, a duplicate is tolerable because the local transaction recognizes it.'
  ],
  24: [
    'Separate read-biased traffic from hot-seat contention so the latency numbers have a defined input. A load balancer distributes connections or requests across healthy instances under its policy. Record rate, response codes and latency per workload, plus invariant violations. A cross-process match still needs the shared authority.',
    'Decide whether the slow database symptom is specific to one instance using health, error-rate or latency evidence. Use bounded removal thresholds and reentry criteria to avoid flapping. A global dependency failure may affect every instance and requires overload control or degraded service beyond simple rerouting.',
    'Higher arrival and completion rates can coincide with longer queues and slower outliers. Check queue wait, connection acquisition time, in-flight concurrency and per-status latency under the same workload. A fast conflict can disguise slow successful requests in aggregate metrics.'
  ],
  25: [
    'The owner transition needs a reachable authoritative decision. Fail it clearly if that guarantee cannot be made, and use idempotency to resolve an unknown outcome. Display or analytics may tolerate a bounded stale read when the product makes that meaning clear.',
    'A remote region can serve a permitted cached seat map or explanatory policies during the partition. To confirm a seat it must reach the authoritative decision or use a predesigned exclusive ownership mechanism. Local guessing can produce two confirmations. Specify what the customer sees and how retries work.',
    'A client timeout gives an unknown outcome. Retry with the original key or fetch an authoritative operation status. A known conflict is a different result and usually needs user action. Check both response paths to avoid duplicate effects and make the queue or retry budget explicit.'
  ],
  26: [
    'For expected set-based duplicate detection, an all-distinct length-n input forces a full scan and stores n keys. An immediate repeated pair can exit earlier. State the cost of hashing or comparing an ID if key length is part of the input. Choose the input that actually reaches the bound you claim.',
    'For repeated range sums or counts of a fixed predicate, build a prefix array with one O(n) pass and answer each range in O(1) via a difference. Define the endpoints and empty-range behavior. If data changes frequently or the question counts arbitrary IDs, pick an index or data structure suited to that query.',
    'The F(n−1) and F(n−2) branches overlap, so the same smaller inputs are recomputed many times. Java explores a branch at a time. Only the call frames on the current path stay active, so peak stack depth is O(n). Caching each result makes total work O(n), with O(n) cache and stack space. An iterative version uses O(1) auxiliary space when only the result is needed.'
  ],
  27: [
    'For a distinct window, the current interval must contain unique IDs. On a repeat, move left far enough to exclude the earlier index and never move it backward. For binary search, maintain a partition that places the first true inside the candidate boundary until it collapses.',
    'For each ID at index r, update left to max(left, previous[id] + 1), then store r as the latest occurrence. Trace a,b,b,a. When the final a arrives its old index precedes the current left, so that occurrence cannot move the left boundary backward.',
    'Define a predicate that is false then true in index order. Use a half-open interval, retain mid as a candidate after a true result and discard through mid after false. Returning n handles all false. Verify empty, all true, duplicates and all false fixtures.'
  ],
  28: [
    'Specify the implementation before claiming space. An iterative linked-list reverse stores a fixed number of pointers. A bracket stack can hold up to n unmatched openers. Array merge sort usually uses an O(n) buffer, and the call stack may add a smaller term. Explain the maximum live working storage.',
    'In a stable merge, choose the left item when keys compare equal because it originally occurred earlier. Choosing the right one can invert arrival order. Test with records that share the same key and have distinct arrival IDs, and check both order and that all records survive.',
    'Before setting current.next = previous, save the original next pointer. Otherwise the new backward link loses access to the unprocessed suffix. Demonstrate A→B→C becoming C→B→A and assert the new tail has no next node.'
  ],
  29: [
    'The map returns the actual list node. Unlink it in constant time using its adjacent pointers and move it to the most-recent end. Remove the least-recent node from both structures during eviction. Test that map keys and list nodes agree after every operation.',
    'A get on a hit mutates recency and can race with another move, insertion or eviction. Coordinate the map lookup and list mutation as a single operation, for example with a shared lock. A thread-safe map alone cannot keep its nodes synchronized with a separate unsynchronized list.',
    'A node reference gives immediate access to its previous and next pointers, so no scan is required before unlinking. A value alone cannot locate that point in the list. Trace a hit on the older of two nodes followed by a third insertion and check that the other original key is evicted.'
  ],
  30: [
    'Recursive tree traversal uses O(h) stack for height h, which becomes O(n) for a skewed tree. A streaming top-k heap stores O(k) candidates and typically costs O(n log k) for k ≥ 2. State any extra storage used by a final sorted result.',
    'A heap exposes its root, not globally sorted iteration. After selection, order the k survivors by the desired comparator or drain with a known order. Encode arrival index as a tie-breaker during both selection at the cutoff and final sorting so ties are stable.',
    'The maximum among the k smallest values retained so far is the one that can be discarded for a smaller candidate. A max-heap exposes it at its root. Replace the root when the new candidate ranks better and explain the tie rule and k=0 behavior.'
  ],
  31: [
    'FIFO expansion processes the source and then increasing edge distance. Mark vertices when enqueued so each acquires a first parent once. Recover the fewest-edge path by following parent links. With adjacency lists, BFS costs O(V+E) time and O(V) auxiliary space.',
    'BFS minimizes edge count, so a direct cost-5 edge can lose to a two-edge path of total cost 2. For nonnegative weights use Dijkstra or a suitable specialized algorithm. Specify whether the requested optimum is hop count or sum of weights.',
    'Marking only on dequeue without a separate discovered flag allows multiple queued copies of the same vertex. In a diamond graph, both branches can enqueue the shared child before it is processed. Mark on enqueue to keep a single discovery and preserve its first parent.'
  ],
  32: [
    'Use intervals [0,2) value 1, [2,4) value 1 and [0,4) value 10. Earliest finish can choose the first two for total 2. Weighted interval scheduling compares skipping job i against taking value[i] plus the optimum ending at its last compatible predecessor. The combined interval wins.',
    'If the reset is required between jobs, choose a consistent unit and require previous.end + 10 minutes ≤ next.start. Recompute compatibility and test starts at nine, ten and eleven minutes after the prior end. Use a half-open time convention and state whether intervals share one resource.',
    'Exchange the first interval in an optimal unweighted schedule with an interval finishing earliest. The replacement finishes no later, so every later interval remains compatible. Then apply the same argument to the remaining instance. Weight can make that exchange lose value.'
  ],
  33: [
    'Authentication identifies the caller. Authorization decides the permitted action on the particular resource. Validation checks input shape or invariants. Show unauthenticated, wrong owner and valid owner cases, and confirm the rejected body reveals no protected booking details.',
    'Check the booking venue against the authenticated staff member’s assigned venues. Derive the assignment from trusted server-side data, not a venue field the caller can supply as authority. You may combine the venue predicate with data retrieval and test two venues for the same staff role.',
    'Apply resource ownership or venue constraints in the service or data-access decision used by the operation. A role or scope grants category-level access and may be inadequate for a specific booking. Test a valid token with the right scope against a booking from another owner.'
  ],
  34: [
    'A health endpoint summarizes whether a process or dependency condition permits routing or restart. Logs describe discrete events. Metrics aggregate measurable behavior, and traces link spans across a request. Test a healthy packaged start and an injected dependency failure, and correlate the affected request.',
    'A temporary database outage can make an instance unready if its core traffic cannot be served. A process that is still running and can recover should usually remain live, with liveness based on its ability to run. Coordinate replica behavior and avoid restarting every pod for a shared outage.',
    'Request ID, user ID and seat ID often have too many distinct values for routine metric labels. Put the appropriate non-sensitive or protected identifiers into logs or traces. Keep metric labels bounded by values such as route template and outcome class.'
  ],
  35: [
    'Start with task quality requirements, supported context, latency, cost and data constraints. Compare models on the same supported, ambiguous and unsupported questions using the same retrieval inputs. Score grounded correctness and refusals independently from prose quality. State when a deterministic fallback is acceptable.',
    'Improve or gate the evidence path first. Record whether the needed passage was retrieved and available within the prompt. An unanswerable question requires a clear fallback. Only compare model quality on answerable cases where both received comparable evidence.',
    'In a controlled diagnostic, supply the correct relevant passage directly and compare the answer against the ordinary retrieval path. If the same model succeeds with the passage but fails without it, measure retrieval coverage and investigate filters, chunking and ranking before paying for a model upgrade.'
  ],
  36: [
    'A JSON schema enforces fields, types and related constraints. It cannot ensure a refund period follows the policy. Check that referenced passages were supplied and authorized, and that each material claim is supported. A schema-valid unsupported result should use the defined fallback.',
    'Verify each cited ID belongs to the supplied authorized evidence and check that the resulting claims follow from that evidence. P9 is outside the allowed set, so suppress the candidate and give the fallback or a bounded retry with evidence. Log the validation category without leaking sensitive prompt text.',
    'A response can cite actual passage P1 but state the opposite of what P1 says. Distinguish citation existence from entailment. Compare the claim with the supplied passage, including quantities, date rules and exceptions. Use a controlled fixture in which the citation ID is valid but the refund duration is wrong.'
  ],
  37: [
    'Keep provider calls behind a Java interface with a deadline and a validated response type. On timeout, outage or malformed output, emit the policy-help fallback and relevant bounded metrics. The authoritative booking service remains independent. Exercise both paths in the same outage test.',
    'Translate the provider wire format inside its adapter. Give application code one stable contract for accepted outcomes and failures. Contract tests should cover a representative valid response, response shape changes, missing fields and timeouts. An optional provider smoke check supplements deterministic tests.',
    'Use a deterministic fixture at the model port for ordinary tests and external configuration for actual credentials. Keep keys out of client code and source control. A distinct provider contract test can verify current wire behavior using a sandbox credential when available.'
  ],
  38: [
    'Vector similarity ranks learned representation proximity. Exact code lookup or lexical ranking can be better when an identifier must match literally. Filter candidates by authorized venue and effective version and compare vector, exact and hybrid retrieval on labeled inputs.',
    'Add exact match for supported code fields or hybrid lexical and vector retrieval with a documented merge. Apply access and version filters for every candidate path. Test the exact code, a paraphrase and a similar but unauthorized policy to show how the streams complement each other.',
    'Find the gold passage and inspect whether it was indexed, permitted, current and hit in top-k. Check chunk boundaries and ranking with controlled examples. Passing a correct passage directly to generation isolates retrieval faults from answer synthesis failures.'
  ],
  39: [
    'Retrieve authorized and effective policy passages for the question, compose an answer on that evidence, and check citations and claim support. For example, show a current cancellation policy and why its exact clause supports the response. Return a clear fallback when evidence is insufficient.',
    'Use explicit policy scope, version and effective time to select the current authoritative passage before generation. Define policy precedence when two candidates overlap. Show current provenance in the response. If authoritative sources still conflict or the answer depends on a missing version rule, escalate or abstain.',
    'The correct passage may be present while generation still adds an unsupported condition. Score retrieval hit@k using whether the target passage is among the candidates. Separately score whether every material claim follows from those candidates. Feed the target passage directly to isolate generation in a diagnostic.'
  ],
  40: [
    'Build a labeled set with supported, unsupported and edge cases. Report retrieval hit rate, grounded correctness and correct abstention, plus tail latency and cost if measured. Compare repeatable configurations across the same cases. A fluent sample establishes little about the failure rate.',
    'Break down outcomes on answerable and unanswerable cases. Check grounded correctness, false refusals, correctly refused unsupported answers, truncation and latency. A single acceptance percentage can obscure both excessive rejection and a real improvement in avoiding hallucinated answers.',
    'Have a human independently label a diverse sample. Compare per-category agreement and review disagreements, especially unsupported or borderline answers. Pin the judge rubric and model version, and use deterministic checks for machine-verifiable properties such as schema and citation membership.'
  ],
  41: [
    'The model submits a proposal with a tool name and arguments. Application and tool boundaries enforce an allowlist, structured validation and principal-based authorization before execution. Review the tool result as input. A request for data outside the allowed venue must fail even with valid arguments.',
    'Authenticate the caller and scope every lookup in the tool service using trusted identity or delegated credentials. Validate the requested venue against that scope. One general read permission cannot replace a resource check. Test a forged venue argument and verify that private text never returns to the model.',
    'MCP defines how clients and servers discover and call tools and exchange messages. The tool service and its host still enforce access policy, consent as needed and safe defaults. Demonstrate the distinction with one allowed call and one syntactically valid out-of-scope call.'
  ],
  42: [
    'A retry consumes deadline, capacity and often more tokens. Bound work and attempts with a total budget and record timeout and fallback. Treat retrieved text as untrusted data even when its source is an approved store. Tool permissions and output validation remain part of the application.',
    'Reserve space for the instructions, trustworthy evidence and useful answer before admitting user input. Truncate nonessential content deliberately or return an actionable size error. A reduction that removes required policy evidence must cause abstention or smaller focused retrieval.',
    'Set a request deadline, bound admission and allocate only remaining time to each attempt. Retry selected transient failures if another attempt still fits. Include connection and queue waits in the measurements. Check p95 and fallback rate under controlled concurrency before increasing the limit.'
  ],
  43: [
    'Consider customization when a reproducible behavioral gap persists on comparable input despite an adequate prompt, evidence and simpler fixes. Define the behavioral metric and keep a holdout test. Knowledge that changes frequently usually belongs in retrieval with controlled provenance.',
    'Test a more explicit style rubric, a few strong examples and a structured output shape using the same evidence and labeled inputs. Measure style as well as readability, grounding and cost on held-out tasks. Fine-tuning becomes a candidate when a stable gap survives that comparison.',
    'Fine-tuning poorly addresses a missing, unavailable or outdated policy, even with labeled examples. Give the application a reliable authorized evidence path and evaluate freshness and correct abstention. Factual authority should be maintained where the organization can update it.'
  ],
  44: [
    'State the invariant and the changed requirement, such as retaining availability during a regional failure. Trace the authoritative decision and select a trade-off you can support, such as rejecting a claim when coordination is unavailable. Demonstrate the normal flow and a corresponding failure case.',
    'Select the data ownership and cross-region coordination rule first. Concurrent regions must either share a consistent claim authority or have explicit exclusive seat assignment. Work through failover fencing, partition behavior and latency before promising cross-region confirmation.',
    'A two-instance contention test supports the invariant for the tested fixture and execution paths. Production scale claims need representative load, contention and failure cases with latency, throughput and invariant measurements. Link each claim to a concrete command, output or trace.'
  ],
  45: [
    'Use one concrete story. State the booking requirement, how you enforced it and what competing requests produced. Describe a limitation such as unmeasured hot-event throughput, and name the experiment and expected diagnostic signal you would use before the next change.',
    'State precisely what happened in the fixture, including one committed owner and the two responses. Establish a representative load mix, concurrent writers, failure injection, tail and error measurements, and an invariant check before making the resilience claim.',
    'Stronger evidence adds an independent production-like constraint: a hot-key load run, replica lag, database timeout or outbox retry. Record baseline, configuration, expected invariant and observed metrics. Tie the interview claim to the outcomes you actually reproduced.'
  ],
  46: [
    'Virtual threads make many waiting tasks cheaper to represent. They cannot add database connections or increase the capacity of a remote provider. Bound admission to the constrained section with a semaphore or appropriately sized pool and release its permit in finally. Measure queue delay and completion.',
    'Use thread dumps or JFR together with connection-pool and dependency metrics. Distinguish waiting at admission from waiting for a connection or remote response. Test several safe limits with the same load and choose a limit that respects latency and keeps useful throughput stable.',
    'Bound database connections, socket and provider concurrency, queued requests, heap and CPU-heavy work. Make deadlines and rejection behavior explicit. Virtual-thread concurrency may increase how much work can wait, which makes these protections more important.'
  ],
  47: [
    'In Spring proxy-based transaction management, an external call through the proxy can receive transactional advice. A same-object call can bypass it. By default, RuntimeException and Error trigger rollback while checked exceptions usually need an explicit rule. Check propagation and verify committed state independently.',
    'First prove the caller goes through the configured transactional proxy. Then inspect the checked-exception rollback rule and whether the exception was caught before it reached the advice. Confirm both writes participate in the intended transaction. Compare rows through a separate connection.',
    'With an existing transaction and REQUIRED participation, the inner method generally shares the transaction. A rollback-only marker can cause an outer commit attempt to fail. REQUIRES_NEW opens an independent transaction and can commit or roll back separately. State which boundary is effective given the actual invocation path.'
  ],
  48: [
    'Authentication establishes the subject. Authorization checks access to this resource and action. Validate token signature, issuer, time and the expected audience, then enforce scope and resource-level rules. Use OAuth access tokens for the resource API and OIDC ID tokens for the intended client authentication flow.',
    'Enforce the booking API’s expected audience during token validation. A correctly signed help-service token may target a different audience and is unsuitable for booking. Check issuance and intended use, then exercise valid-audience insufficient-scope and wrong-audience fixtures separately.',
    'An authenticated token for the booking API can still lack the booking write scope or venue permission. Missing or invalid credentials generally lead to 401, and authenticated but insufficient privilege generally leads to 403. Test both branches with distinct controlled tokens.'
  ],
  49: [
    'SSE fits a browser receiving a stream of seat updates while submitting writes via HTTP. Assign event IDs and define replay on reconnect or a fresh snapshot if history cannot cover the gap. The authoritative booking response still decides a claim.',
    'Reconnect with the last known event ID when the server supports replay. If the cursor is absent, too old or invalidated, fetch an authoritative snapshot and resume from an associated cursor. Check ordering and deduplication so an older event cannot overwrite fresher state.',
    'gRPC can fit internal services that control both ends and benefit from typed contracts, efficient binary calls or streaming. Public browser clients often value broad HTTP and tooling compatibility. Compare streaming and observability needs and account for gRPC-Web or a gateway when the browser matters.'
  ],
  50: [
    'The outbox commits the local business write and its outgoing event together. The relay can publish again after a crash, so handle duplicates and failures. A saga coordinates local steps and uses explicit compensations where possible. Trace durable retries and steps already completed.',
    'Deduplicate by stable event ID while applying the consumer change in the same local transaction. Then acknowledge. A duplicate can subsequently be acknowledged without the same effect. If the effect is external, use a provider idempotency key or reconcile the outstanding delivery state.',
    'A compensating action is a new business operation, such as releasing a previously reserved seat after payment fails. It can fail and may need retries or manual reconciliation. Define its identity and invariant. Earlier committed operations remain auditable; there is no shared database rollback across all services.'
  ],
  51: [
    'Define eligible booking attempts first and count the ones completing the promised service behavior. A database timeout for an eligible request usually burns the budget. Include or exclude legitimate conflicts intentionally and keep reason codes so product outcomes stay interpretable.',
    'Use a success or availability SLI for the eligible attempts, such as correctly served responses over eligible requests. Count timeouts according to the error definition. Latency of the surviving successful requests can look good while booking availability declines.',
    'Use a fixed recent window with sufficient sample size and compare good and total eligible requests. Report fast failures separately from successful latency and add a release guard tied to availability burn. A rollback rule needs a measurable trigger and a known operational path.'
  ],
  52: [
    'Use topological sorting to schedule prerequisites and detect a directed cycle that prevents a complete order. Use Dijkstra for shortest weighted paths when edge weights are nonnegative. Define graph representation, disconnected cases and the output when no valid result exists.',
    'A directed cycle violates the DAG requirement for a complete topological order. A negative edge violates the priority-order argument behind ordinary Dijkstra even without a negative cycle. Use an algorithm suited to negative edges when required and handle reachable negative cycles explicitly.',
    'State the feasibility invariant before pruning. For nonnegative additions, a partial sum already over target cannot come back down. If negative choices later exist, that rule may discard a valid solution. Verify the small case by comparing against exhaustive enumeration.'
  ],
  53: [
    'dp[s] means a subset of processed items can reach s, with dp[0] initialized true. Update s downward for each item so the read at s−weight reflects previous items. Ascending iteration can reuse the current item and fits some unbounded recurrences with appropriate assumptions.',
    'With ascending updates and one item of weight 3, dp[3] becomes true using dp[0], then dp[6] reads that new value in the same pass. A descending pass visits 6 before 3. Assert that target 3 succeeds and target 6 fails for this fixture.',
    'For matrix-chain multiplication, dp[i][j] is the cheapest cost to multiply matrices i through j. Try each split k and add the left and right optimal costs plus rows[i] × cols[k] × cols[j]. Fill shorter chains first and check rectangular dimensions.'
  ],
  54: [
    'Run the identical help set through available adapters and record grounded correctness, correct refusals, latency and cost or operating effort under the same request budget. Force a help failure and show an independent booking and conflict still reach the authoritative path. Report the environment you actually tested.',
    'Compare measured latency, data-handling constraints and supported deployment policy for representative inputs. Compress or bound retrieval context and consider caching or a smaller qualified model. Choose only among options meeting hard privacy and latency rules. Keep a known fallback for when none can serve the request.',
    'Fixtures support deterministic contract and failure tests. Local inference can offer data custody subject to operational and capacity constraints. Hosted inference can meet quality or latency targets with an acceptable data policy and budget. Compare concrete fixture outcomes, degraded behavior and deployment constraints before choosing.'
  ],
  55: [
    'The maintained forest connects every pair with the same root. An edge between two vertices in that component adds a second route and creates a cycle. Skip it without changing the component count. An edge joining distinct roots can extend a forest, and processing edges in increasing weight gives the minimum under the cut property.',
    'When ties allow several optimal trees, assert the total minimum cost, that every connected input component is spanned, and that accepted edges contain no cycle. Test the edge count and component count. Assert an exact edge set only when the input has a unique optimum or the contract specifies a deterministic tie break.',
    'Union by size attaches a smaller representative tree below the larger one. Path compression shortens routes while finding a root. Together they give a very small amortized cost per operation. Deleting an edge may split a component, and the parent tree does not remember which original paths exist. Use repeated traversal or an algorithm designed for deletions.'
  ],
  56: [
    'For an isolated candidate use trial division up to its square root, skipping even divisors after handling 2. This costs O(sqrt(n)) time and constant extra space. A dense set of queries inside a known bound can share a sieve that marks composites once up front, then answers table lookups in constant time.',
    'First compare gap size and range. When the range is small enough for a boolean array, a sieve plus indexed lookup handles overlap efficiently. A few widely separated large numbers can favor trial division or another primality test. Test that zero, one, two and a perfect square are classified correctly.',
    'For positive a and b, lcm(a,b) equals (a/gcd(a,b))*b. Dividing first avoids an unnecessarily large intermediate product. The true LCM can still exceed the selected integer range. Define zero separately, then use checked multiplication or an arbitrary-precision type when a wider result is needed.'
  ]
};
