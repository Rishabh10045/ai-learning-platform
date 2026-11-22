// Day 1–2 depth pass (written by Grok on 2026-11-22 while Codex was offline; Codex to review).
// Every Java example here is copied verbatim from notes/java-examples/*.java and was run on JDK 21
// (java <File>.java). Every URL was checked to load (HTTP 200 / YouTube oEmbed) on 2026-11-22.
// Consumers: topic-lessons.js (packets), session-qa.js (choices, extra questions), curriculum.js (blocks),
// lesson-videos.js (videos) and ui/adapters/codex-adapter.js (warm-up + code blocks).

import { lateAssessment, lateDepthPackets, lateDistractors, lateExplanations, lateStretchPlans } from './late-depth.js';

const oracle = 'https://docs.oracle.com/javase/tutorial/';

// Java foundations warm-up: the 12-minute revision slot of Day 1 (there is no previous day to revise).
export const warmupLessons = {
  'j-foundations-01': {
    title: 'Java foundations: objects, constructors and this',
    notes: [
      'A class is a blueprint: it declares fields (state) and methods (behaviour). Each `new Seat("A1")` creates a separate object on the heap with its own copy of the instance fields. A variable of a class type does not hold the object; it holds a reference to it.',
      'Primitives (int, long, boolean, double, char …) are copied by value: after `int b = a; b++;` a is unchanged. Assigning a reference copies only the reference: after `Seat s2 = s1;` both names point at the same object, so a claim through s2 is visible through s1, and `s1 == s2` is true. Use `==` for identity and `equals` for logical equality (Day 4).',
      'A constructor runs once per object and must leave it valid. Validate parameters first, then assign fields. Inside `Seat(String id)`, `id` is the parameter and `this.id` is the field of the object being built; without `this.` the assignment `id = id` would reassign the parameter and leave the final field uninitialized, so Java rejects the constructor. `this(...)` calls another constructor of the same class and must be the first statement in Java 21, so all creation paths share one validation path.',
      'If a class declares no constructor, Java supplies a no-argument default constructor with the class’s access. As soon as you declare any constructor, that default disappears, so `new Seat()` compiles only if you write `Seat()` yourself.',
      '`static` members belong to the class, not to an object: `Seat.created()` counts every Seat ever constructed, shared by all instances. A static method has no `this`, so it cannot read an instance field directly. `final` on a field means it is assigned exactly once (here in the constructor); it does not make the referenced object immutable.',
      'Access modifiers set who may touch a member: `private` (within the enclosing top-level class), package-private (same package), `protected` (same package and certain subclass access), `public` (subject to the class and module being accessible). Keep state private and expose operations such as `claim()` so every change goes through the rule you wrote.'
    ],
    code: { title: 'Foundations.java · run with: java Foundations.java', text: "public class Foundations {\n    static final class Seat {\n        private static int created = 0;          // one counter shared by the class\n        private final String id;                 // set once, in the constructor\n        private String owner;                    // changes only through claim()\n\n        Seat(String id) {\n            if (id == null || id.isBlank()) throw new IllegalArgumentException(\"seat id required\");\n            this.id = id;                        // this.id = field, id = parameter\n            created++;\n        }\n        Seat() { this(\"A1\"); }                   // delegate to the validating constructor\n\n        boolean claim(String userId) {\n            if (owner != null) return false;\n            owner = userId;\n            return true;\n        }\n        String owner() { return owner; }\n        static int created() { return created; }\n    }\n\n    public static void main(String[] args) {\n        int a = 5; int b = a; b++;               // primitives copy the value\n        Seat s1 = new Seat(\"A1\"); Seat s2 = s1;  // references copy the arrow, not the object\n        s2.claim(\"U1\");\n        Seat other = new Seat();\n        System.out.println(\"a=\" + a + \" b=\" + b);\n        System.out.println(\"s1.owner=\" + s1.owner() + \" sameObject=\" + (s1 == s2));\n        System.out.println(\"other.owner=\" + other.owner() + \" created=\" + Seat.created());\n    }\n}\n", output: 'a=5 b=6\ns1.owner=U1 sameObject=true\nother.owner=null created=2' },
    takeaways: ['A reference variable points at an object; copying it does not copy the object.', 'One validating constructor; other constructors delegate with this(...).', 'Declaring any constructor removes the implicit default constructor.', 'static = one per class; final field = assigned once, not deep immutability.'],
    interview: [
      ['What is the difference between this.id and id inside a constructor?', '`id` is the constructor parameter that shadows the field; `this.id` is the field of the object under construction. Writing `id = id` assigns the parameter to itself. With the example’s final field, the compiler reports that the field might not be initialized.'],
      ['Why does `new Seat()` stop compiling after you add `Seat(String id)`?', 'Java generates a default no-arg constructor only when a class declares none. Once any constructor exists you must declare `Seat()` explicitly, ideally delegating with `this("A1")` so validation stays in one place.'],
      ['Is Java pass-by-reference?', 'No. Java is always pass-by-value. For objects the value passed is a copy of the reference, so the callee can mutate the shared object but reassigning its parameter does not change the caller’s variable.']
    ],
    check: ['After `Seat s2 = s1; s2.claim("U1");`, what does `s1.owner()` return?', ['null, because s2 is a copy of s1', '"U1", because s1 and s2 reference the same object', 'It does not compile', '"U1" only if Seat overrides equals'], 1, 'Assignment copied the reference, not the object. Both variables reach the same Seat.'],
    practice: ['Run Foundations.java. Then (1) remove `this.` from `this.id = id` and explain the result, (2) delete the no-arg constructor and read the compiler error for `new Seat()`, (3) add a second Seat and predict `Seat.created()` before running.', [
      'Prints the three expected lines before your edits.', 'You can explain why the compiler rejects the uninitialized final field.', 'You quote the compile error for the missing no-arg constructor.', 'Your predicted created() count matches the output.']],
    references: [
      ['Oracle Java Tutorial · Providing constructors', oracle + 'java/javaOO/constructors.html'],
      ['Oracle Java Tutorial · Using the this keyword', oracle + 'java/javaOO/thiskey.html'],
      ['Oracle Java Tutorial · Class members (static)', oracle + 'java/javaOO/classvars.html'],
      ['Oracle Java Tutorial · Primitive data types', oracle + 'java/nutsandbolts/datatypes.html']
    ]
  }
};

