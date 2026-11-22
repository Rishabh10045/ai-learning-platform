export const practiceNotes = {
  26: {
    sections: [
      ['Translate a task into an input measure',
        'State what n represents, what work counts and which inputs are allowed. An array provides direct indexing, while inserting near the front can shift many elements. A pass over n booking events that performs constant work per event takes linear time. Counting frequencies adds a map whose size depends on the number of distinct keys.'],
      ['Analyze a running example',
        'Calculate each event’s contribution to totals as you scan. Decide whether you need every intermediate value or only the final aggregate. A prefix array pays linear preprocessing time and space so a range sum can be answered by subtracting two prefix values. For a single range query, the setup may cost more than a direct scan.'],
      ['Name the limiting case',
        'Worst-case cost is the maximum over inputs of a fixed size under an explicit cost model. Big-O is an upper bound and Big-Theta is a tight bound on the growth of the cost function. Expected performance needs an input or hashing assumption. Auxiliary space counts additional working memory, and output storage may be reported separately. Hashing a long string can make a single lookup depend on key length even if bucket access is fast.'],
      ['Write the recursive contract before the call',
        'A recursive method solves a smaller instance of its own problem. Define the legal input, the result the method promises, a directly solvable base case and the measure that decreases toward that case. For the sum of the first n positive integers, use a nonnegative n, return zero at n = 0 and otherwise add n to the result for n − 1.',
        'For sumTo(3), Java suspends frames for 3, 2 and 1 while their child calls run. sumTo(0) returns 0. Control unwinds back through the waiting frames, producing 1, 3 and 6. Each frame remembers its own argument and where to continue. There are O(n) calls and O(n) simultaneous frames. An iterative sum has O(1) auxiliary space. Deep recursion can exhaust the JVM stack.'],
      ['Compare a single recursive path with repeated branching',
        'For factorial, use 0! = 1. Each nonbase call makes a single request for the factorial of n − 1. For Fibonacci use F(0) = 0 and F(1) = 1. A call for F(5) makes requests for F(4) and F(3). The F(4) branch already computes F(3), so the naïve implementation repeats work. The number of calls grows exponentially while the maximum depth grows linearly.',
        'Run factorial with 0, 1 and 5 and Fibonacci with 0, 1 and 6. The expected values are 1, 1 and 120 for factorial and 0, 1 and 8 for Fibonacci. Reject negative inputs at the public entry point. Use these small fixtures for tracing. An exact factorial stored in a signed Java long can represent at most 20!. Memoization can eliminate repeated Fibonacci results and an iterative loop can avoid the recursion stack.']
    ],
    quick: ['Define n and the operation cost.', 'Separate output size from working space.', 'Explain the input that reaches the bound.', 'Identify the base case, decreasing measure and maximum stack depth.'],
    variation: 'You receive thousands of repeated range-count queries over an unchanged event array. What preprocessing pays for itself?',
    check: 'Implement a scan and two small recursive functions. Derive the scan bounds and explain the difference between total recursive calls and maximum simultaneous stack frames.'
  },
  27: {
    sections: [
      ['Maintain a window invariant',
        'A two-pointer method works when movement preserves a useful property. In a distinct-ID window, the current span contains each ID at most once. When a duplicate enters, advance the left endpoint until the property returns. Track counts or last positions so the rule is explicit. In a last-position implementation the left endpoint never moves backward.'],
      ['Trace the cost of both pointers',
        'For [A, B, A, C], the second A forces the left edge past the first A. The longest distinct span is [B, A, C]. Even with a nested loop, each boundary traverses the array at most once. With expected constant membership bookkeeping, the total expected work is linear.'],
      ['Binary search a boundary',
        'Binary search needs a sorted order or a monotone predicate. Define what remains true about the answer interval at the start of every iteration. A lower-bound search finds the first index where a predicate becomes true. Test the empty input, all-false input, duplicates and a one-element interval.']
    ],
    quick: ['Name the condition the window preserves.', 'Each boundary advances at most n positions.', 'Binary search needs a monotone boundary.'],
    variation: 'The same ID appears once outside the current window. How should its recorded position influence your left boundary?',
    check: 'Trace a duplicate window and a lower-bound search with explicit interval invariants.'
  },
  28: {
    sections: [
      ['Work through sorting trade-offs',
        'Merge sort splits an input into halves, sorts them and merges their ordered outputs. For an array it runs in O(n log n) time with O(n) temporary storage in a standard implementation. A stable merge chooses the left item on equality. Quicksort can use less auxiliary array storage but the pivot and partition scheme affect worst-case time and stack depth.'],
      ['Update links in a safe order',
        'A singly linked list exposes the next reference. Reversal keeps references to the reversed prefix, current node and remaining suffix. Save the next node before changing the current link. Write down what each reference owns after every iteration and use an empty list and a singleton as boundary tests.'],
      ['Use a stack for nested structure',
        'In delimiter validation, opening tokens go on the stack. A closing token consumes a compatible opener. A mismatch or an unmatched opener at the end means the sequence is invalid. In Java, ArrayDeque is usually an appropriate stack structure when null elements are unnecessary.']
    ],
    quick: ['Merge-sort stability depends on tie handling.', 'Save next before rewiring.', 'Validate paired delimiters with LIFO order.'],
    variation: 'Two records have the same sort key and must preserve arrival order. What change to tie handling would break the requirement?',
    check: 'Explain one sorting decision, a three-node reversal and a mismatched bracket case.'
  },
  29: {
    sections: [
      ['Combine a map and a double-ended order',
        'The map returns the exact node for a key. A doubly linked list orders nodes from most to least recently used. Given a node reference, unlink it by updating both neighbors, then reinsert at the most-recent end. Sentinel nodes can simplify head and tail branches. Reading a hit changes recency and therefore mutates the cache.'],
      ['Preserve a fixed-capacity invariant',
        'Every real node must appear once in the map and once in the list. An update of an existing key changes its value and recency without changing size. A new key at capacity evicts the least-recent node from both structures. Define behavior for zero capacity if your API permits it.'],
      ['Trace a two-slot cache',
        'Put A, put B, get A and put C. A becomes most recent after the read, so B is evicted. Separate tests cover updating A, looking up a missing item and capacity one. Under a healthy hash distribution the operations are expected O(1) and storage is O(capacity).']
    ],
    quick: ['The map stores node references.', 'A hit changes recency.', 'Evict from the list and map together.'],
    variation: 'Two threads call get on one cache at the same time. Which part of get needs coordination?',
    check: 'Run a size-two sequence and explain why a node reference avoids a linear list search.'
  },
  30: {
    sections: [
      ['Trace recursive traversal',
        'A recursive visit has a base case and a smaller subtree on every call. In preorder the node is processed before children, in inorder it lies between them and in postorder it is processed after them. Inorder traversal gives sorted order for a BST under its key policy. A skewed tree can require linear stack depth.'],
      ['Use a heap for a streaming top-k',
        'A binary heap maintains a partial order that gives quick access to the top. To retain the k smallest values from a stream, use a bounded max-heap so the current largest retained item is available for replacement. Each update takes O(log k) in the worst case and the heap uses O(k) space. Heap iteration does not imply sorted output.'],
      ['Choose between ordered structures',
        'A balanced search tree supports ordered lookup and range traversal. A heap emphasizes repeated access to one extreme. For a simple aggregate such as minimum, one variable can do the job. Match the structure to the operations the task actually needs.']
    ],
    quick: ['Recursion space depends on depth.', 'Inorder on a BST follows its key order.', 'A bounded max-heap retains k smallest values.'],
    variation: 'The final k results must be sorted and stable for ties. What work remains after maintaining the heap?',
    check: 'Trace a traversal and show replacement behavior for a top-k fixture.'
  },
  31: {
    sections: [
      ['Represent vertices and edges',
        'An adjacency list is suitable for sparse graphs because it stores visible edges. BFS uses a queue and visits vertices in nondecreasing unweighted distance from the source. Mark nodes when enqueued so repeated edges cannot add duplicates. Record parents if the output includes the path and not just the distance.'],
      ['Choose depth-first exploration for structure',
        'DFS descends until a path is exhausted before backtracking. It is useful for connected components and for analyzing dependency structures with the appropriate state. In an undirected graph, a visited neighbor other than the parent can indicate a cycle. Directed cycle detection distinguishes active nodes from completed ones.'],
      ['Handle unreachable vertices',
        'Starting one traversal at a source explores only vertices reachable from that source. Count components by launching from each remaining unvisited vertex when appropriate. With adjacency lists, a full traversal visits vertices and edges in O(V + E) time.']
    ],
    quick: ['BFS gives fewest edges in an unweighted graph.', 'Mark discovered nodes when enqueuing.', 'One start may not reach every vertex.'],
    variation: 'Some connections have travel costs of five and others cost one. Does the first BFS route still minimize the total cost?',
    check: 'Show a BFS parent route and a DFS component count on a graph with an isolated node.'
  },
  32: {
    sections: [
      ['Explain why a greedy choice works',
        'To maximize the number of non-overlapping intervals of equal value, schedule the interval that finishes earliest among those compatible with the choices already made. An exchange argument replaces the first interval in an optimal solution with the earliest-finishing compatible one without reducing future options. Specify whether adjacent endpoints can share a boundary.'],
      ['Use a recurrence when choices interact',
        'When intervals have different values, early finishing can sacrifice one high-value interval. Sort by finish time and find the last compatible prior interval for each item. An optimal prefix either excludes that item or includes its value plus the optimum for its compatible predecessor. The recurrence records exactly which subproblems are reusable.'],
      ['Test a counterexample and reconstruct choices',
        'Use one long high-value interval and two short low-value intervals as a first test. Record the greedy and DP results. Keep choices or backtrack through the computed table if the assignment requires the selected intervals.'],
      ['Check the precondition behind greedy coin change',
        'The GFG class lists a greedy coin-change exercise. Taking the largest available coin finds an optimal count only for suitable denominations. For denominations 1, 3 and 4 and target 6, largest-first gives 4+1+1, while 3+3 uses fewer coins. A correct general minimum-coin solution for positive denominations and unlimited copies uses dp[0] = 0 and the smallest reachable dp[total−coin] + 1. Keep unreachable values distinct from zero and test target 0 and an impossible target such as 3 with only coin 2.']
    ],
    quick: ['A greedy method needs an exchange or similar proof.', 'Weighted intervals need a different recurrence.', 'Clarify endpoint compatibility.'],
    variation: 'Bookings must include a ten-minute reset after each interval. How does that change the compatibility rule?',
    check: 'Produce a counterexample to the weighted greedy rule and explain the DP state and transition.'
  },
  33: {
    sections: [
      ['Authenticate the caller and authorize the action',
        'Authentication establishes an identity. Authorization asks whether that identity can act on a given resource. A request to read a booking needs a check tied to the booking’s owner or a permitted role. The caller’s asserted user ID should not determine authority. Derive identity from the authenticated context.'],
      ['Protect the service boundary',
        'Spring Security can enforce a broad endpoint rule and method-level policies can protect more specific operations. The repository query or service check can constrain the booking by caller identity. Choose stable response semantics. Unauthenticated access generally returns 401 and insufficient permission typically returns 403, with 404 sometimes used by an intentional resource exposure policy.'],
      ['Test with distinct identities',
        'Use fixture users U1 and U2. Create a booking for U1, then test U1, U2 and an unauthenticated caller against the same resource. Assert that error bodies contain no booking data. A positive security test exercises the permitted path alongside the denied paths.']
    ],
    quick: ['Check both identity and permission.', 'Bind authorization to the resource.', 'Test one allowed path and several denied paths.'],
    variation: 'Support staff can view reservations within one assigned venue. Which attribute besides the role should the service check?',
    check: 'Verify unauthorized requests cannot retrieve another user’s booking and explain where the check lives.'
  },
  34: {
    sections: [
      ['Package a reproducible service',
        'A container image includes application layers and runtime dependencies. The running container receives environment-specific configuration, credentials and network addresses at launch. Keep configuration outside the image and pin compatible build/runtime versions in the project. Use a small, documented local setup with one database and predictable ports.'],
      ['Distinguish health, logs, metrics and traces',
        'A liveness signal answers whether the app should keep running. A readiness signal answers whether it should accept traffic now. Structured logs describe specific events. Metrics aggregate observations such as latency, success and errors. A trace links work within a request or operation across components.'],
      ['Walk one request end to end',
        'Set a request identifier, send a booking request and link its response to a log entry and one measurement. Simulate an unavailable dependency and describe how readiness and client responses change. Keep high-cardinality identifiers out of metric label sets.']
    ],
    quick: ['Build immutable images and configure at runtime.', 'Readiness gates traffic.', 'Correlate a request with logs and bounded metrics.'],
    variation: 'The database fails for thirty seconds while the process itself is healthy. What should readiness and liveness report?',
    check: 'Run the packaged service and show one traceable request plus a controlled failure.'
  }
};
