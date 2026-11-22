import { lateLanes } from './late-depth.js';

export const START_DATE = '2026-11-22';

export const tracks = {
  J: 'Java', B: 'Backend', L: 'LLD', H: 'HLD', D: 'DSA', AI: 'Generative AI'
};

const java = 'https://dev.java/learn/';
const pg = 'https://www.postgresql.org/docs/current/';
const spring = 'https://spring.io/guides/gs/';
const mdn = 'https://developer.mozilla.org/en-US/docs/';
const ai = 'https://github.com/microsoft/generative-ai-for-beginners/blob/main/';
const springAi = 'https://docs.spring.io/spring-ai/reference/';
const lld = 'https://rishabh10045.github.io/studyapp/lld/roadmap.html';
const algorithms = 'https://algs4.cs.princeton.edu/';

export const courses = {
  java: {
    title: 'Java Backend', type: 'GFG curriculum',
    sections: 'Core Java and OOP (sessions 1–6), Spring and databases (7–12), testing and security (13–18), messaging and deployment (19–24).',
    context: 'Multithreading is part of Core Java. The program also lists Cursor-assisted development.',
    links: [
      ['Public course', 'https://www.geeksforgeeks.org/courses/Java-backend-live'],
      ['Syllabus PDF', 'https://media.geeksforgeeks.org/courses/syllabus/168b174933486cd366a5d51dff5738b6.pdf']
    ]
  },
  design: {
    title: 'System Design', type: 'GFG curriculum',
    sections: 'Requirements and scaling (modules 1–2), storage and caching (3–6), APIs and messaging (7–10), reliability and observability (11–16), and advanced topics and capstones (17–24).',
    context: 'Overlapping HLD modules in the combo course feed one HLD track.',
    links: [
      ['Public course', 'https://www.geeksforgeeks.org/courses/system-design-training-program'],
      ['Syllabus PDF', 'https://media.geeksforgeeks.org/courses/syllabus/973f73599e070cabefcf71cd54e1ff1f.pdf']
    ]
  },
  dsa: {
    title: 'DSA + System Design', type: 'GFG curriculum',
    sections: 'DSA classes 1–24 cover analysis, arrays, hashing, linked lists, trees, graphs, greedy algorithms and dynamic programming. The second track overlaps with the HLD syllabus.',
    context: 'Implement the selected DSA exercises in Java. Revisit combined problems after covering their component data structures.',
    links: [
      ['Public course', 'https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course'],
      ['Syllabus PDF', 'https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf']
    ]
  },
  genai: {
    title: 'AI Engineering', type: 'GFG curriculum',
    sections: 'The brochure groups topics into foundations, core generative AI, retrieval and agents, then evaluation and deployment.',
    context: 'The AI track selects the concepts relevant to building backend features and uses Java examples where appropriate. Follow the public course page for its current offering.',
    links: [
      ['Public course', 'https://www.geeksforgeeks.org/courses/ai-engineering-course-generative-agentic-ai'],
      ['Syllabus PDF', 'https://media.geeksforgeeks.org/courses/syllabus/9e2e6c838d855413f1805def9a931bbb.pdf'],
      ['Previous syllabus PDF', 'https://media.geeksforgeeks.org/courses/syllabus/37aebb307d00b1ab3dbcb601ad1534ae.pdf']
    ]
  },
  lld: {
    title: 'Low-Level Design', type: 'Existing roadmap',
    sections: 'OOP, SOLID, UML, patterns, concurrency and machine coding.',
    context: 'Apply the relevant lessons to the Seat Booking Lab as its requirements grow.',
    links: [['Open LLD roadmap', lld]]
  },
  supplement: {
    title: 'Backend and Spring AI resources', type: 'Supplement',
    sections: 'Java, HTTP, PostgreSQL, Spring Boot, Spring AI and introductory GenAI material.',
    context: 'These public references supplement the course map. Spring AI integration uses the official Spring project documentation.',
    links: [
      ['Dev.java', java], ['Spring guides', 'https://spring.io/guides'],
      ['PostgreSQL tutorial', pg + 'tutorial.html'],
      ['Spring AI reference', springAi + 'index.html'],
      ['Microsoft Generative AI for Beginners', 'https://github.com/microsoft/generative-ai-for-beginners']
    ]
  }
};

export const phases = [
  { from: 1, to: 8, title: 'Java & concurrency', description: 'Build the sequential lab, learn how races happen, and verify the in-process fix.' },
  { from: 9, to: 16, title: 'Spring, SQL & transactions', description: 'Expose the booking API and make the database authoritative.' },
  { from: 17, to: 25, title: 'Design, traffic & reliability', description: 'Build a two-instance lab, then extend it with holds, caching, and measurements.' },
  { from: 26, to: 34, title: 'DSA & backend depth', description: 'Work through core algorithms and practice testing, security, and deployment.' },
  { from: 35, to: 45, title: 'Generative AI integration', description: 'Learn model basics, build a validated help feature, and evaluate it before the core capstone.' },
  { from: 46, to: 56, title: 'Advanced practice and gaps', description: 'Deepen JVM, Spring, security, distributed systems, DSA and Java-first AI with targeted follow-up labs.' }
];

