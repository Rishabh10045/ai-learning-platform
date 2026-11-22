const youtube = (id, title, teacher, focus, minutes = 10) => ({
  id, title, teacher, focus, minutes, platform: 'YouTube', url: 'https://www.youtube.com/watch?v=' + id
});

const mit = (id, title, focus) => youtube(id, title, 'MIT OpenCourseWare', focus);
const microsoft = (id, title, focus, minutes = 10) => ({
  id, title, teacher: 'Microsoft Developer', focus, minutes, platform: 'Microsoft Learn',
  url: 'https://aka.ms/' + id
});

const publisherVideo = (id, title, teacher, url, focus, minutes = 10) => ({
  id, title, teacher, focus, minutes, platform: teacher, url
});

const cmu = (id, title, focus) => youtube(id, title, 'CMU Database Group', focus);

const videos = {
  javaObjects: youtube('BSVKUk58K6U', 'OOP 1: Classes, Objects, Constructors and Keywords', 'Kunal Kushwaha', 'Focus on class and object identity. Apply the visibility rule from the written lesson.', 10),
  streams: youtube('RDh2PjU1WDY', 'Java Streams Tutorial', 'Dan Vega', 'Focus on the filtering example and compare it with an ordinary Java loop.'),
  designInterview: youtube('CtmBGH8MkX4', 'Five Tips for System Design Interviews', 'Gaurav Sen', 'Focus on clarifying requirements, reasoning aloud and justifying a decision.'),
  injection: youtube('TBlB2_4_Sqo', 'Dependency Injection in Spring Boot', 'Dan Vega', 'Compare manual construction with constructor injection in the first demonstration.'),
  rest: { ...youtube('UgX5lgv4uVM', 'Spring Boot 3 Crash Course: Building a REST API', 'Dan Vega', 'Start at the Spring MVC chapter and focus on controller mappings.'), url: 'https://www.youtube.com/watch?v=UgX5lgv4uVM&t=2730s' },
  sql: cmu('MzigBKf84aY', 'Modern SQL', 'Focus on relational statements and supplement with PostgreSQL constraint syntax.'),
  transaction: cmu('4y656idl8ZU', 'Concurrency Control Theory', 'Focus on transactions, isolation and the example schedules.'),
  databaseLocks: cmu('bXpkEt5P_Js', 'Two-Phase Locking Concurrency Control', 'Watch enough to trace a conflicting lock. Compare the DBMS lecture with PostgreSQL row locks.'),
  mvcc: cmu('niLwbfE3V9Q', 'Multi-Version Concurrency Control', 'Focus on how transactions see versions of a row.'),
  distributed: cmu('o7bjRUcDMx0', 'Introduction to Distributed Databases', 'Focus on where data and system coordination live.'),
  oauth: youtube('55OXKx1z6dM', 'OAuth and OpenID Connect in Plain English', 'OktaDev', 'Focus on participants and token types. Follow current Spring Security guidance for implementation.'),
  gateway: youtube('YXkOdWBwqaA', 'Rate Limiter System Design', 'ByteByteGo', 'Focus on gateway rate limits. Use the written lesson for protocol and reconnection choices.'),
  kafka: publisherVideo('confluent-consumers', 'What Is a Kafka Consumer and How Does It Work?', 'Confluent', 'https://developer.confluent.io/learn/streamables/what-is-a-kafka-consumer-and-how-does-it-work/', 'Focus on consumer groups, partition assignment and delivery.'),
  docker: publisherVideo('docker-overview', 'Docker Intro and Overview', 'Docker', 'https://www.docker.com/resources/docker-intro-and-overview-on-demand-training/', 'Watch the container overview and connect runtime configuration to your Java deployment.'),
  security: publisherVideo('dan-vega-jwt', 'Secure REST APIs with Spring Security and JWTs', 'Dan Vega', 'https://www.danvega.dev/blog/spring-security-jwt', 'Use the video and article to identify the resource-server boundary. Follow current docs for dependencies.'),
  mvcTest: publisherVideo('spring-mvc-test', 'MockMvcTester vs RestTestClient', 'Dan Vega', 'https://www.danvega.dev/newsletter/spring-boot-4-new-videos-and-course', 'Focus on controller tests and HTTP behavior. Match the testing API to your Spring Boot version.'),
  llm: youtube('lFXQkBvEe0o', 'Introduction to Generative AI and LLMs', 'Microsoft Developer', 'Watch the opening overview of training, inference and LLM input.', 8),
  race: youtube('RMR75VzYoos', 'Race Conditions in Java Multithreading', 'Jakob Jenkov', 'Pause at the first shared-state interleaving and draw the read and write events.'),
  memory: youtube('LCSqZyjBwWA', 'The Java Memory Model: The Basics', 'Jakob Jenkov', 'Focus on shared memory and the visibility of changes between workers.'),
  dns: youtube('mpQZVYPuDGU', 'How a DNS Server (Domain Name System) works', 'PowerCert Animated Videos', 'Follow the lookup chain: browser cache, resolver, root, TLD and authoritative server.', 7),
  httpCrash: youtube('iYM2zFP3Zn0', 'HTTP Crash Course & Exploration', 'Traversy Media', 'Watch the parts on methods, headers and status codes; skip the tooling demo.', 15),
  hashTables: youtube('KyUTuwz_b7Q', 'Hash Tables and Hash Functions', 'Computer Science Lessons', 'Focus on how a hash picks a bucket and what a collision is.', 10),
  threadsIntro: youtube('mTGdtC9f4EU', 'Java Concurrency and Multithreading - Introduction', 'Jakob Jenkov', 'Focus on what threads share (heap) and what they do not (stacks).', 10),
  hash: mit('Nu8YGneFCWE', 'Hashing', 'Focus on dictionary operations, collisions and expected lookup cost.'),
  computation: mit('ZA-tUyM_y7s', 'Algorithms and Computation', 'Focus on modeling the input and measuring work against input size.'),
  sorting: mit('oS9aPzUNG-s', 'Sets and Sorting', 'Follow the first merge-sort example and trace ties independently.'),
  heap: mit('Xnpo1atN-Iw', 'Binary Heaps', 'Watch insertion and root removal before coding your top-k variant.'),
  bfs: mit('oFVYVzlvk9c', 'Breadth-First Search', 'Trace distance layers and parent links on paper.'),
  dfs: mit('IBfWDYSffUU', 'Depth-First Search', 'Focus on finishing order and the reasoning behind cycle checks.'),
  dijkstra: mit('NSHizBK9JD8', 'Dijkstra', 'Focus on the nonnegative weight assumption and extracting the next vertex.'),
  dp: mit('r4-cftqTcdI', 'Dynamic Programming, Part 1', 'Watch the subproblem and dependency discussion before translating it to intervals.'),
  intervalDp: mit('TDo3r5M1LNo', 'Dynamic Programming, Part 3', 'Focus on the parenthesization example and interval subproblems.'),
  queryPlan: youtube('b53huOGcsZ8', 'Database Query Optimizers, Part 1', 'CMU Database Group', 'Focus on query plan choices. Then inspect your actual PostgreSQL plan.'),
  consistentHash: youtube('zaRkONvyGr8', 'What Is Consistent Hashing?', 'Gaurav Sen', 'Notice which keys move when a server is added and where hot keys can persist.'),
  cache: youtube('U3RkDLtS7uY', 'Distributed Caches and Data Consistency', 'Gaurav Sen', 'Focus on cache invalidation and which reads can tolerate stale values.'),
  models: microsoft('gen-ai-lesson2-gh', 'Exploring and Comparing Different LLMs', 'Use the discussion of model choice to build your comparison table.'),
  prompts: microsoft('gen-ai-lesson4-gh', 'Prompt Engineering Fundamentals', 'Focus on instructions, context and examples. Implement the Java output checks yourself.'),
  pythonRetrieval: microsoft('gen-ai-lesson8-gh', 'Building Search Apps with Vector Databases', 'Watch the retrieval concepts. Use Java fixtures in your exercise.'),
  rag: microsoft('gen-ai-lesson15-gh', 'RAG and Vector Databases', 'Map the retrieval stages to your Java help service.'),
  evaluation: microsoft('gen-ai-lesson14-gh', 'The Generative AI Application Lifecycle', 'Focus on evaluation and stages of an LLM application.'),
  toolCalling: microsoft('gen-ai-lesson11-gh', 'Integrating External Apps with Function Calling', 'Follow argument validation and result handling. Use a read-only Java tool.'),
  safety: microsoft('gen-ai-lesson13-gh', 'Securing Generative AI Applications', 'Focus on input trust boundaries and application checks.'),
  tuning: microsoft('gen-ai-lesson18-gh', 'Fine-Tuning LLMs', 'Focus on when customization helps. The training implementation is optional.'),
  springAi: youtube('aNKDoiOUo9M', 'Spring Tips: Spring AI', 'SpringDeveloper', 'Use this for the integration overview. Follow the current Spring AI reference for API signatures.'),
  ollama: youtube('P4P24jmogmM', 'Getting Started with Ollama in Spring', 'SpringDeveloper', 'Focus on the local model setup and provider boundary.'),
  mst: mit('tKwnms5iRBU', 'Greedy Algorithms: Minimum Spanning Tree', 'Focus on the cut property and why Kruskal’s smallest safe edge is always correct.'),
  numberTheory: mit('NuY7szYSXSw', 'Mathematics for Computer Science · Number Theory I', 'Focus on the GCD, Euclid’s algorithm and linear combinations (Bézout).')
};

