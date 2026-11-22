export const foundationNotes = {
  1: {
    sections: [
      ['Objects, state and invariants',
        'A Seat object represents one seat and its current ownership. Its identity, A1, stays fixed. Ownership changes when a booking succeeds. An invariant is a condition every valid state satisfies. For this lab the seat is available when it has no owner, and after a successful book operation it has exactly one owner. Keeping owner as the single source of truth avoids maintaining a second field that can disagree with it.',
        'Encapsulation protects the transition. Expose a read operation for the owner and a booking operation that applies the rule. A generic owner setter would let callers bypass the checks. BookingService validates the input and resolves the seat identity. Seat can enforce the legal transition for its own state. The caller can print the result without knowing how the owner is stored.'],
      ['Trace two sequential calls',
        'Start with A1 available. U1 supplies a known seat ID and a valid user ID. The booking operation observes an available seat, assigns U1 as the owner and returns true. The U2 request arrives after the first call finishes. It observes U1 as owner, returns false and leaves U1 in place. The printed final owner matters because a false return value alone cannot prove the object was left intact.',
        'Treat an unknown seat ID or a blank user ID as a contract error even when the seat is already booked. Validate those preconditions before reporting a conflict. Show the initial state, both return values, the final owner and each exception separately. Keep this version sequential and in memory so business behavior is easy to observe.'],
      ['Follow the booking request',
        'In a browser flow, DNS resolves a hostname to an address. The browser establishes or reuses a secure connection and sends an HTTP method, path, headers and a body where appropriate. The server routes POST /bookings to the application handler. The handler applies the booking policy and returns a response. The browser renders that result. The backend store is authoritative and the browser can display stale information.'],
      ['What an LLM can contribute',
        'Training adjusts model parameters from examples. Inference uses a trained model to produce output given input tokens. A fluent sentence can contain an unsupported claim. A booking help feature can summarize a supplied cancellation policy. The Java booking operation still decides whether a seat can be assigned, based on the current authoritative state.'],
      ['Detect duplicate IDs',
        'A single left-to-right scan can keep values seen so far in a Set. On a repeated ID, the task can terminate because the required output is one boolean. Identifiers are case-sensitive and order is immaterial. HashSet membership is typically constant time with well-distributed hashes. The overall expected work is linear in the number of items, assuming bounded key-processing cost. Collision behavior and the cost of hashing strings affect the actual bound.']
    ],
    quick: ['An invariant holds after every permitted operation.', 'Observe the source of truth as well as the return value.', 'DNS, HTTP routing and UI rendering are distinct steps.', 'Keep model output outside booking correctness.'],
    variation: 'A cancellation feature is proposed. What extra transition would you allow, and which caller should be permitted to cancel?',
    check: 'Explain the initial, successful and failed states. Verify that invalid input fails explicitly and does not mutate ownership.'
  },
  2: {
    sections: [
      ['How an interleaving breaks a rule',
        'Concurrency means two tasks can make progress over overlapping time. The scheduler can suspend a thread between checking availability and writing the owner. When two threads share the same Seat, each can read the same unowned value before either performs the write. The fact that an individual reference write is atomic does not make the entire read–decide–write sequence atomic.',
        'Trace four events in order. T1 reads available. T2 also reads available. T1 writes U1 and returns success. T2 writes U2 and also returns success. The final owner is one user while the return values tell two callers they won. Capturing both return values makes the defect observable.'],
      ['Reproduce the interleaving deliberately',
        'Use a barrier or two latches around the interval after the read and before the write in a test fixture. Wait until both workers have captured their local observation, then release both. Each worker must use that retained observation for the demonstration. Join the threads before reading outcomes and use a bounded wait or test timeout so harness failures end clearly.'],
      ['Separate three observations',
        'Visibility concerns when writes become observable to other threads. Atomicity concerns whether a sequence can appear indivisible to callers. Ordering concerns the relative execution of operations. For this exercise the barrier controls the ordering and it intentionally allows two decisions based on the old state. Using sleep makes the timing depend on the scheduler and is weaker evidence than a coordinated interleaving.']
    ],
    quick: ['Use the same Seat object in both workers.', 'Capture the read, decision, write and both return values.', 'Coordinate the test with a barrier or latch.'],
    variation: 'Both workers use seats with the same ID but hold different Seat objects. How does that change what this test proves?',
    check: 'Reproduce two successes with one final owner through a controlled interleaving and name the violated invariant.'
  },
  3: {
    sections: [
      ['Protect the full state transition',
        'A Java monitor can make a critical section mutually exclusive across threads that acquire the same monitor. Place the availability read and owner update inside that section. If the first caller wins, the second enters after release and observes the booked state. A synchronized method locks its receiver for instance methods, which means separate Seat instances have separate monitors.',
        'A release of a monitor happens-before a subsequent acquisition of the same monitor. This supplies visibility along with mutual exclusion. Declaring an owner volatile also gives visibility and ordering for operations on that field, while allowing threads to interleave between a volatile read and a later volatile write.'],
      ['Design a test that verifies the fix',
        'Release both worker starts from a latch, outside the protected section. Waiting for two workers inside the same lock deadlocks because one cannot enter until the other exits. Run both workers against one shared Seat and verify one true result, one false result and a final owner equal to the successful caller. Repeat the controlled competing-start test for confidence.'],
      ['Choose the scope of coordination',
        'A lock around one Seat allows unrelated seats to proceed. A service-wide lock is straightforward and can reduce throughput for independent work. A compare-and-set can express a transition of one atomic reference from no owner to a named owner. Multi-field invariants are often easier to reason about with a lock or a database transaction. JVM locks coordinate threads that share that memory.']
    ],
    quick: ['Check and update inside the same critical section.', 'Volatile covers visibility, while mutual exclusion protects the sequence.', 'Put the competing-start harness outside the lock.'],
    variation: 'Your application runs as two independent JVMs, each with its own A1 object. Where would you move the booking decision?',
    check: 'Show one winner under concurrency, describe happens-before and identify the boundary beyond which the monitor has no reach.'
  },
  4: {
    sections: [
      ['Equality and a stable hash',
        'Reference identity answers whether two variables refer to the same object. Logical equality answers whether the objects represent the same value. Different SeatId objects representing A1 should be interchangeable as keys when that is the intended domain contract. If two objects are equal, they must have the same hash code. Unequal keys can share a hash and the map resolves collisions with equality comparisons.',
        'Hash-based collections assume that equality-relevant attributes stay stable while the key is stored. Changing a field that influenced its hash can make the key effectively unreachable through ordinary lookup. Java records are useful for immutable components and value semantics. A record containing a mutable component can still inherit the component’s mutation hazards.'],
      ['Choose a collection by its contract',
        'Use a List for an ordered sequence with duplicates, a Set for uniqueness and a Map for lookups by key. Maps and sets may differ in iteration order, ordering cost and concurrency semantics. A HashMap lookup is expected constant time under a good distribution and bounded key processing. Tree-based ordering offers predictable logarithmic basic operations and sorted traversal.'],
      ['Use independent examples',
        'Insert a booking for one SeatId instance and look it up with another instance holding the same value. Add a third distinct ID and verify it misses. Write a separate snippet that creates a mutable key and show the lookup risk, using a deliberately simple fixture. These runs answer different questions about equality and stability.']
    ],
    quick: ['Equal keys must share a hash code.', 'Use immutable values for equality-relevant key fields.', 'Separate lookup complexity from rehashing and key computation.'],
    variation: 'A1 and a1 must designate the same seat. Where will you normalize them and how will you verify the contract?',
    check: 'Demonstrate logical equality with separate instances and explain collision handling and lookup assumptions.'
  },
  5: {
    sections: [
      ['Separate preconditions from normal outcomes',
        'A contract describes allowed inputs, expected results and state effects. A malformed ID violates the caller’s precondition and can produce IllegalArgumentException. A valid request for an already claimed seat is a predictable business outcome. Returning false represents that outcome with an explicit meaning. Separate checks in the caller and tests prevent exception handling from becoming the ordinary booking workflow.'],
      ['Choose a useful abstraction',
        'An interface supplies a contract across implementations. An abstract class can share state and partial behavior where implementations truly share an abstraction. A small repository interface lets the service depend on a few operations and permits a test double. An inheritance hierarchy adds coupling when its subclasses cannot honor the same invariants. Prefer direct composition when the relationship is ownership or delegation.',
        'A singleton controls construction in one runtime or container context. It gives no automatic thread safety and provides no cross-instance coordination. A Spring singleton bean has container scope. This distinction becomes important when booking logic moves from one process to two.'],
      ['Propagate the right evidence',
        'A checked exception appears in a Java method’s contract when a caller must catch or declare it. Unchecked exceptions can also be documented, especially for input violations. Catch a lower-level error where you can add context, translate it or recover meaningfully. Preserve the original cause when translating. Assertions should exercise both the returned result and the state after failure.']
    ],
    quick: ['Specify valid input, outcomes and state effects.', 'Business conflicts can be ordinary results.', 'A singleton has a specific scope and still needs safe state handling.'],
    variation: 'A controller needs to distinguish an unknown seat, an invalid user and a booking conflict. How will its domain API communicate those three cases?',
    check: 'Describe and test each outcome independently while preserving the seat invariant.'
  },
  6: {
    sections: [
      ['Generics express intent at compile time',
        'A List<Seat> communicates the type of elements the caller can expect. A wildcard with extends supports reading values as their upper bound, while a wildcard with super can accept values of a specific type. These constraints allow reusable logic without unsafe casts. Most type parameters are erased at runtime, so a runtime check cannot generally distinguish List<Seat> from List<User>.'],
      ['Work through a pipeline',
        'A functional interface has one abstract method. A lambda can supply a predicate or a transformation in a stream. Start with seats, filter to available seats, map them to IDs and collect a snapshot. Intermediate stream operations are lazy and run as a terminal operation traverses the pipeline. Keep these functions free of mutation so each stage is easier to test.',
        'A loop can stop early cleanly and makes temporary state explicit. A pipeline reads naturally when it is a sequence of transformations. Preserve the required order and test empty input, duplicate observations and the mutability of the result. A snapshot of IDs can still become stale if ownership changes later.'],
      ['Recognize runtime and concurrency boundaries',
        'An unmodifiable list prevents callers from changing the list structure. The referenced objects may still be mutable. A parallel stream changes execution and coordination, and requires careful treatment of shared effects. Treat the booking operation as an explicit state transition outside a projection pipeline.']
    ],
    quick: ['Use types to express the collection contract.', 'Intermediate stream operations are lazy.', 'A read-only result container can still hold mutable elements.'],
    variation: 'The caller asks for the first available seat in stable input order. How would you make an early-exit loop and a stream equivalent?',
    check: 'Compare loop and pipeline outputs for the same fixtures and explain the input and result types.'
  },
  7: {
    sections: [
      ['Separate tasks from threads',
        'Runnable represents work with no returned value. Callable can return a result or throw an exception. ExecutorService assigns submitted work to workers according to its implementation. A Future exposes completion and possibly an error. Calling get waits and can surface the submitted exception as an ExecutionException. A task queue, worker pool and downstream dependency each have a separate capacity.'],
      ['Bound work and observe outcomes',
        'Submit a small known set of booking requests against one shared service. Collect outcomes with a bounded wait and count success, conflict and error separately. Shut down an owned executor and await termination. An unbounded queue can hide overload while memory and latency grow. Choose a rejection or backpressure behavior that the caller can understand.',
        'Within a JVM, threads have their own stacks and share heap objects reachable by reference. A local variable can refer to the same Seat from two threads. The local reference having thread-local scope does not make the shared Seat isolated.'],
      ['Choose the bottleneck carefully',
        'More threads may overlap I/O waits. CPU-bound tasks saturate cores and can spend more time scheduling when thread count grows. Virtual threads can help blocking workloads by reducing the cost of a waiting thread. A database connection pool still has a fixed concurrency budget and calls should respect it.']
    ],
    quick: ['Tasks, workers, queue and downstream capacity are different limits.', 'Observe Future results instead of losing submitted exceptions.', 'Shut down the executor you own.'],
    variation: 'Requests spend most of their time waiting for eight database connections. How would you choose limits and handle more requests than you can admit?',
    check: 'Run a bounded batch, collect all outcomes, confirm executor shutdown and explain the resource bottleneck.'
  },
  8: {
    sections: [
      ['Make ownership and dependency visible',
        'A simple UML class sketch can show BookingService holding a dependency on a SeatRepository and Seat exposing a protected transition. A sequence sketch can show the caller, service and seat for a successful and conflicting request. Draw only the relationships used in each explanation. Clarify which component owns the invariant and which component adapts errors to the outside world.'],
      ['Apply one SOLID principle concretely',
        'Single responsibility concerns reasons for change. Putting HTTP response formatting into Seat gives a domain object a reason to change when an endpoint changes. Dependency inversion can isolate persistence details behind a contract the domain understands. The seam should reflect a useful responsibility. An abstraction for each trivial class creates maintenance work without providing meaningful substitution.'],
      ['Test observable behavior',
        'A unit test can use the real Seat and replace only a dependency such as the repository. Give each test its own state so outcomes are independent. Use Arrange, Act and Assert to make facts visible. Assert that a failed attempt preserves the successful owner. A mocked success return by itself provides no evidence that the real invariant holds.',
        'For this milestone, code plus evidence includes a diagram, test output and a short explanation of why you drew the boundary there. A future machine-coding exercise can extend the model by adding more seats or cancellation.']
    ],
    quick: ['Draw owners, responsibilities and call order.', 'Choose one SOLID principle and justify a real class boundary.', 'Assert state after a failed operation.'],
    variation: 'The app adds email confirmation after a successful booking. Which responsibility changes and how would you test it?',
    check: 'Tie a UML relationship and a passing unit test to one booking rule you can explain independently.'
  }
};