const reading = (title, url) => ({ title, url });

const foundations = {
  title: 'Build the first booking flow',
  topics: ['J-OOP-01', 'L-INVARIANTS-01', 'H-REQUEST-01', 'AI-FOUNDATIONS-01', 'D-HASHING-01'],
  sources: ['java', 'lld', 'design', 'dsa', 'genai'],
  milestone: 'LAB-1.1',
  intro: 'Model a single seat and demonstrate a booking that keeps its original owner after a second request.',
  blocks: [
    {
      // Day 1 has no previous day to revise: its 12-minute revision slot is the Java foundations warm-up (day-depth.js).
      id: 'foundations', title: 'Java foundations warm-up: objects, constructors and this', kind: 'Java foundations', minutes: 12,
      concept: 'Before the booking lab, make sure the object model is solid: references versus primitives, constructors that validate, this.field versus a parameter, this(...) delegation, static versus instance members and private fields.',
      example: 'Seat s2 = s1 copies the reference, so s2.claim("U1") is visible through s1. new Seat() compiles only if you declare Seat() yourself.',
      practice: 'Run Foundations.java from the warm-up notes, then make the three edits listed there and predict each result before running.',
      checks: ['The program prints the expected three lines.', 'You can explain this.id = id versus id = id.', 'You can explain why declaring Seat(String) removes the default constructor.'],
      readings: [
        reading('Oracle Java Tutorial · Providing constructors', 'https://docs.oracle.com/javase/tutorial/java/javaOO/constructors.html'),
        reading('Oracle Java Tutorial · Using the this keyword', 'https://docs.oracle.com/javase/tutorial/java/javaOO/thiskey.html')
      ],
      recall: 'What does this.id = id do in a constructor, and when does Java add a default constructor?'
    },
    {
      id: 'lab', title: 'Learn and code the booking flow', kind: 'Java · LLD', minutes: 36,
      concept: 'Think of a seat as a locker. An empty locker has no owner. Once U1 claims it, the owner must stay U1 after every failed attempt by anyone else. A rule that must hold after every operation is an invariant. Encapsulation lets callers read the state but change it only through the operation that enforces the rule.',
      example: 'A1 available, no owner → U1 books, owner U1 → U2 fails, owner still U1.',
      practice: 'Create Seat, BookingService, and Main in plain Java. Implement boolean book(String seatId, String userId). Keep exactly one seat, A1, and demonstrate the cases in Main.',
      checks: ['A1 starts available with no owner.', 'U1 gets true, U2 gets false, and A1 still belongs to U1.', 'An unknown seat ID or a whitespace-only user ID throws IllegalArgumentException.', 'External code can inspect state through a read operation. The state changes through the booking operation.'],
      readings: [
        reading('Dev.java · Declaring Member Variables', java + 'language/oop/classes-objects/creating-classes/#declaring-members'),
        reading('Dev.java · Controlling Access to Members', java + 'language/oop/classes-objects/more-on-classes/#controlling-access')
      ],
      recall: 'Explain how the booking operation protects the owner when two sequential users ask for A1.'
    },
    {
      id: 'http', title: 'Follow an HTTP request', kind: 'HLD', minutes: 16,
      concept: 'DNS resolves the hostname to an address. For a new HTTPS connection, HTTP/1.1 and HTTP/2 usually use TCP with TLS, while HTTP/3 uses QUIC with TLS integrated. The browser can reuse an existing connection. It sends the HTTP request over the connection. The backend picks a handler from the method and path, runs the application logic, reads or writes the data store and sends a response with a status code. The browser renders that response. The authoritative booking state lives in the backend store, not on the screen.',
      example: 'Browser → DNS lookup → secure connection → POST /bookings → handler → booking store → HTTP response → UI update.',
      practice: 'Draw the path from the browser to the backend and back. Label DNS, HTTPS, HTTP routing and the authoritative booking store.',
      checks: ['Show where hostname lookup ends and the application request begins.', 'Mark the authoritative write before a success response and show where a stale read can appear.'],
      readings: [
        reading('MDN · DNS explained', mdn + 'Learn_web_development/Getting_started/Web_standards/How_the_web_works#dns_explained'),
        reading('MDN · HTTP flow', mdn + 'Web/HTTP/Guides/Overview#http_flow')
      ],
      recall: 'What do DNS and HTTP routing each decide? Where does the authoritative booking state live?'
    },
    {
      id: 'ai', title: 'Learn what an LLM does', kind: 'Generative AI', minutes: 14,
      concept: 'We write the booking rule explicitly in code. A learned model instead picks up patterns from training data. During inference the trained model uses the input tokens to generate output one token at a time. A fluent answer can still be wrong, so its factual claims must be validated.',
      example: 'A help model can summarize a cancellation policy. BookingService checks whether a seat can be claimed.',
      practice: 'Give one useful LLM feature for a booking application and one booking rule that must stay deterministic. This exercise uses text only.',
      checks: ['Give one supported and one unsupported policy reply example.', 'Keep the ownership decision in defined Java application behavior.'],
      readings: [
        reading('Microsoft · How did we get Generative AI?', ai + '01-introduction-to-genai/README.md#how-did-we-get-generative-ai'),
        reading('Microsoft · How do large language models work?', ai + '01-introduction-to-genai/README.md#how-do-large-language-models-work')
      ],
      recall: 'Explain where an LLM fits in the app and which rule stays in application code.'
    },
    {
      id: 'dsa', title: 'Detect duplicate user IDs', kind: 'DSA practice', minutes: 30,
      concept: 'A membership check asks whether a value is already in a collection. A Set holds unique values, and HashSet.add returns false when the value is already present. Compare three approaches (all pairs, sort then scan, hash set), explain the expected time under good hashing and what assumptions a worst-case claim needs.',
      example: 'IDs [U1, U2, U1] contain a duplicate. IDs [U1, U2] do not.',
      practice: 'Given a list of non-null, case-sensitive String IDs, return a boolean indicating whether any ID repeats. Input order is irrelevant. Explain the approach before coding.',
      checks: ['Empty and distinct inputs return false. A repeated ID returns true.', 'U1 and u1 are distinct. State the expected time and memory assumptions.'],
      readings: [reading('Dev.java · Exploring the Set Interface', java + 'api/collections-and-streams/collections-framework/sets/#exploring')],
      recall: 'What information do you need to keep as you scan the list?'
    },
    {
      id: 'review', title: 'Capture evidence and open questions', kind: 'Review', minutes: 12,
      practice: 'Save the actual Main output, one correction in your own words, and any topics to revisit. Carry setup or incomplete code forward as pending.',
      recall: 'Which checks ran successfully and which are still pending?'
    }
  ]
};

