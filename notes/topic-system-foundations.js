const design = ['GfG · System Design Training', 'https://www.geeksforgeeks.org/courses/system-design-training-program'];
const postgres = 'https://www.postgresql.org/docs/current/';
const timeApi = ['Java 21 · Clock', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html'];
const http = ['IETF RFC 9110 · HTTP semantics', 'https://www.rfc-editor.org/rfc/rfc9110.html'];
const cache = ['Redis · Key eviction', 'https://redis.io/docs/latest/develop/reference/eviction/'];
const kafka = ['Apache Kafka · Introduction', 'https://kafka.apache.org/intro/'];
const sre = ['Google SRE · Monitoring distributed systems', 'https://sre.google/sre-book/monitoring-distributed-systems/'];
const awsRetries = ['AWS Builders’ Library · Timeouts, retries and backoff', 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/'];

export const systemFoundationTopics = {
  'h-requirements-01': {
    notes: [
      'Functional requirements describe what callers can do. A booking app allows viewing a seat, reserving it and confirming the reservation. Preserve one confirmed owner per seat. State exclusions such as resale or refunds if they change the scope of your architecture.',
      'Non-functional targets describe service behavior under a named workload and failure pattern. For example, define browsing p95 below 250 ms at 100 reads/s and a separately measured maximum acceptable staleness. For confirmation, state whether any double booking is permitted, the error budget and the timeout response.',
      'Turn each target into a test. Warm up the service, identify the traffic mix and measure the matching metric. If users double refreshes while purchase demand stays flat, read fanout and cache load estimates change. The authoritative booking invariant still applies.'
    ],
    practice: ['Write three functional requirements and three testable service targets for the booking scenario. Then revise them after a doubled refresh rate.', ['Each target names a metric, threshold and workload.', 'The architecture sketch identifies the authoritative write and read staleness policy.', 'The changed scenario separates increased read pressure from unchanged booking demand.']],
    interview: [
      ['What is a functional requirement in this scenario?', 'A valid customer can request a hold on an available seat and confirm it before expiry.'],
      ['How do you make “the app must be fast” measurable?', 'Specify the operation, percentile threshold, workload, observation window and treatment of errors.'],
      ['What changes when page refreshes double?', 'Read requests, cache and backend fanout estimates change. Authoritative write volume can remain unchanged under the stated assumption.']
    ],
    takeaways: ['Agree on scope and invariants.', 'Specify targets per operation and workload.', 'Recalculate the layer affected by a changed assumption.'],
    references: [design, sre]
  },
  'l-invariants-02': {
    notes: [
      'A hold adds a temporary right to confirm a seat. Model available, held and booked states, with a hold ID, owner and expiry required for the held state. Ownership checks alone fail when the same customer makes a later hold on the same seat. A distinct hold ID prevents an old request from acting on the replacement.',
      'Define the boundary precisely. If valid means now < expiresAt, a confirmation at exactly expiresAt fails. Use a fixed Clock in Java to test the instant before, at and after. The authoritative database operation needs matching time semantics.',
      'Cleanup may lag behind public traffic. A new claim can replace an expired hold through the guarded state transition even while an expired row still exists. A delayed cleaner should delete or release only the hold identity it observed. It must preserve a newer hold.'
    ],
    practice: ['Draw the timed hold lifecycle and implement a fixed-clock transition test. Add replacement hold H2 before a slow cleanup for H1 returns.', ['H1 confirms before expiry and fails at or after the boundary.', 'A non-owner fails without mutation.', 'Cleanup for H1 preserves H2.']],
    interview: [
      ['Why do you need a hold ID as well as an owner?', 'Two attempts can belong to the same owner but represent different reservations. A stable hold ID distinguishes their authority.'],
      ['What happens at exactly expiresAt?', 'Under the stated strict rule, confirmation fails. The rule and clock must agree across the code and database.'],
      ['Can the online path depend on the cleanup job running on time?', 'The transition should evaluate expiry directly so correctness holds when cleanup is delayed.']
    ],
    takeaways: ['Make every transition name a hold identity.', 'Test the equality boundary.', 'Keep correctness independent of cleanup timing.'],
    check: ['Strict validity is now < expiresAt. What happens at equality?', ['Confirmation succeeds.', 'Confirmation fails.', 'The answer depends on HTTP method.'], 1, 'Equality fails a strict less-than check.'],
    references: [timeApi]
  },
  'b-transactions-04': {
    notes: [
      'An atomic confirmation combines owner, hold identity, allowed state and expiry checks inside one authoritative write. For example, update the row only where seat ID, hold ID and owner match, state is held and expires_at is greater than the chosen time. A separate availability query cannot authorize a later write on its own.',
      'Use one time policy. PostgreSQL CURRENT_TIMESTAMP is fixed at transaction start. A request that waited in an older transaction can see a different boundary from a statement clock or wall clock. Choose a time function based on the documented transition rule and verify the exact before/equal/after cases.',
      'A zero affected-row count says the guard did not match. It can mean expiry, replacement, wrong owner or absence. The application can report a safe generic conflict or an authorized follow-up classification. Check the durable state instead of attributing every zero to expiry.'
    ],
    practice: ['Implement a guarded UPDATE in a seeded PostgreSQL fixture and compare two attempts with the same hold ID.', ['A valid owner confirms once and a second confirmation affects zero rows.', 'Wrong owner, exact expiry and replaced hold leave the current record unchanged.', 'Record the clock function and final state from another connection.']],
    interview: [
      ['What conditions should authorize confirmation?', 'Match the current seat, hold ID, owner and held state. Apply the expiry predicate inside the actual transition.'],
      ['Why can CURRENT_TIMESTAMP surprise an exact expiry test?', 'It reflects the transaction starting time. A long-running transaction can keep that value even while real time advances.'],
      ['How do you diagnose a zero-row result?', 'Identify the nonmatching predicate with an appropriately authorized read or report a generic conflict. Verify that the row remained unchanged.']
    ],
    takeaways: ['Put authorization and expiry in the guarded write.', 'Choose a clock deliberately.', 'Observe durable state after a rejected update.'],
    references: [['PostgreSQL · CURRENT_TIMESTAMP and clock functions', postgres + 'functions-datetime.html#FUNCTIONS-DATETIME-CURRENT']]
  },
  'b-http-02': {
    notes: [
      'An idempotency key identifies one logical request by the same caller and operation. Reusing it with the same canonical request can retrieve the stored result. Reusing it with a different request is a conflict. Scope keys by caller and operation to prevent collisions and information disclosure between users.',
      'Store the reservation of the key and the replayable result consistently with the booking effect. A database unique constraint can serialize two simultaneous uses of the same scoped key. Define what the second caller sees while the first is in progress and what counts as a completed response.',
      'Retention is a product promise. After expiry, replay by key may behave like a fresh request. The seat invariant still prevents another owner, but exactly the same response may no longer be recoverable. Exercise a lost response, changed input, different user and expired key separately.'
    ],
    practice: ['Send identical and changed requests under one scoped key. Simulate a lost success response and safely replay.', ['Identical retries give the stored result and one durable effect.', 'Changed input under the same scope produces the documented conflict.', 'Another user’s key scope never gives access to the first user’s result.']],
    interview: [
      ['What must be covered by an idempotency lookup?', 'The authenticated caller, operation and key, plus a canonical request identity to catch changed intent.'],
      ['Why store the effect and replay result consistently?', 'If one commits without the other, a retry can duplicate the effect or report a result with no corresponding durable action.'],
      ['What changes after a key expires?', 'The server no longer promises to replay that stored result. The normal domain guards still govern a new request.']
    ],
    takeaways: ['Scope key identity and compare request intent.', 'Resolve concurrent duplicate attempts at the write.', 'Document retention and replay behavior.'],
    references: [http, awsRetries]
  },
  'h-reliability-01': {
    notes: [
      'A timeout is a lack of timely information. It does not reveal whether the database has committed. Trace a request to waiting, durable effect and response separately. A client that lost the reply after commit still needs a way to learn the outcome.',
      'One recovery strategy is a status query keyed by a known resource ID. Another is replaying the original request with a stable, scoped idempotency key. Choose a consistent view when the client needs read-after-write, and return a meaningful pending state if work is still active.',
      'Bound retries by an end-to-end deadline and decide which errors are transient. A fleet that retries at the same instant can amplify a dependency failure. Spread retries with backoff and jitter. Track attempted requests and durable effects independently.'
    ],
    practice: ['Draw a lost response after commit. Replay the request and log total requests versus durable bookings.', ['The replay returns the original outcome and preserves one booking.', 'The deadline and recovery path are indicated in the sequence.', 'The explanation separates transient failure, known conflict and unknown outcome.']],
    interview: [
      ['How can a booking succeed even when the client times out?', 'The write can commit before the client receives its response. The response path can fail independently of the effect.'],
      ['What kind of read is useful for immediate status recovery?', 'A read path with the consistency needed to observe the recent write, potentially routing to the authoritative primary.'],
      ['How can retries hurt reliability?', 'They add load during saturation and can duplicate effects without a replay contract. Bound and de-correlate them.']
    ],
    takeaways: ['Separate uncertain response from failed write.', 'Offer a safe recovery path.', 'Give retries a deadline and evidence.'],
    references: [awsRetries]
  },
  'h-databases-01': {
    notes: [
      'A replica keeps another copy of a dataset. An asynchronous replica can lag and serve a stale availability view after confirmation. Partitioning splits a dataset with a rule, and sharding typically places partitions across database nodes. Sharding distributes data ownership and can grow write capacity for well-distributed workloads.',
      'An event key keeps one event’s seats together and helps event-scoped queries. A launch for one event can overload one shard even if the average load is balanced. Scatter-gather makes some global queries more costly. Choose the key by access patterns, hotspot risk and which invariants must share an authority.',
      'Trace one booking written to the primary and a GET routed to a lagging replica. A stale seat map can be acceptable within a stated bound. A confirmation result that must reflect the latest state uses an appropriate authoritative read. Failover and replica promotion add data-loss and recovery objectives.'
    ],
    practice: ['Place eight event IDs on two shards with a declared split. Trace a skewed launch, one stale read and an authoritative confirmation.', ['The sketch separates a shard owner from replicas of the shard.', 'An extra shard does not silently fix an individual hot event.', 'The read/write policy identifies which route may observe lag.']],
    interview: [
      ['How is a shard different from a replica?', 'A shard owns a subset of a dataset. A replica copies some or all of another node’s owned data.'],
      ['When can replica reads be unsafe for a user workflow?', 'When the user requires a recent effect that the replica may not yet have applied, such as a just-confirmed booking.'],
      ['What is the trade-off of event ID as a shard key?', 'Event queries stay local, but one unusually popular event can overload a single shard and cross-event queries can scatter.']
    ],
    takeaways: ['Separate copying from ownership partitioning.', 'Choose keys on workload and invariant locality.', 'Test a read with known replication lag.'],
    references: [['PostgreSQL · Table partitioning', postgres + 'ddl-partitioning.html'], design]
  },
  'b-sql-02': {
    notes: [
      'An index creates an access path for a matching query. An ordered B-tree can help equality, ranges and some sort orders. A composite index on (event_id, seat_no) has a useful order for queries constrained by event and searching or ordering seats. Measure a query constrained only by seat_no rather than assuming the same plan.',
      'Use representative cardinality and value distribution. A tiny table or broad filter can favor a sequential scan. EXPLAIN shows an estimated plan. EXPLAIN ANALYZE executes the statement and reports actual behavior, so run a read query in the fixture and handle write effects deliberately.',
      'Observe the before/after plan, returned result, actual row counts and any separate sort. Account for added storage and write maintenance. Comparing a query result checks equivalence. Comparing the plan and measured behavior checks the performance hypothesis.'
    ],
    practice: ['Seed skewed events, compare the same SELECT before and after an (event_id, seat_no) index, and test a seat-only predicate.', ['Result IDs and ordering remain identical.', 'Record scan choice, actual and estimated counts and any sort.', 'Explain why a broad or seat-only lookup might choose a different path.']],
    interview: [
      ['How do you choose a composite index order?', 'Start from the common predicates and sort needs. Leading equality keys can narrow an ordered range for subsequent columns. Check the actual plan.'],
      ['Why might PostgreSQL choose a sequential scan with an index available?', 'The estimated cost can be lower if much of the table is needed or the table is small.'],
      ['What extra evidence does EXPLAIN ANALYZE provide?', 'It executes the statement and reports observed row counts and timings alongside the estimates.']
    ],
    takeaways: ['Start with the workload and distribution.', 'Compare equivalent query results and plans.', 'Account for write costs and execution effects.'],
    check: ['Which command actually executes the planned query?', ['EXPLAIN', 'EXPLAIN ANALYZE', 'CREATE INDEX alone'], 1, 'ANALYZE in EXPLAIN measures execution rather than only planning.'],
    references: [['PostgreSQL · Using EXPLAIN', postgres + 'using-explain.html'], ['PostgreSQL · Multicolumn indexes', postgres + 'indexes-multicolumn.html']]
  },
  'b-caching-01': {
    notes: [
      'With cache-aside, the service reads the cache first. On miss it reads the authoritative store and fills the cache. Cache only the read model whose freshness promise is understood. The durable conditional write authorizes a booking. A cached “available” field is advisory.',
      'TTL controls how long an entry remains eligible. Eviction removes entries under a memory policy and can occur before expiry. A read miss is expected even when no explicit invalidation happened. Observe keys, cache hit rate and backend read count together.',
      'When Redis fails or a hot key expires, uncontrolled fallback can overload the primary. Cap or coalesce origin reads, use suitable backoff and surface controlled degradation. The booking transition still uses its independent database rule. Demonstrate a cold burst and an unavailable cache separately.'
    ],
    practice: ['Run a booking-read cache fixture with warm, cold and unavailable Redis. Observe authoritative writes throughout.', ['Warm repeated reads reduce origin queries.', 'An expired or evicted key falls back through the expected path.', 'A cache outage is bounded and cannot authorize a second booking.']],
    interview: [
      ['How does cache-aside refill a missing key?', 'The application reads the backing store, then populates the cache according to its freshness policy.'],
      ['How do expiration and eviction differ?', 'Expiration is driven by a time rule for an entry. Eviction removes data under a memory policy.'],
      ['How would you protect the origin when Redis goes down?', 'Bound fallback concurrency or rate, coalesce identical misses where appropriate and degrade optional reads while preserving correctness.']
    ],
    takeaways: ['Cache advisory reads rather than booking authority.', 'Measure hit rate and origin load together.', 'Exercise cold start and dependency loss.'],
    references: [cache, ['Redis · EXPIRE', 'https://redis.io/docs/latest/commands/expire/']]
  },
  'h-caching-01': {
    notes: [
      'Invalidating after commit narrows one stale-data window but does not prevent every stale fill. Reader R can fetch old availability, the writer can commit and delete the key, then R can store the old result. Draw the order before choosing a policy.',
      'A versioned cache entry or conditional fill can reject a late older value. A shorter TTL bounds some staleness but may multiply origin misses. Stronger reads can use the authority directly. Choose by the product’s freshness tolerance and the cost of refreshing or coordinating values.',
      'With many concurrent misses for one hot key, coalescing lets one load refresh while others wait or use permitted stale data. Expiry jitter helps spread independent expiries across keys. Compare these mechanisms against the actual workload and prove booking correctness independently.'
    ],
    practice: ['Trace a reader that fills an old value after a commit and invalidation. Choose a mitigation and model a hot-key miss burst.', ['The event order produces stale data without violating the booking authority.', 'The mitigation controls the stale version under the stated policy.', 'The design states a limit on origin reads and a tolerated freshness range.']],
    interview: [
      ['Why can invalidation after commit still leave stale data?', 'A concurrent reader can have fetched the older value before commit and fill the cache after the invalidation.'],
      ['When might a shorter TTL hurt?', 'More frequent expiry can increase origin queries and synchronization across hot requests.'],
      ['What problem does request coalescing address?', 'It combines concurrent requests that need the same cache fill, reducing duplicate origin work.']
    ],
    takeaways: ['Draw the stale-fill ordering.', 'Choose a freshness policy with an explicit cache miss cost.', 'Protect the origin on miss bursts.'],
    references: [cache, design]
  },
  'd-lru-01': {
    notes: [
      'LRU evicts the least recently accessed key when capacity is full. With capacity two, put A, put B, get A, put C leaves A and C because the read made A recent. FIFO would evict A because arrival order stays unchanged by the read.',
      'LFU chooses low access frequency and needs a tie-break or aging policy. A key that was once hot can remain resident under naive frequency counting. Compare observed workload traits and expected metadata cost before choosing a replacement policy.',
      'A common in-memory LRU design combines a map and recency list. A hit changes ordering as well as returning the value. When threads share an access-ordered cache, protect both lookup and recency in the same mutation policy. Define what capacity zero means for the implementation.'
    ],
    practice: ['Trace LRU and FIFO for A,B,A,C with capacity two, then compare with Java access-ordered LinkedHashMap.', ['LRU evicts B and FIFO evicts A.', 'The trace records how a hit changes recency.', 'Capacity zero and repeated-key behavior have explicit expected results.']],
    interview: [
      ['How does a read affect LRU?', 'A successful access moves the entry to the most-recent position under the access-order contract.'],
      ['How is LFU different from LRU?', 'LFU uses access frequency, with tie-break and aging considerations. LRU primarily uses latest access time.'],
      ['Why might concurrent get require guarding in an LRU?', 'It can modify the shared recency structure even though it returns an existing value.']
    ],
    takeaways: ['Trace recency on both reads and writes.', 'Choose eviction policy from workload.', 'Specify capacity and concurrency rules.'],
    references: [['Java 21 · LinkedHashMap access order', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html']]
  },
  'b-messaging-01': {
    notes: [
      'Kafka appends records to partitions. Ordering is defined within one partition. A stable key can keep relevant events on the same partition under the chosen partitioning model. A new partition count or changed partitioner can change routing, so document any ordering guarantee that spans a migration.',
      'Consumers in a group share partition assignments, and offsets track where the group will resume. Adding consumers beyond available partitions does not create more parallel assignments for that group. Rebalances can move ownership and reveal unfinished work.',
      'If a consumer commits a durable effect then fails before recording progress, it can see the same event again. If it records progress before an effect, the effect may be skipped after failure. Use stable event IDs, a deliberate offset boundary and idempotent downstream work.'
    ],
    practice: ['Produce events for two keys in a small test topic. Inspect partition and offset, then restart a consumer before it commits progress.', ['The log establishes ordering per partition.', 'The replay occurs for an uncommitted offset as expected.', 'The durable side effect is counted independently from deliveries.']],
    interview: [
      ['Where does Kafka guarantee order?', 'Records are ordered by offset within an individual partition. There is no total sequence across all partitions.'],
      ['What restricts parallel consumption in a single group?', 'Partition assignment limits concurrently assigned consumers. Extra group members can remain idle.'],
      ['What can happen after an effect commits but the offset does not?', 'The record can be delivered again. The downstream operation needs an idempotency or coordinated effect strategy.']
    ],
    takeaways: ['State the partition and group scope.', 'Separate an offset from business effects.', 'Test a restart at the offset boundary.'],
    check: ['What happens if a group has more consumers than assigned partitions?', ['Every consumer handles the same partition.', 'Some consumers have no assigned partition.', 'All records become globally ordered.'], 1, 'A single assignment uses each partition at most once within the group.'],
    references: [kafka]
  },
  'h-queues-01': {
    notes: [
      'A message can be redelivered after a consumer failure or acknowledgement loss. Treat the business event ID separately from a delivery attempt. Record both so diagnostics can distinguish an actual duplicate effect from a legitimate replay.',
      'An atomic consumer write can store the event ID under a uniqueness rule and apply the business effect in one database transaction. A duplicate then resolves to an already-applied outcome. If the effect calls an external system, use the destination’s idempotency support or a separate reconciliation design.',
      'Decide how repeated failures are handled. Bounded retries help transient conditions. A record requiring inspection can move to a dead-letter workflow with enough context to diagnose and replay safely. Acknowledgement timing and durable effect timing need observable tests.'
    ],
    practice: ['Replay one event twice, then simulate a crash after a durable effect and before acknowledgement.', ['Deliveries may exceed one and the intended durable effect remains one.', 'The log carries stable event identity and attempt identity.', 'A persistent failure enters the documented review path without an infinite retry.']],
    interview: [
      ['How do you deduplicate repeated delivery?', 'Use stable event identity and an atomic transaction that records the processed ID with the durable effect.'],
      ['Why is a separate external email effect harder?', 'The sender and local database cannot usually commit in one local transaction. You need a destination idempotency or uncertainty and reconciliation strategy.'],
      ['What should a dead-letter path preserve?', 'The failed event, failure context and enough identity to inspect it and replay under a controlled policy.']
    ],
    takeaways: ['Treat repeated delivery as ordinary failure recovery.', 'Coordinate processed identity with the actual effect.', 'Bound retries and reconcile uncertain external work.'],
    references: [kafka, design]
  },
  'h-loadbalance-01': {
    notes: [
      'Round robin cycles through ready targets. Least connections can help when open connection count is proportional to active work. IP hash gives affinity and can skew when many clients share a proxy. Record the routed target and health state before comparing algorithms.',
      'Consider A with three slow active connections and B with zero. Round robin can send to A next even if that increases waiting. Least connections can favor B, though a connection count can hide request work when protocols multiplex. Use metrics appropriate to the protocol.',
      'Compare two runs with the same request rate, payload mix and duration. Warm up equally, report errors and tail latency, and verify the booking invariant. Remove an unhealthy target and observe that routing changes while the authoritative store still decides booking outcomes.'
    ],
    practice: ['Trace a controlled uneven-duration workload with round robin, least connections and IP hash. Repeat with one unhealthy target and report observations.', ['The trace names selected targets for every request and shows where skew appears.', 'The same input and health condition are used for comparison.', 'Removing one target keeps routing and booking authority distinct.']],
    interview: [
      ['When can round robin be a good starting policy?', 'When ready instances are similar and request costs are reasonably uniform, its simple routing can spread flow acceptably.'],
      ['Why might IP hash be skewed?', 'Many users can share one observed source IP behind a gateway or proxy, putting many requests on one target.'],
      ['What should stay constant in a comparative load test?', 'Traffic mix, request rate, runtime, environment and starting conditions while changing one routing variable.']
    ],
    takeaways: ['Choose routing with an explicit workload.', 'Use health to bound the eligible targets.', 'Compare outcomes and tail behavior, not just averages.'],
    references: [['NGINX · HTTP load balancing', 'https://nginx.org/en/docs/http/load_balancing.html']]
  },
  'h-observability-01': {
    notes: [
      'A p95 latency is a percentile of a measured population. It can differ from the worst request, especially with larger samples. Choose a measurement window, units and population. For ten sorted observations and nearest-rank p95, the rank is ceil(0.95×10)=10. Tiny samples make tail statistics unstable.',
      'Server time can contain queue wait, application work, downstream wait and response handling. Compare timestamps or spans around each boundary. A healthy app CPU and rising connection-acquire wait suggest a different cause from an overloaded worker queue.',
      'Record concurrency, duration, offered load, errors and the request mix. Collect a baseline and change one variable. Separate successful request latency from failures and report what happened to timeouts. A trial in a controlled lab is evidence for that traffic shape.'
    ],
    practice: ['Compute nearest-rank p95 for a ten-value list and annotate an example trace with two waits. Compare warm and overloaded runs.', ['Show units, sample count and p95 definition.', 'Queue wait and database checkout time have separate measurements.', 'The report states the workload assumptions and reports failures.']],
    interview: [
      ['What does p95 mean in a specified window?', 'It describes a threshold reached by about 95 percent of the sampled requests under the stated approximation.'],
      ['How would you tell pool saturation from app execution latency?', 'Measure pool acquire wait, worker queue wait, service time and active counts. Compare their changes under a controlled load.'],
      ['Why is a low mean compatible with complaints?', 'A small fraction of very slow requests can be hidden by a low mean. Examine tail behavior and the affected endpoint or cohort.']
    ],
    takeaways: ['Declare percentile method and population.', 'Instrument waits at the boundaries.', 'Report failures and workload along with latency.'],
    references: [sre]
  },
  'h-consistency-01': {
    notes: [
      'Choose consistency by operation. A seat map can permit a specified bounded lag. Booking confirmation needs one authority so simultaneous requests cannot each confirm the same seat. A global label alone hides those differences.',
      'During a network partition, a distributed storage design cannot simultaneously guarantee linearizable behavior and a successful response to every request that reaches a nonfailed node. For booking, reject or defer a write where that authority cannot be reached. A read-only browsing view may remain available under a documented staleness policy.',
      'PACELC asks a second question under normal operation: what is the latency cost of coordination for consistency? A nearby replica may respond faster while reading older data. The design can route a user’s just-written result to the primary and allow general browsing from replicas.'
    ],
    practice: ['Draw two regions with a broken link. Decide separately for seat map GET, booking POST and read-after-write. Repeat without the partition.', ['The partition case preserves the one-owner rule.', 'Each permitted read declares its staleness or consistency policy.', 'The healthy case explains the latency added by a stronger read.']],
    interview: [
      ['What choice does CAP identify under partition?', 'A design cannot retain both linearizable consistency and the formal availability guarantee across the partition for the operation under discussion.'],
      ['How does PACELC extend the discussion?', 'It adds the normal-operation latency versus consistency decision when no partition is active.'],
      ['Which operations can differ without a contradiction?', 'A lagging seat map can remain available under its documented rule while a booking write uses the enforcing authority.']
    ],
    takeaways: ['State the operation before naming a guarantee.', 'Separate partition behavior from healthy-path latency.', 'Test the exact failure and routing decisions.'],
    references: [design, ['Martin Kleppmann · Designing Data-Intensive Applications', 'https://dataintensive.net/']]
  },
  'h-reliability-02': {
    notes: [
      'A dependency timeout bounds how long the caller waits. Use an end-to-end budget and assign sub-deadlines that leave enough time to return a controlled response. A dependency stop signal does not prove that an external write had no effect.',
      'Retry safe transient failures within a budget. Backoff and jitter reduce synchronized load. Avoid stacking independent retries across multiple layers, which can multiply attempts. Require replay protection or explicit outcome recovery for an uncertain write.',
      'Choose degradation by importance. Cached or reduced browsing can be acceptable within a freshness policy. Booking confirmation must fail safely if its authority is unavailable. Track error, latency, recovery and whether the user can tell which outcome occurred.'
    ],
    practice: ['Inject a slow database, unavailable cache and lost booking response. Set an end-to-end deadline and describe behavior for browsing and confirmation.', ['The dependency timeout returns before the client budget expires.', 'Retries are bounded, and uncertain writes use the defined recovery path.', 'Degradation preserves the authoritative booking invariant.']],
    interview: [
      ['Why set dependency and overall deadlines separately?', 'A dependency should finish or fail soon enough for the caller to coordinate remaining work and deliver a defined result within the total budget.'],
      ['How can retries multiply across layers?', 'Each layer can retry calls already retried underneath. Put responsibility at one appropriate layer and enforce a shared budget.'],
      ['How should booking behave when authority is down?', 'Return the documented unavailable or pending state. Preserve the invariant and avoid reporting a confirmed effect without evidence.']
    ],
    takeaways: ['Carry the overall deadline through dependent calls.', 'Bound retries and coordinate them across layers.', 'Degrade only within the product’s authority rules.'],
    references: [awsRetries, sre]
  }
};
