// A topic gets its own teaching material only when each item is written for that topic.
export const topicLessons = {
  'j-oop-01': {
    notes: [
      'A class defines fields and operations. An object owns a particular set of field values. Construct Seat A1 and A2 separately so that choosing an owner for A1 leaves A2 available. The constructor initializes the identity before callers can use the object. Mark the id final, allow the owner to change through the booking operation and use private fields to limit the points where state can change.',
      'In Seat(String id), id names the constructor parameter and this.id names the current object’s field. Validate the parameter first, then assign the field. Because Seat declares this parameterized constructor, Java supplies no implicit no-argument constructor. A type with a valid default can explicitly delegate from a no-argument constructor to the parameterized path using this(...). Both paths can then share validation.',
      'A copy constructor is an ordinary constructor accepting an instance of the same type. Assignment of a reference copies that reference. Copying a value object can create an independent value, with deliberate handling of mutable members. For a booking entity, creating another mutable copy with the same seat identity would put ownership in two places. Use a read-only view for queries and keep one authoritative Seat for writes.',
      'BookingService owns the request boundary. It resolves the only valid seat ID before asking the Seat to claim itself. Seat validates the customer ID before checking ownership, so its invariant also holds for a direct call. A1 initially has no owner. U1 gets true. U2 and a repeated U1 request get false under this lesson’s contract. The original owner stays U1 for all failed attempts, including those rejected as invalid input.'
    ],
    takeaways: ['Create independent objects for independent state.', 'Construct valid instances with one validation path.', 'Distinguish an entity’s source of truth from a read-only view.', 'Verify both the result and the resulting state.'],
    practice: ['Copy the standalone ClaimTrace from Day 1 Learn into ClaimTrace.java and run java ClaimTrace.java. Within the same file, construct an A2 booking service and check that booking A1 does not change A2. Try constructing a seat from a blank ID.', [
      'The supplied program prints first=true, second=false, owner=U1 and exits successfully.',
      'Unknown seat, whitespace-only user and null user are rejected while U1 remains the owner.',
      'A2 starts unowned after the A1 claim. A blank seat ID fails during construction.',
      'Explain how this.id differs from id and why a Seat copy with the same ID would create conflicting authority.'
    ]],
    interview: [
      ['Why does Seat require an ID in its constructor?', 'An ID is required for a valid Seat. Constructor validation enforces that rule at creation and a final field keeps the identity stable.'],
      ['When does Java supply a default constructor?', 'It supplies an implicit no-argument default constructor when the class declares none. Once Seat(String id) is declared, a no-argument overload would need its own declaration.'],
      ['What would break if every service could set the owner directly?', 'A caller could overwrite an existing owner without checking the booking rule. A guarded transition preserves the rule and makes the permitted updates easy to locate.'],
      ['What should a query return if callers need a point-in-time copy?', 'Return a read-only value representing the seat ID and observed owner. Keep the original Seat as the write authority and document that the observed value can become stale.']
    ],
    check: ['Seat declares only Seat(String id). What happens if a caller uses new Seat()?', ['Java passes null implicitly.', 'The call fails to compile.', 'Java creates a valid seat with an empty ID.'], 1, 'Java only generates an implicit default constructor when the class declares no constructors.'],
    references: [
      ['Dev.java · Creating classes and constructors', 'https://dev.java/learn/language/oop/classes-objects/creating-classes/'],
      ['JLS 21 · Default constructor', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.9']
    ]
  },
  'j-equality-01': {
    notes: [
      'Reference identity asks whether two references point to the same instance. Value equality expresses an application rule. Two independently parsed seat IDs both denoting A1 should retrieve the same mapping. Define that rule in equals, and derive hashCode from the same fields. A hash map can use the hash to narrow where it looks and then use equality to distinguish candidates.',
      'Equal objects must have equal hash codes. Unequal objects may collide. Store two unequal keys with the same hash and confirm that both still retrieve their own values. If an equality field changes after insertion, the table can search a different bucket. Keeping the key immutable prevents that failure and makes an independently constructed equivalent key safe to use.',
      'Object equality and sorted ordering are separate contracts. A sorted map can treat two keys as one when their comparison returns zero. Decide whether your ordering and equality represent the same identity. If a display can ignore case but the backing IDs are case-sensitive, use a display comparator without discarding one of the underlying keys.'
    ],
    takeaways: ['Equal keys must have equal hashes.', 'A collision does not imply equality.', 'Use immutable fields for key identity and test independently allocated keys.'],
    practice: ['Define an immutable SeatId and test its behavior as a key in HashMap.', ['A separately constructed equal key retrieves the stored value.', 'Two unequal keys with forced collisions remain distinguishable.']],
    interview: [
      ['Why does HashMap need both equals and hashCode?', 'The hash narrows the search. Equality decides which candidate is the key. Equal keys must hash equally and unequal keys may still collide.'],
      ['Why can mutating a key break a successful lookup?', 'If its equality fields change, the new hash or comparison can no longer locate the entry placed using the old identity. Store changing fields in the value.'],
      ['How would you test a case-insensitive SeatId?', 'Normalize through one rule at construction. Insert A1 and retrieve with a separately created a1, check equal hashes, then use unequal IDs with the same hash to prove the distinction.']
    ],
    check: ['Two different keys have the same hash. Can a HashMap hold both?', ['Yes, when equals distinguishes them.', 'Only when their values are identical.', 'No, the second must overwrite the first.'], 0, 'Hash collisions are allowed. Equality determines whether a found key is the same key.'],
    references: [['Dev.java · Choosing map keys', 'https://dev.java/learn/api/collections-and-streams/collections-framework/choosing-keys/']]
  },
  'j-collections-01': {
    notes: [
      'Choose a collection by the operations and guarantees the caller needs. HashMap suits lookup by a stable ID when iteration order can vary. LinkedHashMap preserves insertion order by default and can maintain access order for an LRU design. TreeMap orders keys and supports range queries. A set models membership when each ID has no associated value.',
      'OpenJDK 21 HashMap spreads the original hash into the lower bits with h ^ (h >>> 16), then uses (capacity - 1) & spreadHash to select a bucket in a power-of-two table. The strings Aa and BB both hash to 2112 and map to bucket 0 at capacity 16. Walk the candidates in that bucket and use equals to tell the keys apart. Both entries remain retrievable.',
      'A default map allocates its first table on insertion. With capacity 16 and a load factor of 0.75, the threshold is 12. Adding a thirteenth distinct entry grows the table under ordinary distribution. A resize can split an old bucket using one newly significant hash bit, so its entries either remain at index i or move to i plus the old capacity. A collision-heavy bucket can prompt earlier growth. At sufficient capacity the implementation can represent a crowded bucket as a tree. These details belong to the implementation and vary across insertion paths.',
      'The API describes expected constant time for ordinary get and put with well-distributed hashes. Tree bins help with collision-heavy inputs, and equally hashed non-comparable keys can still lead to broader searches. HashMap allows a null key and null values. Use containsKey when you need to distinguish a missing entry from a stored null. Updates by competing threads require a matching synchronization policy or a concurrent collection.',
      'When a key changes in a field used by hashCode or equals, future lookups can miss a mapping that still contributes to size. For internal booking IDs use an immutable value type, and put mutable booking state in the value. For read-heavy caches measure hits, misses and latency separately. Use a reproducible workload before attributing slow lookups to collisions.'
    ],
    takeaways: [
      'Pick a map by lookup, ordering, range and concurrency requirements.',
      'The hash selects candidates. Key equality identifies the entry.',
      'Keep key identity stable. Put mutable booking state in the value.',
      'Treat growth and tree bins as OpenJDK implementation details.',
      'Use containsKey to distinguish a missing key from a stored null.'
    ],
    practice: ['Spend 20 minutes running HashIndex.java and BrokenKey.java from the reading links with Java 21 source-file mode. Predict the results first, then change the capacity to 32 in HashIndex and explain which bucket indices can change. Next store a null value and compare get and containsKey for that key and an absent one.', [
      'Aa and BB report the same hash and bucket. Their independent lookups return 1 and 2.',
      'The record key looks up the stored value A. The mutated list key trial keeps size 1 and lookup returns null in the supplied Java 21 example.',
      'Explain the low-bit mask at capacities 16 and 32. A present null value and an absent key both return null from get, while containsKey distinguishes them.',
      'State one case for LinkedHashMap and one case for TreeMap.'
    ]],
    interview: [
      ['How does HashMap retrieve Aa and BB correctly when their hashes match?', 'The stored hash narrows the candidates. equals distinguishes the keys inside the bucket, so distinct keys retain distinct values.'],
      ['How does the current OpenJDK implementation redistribute entries when the table doubles?', 'It inspects one higher address bit in the spread hash. Entries remain at the old index when that bit is zero and move by the old capacity when it is one.'],
      ['What happens when a list used as a key gains another element?', 'Its hash or equality can change. Lookup using the modified key may miss the original entry, which still occupies the table. Use an immutable key or a defensive copy.'],
      ['When would you replace this map with LinkedHashMap, TreeMap or ConcurrentHashMap?', 'Choose LinkedHashMap for stable insertion or access order, TreeMap for sorted ranges, and ConcurrentHashMap for shared concurrent lookups and atomic updates per key, with a different null policy.'],
      ['Can you promise logarithmic lookup for every collision-heavy key in a tree bin?', 'The implementation can search broadly when hashes match and keys provide no usable comparable order. Discuss hash quality and key behavior before promising a bound.']
    ],
    check: ['The map contains an ID whose stored value is null. Which operation can distinguish it from an absent ID?', ['get', 'containsKey', 'hashCode'], 1, 'get can return null in either case. containsKey checks membership directly.'],
    references: [
      ['Java 21 API · HashMap', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html'],
      ['OpenJDK 21 · HashMap implementation', 'https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/HashMap.java'],
      ['Java lab · HashIndex.java', 'https://github.com/Rishabh10045/ai-learning-platform/blob/109a37d8c0b049b26a1ffbd2088f31bf6c0cd14e/collab/qa/content-standard/HashIndex.java'],
      ['Java lab · BrokenKey.java', 'https://github.com/Rishabh10045/ai-learning-platform/blob/109a37d8c0b049b26a1ffbd2088f31bf6c0cd14e/collab/qa/content-standard/BrokenKey.java']
    ]
  },
  'j-strings-01': {
    notes: [
      'A String is an immutable sequence of UTF-16 code units. Operations such as strip and toUpperCase return a String result and leave the original value intact. Reassigning a variable changes which object the variable refers to. In a booking request, keep the business rule for case and whitespace explicit. A distinct copy of A1 should find the same exact-match seat ID.',
      'String.equals compares contents, while reference equality with == checks whether two operands refer to the same object. Java interns string literals and constant-expression Strings. In the Java 21 example, both the literal "A1" and the constant expression "A" + "1" refer to the pooled value. An explicit new String("A") plus "1" produces a runtime String equal in content and distinct in identity. Use equals or Objects.equals for business comparisons. Use intern only when canonical identity is a deliberate design choice with measured benefit.',
      'Java assigns built-in meaning to operators. Plus adds numeric operands and concatenates when an operand is a String. Evaluation groups left to right, so 1 + 2 + " seats" produces "3 seats" and "Seats " + 1 + 2 produces "Seats 12". Java method overloads use different parameter lists and have a separate mechanism. Java provides no user-defined operator overloading.',
      'When assembling one result across many iterations, an unshared StringBuilder allows append operations followed by one toString call. A String produced by toString retains its contents if the builder is later changed. StringBuffer synchronizes methods, and a sequence of calls can still require external coordination. Use simple concatenation for short expressions and choose a builder for a growing result when profiling or clear loop structure justifies it.'
    ],
    takeaways: ['Use value equality for identifiers.', 'String immutability stays true when a variable is reassigned.', 'Folded constant expressions and runtime concatenation have different identity guarantees.', 'Use an unshared builder for deliberate incremental construction.'],
    practice: ['Run the displayed SeatIdStrings.java example in Day 5 Learn with Java 21. Predict its output first. Then replace the run-time part with another literal, add an empty builder, and explain the changed identity and value comparisons.', [
      'Distinct references containing A1 compare equal and retrieve the same HashMap entry.',
      'A strip operation returns A1 and preserves the original padded String.',
      'The builder produces A1,A2. Appending A3 keeps the first String unchanged. An empty builder produces the empty String.',
      'The two plus expressions produce 3 seats and Seats 12. Explain the left-to-right grouping.'
    ]],
    interview: [
      ['Why can two Strings display A1 even when == is false?', 'The operator compares the two references. Each can refer to a different object holding the same characters. String.equals compares character contents.'],
      ['How do a literal, a constant-expression concatenation and a runtime concatenation differ?', 'The first two are interned and use the same canonical String if equal. A nonconstant concatenation produces a new String even when its contents match the literal.'],
      ['What changes after storing the result of input.strip() in the same variable?', 'The reference can change. The original String contents stay unchanged, and any other variable holding that reference still sees them.'],
      ['When would you use StringBuilder for booking labels?', 'Use an unshared builder when looping through labels to construct a growing result, then call toString once at the boundary. For a short fixed expression, ordinary concatenation is clear.'],
      ['Does StringBuffer make a read-then-append sequence atomic?', 'Its individual calls can synchronize. A compound sequence still needs coordination outside the buffer or an owner that keeps the buffer local.']
    ],
    check: ['A database returns a runtime String containing A1. Which comparison expresses the booking rule?', ['value == "A1"', '"A1".equals(value)', 'value.hashCode() == "A1".hashCode()'], 1, 'String.equals checks the identifier contents. Reference identity is narrower and different values can share a hash.'],
    references: [
      ['Java 21 API · String', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html'],
      ['JLS 21 · String literals and interning', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.5'],
      ['JLS 21 · String concatenation', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.1'],
      ['Java 21 API · StringBuffer', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html']
    ]
  },
  'j-streams-01': {
    notes: [
      'A stream pipeline separates an input, intermediate operations and a terminal operation. On an ordered list of seats, filter can keep open seats and map can extract their IDs. These intermediate steps describe work. Traversal starts when a terminal operation asks for a result. With findFirst, the pipeline can stop after the first match in encounter order.',
      'Trace [A1 closed, A2 open, A3 open]. Filtering passes A2 and A3. With findFirst, A3 need not be examined once A2 is found in a sequential traversal. With toList, both eligible IDs are needed. The output list returned by Stream.toList is unmodifiable, and mutable elements referenced by it can still change.',
      'Use pure predicates and transformations so tests can reason about the result rather than callback side effects. A terminal operation is allowed to avoid work that cannot affect its result. For example, count may use the size already known for a list-backed stream instead of running a mapping callback. Choose a conventional loop when the operation depends on ordered state changes.'
    ],
    takeaways: ['Terminal demand drives intermediate work.', 'findFirst and toList have different stopping conditions.', 'Keep observable state changes outside a projection pipeline.'],
    practice: ['Implement a loop and a stream for finding the first open seat.', ['Both return A2 for [A1 closed, A2 open, A3 open].', 'Both return an empty result on an empty input or when all seats are closed.']],
    interview: [
      ['What does laziness buy in a filtered findFirst pipeline?', 'Intermediate work happens as a result is demanded. A sequential pipeline can stop at its first matching item.'],
      ['Why is map a poor place for logging that must happen for every element?', 'Stream implementations can short-circuit or elide operations where their side effects are irrelevant to the result. An explicit traversal or terminal operation gives a clearer contract.'],
      ['What changes when you replace findFirst with toList?', 'The result changes from a possible first match to all matching IDs. Traversal usually must consider the entire input and the collected list needs memory proportional to the output.']
    ],
    check: ['Which operation asks an ordered pipeline to produce its first matching value?', ['filter', 'map', 'findFirst'], 2, 'filter and map are intermediate operations. findFirst is a short-circuiting terminal operation.'],
    references: [['Dev.java · Stream API', 'https://dev.java/learn/api/collections-and-streams/streams/']]
  },
  'j-concurrency-02': {
    notes: [
      'Visibility asks whether a thread can observe a write made by another thread. Atomicity asks whether competing threads can interleave inside a sequence of actions. A volatile holder can make an individual write visible. Both workers can still read an empty holder before either writes, so volatile alone leaves a check-then-act race.',
      'Guard the read of the holder, the decision and the assignment with the same monitor. In the intended trace the first thread enters, reads empty, writes U1 and unlocks. The second thread then locks and sees U1. The unlock happens-before a later lock on that monitor. A barrier for starting the workers belongs outside this guarded sequence so one worker never waits for the other to enter an already occupied critical section.',
      'The monitor protects cooperating threads using that object in the same JVM. Independent JVMs can each see their own empty local copy. When the invariant applies across processes, put it in a shared authoritative write, such as a database update guarded by an availability predicate.'
    ],
    takeaways: ['One shared monitor must protect the full check and write.', 'Happens-before explains visibility across matching monitor operations.', 'Independent JVMs need a shared authority for cross-process invariants.'],
    practice: ['Run a two-thread claim fixture using a shared seat and a start latch.', ['Exactly one result is true and the final owner matches the winner.', 'A deliberately unguarded control shows why separate reads and writes are unsafe.']],
    interview: [
      ['Why can a volatile owner still allow two successful claims?', 'Reads and writes may be individually ordered, but both threads can observe empty before either assignment. The multi-step operation lacks atomicity.'],
      ['What synchronization event orders the critical sections?', 'An unlock on a monitor happens-before a subsequent lock of that same monitor. The read and write must take part in that protocol.'],
      ['What changes when your application runs in two JVMs?', 'Java monitor identity stays inside one process. Apply the guard in a shared authority and test two original writers.'],
      ['Where should the test’s start barrier live?', 'Before entering the same exclusive lock. A barrier inside it can wait forever for a worker which cannot enter.']
    ],
    check: ['Both threads read empty before either writes a volatile owner. What can happen?', ['Both can report success.', 'Volatile guarantees exactly one winner.', 'Java refuses the second read.'], 0, 'Visibility of one field does not make the check and write one atomic action.'],
    references: [['Java Language Specification · Happens-before order', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5']]
  },
  'b-transactions-01': {
    notes: [
      'A transaction groups statements into one unit. Committing keeps the unit’s changes and rolling back discards them. In JDBC the statements must share the same connection with auto-commit disabled for this exercise. If a booking update is committed before an audit insert, failure in the insert cannot roll back the booking that already committed.',
      'Atomicity and isolation answer different questions. In PostgreSQL Read Committed, ordinary statements see committed data as of the beginning of each statement. In Repeatable Read, the transaction keeps the snapshot established by its first relevant statement. A second query in the same transaction can still read the older owner even after a different connection commits a new value.',
      'A serialization failure asks the caller to reconsider the whole transaction, including reads used to make decisions. Retry by opening a fresh transaction under a bounded policy. Verify durable results from an independent connection. A result read on the same connection may see that transaction’s own uncommitted work.'
    ],
    takeaways: ['Group dependent writes on one connection.', 'Snapshot visibility depends on isolation and when a read starts.', 'Retry a failed serializable transaction from its decision reads.'],
    practice: ['Compare two PostgreSQL connections. Read A1 on B, update and commit A, then read again on B.', ['At Read Committed, a new B statement sees the new value.', 'At Repeatable Read, an established B snapshot sees the old value.', 'Rolling back a separate trial leaves the committed state unchanged.']],
    interview: [
      ['Why is a JDBC transaction scoped to a connection?', 'The database session holds the transaction state and applies commit or rollback to the statements executed in that unit. A separate connection owns a separate unit.'],
      ['How do you prove which snapshot a query saw?', 'Coordinate two connections, record read and commit order, fix the isolation level, and compare the second read in the same transaction with the first read in a new transaction.'],
      ['How do you retry a serialization failure safely?', 'Roll back the failed transaction, start a fresh one, recreate all decision inputs and enforce a retry limit.']
    ],
    check: ['B reads A1 under PostgreSQL Repeatable Read. A then commits a new owner. What can B read again before ending its transaction?', ['The owner from its first snapshot.', 'The new owner in every case.', 'An uncommitted owner from another session.'], 0, 'PostgreSQL Repeatable Read retains the established transaction snapshot for ordinary reads.'],
    references: [['PostgreSQL · Transaction isolation', 'https://www.postgresql.org/docs/current/transaction-iso.html']]
  },
  'b-validation-01': {
    notes: [
      'Validation at the Spring MVC boundary rejects input that cannot be used as a command. Malformed JSON fails during request decoding. A well-formed JSON object can still fail DTO validation, for example if a required seat ID is blank. These are different paths and can share HTTP 400 with different stable public error codes.',
      'A syntactically valid request can reach the application and fail for a business reason. In this booking API a nonexistent seat yields 404 and a valid claim on an occupied seat yields 409. The application must always protect ownership. An internal importer can bypass MVC, which is why checking caller authority and essential business preconditions only in annotations leaves an uncovered path.',
      'Protect error details. Return enough structured information for clients to choose a repair, and omit stack traces and internal storage information. Record an authorization decision before disclosing existence if the product uses that security policy. In the test, check the response status and error code as well as the final ownership state.'
    ],
    takeaways: ['Decoding, request validation and domain checks have different responsibilities.', 'Document stable client error codes.', 'Verify the protected state stays unchanged after a rejected request.'],
    practice: ['Exercise request decoding and DTO validation, then call the booking service directly with invalid input.', ['Malformed JSON and blank IDs map to 400 with distinct documented codes.', 'Unknown and occupied seats map to the documented 404 and 409 with no unintended state change.']],
    interview: [
      ['What can @Valid protect?', 'It validates the request object at the configured entry point. It does not cover callers that bypass MVC or replace checks inside the domain’s authoritative operation.'],
      ['When can a request produce 409?', 'When it is valid but conflicts with current resource state, such as another owner already taking the seat.'],
      ['How do you confirm malformed input did no damage?', 'Exercise the real endpoint and also check the persisted owner, with a direct-service fixture for use cases which bypass HTTP.']
    ],
    check: ['A valid booking request targets a known occupied seat. Which status fits this API?', ['400 malformed request', '409 conflict', '201 created'], 1, 'The request can be decoded and validated. The protected write fails because the seat is already owned.'],
    references: [['Spring Framework · MVC validation', 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html']]
  },
  'l-uml-01': {
    notes: [
      'A class diagram describes the static design. For the booking example it can show that BookingService uses a SeatRepository and Seat protects its transition. Names, responsibilities and cardinalities should trace back to a requirement. Include a relationship only when it explains an ownership rule or dependency in the task.',
      'A sequence diagram describes one execution. Draw the caller, service, repository and Seat as participants. The service looks up the seat and asks it to claim itself. Show an alternate branch for an occupied seat and the return to the caller. A class diagram tells you which objects can collaborate. The sequence explains when they do and what happens on the failure path.',
      'Compare the diagrams against the actual method and test. If a controller invokes a generic owner setter in the diagram, the design allows a path that bypasses the invariant. Move the transition into the owner of the rule, then redraw the sequence and test that a rejected request leaves the original owner in place.'
    ],
    takeaways: ['Use class diagrams for responsibilities and relationships.', 'Use sequence diagrams for calls, order and branches.', 'Trace the diagrams back to code and an invariant test.'],
    practice: ['Draw a class and sequence view for the same two booking outcomes.', ['Both diagrams agree on the object that protects ownership.', 'Show the alternate conflict path and one test that checks the final owner.']],
    interview: [
      ['What does a sequence diagram reveal that a class diagram does not?', 'Its timeline shows who calls whom, ordering and result branches. The class view describes relationships and static responsibilities.'],
      ['How would you extend the diagram for cancellation?', 'Add an explicit cancel interaction with caller authorization and an alternate branch for a mismatch, while the domain transition remains protected.'],
      ['What code evidence would support the UML?', 'A small test of the actual booking and conflict path that asserts the return value and final owner.']
    ],
    references: [['LLD roadmap · UML and sequence examples', 'https://rishabh10045.github.io/studyapp/lld/roadmap.html']]
  },
  'h-scaling-01': {
    notes: [
      'Scale vertically by giving one instance more capacity. This can be a quick upgrade when the service saturates CPU or memory and the hardware limit and restart cost are acceptable. Scale horizontally by adding instances and routing traffic over healthy targets. This can improve availability as well as throughput, while making routing, coordination and deployment more complex. Start from the saturated resource and a measurable latency or availability objective.',
      'Suppose an application sustains 80 requests per second per instance at the agreed p95 latency, and the database sustains 120 requests per second for the same mix. One instance can handle up to 80 under these assumptions. Two app instances give a 160 RPS app ceiling and still cap the system at 120. Adding a third app instance leaves the same ceiling until the dependency changes. Include the cost of each replica and verify the real curve with measurements.',
      'Round robin routes successive requests around ready targets. Least connections can favor a target with fewer active connections when connection counts track work. IP hashing can route one source consistently, and shared proxies can skew it. Sticky routing that keeps a session in an app process can lose that session when the process fails or is replaced. Store necessary session state in a shared store or use a verified token for the appropriate state, and keep booking ownership in the authoritative database.',
      'Autoscaling needs a signal, target range, upper and lower bounds, and time for new instances to become ready. A growing queue with saturated workers can justify adding capacity. A growing queue caused by a saturated database needs a dependency fix or load control, since more workers can add contention. Deploying across regions adds latency and consistency decisions for the shared write path. Treat those decisions separately from adding replicas inside one region.'
    ],
    takeaways: ['Measure saturation at the app and its dependencies.', 'Adding replicas improves the capacity of the layer you replicate.', 'Verify an identical outcome when requests reach different healthy targets.', 'Choose scaling signals and wait for readiness before shifting traffic.'],
    practice: ['Spend 15 minutes in the Day 17 Learn block working the capacity trace, then use the existing hands-on assignment to route requests to two processes and observe a shared database. Repeat after removing one ready app process.', [
      'State the 80 RPS app limit with one process and the 120 RPS dependency limit with two, showing units and assumptions.',
      'Identify one useful vertical upgrade and one scenario where healthy horizontal replicas improve availability.',
      'A request to the remaining process observes the authoritative owner after the other process is removed. Competing attempts still leave one owner.',
      'Explain when routing affinity would hide a process-local session dependency and how to verify failover without it.'
    ]],
    interview: [
      ['What are the vertical and horizontal scaling choices for an overloaded application?', 'A vertical change increases resources on one process or host. A horizontal change uses more instances and routes work across them. The saturated layer, restart risk, availability need and measured cost determine the choice.'],
      ['Why does adding a third app node fail to increase this example’s throughput?', 'Two nodes already offer 160 RPS of app capacity while the dependency caps the same workload at 120 RPS. Use dependency metrics and a fixed traffic mix to verify that boundary.'],
      ['What problem can sticky routing hide?', 'An app may store essential session state in one process. Affinity makes that appear to work until failover, process replacement or imbalance. Route the same workflow across different instances to expose it.'],
      ['What should be checked before scaling on queue depth?', 'Check whether app workers or a downstream dependency are saturated, set replica limits, and measure how long new instances take to become healthy. The useful action depends on the causing layer.']
    ],
    check: ['Two app processes can serve 80 RPS each. The shared database supports 120 RPS for the same workload. What is the system ceiling in the example?', ['80 RPS', '120 RPS', '160 RPS'], 1, 'The application ceiling is 160 RPS and the dependency ceiling is 120 RPS. The smaller capacity limits this workload.'],
    references: [
      ['GeeksforGeeks · System Design Training, Module 2', 'https://www.geeksforgeeks.org/courses/system-design-training-program'],
      ['Kubernetes · Horizontal Pod Autoscaling', 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/']
    ]
  },
  'h-estimates-01': {
    notes: [
      'Start a capacity estimate with a time window and workload units. For example, 12,000 visitors over a ten-minute wave is 20 visitors per second on average in that wave. At five seat-map requests per visitor, that is 100 read requests per second. At ten percent booking conversion there are about two write attempts per second. Report the assumptions so another person can change one and recalculate.',
      'The average inside the wave is still an average. A threefold peak gives 300 reads/s. If a single event receives 80 percent of those reads, its key receives around 240 reads/s. A steady 95 percent cache hit rate would send around 12 reads/s for the hot event to the origin, assuming one fetch per miss. A cold-cache surge or slow fill can produce a different result.',
      'Translate a quantity into a decision you can test. Read origin load suggests a cache refill and admission policy. Concurrent claims on one seat point to coordination and lock-wait behavior at the authoritative write. Measure traffic shape, cache hit rate and tail latency to check your assumptions.'
    ],
    takeaways: ['State units and the time window.', 'Estimate average, peak and hot-key load separately.', 'Connect a number to a tested design decision.'],
    practice: ['Recompute peak origin load at hit rates of 95 and 80 percent for the hot event.', ['At 240 reads/s the two estimates are 12 and 48 origin reads/s respectively.', 'Name a measurable symptom a cold-cache burst would change.']],
    interview: [
      ['How do you justify your first scale decision?', 'Compute the relevant workload and hot key from stated assumptions, name the bottleneck and propose a measurement to test it.'],
      ['Why can aggregate traffic hide overload?', 'Load can concentrate on one database row, cache key or partition. Per-key arrival and queueing can saturate before the aggregate does.'],
      ['What changes if the cache is cold?', 'The steady hit assumption fails. Misses can coalesce or amplify. Bound origin work and measure actual fill and connection wait.']
    ],
    check: ['A hot event gets 240 reads/s and has a 95% hit rate. With one origin fetch per miss, what is its steady origin rate?', ['12 reads/s', '24 reads/s', '228 reads/s'], 0, 'The miss rate is 5%. Multiplying 240 by 0.05 yields 12 reads per second.'],
    references: [['GFG · System Design syllabus, scaling foundations', 'https://media.geeksforgeeks.org/courses/syllabus/973f73599e070cabefcf71cd54e1ff1f.pdf#page=4']]
  },
  'd-union-find-01': {
    notes: [
      'Union-Find, or disjoint-set union, represents a partition into connected components. Each element starts as a root. find walks parents until it reaches a root. union searches for both representatives and links them only when they differ. The number of components decreases exactly once per successful union.',
      'Trace four independent vertices. Union(0,1) leaves three components. Union(1,2) leaves two. Union(0,2) changes nothing because a path already connects those vertices. Vertex 3 remains isolated. Query find each time because representatives may change after a merge.',
      'Attach the smaller component root to the larger root, storing meaningful size only at roots. Path compression shortens future lookups. Together they yield amortized inverse-Ackermann cost per operation after initialization. This structure tracks additions well. A deletion may split one component and requires more information than the stored representatives provide. Use the Day 55 Java example to see how Kruskal consumes the union result.'
    ],
    takeaways: ['A component’s representative can change.', 'Skip merges of matching roots.', 'Separate dynamic connectivity from edge deletion and shortest paths.'],
    practice: ['Run the Day 55 Java example and test the UnionFind component counter separately.', ['After 0–1 and 1–2, exactly two components remain among four vertices.', 'A redundant 0–2 union returns false and keeps the count unchanged.']],
    interview: [
      ['What invariant does the parent array maintain?', 'Every vertex follows a chain to a representative root, and two vertices are in the same set exactly when their current roots are equal.'],
      ['Why combine union by size and path compression?', 'Linking by size controls new depth. Finding a root shortens existing paths. Together they make repeated operations cheap under the amortized bound.'],
      ['Why does ordinary Union-Find struggle with edge deletion?', 'Its parent links represent set membership and may not correspond to original graph edges. It cannot tell whether removing an original edge splits the set.'],
      ['How does the union result support Kruskal?', 'A successful union adds connectivity without a cycle, so the sorted edge can be accepted. A redundant union signals an existing path.']
    ],
    check: ['With four vertices, union(0,1), union(1,2) and union(0,2) run in that order. How many components remain?', ['1', '2', '3'], 1, 'The first two unions merge sets. The third endpoints already match, and vertex 3 remains separate.'],
    references: [['Princeton · Union-Find', 'https://algs4.cs.princeton.edu/15uf/']]
  },
  'ai-rag-01': {
    notes: [
      'A retrieval-augmented generation system looks up relevant reference passages at request time, gives the model a bounded context and then validates the result. For the booking help feature, a retriever should select current, authorized policy text and retain passage IDs. A policy answer can cite those IDs and explain a rule. The booking service itself still enforces ownership through its authoritative operation.',
      'Retrieval and grounding fail in different places. If the current 48-hour refund policy never appears in the selected context, diagnose candidate filtering, chunk boundaries and ranking. If the correct passage appears and the model says 24 hours, retrieval found evidence and the generated claim is unsupported. A valid JSON response that cites the correct passage can still contradict it.',
      'Test three outcomes with deterministic Java fixtures. A supported answer passes. A plausible claim that conflicts with the supplied text falls back after validation. A question with no authorized evidence also falls back. Keep separate counts for retrieval misses, unsupported claims and correct abstentions so that a misleading aggregate score does not hide what needs repair.'
    ],
    takeaways: ['Keep retrieval, generation and validation observable as separate stages.', 'Citation membership alone does not establish claim support.', 'Return the defined fallback when approved evidence is missing or insufficient.'],
    practice: ['Build three Java evaluator fixtures using a versioned refund policy excerpt.', ['An answer that matches the authorized excerpt is accepted. A contradicting answer falls back even with the right citation.', 'No available evidence yields the documented fallback. Report the failure stage for each fixture.']],
    interview: [
      ['Which parts of a RAG pipeline can fail independently?', 'Retrieval can miss the required passage, generation can contradict a retrieved passage, and validation can accept an unsupported claim. Control one stage at a time in tests.'],
      ['How would you separate a retrieval miss from a model failure?', 'Give the model the known relevant passage directly and compare with normal retrieval. Inspect authorized top-k results separately from supported claims.'],
      ['What must a citation validator verify?', 'The cited passage belongs to the approved context, and its content actually supports the material claim. A stable ID alone is insufficient.'],
      ['What happens when the provider or evidence path fails?', 'The help feature returns a bounded deterministic fallback. Booking authority and domain transitions stay in the Java service and database.']
    ],
    check: ['The correct passage was retrieved and cited, but the answer contradicts it. Which result should be recorded?', ['Retrieval was a miss.', 'The candidate is supported because the source ID exists.', 'Retrieval succeeded but grounding or its validation failed.'], 2, 'The evidence was present. Compare the actual generated claim with that passage and measure grounding separately.'],
    references: [['Spring AI · Retrieval Augmented Generation', 'https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html']]
  }
};
