const caseOf = (label, ...steps) => ({ label, steps: steps.map(([label, explanation, facts]) => ({ label, explanation, facts })) });

export const lessonDiagrams = {
  1: {
    title: 'Follow a booking from request to result',
    question: 'Trace the request through the application. Switch to the second request and predict what happens to the owner field.',
    scenarios: [
      caseOf('U1 books an available seat',
        ['Browser', 'The user clicks Book. The browser resolves the hostname if needed and opens or reuses a secure connection.', ['Input: A1, U1', 'Owner: none']],
        ['HTTP handler', 'POST /bookings reaches the route. The handler validates the incoming seat and user IDs.', ['Route: POST /bookings', 'Owner: none']],
        ['BookingService', 'The service resolves the requested seat. The booking operation checks availability before changing ownership.', ['Seat: A1', 'Owner: none']],
        ['Seat A1', 'The transition succeeds and the seat stores U1 as its only owner.', ['Owner: U1', 'Result: true']],
        ['Response', 'A real HTTP endpoint can report creation to the browser. In the plain-Java lab, Main records the true result and prints the owner.', ['HTTP example: 201 Created', 'Authoritative owner: U1']]),
      caseOf('U2 tries an occupied seat',
        ['Browser', 'U2 sees an availability display that can be stale and submits a valid request.', ['Input: A1, U2', 'Owner: U1']],
        ['HTTP handler', 'The request has a known seat and valid input. It reaches the booking operation.', ['Signal: valid request', 'Owner: U1']],
        ['BookingService', 'The operation inspects the authoritative seat and finds that it is already owned.', ['Seat: A1', 'Owner: U1']],
        ['Seat A1', 'The call returns false. U1 remains the owner.', ['Owner: U1', 'Result: false']],
        ['Response', 'An HTTP implementation can return a conflict. Main prints the false result and the still-valid owner.', ['HTTP example: 409 Conflict', 'Authoritative owner: U1']])
    ]
  },
  2: {
    title: 'Step through a check-then-act race',
    question: 'Compare a sequential order with the controlled two-thread interleaving. Track the local observations and the shared owner separately.',
    scenarios: [
      caseOf('Sequential order',
        ['T1 reads', 'T1 observes that the shared seat is available.', ['T1 saw: free', 'Owner: none']],
        ['T1 writes', 'T1 assigns U1 and reports success.', ['T1 returned: true', 'Owner: U1']],
        ['T2 reads', 'T2 sees the changed owner before deciding.', ['T2 saw: booked', 'Owner: U1']],
        ['T2 returns', 'T2 reports a conflict, leaving the first assignment intact.', ['T2 returned: false', 'Owner: U1']]),
      caseOf('Interleaving with two winners',
        ['T1 reads', 'T1 captures a free seat and pauses before the write.', ['T1 saw: free', 'Owner: none']],
        ['T2 reads', 'T2 captures the same free state. The barrier can now release both workers.', ['T1 saw: free', 'T2 saw: free']],
        ['T1 writes', 'T1 acts on its local decision, sets U1 and returns true.', ['T1 returned: true', 'Owner: U1']],
        ['T2 writes', 'T2 still acts on its earlier decision and overwrites the owner. Two success results violate the invariant.', ['T2 returned: true', 'Owner: U2']])
    ]
  },
  3: {
    title: 'Compare a volatile read with a shared lock',
    question: 'Switch the policy and find the step at which T2 must wait.',
    scenarios: [
      caseOf('Volatile field only',
        ['T1 reads', 'The volatile read observes the current value. The field is initially empty.', ['Owner: none', 'T1 holds no lock']],
        ['T2 reads', 'A second volatile read can occur before any write and also see an empty field.', ['Owner: none', 'Both saw: free']],
        ['Both attempt updates', 'Separate volatile reads and writes still admit this interleaving. Both callers can report success.', ['Result: two reported winners']]),
      caseOf('Same monitor',
        ['T1 enters', 'T1 acquires the monitor and reads availability in the critical section.', ['Lock holder: T1', 'Owner: none']],
        ['T2 arrives', 'T2 waits to acquire the same monitor. Its availability check has yet to run.', ['Lock holder: T1', 'T2: waiting']],
        ['T1 commits its decision', 'T1 assigns U1 and releases the monitor.', ['Owner: U1', 'T1 returned: true']],
        ['T2 enters', 'T2 acquires the monitor after release and sees the booked state.', ['Owner: U1', 'T2 returned: false']])
    ]
  },
  4: {
    title: 'What a hash lookup actually does',
    question: 'Follow two equal keys and then compare the effect of a changed key field.',
    scenarios: [
      caseOf('Stable logical key',
        ['Compute hash', 'The inserted and lookup SeatId values for A1 compute matching hashes.', ['Key: A1']],
        ['Find bucket', 'The map narrows the search using its internal mapping for the hash.', ['Expected lookup: constant under distribution assumptions']],
        ['Check equality', 'The equality test identifies the A1 entry. Other keys in the same bucket can remain distinct.', ['Result: value found']]),
      caseOf('Mutated key',
        ['Insert', 'The map places the key while its data represents A1.', ['Recorded key state: A1']],
        ['Change field', 'The key now represents A2 and computes a different hash.', ['Current key state: A2']],
        ['Find bucket', 'A lookup using the changed key can look in a different place. The old entry may still occupy its insertion location.', ['Result: lookup can miss']])
    ]
  },
  8: {
    title: 'Locate the booking invariant in the class design',
    question: 'Follow the responsibilities from the outside caller to the object that owns the state.',
    scenarios: [caseOf('Booking call',
      ['Caller / Main', 'Collect inputs and observe the returned result. This layer can print the current owner.', ['Dependency: BookingService']],
      ['BookingService', 'Validate the command and resolve the seat identity.', ['Dependency: SeatRepository']],
      ['SeatRepository', 'Find the domain object using its stable identifier.', ['Returns: Seat A1']],
      ['Seat', 'Protect the transition and keep the original owner on a conflict.', ['Owns: seat state', 'Invariant: at most one owner']])]
  },
  10: {
    title: 'Follow Spring MVC from a request to an HTTP status',
    question: 'Compare a creating request with one that reaches the controller but cannot book.',
    scenarios: [
      caseOf('Successful POST',
        ['DispatcherServlet', 'Route the method and path to the booking controller.', ['POST /bookings']],
        ['Controller', 'Bind input and call BookingService with a valid command.', ['Input: valid']],
        ['Service', 'Commit the accepted booking and return its identifier.', ['State: booked']],
        ['HTTP response', 'Report creation with the new resource reference.', ['Status: 201']]),
      caseOf('Valid request, booked seat',
        ['DispatcherServlet', 'Route the same HTTP method and path.', ['POST /bookings']],
        ['Controller', 'Accept the input shape and pass the request to the domain.', ['Input: valid']],
        ['Service', 'The authoritative state already records an owner.', ['Result: conflict']],
        ['HTTP response', 'Report the conflict while the owner remains unchanged.', ['Status: 409']])
    ]
  },
  13: {
    title: 'Observe a transaction from two connections',
    question: 'Follow the row seen by connection B before and after connection A closes its transaction.',
    scenarios: [
      caseOf('Commit',
        ['Connection A writes', 'Connection A updates the row inside an open transaction.', ['A sees: revised', 'B can see: original']],
        ['Connection B reads', 'In this Read Committed example, B reads the earlier committed row for its statement.', ['B sees: original']],
        ['Connection A commits', 'The change becomes committed.', ['Durable row: revised']],
        ['B starts a new statement', 'B sees the recently committed value in the new statement.', ['B sees: revised']]),
      caseOf('Rollback',
        ['Connection A writes', 'Connection A changes the row inside an open transaction.', ['A sees: revised']],
        ['Connection A rolls back', 'The transaction discards the update.', ['Durable row: original']],
        ['B starts a statement', 'Connection B reads the original stored value.', ['B sees: original']])
    ]
  },
  14: {
    title: 'One SQL predicate and two concurrent updates',
    question: 'Trace the second updater after the first transaction releases its row lock.',
    scenarios: [caseOf('PostgreSQL Read Committed',
      ['T1 holds the row', 'The predicate owner IS NULL matches A1. T1 writes U1 and holds the row lock until commit.', ['T1 count: 1', 'Committed owner: none']],
      ['T2 waits', 'A concurrent attempt to update the same row waits for T1.', ['T2: waiting']],
      ['T1 commits', 'The new version containing U1 becomes committed.', ['Committed owner: U1']],
      ['T2 rechecks', 'The predicate is evaluated against the updated row and no longer matches.', ['T2 count: 0', 'Committed owner: U1']])]
  },
  17: {
    title: 'Two application instances and one authority',
    question: 'Check which component can enforce the booking rule across processes.',
    scenarios: [caseOf('Contending requests',
      ['Client U1', 'The first booking request is routed to instance A.', ['Port: 8081']],
      ['Client U2', 'The second request reaches instance B. Each instance has a separate JVM and local objects.', ['Port: 8082']],
      ['Shared PostgreSQL', 'Both services write on the same row through a guarded operation. PostgreSQL resolves the competing changes.', ['Coordination: shared row']],
      ['Responses', 'One write succeeds and the other returns conflict. Read the final committed owner separately.', ['Example statuses: 201 and 409']])]
  },
  19: {
    title: 'A hold changes at the expiry boundary',
    question: 'Compare a confirmation one second early with a request at the exact expiry instant.',
    scenarios: [
      caseOf('Confirm before expiry',
        ['Hold A1', 'U1 holds the seat with expiresAt 21:05:00.', ['State: held', 'Holder: U1']],
        ['Confirm at 21:04:59', 'The authoritative write finds the holder and a still-valid deadline.', ['now < expiresAt']],
        ['Persist booking', 'Transition the valid hold to booked.', ['State: booked', 'Owner: U1']]),
      caseOf('Confirm at expiry',
        ['Hold A1', 'U1 has the same hold until 21:05:00.', ['State: held', 'Holder: U1']],
        ['Confirm at 21:05:00', 'The strict deadline check fails even if cleanup has yet to run.', ['now = expiresAt']],
        ['Reply conflict', 'Return the documented expiry result. A later claimant may use a conditional write to acquire the expired hold.', ['State: expired for decisions']])
    ]
  },
  20: {
    title: 'Replay a booking after a lost response',
    question: 'Change the retry payload and compare the outcomes while the number of writes stays fixed.',
    scenarios: [
      caseOf('Identical retry',
        ['First request', 'U1 submits payload A and key K. The booking and replay record commit together.', ['Effects: 1']],
        ['Response lost', 'The client cannot tell whether the server finished.', ['Client result: unknown']],
        ['Retry', 'A request with key K and the original fingerprint finds the saved response.', ['Effects: 1', 'Result: replay booking ID']]),
      caseOf('Same key, different payload',
        ['First request', 'The booking record stores the original payload fingerprint beside key K.', ['Effects: 1']],
        ['Different retry', 'The incoming fingerprint differs from the original payload fingerprint.', ['Key: K', 'Payload: changed']],
        ['Reply key conflict', 'The application rejects reuse and preserves the original booking record.', ['Effects: 1', 'Result: key conflict']])
    ]
  },
  22: {
    title: 'Compare a current database row with a stale cache',
    question: 'Step through a stale fill to see why a positive availability display carries no booking guarantee.',
    scenarios: [caseOf('Stale fill after invalidation',
      ['Read misses cache', 'A read starts and receives the older available row from its database statement.', ['Reader saw: available']],
      ['Booking commits', 'The write sets the owner and the cache key is invalidated after commit.', ['Database owner: U1']],
      ['Reader fills cache', 'The original read stores the value it captured before the write.', ['Cache: available', 'Database: booked']],
      ['New booking request', 'The write still checks the authoritative predicate and returns conflict.', ['Outcome: no second booking']])]
  },
  23: {
    title: 'A Kafka delivery and its external effect',
    question: 'Follow the gap between a completed side effect and progress acknowledgement.',
    scenarios: [caseOf('Duplicate event after restart',
      ['Broker delivers', 'A consumer receives BookingConfirmed E42 from a partition.', ['Event ID: E42']],
      ['Store effect', 'The consumer records E42 and its durable local change together.', ['Effect count: 1']],
      ['Restart', 'The worker fails before committing its consumer progress. Kafka can deliver the same record again.', ['Second delivery: E42']],
      ['Deduplicate', 'The consumer finds E42 already processed and skips the repeat effect.', ['Effect count: 1']])]
  },
  27: {
    title: 'Watch the distinct-ID window change',
    question: 'Move through A, B, A, C and track why the left boundary advances only on the duplicate.',
    scenarios: [caseOf('Longest distinct window',
      ['Read A', 'Include A at index 0.', ['Window: [A]', 'Best length: 1']],
      ['Read B', 'Add B with no conflict.', ['Window: [A, B]', 'Best length: 2']],
      ['Read A again', 'Advance the left boundary past A’s old position. The repeated character now occurs once inside the window.', ['Window: [B, A]', 'Left index: 1']],
      ['Read C', 'Add C. The new span is the longest seen so far.', ['Window: [B, A, C]', 'Best length: 3']])]
  },
  29: {
    title: 'Trace the LRU map and list together',
    question: 'Keep the cache capacity at two. Check which node the final insert evicts.',
    scenarios: [caseOf('Put A, put B, get A, put C',
      ['Put A', 'The map stores a reference to A’s list node.', ['List MRU → LRU: A', 'Map keys: A']],
      ['Put B', 'Create a node for B and insert it at the most-recent end.', ['List MRU → LRU: B, A', 'Map keys: A, B']],
      ['Get A', 'Use the map’s node reference to move A to the front.', ['List MRU → LRU: A, B', 'Map keys: A, B']],
      ['Put C', 'Evict B from both structures and insert C as most recent.', ['List MRU → LRU: C, A', 'Map keys: A, C']])]
  },
  31: {
    title: 'Discover a shortest route with BFS',
    question: 'Track the queue and parent links as the traversal reaches D.',
    scenarios: [caseOf('Edges A–B, A–C and C–D',
      ['Start at A', 'Discover A and enqueue it at distance 0.', ['Queue: [A]', 'Distance: A → 0']],
      ['Process A', 'Discover B and C and store A as their parent.', ['Queue: [B, C]', 'Distance: B, C → 1']],
      ['Process B then C', 'B adds nothing. C discovers D and records the parent link.', ['Queue: [D]', 'Parent of D: C']],
      ['Return the path', 'Trace parents backward from D and reverse the path.', ['Path: A → C → D', 'Distance: 2']])]
  },
  33: {
    title: 'Separate identity from permission',
    question: 'A valid token can authenticate U2. Trace what happens when U2 requests U1’s booking.',
    scenarios: [
      caseOf('Booking owner',
        ['Authenticate', 'Validate the trusted credential and establish U1 as principal.', ['Principal: U1']],
        ['Authorize', 'The scope allows booking reads and U1 owns this booking.', ['Resource owner: U1', 'Allowed: yes']],
        ['Return data', 'Return only the fields permitted for the caller.', ['HTTP example: 200']]),
      caseOf('Different signed-in user',
        ['Authenticate', 'Validate the trusted credential and establish U2 as principal.', ['Principal: U2']],
        ['Authorize', 'The broad scope allows booking reads, but the ownership rule rejects this resource.', ['Resource owner: U1', 'Allowed: no']],
        ['Do not disclose', 'Return the configured denial without any booking content.', ['HTTP example: 403']])
    ]
  },
  36: {
    title: 'Two checks on structured model output',
    question: 'Compare valid JSON with a grounded claim. Where does an unsupported refund window get rejected?',
    scenarios: [
      caseOf('Supported answer',
        ['Candidate', 'The model returns a typed answer and citation P1.', ['Claim: two hours']],
        ['Schema validation', 'Fields, types and allowed output shape are correct.', ['Schema: pass']],
        ['Grounding check', 'Passage P1 supports the exact claim.', ['Grounding: pass']],
        ['Display', 'The application returns the accepted answer and citation.', ['Result: show answer']]),
      caseOf('Valid shape, unsupported claim',
        ['Candidate', 'The model cites P1 and gives a different refund window.', ['Claim: 24 hours']],
        ['Schema validation', 'The shape remains valid, so parsing succeeds.', ['Schema: pass']],
        ['Grounding check', 'P1 says two hours. The generated claim is unsupported.', ['Grounding: fail']],
        ['Fallback', 'The Java boundary returns the agreed help fallback.', ['Result: show fallback']])
    ]
  },
  39: {
    title: 'Follow a grounded RAG answer',
    question: 'Compare an answerable policy question with a question whose evidence is unavailable.',
    scenarios: [
      caseOf('Relevant passage found',
        ['Question', 'A customer asks about the cancellation window.', ['Input: policy question']],
        ['Retrieve', 'A relevant current policy passage P2 enters the top results.', ['Evidence: P2']],
        ['Generate candidate', 'The model proposes an answer constrained by the supplied evidence.', ['Candidate citation: P2']],
        ['Validate and return', 'The Java service checks the claim and provided source ID, then returns the supported answer.', ['Result: verified source citation']]),
      caseOf('Missing evidence',
        ['Question', 'A customer asks about a discount that has no entry in the policy.', ['Input: unsupported question']],
        ['Retrieve', 'Search can find adjacent text without any passage supporting the claim.', ['Relevant evidence: none']],
        ['Validate and fall back', 'The application handles insufficient evidence and preserves a deterministic booking path.', ['Result: help fallback']])]
  },
  41: {
    title: 'The model proposes and the Java application authorizes',
    question: 'Follow a read-only tool request across the permission and validation boundary.',
    scenarios: [caseOf('Read a permitted policy',
      ['Model proposal', 'The model proposes lookupPolicy with an argument.', ['Argument: VENUE-1']],
      ['Application check', 'The application validates the ID and checks the authenticated caller’s allowed venue.', ['Decision owner: Java authorization']],
      ['Tool execution', 'The permitted tool returns the narrow policy excerpt as data.', ['Operation: read only']],
      ['Answer check', 'The application validates the final answer against the tool result.', ['Authority: supplied policy, not model output']])]
  },
  47: {
    title: 'Find the Spring proxy boundary',
    question: 'Switch between an external call and self-invocation. Track whether transactional advice runs.',
    scenarios: [
      caseOf('Controller calls a Spring bean',
        ['Controller', 'An injected SchedulerService bean receives the external method call.', ['Call: across bean boundary']],
        ['Spring proxy', 'The proxy intercepts the annotated method and opens or joins the transaction.', ['Transactional advice: active']],
        ['Failure', 'An unchecked exception triggers rollback using the default applicable rollback rule.', ['Result: roll back transactional writes']]),
      caseOf('One method calls another on the same instance',
        ['Caller enters bean method', 'A method executes on the object behind the proxy.', ['Invocation: inside target']],
        ['Self-invocation', 'The call to the annotated method stays on that object.', ['Transactional advice for inner call: bypassed']],
        ['Observe boundary', 'Any transaction from the outer call still applies. If there is none, the inner annotation alone does not open one in proxy mode.', ['Inspect: outer transaction and committed row']])
    ]
  },
  49: {
    title: 'Compare real-time updates with URL redirects',
    question: 'Trace which state is durable, which is delivered to the browser, and where a reconnect or cache hit changes the flow.',
    scenarios: [
      caseOf('Live seat availability',
        ['Browser subscribes', 'The browser opens a server-sent events stream for its venue.', ['Direction: server to browser']],
        ['Gateway routes', 'The gateway routes the stream and applies connection and coarse rate limits.', ['Protocol: SSE']],
        ['Event arrives', 'An availability update carries an event ID and updates the display.', ['Display: advisory']],
        ['Browser reconnects', 'Resume from the last event ID if replay is supported, otherwise retrieve a fresh snapshot.', ['Authority: booking API and datastore']]),
      caseOf('URL shortener',
        ['Browser requests slug', 'A GET request reaches the redirect route for a short identifier.', ['Lookup key: slug']],
        ['Cache lookup', 'The redirect service checks a cached slug mapping before querying the key store.', ['Cache hit can avoid a database read']],
        ['Return redirect', 'The handler sends a redirect with a destination. The browser navigates to that destination.', ['Durable state: slug mapping']])
    ]
  },
  50: {
    title: 'Transactional outbox after a relay crash',
    question: 'Find where atomicity ends and duplicate delivery is possible.',
    scenarios: [caseOf('Publish, crash, replay',
      ['Commit booking and outbox', 'The client’s booking write and event row commit in one DB transaction.', ['Booking: durable', 'Event record: durable']],
      ['Relay publishes', 'The relay sends E24 to the broker.', ['Delivery: E24']],
      ['Relay crashes', 'The process stops before saving publication progress, so E24 is retried.', ['Possible duplicate: E24']],
      ['Consumer deduplicates', 'The consumer couples the event ID check with the effect it owns.', ['Expected local effect count: 1']])]
  },
  53: {
    title: 'See update order change subset-sum behavior',
    question: 'Use one item of weight 3. Switch iteration direction and check whether sum 6 becomes reachable.',
    scenarios: [
      caseOf('Descending order (0/1)',
        ['Start', 'Only total zero is reachable before processing the item.', ['Reachable: {0}']],
        ['Check sum 6', 'The prior value of reachable[3] is false, so 6 remains unreachable.', ['Reachable: {0}']],
        ['Check sum 3', 'The prior total zero enables this update.', ['Reachable: {0, 3}']]),
      caseOf('Ascending order (reuse)',
        ['Start', 'Only total zero is reachable.', ['Reachable: {0}']],
        ['Check sum 3', 'Processing the item sets reachable[3].', ['Reachable: {0, 3}']],
        ['Check sum 6', 'The same iteration can now use the new reachable[3]. This allows reuse of the item.', ['Reachable: {0, 3, 6}']])
    ]
  },
  54: {
    title: 'Compare model adapters and protect booking',
    question: 'Choose a model path and trace what determines the help response while PostgreSQL still owns booking.',
    scenarios: [
      caseOf('Fixture adapter',
        ['Ask policy question', 'The Java application sends the question through the same adapter contract.', ['Provider: test fixture']],
        ['Validate candidate', 'A deterministic response allows repeatable validation and a known latency baseline.', ['Measures: supported result and expected fallback']],
        ['Continue booking', 'Booking effects continue through the database’s ordinary rule.', ['Booking authority: PostgreSQL']]),
      caseOf('Live adapter timeout',
        ['Ask policy question', 'The Java adapter calls the configured local or hosted provider within its deadline.', ['Provider: live model']],
        ['Return help fallback', 'The provider misses the deadline. The application records that failure and returns a deterministic help fallback.', ['Help result: fallback']],
        ['Continue booking', 'The independent booking path still uses PostgreSQL and can complete normally.', ['Booking authority: PostgreSQL']])]
  },
  55: {
    title: 'Trace roots as Kruskal builds a forest',
    question: 'Track which edges are accepted and why duplicate or cycle edges keep the component count unchanged.',
    scenarios: [
      caseOf('Cycle edge and isolated zone',
        ['Start with four roots', 'Each zone begins alone.', ['Components: 4', 'Total cost: 0']],
        ['Accept 0–1', 'The roots differ so the edge connects two components.', ['Components: 3', 'Total cost: 1']],
        ['Skip duplicate 0–1', 'Both endpoints already have the same root.', ['Components: 3', 'Total cost: 1']],
        ['Accept 1–2', 'Zone 2 joins the component containing zones 0 and 1.', ['Components: 2', 'Total cost: 3']],
        ['Skip 0–2 and finish', 'This edge would close a cycle. Zone 3 remains isolated.', ['Components: 2', 'Total cost: 3']])]
  }
};
