// Each day has one applied check. Options are stored with the expected answer first and shuffled on display.
export const assessmentScenarios = {
  1: [
    'A1 starts free. U1 successfully claims it. U2 then makes a valid claim. Which observations best establish the invariant?',
    ['U1 succeeds, U2 conflicts, final owner is U1.', 'U1 succeeds, U2 conflicts, final owner is U2.', 'Both callers succeed, final owner is U1.'],
    'Assert the result and the state. A false result can conceal an accidental owner change unless the test reads the final owner.'
  ],
  2: [
    'In the unsafe fixture both workers read null before either writes. Their methods return true and one owner remains. What happened?',
    ['Both callers raced through the check and one write overwrote the other.', 'Only one caller attempted a write because the final state holds one value.', 'The result establishes atomicity because reading the owner reference was atomic.'],
    'The invariant concerns successful operations as well as final state. An atomic field read does not make the read, decision and write one operation.'
  ],
  3: [
    'A service locks its own instance during claim. Two service instances share the same Seat. Which change coordinates those callers inside one JVM?',
    ['Guard every check and write with the same monitor on the shared seat.', 'Mark each service method synchronized and keep separate service monitors.', 'Make the owner volatile and retain the same read-then-write sequence.'],
    'Mutual exclusion must cover the entire transition under one lock shared by the competing callers.'
  ],
  4: [
    'Two immutable keys compare equal by seat code, but their hash codes are derived from different labels. What must change?',
    ['Derive both equality and hashing from the same canonical identity.', 'Allow the mismatch and ensure the keys are inserted with the same value.', 'Use a larger hash table so the equality comparison always runs first.'],
    'Equal keys must have equal hash codes. A hash table can search a different location when equal keys hash differently.'
  ],
  5: [
    'The API must distinguish an unknown seat, an occupied seat and a database timeout. Which service contract preserves the distinctions?',
    ['Expose typed missing/conflict outcomes and propagate the timeout as a failure.', 'Return false for every case so all API clients get the same conflict.', 'Convert all three cases to an invalid-argument exception.'],
    'Missing and occupied seats are expected domain outcomes with different client actions. A database timeout is a dependency failure with potentially unknown write outcome.'
  ],
  6: [
    'An ordered list contains free seats A2 and A1 in that order. What returns A2 without building a result list?',
    ['Filter by availability, then call findFirst on the ordered stream.', 'Sort by seat ID, filter and call findFirst.', 'Filter then call findAny on a parallel stream.'],
    'findFirst respects the encounter order of the source. Sorting changes that order, and findAny does not promise the first element.'
  ],
  7: [
    'Future.get times out while a booking task is waiting for a JDBC connection. What can the caller conclude?',
    ['The caller stopped waiting. The task may still continue and commit.', 'The timeout canceled the task and rolled back its transaction.', 'The timeout proves the task executed and committed.'],
    'A timed wait does not complete or cancel a Future. Resolve the logical operation outcome before issuing an independent retry.'
  ],
  8: [
    'A notification adapter is added. Which test best checks the responsibility split for a competing claim?',
    ['Assert a committed winner requests confirmation and a losing claim leaves owner and notifications unchanged.', 'Assert the notifier is called as soon as any request is received.', 'Mock the entire booking service and assert the controller invoked it.'],
    'The evidence should observe domain state and the side effect boundary. Rejected attempts should produce neither a new owner nor a confirmation.'
  ],
  9: [
    'A direct service unit test passes with a fake, but startup fails after adding a second repository bean. Where do you look first?',
    ['Inspect injection candidates, qualifiers and active configuration.', 'Change the controller JSON mapping and rerun the unit test.', 'Add more workers to the database connection pool.'],
    'The direct test bypasses application-context resolution. The Spring injection point can become ambiguous even when service behavior passes.'
  ],
  10: [
    'A booking API has created record B7 successfully. Which response conveys both creation and a lookup URI?',
    ['201 Created with a Location header for /bookings/B7.', '202 Accepted with a promise that creation has already committed.', '204 No Content with a JSON representation of B7 in the body.'],
    'Use 201 for a completed creation and a Location header to identify the created resource. 202 describes work accepted for processing.'
  ],
  11: [
    'A scheduled import calls the booking service directly with a blank user ID. Which test protects the intended boundary?',
    ['Call the service directly and assert validation and no state change.', 'Retest the controller JSON validation and infer that imports are covered.', 'Accept the ID if the seat is currently free.'],
    'Internal callers skip MVC validation. Domain and application preconditions must protect all applicable write paths.'
  ],
  12: [
    'Historical rows must remain after cancellation. Which PostgreSQL rule permits rebooking and rejects two active records?',
    ['A unique index on seat_id restricted to active rows.', 'An ordinary nonunique index on seat_id with application-side checks.', 'A unique constraint on seat_id across all historical and active rows.'],
    'The partial unique index enforces one active booking while leaving past rows outside its predicate.'
  ],
  13: [
    'PostgreSQL connection B already read A1 under Repeatable Read. A commits an owner update. B reads A1 again in the same transaction. Which result is expected?',
    ['B can still see the old value from its original snapshot.', 'B must see the new value because A committed before the second statement.', 'B must see an uncommitted value from any writer.'],
    'PostgreSQL Repeatable Read retains the transaction snapshot for ordinary reads. Read Committed normally uses a fresh snapshot per statement.'
  ],
  14: [
    'A transaction must reserve A1 and A2 together. Its guarded write changes A1, but A2 is already claimed. What should happen?',
    ['Roll back the transaction and return a group conflict.', 'Commit A1 and report the entire group reserved.', 'Commit A1, then rerun the original group request without checking the first result.'],
    'The requirement is all-or-nothing. A transaction groups the guarded operations so an incomplete attempt does not leave a committed partial hold.'
  ],
  15: [
    'One transaction locks A1 then A2. A second locks A2 then A1. How do you reduce deadlock risk for the next attempts?',
    ['Acquire the seats in one stable order and handle retryable transaction failures.', 'Raise lock wait limits while preserving the opposite acquisition order.', 'Read both seats without locks and make both updates unconditional.'],
    'A common acquisition order reduces circular waits for these locks. Keep retry and timeout policies for failures that can still arise.'
  ],
  16: [
    'JPA flush emits an UPDATE, then the transaction rolls back. What should a fresh connection observe?',
    ['The prior committed row value.', 'The flushed value because the SQL already executed.', 'A new row version that became durable when the entity was detached.'],
    'Flush synchronizes pending work with the database transaction. Durability follows commit, and rollback discards the flushed write.'
  ],
  17: [
    'Two JVMs expose the same booking API. What evidence tests shared coordination?',
    ['Send competing requests to different ports against the same database and inspect one committed owner.', 'Send both requests to one port and verify the other process is running.', 'Compare both processes’ cache entries after separate database writes.'],
    'Both independent runtime processes must attempt the same shared transition. A single authoritative database observation confirms the outcome.'
  ],
  18: [
    'Peak seat-map traffic is 1,000 requests per second. At a steady 95% cache hit rate, roughly how many reach the origin if each miss fetches once?',
    ['50 requests per second.', '95 requests per second.', '950 requests per second.'],
    'The miss rate is 5%, so 1,000 × 0.05 = 50 origin reads per second under the given assumptions. A cold-cache burst can differ.'
  ],
  19: [
    'A hold is valid exactly while now < expiresAt. Confirmation arrives exactly at expiresAt and cleanup has not run. What should the confirmation do?',
    ['Reject as expired in the authoritative transition.', 'Accept because the hold row is still present.', 'Treat the request as valid until the cleanup worker’s next pass.'],
    'Physical cleanup is independent of validity. The same protected operation must check state, owner and the strict expiry predicate.'
  ],
  20: [
    'Booking committed but the response was lost. A retry uses the same key and payload inside the retention window. What result demonstrates the contract?',
    ['Return the stored result and retain one booking effect.', 'Check current availability and issue a fresh claim with the same key.', 'Return only the latest seat state regardless of the prior operation result.'],
    'Replay preserves the committed result and avoids a second effect. The domain guard alone can reject duplication but may lose the original response.'
  ],
  21: [
    'A PostgreSQL index is unused for a tiny table, with matching rows spread across most pages. What is the best next step?',
    ['Compare actual plans using representative data sizes and selectivity.', 'Disable sequential scans in production to guarantee the index is beneficial.', 'Drop the index solely because the tiny fixture did not use it.'],
    'The planner can choose a cheaper sequential scan. Test representative data and evaluate actual work and index maintenance cost.'
  ],
  22: [
    'A reader fetches “available.” The writer commits, invalidates, and then the reader refills the cache with its old result. What must still hold?',
    ['A new booking attempt reaches the database guard and cannot create a second owner.', 'The cache must be current because invalidation already happened.', 'Reject all future reads until every cache replica is rebuilt.'],
    'A fill after invalidation can reintroduce an old value. Booking correctness stays in the authoritative operation.'
  ],
  23: [
    'A consumer commits a database effect, then crashes before acknowledging the event. What protects against applying it twice?',
    ['An event ID stored transactionally with that effect.', 'A consumer instance ID stored only in the crashed process.', 'An ordering guarantee for messages in the same partition.'],
    'Acknowledgment can be lost after commit. Atomic deduplication and effect persistence let redelivery observe the completed work.'
  ],
  24: [
    'Increasing offered load raises throughput and p95. Which measurement best checks whether database admission is driving the change?',
    ['Per-request connection acquisition wait and pool saturation under the same traffic mix.', 'The average response time after switching to a different mix of routes.', 'The number of threads configured across all services, by itself.'],
    'Measurement at the suspected queue helps distinguish saturation from a change in requests or work inside the database.'
  ],
  25: [
    'Region B can serve a cached map but cannot reach the booking authority. What behavior preserves unique ownership?',
    ['Permit the approved stale view and fail claims that cannot be authorized.', 'Confirm claims against cached availability and synchronize when the partition heals.', 'Treat a cached free result as a temporary booking confirmation.'],
    'A stale view can inform browsing. Confirming writes in multiple isolated places can violate the one-owner invariant.'
  ],
  26: [
    'With prefix[0]=0 and prefix[i+1]=prefix[i]+a[i], what computes the sum of a[l..r) after preprocessing?',
    ['prefix[r] − prefix[l].', 'prefix[r−1] − prefix[l].', 'prefix[r] − prefix[l+1].'],
    'prefix[r] covers positions before r. Subtracting prefix[l] leaves exactly the half-open range, including an empty range when l=r.'
  ],
  27: [
    'In a,b,b,a, left is 2 before processing the final a. Its previous index is 0. What is left after processing it?',
    ['2.', '1.', '3.'],
    'The update takes max(2, 0+1). The prior a is outside the current span and does not require shrinking it.'
  ],
  28: [
    'You are reversing A→B→C and have current=B, previous=A. What must you save before setting B.next to A?',
    ['The original B.next, which points to C.', 'The new B.next after assignment.', 'Only the value stored in B.'],
    'Saving the original next reference keeps the unprocessed suffix reachable once the link is reversed.'
  ],
  29: [
    'A capacity-two LRU runs put(A), put(B), get(A), put(C). Which key should be removed?',
    ['B.', 'A.', 'C.'],
    'The successful get makes A most recent. B is least recent when C requires space.'
  ],
  30: [
    'To keep the smallest three values from a stream, your retained set is 2, 5 and 8, and the next is 4. What should happen?',
    ['Replace 8 with 4 by removing the max-heap root.', 'Replace 2 with 4 by removing the min-heap root.', 'Keep 2, 5 and 8 because 4 is greater than the smallest root.'],
    'The largest retained candidate is the threshold. A better value replaces it.'
  ],
  31: [
    'S→T costs 5. S→A and A→T each cost 1. Which paths minimize hops and total weight?',
    ['S→T minimizes hops. S→A→T minimizes weight.', 'S→T minimizes both because BFS discovers T first.', 'S→A→T minimizes both because all weights are positive.'],
    'BFS counts edges, and a weighted shortest-path search compares totals. These are separate objectives.'
  ],
  32: [
    'Intervals [0,2), [2,4) and [0,4) have values 1, 1 and 10. What is the maximum total value without overlap?',
    ['10.', '2.', '12.'],
    'The length-four interval excludes both smaller intervals but earns more than their combined value.'
  ],
  33: [
    'A valid access token has booking:read. The caller is assigned venue A and requests a booking in venue B. What should the service do?',
    ['Deny access under the resource-level policy and avoid returning booking details.', 'Return it because a valid read scope covers every venue.', 'Allow it if the request body claims venue B as the caller’s venue.'],
    'Permission includes both the action and the particular resource. The claimed venue in untrusted input cannot grant authority.'
  ],
  34: [
    'A shared DB is down for 30 seconds. An instance remains responsive but cannot handle booking traffic. Which probes fit?',
    ['Readiness fails for booking traffic and liveness remains healthy if the process can recover.', 'Both remain healthy because the HTTP process started.', 'Liveness fails while readiness continues routing bookings to the instance.'],
    'Readiness controls traffic admission. Liveness should indicate whether a restart is warranted, without making a shared outage worse.'
  ],
  35: [
    'Two models give wrong answers without policy text and both succeed when given the same correct passage. What should you diagnose first?',
    ['Whether retrieval reliably includes the passage for that question.', 'Whether more fluent wording would make the unsupported answer acceptable.', 'Whether a larger model can answer from its training data alone.'],
    'Supplying the evidence isolates a likely problem in retrieval or context assembly before model capacity is changed.'
  ],
  36: [
    'A response parses and cites P1. P1 says 48 hours and the response says 24. What should happen?',
    ['Reject the unsupported claim and use the defined fallback.', 'Accept it because the response parses and P1 exists.', 'Replace P1 with a different citation without checking whether it supports the claim.'],
    'Schema validity and citation membership do not establish factual support. Check the actual policy claim, including its numeric boundary.'
  ],
  37: [
    'A provider moves its generated text into a different JSON field. Which test gives the clearest signal?',
    ['An adapter contract test using a response fixture with the changed wire shape.', 'A booking domain test with no model dependency.', 'An application test that mocks the adapter’s parsed result.'],
    'The adapter owns parsing. A wire fixture crosses that boundary and catches drift that a pre-parsed mock hides.'
  ],
  38: [
    'A valid policy code misses vector search. There is also a semantically close document from an unauthorized venue. Which change is appropriate?',
    ['Add exact code matching and apply venue and version filters to all candidate paths.', 'Raise top-k and pass the unauthorized document to the model for filtering.', 'Disable metadata constraints until the model finds a plausible answer.'],
    'Exact lookup improves identifier retrieval. Access restrictions still apply before giving the model any evidence.'
  ],
  39: [
    'Retrieval contains the current authorized clause, but the answer introduces an exception absent from it. What failed?',
    ['Claim grounding or its validation, even though retrieval found the passage.', 'Retrieval by definition, because every bad answer is a retrieval miss.', 'Nothing, because one correct passage was cited.'],
    'Measure retrieval and answer support separately. Finding the right passage helps generation and does not prove the statement follows from it.'
  ],
  40: [
    'A revision sends fewer bad answers, but also refuses more questions with good evidence. What should the evaluation report?',
    ['Grounded correctness and refusal rates separately for answerable and unanswerable cases.', 'Only the overall fraction of responses accepted by its own validator.', 'Only the median output length.'],
    'Separate good refusals from false refusals. One acceptance number cannot expose both safety and coverage changes.'
  ],
  41: [
    'A model proposes a valid read-only call for venue B. The authenticated caller is scoped to A. Which behavior passes?',
    ['The tool boundary rejects the lookup before any B data returns.', 'The tool returns B data and trusts the model to hide it.', 'The lookup proceeds because the MCP argument schema is valid.'],
    'Tool arguments express a request. Trusted identity and authorization determine access independently of protocol validation.'
  ],
  42: [
    'A request has 180 ms left. A retry normally needs 300 ms and the provider is saturated. What should the API do?',
    ['Use the fallback without automatically adding work that cannot fit the deadline.', 'Reset the caller deadline and retry indefinitely.', 'Queue a retry and claim that end-to-end latency is unaffected.'],
    'Retries consume both remaining time and shared capacity. Admission and retry rules should enforce an end-to-end budget.'
  ],
  43: [
    'The current policy changed yesterday. Existing policy text is missing from every request. Which change addresses the observed failure?',
    ['Update and test access to the current authoritative policy source.', 'Fine-tune the style of answers without supplying the policy.', 'Lower output temperature and assume the new fact appears.'],
    'The failure is missing fresh evidence. Customize style or behavior only after showing a persistent behavioral problem under adequate inputs.'
  ],
  44: [
    'Which evidence supports the claim that the booking path remains available during a model outage?',
    ['Force a provider timeout and verify the help fallback plus a committed authoritative booking and competing conflict.', 'Stop the model and verify that an HTTP process still listens.', 'Show a normal booking with the provider up, followed by a normal help response.'],
    'Observe both paths during the same failure. A live process or a success in a separate healthy run does not establish independence.'
  ],
  45: [
    'An interviewer asks whether one concurrent booking fixture proves 10,000 requests per second. Which answer is defensible?',
    ['It exercises the ownership invariant. A representative load run is needed for the throughput claim.', 'A correct fixture establishes throughput because the database is transactional.', 'The number follows from the count of service instances alone.'],
    'Match the claim to the evidence. A contention test and a capacity measurement have different inputs and observations.'
  ],
  46: [
    'A virtual-thread service creates 1,000 waiting tasks for 8 DB connections. Which change targets the bottleneck?',
    ['Bound concurrent database work and measure connection wait and useful throughput.', 'Raise virtual-thread concurrency without changing admission.', 'Remove all timeouts so waiting tasks can always complete.'],
    'Cheaper waiting does not raise downstream capacity. Bound and measure admission on the constrained path.'
  ],
  47: [
    'A method calls its own annotated transactional method in typical proxy mode, without an outer transaction. What should you check?',
    ['The call may bypass the proxy, so verify the advice and commit boundary from an external caller.', 'The annotation always starts a new transaction when any Java method calls it.', 'The database driver applies Spring proxy advice after each write.'],
    'With proxy-based AOP, same-instance calls can skip advice. Test the actual invocation and verify commits from a different connection.'
  ],
  48: [
    'A correctly signed, unexpired access token targets help-api. It has a booking-like scope. What should booking-api do?',
    ['Reject it because its expected audience is absent.', 'Accept it because the issuer signed it and the name of the scope matches.', 'Use its OAuth client ID to rewrite the audience during validation.'],
    'Audience binds a token to an intended recipient. Check it separately from scope and resource authorization.'
  ],
  49: [
    'A client reconnects to an SSE service with an event ID older than the retained history. What recovery preserves a usable view?',
    ['Fetch a fresh snapshot and resume with its associated stream position.', 'Treat the next new event as proof all missed events were applied.', 'Replay whatever is retained while keeping the old snapshot and assume no gap.'],
    'When complete replay is unavailable, a coherent snapshot and cursor provide a fresh baseline for subsequent changes.'
  ],
  50: [
    'A relay publishes an outbox event and crashes before marking it sent. On replay, what yields one consumer DB effect?',
    ['Apply effect and event deduplication together in the consumer transaction.', 'Mark the producer outbox row sent before attempting any publish.', 'Depend on an atomic commit across every data store participating in the saga.'],
    'The outbox prevents a local write from losing its event record. Delivery can repeat and requires an idempotent consumer effect.'
  ],
  51: [
    'An eligible booking SLI counts properly served attempts. Of 1,000 attempts, 30 time out. The others all meet the latency target. What is the availability result?',
    ['97% properly served.', '100% because all successful responses were fast.', '3% because that is the fraction of requests that timed out.'],
    'Successful latency and availability measure different outcomes. Here 970 of 1,000 eligible requests count as good.'
  ],
  52: [
    'A prerequisite graph has A→B→C→A. What must a topological scheduling algorithm report?',
    ['A cycle prevents a complete feasible order.', 'A feasible order exists if traversal starts at A.', 'The order is feasible if each vertex is emitted once during DFS.'],
    'Every ordering of a directed cycle violates at least one prerequisite. Use cycle detection or the processed-vertex count.'
  ],
  53: [
    'With a single item of weight 3, which reachable targets are valid in 0/1 subset sum?',
    ['0 and 3 only.', '3 and 6 only.', '0, 3 and 6.'],
    'The empty subset reaches 0. The sole item reaches 3. Reaching 6 would reuse it, a bug caught by this fixture.'
  ],
  54: [
    'A deterministic fixture passes all parsing and outage tests. What additional evidence supports a hosted adapter choice?',
    ['Grounded quality, correct refusals and tail latency measured on representative questions under the actual data constraints.', 'More fixture runs with identical output and no evaluation of the hosted service.', 'One fluent hosted answer without context or latency measurements.'],
    'A fixture proves application behavior under controlled responses. Provider selection needs task and operating evidence for the provider itself.'
  ],
  55: [
    'There are four vertices and only edges 0–1 with weight 1, 1–2 with weight 2 and 0–2 with weight 3. What is the cheapest spanning forest?',
    ['Cost 3, with two edges and two components.', 'Cost 6, with three edges and one component.', 'Cost 4, with two edges and one component.'],
    'Accept the two edges of weight 1 and 2. The weight-3 edge closes a cycle, and vertex 3 remains isolated.'
  ]
};