const byDay = {
  1: ['javaObjects', 'dns', 'httpCrash', 'llm', 'hashTables'], 2: ['threadsIntro', 'race'], 3: ['memory'], 4: ['hash'], 5: ['javaObjects'], 6: ['streams'], 7: ['memory'],
  8: ['mvcTest'], 9: ['injection'], 10: ['rest'], 11: ['mvcTest'], 12: ['sql'],
  13: ['transaction'], 14: ['mvcc'], 15: ['databaseLocks'], 16: ['transaction'],
  17: ['distributed'], 18: ['designInterview'], 19: ['transaction'], 20: ['transaction'],
  21: ['queryPlan', 'consistentHash'], 22: ['cache'], 23: ['kafka'], 24: ['gateway'], 25: ['cache'],
  26: ['computation'], 27: ['computation'], 28: ['sorting'], 29: ['hash'],
  30: ['heap'], 31: ['bfs', 'dfs'], 32: ['dp'], 33: ['security'], 34: ['docker'],
  35: ['models'], 36: ['prompts'], 37: ['springAi'], 38: ['pythonRetrieval'],
  39: ['rag'], 40: ['evaluation'], 41: ['toolCalling'], 42: ['safety'],
  43: ['tuning'], 44: ['springAi'], 45: ['designInterview'], 46: ['memory'], 47: ['injection'], 48: ['oauth'],
  49: ['gateway'], 50: ['kafka'], 51: ['docker'], 52: ['dijkstra', 'dfs'], 53: ['intervalDp'], 54: ['ollama'], 55: ['mst'], 56: ['numberTheory']
};

export function videosForDay(number) {
  return (byDay[number] || []).map(id => videos[id]);
}
