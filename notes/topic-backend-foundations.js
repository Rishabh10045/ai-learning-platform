const executorApi = ['Java 21 · ThreadPoolExecutor', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html'];
const jvmAreas = ['JVM Specification · Runtime data areas', 'https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5'];
const designRoadmap = ['Low-level design roadmap', 'https://rishabh10045.github.io/studyapp/lld/roadmap.html'];
const junitGuide = ['JUnit 5 · User guide', 'https://junit.org/junit5/docs/current/user-guide/'];
const pg = 'https://www.postgresql.org/docs/current/';

export const backendFoundationTopics = {
  'j-executors-01': {
    notes: [
      'An executor separates task submission from worker lifecycle. A one-worker pool with a one-slot queue can hold one running task and one waiting task. If the first task is deliberately blocked, the third submission meets the configured rejection policy. A policy that reports rejection lets the caller retry within a budget or return a defined overload outcome.',
      'A timed Future.get bounds the caller’s wait. The underlying task can still continue, including a side effect after the caller times out. Cancellation can request interruption. A cooperative task and its blocking dependencies determine whether the work actually ends. Query an uncertain write outcome before repeating it.',
      'Choose worker bounds by resource demand and validate the source of wait time. Put queue capacity, timeouts, rejection and shutdown in the design together. In a controlled test, use a latch to hold the first worker before submitting the second and third tasks. Release the latch and await termination in cleanup.'
    ],
    practice: ['Run the Day 7 bounded-executor fixture. Predict which submission is rejected and what a caller timeout changes.', ['Exactly one task runs while a second waits and the third is rejected.', 'A timed wait on the first task leaves it active until the gate is released.', 'The two accepted tasks finish and the executor terminates.']],
    interview: [
      ['What do worker and queue limits control separately?', 'Workers bound simultaneous execution. The queue bounds accepted work that waits. When both are full the rejection policy decides what the caller observes.'],
      ['Does a Future timeout cancel the task?', 'Timed get only bounds the waiting call. Explicit cancellation, disruption of the dependency and the operation’s side-effect contract are separate considerations.'],
      ['How can you test rejection deterministically?', 'Hold the active worker on a latch, fill the queue, attempt a third submission and assert the selected rejection behavior before releasing the worker.']
    ],
    takeaways: ['Bound running and queued work independently.', 'Separate waiting, cancellation and completion.', 'Exercise overload and cleanup with explicit coordination.'],
    check: ['One worker is busy and the one-slot queue is full. What determines the next submission’s outcome?', ['The rejection policy', 'The number of CPU cores alone', 'Future.get’s timeout'], 0, 'Submission occurs against executor capacity and its configured rejection behavior.'],
    references: [executorApi, ['Java 21 · Future', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html']]
  },
  'j-jvm-01': {
    notes: [
      'Each JVM thread has its own execution stack and frames. A frame records local variables and execution information for one invocation. Java object references in separate frames can point at the same object. The caller’s local variable and the referenced object’s shared state have different lifetimes and visibility rules.',
      'In the booking fixture, two Callables can capture the same Seat. Their local result variables are independent, and their writes can still target the same owner field. Passing a reference copies the reference value. It preserves sharing rather than cloning the object.',
      'Trace recursion as one frame per unfinished call. A long chain can exhaust thread stack capacity even when little data is retained elsewhere. Retaining many reachable objects or allocating faster than reclamation can exhaust heap. Use the actual error and a thread or memory diagnostic before attributing the symptom.'
    ],
    practice: ['Draw two worker call stacks and the one shared Seat in the Day 7 fixture. Add a trace for two separate Seat instances.', ['Label local values and identify exactly which reference aliases.', 'Changing one independent Seat preserves the other.', 'Distinguish a deep-call failure from retained heap growth by the observed error.']],
    interview: [
      ['Can two threads have private local variables and still race?', 'Yes. Local references can point to the same mutable object. The mutation protocol for that object determines thread safety.'],
      ['What does passing a Seat to a method copy?', 'It copies the reference value. Both references can still refer to the same object.'],
      ['Why can uncontrolled recursion fail with little live heap?', 'Unfinished calls accumulate stack frames per thread. Stack exhaustion is independent of how much live heap those frames retain.']
    ],
    takeaways: ['Separate a reference from its referent.', 'Trace aliasing across thread frames.', 'Diagnose stack and heap evidence independently.'],
    references: [jvmAreas]
  },
  'l-solid-01': {
    notes: [
      'A Seat changes when booking rules change. A presenter changes when response formatting changes. That leads to different reasons to change and an SRP seam. Dependency inversion can have BookingService depend on a narrow SeatRepository contract while SQL remains in an implementation.',
      'If hold duration varies by ticket type, define a HoldPolicy with its inputs and guarantees. Existing and added policy implementations can share the same call site, illustrating open/closed and substitution. Test the same expiry and invalid-input contract for each. A policy that silently extends an expired hold violates the caller’s expectation.',
      'Broad interfaces make unrelated callers depend on behavior they never use. Separate seat lookup from administration if the booking path needs only lookup. Compare the change paths before splitting so that the interface expresses an actual responsibility.'
    ],
    practice: ['Design two HoldPolicy implementations for the same contract and add shared tests. Sketch the interface each client actually uses.', ['A new policy fits without editing the existing dispatch path.', 'Both implementations honor exact expiry and validation outcomes.', 'The request adapter can vary without editing the core invariant.']],
    interview: [
      ['What is a useful Single Responsibility Principle test?', 'Name likely reasons for change and identify which component would change for each. Separate behavior when different policies or callers drive it.'],
      ['How do you prove a new policy is substitutable?', 'Run one contract suite against both implementations, including allowed inputs and rejected transitions.'],
      ['How do dependency inversion and interface segregation interact?', 'A caller depends on an abstraction describing its needed operation. A narrow interface keeps unrelated concerns and implementation details out of that dependency.']
    ],
    takeaways: ['Connect principles to concrete change paths.', 'Verify shared contracts with more than one implementation.', 'Create an abstraction that serves a caller.'],
    references: [designRoadmap]
  },
  'b-testing-01': {
    notes: [
      'Use the real rule owner in a unit test. The Day 8 fixture supplies one Seat and a fake lookup dependency, executes two booking calls and checks the final owner. A fake that returns a predetermined successful booking carries no evidence about the rule the real implementation enforces.',
      'Arrange a fresh fixture for each case, act through the normal public method and assert both observable outcome and state. Use one success, one already-claimed conflict and one illegal input. A test should fail when the production guard is removed, so temporarily break the rule and observe the useful failure during practice.',
      'A Spring context test proves wiring and bean resolution. A repository integration test proves concrete database behavior such as uniqueness or rollback. These are distinct claims. Keep a quick deterministic unit contract and add narrower integration evidence for the boundaries that use real infrastructure.'
    ],
    practice: ['Write three JUnit contract tests for a real Seat and fake repository. Temporarily reverse the ownership guard and rerun.', ['Tests assert final owner after success and rejection.', 'Independent fixtures keep test order irrelevant.', 'The intentional guard defect causes an assertion failure.']],
    interview: [
      ['Why use a fake repository and a real Seat?', 'The repository is an independent boundary. The real Seat owns the rule the test is trying to verify.'],
      ['What does a Spring context test add?', 'It can prove bean discovery and actual application wiring under the selected configuration. The unit fixture tests business behavior more directly.'],
      ['Which assertion catches a false return after an incorrect mutation?', 'Read the seat owner afterward and assert that it is unchanged.']
    ],
    takeaways: ['Exercise the real rule and replace only a dependency.', 'Test outcomes and state effects separately.', 'State which layer each test proves.'],
    check: ['Which test can detect a broken seat invariant?', ['Stub the booking result to true.', 'Use a real Seat and assert the outcome and final owner.', 'Only check that an application context loads.'], 1, 'Running the real domain transition and checking its final state exposes the defect.'],
    references: [junitGuide]
  },
  'j-build-01': {
    notes: [
      'Maven describes project coordinates, dependencies and settings in the POM. A lifecycle phase runs the bound goals needed for that phase and its predecessors. For example, verify includes compilation, unit testing and packaging under the configured lifecycle and any bound verification goals.',
      'Separate dependency roles. A dependency available only to tests can have test scope. Using it in main code should fail compilation under a clean build. A Maven wrapper pins the build tool launcher, while compiler release and dependency versions pin other parts of the environment.',
      'After packaging, use another clean checkout or directory to repeat the same build and run the produced artifact. Capturing the exact command and output is useful for CI. A successful package goal alone does not demonstrate that runtime configuration, database access and application wiring work in a deployment.'
    ],
    practice: ['Run the Day 9 Maven project’s wrapper through clean verify, then run the produced artifact. Change a dependency used only by tests to the test scope.', ['Record Maven and Java versions plus the exact command.', 'The test dependency is absent from the normal runtime classpath.', 'A clean checkout builds and produces the documented artifact.']],
    interview: [
      ['How does a phase differ from a goal?', 'A phase is a stage in a lifecycle. Goals are plugin tasks bound to those phases or invoked directly.'],
      ['What does test scope do?', 'It makes the dependency available to the test classpath as appropriate while keeping it out of the ordinary compile/runtime application dependency set.'],
      ['What evidence would you require after mvn package?', 'Run the built artifact with its intended configuration and exercise a readiness or contract check under that environment.']
    ],
    takeaways: ['Name the lifecycle stage and tool versions.', 'Use a scope based on the dependency’s actual consumers.', 'Verify the packaged result separately from compilation.'],
    references: [['Maven · Lifecycle introduction', 'https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html']]
  },
  'b-di-01': {
    notes: [
      'Constructor injection declares dependencies required to construct a usable object. BookingService receives a SeatRepository. Spring assembles the configured bean graph at runtime. A plain Java test can construct the same service with a fake repository without loading the container.',
      'When no eligible repository bean is available, construction of the dependent bean fails. When two eligible beans match, configuration must express which one to use, such as with a qualifier or primary bean. Test failures and configuration explicitly instead of adding a conditional default that obscures the intended dependency.',
      'Follow the chain from controller to service to repository. Use one narrow test for the service behavior and one Spring context test for the real assembly. A singleton bean can still share mutable state with concurrent callers, so scope and behavior of the dependency are distinct.'
    ],
    practice: ['Create a service with a constructor-required SeatRepository. Test it directly and verify the real Spring context.', ['The direct test uses a fake repository while exercising the real service.', 'Removing the configured repository causes the expected context construction failure.', 'The successful context resolves the intended implementation.']],
    interview: [
      ['What does constructor injection buy at the type boundary?', 'It exposes required collaborators at construction and makes the normal service test possible with an explicit fake.'],
      ['What happens when two repository beans match?', 'Spring needs additional selection information, such as a qualifier or primary bean, or dependency resolution fails.'],
      ['Does a singleton bean guarantee thread safety?', 'Its scope determines instance reuse inside the container. Its state and mutation protocol determine thread safety.']
    ],
    takeaways: ['Make required dependencies explicit.', 'Test both independent construction and container assembly.', 'Decide scope separately from thread safety.'],
    check: ['How can you test BookingService without Spring?', ['Call its constructor with a test repository.', 'Hide the repository in a global field.', 'Remove its required dependency.'], 0, 'Direct construction can supply any implementation that honors the required contract.'],
    references: [['Spring · Dependency injection', 'https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html']]
  },
  'b-http-01': {
    notes: [
      'HTTP methods express client intent. GET is safe in its defined request semantics and should read availability. POST /bookings asks for a state change. A client may repeat a request after losing a response, so operations with real effects need a documented replay contract.',
      'A successful booking can return 201 and a Location header describing the created resource. An unknown seat is a missing resource. A well-formed request that conflicts with current ownership can return 409. Client errors and conflicts each need stable response details so the client can act without parsing message prose.',
      'Trace two clients: one reads A1 available, the other books it, and the first then sends POST. The original GET remains correct for its moment. The subsequent write is rejected by the authoritative boundary and must preserve the winner. Verify both response and durable state.'
    ],
    practice: ['Capture a GET, a valid POST and a conflict. Explain safe semantics, request replay and the final owner.', ['The two legitimate requests have distinct status and state outcomes.', 'A successful creation has a resource identifier.', 'A conflicting POST leaves the original owner intact.']],
    interview: [
      ['How do safety and idempotency differ?', 'Safety means the client requests read-only semantics. Idempotency means repeating the same request has the same intended effect as sending it once.'],
      ['Why can a valid POST return 409?', 'Its requested state change conflicts with the resource’s current state, such as a seat already claimed by another user.'],
      ['How do you handle a lost POST response?', 'Treat the outcome as uncertain. Use status lookup or a replay contract that scopes and validates an idempotency key.']
    ],
    takeaways: ['Choose methods from request semantics.', 'Use stable result codes and verify persisted effects.', 'Define a deliberate retry contract for writes.'],
    check: ['A GET says A1 is available and the later POST responds 409. Which outcome governs the booking?', ['The cached GET', 'The authoritative POST check', 'Whichever request arrived at the browser last'], 1, 'The current authoritative write enforces the ownership rule.'],
    references: [['IETF RFC 9110 · HTTP Semantics', 'https://www.rfc-editor.org/rfc/rfc9110.html']]
  },
  'b-rest-01': {
    notes: [
      'A REST controller translates the wire contract into an application call. Spring MVC chooses a method by mapping, deserializes the body and can validate its DTO. Application code coordinates lookup and domain transition. Keep the controller focused on translating status and response bodies.',
      'Use explicit resource paths such as GET /seats/{id} and POST /bookings. Validate the request at the edge and retain essential domain checks for another caller such as an importer. Emit a stable public error code and preserve private diagnostic information in controlled logs.',
      'Test malformed JSON independently from valid input that produces a conflict. A controller slice can assert mappings, status, JSON and headers. A service or integration fixture checks the actual state transition. Pair the evidence when testing the feature end to end.'
    ],
    practice: ['Implement the Day 10 seat GET and booking POST. Call both routes and capture the outcomes for missing resource, malformed request, success and conflict.', ['Correct controller mapping and response status for each case.', 'Stable response fields distinguish each public error.', 'End-to-end evidence observes one owner after a successful claim and failed second write.']],
    interview: [
      ['Which responsibilities belong in a controller?', 'Translate HTTP inputs and outputs, invoke application operations and map their results. Keep the booking invariant independent of the transport.'],
      ['How does invalid JSON differ from a business conflict?', 'Invalid JSON fails at decoding. A business conflict occurs after a valid command reaches current authoritative state.'],
      ['What does a controller slice test leave to an integration test?', 'The slice tests HTTP behavior around the controller. Real persistence and state transitions require tests for those components and their wiring.']
    ],
    takeaways: ['Keep the controller at the wire boundary.', 'Test decoding and business failures separately.', 'Check both response and state in the end-to-end flow.'],
    references: [['Spring · Building a RESTful Web Service', 'https://spring.io/guides/gs/rest-service/']]
  },
  'b-sql-01': {
    notes: [
      'A primary key identifies a row and enforces uniqueness and non-null values. A foreign key requires an allowed referenced key. A CHECK constraint can verify a rule about the row such as a coherently paired hold ID and expiry. Model the durable obligations in schema constraints so every writer obeys the same rule.',
      'A nullable column needs deliberate semantics. PostgreSQL unique constraints allow multiple nulls by default. To prevent more than one active booking, use a suitable schema or unique partial index based on the chosen model and test that archived records can coexist with one active record.',
      'Seed an A1 seat and attempt a second row with the same key. Attempt an invalid reference and a row whose hold data violates the check. Verify the database error and durable state through a separate read. Wrap failing commands deliberately so one test does not corrupt another fixture.'
    ],
    practice: ['Create a booking schema and run valid, duplicate-key, invalid-reference and invalid-state inserts. Record the exact database outcomes.', ['The valid fixture is persisted.', 'Each declared invariant has a failing insert and the expected state remains intact.', 'Explain null semantics and the intended key for an active booking.']],
    interview: [
      ['Which rule belongs in a foreign key instead of an application-only check?', 'Existence of a related durable key, when that relationship must hold across writers and transactions.'],
      ['How could prior cancellations coexist with only one active booking per seat?', 'Separate active state from history, or enforce a conditional uniqueness constraint over active rows as appropriate.'],
      ['Why inspect database state after a rejected insert?', 'The error identifies a failure path. Observing state confirms that no unintended record or related effects survived it.']
    ],
    takeaways: ['Make row identity and relations explicit.', 'Define null and history semantics.', 'Prove constraints from a real DB session.'],
    references: [['PostgreSQL · Constraints', pg + 'ddl-constraints.html']]
  },
  'b-schema-01': {
    notes: [
      'A migration is an ordered, repeatable schema change. An empty installation and an established installation should reach the intended schema through supported histories. Put seed data in a deliberate fixture path and distinguish durable production data from disposable local exercise rows.',
      'For a new required field in existing rows, use an expand and contract sequence where the deployment needs old and new versions to coexist. Add the field in a compatible way, populate existing values, then apply the stricter constraint after checking real rows. Update application reads and writes at the matching step.',
      'Test both fresh initial setup and upgrade from a snapshot with a real booking. Verify the exact new definitions and the survival of old values. Large updates can take locks or add load, so practice staging the migration and state how you would stop, retry or recover a failing step.'
    ],
    practice: ['Add a booking field through a two-step migration and verify a fresh database plus an upgrade fixture containing A1/U1.', ['Fresh setup and upgraded schema have the intended compatible definitions.', 'The existing owner is preserved.', 'The migration handles a missing backfill before enabling the stricter constraint.']],
    interview: [
      ['Why validate an upgrade as well as a fresh schema setup?', 'Existing rows, constraints and running client versions create conditions absent from an empty database. An upgrade test exposes those dependencies.'],
      ['How can you add a required column safely to populated rows?', 'Expand compatibly, backfill and verify data, then enforce the required rule when remaining clients and rows are ready.'],
      ['What evidence supports recovery after a failed migration?', 'Know which changes commit, preserve a restore point, capture migration version and verify the expected data after retry or recovery.']
    ],
    takeaways: ['Give each schema change an ordered history.', 'Test the real upgrade path with data.', 'Choose recoverable steps that respect current clients.'],
    references: [['PostgreSQL · Modifying tables', pg + 'ddl-alter.html']]
  },
  'b-jdbc-01': {
    notes: [
      'A JDBC Connection represents a session and transaction boundary. A PreparedStatement separates the SQL statement template from bound values. Bind each parameter with the intended type and let the driver handle values. Query identifiers such as a dynamic sort column require selection from an explicit set of allowed identifiers.',
      'For an UPDATE with a guarded predicate, executeUpdate returns the affected-row count. One matched row indicates a successful transition under the statement’s conditions. Zero may mean a missing row, conflict or a predicate mismatch. Choose any follow-up lookup with the operation’s consistency requirements in mind.',
      'Resources should close when use ends. Try-with-resources helps return borrowed connections and close statements and result sets. When several statements must commit together, disable auto-commit for that unit, keep them on the same connection, and roll back on failure. Observe committed state from an independent connection.'
    ],
    practice: ['Implement one prepared read and one guarded update. Deliberately trigger a failure between two dependent writes.', ['Seat IDs are bound as values, including quotes in input.', 'The update count distinguishes a matching transition and a failed guard.', 'A failed transaction rolls back and an independent connection sees the unchanged state.']],
    interview: [
      ['How does a PreparedStatement handle an input value?', 'The caller binds the value separately from the SQL template. It is represented as data by the driver and database.'],
      ['Can you bind a column name like a value?', 'Parameter binding represents values. Select identifiers from intended, whitelisted query variants when they must vary.'],
      ['What is the risk of acquiring a separate Connection for each statement?', 'Separate sessions have separate transaction state. Dependent writes can commit or roll back independently.']
    ],
    takeaways: ['Bind values with their intended types.', 'Read the update count as evidence of the guard.', 'Keep a transaction on one connection.'],
    check: ['Which action retains one transaction boundary?', ['Use the same Connection for all statements in the unit.', 'Open a new connection for each statement.', 'Enable auto-commit between dependent writes.'], 0, 'One connection owns the session and its transaction state.'],
    references: [['Java 21 · PreparedStatement', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html']]
  },
  'b-transactions-02': {
    notes: [
      'A conditional update expresses availability in the write statement. If a seat starts unowned, UPDATE seats SET owner=? WHERE id=? AND owner IS NULL can establish one winner. Reading availability separately and writing without a matching guard allows the read and write sequences to interleave.',
      'At PostgreSQL Read Committed, a competing UPDATE targeting the same row can wait for the first transaction. When the first commits, PostgreSQL rechecks the WHERE condition against the row version it can update. If owner is now set, the second statement can affect zero rows. Different isolation levels may signal other outcomes that need their own retry policy.',
      'Capture the update count for both clients and read the final state from a separate transaction. Use two distinct connections, synchronize the order, and cap the wait. Also test rollback by the first writer. When it rolls back, the second transaction may become the winner.'
    ],
    practice: ['Run two PostgreSQL sessions against one free seat and capture update counts. Repeat with the first writer rolling back.', ['Under the commit scenario the guarded transition changes the seat once.', 'The losing update affects zero rows under the stated Read Committed fixture.', 'The rollback case identifies a valid successful second writer and a final owner.']],
    interview: [
      ['Why include availability in the UPDATE predicate?', 'The predicate lets the database check eligibility at the enforcing operation so the original read cannot authorize an outdated write.'],
      ['What does an affected-row count of zero tell you?', 'The specific statement did not update a row. Current ownership conflict and missing ID are possible causes depending on the schema and predicate.'],
      ['How should a test control a concurrent update?', 'Use separate connections, hold or order the first transaction explicitly, bound waits and then inspect both counts and the final committed state.']
    ],
    takeaways: ['Check eligibility at the write.', 'Interpret counts in the chosen isolation level.', 'Verify final state from an independent session.'],
    check: ['A guarded UPDATE runs after the winning transaction commits. Which result indicates losing the guard?', ['Two affected rows', 'Zero affected rows', 'A successful prior GET'], 1, 'With owner already set, the availability predicate no longer matches.'],
    references: [['PostgreSQL · Read Committed isolation', pg + 'transaction-iso.html']]
  },
  'b-transactions-03': {
    notes: [
      'Pessimistic locking obtains a lock before a multi-step decision. SELECT ... FOR UPDATE locks the selected rows until the transaction ends. Order lock acquisition consistently when several rows are involved. Keep the transaction short and let the caller handle timeout or a detected deadlock.',
      'Optimistic locking checks a previously read version during the update. A stale version loses the guard rather than overwriting changes. The caller can re-read, return a conflict or attempt a bounded retry, depending on whether the command is safe to reapply.',
      'Try the same contested seat with each strategy. In one fixture observe a waiting connection while the first holds the lock. In the other fixture have both clients read version 12, let one write version 13 and show that the stale WHERE version=12 update affects zero rows.'
    ],
    practice: ['Capture one PostgreSQL row-lock wait and one stale-version conflict with two connections.', ['Both strategies preserve the valid owner or version.', 'The log distinguishes a waiting lock from a failed version guard.', 'Explain where retries or rollback belong and limit the wait.']],
    interview: [
      ['When can SELECT FOR UPDATE be useful?', 'It can protect a decision that reads and changes selected rows across multiple statements in one transaction.'],
      ['What is a signal that optimistic locking detected a conflict?', 'A guarded update affects zero rows or the persistence layer reports an optimistic lock exception for a stale version.'],
      ['How can multiple row locks deadlock?', 'Transactions can hold different rows and each wait for the row the other holds. A consistent order reduces that cycle.']
    ],
    takeaways: ['Choose based on contention and retry cost.', 'Observe waits and version conflicts separately.', 'Order multi-row locking and bound recovery.'],
    references: [['PostgreSQL · Explicit locking', pg + 'explicit-locking.html']]
  },
  'b-jpa-01': {
    notes: [
      'A persistence context tracks managed entities and their changes. Flush synchronizes pending changes with the database transaction. Commit decides transaction durability and can still fail. Clear or use a distinct persistence context when a test must prove what another transaction observes.',
      'A list of N bookings can load successfully with one query and issue N more lazy queries when views dereference different owners. Identity reuse and warm caches can hide the pattern. Capture SQL in a fresh context with intentionally distinct associations and verify the actual result set.',
      'A projection can load just the endpoint’s data. A fetch join can also remove round trips, while collection joins can multiply rows and complicate pagination. Compare query counts and the values returned under the exact endpoint contract.'
    ],
    practice: ['Read a page of bookings with distinct owners. Count SQL before and after a projection or appropriate fetch plan.', ['The fresh test context reveals the extra owner reads.', 'The new query plan preserves API fields and ordering.', 'The following page has the expected distinct rows and no accidental duplicates.']],
    interview: [
      ['What is the difference between flush and commit?', 'Flush issues pending state changes within the transaction. Commit determines whether the transaction becomes durable.'],
      ['Why can the same-size page show fewer extra queries during development?', 'Repeated relationships or caches may satisfy accesses without SQL. Use distinct associations and a fresh context to expose the representative pattern.'],
      ['Why can a collection fetch join complicate pagination?', 'The join can expand each parent into several result rows, interfering with row-limit behavior or requiring additional processing.']
    ],
    takeaways: ['Check effect and durability with the right boundary.', 'Measure query counts in a representative fixture.', 'Keep pagination contract intact during optimization.'],
    check: ['One query loads bookings, and four additional queries individually load four owners. What pattern is visible?', ['N+1 reads', 'An optimistic write conflict', 'A missing transaction commit'], 0, 'The initial query is followed by one additional lookup per association accessed.'],
    references: [['Hibernate ORM · Fetching', 'https://docs.hibernate.org/orm/6.6/userguide/html_single/#fetching']]
  },
  'b-testing-02': {
    notes: [
      'An integration test is useful when the behavior depends on the concrete database engine. PostgreSQL-specific constraints, isolation, conditional updates and query plans can differ from behavior in an in-memory substitute. Use the intended schema migrations against a disposable PostgreSQL instance.',
      'Keep test isolation explicit. Seed one seat, use one failed write and verify durable state from a second connection. Where a test needs concurrency, share the same database fixture and coordinate separate sessions. A transaction rolled back by the test harness can hide whether a service commit or rollback actually happened.',
      'Make startup and cleanup reproducible. Testcontainers can provision a compatible database in environments with the required container runtime. Capture the image and migration versions and use controlled data. Leave container availability separate from the unit checks.'
    ],
    practice: ['Define a PostgreSQL-backed test fixture for a duplicate or stale booking write and exercise the normal entry point.', ['Migrations create the target schema from scratch.', 'A failed guarded write leaves one authoritative owner observable from an independent connection.', 'The test reports database and fixture setup and cleans up on failure.']],
    interview: [
      ['Why choose an actual PostgreSQL test instance?', 'It exercises real SQL dialect, constraints, transaction behavior and query plans used by the feature.'],
      ['How might an outer test transaction hide a problem?', 'It can defer commit, roll back all changes uniformly or change visibility and propagation across the calls under test.'],
      ['What makes a test fixture portable to CI?', 'Pin the database setup, run migrations reproducibly, control seed data, bound waits and clean up even after assertions fail.']
    ],
    takeaways: ['Test database claims on the selected engine.', 'Read durable state from the intended transaction boundary.', 'Separate container setup from unit tests.'],
    references: [['Testcontainers · PostgreSQL module', 'https://java.testcontainers.org/modules/databases/postgres/']]
  }
};
