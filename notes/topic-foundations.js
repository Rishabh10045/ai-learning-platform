const classAccess = ['Dev.java · Controlling access to members', 'https://dev.java/learn/language/oop/classes-objects/more-on-classes/#controlling-access'];
const javaHashMap = ['Java 21 · HashMap', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html'];
const javaExceptions = ['Dev.java · Exceptions', 'https://dev.java/learn/language/annotations-exceptions/exceptions/'];
const javaGenerics = ['Dev.java · Generics', 'https://dev.java/learn/generics/'];

export const foundationTopics = {
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
    check: ['Aa and BB have the same hash and are unequal. What does inserting both do?', ['Keeps both mappings.', 'Overwrites Aa.', 'Always throws.', 'Keeps both only after the map resizes.'], 0, 'The table distinguishes keys using equality even when hashes match.'],
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
    check: ['A Try body and resource close both throw. What is the primary exception?', ['The try body’s exception', 'The close exception', 'No exception', 'A new exception that wraps both as causes'], 0, 'The close error becomes suppressed on the exception from the body.'],
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
    check: ['Which bound permits adding a String into an unknown destination element type?', ['? extends String', '? super String', '? extends CharSequence', '? extends Object'], 1, 'Every possible captured destination type under the lower bound can hold a String.'],
    references: [javaGenerics]
  }
};
