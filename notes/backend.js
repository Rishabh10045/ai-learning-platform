export const backendNotes = {
  9: {
    sections: [
      ['Build and dependency injection',
        'Maven reads a project object model to resolve dependencies and run the build lifecycle. The test phase compiles and runs tests, and package creates an artifact after earlier phases. Use the Java version supported by the chosen Spring Boot release and prefer the project wrapper for reproducibility. Keep provider keys and machine-specific settings out of the source tree.',
        'Spring assembles application objects as beans and can supply them through constructors. A controller declares a BookingService dependency and the container selects the matching bean. A service with an explicit constructor can also be instantiated in a unit test with a test repository. Configuration determines which concrete beans are wired.'],
      ['Trace startup and isolate a failing layer',
        'Starting the application creates a context, resolves dependencies and starts the configured web server. A missing bean means the context cannot satisfy a dependency. Multiple matching implementations may require a qualifier or a primary option. A build error, a context error and a port conflict happen at different stages and call for different checks.'],
      ['Keep the first test narrow',
        'Start with one controller, service and narrow test. Do a context smoke test to prove wiring and a conventional unit test to prove domain behavior. Compare what each failure means. The bean lifetime establishes object reuse and tells you where shared state may arise.']
    ],
    quick: ['Maven phases and Spring runtime wiring solve different problems.', 'Use constructor injection for required dependencies.', 'Context and unit tests prove different things.'],
    variation: 'Two repositories implement the same interface. How can production and test contexts intentionally select different implementations?',
    check: 'Run the build and trace where the BookingService dependency is declared, selected and used.'
  },
  10: {
    sections: [
      ['Design the contract of a resource',
        'Use GET to retrieve a seat representation and POST to request a booking. HTTP methods communicate intent to clients and intermediaries. Use a stable response body and document status codes. For example, a newly created booking can return 201, an unknown resource 404 and a valid but unavailable request 409. Decide the domain result first and map it at the HTTP boundary.',
        'Spring MVC matches the method and path, deserializes JSON into the request representation and calls the controller. The controller invokes application logic and converts the outcome to a response. Keeping controllers narrow lets the same booking rule serve a REST request and a unit test.'],
      ['Inspect real requests and responses',
        'Send a GET before and after posting a booking. Record the status, headers and body independently. Confirm the second user sees a conflict and the original booking stays visible. The ability to read availability never guarantees that a subsequent POST will succeed.'],
      ['Separate read and write semantics',
        'A safe method has read-only semantics for the client’s request. Repeating an idempotent request has the same intended effect as making it once. POST becomes retry-friendly when you design an explicitly scoped idempotency mechanism. That topic comes after the basic endpoint works.']
    ],
    quick: ['GET reads and POST requests a change.', 'Map validation, missing resources and conflict intentionally.', 'Availability is a snapshot.'],
    variation: 'A client loses the success response and retries the POST. What information would let the server return the prior result?',
    check: 'Capture success and conflict responses and explain how a controller keeps HTTP concerns outside the domain.'
  },
  11: {
    sections: [
      ['Validate at the appropriate boundary',
        'Request validation checks format and required values before business logic. Bean Validation can detect a blank user ID on a request DTO, while the domain still enforces valid state transitions when called directly. JSON syntax and missing request fields are client input issues. A well-formed competing booking can reach the service and receive a conflict.',
        'Use an error response with a stable machine-readable code, concise detail and a request identifier where useful. Spring’s controller advice can map known exceptions centrally. Avoid exposing stack traces and raw SQL in public response bodies.'],
      ['Prove different errors stay different',
        'Use request examples for invalid body, unknown seat and booked seat. Record the response code and error code. Repeat the whitespace user example against an already-booked seat so the input contract is exercised independently of the conflict check.'],
      ['Treat client messages as a contract',
        'Clients should rely on stable codes and fields instead of parsing natural language. Version incompatible changes intentionally. Logging may retain diagnosis fields that an API excludes, subject to the application’s privacy policy.']
    ],
    quick: ['Validate request shape before domain changes.', 'Error codes are part of the client contract.', 'Keep private diagnostics in controlled logs.'],
    variation: 'A new internal caller bypasses the HTTP controller. Which checks still need to occur in the application or domain layer?',
    check: 'Show distinct API results for malformed input, missing seat and conflicting ownership.'
  },
  12: {
    sections: [
      ['Model durable identity and ownership',
        'A primary key gives each seat row a unique, non-null identity. A foreign key can require a booking or owner reference to exist. A unique constraint can enforce one current booking per seat in a design where that relationship lives in its own table. PostgreSQL allows multiple nulls in a normal unique constraint by default, so model the nullable case intentionally.',
        'Use a check constraint for a property of an individual row, such as allowed state values or coherent fields in a hold. Cross-table relationships are normally represented with foreign keys. For this first step, keep the schema small and document whether prior bookings are historical records or mutable state on the seat.'],
      ['Test the database directly',
        'Seed A1, query it, try a duplicate key and attempt one invalid row that violates a declared constraint. Capture the database result for each operation. Verify invalid inserts in a deliberate transaction or fixture so subsequent tests start clean.'],
      ['Draw the migrations boundary',
        'A migration changes the schema in a reproducible sequence. Including schema creation and seed logic in the repo allows a clean database to be reconstructed. Plan changes to large or populated tables separately from development fixtures.']
    ],
    quick: ['Put durable identity in a primary key.', 'Use constraints to protect state across callers.', 'Test invalid data directly against PostgreSQL.'],
    variation: 'You must retain cancellation history while allowing a later booking for A1. How would you represent the active booking separately from history?',
    check: 'Show an invalid insert rejected by PostgreSQL and explain which invariant it protects.'
  },
  13: {
    sections: [
      ['Use the JDBC transaction boundary',
        'A JDBC connection represents a database session. With autocommit enabled, successful SQL statements commit under their individual execution boundaries. Disable autocommit when multiple statements belong to one atomic unit and explicitly commit or roll back. Use try-with-resources around statements and results. Return connections safely when using a pool.',
        'A prepared statement separates SQL text from bound values and makes type conversion explicit. For example, use a parameter for a seat ID instead of interpolating it into SQL. Parameter binding handles values. Identifiers that vary dynamically need a validated mapping chosen by application code.'],
      ['Observe rollback and isolation',
        'Run a write on one connection and read from another before and after commit. Under PostgreSQL Read Committed a normal query sees committed data visible to that statement plus its own transaction’s changes. Roll back a second write and verify the durable state. Record which connection issued each command.'],
      ['Scope transactions to useful work',
        'Keep a transaction open for the minimum work that needs shared atomicity. Waiting for unrelated remote I/O can hold locks and pool resources. Capture SQL errors with context and propagate a clear failure to the caller.']
    ],
    quick: ['A connection owns its transaction.', 'Bind values in parameterized SQL.', 'Use a second connection to observe visibility.'],
    variation: 'The service needs to write the booking and an audit row. How do you handle an error from the audit insert after the seat update?',
    check: 'Run separate commit and rollback examples and explain what a second connection can see.'
  },
  14: {
    sections: [
      ['Put the condition in the write',
        'A SELECT followed by an unconditional UPDATE creates a decision gap. Two transactions can see the prior state and each try to act on it. A conditional statement such as UPDATE seats SET owner = ? WHERE id = ? AND owner IS NULL makes the predicate part of the write. Use the affected-row count to distinguish a winner from a zero-row outcome.',
        'In PostgreSQL Read Committed, if a concurrent update changes the target row first, the later updater waits and re-evaluates the predicate against the updated row once the first transaction commits. A change to owner can therefore make the row ineligible. Check the transaction isolation level when explaining this behavior.'],
      ['Test two connections under contention',
        'Use independent database connections and coordinate the start. Leave one transaction open briefly to observe waiting, then commit and record both update counts. A zero count can mean the row is missing or the predicate failed. Decide whether the public contract needs to distinguish those cases and design a safe query strategy accordingly.'],
      ['Keep the decision atomic',
        'Constraints remain valuable when additional writers exist. If booking requires updating multiple rows or a transaction of several operations, a single affected-row count is one part of the larger invariant.']
    ],
    quick: ['The predicate and update belong in one SQL write.', 'Check affected rows.', 'Explain the isolation level and waiting behavior.'],
    variation: 'Two customers are trying to reserve two adjacent seats as an all-or-nothing group. Which part of the solution needs a transaction?',
    check: 'Demonstrate one successful conditional update and explain how the other detects the conflict.'
  },
  15: {
    sections: [
      ['Pessimistic and optimistic coordination',
        'A pessimistic strategy acquires a lock before working with a row. PostgreSQL SELECT FOR UPDATE can serialize competing modifications for the selected row while the transaction remains open. A consistent lock order becomes important when operations lock multiple rows, because circular waits can trigger deadlock detection.',
        'An optimistic strategy reads a version and checks it during an update. If another transaction advances the version, the affected-row count signals a stale attempt. The service can reload, retry within a bounded policy or return a conflict. A write may still acquire database locks internally. The application avoids holding an explicit read lock for the whole decision period.'],
      ['Compare under real test conditions',
        'Start with two sessions and a clear event timeline. Record where each transaction waits, aborts or succeeds. Try both a low-conflict workload and a hot-seat case. Compare impact on latency, wasted work and retry reliability.'],
      ['Choose a minimal primitive',
        'For a single state transition, a conditional update may be enough. For a multi-row validation, an explicit lock order or serializable transaction can be clearer. Handle retryable errors and respect the overall request deadline.']
    ],
    quick: ['Explicit row locks are held within a transaction.', 'Version checks detect stale decisions.', 'Bound retries and order multi-row locks consistently.'],
    variation: 'Your workload changes from rare conflicts to one heavily contested seat. How could the retry and tail-latency profile change?',
    check: 'Show a wait or version conflict and justify a strategy using contention and failure behavior.'
  },
  16: {
    sections: [
      ['Understand JPA state',
        'A persistence context tracks managed entity instances. Changing one can produce an SQL update when the context flushes. Flush sends pending SQL to the database, while transaction commit determines durability and visibility to other sessions. Detached instances and DTOs have different lifetimes. Keep lazy loading and fetch plans intentional so API serialization avoids extra queries.',
        'Entity relationships are object mappings over database foreign keys. Choose ownership and cardinality based on the schema and domain. A version field can surface an optimistic conflict. A direct SQL update can bypass an already-loaded entity in the context, which may need refresh or separation.'],
      ['Test the real database contract',
        'Use a PostgreSQL-backed integration test for locking and affected-row semantics. In-memory database substitutes can diverge in transaction and query behavior. Verify the state after commits from independent transactions, and ensure cleanup is deterministic.'],
      ['Measure before assuming',
        'Count SQL statements for a seat listing and compare a naive lazy traversal with a targeted fetch or projection. The best fetch design depends on access shape and payload size.']
    ],
    quick: ['Managed state lives in a persistence context.', 'Flush and commit serve different purposes.', 'Use the actual database for concurrency tests.'],
    variation: 'A list endpoint suddenly issues one query for each booking owner. How would you verify the cause and select a fetch strategy?',
    check: 'Run a real database integration test and explain one measured query or transaction behavior.'
  }
};
