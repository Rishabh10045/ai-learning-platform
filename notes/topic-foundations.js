const classAccess = ['Dev.java · Controlling access to members', 'https://dev.java/learn/language/oop/classes-objects/more-on-classes/#controlling-access'];
const webFlow = ['MDN · Overview of HTTP', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview'];
const aiBasics = ['Microsoft · Introduction to Generative AI', 'https://github.com/microsoft/generative-ai-for-beginners/blob/main/01-introduction-to-genai/README.md'];
const setsApi = ['Java 21 · HashSet', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html'];
const javaThreads = ['Oracle · Thread interference', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/interfere.html'];
const javaHashMap = ['Java 21 · HashMap', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html'];
const javaExceptions = ['Dev.java · Exceptions', 'https://dev.java/learn/language/annotations-exceptions/exceptions/'];
const javaGenerics = ['Dev.java · Generics', 'https://dev.java/learn/generics/'];

export const foundationTopics = {
  'l-invariants-01': {
    notes: [
      'A domain invariant is a condition that must hold in every valid state, including after a request fails. A1 begins with no owner. Its first successful claim sets exactly one owner. A later conflict must preserve that owner. A boolean outcome and the final state test different parts of this rule.',
      'Teach the transition at the object that owns the state. Validate input before evaluating a legitimate conflict, then ask Seat to claim itself. A generic setOwner operation gives callers a way around the rule. Put a read method on the boundary when the caller needs to show the owner.',
      'A cancel feature expands the state model. Define which caller may cancel, what the new availability is, and what an already-cancelled request returns. Test that a rejected cancellation preserves the current owner. Keep this day’s fixture sequential. The later concurrency lesson adds coordination for overlapping requests.'
    ],
    practice: ['Use the Day 1 Java example to draw initial, success and conflict transitions. Add a cancellation proposal as a table before writing code.', ['The first valid claim records U1 and a later conflict preserves U1.', 'An invalid request and an unauthorized cancellation proposal each preserve the current owner.', 'State the authorized cancellation result separately from a repeated request.']],
    interview: [
      ['How do you know an unsuccessful booking preserved the invariant?', 'Assert the returned outcome and read the authoritative owner afterward. A false return alone cannot catch a method that mutated state before rejecting.'],
      ['Where would the rule live if the HTTP controller were removed?', 'It belongs in the domain owner or authoritative write, so other permitted entry points use the same rule.'],
      ['How would cancellation change the fixture?', 'Add a permitted transition from owned to available and a rejection path for a mismatched caller. Verify the final state in both cases.']
    ],
    takeaways: ['Write the rule as a state property.', 'Route each mutation through one domain operation.', 'Test failed paths against final state.'],
    check: ['U2 gets false for A1 after U1 booked it. Which extra check proves the conflict path?', ['The owner is still U1.', 'A1 has a printable label.', 'The caller used Java.'], 0, 'The owner check proves that the failed operation preserved the booked state.'],
    references: [classAccess]
  },
  'h-request-01': {
    notes: [
      'Trace an HTTPS request in layers. Resolve the domain name using DNS, establish or reuse a secure connection and send an HTTP request identifying the method, path and body. DNS gives the client an address. The method and path help the HTTP server select an application handler.',
      'For POST /bookings, the handler decodes and validates the submitted ID, then asks the booking service to attempt the write. The authoritative store decides whether A1 changes ownership. The server reports the result and the browser updates its display. A cached GET can lag behind a write.',
      'A timed-out browser sees an uncertain operation: the write may have committed before the response was lost. A well-scoped replay or a status query can resolve ambiguity. First draw the success and known-conflict paths. Then place a lost response after the commit and explain where the user can recover.'
    ],
    practice: ['Draw browser → DNS → HTTPS → router → booking service → store → response. Label one successful request and one conflict.', ['The diagram distinguishes DNS lookup from HTTP path routing.', 'It marks authoritative commit before the success response and separates a stale display from the current state.', 'It shows a client recovery step if the response is lost after commit.']],
    interview: [
      ['What does DNS decide compared with the HTTP router?', 'DNS resolves a hostname. The application router selects a handler using HTTP properties such as method and path.'],
      ['Why could the UI show A1 available while POST returns a conflict?', 'The UI’s availability was a snapshot. Another request might commit before the authoritative booking operation runs.'],
      ['What can a timeout after commit tell the client?', 'The client cannot deduce the write outcome from the missing response. It can retrieve the durable result or replay using a stable idempotency contract.']
    ],
    takeaways: ['Trace each layer’s responsibility.', 'Mark the authoritative write in the diagram.', 'Distinguish a stale read from an uncertain write.'],
    check: ['Which component decides whether A1 can be booked?', ['DNS resolver', 'Browser cache', 'Authoritative booking write'], 2, 'Ownership is enforced at the write boundary that has the current durable state.'],
    references: [webFlow]
  },
  'ai-foundations-01': {
    notes: [
      'Training changes model parameters from examples. Inference uses the parameters to process an input and produce output. A language model receives tokens and produces probabilities over possible continuations. A fluent output can still contain claims unsupported by the policy.',
      'In the booking application, the model can propose a plain-language explanation of a cancellation rule. Supply the actual policy text. Require a supported quote or evidence location before presenting a policy claim. When no rule applies or multiple rules conflict, give a deterministic fallback or ask for the missing information.',
      'A booking transition uses current state, identity and domain validation. Keep those decisions in the authoritative Java path. A timeout or ungrounded support answer can change the help response while the booking flow remains available. Verify a normal booking under a simulated model failure.'
    ],
    practice: ['Use three policy fixtures: a supported answer, an unsupported claim and an ambiguous case. For each, record input evidence and the application result.', ['Supported text quotes or identifies the applicable rule.', 'Unsupported and ambiguous claims return a fallback or ask a clarifying question.', 'An unavailable help feature leaves the deterministic booking rule intact.']],
    interview: [
      ['What is the difference between training and inference?', 'Training adjusts model parameters using data. Inference uses the trained parameters on the current input.'],
      ['Why can plausible text still fail a policy-help check?', 'Plausibility is a property of the generation, while evidence is a property of the applicable policy. A validator needs the latter before displaying the claim.'],
      ['What should happen to booking during a help-model failure?', 'Booking should continue through the independent enforcing path. The help endpoint applies its defined fallback.']
    ],
    takeaways: ['Separate training from serving.', 'Use evidence before surfacing a policy claim.', 'Keep model availability out of booking correctness.'],
    check: ['Which activity fits the Day 1 model boundary?', ['Changing a seat owner', 'Drafting a cancellation explanation checked against policy', 'Choosing whether to ignore validation'], 1, 'A policy draft can be verified against evidence. Booking still uses the deterministic write path.'],
    references: [aiBasics]
  },
  'd-hashing-01': {
    notes: [
      'To decide whether an ID repeats, maintain a set containing every ID seen in the completed prefix. Calling add returns false when an equivalent value already exists. At that point the prefix plus the current value contains a duplicate and the algorithm can stop.',
      'Trace [U1,U2,U1]. The first two calls add new keys. The third finds U1 already present. Empty and all-distinct inputs finish without an early return. Use exact String equality for case-sensitive IDs so U1 and u1 remain separate.',
      'For n bounded-length IDs, a HashSet offers expected O(n) time with suitable hashing and O(n) worst-case storage for the distinct prefix. The expected bound assumes distribution and treats key work separately. If a memory budget dominates, sorting can be a different choice when preserving order is unnecessary or you can copy the input.'
    ],
    practice: ['Implement containsDuplicate(List<String>) in the Day 1 DSA exercise and compare with a nested-loop oracle for small lists.', ['Empty, one-element and distinct lists return false.', '[U1,U2,U1] returns true and [U1,u1] returns false.', 'The learner explains the set prefix invariant and gives both expected time and memory.']],
    interview: [
      ['What invariant makes an unsuccessful Set.add evidence of a duplicate?', 'The set contains exactly the IDs from the already-scanned prefix. If add reports that the ID exists, some index in that prefix holds an equal value.'],
      ['What affects the expected linear bound?', 'Hash distribution plus the cost of comparing or hashing keys. The scan does at most n additions and can exit earlier.'],
      ['How could you find duplicates without a hash table?', 'Sort the values, then look for equal neighbors. This changes order or requires a copy, and comparison sorting typically uses O(n log n) comparisons.']
    ],
    takeaways: ['Keep the set equal to the processed prefix.', 'Use add’s return value for existence and insertion in one step.', 'Test case sensitivity and memory trade-offs.'],
    check: ['Why does [U1,u1] contain no duplicate under this contract?', ['Only the first ID is checked.', 'The comparison is case-sensitive.', 'HashSet never stores two strings.'], 1, 'The inputs have different contents under exact String equality.'],
    references: [setsApi]
  },
  'j-concurrency-01': {
    notes: [
      'Check-then-act is a sequence. A thread reads that A1 is free, decides to claim it and writes the owner. Two threads can independently read the same old value before either writes. Both then think they won. The final owner alone can hide one incorrectly reported success.',
      'Use a shared Seat object, a latch that records when each thread has read, and a separate release latch before the writes. The main thread waits for both reads, releases them, then waits for results. Bound the waits and make cleanup release the worker threads if an assertion fails.',
      'Capture the two return values and the final owner. A protected version must make the read, decision and write one guarded transition. Use a start barrier outside the protected operation for the corrected version. Putting a rendezvous inside the same exclusive lock can block the second worker from ever reaching it.'
    ],
    practice: ['Run the Day 2 race with two workers and controlled read/write latches. Record both local reads and final outcomes.', ['Both workers see unowned before the write phase in the broken fixture.', 'Both can report success with one final owner.', 'All waits have a timeout and the test joins or shuts down workers.']],
    interview: [
      ['Why can an atomic reference assignment still give two successes?', 'A single write can be atomic while separate read, decision and write steps interleave. The entire transition needs one coordination rule.'],
      ['Why use latches instead of sleeps?', 'Latches control the ordering explicitly. Sleeps depend on scheduler timing and can pass without exercising the problematic interleaving.'],
      ['What evidence distinguishes the race from an ordinary conflict?', 'The race shows two success results based on the same prior state. The correct sequential conflict shows one success, one rejection and a preserved owner.']
    ],
    takeaways: ['Test the sequence, not only one write.', 'Control the interleaving with a bounded fixture.', 'Record each result and the final authority.'],
    check: ['Both workers read empty before either writes. What violates the booking rule?', ['One reports success and one conflicts.', 'Both report success.', 'Both calls finish in the same second.'], 1, 'Only one successful transition is allowed for an initially free seat.'],
    references: [javaThreads]
  },
  'd-hashing-02': {
    notes: [
      'A hash table uses a hash to select candidates and equality to decide whether a key matches. A collision happens when distinct keys have the same hash or map to the same bucket. A correct table keeps both entries and compares the candidate’s equality.',
      'In Java, "Aa" and "BB" share a String hash code. Inserting both with different values and looking up each proves collision handling. Repeating an equal key should update the mapping and preserve size. That is a different test from inserting an unequal key with the same hash.',
      'Good distribution keeps average bucket work small. A bad hash source can concentrate work, and the Java implementation can use different internal representations for crowded buckets. Report expected lookup under measured assumptions and use the actual input distribution before promising a bound.'
    ],
    practice: ['Run the Day 4 HashIndex lab and add a repeat-key update along with the two collision keys.', ['Aa and BB both retrieve their independent values.', 'Overwriting Aa changes its value and preserves map size.', 'The explanation separates equal keys from unequal hash collisions.']],
    interview: [
      ['How does a HashMap handle two unequal keys with the same hash?', 'It uses the hash to narrow lookup and equality to distinguish entries associated with the same hash.'],
      ['What should a second put with the same key do?', 'It updates that key’s mapping according to the Map contract. It does not add a new key.'],
      ['Why do equal hash codes not establish equality?', 'The mapping compresses many possible values into a finite number of hashes. Different values can collide.']
    ],
    takeaways: ['A bucket narrows the search.', 'Equal keys update one mapping.', 'A collision test needs unequal keys with the same hash.'],
    check: ['Aa and BB have the same hash and are unequal. What does inserting both do?', ['Keeps both mappings.', 'Overwrites Aa.', 'Always throws.'], 0, 'The table distinguishes keys using equality even when hashes match.'],
    references: [javaHashMap]
  },
  'j-oop-02': {
    notes: [
      'An interface lets a caller depend on a behavior contract. A SeatRepository lookup can specify what a missing ID returns and which errors are propagated. A fake and a database implementation can share that contract despite different internal state. Test substitutions using the same contract cases.',
      'Use an abstract class when related implementations share a real invariant or behavior with carefully chosen extension points. Inheritance gives callers a reason to expect the subtype to work anywhere the base contract applies. If a subtype narrows valid inputs or removes an expected outcome, substitution can fail.',
      'A service can receive a repository by composition and keep booking rules independent of storage. The day’s code resolves a seat, rejects malformed inputs and treats an occupied seat as a recognized outcome. Distinguish that outcome from a storage exception that requires translation or retry policy.'
    ],
    practice: ['Write a SeatRepository contract and a small in-memory implementation. Run the same cases against a second implementation or test double.', ['Existing and missing seats produce the documented results in each implementation.', 'An invalid request and an occupied seat have distinct runtime outcomes.', 'A caller uses the interface rather than concrete storage internals.']],
    interview: [
      ['What evidence justifies an interface here?', 'At least two meaningful implementations or a caller boundary with a stable contract. A shared acceptance suite demonstrates independent substitution.'],
      ['When can an abstract class make sense?', 'Use it for common state or behavior that genuinely belongs to a family, with clear extension rules that preserve the base contract.'],
      ['What would violate substitutability for a repository?', 'A subtype requiring stronger inputs or returning a different missing-seat outcome than callers of the base contract are allowed to expect.']
    ],
    takeaways: ['Describe the behavioral contract before choosing the type.', 'Run the same cases across implementations.', 'Choose composition for dependencies with their own lifecycle.'],
    references: [['Dev.java · Interfaces and inheritance', 'https://dev.java/learn/inheritance/']]
  },
  'j-exceptions-01': {
    notes: [
      'An exception signals that a call could not satisfy its contract. A blank user ID violates a precondition. A known occupied seat is a normal business outcome. A durable store failure is a different problem again, with its own retry and reporting policy. Keep those meanings explicit in code and tests.',
      'A checked exception must be caught or declared. Runtime exceptions need neither compiler action, though the method contract can document them. Catch an exception at a boundary that can recover, add context or translate to the caller’s language. Preserve the original cause when wrapping.',
      'Try-with-resources closes declared resources even when the main operation throws. If closure also throws, inspect suppressed exceptions for diagnosis. A finally block applies to normal and exceptional exits in ordinary control flow. A return or thrown exception from finally can replace the outcome of the try block, making failures harder to diagnose.'
    ],
    practice: ['Trace one booking conflict, one invalid argument and one repository failure. Add a closeable test resource with a failed body and failed close.', ['The conflict has the documented ordinary outcome.', 'Translation keeps the original throwable as its cause.', 'The body failure is primary while close failure is retained as suppressed.']],
    interview: [
      ['Which errors should a booking service translate?', 'Translate failures when the boundary can attach useful context or expose a stable contract. Preserve the cause for diagnosis.'],
      ['What happens when both a try-with-resources body and close fail?', 'The body exception is primary. The close exception is recorded as suppressed.'],
      ['Why does an occupied seat differ from an invalid argument?', 'A valid caller can hit a normal conflict under expected conditions. Invalid input fails the stated preconditions. Callers should handle them separately.']
    ],
    takeaways: ['Classify expected outcomes and failed contracts.', 'Catch only where there is a meaningful action.', 'Retain causes and suppressed failures.'],
    check: ['A Try body and resource close both throw. What is the primary exception?', ['The try body’s exception', 'The close exception', 'No exception'], 0, 'The close error becomes suppressed on the exception from the body.'],
    references: [javaExceptions]
  },
  'l-responsibilities-01': {
    notes: [
      'Assign each responsibility to the component with the information and authority to carry it out. Seat knows its current owner and can enforce the claim rule. BookingService resolves the request and sequences lookup plus claim. A controller translates transport data and result types.',
      'Trace an unknown seat to the service lookup and a valid conflict to the domain transition. The controller can map those outcomes to different HTTP responses. Moving HTTP status selection into Seat would couple domain rules to one caller type.',
      'A small design gets easier to change when likely policy changes affect clear seams. For adding cancellation, keep authorization and invariant ownership explicit. Draw the request sequence first and exercise the same core behavior from a Java fixture and the transport adapter.'
    ],
    practice: ['Draw a responsibility table for controller, service, repository and Seat. Trace an adapter-free exercise and an HTTP call.', ['Domain state can be tested without HTTP.', 'The trace names the component owning the invariant.', 'A new transport changes response mapping while preserving the same booking rule.']],
    interview: [
      ['Where should booking conflict logic live?', 'The domain transition or authoritative storage write owns the invariant. A service coordinates it and a controller maps its outcome.'],
      ['What would change when moving from HTTP to a batch API?', 'Request parsing and output mapping can change. The application and domain behavior should be reusable through the agreed contract.'],
      ['What indicates misplaced responsibilities?', 'A small transport change requires edits to core domain classes, or the same invariant is duplicated across multiple entry points.']
    ],
    takeaways: ['Assign behavior to the authority with the required state.', 'Keep transport adaptation at the edge.', 'Use an independent fixture to test the boundary.'],
    references: [classAccess]
  },
  'j-generics-01': {
    notes: [
      'Generic arguments describe what a caller can get and put. List<Seat> and List<Object> have no subtype relationship in either direction. Allowing List<Seat> to stand in as List<Object> would let an ordinary Object be inserted into the seat collection.',
      'A source parameter List<? extends CharSequence> can be read as CharSequence. The list’s exact element type is unknown, so inserting an arbitrary CharSequence fails. A destination List<? super String> accepts String values, and reading an element gives only an Object guarantee. This is producer extends, consumer super.',
      'For a copy routine combine both roles. In copyNames(List<? extends CharSequence> source, List<? super String> destination), transform source items to String before writing them. Most generic type parameters are erased. Runtime tests can identify the outer List type but cannot generally recover whether it was written as List<String> or List<Seat>.'
    ],
    practice: ['Write a readable copyNames method with a producer and consumer wildcard. Compile positive and negative call examples.', ['A List<StringBuilder> source and List<Object> destination compile.', 'An arbitrary CharSequence cannot be inserted into the producer.', 'List<Seat> cannot be assigned to List<Object>. Explain the rejected mutation.']],
    interview: [
      ['Why are mutable generic lists invariant?', 'A covariant assignment could let callers insert a supertype into a collection whose original owner expects only a specific subtype.'],
      ['What can you put into List<? super String>?', 'String values, because the captured element type is String or a supertype. A general read is guaranteed only to be an Object.'],
      ['What can the JVM usually tell you about List<String> at runtime?', 'It can identify a List instance. Erasure generally prevents distinguishing its type argument from another parameterized List by a direct runtime test.']
    ],
    takeaways: ['Choose the type from the method’s read/write duties.', 'A wildcard captures an unknown specific type.', 'Use rejected compilation as evidence for the contract.'],
    check: ['Which bound permits adding a String into an unknown destination element type?', ['? extends String', '? super String', '? extends CharSequence'], 1, 'Every possible captured destination type under the lower bound can hold a String.'],
    references: [javaGenerics]
  }
};