// Topic packets for Day 1 and Day 2 topics that had none (same shape as topic-lessons.js, plus optional code).
export const depthPackets = {
  'l-invariants-01': {
    notes: [
      'An invariant is a statement about an object that must be true after construction and after every public operation, no matter which operations ran before. For Seat: "once a seat has an owner, only an explicit cancel by that owner may change it". Write the invariant down before writing code; it tells you which operations must check what.',
      'Enforce invariants at the single place where state changes. If owner is private and only `claim()` assigns it, you can prove the rule by reading one method. A public setter (`setOwner`) lets any caller break the rule, and you would have to audit every caller instead.',
      'Test an invariant by observing state, not only return values: after U1 wins and U2 loses, assert `owner() == "U1"`. A method can return false and still have mutated state before failing; checking the final state catches that bug.',
      'Invalid input should fail fast without a partial change: validate arguments before mutating anything, and throw IllegalArgumentException for caller mistakes (blank user) while returning false for a legitimate business outcome (seat already taken). Mixing the two makes callers guess.'
    ],
    takeaways: ['State the invariant in one sentence before coding.', 'Only one method may change the protected field.', 'Assert the final state, not just the return value.', 'Validate before mutate; exceptions for misuse, false for business conflicts.'],
    interview: [
      ['What is a class invariant? Give one for a bank account.', 'A condition true after construction and after every public method, e.g. balance never negative unless an overdraft limit permits it. Every withdraw path must check it before changing balance.'],
      ['Why is a public setter dangerous for a booking entity?', 'It bypasses the transition rule: any code can overwrite an existing owner. With a guarded operation the rule lives in one method and is testable there.'],
      ['When should a booking method throw versus return false?', 'Throw for programming or input errors the caller should fix (null/blank user, unknown seat). Return false (or a result type) for expected outcomes such as a seat already booked.'],
      ['How would you add cancel() without breaking the invariant?', 'Allow booked → free only when the caller is the current owner (or an authorised admin), check and change in the same method, and test that a non-owner cancel leaves the owner unchanged.']
    ],
    check: ['U2 calls claim() on A1 owned by U1. The method sets owner = U2, then throws because U2 is "not allowed". What is wrong?', ['Nothing, an exception was thrown', 'State changed before validation, so the invariant is broken', 'It should return true', 'Exceptions cannot be used in constructors'], 1, 'Validate before you mutate; a failed operation must leave the previous owner in place.'],
    practice: ['Add cancel(String userId) to your Seat. Write a Main that prints the owner after: U1 claim, U2 cancel (must fail), U1 cancel, U2 claim.', ['Owners print U1, U1, null, U2.', 'A non-owner cancel returns false and changes nothing.', 'No public setter exists.']],
    references: [['Oracle Java Tutorial · Controlling access to members', oracle + 'java/javaOO/accesscontrol.html']]
  },
  'h-request-01': {
    notes: [
      'Typing a URL starts a chain. DNS resolves the hostname (e.g. api.example.com) to an IP address, using caches in the browser, OS and resolver before asking authoritative name servers. DNS only answers "where"; it knows nothing about your booking.',
      'For a new HTTP/1.1 or HTTP/2 HTTPS connection, the browser uses TCP and a TLS handshake. HTTP/3 uses QUIC, which integrates TLS. The subsequent HTTP request carries a method, path, headers and an optional body.',
      'On the server, a router picks a handler from the method + path (POST /bookings → BookingController). The handler validates input, calls the service, the service writes to the authoritative store, and only after the write succeeds does the server send a status code: 201 Created on success, 400 for bad input, 409 Conflict when the seat is already taken, 5xx for server faults.',
      'The browser renders what it last received. A list fetched a minute ago can still show A1 as free; that is a stale read, not the truth. The authoritative answer is the result of the write in the store, which is why a POST can return 409 even though the screen said "available".'
    ],
    code: { title: 'RequestTrace.java · a real local HTTP server and client (JDK only) · java RequestTrace.java', text: "import com.sun.net.httpserver.HttpServer;\nimport java.net.InetSocketAddress;\nimport java.net.URI;\nimport java.net.http.*;\nimport java.util.concurrent.ConcurrentHashMap;\n\npublic class RequestTrace {\n    public static void main(String[] args) throws Exception {\n        ConcurrentHashMap<String, String> owners = new ConcurrentHashMap<>(); // the authoritative store\n        HttpServer server = HttpServer.create(new InetSocketAddress(\"127.0.0.1\", 0), 0);\n        server.createContext(\"/bookings\", ex -> {                            // routing: method + path -> handler\n            String user = new String(ex.getRequestBody().readAllBytes()).trim();\n            int status;\n            if (!\"POST\".equals(ex.getRequestMethod())) status = 405;\n            else if (user.isBlank()) status = 400;\n            else status = owners.putIfAbsent(\"A1\", user) == null ? 201 : 409;  // write before the success reply\n            byte[] body = (\"owner=\" + owners.get(\"A1\")).getBytes();\n            ex.sendResponseHeaders(status, body.length);\n            ex.getResponseBody().write(body);\n            ex.close();\n        });\n        server.start();\n        HttpClient client = HttpClient.newHttpClient();\n        URI uri = URI.create(\"http://127.0.0.1:\" + server.getAddress().getPort() + \"/bookings\");\n        for (String user : new String[] { \"U1\", \"U2\", \" \" }) {\n            HttpRequest req = HttpRequest.newBuilder(uri).POST(HttpRequest.BodyPublishers.ofString(user)).build();\n            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());\n            System.out.println(\"POST as '\" + user + \"' -> \" + res.statusCode() + \" \" + res.body());\n        }\n        server.stop(0);\n    }\n}\n", output: "POST as 'U1' -> 201 owner=U1\nPOST as 'U2' -> 409 owner=U1\nPOST as ' ' -> 400 owner=U1" },
    takeaways: ['DNS finds the server; HTTP method + path find the handler.', 'Reply success only after the authoritative write.', '201 / 400 / 409 tell the client exactly what happened.', 'The UI can be stale; the store is the truth.'],
    interview: [
      ['What happens when you type a URL and press Enter?', 'DNS lookup (with caching) → secure connection (TCP and TLS for HTTP/2, or QUIC for HTTP/3) → HTTP request with method, path, headers → server routing → handler, service and data store → HTTP response with status and body → browser renders. Mention caches and where latency comes from.'],
      ['Which status code for booking an already-booked seat, and why?', '409 Conflict: the request is valid but conflicts with current resource state. 400 is for malformed input, 404 for an unknown seat, 201 for a created booking.'],
      ['Why can the UI show a seat as free when it is booked?', 'The page shows an earlier GET response or a cache. Another user booked after that read. The server’s guarded write is authoritative, so the client must handle 409 and refresh.'],
      ['What does DNS cache TTL trade off?', 'Long TTLs reduce lookup latency and load but slow down failover to a new IP; short TTLs make changes propagate faster at the cost of more lookups.']
    ],
    check: ['Where should the booking decision be made?', ['In the DNS resolver', 'In the browser after the page loads', 'In the server’s guarded write to the authoritative store', 'In the TLS handshake'], 2, 'DNS and TLS only locate and secure the connection; the browser can be stale.'],
    practice: ['Run RequestTrace.java. Add a GET /bookings handler that returns the current owner, then show in a comment how a client could display "free" after U1 already booked.', ['POST outputs show 201, 409, 400.', 'GET returns owner=U1 after the first POST.', 'You describe one stale-read sequence in two lines.']],
    references: [
      ['MDN · An overview of HTTP', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview'],
      ['MDN · HTTP response status codes', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status']
    ]
  },
  'ai-foundations-01': {
    notes: [
      'A large language model (LLM) is a neural network trained to predict the next token (a word piece) given the previous tokens. Training adjusts billions of parameters on large text corpora; this is expensive and done once by the model provider. Inference is using the fixed, trained parameters to generate text for your prompt, one token at a time.',
      'Because the model generates the most plausible continuation, its output can be fluent and still wrong (a hallucination). It has no live access to your database unless you give it data in the prompt or via tools, and its knowledge stops at its training cut-off.',
      'Rule of thumb for this course: use the model where a helpful, checkable text answer is the product (explain the cancellation policy, summarise a ticket), and keep deterministic rules in Java and the database (who owns A1, payments, authorisation). Validate model output against evidence before showing it as fact.',
      'Sampling settings change behaviour: temperature near 0 gives more repeatable answers; higher values give more varied text. Neither makes the model correct; only grounding and validation do.'
    ],
    takeaways: ['Training changes parameters; inference uses them.', 'Fluent ≠ correct: validate against evidence.', 'Booking ownership and authorisation stay in code and the database.', 'Temperature changes variety, not truth.'],
    interview: [
      ['Explain training vs inference in two sentences.', 'Training learns parameters from data by minimising prediction error, offline and costly. Inference runs the trained model on a new prompt to generate output, per request.'],
      ['Why must seat assignment not be decided by an LLM?', 'The output is probabilistic and can be wrong or manipulated by the prompt; ownership must be deterministic, auditable and enforced transactionally by application code and the database.'],
      ['What is a token and why does it matter for cost?', 'A token is a sub-word unit the model reads and writes. Providers bill and limit context by tokens, so long prompts and long answers cost more and can hit the context window.']
    ],
    check: ['A help bot says "A1 is free" while the database shows U1 owns it. What should the app trust?', ['The bot, it read the policy', 'The database record enforced by BookingService', 'Whichever answered first', 'Ask the bot again with temperature 0'], 1, 'Model text is advisory; the authoritative state is the database enforced by code.'],
    practice: ['Write two short lists: three features in a booking app where an LLM helps, and three decisions that must stay deterministic. For one LLM feature, describe how you would check its answer.', ['3 + 3 items with a reason each.', 'At least one validation step (policy text, database lookup or human review).']],
    references: [['Microsoft · Generative AI for Beginners, lesson 1', 'https://github.com/microsoft/generative-ai-for-beginners/blob/main/01-introduction-to-genai/README.md']]
  },
  'd-hashing-01': {
    notes: [
      'Problem: does a list of IDs contain any repeat? Brute force compares every pair: O(n²) time, O(1) extra space. Sorting first makes duplicates adjacent: O(n log n) time. A hash set remembers what you have seen: one pass, expected O(1) per add, so expected O(n) time and O(n) extra space.',
      'HashSet.add(x) returns false when x is already present, so the check and the insert are one call. Strings hash by content and compare with equals, so "U1" and "u1" are different keys (case-sensitive), which matches the problem statement.',
      'Expected O(1) assumes a reasonable hash function and that the table resizes as it grows (Java’s default load factor is 0.75). Many keys with the same hash degrade a bucket; since Java 8 large buckets become balanced trees, bounding the worst case near O(log n) per operation for comparable keys.',
      'Trade-off to state in interviews: the hash-set solution spends memory to save time. If memory is tight and modifying the input is allowed, sort in place and scan neighbours instead.'
    ],
    code: { title: 'DuplicateIds.java · java DuplicateIds.java', text: "import java.util.HashSet;\nimport java.util.List;\nimport java.util.Set;\n\npublic class DuplicateIds {\n    static boolean hasDuplicate(List<String> ids) {\n        Set<String> seen = new HashSet<>();\n        for (String id : ids) {\n            if (!seen.add(id)) return true;      // add() returns false when the value is already present\n        }\n        return false;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(hasDuplicate(List.of()));                 // false\n        System.out.println(hasDuplicate(List.of(\"U1\", \"U2\")));       // false\n        System.out.println(hasDuplicate(List.of(\"U1\", \"U2\", \"U1\"))); // true\n        System.out.println(hasDuplicate(List.of(\"U1\", \"u1\")));       // false: case-sensitive\n    }\n}\n", output: 'false\nfalse\ntrue\nfalse' },
    takeaways: ['Seen-set pattern: one pass, add() tells you if it was new.', 'Expected O(n) time, O(n) space; sorting gives O(n log n) with O(1) extra.', 'Say the hashing assumption out loud.'],
    interview: [
      ['Find whether an array has duplicates. Give three approaches and their costs.', 'Pairs O(n²)/O(1); sort then scan neighbours O(n log n)/O(1)–O(n) depending on sort; hash set O(n) expected time/O(n) space. Pick by constraints.'],
      ['Why is HashSet lookup "expected" O(1) and not guaranteed?', 'It depends on the hash spreading keys across buckets. Collisions put several keys in one bucket; with adversarial keys lookups slow down (tree bins limit this in Java 8+).'],
      ['How would you return the first repeated ID instead of a boolean?', 'Scan in order and return the first id for which add() returns false; return null/Optional.empty() if none.']
    ],
    check: ['What does `new HashSet<String>().add("U1")` return the second time it is called with "U1"?', ['true', 'false', 'It throws', 'null'], 1, 'add() returns false when the set already contains an equal element.'],
    practice: ['Run DuplicateIds.java, then write firstDuplicate(List<String>) returning Optional<String>. Test: [], [U1,U2], [U2,U1,U2,U1] → U2.', ['Empty and distinct lists return Optional.empty().', '[U2,U1,U2,U1] returns U2.', 'State time and space.']],
    references: [['Java 21 API · HashSet', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html']]
  },
  'j-concurrency-01': {
    notes: [
      'A thread is an independent path of execution inside one JVM process. Threads share the heap (objects, fields) but each has its own stack (local variables). Shared mutable fields are where trouble starts.',
      'Check-then-act is a race: `if (owner == null) owner = user;` is a read, a decision and a write. Nothing stops two threads from both reading null before either writes. Both then return true, and the final owner is whichever write landed last. The bug is real but timing-dependent, so it may pass a hundred runs and fail the next.',
      'To prove a race, do not rely on sleep(). Make both threads reach the decisive point and wait: a CountDownLatch(2) counted down after the read and awaited before the write forces "both read, then both write". Use one shared Seat instance; separate objects cannot race on each other’s fields.',
      'Collect results through Future.get(timeout) rather than print order. Print order only shows when lines were written, not which state changes happened. Two successes for one seat is the evidence; the fix (synchronized / atomic compare-and-set) is Day 3.'
    ],
    code: { title: 'RaceTrace.java · forces the interleaving with a latch · java RaceTrace.java', text: "import java.util.concurrent.*;\n\npublic class RaceTrace {\n    static final class Seat {\n        private String owner;                       // deliberately unsynchronized\n        boolean claim(String user, CountDownLatch bothRead) throws InterruptedException {\n            boolean free = owner == null;           // 1. read + decide\n            bothRead.countDown();\n            bothRead.await(2, TimeUnit.SECONDS);    // 2. park until the other worker has also read\n            if (!free) return false;\n            owner = user;                           // 3. write\n            return true;\n        }\n        synchronized String owner() { return owner; }\n    }\n\n    public static void main(String[] args) throws Exception {\n        Seat seat = new Seat();                     // ONE shared instance\n        CountDownLatch bothRead = new CountDownLatch(2);\n        ExecutorService pool = Executors.newFixedThreadPool(2);\n        Future<Boolean> t1 = pool.submit(() -> seat.claim(\"U1\", bothRead));\n        Future<Boolean> t2 = pool.submit(() -> seat.claim(\"U2\", bothRead));\n        boolean r1 = t1.get(5, TimeUnit.SECONDS), r2 = t2.get(5, TimeUnit.SECONDS);\n        pool.shutdown();\n        System.out.println(\"U1=\" + r1 + \" U2=\" + r2 + \" finalOwner=\" + seat.owner());\n        System.out.println(r1 && r2 ? \"RACE: two successes, one owner\" : \"no race this run\");\n    }\n}\n", output: 'U1=true U2=true finalOwner=U1   (finalOwner may be U2 on another run)\nRACE: two successes, one owner' },
    takeaways: ['Threads share heap fields, not local variables.', 'Check-then-act on shared state is a race.', 'Reproduce races with latches/barriers, never with sleep().', 'Judge by results and final state, not log order.'],
    interview: [
      ['What is a race condition? Give a Java example.', 'The result depends on thread timing. Example: two threads run `if (owner == null) owner = me;` on one object; both see null and both claim success.'],
      ['How do you make a race reproducible in a test?', 'Insert coordination at the critical boundary (CountDownLatch/CyclicBarrier) so both threads finish the read before either writes; use one shared instance and bounded timeouts.'],
      ['Thread vs process?', 'A process has its own memory space; threads within a process share heap memory and are cheaper to create and switch, which is why shared-state bugs appear.']
    ],
    check: ['Two threads call claim() on two different Seat objects with the same ID "A1". Both succeed. What does this prove?', ['The race on one shared field', 'That two objects can represent one seat without coordination; not the field race itself', 'That synchronized is broken', 'Nothing could ever go wrong'], 1, 'Separate objects have separate fields. To show the race, share one instance.'],
    practice: ['Run RaceTrace.java three times and record outputs. Then make claim() synchronized and explain why the latch now times out for one worker (hint: the second thread cannot enter until the first leaves).', ['Unsafe run prints two successes.', 'You describe what changes with synchronized.', 'Every run terminates within the timeouts.']],
    references: [
      ['Oracle Java Tutorial · Thread interference', oracle + 'essential/concurrency/interfere.html'],
      ['Java 21 API · CountDownLatch', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CountDownLatch.html']
    ]
  },
  'j-concurrency-01.dsa': {
    notes: [
      'Two Sum: given int[] nums and a target, return indices i < j with nums[i] + nums[j] == target. Brute force checks all pairs in O(n²). With a HashMap from value to index you need one pass: for each nums[j], look up target - nums[j]; if it was seen at index i, answer {i, j}; otherwise store nums[j] → j.',
      'Look up before you insert. That ordering lets [3, 3] with target 6 work (the first 3 is stored, the second finds it) and stops an element pairing with itself. Expected O(n) time and O(n) space, under the same hashing assumptions as Day 1. Compute the complement as a long so the int input subtraction cannot wrap.',
      'This is Day 1’s seen-set idea with extra information: instead of "seen or not" you remember "seen where". Many problems reuse it: counting frequencies, first non-repeating character, subarray sums.'
    ],
    code: { title: 'TwoSum.java · java TwoSum.java', text: "import java.util.Arrays;\nimport java.util.HashMap;\nimport java.util.Map;\n\npublic class TwoSum {\n    // Returns indices {i, j} with i < j and nums[i] + nums[j] == target, or an empty array.\n    static int[] twoSum(int[] nums, int target) {\n        Map<Long, Integer> indexOf = new HashMap<>();\n        for (int j = 0; j < nums.length; j++) {\n            Integer i = indexOf.get((long) target - nums[j]);   // look up the partner before inserting\n            if (i != null) return new int[] { i, j };\n            indexOf.put((long) nums[j], j);\n        }\n        return new int[0];\n    }\n\n    public static void main(String[] args) {\n        if (twoSum(new int[] {Integer.MAX_VALUE, 1}, Integer.MIN_VALUE).length != 0) {\n            throw new AssertionError(\"Wrapped sum must not match the target\");\n        }\n        System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9))); // [0, 1]\n        System.out.println(Arrays.toString(twoSum(new int[] {3, 3}, 6)));         // [0, 1]\n        System.out.println(Arrays.toString(twoSum(new int[] {1, 2}, 7)));         // []\n    }\n}\n", output: '[0, 1]\n[0, 1]\n[]' },
    takeaways: ['Map value → index turns pair search into one pass.', 'Look up the complement before inserting the current value.', 'Same hashing assumptions as the seen-set.'],
    interview: [
      ['Solve Two Sum in O(n). Why look up before inserting?', 'Single pass with a value→index map; checking first avoids pairing an element with itself and still handles duplicates like [3,3].'],
      ['What changes if the array is sorted?', 'Use two pointers from both ends: O(n) time and O(1) extra space, moving the left pointer up when the sum is too small and the right pointer down when too big.'],
      ['How would you return all pairs without duplicates?', 'Sort and use two pointers skipping equal neighbours, or count frequencies in a map and handle the x == target − x case using counts.']
    ],
    check: ['nums = [3, 3], target = 6. Why does inserting nums[j] before the lookup risk a wrong answer for nums = [3], target = 6?', ['It would return {0, 0}, pairing an element with itself', 'It throws NullPointerException', 'It loops forever', 'HashMap rejects duplicate keys'], 0, 'Lookup-before-insert guarantees i < j.'],
    practice: ['Implement twoSum and test [2,7,11,15]/9 → [0,1], [3,3]/6 → [0,1], [1,2]/7 → []. Then write the two-pointer version for a sorted array.', ['All three cases print as expected.', 'Two-pointer version uses O(1) extra space.', 'State time and space for both.']],
    references: [['Dev.java · The Map interface', 'https://dev.java/learn/api/collections-and-streams/collections-framework/maps/']]
  }
};

// Day 3 (Grok, 2026-11-22): runnable fix for the Day 2 race, attached to Codex's existing j-concurrency-02 packet.
export const packetCode = {
  'j-concurrency-02': { title: 'SafeSeat.java · synchronized vs compare-and-set, 1000 forced races · java SafeSeat.java', text: "import java.util.concurrent.*;\nimport java.util.concurrent.atomic.AtomicReference;\n\npublic class SafeSeat {\n    static final class LockedSeat {\n        private String owner;                               // guarded by this\n        synchronized boolean claim(String user) {           // check + write under ONE monitor\n            if (owner != null) return false;\n            owner = user;\n            return true;\n        }\n        synchronized String owner() { return owner; }\n    }\n    static final class CasSeat {\n        private final AtomicReference<String> owner = new AtomicReference<>();\n        boolean claim(String user) { return owner.compareAndSet(null, user); } // atomic check-and-set\n        String owner() { return owner.get(); }\n    }\n\n    public static void main(String[] args) throws Exception {\n        ExecutorService pool = Executors.newFixedThreadPool(2);\n        int lockedDouble = 0, casDouble = 0;\n        for (int run = 0; run < 1000; run++) {\n            LockedSeat a = new LockedSeat(); CasSeat b = new CasSeat();\n            CyclicBarrier start = new CyclicBarrier(2);\n            Callable<Integer> race = () -> { start.await(); return (a.claim(Thread.currentThread().getName()) ? 1 : 0) + (b.claim(Thread.currentThread().getName()) ? 10 : 0); };\n            Future<Integer> f1 = pool.submit(race), f2 = pool.submit(race);\n            int r = f1.get(5, TimeUnit.SECONDS) + f2.get(5, TimeUnit.SECONDS);\n            if (r % 10 != 1) lockedDouble++;\n            if (r / 10 != 1) casDouble++;\n        }\n        pool.shutdown();\n        System.out.println(\"runs=1000 lockedSeatWrongWinners=\" + lockedDouble + \" casSeatWrongWinners=\" + casDouble);\n    }\n}\n", output: 'runs=1000 lockedSeatWrongWinners=0 casSeatWrongWinners=0' }
};
depthPackets['j-concurrency-02.dsa'] = {
  notes: [
    'Contains Duplicate II: is there a value that appears twice within k positions? Day 1 only asked "seen before?"; now you also need "seen where?". Keep a map from value to its last index. When you meet the value again at j, the closest earlier occurrence is the last one stored, so checking j − last ≤ k is enough.',
    'Map.put returns the previous value for the key (or null), so one call both reads the last index and stores the new one. Expected O(n) time; O(min(n, distinct)) space. A sliding-window HashSet of the last k values is an alternative with O(k) space.'
  ],
  code: { title: 'DuplicateWithinK.java · java DuplicateWithinK.java', text: "import java.util.HashMap;\nimport java.util.Map;\n\npublic class DuplicateWithinK {\n    // true if some value appears at indices i < j with j - i <= k\n    static boolean nearbyDuplicate(int[] nums, int k) {\n        Map<Integer, Integer> lastIndex = new HashMap<>();\n        for (int j = 0; j < nums.length; j++) {\n            Integer i = lastIndex.put(nums[j], j);       // put returns the previous index (or null)\n            if (i != null && j - i <= k) return true;\n        }\n        return false;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(nearbyDuplicate(new int[] {1, 2, 3, 1}, 3));       // true  (distance 3)\n        System.out.println(nearbyDuplicate(new int[] {1, 0, 1, 1}, 1));       // true  (last two)\n        System.out.println(nearbyDuplicate(new int[] {1, 2, 3, 1, 2, 3}, 2)); // false (all distances 3)\n    }\n}\n", output: 'true\ntrue\nfalse' },
  takeaways: ['Store the last index, not just membership.', 'Map.put returns the previous value: read and update in one call.', 'Window set gives O(k) space.'],
  interview: [
    ['Solve "duplicate within distance k" in O(n).', 'Map value → last index; on a repeat check j − last ≤ k, then update. Or keep a HashSet of the last k elements, removing nums[j − k − 1] as the window slides.'],
    ['Why is the last index enough, not all indices?', 'Indices increase as you scan, so the most recent earlier occurrence is always the closest one to j; older ones are farther away.'],
    ['How does the window-set version bound memory?', 'It never holds more than k values because it removes the element that falls out of the window before adding the next one.']
  ],
  check: ['nums = [1, 2, 3, 1], k = 2. Result?', ['true, 1 appears twice', 'false, the two 1s are 3 apart', 'true, because k ≥ 2', 'It throws for k < length'], 1, 'Distance 3 − 0 = 3 > 2.'],
  practice: ['Implement nearbyDuplicate with the map, then the sliding-window HashSet version. Test [1,2,3,1]/3 → true, [1,0,1,1]/1 → true, [1,2,3,1,2,3]/2 → false.', ['Both versions print true, true, false.', 'State time and space for each.']],
  references: [['Java 21 API · Map.put', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html#put(K,V)']]
};

// Extra wrong options for two-choice self-check questions (answer stays the first, "right", option in session-qa.js).
export const extraDistractors = {
  1: [
    ['U2 becomes a co-owner of A1.', 'The seat resets to available so both users can retry.'],
    ['In a database row updated after the scan finishes.', 'Nowhere; compare each ID only with the first ID.']
  ],
  3: [
    ['Mutual exclusion for every method that reads the field.', 'Nothing: volatile only affects performance.'],
    ['Each request runs on its own thread pool.', 'The JIT compiler merges the two calls into one.']
  ],
  2: [
    ['No, the JVM runs one thread at a time on each object.', 'Only if the two threads use different Seat objects.'],
    ['Run the test in a loop until it fails once.', 'Add System.out.println calls so the threads slow down.']
  ]
};
export const extraExplanations = {
  3: ['volatile makes each read see the latest write and orders it, but check-then-act is still two steps, so two threads can still both see null.', 'Only callers that lock the same monitor exclude each other; the whole check-and-write must sit inside that one lock.'],
  1: ['A failed claim must not change the owner: the call returns false and the original owner stays.', 'Duplicates can be far apart, so keep every ID seen so far in a set; the previous ID alone misses [U1, U2, U1].'],
  2: ['Each read is atomic, but read-then-write is not: two threads can both read null before either writes.', 'A latch or barrier forces both threads to the read/write boundary every time; sleeps and loops only make the race likely.']
};
export const extraAssessment = {
  2: [
    { question: 'Two threads share one Seat. Thread T1 runs claim("U1") and T2 runs claim("U2") with no synchronization. Which outcome is NOT possible?',
      choices: ['T1 true, T2 false, owner U1', 'T1 true, T2 true, owner U2', 'T1 false, T2 false, owner null', 'T1 false, T2 true, owner U2'], answer: 2,
      explanation: 'At least one thread sees null and writes, so the seat cannot stay unowned with both calls failing.' },
    { question: 'Which variables are shared between two threads that call seat.claim(user) on the same object?',
      choices: ['The local variable free inside claim()', 'The parameter user', 'The instance field owner', 'None; each thread gets a copy of the object'], answer: 2,
      explanation: 'Locals and parameters live on each thread’s own stack; instance fields live on the shared heap.' }
  ]
};

// Sunday/Saturday stretch plans (4h 30m beyond the 2h core). Keys are existing practice IDs (minutes assigned here);
// `extra` items are new optional practice. Day 1 total = 270 min.
export const stretchPlans = {
  1: {
    assign: { 'j-foundations-01.packet': 20, 'j-oop-01.stretch': 50, 'l-invariants-01.packet': 40, 'h-request-01.packet': 45, 'ai-foundations-01.packet': 20, 'd-hashing-01.packet': 30 },
    extra: [
      { id: 'd-hashing-01.stretch-set', minutes: 35, title: 'Stretch DSA · three more hashing problems',
        prompt: 'In one Java file solve: (1) countDistinct(List<String>) using a HashSet; (2) firstUniqueChar(String) using a LinkedHashMap<Character,Integer> of counts; (3) isAnagram(String a, String b) using an int[26] count for lowercase a–z. Write the time and space of each before coding.',
        acceptance: ['countDistinct([U1,U2,U1]) = 2 and countDistinct([]) = 0.', 'firstUniqueChar("leetcode") = \'l\'; "aabb" has none.', 'isAnagram("listen","silent") = true, ("rat","car") = false.', 'Time and space written for all three.'] },
      { id: 'j-oop-01.stretch-interview', minutes: 30, title: 'Stretch interview drill · answer aloud, then compare',
        prompt: 'Pick five Day 1 interview questions from the AI coach tab (at least one each from Java, HTTP and DSA). Answer each aloud or in writing in 2 minutes without opening the model answer, then open it and note one thing you missed.',
        acceptance: ['Five answers written or recorded.', 'For each, one missed point noted from the model answer.'] }
    ]
  }
};

// Days 41–56 (Grok, late-depth.js): merged here so every consumer keeps importing day-depth.js only.
Object.assign(depthPackets, lateDepthPackets);
Object.assign(extraDistractors, lateDistractors);
Object.assign(extraExplanations, lateExplanations);
Object.assign(stretchPlans, lateStretchPlans);
Object.assign(extraAssessment, lateAssessment);
