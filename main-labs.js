// Main-topic labs for the 20 main lessons that had only a DSA program (Days 4, 6, 8–25). Grok, PR B, 2026-11-23.
// Each lab is attached to the day's main topic packet (topic-lessons.js) and rendered by codex-adapter.js packetNotes.
// Source text lives in the files named here and is embedded by checks/sync-lab-sources.mjs into main-labs-code.js;
// checks/main-labs.test.mjs fails if the embedded copy drifts from the file or if a flagged day loses its lab.
// runner: "jdk" = single-file Java 21 program, checked by checks/java-examples.mjs (output must match);
//         "postgres" = JDBC program, checked by checks/sql-fixtures.mjs against a throwaway PostgreSQL.
// sql: PostgreSQL fixtures run by checks/sql-fixtures.mjs after booking/sql/schema.sql and helpers.sql.

// Days whose main lesson must have its own main-topic program; SQL days must also have a SQL fixture.
export const labDays = [4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
export const sqlDays = [12, 13, 14, 15, 16, 21];

export const mainLabs = {
  'j-equality-01': {
    day: 4, title: "equals/hashCode contract, a mutable key, and lookups under forced collisions", file: 'notes/java-examples/EqualityLab.java', runner: 'jdk', sql: [],
    rule: "Rule: if a.equals(b) then a.hashCode() == b.hashCode(). HashMap first picks a bucket by hash, then compares keys with equals. A record such as SeatId derives both methods from its final components, so two separately created SeatId(\"S1\",\"A1\") objects find the same entry.",
    failure: "Failure it shows: overriding equals without hashCode makes an equal key invisible to a HashSet. A key whose hashCode depends on a field that changes after insertion is stranded in its old bucket: get() returns null for both the same object and a fresh equal key, yet the entry still counts in size() and appears when you iterate.",
    tradeoff: "Trade-off: a constant hashCode is legal and lookups stay correct because equals decides, but every key shares one bucket, so lookups cost O(log n) after treeification (keys that are not Comparable can degrade towards O(n)) instead of expected O(1). Prefer immutable keys (records, String, Integer) and spread hashes.",
    acceptance: ["Explain why get(new A1) returns null after the key was mutated, using the bucket index.", "Add hashCode to NoHashSeat and show contains() turns true.", "Change CollidingSeat.hashCode to id.hashCode() and say what changes in cost but not in results."],
    output: String.raw`record: same object? false, equal? true, lookup -> U1
equals without hashCode: contains(equal key)? false (an equal key is not found: contract broken)
mutable key after change: get(same object) -> null, get(new A1) -> null
mutable key: size=1, entry still there when iterating? true
20 keys, one hash bucket: all lookups correct? true, missing key -> null`
  },
  'j-generics-01': {
    day: 6, title: "typed streams, encounter order, findFirst vs findAny", file: 'notes/java-examples/StreamOrderLab.java', runner: 'jdk', sql: [],
    rule: "Rule: a stream from a List has an encounter order. filter, map and toList keep it, even on a parallel stream, and findFirst returns the first match in that order. Generic helpers use bounded wildcards: ? extends T when you read values (producer), ? super T when you write them (consumer).",
    failure: "Failure it shows: findAny on a parallel stream may return any matching element, so code that silently relied on \"the first one\" becomes nondeterministic. A HashSet source has no defined encounter order, so its output order is not a contract until you add sorted().",
    tradeoff: "Trade-off: findAny and unordered() let parallel pipelines skip coordination and can be faster; findFirst and forEachOrdered give a deterministic result at a cost in parallel. Streams are lazy: with findFirst only the elements up to the first match are examined.",
    acceptance: ["Explain why \"elements examined\" is 2.", "Replace findFirst with findAny on the sequential stream and state what the specification does and does not promise.", "Write a method using ? super T and show it accepts a List<Object>."],
    output: String.raw`confirmed ids (list order kept): [B2, B3, B4, B6]
findFirst -> B2, elements examined: 2
parallel findFirst always B2 over 200 runs: true
parallel findAny always one of [B2, B4, B5, B6]: true
parallel toList keeps order: [1, 4, 9, 16, 25, 36, 49, 64]
HashSet source needs sorted() for a defined order: [B1, B4, B6]
count by confirmed: {false=2, true=4}
total of List<Integer>: 2920
copied into List<Object>: 4`
  },
  'l-uml-01': {
    day: 8, title: "a booking-contract test: winner, loser and invalid input", file: 'notes/java-examples/BookingContractTest.java', runner: 'jdk', sql: [],
    rule: "Rule: test the behaviour the contract promises, through the interface, with fakes for the dependencies. BookingService depends on SeatRepository and Notifier interfaces (dependency inversion), so the test can observe the stored owner and every notification without a database or mail server.",
    failure: "Failure it shows: the same three tests run against an OverwritingBookingService that skips the free check and the input validation. The winner test still passes, the loser and invalid-input tests fail, proving the suite can detect a broken implementation rather than only passing.",
    tradeoff: "Trade-off: hand-written fakes give fast, readable tests and real behaviour (putIfAbsent), but they can drift from the real repository; keep one integration test against PostgreSQL (Days 14 to 16) for the actual constraint and conditional write.",
    acceptance: ["Add a fourth test: booking A2 after A1 is unaffected by A1's owner.", "Make GuardedBookingService notify before claiming and watch which test fails.", "Draw the sequence diagram for the loser path: controller, service, repository, notifier."],
    output: String.raw`GuardedBookingService
  PASS winner gets CONFIRMED, owner U1, one notification
  PASS loser gets CONFLICT, owner still U1, no second notification
  PASS invalid input throws, no owner, no notification
  3 passed, 0 failed
OverwritingBookingService (must fail)
  PASS winner gets CONFIRMED, owner U1, one notification
  FAIL loser gets CONFLICT, owner still U1, no second notification
  FAIL invalid input throws, no owner, no notification
  1 passed, 2 failed`
  },
  'j-build-01': {
    day: 9, title: "constructor injection and an application context that fails fast", file: 'notes/java-examples/InjectionLab.java', runner: 'jdk', sql: [],
    rule: "Rule: with constructor injection every dependency is a final field supplied when the object is built, so an object can never exist half-wired and its dependencies are visible in one signature. A container (Spring's ApplicationContext) creates singletons in dependency order when it starts. This lab is a plain-Java model of that container, not Spring itself.",
    failure: "Failure it shows: a missing bean definition stops the context during refresh() (\"No bean of type SeatRepository\"), before any user request arrives. A null dependency is rejected in the constructor. In real Spring the equivalent is a failed startup with NoSuchBeanDefinitionException.",
    tradeoff: "Trade-off: a container removes wiring code and manages lifecycles, but hides construction; constructor injection keeps unit tests container-free (pass a fake and a fixed clock) while field injection needs reflection or a full context in tests.",
    acceptance: ["Explain the printed creation order even though BookingService was defined first.", "Add a NotificationService dependency and show the context still starts in the right order.", "Write a test that passes a fake repository that always returns true and asserts the 201 text."],
    output: String.raw`creation order: [SeatRepository, Clock, BookingService]
singleton: true
201 A1 at t=1000
startup failed fast: No bean of type SeatRepository
fake repo says taken -> 409 A1
null dependency rejected: seats`
  },
  'b-http-01': {
    day: 10, title: "REST over a real local HTTP server: 201 + Location, 404, 409, 405", file: 'notes/java-examples/HttpSemanticsLab.java', runner: 'jdk', sql: [],
    rule: "Rule: POST /bookings creates a resource and answers 201 Created with a Location header naming it; GET on that URI answers 200; an unknown id is 404; a valid request that conflicts with current state is 409; a method the resource does not support is 405 with an Allow header (RFC 9110).",
    failure: "Failure it shows: the second POST for A1 is well-formed, so 400 would be wrong. The seat is decided by one atomic putIfAbsent, so the conflict is reported as 409 with a link to the existing booking. A request missing user is 400 because the client must fix it.",
    tradeoff: "Trade-off: status codes are a contract that clients and proxies act on (retries, caching), so overloading 200 with an error body or returning 500 for business conflicts breaks clients. The JDK HttpServer is enough to learn semantics; a framework adds routing, content negotiation and validation.",
    acceptance: ["Add GET /bookings?seat=A1 and decide between 200 with a list and 404.", "Retry the first POST with the same body: explain why it is not idempotent (Day 20 fixes this).", "Check the Location value resolves with GET."],
    output: String.raw`POST A1/U1   -> 201 Location: /bookings/101
GET Location -> 200 A1 U1
POST A1/U2   -> 409 seat A1 already booked as /bookings/101
POST no user -> 400
GET unknown  -> 404 no such booking
DELETE /bookings -> 405 Allow: POST`
  },
  'b-validation-01': {
    day: 11, title: "HTTP-boundary validation vs domain validation, one problem-details format", file: 'notes/java-examples/ValidationLab.java', runner: 'jdk', sql: [],
    rule: "Rule: the HTTP layer checks shape (required fields, formats) and reports every field error at once with 400. The service enforces business rules that need state or time (past show, seat limit, seat taken) for every caller, HTTP or not. Errors use RFC 9457 problem details (type, title, status, detail).",
    failure: "Failure it shows: a batch job that calls the service directly skips the HTTP checks, and the service still refuses the past date (422). If business rules lived only in the controller, that caller would have created an invalid booking.",
    tradeoff: "Trade-off: duplicating cheap shape checks at the edge gives fast, complete feedback; keeping authoritative rules in the domain avoids drift. Choose one status per kind of failure (400 shape, 422 rule, 409 state conflict) and keep the body shape identical.",
    acceptance: ["Add a rule \"user is banned\" and pick its status code with a reason.", "Make validateShape stop at the first error and explain why clients dislike that.", "Show the JSON for a 409 and for a 400 side by side."],
    output: String.raw`201 booked S1/A2
400 {"type":"about:blank","title":"Invalid request","status":400,"detail":"4 field error(s)","errors":["showId: required","seat: must look like A1..Z99","date: must be YYYY-MM-DD","quantity: must be at least 1"]}
422 {"type":"about:blank","title":"Unprocessable booking","status":422,"detail":"show date 2026-11-30 is in the past"}
422 {"type":"about:blank","title":"Unprocessable booking","status":422,"detail":"at most 6 seats per booking"}
409 {"type":"about:blank","title":"Conflict","status":409,"detail":"seat A1 is already booked"}
batch caller -> 422 show date 2026-01-01 is in the past`
  },
  'b-sql-01': {
    day: 12, title: "schema constraints in PostgreSQL and versioned migrations", file: 'notes/java-examples/MigrationLab.java', runner: 'jdk', sql: ["booking/sql/day12-constraints.sql"],
    rule: "Rule: put invariants in the schema so every writer obeys them: NOT NULL, CHECK, foreign keys, and a partial unique index that allows at most one active (HELD or CONFIRMED) booking per seat while cancelled history repeats. Migrations are versioned, applied in order once, and never edited after they ran.",
    failure: "Failure it shows: the SQL fixture inserts a second active booking (23505), an unknown seat (23503), a bad status or blank user (23514) and a missing user (23502), and each is rejected by PostgreSQL itself. Setting NOT NULL before the backfill fails; after the backfill it succeeds. The Java side refuses an edited V2 migration by checksum and maps SQLSTATE to 409 or 422.",
    tradeoff: "Trade-off: database constraints are the last line of defence and cannot be bypassed, but their errors are generic; translate them into clear API errors. Expand/contract migrations (add nullable, backfill, then enforce) avoid locking or breaking running code at the cost of more steps.",
    acceptance: ["Run the SQL fixture and match every line to the constraint that produced it.", "Explain why cancelling A1 lets U2 book it again without deleting history.", "In MigrationLab, add V4 that drops a column and say which deploy order is safe."],
    output: String.raw`[applied V1 create seat and booking, applied V2 partial unique index on active bookings]
rerun is a no-op: []
[applied V3 expand: add nullable booked_at]
refused: V2 was edited after it ran (checksum changed)
409 Conflict (one_active_booking_per_seat)
422 Unprocessable (booking_seat_id_fkey)
422 Unprocessable (booking_status_check)`
  },
  'b-jdbc-01': {
    day: 13, title: "JDBC binding, commit and rollback, and isolation levels on PostgreSQL", file: 'booking/jdbc/JdbcTransactionLab.java', runner: 'postgres', sql: ["booking/sql/day13-transactions.sql"],
    rule: "Rule: one business operation is one transaction. With JDBC, setAutoCommit(false), run the statements through PreparedStatement parameters, then commit(); on any failure rollback() so no partial booking is left. Bound parameters are sent as data, so a hostile value can never become SQL.",
    failure: "Failure it shows: the payment step fails after the booking insert and the rollback leaves 0 booking and 0 payment rows. From a second connection, uncommitted rows are invisible. Under READ COMMITTED a second read inside one transaction sees another connection's commit; under REPEATABLE READ it does not, and an update of that row fails with 40001.",
    tradeoff: "Trade-off: longer transactions hold locks and snapshots longer; stricter isolation prevents anomalies but forces retries on serialization failures. Keep transactions short and do slow calls (payment providers) outside them or behind an outbox (Day 23).",
    acceptance: ["Run the lab and the SQL fixture and point to the rollback line in each.", "Change the payment amount to 0 in the Java lab and predict the output.", "Explain the 40001 error and what the application should do with it."],
    output: String.raw`book A1 for a hostile user id: committed
seats still present: 1, stored user id equals input: true
book A2, payment fails: rolled back (payment provider timeout)
rows for A2 after rollback: booking=0 payment=0
READ COMMITTED : first read=null, second read=U7
REPEATABLE READ: first read=null, second read=null`
  },
  'b-transactions-02': {
    day: 14, title: "one winner under a two-connection race: conditional UPDATE vs read-then-write", file: 'booking/jdbc/ConditionalUpdateRace.java', runner: 'postgres', sql: ["booking/sql/day14-conditional-update.sql"],
    rule: "Rule: make the check and the change one statement: UPDATE seat SET owner = ? WHERE id = ? AND owner IS NULL, then trust the row count. One row changed means this request won (201); zero means someone else did (409).",
    failure: "Failure it shows: with a barrier forcing both connections to read \"free\" before writing, read-then-write reports success to both clients in 100 of 100 rounds and the stored owner overwrites the first winner. The conditional UPDATE gives exactly one winner in 100 of 100 rounds. In the SQL fixture the second connection blocks on the row lock while the first transaction is open and then changes 0 rows.",
    tradeoff: "Trade-off: a conditional write is simple and fast for single-row decisions; multi-row rules (two seats together) need a transaction with locks or a constraint. Under READ COMMITTED PostgreSQL re-checks the WHERE clause on the newly committed row, which is what makes this safe without SERIALIZABLE.",
    acceptance: ["Run the lab and read both summary lines.", "Remove \"AND owner IS NULL\" and predict the conditional line.", "In the SQL fixture, explain why dblink_is_busy is true before COMMIT."],
    output: String.raw`check-then-act: rounds=100 oneWinner=0 bothReportedSuccess=100 storedOwnerIsTheWinner=0
conditional UPDATE: rounds=100 oneWinner=100 bothReportedSuccess=0 storedOwnerIsTheWinner=100`
  },
  'b-transactions-03': {
    day: 15, title: "pessimistic SELECT ... FOR UPDATE vs optimistic version checks", file: 'booking/jdbc/LockingLab.java', runner: 'postgres', sql: ["booking/sql/day15-locking.sql"],
    rule: "Rule: pessimistic locking takes the row lock first (SELECT ... FOR UPDATE) and holds it until commit, so competitors wait, time out (lock_timeout) or fail at once (NOWAIT). Optimistic locking holds no lock while the user decides and makes the write conditional on the version it read; 0 rows changed means someone else won.",
    failure: "Failure it shows: connection B fails with SQLSTATE 55P03 after 200 to 300 ms and immediately with NOWAIT, then sees owner U1 once A commits. With versions, A and B both read version 0, A's update changes 1 row and B's changes 0, so B returns 409 instead of overwriting.",
    tradeoff: "Trade-off: pessimistic locks suit short, high-contention critical sections but can block, deadlock and must never span user think time. Optimistic checks scale with low contention and fit HTTP (send the version or an ETag), at the cost of retries or conflicts under heavy contention.",
    acceptance: ["Follow the diagram for both scenarios and match each step to an output line.", "Raise lock_timeout to 2 s and explain what B experiences.", "Explain when SKIP LOCKED is the right tool (a work queue) and when it is wrong (booking one specific seat)."],
    output: String.raw`A locks A1 FOR UPDATE, sees owner=null
B waits 300 ms then fails: SQLSTATE 55P03 (lock_not_available)
B with NOWAIT fails at once: SQLSTATE 55P03
after A commits, B locks A1 and sees owner=U1 -> B returns 409
A and B both read A2 at version 0 and 0 (no locks held)
A: UPDATE ... WHERE version = 0 -> rows=1
B: UPDATE ... WHERE version = 0 -> rows=0 -> conflict, B re-reads
B re-reads: version=1 owner=U1 -> B returns 409 without retrying the claim`
  },
  'b-jpa-01': {
    day: 16, title: "persistence context, dirty checking, N+1 and @Version", file: 'notes/java-examples/PersistenceContextLab.java', runner: 'jdk', sql: ["booking/sql/day16-jpa-sql.sql"],
    rule: "Rule: inside one persistence context find() returns the same instance for the same id, changes are detected at flush by comparing with a snapshot, and @Version adds \"AND version = ?\" to every UPDATE. The Java program is a plain-Java model of these JPA rules (no Hibernate jar); the SQL fixture runs the statements an ORM issues against PostgreSQL.",
    failure: "Failure it shows: listing 5 bookings and touching each lazy seat costs 6 queries (N+1; the SQL fixture shows 5 for 4 bookings), while a join returns the same rows in 1 query. Two contexts that loaded version 0 race; the second flush changes 0 rows and is reported as an optimistic lock failure. The partial unique index is enforced only by real PostgreSQL, which is why the integration test must use it, not an in-memory substitute.",
    tradeoff: "Trade-off: an ORM removes mapping code but hides query counts; measure queries in tests and use join fetch or entity graphs where a list needs children. Testcontainers-style PostgreSQL tests are slower than unit tests but catch dialect, index and constraint behaviour.",
    acceptance: ["Explain why the second flush adds no SQL.", "Count queries for 50 bookings with and without the join.", "Name one PostgreSQL feature in schema.sql that H2 cannot run."],
    output: String.raw`same instance in one context: true, queries: 1
after flush: update booking set status='CONFIRMED', version=1 where id=1 and version=0
second flush with no change adds no SQL: queries=2
N+1 for 5 bookings: 6 queries
join fetch for 5 bookings: 1 query
OptimisticLockException: booking 2 changed (version 1, loaded 0)
stored: status=CONFIRMED version=1`
  },
  'h-scaling-01': {
    day: 17, title: "two JVM processes against one PostgreSQL database", file: 'booking/jdbc/TwoJvmRace.java', runner: 'postgres', sql: [],
    rule: "Rule: once the service runs as two instances, a Java lock (synchronized, ReentrantLock) only excludes threads inside one process. The single authority must be shared state both instances use: here a conditional UPDATE in one PostgreSQL database.",
    failure: "Failure it shows: two child JVMs with different PIDs read 100 free seats, then write. With read-then-write each JVM is told it won all 100 seats (200 successes) even though each wrapped its writes in synchronized. With the conditional UPDATE there are exactly 100 successes and every stored owner is its only winner.",
    tradeoff: "Trade-off: pushing the decision into the database adds a network round trip per claim and makes the database the bottleneck for a hot show; it keeps instances stateless so you can add or restart them freely. Distributed locks (Redis, ZooKeeper) are an alternative with their own failure modes (lease expiry, fencing).",
    acceptance: ["Run it and explain why synchronized did not help in the first line.", "Change the child to claim in reverse order and check the totals stay 100.", "Describe what a load balancer adds and what it does not change about the invariant."],
    output: String.raw`two JVMs, different PIDs: true
check-then-act: successes reported=200 for 100 seats, seats both JVMs were told they won=100, seats whose stored owner is its only winner=0
conditional: successes reported=100 for 100 seats, seats both JVMs were told they won=0, seats whose stored owner is its only winner=100`
  },
  'h-requirements-01': {
    day: 18, title: "requirements turned into capacity numbers and a hot-key check", file: 'notes/java-examples/CapacityEstimate.java', runner: 'jdk', sql: [],
    rule: "Rule: write functional scope and non-functional targets first, then derive numbers from named assumptions: average and peak requests per second, read:write ratio, storage over retention, and the hottest key. Every conclusion (cache, single primary, waiting room) should follow from a printed number.",
    failure: "Failure it shows: averages hide the hot show. 2 million daily users give only about 23 peak bookings per second overall, but one blockbuster release produces about 3,333 claim attempts per second for 300 seats, so 99.85% of claims must lose quickly without overloading the database.",
    tradeoff: "Trade-off: estimates are order-of-magnitude tools; state assumptions so others can challenge them. Designing for the global peak wastes money; designing only for averages fails on the hot key.",
    acceptance: ["Double peakFactor and say which decision changes.", "Add a 5 KB seat-map payload and estimate egress per second at peak.", "Write the three non-functional requirements you would confirm with the interviewer."],
    output: String.raw`average reads/s: 231, peak reads/s: 1157
average bookings/s: 4.6, peak bookings/s: 23
read:write ratio about 50:1
booking storage for 3 years: 219 GB (fits one PostgreSQL primary)
hot show: 10000 seat-map reads/s and 3333 claim attempts/s for 300 seats
losing claims in that minute: 199700 of 200000 (99.85%)
decision: cache or CDN for seat maps: true; one primary for writes: true; hot show needs a queue or waiting room: true`
  },
  'l-invariants-02': {
    day: 19, title: "temporary holds with expiry, tested with a fake clock", file: 'notes/java-examples/HoldExpiryLab.java', runner: 'jdk', sql: [],
    rule: "Rule: a hold is a state with an owner and an expiry instant. One method decides whether a hold is active (now is before expiresAt), and both hold() and confirm() use it, so they cannot disagree. Inject java.time.Clock so tests move time instead of sleeping.",
    failure: "Failure it shows: U2 cannot take or confirm U1's active hold; U1 cannot confirm at exactly 10 minutes because the hold has expired (410); U2 can then hold and confirm; after confirmation nobody can hold the seat.",
    tradeoff: "Trade-off: lazy expiry (check on access) needs no background job but leaves stale rows to clean up; a sweeper keeps tables small but adds a moving part. In PostgreSQL the same rule is a conditional UPDATE ... WHERE expires_at > now(), using one clock (the database's) for every instance.",
    acceptance: ["Add a test for confirm at 9m59s by U1 (should succeed).", "Explain why the boundary uses isBefore, not !isAfter, and what the product should say.", "Write the SQL UPDATE that confirms only an active hold owned by the caller."],
    output: String.raw`t+0m  U1 hold A1    -> 200 held for U1 until 2026-12-06T20:10:00Z
t+0m  U2 hold A1    -> 409 held by U1
t+9m59s U2 confirm  -> 403 hold belongs to U1
t+10m U1 confirm    -> 410 hold expired or missing
t+10m U2 hold A1    -> 200 held for U2 until 2026-12-06T20:20:00Z
t+13m U2 confirm    -> 201 confirmed A1 for U2
t+13m U1 hold A1    -> 409 already booked by U2`
  },
  'b-http-02': {
    day: 20, title: "idempotency keys with stored replies and payload mismatch", file: 'notes/java-examples/IdempotencyLab.java', runner: 'jdk', sql: [],
    rule: "Rule: the client sends an Idempotency-Key with each logical request. The server stores the key, a hash of the payload and the reply in the same transaction as the booking. A retry with the same key and payload replays the stored reply; the same key with a different payload is rejected (422).",
    failure: "Failure it shows: the retry after a timeout returns the original 201 instead of a 409 for the client's own booking. Eight concurrent duplicates execute the booking once and replay the reply seven times, because the key is claimed atomically before the work starts.",
    tradeoff: "Trade-off: stored replies need storage and an expiry policy, and keys must be scoped per client. Without them, clients cannot retry safely after timeouts, and the user sees false conflicts or double charges.",
    acceptance: ["Explain why the second line is 201, not 409.", "Make the first request fail with an exception and decide whether its key should be stored.", "Design the idempotency table: columns, primary key and expiry."],
    output: String.raw`first POST k1          -> 201 A1 -> U1
retry POST k1 (timeout) -> 201 A1 -> U1 (replayed)
POST k1 other payload   -> 422 key reused with a different payload
new key k2 for A1       -> 409 A1 taken
8 concurrent duplicates: executions=1, replays=7`
  },
  'h-databases-01': {
    day: 21, title: "replica lag, read-your-writes, shard keys and query plans", file: 'notes/java-examples/ShardReplicaLab.java', runner: 'jdk', sql: ["booking/sql/day21-indexes.sql"],
    rule: "Rule: asynchronous replicas lag, so route a user's reads to the primary for a short window after that user writes (read-your-writes). Choose a shard key that keeps one transaction on one shard (show id for bookings). Add an index for the query you actually run and confirm with EXPLAIN.",
    failure: "Failure it shows: U1 reading from the replica right after booking sees \"free\". Adding a fifth shard with hash mod N moves about 80% of shows, a consistent-hash ring about 17%. In PostgreSQL the user lookup is a Seq Scan before the index and an Index Scan after; a composite (seat_id, status) index is not used for status alone, and lower(user_id) bypasses a plain index (checked on PostgreSQL 16 and 17).",
    tradeoff: "Trade-off: replicas add read capacity but stale reads; sharding adds write capacity but makes cross-shard transactions and re-sharding expensive; each index speeds reads and slows writes and costs storage.",
    acceptance: ["Run the SQL fixture and read each plan line.", "Create an expression index on lower(user_id) and re-run the last query.", "Explain the cost of booking two seats from two different shows when the shard key is show id."],
    output: String.raw`U1 reads A1, replica only:        replica: free
U1 reads A1, read-your-writes:    primary: U1
U2 reads A1 (not the writer):     replica: free
after replication, U2 reads A1:   replica: U1
adding shard 5: hash mod N moves 80% of shows, consistent ring moves 17%
shards touched by one 300-seat show: key=seat -> 4, key=show -> 1`
  },
  'b-caching-01': {
    day: 22, title: "cache-aside, a demonstrated stale read, invalidation and the slow-reader race", file: 'notes/java-examples/StaleCacheLab.java', runner: 'jdk', sql: [],
    rule: "Rule: cache-aside reads the cache, falls back to the database on a miss and fills the cache; writes go to the database and then invalidate the cache. A TTL bounds how long a stale entry can live. The booking decision itself never reads the cache.",
    failure: "Failure it shows: without invalidation the cache serves \"free\" 10 time units after U1 booked, until the TTL expires. With delete-on-write a slow reader that loaded the old row before the write can still put it back after the delete, so the cache serves U1 while the database says U2. A version check (an invalidation tombstone that remembers the committed version) rejects that older value.",
    tradeoff: "Trade-off: a longer TTL means fewer database reads and longer staleness; invalidation reduces staleness but has races; version checks or short TTLs bound the damage. Show seat maps from cache, but always decide bookings in the database.",
    acceptance: ["Explain each of the six output lines in one sentence.", "Set the TTL to 5 and re-run the race without the version check.", "Say which user-visible message you would show when a cached \"free\" seat returns 409."],
    output: String.raw`t=0  read: free (db)
t=10 read after U1 booked, no invalidation: free (cache) <- stale
t=31 read after TTL: U1 (db)
delete-on-write, next read: U1 (db)
without version check: next read -> U1 (cache), then -> U1 (cache), database says U2
with version check: next read -> U2 (db), then -> U2 (cache), database says U2`
  },
  'b-messaging-01': {
    day: 23, title: "transactional outbox, at-least-once relay and consumer deduplication", file: 'notes/java-examples/OutboxDedupLab.java', runner: 'jdk', sql: [],
    rule: "Rule: write the business row and the outbox row in one local transaction; a relay publishes outbox rows and marks them sent. Delivery is at-least-once, so the consumer records processed event ids together with its side effect and skips duplicates. Events for one seat use one partition key to keep their order.",
    failure: "Failure it shows: a dual write (commit, then crash before publishing) loses the event. With the outbox, a relay crash after publishing e2 but before marking it sent publishes e2 twice (4 messages for 3 rows), and the consumer still sends 3 emails and skips 1 duplicate.",
    tradeoff: "Trade-off: the outbox adds a table, a relay and some latency, but removes the dual-write gap without distributed transactions. Exactly-once processing is achieved by idempotent consumers, not by the broker alone.",
    acceptance: ["Explain where a crash causes a duplicate and why it cannot cause a loss.", "Make the consumer record the id after sending the email and describe the failure.", "Choose a partition key for \"seat released\" events and justify it."],
    output: String.raw`dual write: bookings=1, events published=0
relay crashed after publishing e2 (not marked sent)
outbox rows=3, messages on broker=4 (at-least-once)
consumer: emails sent=3, duplicates skipped=1
same seat, one partition, order: [BookingConfirmed, BookingCancelled]`
  },
  'h-loadbalance-01': {
    day: 24, title: "load balancing with a slow instance, latency percentiles and bounded load", file: 'notes/java-examples/LoadLab.java', runner: 'jdk', sql: [],
    rule: "Rule: report latency as percentiles that include queue wait, not averages. A balancer that counts outstanding requests routes around a slow instance; round-robin keeps sending it a fixed share. Bound queues and reject overflow (503) so latency stays bounded and invariants are checked under load.",
    failure: "Failure it shows: in the deterministic simulation (arrivals every 5 ms, instances of 10, 10 and 30 ms) round-robin has a fine p50 but p95 and p99 in seconds because the slow instance's queue grows forever; least-outstanding keeps p99 at 10 ms. Under 400 concurrent clients for 50 seats with a bounded pool, every request is accounted for, some are shed, and each seat has exactly one winner.",
    tradeoff: "Trade-off: shedding load fails some requests fast instead of all requests slowly; least-outstanding needs per-instance state at the balancer. Percentiles need enough samples; a p99 from 100 requests is one request.",
    acceptance: ["Explain why round-robin p50 looks healthy while p99 does not.", "Change the slow instance to 15 ms and compare.", "Write the alert you would set on p99 and on the 503 rate."],
    output: String.raw`round-robin          p50=10ms p95=12765ms p99=14565ms
least-outstanding    p50=10ms p95=10ms p99=10ms
accounted for every request: true
some requests shed with 503 instead of queueing: true
invariant: at most one winner per seat: true, stored owner = winner: true`
  },
  'h-consistency-01': {
    day: 25, title: "timeouts, a circuit breaker and degraded operation during a partition", file: 'notes/java-examples/DegradedModeLab.java', runner: 'jdk', sql: [],
    rule: "Rule: every remote call has a timeout. Repeated timeouts open a circuit breaker so later calls fail fast with a fallback. During a partition from the database primary, the booking write chooses consistency (refuse with 503 and retry later) while optional reads degrade with a visible \"may be out of date\" label.",
    failure: "Failure it shows: three 1-second help calls time out after 100 ms each, then the breaker answers the fourth in under 50 ms without waiting. While the primary is unreachable, booking A2 is refused instead of risking a double booking, and the seat map shows the last known state labelled stale; after recovery A2 books normally.",
    tradeoff: "Trade-off: refusing writes loses some sales during an outage but never sells a seat twice; serving stale reads keeps the site useful. Breakers need tuning (thresholds, half-open probes) or they flap.",
    acceptance: ["Explain why the fourth call is fast.", "Write a five-step outage runbook: detect, decide (pause bookings), communicate, recover, verify invariants.", "Decide which features may serve stale data and which may not, with one reason each."],
    output: String.raw`help, healthy (20 ms):  cited answer from policy P1
help, slow #1 (1 s):   fallback (timed out after 100 ms)
help, slow #2 (1 s):   fallback (timed out after 100 ms)
help, slow #3 (1 s):   fallback (timed out after 100 ms)
help, 4th call:         fallback (breaker open, no wait), answered in under 50 ms: true
201 A1 -> U1
503 booking paused: primary unreachable, try again (no double booking risk)
seat map during partition: {A1=U1} [stale, labelled 'may be out of date']
after recovery: 201 A2 -> U2`
  },
};
