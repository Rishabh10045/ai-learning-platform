export const systemsNotes = {
  17: {
    sections: [
      ['Identify the coordination boundary',
        'Each running JVM owns its own memory, including Java monitors. Two service processes may both hold a local representation of A1. Only a shared authoritative operation can settle a competition between them. PostgreSQL can enforce one legal transition by using the same conditional update and constraint from both application instances.'],
      ['Run independent processes and observe the database',
        'Point two app processes on different ports at the same database. Reset the fixture, send competing requests and record which port returned each response. Compare responses with the final committed database row. A race across processes reveals problems that a single-instance test cannot observe.'],
      ['Keep a service horizontally scalable',
        'A stateless application server avoids keeping authoritative booking state in local session memory. A load balancer can send a later request to another instance without breaking the booking contract. A database, cache and message system have distinct roles. Make dependency timeouts visible instead of reporting a generic conflict.']
    ],
    quick: ['Local monitors cover one process.', 'Verify two processes and a single shared datastore.', 'Read the final committed row.'],
    variation: 'One replica still shows A1 as available after a successful booking. Which operation may use that replica safely?',
    check: 'Record one cross-instance winner, the loser’s response and authoritative database state.'
  },
  18: {
    sections: [
      ['Turn vague goals into testable requirements',
        'Functional requirements describe behavior users need, such as viewing a seat, placing a hold or confirming a booking. Non-functional requirements specify how the system should behave under conditions like traffic, dependency failures and recovery. State the booking invariant and define whether availability displays can lag. A requirement with no measurement is difficult to verify.'],
      ['Estimate from explicit assumptions',
        'Suppose an event receives 12,000 visitors in a 10-minute rush. That is about 20 visitors per second on average during the rush. Five browsing requests per visitor suggest 100 reads per second, before peaks or retries. If 10 percent of visitors submit a booking, average writes in that window are about two per second. Hot-seat contention can be severe even when total writes are low.'],
      ['Connect numbers to decisions',
        'Sketch the request path and name where an average estimate hides a burst. Distinguish peak read throughput from lock contention and storage growth. Use one scenario with changed assumptions and explain which capacity or failure mode now dominates.']
    ],
    quick: ['Separate business behavior from measurable service goals.', 'Show units and the time window.', 'Hot keys can dominate at low average throughput.'],
    variation: 'Traffic doubles without increasing active bookings, because users refresh availability more often. Which components need a new estimate?',
    check: 'Produce explicit formulas, units and a scaling decision tied to one estimate.'
  },
  19: {
    sections: [
      ['State transitions and a clock',
        'A hold gives one user a time-limited claim. Represent available, held and booked states with coherent owner and expiry fields. A confirmation operation should check ownership and expiry inside its authoritative transition. Expiry time compared against the chosen authoritative clock determines what the current request may do.'],
      ['Handle the expiry boundary',
        'Specify what happens at the exact expiry instant. For example, permit confirmation only while now is strictly before expiresAt. Use an injected clock for Java tests and state the database time semantics for production. A background worker can remove expired rows or clean up state, while online booking still checks expiry directly.'],
      ['Test the race near expiration',
        'Create fixed-clock fixtures before, at and after expiry. Include the original holder and a competing user. Add a near-simultaneous renew or confirm scenario once the basic transition is stable. A cleanup worker should apply conditional writes so a stale observation cannot delete an extended hold.']
    ],
    quick: ['Answer what happens at the exact expiry instant.', 'Keep the owner and expiry check atomic.', 'Use a controllable clock in tests.'],
    variation: 'The expiry cleanup is delayed five minutes. How can users book seats whose holds have already expired?',
    check: 'Show before, at and after expiry behavior with an explicit time policy.'
  },
  20: {
    sections: [
      ['Resolve the lost-response case',
        'A timeout leaves the client uncertain whether the server committed the booking. A client-generated idempotency key identifies a logical attempt. Scope the key to the user and operation, and compare request fingerprints when the key is reused. An identical retry can return the stored result. A different payload with the same key should receive a clear conflict.'],
      ['Persist the result with the effect',
        'Store the idempotency record and booking effect in one transaction where possible. A uniqueness constraint or an atomic reservation protects simultaneous claims on the same key. If the first attempt is still processing, define whether the second waits briefly or receives a retryable response. Keep an explicit retention window and document the effect of expiry.'],
      ['Test true duplicates and confusing lookalikes',
        'Send two identical requests with one key, then send a changed payload using the same key. Confirm the database records one effect. Simulate a lost response by committing and retrying. Record what you return when the key is reused by a separate user.']
    ],
    quick: ['Scope keys to the relevant caller and operation.', 'Store the effect and replayable result consistently.', 'Test a changed payload and a lost response.'],
    variation: 'A request finishes successfully, but the client retries after the key expires. Which promise can the server still make?',
    check: 'Demonstrate one effect under retry and explain the retention and concurrency policy.'
  },
  21: {
    sections: [
      ['Read an execution plan',
        'Indexes trade storage and write overhead for faster access patterns. For a booking lookup, start with the filter, sort and expected cardinality. PostgreSQL may prefer a sequential scan when the table is tiny or the predicate selects much of it. EXPLAIN estimates the plan. EXPLAIN ANALYZE executes the query and can have effects for writes unless wrapped appropriately.'],
      ['Separate partitioning, replication and consistency',
        'A replica keeps another copy of data and may be used for read scaling or recovery. Asynchronous replication can lag. Partitioning splits a logical dataset by a rule, and sharding usually spreads partitions across database nodes. Select a partition key with the request pattern and skew in mind. Flash sales concentrate traffic around individual events.'],
      ['Explain data placement with one workload',
        'Use representative rows and compare plans before and after changing an index. Examine estimated and actual counts and consider whether the index can satisfy ordering. A stale replica can serve browsing if the product accepts that lag. An authoritative write stays on the leader or coordination path that enforces the rule.']
    ],
    quick: ['Read plans with realistic data.', 'A replica can lag; a shard owns a slice.', 'Keep authoritative writes on the enforcing path.'],
    variation: 'Most traffic is for one event and event ID is the shard key. What hotspot remains and what would you measure next?',
    check: 'Compare two SQL plans and connect replication lag to safe read choices.'
  },
  22: {
    sections: [
      ['Cache a view of availability',
        'In cache-aside, a read checks the cache, asks the datastore on a miss and stores the result for later reads. A TTL limits how long a cached value may persist. A successful booking should trigger the chosen invalidation or refresh strategy after commit. A cache hit on an available flag is advisory. The atomic booking decision still goes to PostgreSQL.'],
      ['Reason about stale fills and eviction',
        'A reader can fetch old data just before a write, then populate the cache just after invalidation. This is a stale-fill race. Versioned values, strict use of authoritative reads where needed or a short TTL can limit its impact. Eviction removes values based on a policy when memory is constrained. Expiry removes them because their lifetime ended.'],
      ['Plan for cold traffic',
        'Many callers can hit the same expired key and overload the database. Test a burst with a cold cache and record hit rate, backend queries and latency. Request coalescing or jittered expiry may smooth misses, with an implementation cost.']
    ],
    quick: ['Cache display reads with a documented stale-data tolerance.', 'Invalidate after commit and think about stale fills.', 'A miss storm can overload the primary database.'],
    variation: 'Redis is temporarily unavailable during a popular event. Which reads can fall back, and how would you protect the database?',
    check: 'Capture a stale read and prove that it cannot generate a second booking.'
  },
  23: {
    sections: [
      ['Publish a fact after a state transition',
        'BookingConfirmed describes a business fact that can feed notifications or reports. A producer encodes a stable event ID, type, version and useful occurrence data. Kafka partitions order records within a partition. Consumer groups distribute partitions across active consumers and offsets record progress. A key that groups related events supports per-key ordering.'],
      ['Design for duplicate delivery',
        'When a worker updates its own datastore and crashes before committing an offset, it may process the same record again. Make the side effect idempotent using an event ID tracked with the consumer’s work or a naturally safe update. A dead-letter path can preserve a message that repeatedly fails processing for inspection.'],
      ['Distinguish delivery from side effects',
        'Broker delivery settings tell you when a record can reappear. The system still needs a guarantee for the external effect, such as sending one confirmation email or applying one inventory update. Try one deliberately duplicated event and record the produced effect count.']
    ],
    quick: ['Kafka orders within a partition.', 'The offset and consumer side effect are distinct.', 'Use an event ID to demonstrate safe replay.'],
    variation: 'A worker sends an email, crashes before persisting its deduplication record and retries. Which additional boundary would you coordinate?',
    check: 'Process the same event twice and explain what prevented or allowed duplicate side effects.'
  },
  24: {
    sections: [
      ['Start with a measurement question',
        'Decide whether you want throughput, tail latency or behavior under seat contention. Use controlled request rates and label the traffic mix. A mostly read workload and many simultaneous writes to A1 stress different resources. Report count, failures, latency percentiles and domain invariants together.'],
      ['Choose how requests are distributed',
        'Round robin cycles across ready instances. Least connections tries to account for uneven ongoing work. Hashing can route the same key consistently where useful, though skew can create hotspots. A health check keeps an unhealthy target out of rotation. Routing cannot replace a shared consistent booking decision.'],
      ['Interpret a small experiment carefully',
        'Warm up before comparing runs and change one variable at a time. Document concurrency, duration and starting state. Report sample size and avoid interpreting tiny runs as production performance. Break out time spent waiting for the database from application work where your instrumentation allows it.']
    ],
    quick: ['Name the load shape and test question.', 'Compare representative latency and error measurements.', 'Confirm booking invariants independently of throughput.'],
    variation: 'One instance has slow database access while the other is healthy. Which signals would make a load balancer change routing?',
    check: 'Compare two bounded runs and explain where load distribution helped or exposed a bottleneck.'
  },
  25: {
    sections: [
      ['Define required consistency per operation',
        'Clients may accept a few seconds of lag for the seat map while expecting only one confirmed booking. Consistency requirements depend on the operation. During a partition, a distributed system may need to reject a write rather than allow contradictory confirmations. Simple labels like CP and AP are shorthand and should be tied to a specific failure and operation.'],
      ['Make retries and timeouts explicit',
        'A read timeout can be retried within a budget when it is safe to do so. A write timeout can happen after commit, so check idempotency and replay semantics. Less frequent retries, bounded time and backoff help protect a struggling dependency. A cache outage should not increase allowed writes or silently bypass validation.'],
      ['Walk through degraded paths',
        'Draw one path each for a slow database, unavailable cache and lost booking response. State what the client sees, how the service records the failure and which component owns the final state. Choose one safe fallback and one condition where the service should fail closed.']
    ],
    quick: ['Specify consistency by operation.', 'A timeout is an uncertain outcome.', 'Prevent retries from multiplying load.'],
    variation: 'The seat map is served from a remote region during a partition. Which actions remain safe in that region?',
    check: 'Present a failure timeline and justify degraded behavior for browsing and booking.'
  }
};
