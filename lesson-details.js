export const lessonDetails = {
  1: {
    code: ['Run ClaimTrace.java to verify the booking contract', 'java', `class ClaimTrace {
    static final class Seat {
        private final String id;
        private String owner;

        Seat(String id) {
            if (id == null || id.isBlank()) {
                throw new IllegalArgumentException("Seat ID required");
            }
            this.id = id;
        }

        boolean claim(String user) {
            if (user == null || user.isBlank()) {
                throw new IllegalArgumentException("User ID required");
            }
            if (owner != null) return false;
            owner = user;
            return true;
        }
    }

    static final class BookingService {
        private final Seat seat;

        BookingService(Seat seat) {
            this.seat = java.util.Objects.requireNonNull(seat);
        }

        boolean book(String seatId, String userId) {
            if (!seat.id.equals(seatId)) {
                throw new IllegalArgumentException("Unknown seat");
            }
            return seat.claim(userId);
        }

        String owner() {
            return seat.owner;
        }
    }

    private static void expectRejected(Runnable attempt, BookingService booking, String message) {
        try {
            attempt.run();
            throw new AssertionError("Expected: " + message);
        } catch (IllegalArgumentException error) {
            if (!message.equals(error.getMessage()) || !"U1".equals(booking.owner())) {
                throw new AssertionError("Wrong rejection or owner changed", error);
            }
            System.out.println(error.getMessage());
        }
    }

    public static void main(String[] args) {
        var booking = new BookingService(new Seat("A1"));
        if (booking.owner() != null) throw new AssertionError("A1 should start available");

        boolean first = booking.book("A1", "U1");
        boolean conflict = booking.book("A1", "U2");
        boolean repeat = booking.book("A1", "U1");
        if (!first || conflict || repeat || !"U1".equals(booking.owner())) {
            throw new AssertionError("The first valid claim must remain authoritative");
        }
        System.out.println("first=" + first + ", second=" + conflict + ", owner=" + booking.owner());
        expectRejected(() -> booking.book("Z9", "U3"), booking, "Unknown seat");
        expectRejected(() -> booking.book("A1", "  "), booking, "User ID required");
        expectRejected(() -> booking.book("A1", null), booking, "User ID required");
    }
}`],
    table: {
      title: 'The Day 1 contract', headers: ['Call', 'Expected result', 'Owner afterward'], rows: [
        ['Initial state', 'Available', 'None'], ['A1 with U1', 'true', 'U1'], ['A1 with U2', 'false', 'U1'],
        ['Unknown seat or blank user', 'IllegalArgumentException', 'No change']
      ]
    }
  },
  3: {
    source: ['Java Language Specification · Happens-before order', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5'],
    table: {
      title: 'Choose a concurrency primitive by the guarantee needed', headers: ['Primitive', 'Guarantee used here', 'Limit'], rows: [
        ['volatile owner', 'A later read can observe a published write', 'The availability read and assignment can interleave'],
        ['synchronized', 'Mutual exclusion and visibility with the same monitor', 'Scope is threads sharing that monitor'],
        ['AtomicReference.compareAndSet', 'Atomic transition from an expected reference', 'Compound invariants may require a broader boundary']
      ]
    }
  },
  4: {
    section: ['Start with the type contract before using a map',
      'A collection type tells its callers which values are legal. Set<SeatId> accepts SeatId values, while Map<SeatId, String> uses a SeatId as the key and a String as the owner label. The compiler rejects assigning an ordinary String to that key position. Read the type arguments before writing a put or get call.',
      'Generics are invariant. A List<String> cannot be assigned to List<Object>, since the latter would allow inserting an Integer into the former. For a method that only reads names from a source list, use List<? extends CharSequence>. For a method writing Strings to a destination, use List<? super String>. Think producer extends, consumer super. Day 6 revisits bounds, erasure, and typed stream transformations.'],
    source: ['Dev.java · Introducing generics', 'https://dev.java/learn/generics/']
  },
  7: {
    section: ['Separate a timed wait from cancellation',
      'When Future.get times out, control returns to the caller. The worker may still be queued, blocked on I/O, or about to commit a booking. Calling cancel(true) can request interruption. Application code and the driver determine whether blocking work actually stops. Give the driver its own deadline and decide how the client can look up an ambiguous write outcome.',
      'To reproduce the distinction, hold one task behind a latch until get reaches its time limit. Release the latch and collect the final result with another bounded get. Then run a separate cooperative cancellation case. Always release the latch and shut the executor down in the test cleanup.'],
    source: ['Oracle Java 21 · Future timeouts and cancellation', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Future.html#get(long,java.util.concurrent.TimeUnit)']
  },
  8: {
    section: ['Design patterns at a useful boundary',
      'Use an Adapter when a vendor API or storage implementation needs to satisfy your local interface. Use Strategy when two valid policies share a stable contract, such as different read-ranking policies for a help feature. State is useful when permitted operations depend on the current lifecycle, such as held, booked or expired. Start with the simplest code that expresses the invariant. Add a pattern when a real change justifies another abstraction.',
      'SOLID review is practical here. Single responsibility separates reasons for change. Open–closed favors an extension seam when there is a known variation. Liskov substitution requires implementations to honor the caller’s contract. Interface segregation keeps a caller’s interface narrow. Dependency inversion lets domain code depend on the operation it needs.'],
    source: ['LLD roadmap · Design patterns and SOLID', 'https://rishabh10045.github.io/studyapp/lld/roadmap.html']
  },
  9: {
    source: ['Spring Framework · Constructor-based dependency injection', 'https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html']
  },
  11: {
    section: ['Map failures at the boundary that can explain them',
      'Separate a syntax error from a valid command that fails a business rule. Invalid JSON never produces a DTO. A bound DTO missing a required identifier also fails before the claim. This API uses 400 for both, with separate stable error codes. A valid command can still find no matching resource (404) or find the seat but lose to an existing owner (409). If authorization fails, follow the resource policy before exposing whether the seat exists.',
      'For a controller test, send all four cases and inspect status, code and content type. Then call the service directly with a bad argument. That case proves which checks protect import jobs and other internal callers that never execute MVC validation.'],
    source: ['Spring Framework · MVC validation', 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html']
  },
  12: {
    source: ['PostgreSQL · Partial indexes, including partial unique indexes', 'https://www.postgresql.org/docs/current/indexes-partial.html']
  },
  13: {
    section: ['Read Committed, Repeatable Read and Serializable',
      'At PostgreSQL Read Committed, each statement obtains a fresh snapshot of data committed before that statement starts. At Repeatable Read, later statements generally continue with the transaction snapshot, so a re-read can still show the old value. PostgreSQL may abort some concurrent updates at the stronger levels. At Serializable, successful transactions must be consistent with some serial order. Serialization failures require retrying the whole transaction with a bounded policy.',
      'Run this comparison with separate connections. Read on B, commit a change on A, then read again on B. Repeat with a fresh B transaction and change the isolation level explicitly. Record both observed values and the boundary that established the snapshot.'],
    source: ['PostgreSQL · Transaction isolation', 'https://www.postgresql.org/docs/current/transaction-iso.html']
  },
  15: {
    table: {
      title: 'Compare ways to enforce a booking decision', headers: ['Approach', 'Where conflict appears', 'Useful when'], rows: [
        ['Conditional UPDATE', 'Affected-row count reports whether the predicate matched', 'The transition fits one guarded database statement'],
        ['Pessimistic row lock', 'A competing transaction waits or fails under its lock policy', 'The decision needs several operations on the locked state'],
        ['Optimistic version', 'A stale update affects zero rows or raises an optimistic-lock error', 'Conflicts are uncommon and retry is affordable']
      ]
    }
  },
  16: {
    section: ['Trace SQL before choosing a fetch plan',
      'Suppose a query returns four bookings with different owners. It can issue one query for bookings and four more when code accesses the lazy owner objects. Confirm by starting with a fresh persistence context, controlling caches and capturing SQL around the actual read path. A test using one owner per fixture or warm entities can hide the extra queries.',
      'A use-case-specific projection can read exactly the fields the endpoint needs. A fetch join or batch fetching can also help, with different trade-offs. Joining a to-many association may expand database rows and complicate pagination. Compare query counts and assert identical API results, including a representative page boundary.'],
    source: ['Hibernate ORM · Fetching strategies', 'https://docs.hibernate.org/orm/6.6/userguide/html_single/#fetching']
  },
  18: {
    code: ['Convert assumptions into comparable units', 'text', 'visitors per second = visitors during rush / rush seconds\nread requests per second = visitors per second × reads per visitor\nwrite attempts per second = visitors per second × booking conversion\n\nThen estimate the load on the busiest event or seat separately.']
  },
  19: {
    section: ['Keep expiry inside the state transition',
      'Represent each hold with a stable hold ID, owner, expiration timestamp and optionally a version. Confirmation for H1 must match H1, its owner and the live hold condition in the same write. When H1 expires, another request can replace it with H2. A delayed confirmation or cleanup for H1 must fail the identity or version check even if it still knows the seat ID.',
      'For a confirmation arriving exactly at expiration, use the same authoritative clock and strict comparison specified in your contract. In PostgreSQL, CURRENT_TIMESTAMP is fixed at transaction start. Choose and test the clock function for the boundary you intend. Use a controllable clock in the business-rule test before testing storage behavior.']
  },
  20: {
    section: ['Follow a retry after a response disappears',
      'At the first attempt, the service associates the logical request with a key scoped to the authenticated caller and operation. Within one transaction it coordinates the key record with the booking effect and stores the result needed for replay. If two identical requests arrive together, the unique key or equivalent coordinator decides which one processes the effect. The other retrieves the outcome or receives a documented in-progress response.',
      'After commit, drop the success response in the test. A retry with the same key and semantic payload should replay that outcome and leave one booking. Change the payload while keeping the key and verify a separate conflict. Document retention because a late retry may need an independent booking lookup.']
  },
  21: {
    table: {
      title: 'Separate database scaling options', headers: ['Choice', 'What changes', 'Risk to discuss'], rows: [
        ['Read replicas', 'Additional copies serve allowed reads', 'Asynchronous replication can return stale availability'],
        ['Partitioning', 'A logical table is split into partitions', 'Queries that ignore the partition key may visit many partitions'],
        ['Sharding', 'Different nodes own different slices', 'A hot shard and cross-shard transactions need explicit design']
      ]
    }
  },
  26: {
    section: ['A complete complexity statement',
      'Specify what you counted before stating Big O. A two-loop method that moves two monotone pointers can still be linear in n. A HashMap loop is expected linear in n under a suitable hash and bounded key-processing cost. Sorting a collection before scanning usually changes the dominant bound to O(n log n). Amortized cost is different from average case. It distributes occasional expensive operations, such as array growth, over a sequence of operations.',
      'Try one extra fixture where nearly all IDs are identical and another where all are distinct. Record both the number of observations and the number of stored keys. This exposes how space can depend on distinct values even when the iteration count is the same.'],
    source: ['Princeton Intro to Programming in Java · Recursion', 'https://introcs.cs.princeton.edu/java/23recursion/'],
    code: ['Run SumTrace.java and read the calls from top to bottom', 'java', `class SumTrace {
    static long sumTo(int n) {
        if (n < 0) throw new IllegalArgumentException("n must be nonnegative");
        System.out.println("enter " + n);
        long result = n == 0 ? 0 : n + sumTo(n - 1);
        System.out.println("return " + n + ": " + result);
        return result;
    }

    public static void main(String[] args) {
        if (sumTo(3) != 6) throw new AssertionError("sumTo(3)");
    }
}`]
  },
  27: {
    section: ['Prove a lower bound with a half-open interval',
      'The target predicate on a sorted array is values[i] ≥ target. Every position before the boundary is false and every position from the boundary onward is true. Start with lo=0 and hi=values.length. If values[mid] is at least target, keep mid as a possible answer by setting hi=mid. Otherwise all positions through mid are too small, so set lo=mid+1.',
      'For [2,4,4,7] and target 4, the first mid is 2. Retain the left side including the boundary at 2, then move hi to 1 and discard index 0. The algorithm returns 1. With target 9 every comparison discards a prefix and the final index equals the length. Arbitrary availability flags do not form the monotone predicate this proof requires.',
      'The recursive form makes one smaller call with (lo, mid) after a qualifying value or (mid + 1, hi) after a value below target. The base case lo == hi returns lo. The search interval shrinks by about half per step, so both implementations take O(log n) time. The recursive version holds O(log n) frames and the iterative version keeps O(1) auxiliary state. For exact search, check that the returned index is within bounds and its value equals the target. For an absent target, return −1.']
  },
  29: {
    section: ['Compare the practice implementation with Java’s collection',
      'The exercise uses a map and a separate doubly linked list so you can see the ownership of each node and its links. In production Java, compare this with an access-ordered LinkedHashMap and a capacity policy. A successful get changes encounter order in access-order mode. If several threads share a cache, the entire operation needs a concurrency strategy that preserves both lookup and recency.'],
    source: ['Java 21 · LinkedHashMap access order', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html']
  },
  31: {
    section: ['Extend BFS to multiple sources',
      'Put every source in the initial queue with distance zero and mark them discovered. The first visit to a vertex gives the minimum number of edges from any source in an unweighted graph. For an exercise, treat several entrances as sources and compute the distance of each reachable seat from its nearest entrance. Include an isolated vertex and two entrances tied at the same distance. If the path must prefer one entrance, specify the tie-breaking rule.']
  },
  32: {
    source: ['Princeton · Weighted interval scheduling and dynamic programming', 'https://www.cs.princeton.edu/~wayne/kleinberg-tardos/pdf/06DynamicProgrammingI.pdf']
  },
  36: {
    code: ['Two candidates with identical shape', 'json', '[\n  { "answer": "Two hours", "sourceIds": ["P1"], "answerable": true },\n  { "answer": "24 hours", "sourceIds": ["P1"], "answerable": true }\n]']
  },
  38: {
    section: ['When to move from fixtures to a vector database',
      'A tiny set of Java fixture vectors makes ranking errors easy to inspect. With more passages, store the embedding, source ID, version, scope and content together or under a stable join key. With PostgreSQL and pgvector, start with exact nearest-neighbor results as a reference. Compare an approximate HNSW search only after defining a retrieval quality and latency target. Test scope and version filters independently of similarity.',
      'Keep the Java code responsible for query context and evaluating the retrieved IDs. A newer embedding model may produce vectors of a different dimension or space. Re-embed documents and queries consistently before comparing ranking results.'],
    source: ['pgvector · Exact, approximate and filtered nearest-neighbor search', 'https://github.com/pgvector/pgvector']
  },
  40: {
    section: ['Read three evaluation results without mixing denominators',
      'Suppose eight of ten answerable questions retrieve a required passage, seven of those eight produce a fully supported claim, and three of four unanswerable questions correctly get the fallback. Report retrieval hit rate as 8/10. Report grounding conditional on retrieval as 7/8 and end-to-end answerable success as 7/10 if the two misses failed. Report correct abstention as 3/4 on unanswerable questions.',
      'Record why each case failed. The two misses suggest examining metadata, chunks or ranking. A wrong claim with suitable context suggests inspecting the model output and validator. An incorrect answer without evidence exposes the fallback guard. Keep those categories when comparing two Java pipeline versions.']
  },
  42: {
    source: ['OWASP · Top 10 for LLM applications', 'https://github.com/OWASP/www-project-top-10-for-large-language-model-applications']
  },
  46: {
    section: ['Add a JVM memory model to your diagnosis',
      'The JVM loads classes and metadata separately from ordinary heap objects. Each thread’s frames hold local values and references, which may refer to shared objects. Garbage collectors reclaim objects no longer reachable through the roots of the runtime. A close correlation between heap growth, GC activity and request latency needs different investigation from several threads stuck behind one monitor.',
      'Start with a controlled sample and a measurement question. Use jcmd Thread.print to examine platform-thread stacks and monitor contention. For virtual threads, check the tooling supported by your JDK, such as Thread.dump_to_file in JDK 21. Compare two snapshots and describe the evidence before choosing a fix.'],
    source: ['Dev.java · Virtual threads', 'https://dev.java/learn/new-features/virtual-threads/']
  },
  48: {
    section: ['Trace Authorization Code with PKCE',
      'In a browser or public-client flow, the client creates a code verifier and a derived challenge. The authorization server returns a short-lived code to the registered redirect URI after the user authorizes access. At token exchange the client presents the original verifier, which lets the server check that the requester belongs to the original flow. The resource server uses the access token to authorize its own API.',
      'Follow the state and nonce rules appropriate to the OAuth and OIDC flow. State binds the callback to the initiating browser session. When used, the OIDC nonce helps bind an ID token to the authentication request. Treat the configured issuer, audience, lifetime and allowed algorithms as resource-server policy.'],
    source: ['RFC 7636 · Proof Key for Code Exchange', 'https://www.rfc-editor.org/rfc/rfc7636']
  },
  49: {
    table: {
      title: 'Choose a protocol for the interaction', headers: ['Need', 'Starting choice', 'Decision to explain'], rows: [
        ['Create or read a booking', 'HTTP REST', 'Status, retries and resource contract'],
        ['One-way availability stream to a browser', 'Server-sent events', 'Reconnect, replay and snapshot fallback'],
        ['Interactive messaging in both directions', 'WebSocket', 'Presence, resumption and message persistence'],
        ['Typed service-to-service calls', 'gRPC', 'Schema evolution, deadlines and client support']
      ]
    }
  },
  53: {
    code: ['Compare update direction in a 0/1 exercise', 'text', 'Before item 3: reachable = {0}\nDescending order: inspect sum 6 before sum 3, so 6 stays false.\nAscending order: sum 3 becomes true before checking 6, so the item can be reused.']
  },
  54: {
    table: {
      title: 'Compare providers using the same Java interface', headers: ['Adapter', 'Main advantage', 'Check before choosing'], rows: [
        ['Deterministic fixture', 'Reproducible unit and integration tests', 'Covers flow and validators, leaving model quality unmeasured'],
        ['Local Ollama model', 'Direct control over deployment environment', 'Warm-up, memory, support for structured output and latency'],
        ['Hosted model', 'Provider handles model serving', 'Cost, data handling, rate limits, latency and availability']
      ]
    }
  },
  55: {
    source: ['Princeton · Minimum Spanning Trees', 'https://algs4.cs.princeton.edu/43mst/'],
    code: ['Run Connectivity.java', 'java', `import java.util.Comparator;
import java.util.List;

class Connectivity {
    record Edge(int first, int second, int weight) {}
    record Forest(long cost, int components, int edges) {}

    static final class UnionFind {
        final int[] parent;
        final int[] size;
        int components;

        UnionFind(int vertices) {
            if (vertices < 0) throw new IllegalArgumentException("Negative vertex count");
            parent = new int[vertices];
            size = new int[vertices];
            components = vertices;
            for (int v = 0; v < vertices; v++) {
                parent[v] = v;
                size[v] = 1;
            }
        }

        int find(int vertex) {
            while (vertex != parent[vertex]) {
                parent[vertex] = parent[parent[vertex]];
                vertex = parent[vertex];
            }
            return vertex;
        }

        boolean union(int first, int second) {
            int rootA = find(first);
            int rootB = find(second);
            if (rootA == rootB) return false;
            if (size[rootA] < size[rootB]) {
                int previousA = rootA;
                rootA = rootB;
                rootB = previousA;
            }
            parent[rootB] = rootA;
            size[rootA] += size[rootB];
            components--;
            return true;
        }
    }

    static Forest kruskal(int vertices, List<Edge> edges) {
        var groups = new UnionFind(vertices);
        long cost = 0;
        int accepted = 0;
        for (Edge edge : edges.stream().sorted(Comparator.comparingInt(Edge::weight)).toList()) {
            if (groups.union(edge.first(), edge.second())) {
                cost += edge.weight();
                accepted++;
            }
        }
        return new Forest(cost, groups.components, accepted);
    }

    public static void main(String[] args) {
        var edges = List.of(new Edge(0,1,1), new Edge(1,2,2),
                            new Edge(0,2,3), new Edge(0,1,1));
        var result = kruskal(4, edges);
        if (!result.equals(new Forest(3, 2, 2))) throw new AssertionError(result);
        System.out.println(result);
    }
}`]
  }
};