const liveExamples = {
  2: {
    concept: 'Check-then-act mein pehle condition read hoti hai, phir update hota hai. Agar do threads same Seat share karte hain, scheduler dono reads ko pehle chala sakta hai. Dono ko available dikh sakta hai aur dono success return kar sakte hain.',
    example: 'T1 reads available → T2 reads available → T1 assigns U1 → T2 assigns U2.',
    checks: ['Both threads share the same Seat instance.', 'Coordinate the test with a latch or barrier between the read and the write.', 'Record both return values and the final owner.', 'Explain visibility and atomicity in your own words.']
  },
  3: {
    concept: 'Same monitor par mutual exclusion se ek thread check aur update ke beech doosre thread ko enter karne se rokta hai. Volatile visibility deta hai. Read aur write ko ek combined atomic operation banane ke liye separate coordination chahiye.',
    example: 'T1 enters the critical section and assigns U1 before T2 can test availability. T2 then sees a booked seat.',
    checks: ['A shared-seat run returns one success and one failure.', 'The winning user remains the owner.', 'The test harness coordinates starts outside the critical section.', 'Explain why this protection has JVM scope.']
  },
  4: {
    concept: 'Equals define karta hai do values kab same logical key hain. Equal values ka hash code same hona chahiye. Map key ke fields change ho jaayen toh lookup purane bucket se match khona sakta hai.',
    example: 'Two separately created SeatId values for A1 should find the same booking map entry.',
    checks: ['Equal SeatId values find the same entry.', 'A different SeatId produces a miss.', 'Explain hashing assumptions for lookup time.']
  }
};

