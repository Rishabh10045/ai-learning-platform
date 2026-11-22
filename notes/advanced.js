export const advancedNotes = {
  46: {
    sections: [
      ['Read JVM evidence before changing code',
        'A thread dump captures thread stacks and states at one point in time. BLOCKED often means a platform thread is waiting to acquire a Java monitor. WAITING and TIMED_WAITING cover other coordination mechanisms and do not alone identify a failure. Capture multiple samples and compare lock identity, owner and stack frames. Interpret the evidence in the context of the JVM release and the command used.'],
      ['Choose a concurrency tool deliberately',
        'A ConcurrentHashMap supports safe individual map operations and atomic operations on a key. Multi-key invariants can still require coordination. Semaphore and bounded executor policies limit admitted work. A virtual thread allows cheaper blocking tasks in suitable workloads, while external resources such as database connections must remain bounded.'],
      ['Collect a useful comparison',
        'Run the same synthetic requests with known concurrency and capture wait locations. Compare saturation and timeout behavior before concluding which policy is better. Explain how you would detect a backlog growing while throughput stays flat.']
    ],
    quick: ['Interpret stack state together with the owning operation.', 'A concurrent collection does not protect every compound invariant.', 'Bound scarce downstream resources.'],
    variation: 'One downstream operation times out repeatedly with a huge virtual-thread backlog. What observation would help you choose a semaphore limit?',
    check: 'Capture an interpretable thread dump and compare two controlled concurrency policies.'
  },
  47: {
    sections: [
      ['Understand the proxy boundary',
        'Spring AOP can intercept calls crossing a proxy. Proxy-based transactional advice opens or joins a transaction around a method call. An ordinary call from one method to another on the same instance does not cross that proxy. In default Spring transaction rules, unchecked exceptions cause rollback and checked exceptions can be configured for rollback. Confirm the transaction manager and propagation you use.',
        'JdbcTemplate manages common JDBC plumbing and a RowMapper converts a single result row into a value. Keep query structure explicit and bind the changing values. Name which fields appear in the projection and verify the number of executed queries.'],
      ['Prove commit and rollback through two callers',
        'Execute a transaction through the normal Spring entry point and induce an error after the first write. Observe the state from a separate transaction. Compare with a self-invocation fixture and trace which call encountered the proxy. Logging and a query count help you explain the behavior without assumptions.',
        'When a proxied inner method uses REQUIRED, it joins an existing transaction. If it marks the transaction rollback-only, catching the failure in the outer method does not make the transaction committable. With REQUIRES_NEW, a proxied inner call uses a separate physical transaction. That can preserve independent work, but needs another connection and allows the inner outcome to survive an outer rollback.'],
    ],
    quick: ['Proxy traversal determines whether advice runs.', 'Rollback rules depend on the configured exception policy.', 'A RowMapper maps a result row into an object.'],
    variation: 'A checked exception should roll back both writes, but the first row remains. Which two boundaries would you inspect?',
    check: 'Demonstrate rollback from the production-style entry point and identify the proxy and transaction owner.'
  },
  48: {
    sections: [
      ['Understand the participants and tokens',
        'OAuth 2.0 authorizes a client to call a resource server with a scoped access token. OpenID Connect adds an identity protocol on top of OAuth and supplies an ID token to the client for sign-in. A resource server should validate an access token for the expected issuer and audience, and apply application permissions to the authenticated principal.'],
      ['Bind scopes to booking operations',
        'A token can be structurally valid and still lack permission for a booking. Map scopes or authorities deliberately and check ownership of the specific booking. Test a missing token, wrong audience, expired token and a valid token with an insufficient scope. Use controlled local fixtures or a test identity provider.'],
      ['Explain the service boundary',
        'A gateway may verify parts of the request before forwarding it. The booking service still needs the trusted identity and appropriate authorization checks. Keep raw tokens out of logs and explain how keys and token lifetimes influence validation.']
    ],
    quick: ['Access tokens target a resource server.', 'Check issuer, audience, expiry and permissions.', 'Check resource ownership independently of scope.'],
    variation: 'A token is valid for the help service and arrives at the booking API. Which check distinguishes the intended resource?',
    check: 'Explain OAuth versus OIDC and verify distinct authentication and authorization failures.'
  },
  49: {
    sections: [
      ['Select contracts by interaction shape',
        'REST exposes resources through HTTP semantics. gRPC couples typed service operations with an interface definition and transport conventions. GraphQL lets a client request a specific data shape, while the server still controls data access and query cost. Choose the smallest contract that satisfies latency, schema evolution and client capabilities.'],
      ['Design real-time updates as a separate path',
        'Server-sent events suit one-way server-to-browser streaming. WebSockets support bidirectional communication and require connection lifecycle handling. Clients can reconnect after a gap, so define a cursor or refresh strategy. A notification indicates a state observation. A fresh booking still uses the authoritative API.',
        'Give events stable sequence IDs within a stream. A browser can send Last-Event-ID on an automatic EventSource reconnect if the server supplied IDs. If a client’s cursor is older than retained history, return to a fresh snapshot with a matching cursor. If the snapshot and event cursor are chosen independently, updates between them can be skipped or applied out of order.'],
      ['Apply gateway responsibilities explicitly',
        'A gateway can terminate TLS, route requests and enforce coarse rate limits. Draw which controls remain service-specific. For a chat comparison case, diagram user presence, fan-out and message history. For a URL shortener case, follow the redirect and caching path.']
    ],
    quick: ['Choose a transport from traffic direction and client needs.', 'Define reconnection and replay behavior.', 'Preserve service-level authorization.'],
    variation: 'A browser only receives live seat availability, but occasionally loses connectivity. How should the client reconnect and recover state?',
    check: 'Compare protocol choices and supply a gateway and reconnect diagram for one use case.'
  },
  50: {
    sections: [
      ['Publish through a transactional outbox',
        'A dual write to a database and a broker can fail in between. An outbox stores the event record in the same database transaction as the booking. A polling relay or change-data-capture pipeline later publishes it. A relay can publish successfully and then fail before recording progress. Consumers still need a deduplication strategy.'],
      ['Coordinate across service ownership boundaries',
        'A saga coordinates local transactions and compensating actions when a later step fails. Cancellation or refund represents a new domain action with its own constraints. Circuit breakers prevent repeated calls to a dependency failing at a high rate, and bulkheads limit the spread of resource exhaustion. Use retry budgets and jitter; choose current Resilience4j guidance for the patterns shown with older libraries.'],
      ['Exercise failure modes',
        'Persist a booking and event atomically. Simulate replay and a downstream failure with a local fixture. Show how an event reaches its consumer after retry. Describe what support teams can inspect if a compensation must be retried.']
    ],
    quick: ['An outbox makes the state and event record atomic.', 'Relays can still deliver duplicates.', 'Compensation is a domain operation.'],
    variation: 'Publishing succeeded, but marking the outbox row sent failed. How does the consumer protect its effect on replay?',
    check: 'Show a dual-write failure timeline and the behavior of a replay-safe outbox flow.'
  },
  51: {
    sections: [
      ['Set an SLI and SLO around user outcomes',
        'An SLI defines a measurable ratio, such as successful eligible booking requests divided by all eligible requests. Define eligibility so a legitimate seat conflict is not treated as an outage. An SLO sets the target over a window. An error budget measures how much failure the objective allows and can guide release decisions.'],
      ['Map the deployment path',
        'A CI pipeline builds, tests and packages a versioned artifact. Release gates check readiness and migrations before routing traffic. Plan a rollback and identify schema changes that require forward compatibility. Use a Docker image locally, then compare roles of managed compute, database, object storage and CDN on a cloud diagram.'],
      ['Design evidence for safe operation',
        'Show a metric and alert for a simulated availability failure. Add one performance objective and describe what data you would use for decisions. Separate controlled latency tests, service objectives and contractual guarantees. Deep Kubernetes and multi-region deployment can be pursued as extensions.']
    ],
    quick: ['Count eligible outcomes clearly.', 'Plan rollback and database compatibility.', 'Distinguish service metrics from contractual promises.'],
    variation: 'The service returns fast responses, but database timeouts cause many eligible bookings to fail. Which SLI exposes the problem?',
    check: 'Write a measurable SLO and draw a pipeline with health checks and rollback.'
  },
  52: {
    sections: [
      ['Build a search tree with undo',
        'Backtracking grows a partial assignment, checks a constraint, explores the choices and restores state before visiting the next branch. Prune a branch only when no completion can satisfy the requirement. With a small seating fixture, choose the next person, assign an eligible seat, recurse and remove the assignment before trying another seat. The number of candidates can grow exponentially.'],
      ['Choose among graph problems',
        'Topological sorting orders a directed acyclic graph so every dependency precedes its dependent. If no full order exists, the dependency graph has a cycle. Dijkstra finds shortest paths from a source when edge weights are nonnegative. BFS is simpler for equal-weight edges. Negative edges require a different algorithm with appropriate assumptions.'],
      ['Check small cases before scaling',
        'Trace backtracking on two users and three seats. For the graph, include one unreachable vertex and a cycle in the appropriate tests. State the complexity using number of vertices and edges for the graph and a quantified branching assumption for backtracking.']
    ],
    quick: ['Restore state after every recursive choice.', 'Topological order applies to a DAG.', 'Dijkstra requires nonnegative edge weights.'],
    variation: 'A dependency graph contains a cycle and a second graph contains a negative edge. Which assumption fails in each algorithm?',
    check: 'Verify an enumerate-and-undo trace plus graph cases that expose invalid assumptions.'
  },
  53: {
    sections: [
      ['Use invariants for foundational operations',
        'Euclid’s algorithm preserves the GCD when replacing two integers by the smaller divisor and their remainder. Stop at a zero remainder. For matrix rotation, establish row and column mapping. In a square matrix, a transpose followed by reversing each row gives a clockwise quarter-turn. For a rectangular matrix use correctly sized output or a different in-place representation.'],
      ['Choose a DP state and update order',
        'For 0/1 subset sum, state whether a prefix can achieve a target sum. A compressed one-dimensional update visits sums in descending order so the current item is used at most once. Ascending order allows results from the same item to feed later states and is useful for unbounded reuse. Document what zero and unreachable states mean.',
        'For matrix-chain multiplication, let dimensions p describe matrix i with size p[i] × p[i+1]. Define dp[i][j] as the smallest scalar multiplication cost for matrices i through j. A single matrix costs zero. Splitting after k costs dp[i][k] + dp[k+1][j] + p[i] × p[k+1] × p[j+1]. Fill shorter chains first and minimize over k.',
        'Try 10×30, 30×5 and 5×60. Grouping the first two costs 1,500 + 3,000 = 4,500. Grouping the last two costs 9,000 + 18,000 = 27,000. Both compute the same matrix. With n matrices, trying every split for every interval uses O(n³) time and O(n²) working space.']
    ],
    quick: ['Euclid preserves GCD under the remainder step.', 'Update order changes the subset-sum rule.', 'Compute short intervals before longer ones.'],
    variation: 'Your 0/1 code reports that one item of weight 3 can reach sum 6. Which iteration rule likely caused the result?',
    check: 'Run a GCD and matrix fixture, then trace one DP table and explain its update order.'
  },
  54: {
    sections: [
      ['Compare deployment paths for one Java contract',
        'The application can target a deterministic fixture, a local Ollama instance or a remote model provider through a Java adapter. A fixture proves control flow and failure recovery. A local model changes hardware, warm-up and capacity assumptions. A remote provider changes data handling, latency, quotas and cost. Reuse the same evaluation questions and measure outcomes by adapter.',
        'Model-specific prerequisites belong in setup notes. Java handles prompts, retrieval, grounding, authorization and API integration for the core track. Python tools remain optional for independent training or provider-specific notebooks. A served model can be called from Java even if a separate team trains it in Python.'],
      ['Make the final demonstration reproducible',
        'From a clean fixture, run a valid booking, a conflict, replay after a simulated lost response, one grounded help answer and one provider outage. Record commands and outcomes, then explain why booking continues correctly in each help failure. Close with one design change worth evaluating and one risk that still needs a larger test.']
    ],
    quick: ['Compare adapters on the same questions.', 'State provider setup and deployment trade-offs.', 'Prove core booking through model outage.'],
    variation: 'The local model exceeds the latency budget while the hosted model has tighter data constraints. What would you measure and decide first?',
    check: 'Present a reproducible Java demo with source-backed help, fallback and durable booking evidence.'
  },
  55: {
    sections: [
      ['Track components as links arrive',
        'Suppose four seat zones are independent at first. As new walkways open, users ask whether two zones are connected. Running BFS for every query repeats traversal. Union-Find stores a partition of a fixed set of vertices. The operation find(v) returns a representative of the component containing v. The operation union(a,b) merges the two components if their representatives differ. Its boolean result tells you whether a merge happened.',
        'Start with each vertex as its own root and size one. Link the smaller root to the larger root, update only the surviving root’s size, and decrease the number of components once. Use path compression or path halving during find to shorten future traversals. Representatives can change after a union. Preserve component identity using the current find result. For a sequence of operations after initialization, union by size plus compression gives amortized inverse-Ackermann time per operation and O(V) storage. Ordinary Union-Find supports connectivity queries with edge additions. Deleting a walkway generally needs a different approach.'],
      ['Apply the cycle rule to a weighted undirected graph',
        'Kruskal sorts the edges by weight and starts with an empty forest. For each edge, union its endpoints and keep it only when the union succeeds. When two vertices already share a root, a path between them already exists in the selected forest. Adding the new edge would close a cycle. When roots differ, the lightest available crossing edge is safe by the cut property. For a connected graph, V−1 accepted edges form a minimum spanning tree. For a disconnected graph, return a minimum spanning forest and keep the component count.',
        'Sorting dominates with O(E log E) time and the disjoint-set operations are nearly linear in the number of examined edges. Negative weights are allowed because this is a spanning-cost problem. A minimum spanning tree minimizes the total cost of connecting all vertices. The shortest path between two specific vertices can use a different set of edges. For example, the tree can use edges A–B=2 and B–C=2 even when the direct A–C=3 is the shorter route.'],
      ['Test a duplicate edge and a disconnected graph',
        'For zones 0–3, try edges (0,1,1), (1,2,2), (0,2,3) and a duplicate of (0,1,1). Keep the edges of weight 1 and 2, reject the duplicate and cycle edge, and keep zone 3 alone. The result costs 3 and has two components. Add equal-weight alternatives and assert minimum cost and connectivity. Several different edge sets may have the same minimum cost.'],
    ],
    quick: ['Find before comparing component representatives.', 'Union changes counts only when roots are distinct.', 'Kruskal accepts light connecting edges and returns a forest for disconnected input.'],
    variation: 'Two spanning trees have equal total weight. What should a good test assert?',
    check: 'Run the Java example, then test union invariants, equal weights and disconnected input on your own cases.'
  }
};