// Each entry maps a study day to a learning source and a practical outcome.
const outline = [
  ['Java thread interleavings', ['J-CONCURRENCY-01','LAB-2.1'], ['java','lld'], 'Concurrency Tutorial · Thread Interference', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/interfere.html', 'Reproduce a controlled check-then-act race with two threads and a shared seat. Keep the sequential baseline.', 'Explain how both threads can read the same pre-booking state.'],
  ['Visibility and locking', ['J-CONCURRENCY-02','LAB-3.1'], ['java','lld'], 'Concurrency Tutorial · Intrinsic Locks and Synchronization', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/locksync.html', 'Protect the whole check-and-update with a shared lock. Repeat the controlled run and capture the winning owner.', 'Compare visibility, atomicity and the scope of a JVM lock.'],
  ['Equality, hashing and collections', ['J-EQUALITY-01','J-COLLECTIONS-01','D-HASHING-02'], ['java','dsa'], 'Dev.java · Choosing Immutable Types for Your Key', java + 'api/collections-and-streams/collections-framework/choosing-keys/', 'Use an immutable SeatId as a map key. Verify lookups for logically equal IDs created as different objects.', 'Explain the equality and hash-code contract for map keys.'],
  ['Java contracts and exceptions', ['J-OOP-02','J-EXCEPTIONS-01','L-RESPONSIBILITIES-01','J-STRINGS-01'], ['java','lld'], 'Dev.java · Exceptions', java + 'language/annotations-exceptions/exceptions/', 'Write the booking API contract. Test a valid booking, an already-booked seat and invalid inputs independently.', 'Describe when an invalid argument should produce an exception and when a booking attempt returns false.'],
  ['Generics, lambdas and streams', ['J-GENERICS-01','J-STREAMS-01'], ['java'], 'Dev.java · The Stream API', java + 'api/collections-and-streams/streams/', 'Build an immutable list of available seat IDs from a typed collection. Compare a loop and a pipeline on the same inputs.', 'Explain the input type, transformation and result of your pipeline.'],
  ['Executors and bounded work', ['J-EXECUTORS-01','J-JVM-01'], ['java'], 'Concurrency Tutorial · Executor Interfaces', 'https://docs.oracle.com/javase/tutorial/essential/concurrency/exinter.html', 'Submit a fixed set of booking requests through an ExecutorService. Collect outcomes and verify shutdown.', 'Describe how worker count differs from task count and where shared objects live.'],
  ['UML, SOLID and unit tests', ['L-UML-01','L-SOLID-01','B-TESTING-01'], ['lld','java'], 'LLD roadmap · Machine-coding round framework', lld, 'Draw Seat and BookingService dependencies, choose one SOLID rule to revisit, and cover the existing lab contract with JUnit.', 'Explain what each class owns and which behavior your tests protect.'],
  ['Maven and Spring dependency injection', ['J-BUILD-01','B-DI-01'], ['java'], 'Apache Maven · Maven in Five Minutes', 'https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html', 'Create a Maven Spring Boot app, inject BookingService by constructor, and run a basic application test.', 'Explain how Spring creates and passes a dependency to a controller.'],
  ['REST endpoints and HTTP semantics', ['B-HTTP-01','B-REST-01'], ['java','design'], 'Spring · Building a RESTful Web Service', spring + 'rest-service/', 'Expose a booking POST and a seat GET. Capture example request and response bodies, including a conflict.', 'Explain why looking up a seat and claiming it have different HTTP semantics.'],
  ['Validation and API errors', ['B-VALIDATION-01'], ['java','design'], 'Spring · Validating Form Input', spring + 'validating-form-input/', 'Validate request DTOs and return stable error bodies for invalid input, unknown seat IDs and booking conflict.', 'Explain validation at the HTTP boundary and invariants in the domain.'],
  ['SQL and schema constraints', ['B-SQL-01','B-SCHEMA-01','LAB-4.1'], ['java','design','supplement'], 'PostgreSQL · Constraints', pg + 'ddl-constraints.html', 'Create and seed the seat schema. Use a primary key and test a constraint on an invalid row.', 'Explain what the database guarantees independently of Java.'],
  ['JDBC and database transactions', ['B-JDBC-01','B-TRANSACTIONS-01','LAB-4.2'], ['java','design','supplement'], 'PostgreSQL · Transactions', pg + 'tutorial-transactions.html', 'Persist and read seats through parameterized SQL. Demonstrate an explicit commit and rollback.', 'Trace which effects another session can see after commit or rollback.'],
  ['Atomic SQL updates', ['B-TRANSACTIONS-02','LAB-5.1'], ['design','supplement'], 'PostgreSQL · UPDATE', pg + 'sql-update.html', 'Add a conditional UPDATE for an unowned seat and use the affected-row count to report success. Test with two connections.', 'Explain why the condition belongs inside the database write.'],
  ['Pessimistic and optimistic locking', ['B-TRANSACTIONS-03','LAB-5.2'], ['design','supplement'], 'PostgreSQL · Row-level locks', pg + 'explicit-locking.html#LOCKING-ROWS', 'Compare SELECT FOR UPDATE with a version-checked write. Capture waiting, conflict and retry behavior.', 'Choose a strategy for high versus low contention and explain the trade-off.'],
  ['JPA mapping and integration tests', ['B-JPA-01','B-TESTING-02'], ['java'], 'Spring · Accessing Data with JPA', spring + 'accessing-data-jpa/', 'Map seats with JPA and run an integration test backed by PostgreSQL. Confirm the database conflict rule still holds.', 'Explain how a managed entity differs from a persisted row and where the transaction starts.'],
  ['Run two application instances', ['H-SCALING-01','LAB-6.1'], ['design','java'], 'GFG System Design syllabus · Modules 1–2', courses.design.links[1][1] + '#page=4', 'Run two Spring Boot processes on different ports against one database. Race requests for A1 and capture both responses.', 'Explain why a JVM monitor cannot coordinate independent processes.'],
  ['Requirements and capacity estimates', ['H-REQUIREMENTS-01','H-ESTIMATES-01'], ['design'], 'GFG System Design syllabus · Modules 1–2', courses.design.links[1][1] + '#page=4', 'Write functional requirements and estimate reads, writes and peak traffic from explicit assumptions.', 'Explain which estimate changes your first scaling decision.'],
  ['Temporary holds and expiry', ['L-INVARIANTS-02','B-TRANSACTIONS-04','LAB-7.1'], ['lld','design','supplement'], 'PostgreSQL · Date/time types', pg + 'datatype-datetime.html', 'Add available, held and booked states with an expiry time. Test expiry with a controllable clock.', 'Define what should happen when confirmation arrives just after expiry.'],
  ['Idempotent booking requests', ['B-HTTP-02','H-RELIABILITY-01','LAB-7.2'], ['design','supplement'], 'MDN · Idempotent', mdn + 'Glossary/Idempotent', 'Persist a unique idempotency key with the booking result. Test exact repeats and reuse with a changed payload.', 'Explain how callers recover after a timeout whose write outcome is unknown.'],
  ['Database scaling and indexes', ['H-DATABASES-01','B-SQL-02'], ['design','supplement'], 'PostgreSQL · Using EXPLAIN', pg + 'using-explain.html', 'Compare a booking query before and after a relevant index. Explain when replicas or partitions might help.', 'Explain how replication lag changes what a replica can safely answer.'],
  ['Read caching and eviction', ['B-CACHING-01','H-CACHING-01','LAB-8.1','D-LRU-01'], ['java','design','dsa'], 'Redis · Key eviction', 'https://redis.io/docs/latest/develop/reference/eviction/', 'Cache seat availability reads with a TTL and invalidate after booking commits. Record a stale-read scenario.', 'Explain why cache results are suitable for display and where booking authority belongs.'],
  ['Messaging and delivery guarantees', ['B-MESSAGING-01','H-QUEUES-01'], ['java','design'], 'Apache Kafka · Design', 'https://kafka.apache.org/documentation/#design', 'Model a booking confirmation event and test duplicate consumption with an event ID.', 'Explain why a consumer may receive the same event more than once.'],
  ['Traffic experiments and load balancing', ['H-LOADBALANCE-01','H-OBSERVABILITY-01','LAB-8.2'], ['design'], 'GFG System Design syllabus · Scaling foundations', courses.design.links[1][1] + '#page=4', 'Send bounded traffic to the lab. Record request count, error rate, latency and booking-rule violations, if any.', 'Explain how your traffic mix changes observed latency and what a load balancer distributes.'],
  ['Consistency and failure scenarios', ['H-CONSISTENCY-01','H-RELIABILITY-02'], ['design'], 'GFG System Design syllabus · Databases at Scale', courses.design.links[1][1] + '#page=4', 'Draw the request path during a cache outage, a slow database and a retry after timeout.', 'Explain which operation should fail safely and what data may be temporarily stale.'],
  ['Arrays, strings and complexity', ['D-COMPLEXITY-01','D-ARRAYS-01','D-RECURSION-02'], ['dsa'], 'Princeton Algorithms · Analysis of Algorithms', algorithms + '14analysis/', 'Use 12 minutes to count and compare linear search operations and 24 minutes to trace and test factorial and Fibonacci. The separate DSA block covers array scans, updates and prefix sums.', 'Name an input where your worst-case bound is reached.'],
  ['Two pointers, windows and search', ['D-POINTERS-01','D-SEARCH-01'], ['dsa'], 'GFG DSA syllabus · Classes 1–10', courses.dsa.links[1][1], 'Trace a distinct-ID window and a fixed-length sum. Implement a sorted pair search with wide arithmetic, then extend it to unique value triplets. Use the separate DSA block for lower bound and exact search.', 'Explain the invariant that justifies moving a window boundary or discarding a search interval.'],
  ['Sorting, linked lists and stacks', ['D-SORT-01','D-LINKEDLIST-01','D-STACKS-01'], ['dsa'], 'Princeton Algorithms · Merge Sort', algorithms + '22mergesort/', 'Trace merge sort and reverse a linked list. Use a stack to validate a small delimiter sequence.', 'Explain the extra space used by each implementation.'],
  ['LRU implementation and queue operations', ['D-LRU-02','D-QUEUES-01','L-MACHINE-01'], ['dsa','lld'], 'GFG DSA syllabus · Classes 11–16', courses.dsa.links[1][1], 'Implement a fixed-capacity LRU using a map of node references and a doubly linked list. Test a hit, update and eviction.', 'Trace how a map lookup lets you move an existing list node in constant time.'],
  ['Recursion, trees and heaps', ['D-RECURSION-01','D-TREES-01','D-HEAPS-01'], ['dsa'], 'Princeton Algorithms · Priority Queues', algorithms + '24pq/', 'Traverse a tree, then use a Java PriorityQueue to retain the k nearest departures in a stream.', 'Describe how recursion depth and heap size affect auxiliary space.'],
  ['Graphs, BFS and DFS', ['D-GRAPHS-01'], ['dsa'], 'Princeton Algorithms · Undirected Graphs', algorithms + '41graph/', 'Implement BFS for the fewest links in an unweighted graph and DFS to find connected groups.', 'Explain why BFS yields the fewest edges and what the visited set prevents.'],
  ['Greedy and dynamic programming', ['D-GREEDY-01','D-DP-01'], ['dsa'], 'GFG DSA syllabus · Classes 20–24', courses.dsa.links[1][1], 'Select non-overlapping bookings greedily, then solve a weighted variant with a DP recurrence.', 'Find a weighted example where choosing the earliest end no longer maximizes value.'],
  ['Backend security and regression tests', ['B-SECURITY-01','B-TESTING-03'], ['java','design'], 'Spring · Securing a Web Application', spring + 'securing-web/', 'Apply authorization checks and assert that one user cannot access another user’s protected booking data.', 'Distinguish authentication, authorization and validation.'],
  ['Packaging and observability', ['B-DEPLOYMENT-01','H-OBSERVABILITY-02','LAB-9.1'], ['java','design'], 'Spring · Building a Container Image', spring + 'spring-boot-docker/', 'Package the booking app. Record a health check and correlate a request, application log and HTTP response.', 'Explain the difference between health, logs and metrics, and what to do when a dependency fails.'],
  ['LLM inputs and model behavior', ['AI-FOUNDATIONS-02','AI-MODELS-01'], ['genai','supplement'], 'Microsoft · Exploring and comparing LLMs', ai + '02-exploring-and-comparing-different-llms/README.md', 'Compare capabilities and limitations on three sample help questions. Label training, inference, context and output in your notes.', 'Explain which factors influence model choice for a policy assistant.'],
  ['Prompts and structured output', ['AI-PROMPTING-01','AI-STRUCTURED-01'], ['genai','supplement'], 'Spring AI · Structured Output', springAi + 'api/structured-output.html', 'Design a typed FAQ response schema and reject a fabricated or malformed fixture with deterministic checks.', 'Explain why a schema-valid answer can still be factually wrong.'],
  ['Java model API adapter', ['AI-MODEL-API-01','B-AI-01'], ['genai','supplement'], 'Spring AI · Chat Client API', springAi + 'api/chatclient.html', 'Add a ChatClient-compatible adapter behind a port and test success, timeout and invalid output using a fake adapter. A live model is optional.', 'Explain how the backend behaves when the model provider is down.'],
  ['Embeddings and search', ['AI-EMBEDDINGS-01','AI-RETRIEVAL-01'], ['genai','supplement'], 'Spring AI · Embedding Model API', springAi + 'api/embeddings.html', 'Rank synthetic help entries with a small set of fixture vectors. Record retrieved IDs and explain a poor nearest result.', 'Explain what vector similarity measures and when keyword lookup is preferable.'],
  ['Grounded RAG answers', ['AI-RAG-01'], ['genai','supplement'], 'Spring AI · Retrieval Augmented Generation', springAi + 'api/retrieval-augmented-generation.html', 'Retrieve short policy passages, cite their IDs, and return a fallback when no passage supports a claim.', 'Explain the retrieve, generate and validate steps using a single question.'],
  ['Evaluate and observe AI behavior', ['AI-EVALUATION-01','AI-OPERATIONS-01'], ['genai','supplement'], 'Spring AI · Model Evaluation', springAi + 'api/testing.html', 'Make a small evaluation sheet for normal, ambiguous and unanswerable questions. Log latency and score supported answers.', 'Explain why a single plausible answer provides weak evidence of quality.'],
  ['Tool calling and MCP', ['AI-TOOLS-01','AI-MCP-01'], ['genai','supplement'], 'MCP · Learn about the architecture', 'https://modelcontextprotocol.io/docs/learn/architecture', 'Trace one approved read-only help lookup. Draw the arguments, permissions, result and application validation.', 'Explain where application permissions are enforced when a model asks to call a tool.'],
  ['AI security, latency and cost', ['AI-SECURITY-01','AI-OPERATIONS-02'], ['genai','supplement'], 'Spring AI · Observability', springAi + 'observability/index.html', 'Add a timeout, request size limit and safe fallback. Evaluate one fixture containing instructions embedded in a retrieved document.', 'Explain how retries change latency and cost, and where retrieved text is trusted.'],
  ['When to customize a model', ['AI-CUSTOMIZATION-01'], ['genai','supplement'], 'Microsoft · Fine-tuning LLMs', ai + '18-fine-tuning/README.md', 'Write a decision record comparing retrieval, prompts and fine-tuning for a frequently changing booking policy.', 'Explain which type of failure warrants evaluating model customization.'],
  ['Seat Booking capstone', ['H-CASE-UP-01','L-MACHINE-02'], ['design','lld','java'], 'GFG System Design syllabus · Capstone', courses.design.links[1][1] + '#page=6', 'Run the booking flow across two instances. Demonstrate conflict, timeout replay and the optional AI help feature with source-backed output.', 'Explain one changed requirement and make a concrete design trade-off.'],
  ['Review, demonstration and interview', ['L-REVIEW-01','H-REVIEW-01','AI-REVIEW-01'], ['java','design','dsa','genai','lld'], 'LLD roadmap · How we’ll use this hub', lld, 'Select evidence from the lab, complete one independent coding task, then hold a mock interview on previously studied modules.', 'Explain an implemented feature, a limitation and a change you would make for more traffic.'],
  ['JVM diagnostics and concurrent utilities', ['J-JVM-02','J-EXECUTORS-02'], ['java','supplement'], 'Oracle JDK 21 · jcmd diagnostic commands', 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html', 'Capture a local thread dump under controlled contention. Compare a bounded executor and limited virtual-thread task fan-out.', 'Explain what virtual threads change and how you would still protect a limited downstream connection pool.'],
  ['Spring cross-cutting concerns and data access', ['B-DI-02','B-JDBC-02','B-TRANSACTIONS-05'], ['java','supplement'], 'Spring Framework · Using @Transactional', 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html', 'Add a transactional service and a JdbcTemplate row mapper. Demonstrate proxy-boundary rollback and query counting.', 'Which invocation crosses Spring’s proxy? What does a transaction need in order to roll back?'],
  ['OAuth 2.0, OIDC and authorization', ['B-SECURITY-02','H-SECURITY-01'], ['java','design'], 'Spring Security · OAuth 2.0 Resource Server', 'https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html', 'Map token claims to a narrow booking permission. Test missing, invalid and valid-but-insufficient credentials.', 'Explain authentication versus authorization and the purpose of audience and scope checks.'],
  ['API gateways and real-time contracts', ['H-API-01','H-REALTIME-01'], ['design','java'], 'MDN · Using server-sent events', mdn + 'Web/API/Server-sent_events/Using_server-sent_events', 'Draw the gateway boundary and compare REST, gRPC, GraphQL, SSE and WebSockets for booking updates.', 'Choose a real-time transport for a mostly server-to-browser information flow and explain reconnection.'],
  ['Outbox, sagas and failure isolation', ['H-QUEUES-02','H-RELIABILITY-03'], ['design','java'], 'Debezium · Outbox Event Router', 'https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html', 'Write a booking event and its outbox row together, then simulate a duplicate delivery and a failed downstream action.', 'Explain the remaining delivery failure after using an outbox and how a saga handles a failed step.'],
  ['Cloud deployment, SLOs and data placement', ['H-CLOUD-01','H-OBSERVABILITY-03'], ['design','java'], 'Google SRE Workbook · Implementing SLOs', 'https://sre.google/workbook/implementing-slos/', 'Define a booking SLI and error budget, then draw a CI/CD and rollback path for a two-instance application.', 'Explain which failures should burn the booking error budget and why.'],
  ['Backtracking and graph paths', ['D-BACKTRACKING-01','D-GRAPHS-02'], ['dsa'], 'Princeton Algorithms · Shortest Paths', algorithms + '44sp/', 'Enumerate feasible assignments with backtracking. Then compare topological sorting and Dijkstra on suitable graphs.', 'Choose a graph algorithm for prerequisites and state the weight assumptions for Dijkstra.'],
  ['Math, matrices and deeper dynamic programming', ['D-MATH-01','D-MATRIX-01','D-DP-02'], ['dsa'], 'GFG DSA syllabus · Classes 1–5 and 20–24', courses.dsa.links[1][1], 'Implement Euclid’s algorithm, clockwise matrix rotation and a trace of compressed 0/1 subset sum. Use matrix-chain multiplication to compare interval state as a stretch exercise.', 'Explain the state and iteration order for 0/1 subset sum and distinguish it from unbounded reuse.'],
  ['Java-first AI deployment and final review', ['AI-OPERATIONS-03','AI-REVIEW-02','B-DEPLOYMENT-02'], ['genai','supplement','design'], 'Spring AI · Ollama Chat', springAi + 'api/chat/ollama-chat.html', 'Compare fixture, local Ollama and hosted adapters. Run one reproducible end-to-end demonstration and summarize latency, grounding and booking safety.', 'Describe the model-provider trade-off and the exact evidence showing that booking works during an AI outage.'],
  ['Union-Find and minimum spanning trees', ['D-UNION-FIND-01','D-MST-01'], ['supplement'], 'Princeton · Union–Find', algorithms + '15uf/', 'Implement union by size and path compression. Use the provided Java trace to predict the edges and cost selected by Kruskal’s algorithm. Add tests for a duplicate edge, equal weights, disconnected vertices and zero vertices.', 'Why does Kruskal skip an edge joining vertices that already have the same root?'],
  ['Bits, number bases and prime algorithms', ['D-BITS-01','D-BASES-01','D-PRIMES-01','D-SIEVE-01','D-LCM-01'], ['dsa'], 'GFG DSA syllabus · Classes 1–2', courses.dsa.links[1][1] + '#page=7', 'Run the Java number algorithms, then test parity and XOR, round-trip a value through three bases, compare trial division with a sieve, and fold an array LCM. Record the expected and actual results.', 'How do you choose between trial division for one number and a sieve for many queries?']
];

// Authored 30-minute DSA lanes. Later lanes are defined in late-depth.js.
const dsaLanes = {
  26: {
    title: 'Array scans, updates and prefix sums',
    concept: 'A linear scan finds the first matching index. A partially filled array tracks logical size separately from physical capacity. Prefix sums exchange a one-time scan and extra space for fast repeated range sums.',
    example: '[4, -2, 7, 4] has prefix sums [0, 4, 2, 9, 13]. The half-open range [1, 3) sums to 9 − 4 = 5.',
    practice: 'Run ArrayScanTrace.java. Implement firstIndex and rangeSum without the sample, trace insert and delete, and add tests for invalid range and a full buffer.',
    checks: ['First 4 is at 0 and a missing target returns -1.', 'Range [1, 3) returns 5 and a valid empty interval returns 0.', 'A full buffer refuses insert. Inserting and deleting at the same index preserves the original logical data.', 'Explain the strict-leader and second-distinct-maximum policies for duplicates.'],
    readings: [reading('Java 21 API · System.arraycopy', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#arraycopy(java.lang.Object,int,java.lang.Object,int,int)')],
    recall: 'Why does a prefix query take constant time, and which prefix entries change after an update?'
  },
  27: {
    title: 'Linear search, binary search and lower bound',
    concept: 'Use linear search on unsorted input. On sorted input, keep the first value at least as large as the target within the shrinking lower-bound interval. The end sentinel means there is no qualifying value.',
    example: 'In [2, 15, 15, 27], lowerBound(15) returns 1, upperBound(15) returns 3 and lowerBound(30) returns 4.',
    practice: 'Run Day27Bounds.java, reimplement iterative lower bound, and use its result for exact search. Trace the recursive form and compare floor and ceiling when the query lies between two values.',
    checks: ['The first 15 is at index 1. A missing exact result returns -1.', 'For target 16, floor is 15 and ceiling is 27.', 'Empty input returns end sentinel 0, with no floor or ceiling.', 'Explain which steps justify discarding part of the interval and why the same proof fails on an unsorted array.'],
    readings: [reading('Princeton Algorithms · Binary Search', 'https://algs4.cs.princeton.edu/11model/BinarySearch.java.html')],
    recall: 'What does the lower-bound sentinel mean, and why must exact search check the returned index?'
  },
  3: {
    title: 'Duplicate within k positions',
    concept: 'Extend the seen-set again: remember the last index of each value. A repeat at j is close enough when j − lastIndex ≤ k.',
    example: '[1, 0, 1, 1], k = 1: the 1s at indices 2 and 3 are 1 apart, so the answer is true.',
    practice: 'Implement boolean nearbyDuplicate(int[] nums, int k) with a HashMap of last indices, then with a sliding-window HashSet of size k. Compare their space use.',
    checks: ['[1,2,3,1]/3 → true, [1,0,1,1]/1 → true, [1,2,3,1,2,3]/2 → false.', 'Explain why the last index is the only one you need.', 'State time and space for both versions.'],
    readings: [reading('Dev.java · The Map interface', java + 'api/collections-and-streams/collections-framework/maps/')],
    recall: 'What extra information does "duplicate within k" need compared with "any duplicate"?'
  },
  2: {
    title: 'Two Sum with a HashMap',
    concept: 'Extend Day 1’s seen-set: remember where each value was seen. For each number, look up target − number in a value → index map before inserting the current number.',
    example: '[2, 7, 11, 15], target 9: at index 1, 9 − 7 = 2 was seen at index 0, so the answer is [0, 1].',
    practice: 'Implement int[] twoSum(int[] nums, int target) in one pass with a HashMap. Then write the two-pointer version for a sorted array and compare time and space.',
    checks: ['[2,7,11,15]/9 → [0,1], [3,3]/6 → [0,1], [1,2]/7 → [].', 'Look up before insert so an element never pairs with itself.', 'State O(n) expected time and O(n) space, and O(1) extra space for two pointers on sorted input.'],
    readings: [reading('Dev.java · The Map interface', java + 'api/collections-and-streams/collections-framework/maps/')],
    recall: 'Why does Two Sum look up target − x before inserting x?'
  }
};

export const days = [
  { ...foundations, number: 1 },
  ...outline.map(([title, topics, sources, section, url, practice, recall], index) => {
    const number = index + 2;
    const details = liveExamples[number] || {};
    const blocks = [
      { id: 'revision', title: 'Revise the previous study day', kind: 'Revision', minutes: 12 },
      { id: 'learn', title: 'Read and work through an example', kind: 'Teaching', minutes: 28,
        readings: [reading(section, url)], concept: details.concept,
        example: details.example, practice: 'Work through one example from the reading. Explain the sequence in your own words before you code.' },
      { id: 'practice', title: 'Complete the practical assignment', kind: 'Practice', minutes: 65,
        practice, checks: details.checks },
      { id: 'review', title: 'Review and capture evidence', kind: 'Review', minutes: 15,
        practice: 'Save your output or reasoning. Discuss one changed scenario and one limitation after practice.', recall }
    ];
    const lane = dsaLanes[number] || lateLanes[number]; // Days 41–56: late-depth.js (Grok)
    if (lane) {
      // Weekday shape: 12 revision + 78 main (30 learn + 36 practice + 12 review) + 30 DSA.
      blocks[1].minutes = 30; blocks[2].minutes = 36; blocks[3].minutes = 12;
      blocks.splice(3, 0, { id: 'dsa', kind: 'DSA practice', minutes: 30, ...lane });
    }
    return { number, title, topics, sources, blocks, intro: practice, milestone: topics.find(topic => topic.startsWith('LAB-')) };
  })
];

export function dayTracks(day) {
  return [...new Set(day.topics.map(topic => topic.split('-')[0]).filter(id => tracks[id]))];
}
