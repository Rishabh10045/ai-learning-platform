// Days 41–56 depth pass (Grok; claimed in collab/COLLAB.md "content split", 2026-11-22).
// Every Java program below is a verbatim copy of notes/java-examples/<Class>.java. CI runs each one on JDK 21
// (checks/java-examples.mjs) and compares the printed output with `output`. Every URL returned HTTP 200 when it
// was added. Day 41–56 keys belong to Grok; Codex owns Days 4–40 (see COLLAB).
// Consumers: day-depth.js merges these maps into depthPackets / extraDistractors / extraExplanations / stretchPlans;
// curriculum.js reads lateLanes for the 30-minute DSA block.

const jdk = 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/';
const mcp = 'https://modelcontextprotocol.io/specification/2025-11-25/';
const reading = (title, url) => ({ title, url });

// ---------------------------------------------------------------------------------------------------------------
// 30-minute DSA lanes (weekday shape 12 revision + 30 learn + 36 practice + 12 review + 30 DSA = 120 min).
export const lateLanes = {
  41: {
    title: 'Valid brackets with a stack',
    concept: 'A closing bracket must match the most recent opening bracket that is still open. "Most recent first" is last-in, first-out, so keep the expected closers on a stack. Push the matching closer for every opener. On every closer, pop and compare. At the end the stack must be empty.',
    example: '"{[()]}" pushes } ] ) and then pops ) ] } in order, so it is valid. "([)]" pops ] when it sees ), so it fails at index 2.',
    practice: 'Implement boolean isValid(String s) with an ArrayDeque<Character> used as a stack. Then return the index of the first error instead of a boolean, using −1 for valid input and s.length() for unclosed openers.',
    checks: ['"()[]{}" → true, "{[()]}" → true, "(]" → false, "([)]" → false, "((" → false, "" → true.', 'The error-index version returns 1 for "(]" and 2 for "((".', 'State O(n) time and O(n) worst-case space, and name the input that reaches the worst case.'],
    readings: [reading('Java 21 API · Deque (stack methods push/pop)', jdk + 'java/util/Deque.html')],
    recall: 'Why must a closing bracket be compared with the most recent unmatched opener, and which data structure gives that order?'
  },
  42: {
    title: 'Sliding-window rate limiter with a queue',
    concept: 'To allow at most N requests in any W-millisecond window, keep the timestamps of accepted requests in a queue, oldest first. For each request, drop timestamps at or before now − W from the front, then accept only if fewer than N remain.',
    example: 'Limit 3 per 1000 ms. Requests at 0, 100 and 200 are accepted. 300 and 999 get 429. At 1000 the 0 expires, so it is accepted.',
    practice: 'Implement boolean allow(long nowMs) with an ArrayDeque<Long>. Then keep one limiter per user in a Map<String, RecentRequests> and show that two users do not share a limit.',
    checks: ['Times 0,100,200,300,999,1000,1100,1250,2300 → ok ok ok 429 429 ok ok ok ok.', 'Rejected requests are not stored in the queue.', 'State amortized O(1) per request and O(N) memory per user.'],
    readings: [reading('Java 21 API · ArrayDeque (queue methods)', jdk + 'java/util/ArrayDeque.html')],
    recall: 'Why does a sliding-window limiter store timestamps instead of a single counter, and when does a timestamp leave the queue?'
  },
  43: {
    title: 'Top-k frequent with a min-heap',
    concept: 'Count each value with a HashMap. Then keep a min-heap of size k ordered by count, popping the weakest whenever the heap grows past k. What remains are the k most frequent values.',
    example: 'refund×4, parking×3, seat×2, food×1 with k = 2 gives [refund, parking]. food and then seat were popped as the weakest.',
    practice: 'Implement List<String> topK(String[] items, int k) with HashMap.merge and a PriorityQueue of size k. Break ties alphabetically and return the result strongest first.',
    checks: ['k=2 → [refund, parking]; k=3 → [refund, parking, seat]; ["b","a","c"], k=2 → [a, b]; empty → [].', 'The heap never holds more than k + 1 elements.', 'State O(n + m log k) time and explain why sorting all values is slower when k ≪ m.'],
    readings: [reading('Java 21 API · PriorityQueue', jdk + 'java/util/PriorityQueue.html')],
    recall: 'Why does keeping the k largest values need a min-heap, and what does the heap’s head represent?'
  },
  44: {
    title: 'Merge overlapping hold intervals',
    concept: 'Sort intervals by start. Keep the last merged interval, and extend it while the next interval starts at or before its end. Otherwise start a new one. For half-open intervals, [a,b) and [c,d) overlap exactly when a < d and c < b.',
    example: '[30,40), [0,10), [5,15), [15,20), [50,55) sort and merge to [0,20), [30,40), [50,55). A new hold [20,30) fits between them, and [18,25) conflicts.',
    practice: 'Implement List<Hold> merge(List<Hold> holds) and boolean conflicts(List<Hold> busy, Hold wanted) with a record Hold(int start, int end). Then add minRooms() with a PriorityQueue of end times.',
    checks: ['merge gives [0,20), [30,40), [50,55) for the example, and [] for no holds.', 'conflicts returns false for [20,30) and true for [18,25).', 'minRooms([0,30),[5,10),[15,20)) = 2, and the time is O(n log n).'],
    readings: [reading('Java 21 API · Comparator.comparingInt', jdk + 'java/util/Comparator.html')],
    recall: 'Why must intervals be sorted by start before merging, and what are the two comparisons that detect overlap of half-open intervals?'
  },
  // @@lanes
};

// ---------------------------------------------------------------------------------------------------------------
// Topic packets (keys are topic-index IDs) and DSA-lane packets (keys end in .dsa).
export const lateDepthPackets = {
  'ai-tools-01': {
    notes: [
      'With tool calling, the model does not run anything. It returns a proposal: a tool name and arguments, usually as JSON that should match a schema you published. Your application decides whether to execute it. Treat the proposal as untrusted input from the network, exactly like a request body. A prompt-injected document, a confused model or a malicious user can each produce a well-formed proposal that asks for the wrong thing.',
      'Put three checks at the tool boundary, in this order. (1) Allowlist: only tools you registered for this feature can run, and a help assistant gets read-only tools. (2) Validation: parse the arguments against the schema and your own rules (formats, ranges, known IDs) before using them. (3) Authorization: decide with the authenticated caller from your session or token, never with an identity or scope the model wrote into the arguments. The tool then runs with the caller’s rights, not with a powerful service account. Otherwise you have a confused deputy: a privileged component doing work for someone who is not allowed to do it.',
      'Tool results go back to the model as data. A policy text that says "ignore previous instructions" is still only text. Do not let tool output widen permissions or trigger new tools automatically. Side-effecting tools (cancel, refund, book) need more than read tools: an explicit user confirmation, an idempotency key so a retried call does not act twice, a timeout, and an audit log entry that records who approved what. OWASP lists this risk as "Excessive Agency": too many tools, too broad permissions, or actions without a human check.',
      'In the booking project the model may call lookupPolicy(venue, topic) to quote a refund rule. The seat-ownership invariant from Day 1 never depends on the model. Booking and cancellation stay normal authenticated API calls that the user makes. ToolGate.java shows four proposals for user U1, who may read VENUE-A only. One proposal executes. The other three are rejected: a different venue, an injected argument and a tool that is not on the allowlist. Note that the out-of-scope request had perfectly valid syntax, which is why authorization cannot be replaced by schema validation.'
    ],
    code: {
      title: 'ToolGate.java · allowlist → validate → authorize with the caller · java ToolGate.java',
      text: String.raw`import java.util.*;

public class ToolGate {
    // What the model sends back: a tool name plus arguments. It is a proposal, not a permission.
    record Proposal(String tool, Map<String, String> args) {}
    // Who is really asking, taken from the authenticated session, never from the model.
    record Caller(String userId, Set<String> venues) {}
    record Outcome(boolean executed, String detail) {}

    static final Map<String, String> POLICIES = Map.of(
        "VENUE-A/REFUND", "Refunds up to 24h before the show.",
        "VENUE-B/REFUND", "No refunds; exchanges only.");
    static final Set<String> ALLOWED_TOOLS = Set.of("lookupPolicy");   // allowlist: read-only tools only

    static Outcome handle(Caller caller, Proposal p) {
        if (!ALLOWED_TOOLS.contains(p.tool())) return new Outcome(false, "rejected: tool not allowed: " + p.tool());
        String venue = p.args().get("venue"), topic = p.args().get("topic");
        if (venue == null || !venue.matches("VENUE-[A-Z]") || topic == null || !topic.matches("[A-Z]{3,12}"))
            return new Outcome(false, "rejected: invalid arguments venue=" + venue + " topic=" + topic);
        if (!caller.venues().contains(venue))                              // authorization uses the caller, not the args
            return new Outcome(false, "rejected: " + caller.userId() + " may not read " + venue);
        String text = POLICIES.get(venue + "/" + topic);
        if (text == null) return new Outcome(false, "rejected: no such policy " + venue + "/" + topic);
        return new Outcome(true, "result (data, not instructions): " + text);
    }

    public static void main(String[] args) {
        Caller u1 = new Caller("U1", Set.of("VENUE-A"));
        List<Proposal> proposals = List.of(
            new Proposal("lookupPolicy", Map.of("venue", "VENUE-A", "topic", "REFUND")),
            new Proposal("lookupPolicy", Map.of("venue", "VENUE-B", "topic", "REFUND")),
            new Proposal("lookupPolicy", Map.of("venue", "A; DROP", "topic", "REFUND")),
            new Proposal("cancelBooking", Map.of("bookingId", "B-7")));
        int executed = 0;
        for (Proposal p : proposals) {
            Outcome o = handle(u1, p);
            if (o.executed()) executed++;
            System.out.println(p.tool() + " -> " + o.detail());
        }
        System.out.println("executed=" + executed + " of " + proposals.size());
    }
}
`,
      output: String.raw`lookupPolicy -> result (data, not instructions): Refunds up to 24h before the show.
lookupPolicy -> rejected: U1 may not read VENUE-B
lookupPolicy -> rejected: invalid arguments venue=A; DROP topic=REFUND
cancelBooking -> rejected: tool not allowed: cancelBooking
executed=1 of 4`
    },
    takeaways: [
      'A tool call from the model is a proposal; the application decides.',
      'Order at the boundary: allowlist, validate arguments, authorize with the real caller.',
      'Run tools with the caller’s rights, not a powerful service account.',
      'Tool results are data; they never grant new permissions.',
      'Side effects need confirmation, an idempotency key, a timeout and an audit entry.'
    ],
    interview: [
      ['A model asks to call getBooking with bookingId B-9, which belongs to another user. Where is this stopped?',
        'In the tool implementation or the service it calls, using the authenticated caller from the session or token. The tool loads B-9, sees that its owner is not the caller and returns a not-found or forbidden result. That is the same rule the normal REST endpoint uses. Validating the argument schema cannot stop it, because B-9 is a well-formed ID, and the system prompt cannot stop it either, because injected text can override instructions. Test it with a valid ID owned by someone else, not only with a malformed ID.'],
      ['What is the confused deputy problem in tool calling?',
        'A component with broad privileges performs an action on behalf of a caller who lacks those privileges. In tool calling this happens when the tool runs with a service account that can read every venue and trusts the model’s arguments to say which venue is allowed. A prompt injection then reads data the user could never request directly. The fix is to carry the caller’s identity into the tool, use delegated or scoped credentials, and authorize every call against that identity. Keep the service account for what the system itself must do.'],
      ['How would you let an assistant cancel a booking safely?',
        'Keep the model in a proposing role. The assistant proposes cancelBooking with a booking ID. The application shows the user a confirmation with the booking details and the refund rule, and only a user click sends the normal authenticated cancel request. The request carries an idempotency key, so a retry or a double click cancels once. The service checks ownership and state, such as already cancelled or the show has started, writes an audit record, and returns the result. The model never holds the authority to act alone.'],
      ['Why is JSON-schema validation of tool arguments necessary but not sufficient?',
        'Schema validation rejects missing fields, wrong types and impossible formats before any code uses them. That prevents crashes and many injection attempts, such as the "A; DROP" venue in ToolGate.java. It cannot know who is asking or whether that person may see VENUE-B. A schema-valid request can still be unauthorized, too large, too frequent or unsafe in context. So the boundary also needs authorization with the real caller, size and rate limits, and business rules. Schema validation answers "is it well-formed?", not "is it allowed?".']
    ],
    check: ['ToolGate.java receives lookupPolicy(VENUE-B, REFUND) from U1, who may read VENUE-A only. Which check rejects it?',
      ['The allowlist, because lookupPolicy is not registered', 'Argument validation, because VENUE-B is malformed', 'Authorization against the caller’s venues', 'The model, because the system prompt forbids it'], 2,
      'The tool is allowed and VENUE-B matches the format. Only the caller-based authorization check knows U1 may not read it.'],
    practice: ['Run ToolGate.java. Add a second caller, U2, scoped to VENUE-B, and a read-only tool listMyBookings that takes no user ID argument and reads the caller from the Caller record. Add one proposal that tries to pass userId=U2 as an argument while the caller is U1.',
      ['The program still prints executed=1 of 4 for the original four proposals.', 'U2 can read the VENUE-B refund policy, and U1 still cannot.', 'listMyBookings ignores a userId argument and returns only the caller’s bookings.', 'Each rejection prints which check (allowlist, validation or authorization) stopped it.']],
    references: [
      ['OWASP GenAI · LLM06 Excessive Agency', 'https://genai.owasp.org/llmrisk/llm062025-excessive-agency/'],
      ['Spring AI reference · Tool calling', 'https://docs.spring.io/spring-ai/reference/api/tools.html'],
      ['MCP specification · Tools (human in the loop, isError)', mcp + 'server/tools']
    ]
  },

  'ai-mcp-01': {
    notes: [
      'The Model Context Protocol (MCP) standardizes how an AI application connects to external tools and data. There are three roles. The host is the application the user runs, such as an IDE or a chat app. Inside it, one MCP client connects to one MCP server. A server exposes capabilities: tools (actions the model may propose), resources (read-only context such as files or records) and prompts (reusable templates). Messages are JSON-RPC 2.0 requests, responses and notifications. They travel over a transport: stdio for a local server process, or Streamable HTTP for a remote server.',
      'A session starts with initialize, where client and server agree on a protocol version and declare their capabilities. The client then calls tools/list to discover tools. Each tool has a name, a description and an inputSchema (JSON Schema). To run one, the client sends tools/call with the name and arguments. The server returns result.content, for example text items, and isError. The spec separates two kinds of failure. A protocol error, such as an unknown tool, is a JSON-RPC error; the spec’s own example uses code -32602. A tool execution error, such as "not permitted" or "API down", is a normal result with isError: true, so the model can see it and react.',
      'MCP is a connection protocol, not a security layer. A server is code you chose to trust. Its tool descriptions are text that the model reads, so a malicious or compromised server can plant instructions there. The spec says there should always be a human in the loop who can deny tool invocations, and hosts should show which tools are exposed and confirm sensitive operations. For HTTP transports the spec defines authorization based on OAuth 2.1. The MCP server acts as a resource server and must accept only tokens issued for itself, the audience check from Day 48. Clients use resource indicators (RFC 8707) to request such tokens. Passing a user’s upstream token straight through the server is explicitly forbidden. A stdio server gets its credentials from the environment instead.',
      'For the booking help feature, an MCP server could expose lookupPolicy as a tool and the policy documents as resources. The server still authorizes every call against the authenticated connection: the token’s venues, not the venue argument. McpDispatch.java shows a server-side dispatcher. tools/list succeeds. A call for VENUE-A returns isError false. VENUE-B returns a tool result with isError true. An unknown tool gets -32602, and an unknown method gets -32601 (method not found).'
    ],
    code: {
      title: 'McpDispatch.java · JSON-RPC 2.0 tools/list and tools/call with a server-side scope check · java McpDispatch.java',
      text: String.raw`import java.util.*;

public class McpDispatch {
    // A JSON-RPC 2.0 request as an MCP server sees it (parsed into fields to keep the example dependency-free).
    record Request(int id, String method, String tool, Map<String, String> arguments) {}

    // The server's own tool list. Clients discover it with tools/list; the description is text a model will read.
    static final Map<String, String> TOOLS = new LinkedHashMap<>(Map.of(
        "lookupPolicy", "Read one venue policy. Arguments: venue (VENUE-X), topic (REFUND|ENTRY)."));

    // Scope comes from the server's own authentication of the connection, e.g. a validated token, never from arguments.
    static String dispatch(Request r, Set<String> tokenVenues) {
        return switch (r.method()) {
            case "tools/list" -> result(r.id(), "{\"tools\":[{\"name\":\"lookupPolicy\"}]}");
            case "tools/call" -> {
                if (!TOOLS.containsKey(r.tool())) yield error(r.id(), -32602, "Unknown tool: " + r.tool());
                String venue = r.arguments().getOrDefault("venue", "");
                if (!tokenVenues.contains(venue))
                    yield result(r.id(), "{\"content\":[{\"type\":\"text\",\"text\":\"not permitted for " + venue + "\"}],\"isError\":true}");
                yield result(r.id(), "{\"content\":[{\"type\":\"text\",\"text\":\"" + venue + " refund: up to 24h before\"}],\"isError\":false}");
            }
            default -> error(r.id(), -32601, "Method not found");
        };
    }
    static String result(int id, String json) { return "{\"jsonrpc\":\"2.0\",\"id\":" + id + ",\"result\":" + json + "}"; }
    static String error(int id, int code, String msg) {
        return "{\"jsonrpc\":\"2.0\",\"id\":" + id + ",\"error\":{\"code\":" + code + ",\"message\":\"" + msg + "\"}}";
    }

    public static void main(String[] args) {
        Set<String> scope = Set.of("VENUE-A");
        List<Request> requests = List.of(
            new Request(1, "tools/list", null, Map.of()),
            new Request(2, "tools/call", "lookupPolicy", Map.of("venue", "VENUE-A")),
            new Request(3, "tools/call", "lookupPolicy", Map.of("venue", "VENUE-B")),
            new Request(4, "tools/call", "deleteVenue", Map.of()),
            new Request(5, "resources/write", null, Map.of()));
        for (Request r : requests) System.out.println(dispatch(r, scope));
    }
}
`,
      output: String.raw`{"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"lookupPolicy"}]}}
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"VENUE-A refund: up to 24h before"}],"isError":false}}
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"not permitted for VENUE-B"}],"isError":true}}
{"jsonrpc":"2.0","id":4,"error":{"code":-32602,"message":"Unknown tool: deleteVenue"}}
{"jsonrpc":"2.0","id":5,"error":{"code":-32601,"message":"Method not found"}}`
    },
    takeaways: [
      'Host runs clients; each client talks to one server over JSON-RPC 2.0.',
      'Servers expose tools, resources and prompts; tools/list then tools/call.',
      'Unknown tool is a protocol error; a failed action is a result with isError true.',
      'MCP carries requests; the server still authorizes every call.',
      'Tool descriptions are model-visible text, so only connect servers you trust.'
    ],
    interview: [
      ['Explain MCP’s host, client and server roles with one example.',
        'The host is the application the user works in, for example a chat app with an assistant. For each integration the host creates an MCP client, and each client holds one connection to one MCP server. A booking-policy server might expose a lookupPolicy tool and the policy documents as resources. The host decides which servers to connect, shows the user what is exposed and asks for consent on sensitive actions. The model only sees tool descriptions and results through the host. It never talks to the server directly.'],
      ['What is the difference between a JSON-RPC error and isError: true in an MCP tool result?',
        'A JSON-RPC error means the request itself failed at the protocol level: unknown method (-32601), unknown tool or invalid parameters (the spec example uses -32602), or a server exception. An isError: true result means the tool ran but the action failed, for example "not permitted for VENUE-B" or "upstream timeout". That result is returned to the model as content so it can explain the problem or try another approach. Mixing them up hides useful failures from the model or turns ordinary business failures into protocol noise.'],
      ['Does connecting a tool through MCP make it safe? What would you still do?',
        'No. MCP defines discovery and message formats and, for HTTP, an OAuth 2.1-based authorization flow. It does not decide what a given user may do. The server must validate arguments and authorize every call against the authenticated connection. The host should keep a human able to deny invocations and confirm sensitive ones. Tool descriptions and results should be treated as untrusted text that may carry injected instructions. Servers should be pinned to versions you reviewed, and each server should get the least privilege it needs, with timeouts and audit logs.'],
      ['Why does the MCP authorization spec insist that a server accept only tokens issued for itself?',
        'If a server accepted any valid token from the same identity provider, a token issued to another service could be replayed against it. The server would also be tempted to pass the user’s token on to upstream APIs, which the spec forbids as token passthrough, because the upstream would then trust a token that was never meant for it. Requiring the audience to be this server, which clients request with RFC 8707 resource indicators, keeps every token bound to one resource. This is the same audience check you apply to a REST API.']
    ],
    check: ['An MCP client calls tools/call for lookupPolicy, and the token’s scope does not include the requested venue. What should the server return?',
      ['A JSON-RPC error -32601 Method not found', 'A tool result with isError: true explaining it is not permitted', 'The policy text, because the tool exists and the arguments are valid', 'Nothing; drop the connection'], 1,
      'The method and tool exist, so this is not a protocol error. The tool ran its authorization and refused, which is a tool execution error: a result with isError true.'],
    practice: ['Run McpDispatch.java. Add an initialize case that returns the server capabilities {"tools":{"listChanged":false}}, and an ENTRY policy. Then add a second connection scoped to VENUE-B and show that the same five requests give different results for it.',
      ['initialize returns a JSON-RPC result containing a tools capability.', 'The VENUE-B connection gets isError false for VENUE-B and isError true for VENUE-A.', 'Unknown tools still produce -32602 and unknown methods -32601.', 'Write two sentences on why the venue scope comes from the connection and not from the arguments.']],
    references: [
      ['MCP · Architecture overview', 'https://modelcontextprotocol.io/docs/learn/architecture'],
      ['MCP specification · Authorization (OAuth 2.1, audience, RFC 8707)', mcp + 'basic/authorization'],
      ['MCP specification · Security best practices (confused deputy, token passthrough)', mcp + 'basic/security_best_practices'],
      ['JSON-RPC 2.0 specification (error codes)', 'https://www.jsonrpc.org/specification']
    ]
  },

  'ai-tools-01.dsa': {
    notes: [
      'Bracket matching is the classic stack problem. Scan left to right. For an opener, push the closer you will need. For a closer, the stack must be non-empty and its top must be exactly that closer. Pop it and continue. When the scan ends, an empty stack means every opener was closed. Pushing the expected closer instead of the opener avoids a separate lookup table at pop time.',
      'Use ArrayDeque as the stack in Java. Its push, pop and peek work on the head, and it is faster than the legacy synchronized Stack class. Each character is pushed and popped at most once, so the time is O(n). The stack can hold up to n characters for input like "((((((", so the worst-case space is O(n).',
      'Interviewers usually follow up with variants: return the first error index, ignore characters inside string literals, count the minimum insertions to fix the input, or find the longest valid substring. The last one stores indices instead of characters. Seeing that structure validation is "most recent unmatched first" is the reusable idea. The same idea appears when you check that JSON tool arguments are well nested.'
    ],
    code: {
      title: 'ValidBrackets.java · java ValidBrackets.java',
      text: String.raw`import java.util.ArrayDeque;
import java.util.Deque;

public class ValidBrackets {
    // Every closer must match the most recent unmatched opener: last in, first out, so use a stack.
    static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '(' -> stack.push(')');
                case '[' -> stack.push(']');
                case '{' -> stack.push('}');
                case ')', ']', '}' -> {
                    if (stack.isEmpty() || stack.pop() != c) return false;   // closer with no opener, or wrong type
                }
                default -> { }                                                 // ignore other characters
            }
        }
        return stack.isEmpty();                                                // unclosed openers fail
    }

    public static void main(String[] args) {
        String[] inputs = {"()[]{}", "{[()]}", "(]", "([)]", "((", "", "{\"venue\":[1,2]}"};
        for (String in : inputs) System.out.println("\"" + in + "\" -> " + isValid(in));
    }
}
`,
      output: String.raw`"()[]{}" -> true
"{[()]}" -> true
"(]" -> false
"([)]" -> false
"((" -> false
"" -> true
"{"venue":[1,2]}" -> true`
    },
    takeaways: ['Most-recent-unmatched-first means a stack.', 'Push the expected closer; compare on pop.', 'Empty stack at the end, or it is invalid.', 'O(n) time, O(n) worst-case space.'],
    interview: [
      ['Why is a counter not enough to validate "([)]"?', 'A counter per bracket type only checks totals. "([)]" has one of each, so the counts balance, but the closers come in the wrong order: ) closes while [ is the most recent opener. You need to remember the order of open brackets, and the most recent one must close first, which is exactly what a stack stores. A single counter works only when there is one bracket type, such as checking "(()())".'],
      ['How do you find the longest valid parentheses substring?', 'Keep a stack of indices, starting with −1 as a base. Push the index of every "(". On ")", pop. If the stack becomes empty, push the current index as the new base. Otherwise the valid run ends here, and its length is the current index minus the index now on top. Track the maximum. It runs in O(n) time and O(n) space. There is also an O(1)-space two-pass counter method, scanning left to right and then right to left.'],
      ['Why prefer ArrayDeque over java.util.Stack?', 'Stack extends Vector, so every method is synchronized and you pay for locking you do not need. It also exposes index-based methods that break the stack abstraction. ArrayDeque is unsynchronized, backed by a resizable array, and documented as likely faster than Stack when used as a stack. Use push, pop and peek, which all work on the head. Neither class is thread-safe for shared use without external coordination, which a local stack does not need.']
    ],
    check: ['For "([)]", at which index does isValid return false, and why?', ['Index 1, because [ cannot follow (', 'Index 2, because ) arrives while ] is expected on top', 'Index 3, because ] has no opener', 'It returns true; the counts balance'], 1,
      'After "([" the stack top is ]. The ) at index 2 pops ] and the comparison fails.'],
    practice: ['Copy ValidBrackets.java, then add int firstError(String s): −1 when valid, the index of the first bad closer, or s.length() when openers remain. Test it on every input in main.',
      ['firstError("(]") = 1, firstError("((") = 2, firstError("{[()]}") = −1.', 'isValid output is unchanged.', 'State time and space and the worst-case input.']],
    references: [['Java 21 API · ArrayDeque', jdk + 'java/util/ArrayDeque.html']]
  },
  'ai-security-01': {
    notes: [
      'An LLM reads instructions and data in the same stream of tokens, so it cannot reliably tell them apart. That is the root of prompt injection. In direct injection, the user types "ignore your rules". In indirect injection, the attack text sits inside content the application feeds the model, such as a retrieved policy page, an email or a web page, and the model follows it as if you had written it. OWASP ranks prompt injection first (LLM01) in its GenAI Top 10. No prompt wording fully prevents it, so design as if the model’s behavior can be steered by anything it reads.',
      'Defend in layers. Layer 1, limit what an injected instruction can achieve. Give the model read-only tools, authorize each call with the real caller (Day 41) and keep secrets out of the prompt. Layer 2, mark untrusted content clearly. Put retrieved text inside delimiters and tell the model it is reference material. This lowers the success rate but is not a guarantee. Layer 3, bound the input. Cap the request size and the number of retrieved chunks so an attacker cannot flood the context. Layer 4, check the output before anyone acts on it.',
      'Output handling is where many real bugs live. OWASP lists Improper Output Handling as LLM05. Treat model output like user input. HTML-encode it before rendering, or a model that repeats "<img src=x onerror=...>" becomes an XSS hole. Never pass it to eval, a shell or a SQL string. Validate structured output against a schema. Check every claim against what you supplied: a citation must refer to a document you actually retrieved for this request. Reject answers that invent links, and fall back to a safe message when a check fails. OutputGuard.java applies these checks to five model answers. Only the cited, link-free answers are shown, and the one containing HTML is shown encoded.',
      'Sensitive data needs the same discipline. Retrieve only documents the caller may read. Do not put other users’ data, keys or internal URLs into the prompt. Remember that prompts and outputs may be logged by you or by the provider. Log enough to debug, which means request ID, document IDs and check results, without storing personal data you do not need. For the booking help feature, the worst safe outcome is a polite "I can’t answer that, here is the policy page". The booking invariant is never at risk, because the model cannot write bookings.'
    ],
    code: {
      title: 'OutputGuard.java · validate model output against retrieved sources, then HTML-encode · java OutputGuard.java',
      text: String.raw`import java.util.*;

public class OutputGuard {
    // What the model returned for a help question, already parsed from structured (JSON) output.
    record Answer(String text, List<String> citations) {}

    static final int MAX_CHARS = 300;

    // Model output is untrusted: check it against what the application actually supplied, then encode it for HTML.
    static String check(Answer a, Set<String> retrievedIds) {
        if (a.text().length() > MAX_CHARS) return "REJECT too long (" + a.text().length() + " chars)";
        if (a.citations().isEmpty()) return "REJECT no citation";
        for (String c : a.citations())
            if (!retrievedIds.contains(c)) return "REJECT cites " + c + ", which was not retrieved";
        if (a.text().toLowerCase().contains("http")) return "REJECT contains a link";      // no model-written links
        return "SHOW " + escapeHtml(a.text());
    }

    static String escapeHtml(String s) {
        StringBuilder out = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                case '&' -> out.append("&amp;");
                case '"' -> out.append("&quot;");
                case '\'' -> out.append("&#x27;");
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    public static void main(String[] args) {
        Set<String> retrieved = Set.of("POL-7");   // the only document retrieval returned for this question
        List<Answer> answers = List.of(
            new Answer("Refunds are allowed up to 24h before the show.", List.of("POL-7")),
            new Answer("Refunds are always allowed.", List.of("POL-9")),
            new Answer("See <img src=x onerror=alert(1)> for details.", List.of("POL-7")),
            new Answer("Claim your refund at http://refund.example", List.of("POL-7")),
            new Answer("Refunds are allowed.", List.of()));
        for (Answer a : answers) System.out.println(check(a, retrieved));
    }
}
`,
      output: String.raw`SHOW Refunds are allowed up to 24h before the show.
REJECT cites POL-9, which was not retrieved
SHOW See &lt;img src=x onerror=alert(1)&gt; for details.
REJECT contains a link
REJECT no citation`
    },
    takeaways: [
      'Instructions and data share one channel, so injection cannot be fully prevented.',
      'Limit what injected text can do: least privilege tools and caller-based authorization.',
      'Delimiters help but are not a security boundary.',
      'Treat model output as untrusted: encode, validate, never eval or concatenate into SQL.',
      'Citations must point to documents you actually retrieved for this request.',
      'Fail closed with a safe fallback message.'
    ],
    interview: [
      ['What is indirect prompt injection, and how would you limit its impact in a RAG feature?',
        'Indirect injection hides instructions inside content the application gives the model, such as a retrieved document, a web page or an email. The model may follow them, for example to reveal other documents or call a tool. I assume it will sometimes succeed and limit the blast radius. Retrieval returns only documents the caller may read. Tools are read-only and authorized per caller. Secrets never enter the prompt. The output is checked before use: citations must match the retrieved IDs, links are blocked and HTML is encoded. Then a successful injection can at worst produce a wrong answer that fails validation.'],
      ['Why is model output an XSS risk, and what is the fix?',
        'The model can repeat or produce markup, including markup copied from an attacker’s document, such as <img src=x onerror=alert(1)>. If the front end inserts that text as HTML, the browser runs the attacker’s script in the user’s session. The fix is the same as for any untrusted input. Render it as text, or HTML-encode it on output. If you need rich text, allow only a small set of tags through a well-tested sanitizer. Do not rely on telling the model "never output HTML", because instructions are not a security control.'],
      ['How do you check that a RAG answer is grounded?',
        'Make the model return structured output with the answer and the IDs of the passages it used. Then check in code. Every cited ID must be in the set retrieved for this request. At least one citation is required for a factual claim. For key facts such as a refund window, compare the value with the cited passage, using an exact match for numbers and dates where possible. Keep an evaluation set of questions with known answers to measure groundedness over time. If a check fails, show a fallback that links the source instead of an unsupported answer.'],
      ['A user pastes 200 KB of text into the help box. What should happen?',
        'Reject or truncate it at the boundary before any model call. Set a maximum request size in bytes and an estimated token budget per request, and reserve part of the context for the system prompt and retrieved evidence. Large inputs raise cost and latency and can push the policy evidence out of the context window. They are also a common way to smuggle injection text. Return a clear 413 or validation message. Apply a per-user rate limit as well, so many medium-sized requests cannot exhaust the budget either. OWASP calls this class of risk unbounded consumption.']
    ],
    check: ['OutputGuard receives text "See <img src=x onerror=alert(1)> for details." citing POL-7, which was retrieved. What does it do?',
      ['Rejects it because it contains HTML', 'Shows it with < and > encoded as &lt; and &gt;', 'Shows it unchanged because the citation is valid', 'Asks the model to rewrite it'], 1,
      'The citation is valid and there is no link, so the answer is shown, but only after HTML encoding turns the tag into harmless text.'],
    practice: ['Run OutputGuard.java. Add a rule that every number followed by "h" in the answer must appear in the cited policy text (store POL-7 = "Refunds up to 24h before the show."). Add two answers to test it: one with 24h and one with 48h.',
      ['The original five answers produce the same five verdicts.', 'The 24h answer is shown, and the 48h answer is rejected with a clear reason.', 'All shown text is HTML-encoded.', 'Write one sentence on why this check is done in code rather than in the prompt.']],
    references: [
      ['OWASP Cheat Sheet · LLM prompt injection prevention', 'https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html'],
      ['OWASP GenAI · LLM05 Improper Output Handling', 'https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/'],
      ['OWASP Cheat Sheet · Cross-site scripting prevention', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html']
    ]
  },

  'ai-operations-02': {
    notes: [
      'A model call is a slow, metered, sometimes-failing remote dependency. Plan for that before you write the prompt. Latency has two parts: time to first token, which matters for streaming, and total generation time, which grows with the number of output tokens. Cost is usually priced per token: input tokens times the input price plus output tokens times the output price. Long prompts, many retrieved chunks and verbose answers all cost money on every request. Set a maximum output length, keep prompts lean and measure tokens per request.',
      'Give every request an overall deadline, for example 2 s for the help box, and derive each step’s timeout from what remains. A per-attempt timeout that ignores the overall deadline lets retries silently stretch a 2 s request to 6 s. Retry only what can succeed on a second try: timeouts, 429 Too Many Requests and 503 Service Unavailable. Do not retry 400 Bad Request or 401 Unauthorized. Use exponential backoff with random jitter so many clients do not retry in lockstep, and stop when the attempts or the deadline run out. A retried model call costs tokens again, so retries multiply cost as well as latency.',
      'Decide the fallback before the outage. The help feature can show a canned "help is unavailable, here is the policy page" message, switch to a smaller or cheaper model, or answer from a cache of common questions. The booking flow itself does not call the model, so it keeps working. A circuit breaker stops sending calls for a while after a run of failures, which protects your threads and your bill. A bulkhead, such as a separate bounded pool for model calls, stops slow model calls from starving booking requests.',
      'BudgetedCall.java runs a scripted provider under these rules: a 2000 ms deadline, an 800 ms per-attempt timeout, up to 3 attempts, and 200 ms then 400 ms backoff. A 503 followed by a success answers in 720 ms. Two timeouts give up at 1800 ms, because another 400 ms wait would leave less than 100 ms for a third attempt. A 400 falls back immediately. The cost line uses example prices only, so check your provider’s current price list. 3,000 input and 400 output tokens cost $0.0021, and 20,000 such calls a day cost $42. That is why budgets and caching matter.'
    ],
    code: {
      title: 'BudgetedCall.java · deadline, per-attempt timeout, retry only 429/503, backoff, token cost · java BudgetedCall.java',
      text: String.raw`import java.util.*;

public class BudgetedCall {
    // A scripted model provider so the trace is repeatable: each attempt has a latency and a status.
    record Attempt(int latencyMs, int status) {}

    static final int DEADLINE_MS = 2000;        // the whole help request must answer within 2 s
    static final int PER_ATTEMPT_TIMEOUT_MS = 800;
    static final int MAX_ATTEMPTS = 3;
    static final Set<Integer> RETRYABLE = Set.of(429, 503);   // transient; 400 or 401 will not get better

    static String call(List<Attempt> script) {
        int elapsed = 0, backoff = 200;
        for (int i = 0; i < MAX_ATTEMPTS && i < script.size(); i++) {
            int remaining = DEADLINE_MS - elapsed;
            int timeout = Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining);   // never wait past the overall deadline
            if (timeout < 100) break;                                     // not worth starting another attempt
            Attempt a = script.get(i);
            if (a.latencyMs() > timeout) {
                elapsed += timeout;
                System.out.println("  attempt " + (i + 1) + ": timeout after " + timeout + " ms (elapsed " + elapsed + ")");
            } else {
                elapsed += a.latencyMs();
                System.out.println("  attempt " + (i + 1) + ": status " + a.status() + " after " + a.latencyMs() + " ms (elapsed " + elapsed + ")");
                if (a.status() == 200) return "answer in " + elapsed + " ms";
                if (!RETRYABLE.contains(a.status())) return "fallback (status " + a.status() + " is not retryable) in " + elapsed + " ms";
            }
            if (DEADLINE_MS - (elapsed + backoff) < 100)                  // no time left for a useful retry
                return "fallback (deadline) in " + elapsed + " ms";
            elapsed += backoff;                                           // real code adds random jitter here
            backoff *= 2;
        }
        return "fallback (attempts used up) in " + elapsed + " ms";
    }

    // Example prices only: check your provider's current price list.
    static double costUsd(int inputTokens, int outputTokens, double inPerMillion, double outPerMillion) {
        return inputTokens / 1_000_000.0 * inPerMillion + outputTokens / 1_000_000.0 * outPerMillion;
    }

    public static void main(String[] args) {
        Map<String, List<Attempt>> cases = new LinkedHashMap<>();
        cases.put("fast success", List.of(new Attempt(350, 200)));
        cases.put("503 then success", List.of(new Attempt(120, 503), new Attempt(400, 200)));
        cases.put("two timeouts", List.of(new Attempt(5000, 200), new Attempt(5000, 200), new Attempt(300, 200)));
        cases.put("bad request", List.of(new Attempt(90, 400), new Attempt(90, 200)));
        for (var e : cases.entrySet()) {
            System.out.println(e.getKey() + ":");
            System.out.println("  -> " + call(e.getValue()));
        }
        System.out.printf("cost of 1 call (3000 in, 400 out at $0.50/$1.50 per 1M): $%.6f%n", costUsd(3000, 400, 0.50, 1.50));
        System.out.printf("same call x 20000 per day: $%.2f%n", 20000 * costUsd(3000, 400, 0.50, 1.50));
    }
}
`,
      output: String.raw`fast success:
  attempt 1: status 200 after 350 ms (elapsed 350)
  -> answer in 350 ms
503 then success:
  attempt 1: status 503 after 120 ms (elapsed 120)
  attempt 2: status 200 after 400 ms (elapsed 720)
  -> answer in 720 ms
two timeouts:
  attempt 1: timeout after 800 ms (elapsed 800)
  attempt 2: timeout after 800 ms (elapsed 1800)
  -> fallback (deadline) in 1800 ms
bad request:
  attempt 1: status 400 after 90 ms (elapsed 90)
  -> fallback (status 400 is not retryable) in 90 ms
cost of 1 call (3000 in, 400 out at $0.50/$1.50 per 1M): $0.002100
same call x 20000 per day: $42.00`
    },
    takeaways: [
      'Set one overall deadline and derive each attempt’s timeout from what remains.',
      'Retry only transient failures (timeouts, 429, 503), with backoff, jitter and a cap.',
      'Retries multiply both latency and token cost.',
      'Cost ≈ input tokens × input price + output tokens × output price; cap output length.',
      'Choose a fallback in advance; booking must never depend on the model.',
      'Circuit breakers and bulkheads stop a slow model from hurting other features.'
    ],
    interview: [
      ['How would you set timeouts and retries for an LLM call behind a 2-second help endpoint?',
        'I start from the 2-second deadline and give each attempt the smaller of a per-attempt cap, such as 800 ms, and the time remaining. I retry only timeouts, 429s and 503s, at most twice, with exponential backoff plus random jitter, and only if enough time remains for a useful attempt. Before sleeping I check whether the next attempt still fits. When the budget is spent, I return a fallback such as the policy page link within the deadline. I also respect a Retry-After header on 429. Metrics record attempts per request, so I can see when retries hide a degraded provider.'],
      ['Why does exponential backoff need jitter?',
        'Without jitter, every client that failed at the same moment retries at the same moments, 200 ms later, then 400 ms later, and so on. The synchronized waves hit a struggling provider again and again and can keep it overloaded. Jitter randomizes each wait, for example by picking a random value between zero and the current backoff, which spreads retries over time. Total retry traffic stays the same but the peaks flatten. The AWS Builders’ Library article on timeouts and backoff explains this well. Jitter matters most when many instances call the same dependency, which is the normal case for a model API.'],
      ['How do you estimate and control the monthly cost of an AI feature?',
        'I measure average input and output tokens per request, including the system prompt and retrieved chunks. I multiply by the provider’s per-token prices and by the expected request volume, then add the retry rate, because retries pay again. For example, 3,000 input and 400 output tokens at $0.50 and $1.50 per million (example prices) is $0.0021 per call, about $42 a day at 20,000 calls. To control it, I cap output tokens, trim the prompt and the retrieved context, cache answers to frequent questions, route simple questions to a cheaper model, and set per-user rate limits and a daily budget alarm.'],
      ['What is the difference between a circuit breaker and a retry?',
        'A retry repeats one request in the hope that a transient failure has passed. A circuit breaker watches many requests. When the failure rate or slow-call rate crosses a threshold, it opens and fails calls immediately for a cool-down period. Then it lets a few trial calls through (half-open) before closing again. Retries alone can make an outage worse, because every request multiplies load on a dependency that is already failing. The breaker stops that and returns your fallback quickly. Use both together: a few bounded retries inside a breaker, with the breaker’s fallback being the same safe message.']
    ],
    check: ['In BudgetedCall.java the first two attempts time out at 800 ms each. Why is there no third attempt?',
      ['MAX_ATTEMPTS is 2', 'After 1800 ms plus a 400 ms backoff, less than 100 ms of the 2000 ms deadline would remain', 'Timeouts are not retryable', 'The provider returned 400'], 1,
      'Elapsed is 1800 ms. Waiting 400 ms more would pass the 2000 ms deadline, so the code returns the fallback at 1800 ms instead of sleeping pointlessly.'],
    practice: ['Run BudgetedCall.java. Add a case "429 with Retry-After 1500 ms" where the code must wait at least that long, and a case where three 503s in a row use up all attempts. Then add a simple circuit breaker that opens after 3 consecutive failed requests and returns the fallback immediately for the next 2 requests.',
      ['The four original cases print the same trace.', 'The Retry-After case gives up if waiting would pass the deadline.', 'The three-503 case ends with "attempts used up" or the deadline message, never later than 2000 ms.', 'While the breaker is open, calls return the fallback without any attempt line.']],
    references: [
      ['AWS Builders’ Library · Timeouts, retries and backoff with jitter', 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/'],
      ['Resilience4j · CircuitBreaker', 'https://resilience4j.readme.io/docs/circuitbreaker'],
      ['OWASP GenAI · LLM10 Unbounded Consumption', 'https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/'],
      ['Java 21 API · HttpRequest.Builder.timeout', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html']
    ]
  },

  'ai-security-01.dsa': {
    notes: [
      'A sliding-window rate limiter answers one question: in the last W milliseconds, how many requests has this user made? Store the timestamps of accepted requests in a queue, oldest first. On each new request, remove timestamps that fell out of the window from the front, then compare the queue size with the limit. Accept means append the timestamp at the back. Reject means return 429 Too Many Requests.',
      'Each timestamp is added once and removed once, so the amortized cost per request is O(1), and memory per user is O(limit). Be precise about the window boundary. RecentRequests.java treats the window as (now − W, now], so a request exactly W ms after an earlier one no longer counts it. Write down which convention you chose, because off-by-one errors here show up as flaky tests.',
      'The same queue pattern solves "number of recent calls" and "hit counter" problems and the sliding-window maximum, which uses a deque of indices instead. In production, a per-user limiter must be shared across instances, for example in Redis, and cheaper approximations exist. A fixed-window counter is simpler but lets bursts through at window edges. A token bucket allows controlled bursts. For an AI feature, a limiter on model calls protects both latency and cost (Day 42).'
    ],
    code: {
      title: 'RecentRequests.java · sliding-window limiter with an ArrayDeque · java RecentRequests.java',
      text: String.raw`import java.util.ArrayDeque;
import java.util.Deque;

public class RecentRequests {
    // Sliding-window rate limiter: allow at most "limit" requests in any window of "windowMs" milliseconds.
    private final int limit;
    private final long windowMs;
    private final Deque<Long> accepted = new ArrayDeque<>();   // timestamps of accepted requests, oldest first

    RecentRequests(int limit, long windowMs) { this.limit = limit; this.windowMs = windowMs; }

    boolean allow(long nowMs) {
        while (!accepted.isEmpty() && accepted.peekFirst() <= nowMs - windowMs) accepted.pollFirst();  // expire old
        if (accepted.size() == limit) return false;
        accepted.addLast(nowMs);
        return true;
    }

    public static void main(String[] args) {
        RecentRequests limiter = new RecentRequests(3, 1000);   // 3 model calls per second per user
        long[] times = {0, 100, 200, 300, 999, 1000, 1100, 1250, 2300};
        StringBuilder out = new StringBuilder();
        for (long t : times) out.append(t).append(limiter.allow(t) ? ":ok " : ":429 ");
        System.out.println(out.toString().trim());
    }
}
`,
      output: String.raw`0:ok 100:ok 200:ok 300:429 999:429 1000:ok 1100:ok 1250:ok 2300:ok`
    },
    takeaways: ['Queue of accepted timestamps; expire from the front, append at the back.', 'Amortized O(1) per request; O(limit) memory per user.', 'Pin down the window boundary convention.', 'Fixed window is simpler but bursty; token bucket allows controlled bursts.'],
    interview: [
      ['Design a limiter that allows 3 requests per second per user. What data structure and complexity?', 'For each user, keep a queue of the timestamps of accepted requests. On a request at time t, pop from the front while the oldest timestamp is at or before t − 1000 ms. If 3 remain, reject with 429. Otherwise append t and accept. Each timestamp is pushed and popped once, so the amortized time is O(1) per request and the space is O(3) per user. Across many instances the queue must live in shared storage such as a Redis sorted set, or each instance needs its own share of the limit.'],
      ['Compare fixed-window, sliding-window and token-bucket limiting.', 'A fixed window counts requests per calendar second. It is cheap, but a user can send the limit at 0.999 s and again at 1.000 s, which doubles the burst. A sliding window looks back exactly W ms from every request. It is precise but stores timestamps, or uses a weighted approximation of two windows. A token bucket refills tokens at a steady rate up to a capacity, so it allows a short burst up to the capacity while enforcing the average rate. For model calls I would use a token bucket per user plus a global budget.'],
      ['What test cases catch boundary bugs in a sliding-window limiter?', 'Test requests at exactly the limit inside one window: the limit-th is accepted and the next is rejected. Test a request at exactly t + W after the first, which my convention accepts because the first one expired. Test a request one millisecond earlier, which must still be rejected if the window is full. Test long idle gaps that empty the queue. Test equal timestamps, and check that rejected requests are not stored, otherwise a client hammering the endpoint would lock itself out forever. The expected outputs should be written before running the code.']
    ],
    check: ['With limit 3 and window 1000 ms, requests at 0, 100, 200 are accepted. Is a request at 1000 accepted?',
      ['No, three requests are still in the window', 'Yes, because the request at 0 expires: the window is (0, 1000]', 'Yes, because every request after 999 is always accepted', 'No, because 1000 is a multiple of the window'], 1,
      'Timestamps ≤ now − W = 0 are removed first, so only 100 and 200 remain and the request is accepted.'],
    practice: ['Copy RecentRequests.java. Add a per-user map (Map<String, RecentRequests>) and a token-bucket version with capacity 3 and refill of 1 token every 333 ms. Run both on the same timestamps and compare which requests each accepts.',
      ['The sliding-window output for the given times is unchanged.', 'Two users do not affect each other’s limits.', 'The token bucket accepts a burst of 3 at t=0 and then about 1 request per 333 ms.', 'Rejected requests are never stored.']],
    references: [['Java 21 API · ArrayDeque', jdk + 'java/util/ArrayDeque.html']]
  },
  'ai-customization-01': {
    notes: [
      'When an AI feature gives poor answers, first name the failure, then choose the cheapest fix that targets it. There are three families of fixes. Prompting changes the instructions and examples sent with each request. Retrieval-augmented generation (RAG) changes the knowledge sent with each request. Fine-tuning changes the model’s weights with your own training examples. They solve different problems, so "we have training data" is not a reason to fine-tune on its own.',
      'Missing or changing knowledge is a retrieval problem. Refund rules, seat maps and prices change, and different users may see different documents. Retrieval reads the maintained source at request time, can cite it and can respect per-user access. Facts trained into weights are frozen at training time and cannot be cited or permission-checked. StaleKnowledge.java shows this. Before a policy edit, the "tuned" answerer and the retrieval answerer both score 2/2. After VENUE-A changes from 24h to 48h, the tuned answerer drops to 1/2 until it is retrained, while retrieval stays 2/2 and cites its source.',
      'Behavior and format problems are where prompting and then fine-tuning fit. Examples are a consistent tone, a strict output structure, a domain classification task, or getting a small, cheap model to do a narrow job as well as a big one. Start with a clear prompt and a few examples (few-shot), and use structured output if the provider supports it. Consider fine-tuning only when prompting has plateaued on a measured evaluation set. Fine-tuning has real costs: a curated dataset, training runs, a new model version to deploy and monitor, and regression tests every time the base model or the data changes. Parameter-efficient methods such as LoRA train small adapter weights instead of the whole model. They make training cheaper, but they do not remove the evaluation and deployment work.',
      'Decide with an evaluation, not a hunch. Build a fixed set of real questions with expected answers, such as 30 booking-policy questions plus 10 style checks. Measure the baseline, then change one thing at a time: the prompt, then retrieval quality (chunking, top-k), then the model, and fine-tuning last. Record accuracy, groundedness, latency and cost per request for each variant. For the booking help feature the likely answer is RAG over the policy store plus a tight prompt. Fine-tuning would be justified only if a measured style or format failure remains after prompt changes, and even then policy facts stay in retrieval.'
    ],
    code: {
      title: 'StaleKnowledge.java · facts frozen at training time vs retrieval at request time · java StaleKnowledge.java',
      text: String.raw`import java.util.*;

public class StaleKnowledge {
    // Two ways to answer "what is the refund window for venue X?"
    interface Answerer { String answer(String venue); }

    public static void main(String[] args) {
        Map<String, String> policyStore = new HashMap<>(Map.of("VENUE-A", "24h", "VENUE-B", "none"));

        // "Fine-tuned": the facts were copied into the weights at training time and do not change afterwards.
        Map<String, String> frozenAtTraining = Map.copyOf(policyStore);
        Answerer tuned = venue -> frozenAtTraining.getOrDefault(venue, "unknown");

        // "Retrieval": every answer reads the maintained source at request time and cites it.
        Answerer rag = venue -> policyStore.getOrDefault(venue, "unknown") + " [source: policyStore/" + venue + "]";

        List<String[]> evalSet = List.of(new String[] {"VENUE-A", "24h"}, new String[] {"VENUE-B", "none"});
        runEval("before change", evalSet, tuned, rag);

        policyStore.put("VENUE-A", "48h");                    // the business edits one policy
        evalSet = List.of(new String[] {"VENUE-A", "48h"}, new String[] {"VENUE-B", "none"});
        runEval("after change", evalSet, tuned, rag);
    }

    static void runEval(String label, List<String[]> evalSet, Answerer tuned, Answerer rag) {
        int tunedOk = 0, ragOk = 0;
        for (String[] c : evalSet) {
            if (tuned.answer(c[0]).equals(c[1])) tunedOk++;
            if (rag.answer(c[0]).startsWith(c[1] + " ")) ragOk++;
        }
        System.out.println(label + ": tuned " + tunedOk + "/" + evalSet.size() + ", retrieval " + ragOk + "/" + evalSet.size()
            + " | VENUE-A tuned=" + tuned.answer("VENUE-A") + " retrieval=" + rag.answer("VENUE-A"));
    }
}
`,
      output: String.raw`before change: tuned 2/2, retrieval 2/2 | VENUE-A tuned=24h retrieval=24h [source: policyStore/VENUE-A]
after change: tuned 1/2, retrieval 2/2 | VENUE-A tuned=24h retrieval=48h [source: policyStore/VENUE-A]`
    },
    takeaways: [
      'Name the failure first: missing knowledge, wrong behavior or wrong format.',
      'Changing or permissioned facts belong in retrieval, not in weights.',
      'Try prompts and few-shot examples before fine-tuning.',
      'Fine-tuning brings data, training, deployment and regression costs.',
      'LoRA makes training cheaper, not evaluation-free.',
      'Change one variable at a time against a fixed evaluation set.'
    ],
    interview: [
      ['Your assistant gives outdated refund rules. Do you fine-tune or use RAG? Why?',
        'RAG. Outdated rules are a knowledge problem, and the rules change. With retrieval, the assistant reads the current policy from the maintained store on every request, cites the passage, and respects which venues the user may see. An edit takes effect immediately. If I fine-tuned the rules into the weights, every policy change would need a new dataset, a training run and a redeploy, and in between the model would confidently give the old rule. It also could not cite a source or apply per-user access. I would add an evaluation set of policy questions that I rerun after every policy change.'],
      ['When is fine-tuning the right tool?',
        'When the gap is in behavior rather than knowledge, prompting has plateaued on a measured evaluation, and the task is stable. Typical cases are a consistent output format or tone, a narrow classification or extraction task, or making a smaller, cheaper and faster model match a larger one on a specific job. You also need enough good, representative examples, plus the capacity to retrain, evaluate and redeploy when the base model or the data changes. If the failure is about facts that change, or if one prompt change already fixes it, fine-tuning is the wrong tool.'],
      ['What would you measure before and after a customization change?',
        'I would use a fixed evaluation set of real questions with expected answers, run before and after every change. For the booking assistant I would measure answer accuracy on policy facts, groundedness (the citation matches retrieved evidence), format validity (the structured output parses), refusal behavior on out-of-scope or injected inputs, p50 and p95 latency, and cost per request in tokens. I change one variable at a time, such as the prompt, the retrieval settings or the model, so I know what caused each change. I keep the results in version control next to the prompt and configuration, so a regression can be traced.'],
      ['What is LoRA, and what does it change about fine-tuning?',
        'LoRA (low-rank adaptation) freezes the base model’s weights and trains small low-rank matrices that are added to some layers. You train and store far fewer parameters, so training is cheaper and faster, and one base model can serve several small adapters. It changes the cost of training, not the process around it. You still need a curated dataset, evaluation against a baseline, a deployment that loads the right adapter, and retraining when the base model changes. It also does not make fine-tuning a good way to store changing facts.'],
      ['A product manager says "we have 5,000 past support chats, let’s fine-tune." How do you respond?',
        'I would ask what failure we are trying to fix and measure it first. Past chats contain outdated policies, agent mistakes and personal data, so training on them as they are could teach the model wrong rules and leak private details. I would build an evaluation set from a cleaned sample, then try the cheaper steps: a better prompt, few-shot examples taken from the best chats, and retrieval over the current policy store. If a measured style or format gap remains, I would fine-tune on a curated, de-identified subset and compare against the baseline. Facts would stay in retrieval either way.']
    ],
    check: ['In StaleKnowledge.java, VENUE-A changes from 24h to 48h after "training". What do the two answerers score on the new evaluation set?',
      ['Both 2/2', 'Tuned 1/2, retrieval 2/2', 'Tuned 2/2, retrieval 1/2', 'Both 1/2'], 1,
      'The tuned answerer still says 24h for VENUE-A. Retrieval reads the updated store and answers 48h with a citation.'],
    practice: ['Run StaleKnowledge.java. Add a third answerer, "prompt with pasted policies", that copies the store into a prompt string once at startup. Add a per-user check to the retrieval answerer so a user scoped to VENUE-A cannot get VENUE-B’s policy. Then write a 6-line decision record for the booking assistant: failure, options, evidence, decision, cost, review date.',
      ['After the change, the pasted-prompt answerer behaves like the tuned one (stale) and retrieval stays 2/2.', 'A VENUE-A user asking about VENUE-B gets a refusal from the retrieval answerer.', 'The decision record names one measured failure that would justify fine-tuning.', 'The output for the original two eval runs is unchanged.']],
    references: [
      ['Lewis et al. · Retrieval-Augmented Generation (arXiv 2005.11401)', 'https://arxiv.org/abs/2005.11401'],
      ['Hu et al. · LoRA: Low-Rank Adaptation (arXiv 2106.09685)', 'https://arxiv.org/abs/2106.09685'],
      ['Hugging Face · PEFT documentation', 'https://huggingface.co/docs/peft/index'],
      ['Spring AI reference · Retrieval Augmented Generation', 'https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html']
    ]
  },

  'ai-customization-01.dsa': {
    notes: [
      'Top-k frequent elements: count each value with a HashMap, then keep the k strongest candidates in a min-heap (PriorityQueue) ordered by count. For each distinct value, offer it to the heap, and if the heap grows beyond k, poll the weakest. The heap never holds more than k + 1 items. At the end it holds the answer, and you sort it once for output.',
      'Counting is O(n). Heap work is O(m log k) for m distinct values, so the total is O(n + m log k) time and O(m + k) space. Sorting all m distinct values would cost O(m log m), which is worse when k is much smaller than m. Bucket sort by count gives O(n) when counts are bounded by n. Decide ties explicitly. TopKFrequent.java breaks ties alphabetically, so the output is deterministic and testable.',
      'The heap-of-size-k pattern appears everywhere: the k largest numbers, the k closest points, the k most common log errors, the most asked help questions for a cache. A min-heap keeps the k largest values, and a max-heap keeps the k smallest. In Java, PriorityQueue is a binary heap. offer and poll are O(log n) and peek is O(1). Its iterator does not return elements in priority order, so sort before printing.'
    ],
    code: {
      title: 'TopKFrequent.java · HashMap counts + min-heap of size k · java TopKFrequent.java',
      text: String.raw`import java.util.*;

public class TopKFrequent {
    // k most frequent values. Count with a HashMap, keep a min-heap of size k ordered by count (on a tie, the alphabetically later value leaves first).
    static List<String> topK(String[] items, int k) {
        Map<String, Integer> count = new HashMap<>();
        for (String s : items) count.merge(s, 1, Integer::sum);
        Comparator<String> byCount = Comparator.<String>comparingInt(count::get).thenComparing(Comparator.reverseOrder());
        PriorityQueue<String> heap = new PriorityQueue<>(byCount);       // head = weakest of the current top k
        for (String s : count.keySet()) {
            heap.offer(s);
            if (heap.size() > k) heap.poll();                            // drop the weakest, keep size k
        }
        List<String> out = new ArrayList<>(heap);
        out.sort(byCount.reversed());                                    // strongest first
        return out;
    }

    public static void main(String[] args) {
        String[] questions = {"refund", "parking", "refund", "seat", "refund", "parking", "food", "seat", "parking", "refund"};
        System.out.println(topK(questions, 2));
        System.out.println(topK(questions, 3));
        System.out.println(topK(new String[] {"b", "a", "c"}, 2));       // all tied: alphabetical order breaks ties
        System.out.println(topK(new String[] {}, 2));
    }
}
`,
      output: String.raw`[refund, parking]
[refund, parking, seat]
[a, b]
[]`
    },
    takeaways: ['Count with a HashMap, keep a min-heap of size k.', 'O(n + m log k) time, better than sorting all m when k ≪ m.', 'Define the tie rule so results are testable.', 'PriorityQueue iteration order is not sorted.'],
    interview: [
      ['Find the k most frequent elements. What is your approach and complexity?', 'Count frequencies in a HashMap in O(n). Push each distinct value into a min-heap ordered by count, and pop whenever the size exceeds k, so the heap always holds the current top k. That costs O(m log k) for m distinct values. The total is O(n + m log k) time and O(m + k) extra space. If k is close to m, sorting the entries is simpler. If counts are bounded by n, bucket sort by count gives O(n). I would state the tie-breaking rule up front and test it.'],
      ['Why a min-heap for the k largest, not a max-heap?', 'A min-heap of size k keeps the weakest of the current top k at its head, so each new candidate is compared with that one element in O(1), and replacing it costs O(log k). Memory stays at k. A max-heap of all m elements also works: build it in O(m) and pop k times for O(m + k log m). It needs O(m) memory, though, and does not work as a streaming solution. With an unbounded stream of values, only the bounded min-heap keeps memory fixed.'],
      ['Does iterating over a PriorityQueue give elements in priority order?', 'No. The Javadoc says the iterator is not guaranteed to traverse the elements in any particular order. Only the head, returned by peek or poll, is guaranteed to be the least element under the comparator. To print in order, either poll repeatedly or copy to a list and sort it, which is what TopKFrequent.java does. This is a common source of tests that pass with small inputs and then fail on larger ones.']
    ],
    check: ['questions = refund×4, parking×3, seat×2, food×1. What does topK(questions, 3) return?', ['[refund, parking, seat]', '[food, seat, parking]', '[refund, parking, food]', '[parking, refund, seat]'], 0,
      'Counts are 4, 3, 2 and 1. The heap keeps the three largest and the output is sorted strongest first.'],
    practice: ['Copy TopKFrequent.java and add a bucket-sort version: List<String>[] buckets indexed by count. Compare outputs on the same inputs, including ties and an empty array.',
      ['Both versions return [refund, parking] for k=2 and [] for an empty input.', 'The tie rule is identical in both (alphabetical).', 'State the time and space of both versions.']],
    references: [['Java 21 API · PriorityQueue', jdk + 'java/util/PriorityQueue.html']]
  },
  'h-case-up-01': {
    notes: [
      'A capstone demo is an argument, and every claim in it needs evidence you can rerun. The Seat Booking system has one invariant: a seat has at most one confirmed owner. The architecture is simple on purpose. Two or more stateless application instances sit behind a load balancer, and one PostgreSQL database is the single authority for ownership. A read cache and the optional AI help feature sit beside the booking path, never inside it. If the cache is stale or the model is down, users may see slower or less helpful pages, but they can never be sold the same seat twice.',
      'The authoritative operation is one conditional write: UPDATE seat SET owner = ? WHERE id = ? AND owner IS NULL, and the application checks that exactly one row changed. One row means this request won. Zero rows means 409 Conflict. The same transaction stores the reply under the client’s idempotency key, so a retry after a timeout replays the stored reply instead of booking again. CapstoneSim.java models this with a synchronized store shared by two instances. The race has exactly one winner, a retry through the other instance replays the original reply, and booking still works while the help provider is down.',
      'Structure the demo as a fixed script: reset the fixture (A1 free, A2 free), start two instances against one database, race two claims for A1 through different instances, retry the winning request with its key, ask a policy question that has a cited answer, then force a provider timeout and book A2. For each step, write the expected result before running it, and keep the commands in a README so a clean checkout reproduces it. A screenshot is weaker evidence than a command and its output.',
      'Be honest about the scope of the evidence. A two-instance race shows the invariant holds for the tested paths, and it says nothing about throughput or behavior during a regional failover. When a requirement changes, for example "confirm across two regions", name the part that must change first, which is where the single authority lives, and the trade-off you accept. A typical trade-off is rejecting or queueing claims when the regions cannot agree, which keeps the invariant and gives up some availability.'
    ],
    code: {
      title: 'CapstoneSim.java · one authority, two instances, idempotent retry and a help fallback · java CapstoneSim.java',
      text: String.raw`import java.util.*;
import java.util.concurrent.*;

public class CapstoneSim {
    // The "database": the single authority for seat ownership and for idempotency records.
    static final class Store {
        private final Map<String, String> owner = new HashMap<>();     // seat -> user
        private final Map<String, String> replies = new HashMap<>();   // idempotency key -> stored reply

        // Plays the role of one transaction:
        //   UPDATE seat SET owner = ? WHERE id = ? AND owner IS NULL   -- 1 row means we won, 0 rows means conflict
        //   INSERT INTO idempotency_key (key, reply) VALUES (?, ?)
        synchronized String claim(String key, String seat, String user) {
            String previous = replies.get(key);
            if (previous != null) return previous;                   // same logical request: replay, do not re-run
            String reply = owner.putIfAbsent(seat, user) == null
                    ? "201 " + seat + " -> " + user
                    : "409 " + seat + " is taken";
            replies.put(key, reply);
            return reply;
        }

        synchronized String ownerOf(String seat) { return owner.get(seat); }
    }

    // An application instance holds no booking state of its own; every decision goes to the store.
    record Instance(String name, Store db) {
        String book(String key, String seat, String user) { return db.claim(key, seat, user); }

        String help(boolean providerUp) {
            if (!providerUp) return "help unavailable, showing the refund policy page instead";
            return "Refunds are allowed up to 24h before the show [POL-REFUND-1]";
        }
    }

    public static void main(String[] args) throws Exception {
        Store db = new Store();
        Instance app1 = new Instance("app-1", db), app2 = new Instance("app-2", db);

        // 1. Two users race for seat A1 through different instances, released at the same moment.
        CountDownLatch go = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<String> ana = pool.submit(() -> { go.await(); return app1.book("key-ana", "A1", "ana"); });
        Future<String> ben = pool.submit(() -> { go.await(); return app2.book("key-ben", "A1", "ben"); });
        go.countDown();
        String anaReply = ana.get(), benReply = ben.get();
        pool.shutdown();
        int winners = (anaReply.startsWith("201") ? 1 : 0) + (benReply.startsWith("201") ? 1 : 0);
        System.out.println("winners for A1: " + winners);

        // 2. The client timed out and retries with the same key, this time through the other instance.
        String winnerKey = anaReply.startsWith("201") ? "key-ana" : "key-ben";
        String original = anaReply.startsWith("201") ? anaReply : benReply;
        String retry = app2.book(winnerKey, "A1", "whoever");
        System.out.println("retry replays the original reply: " + retry.equals(original));
        System.out.println("owner unchanged after retry: " + original.endsWith(db.ownerOf("A1")));

        // 3. The model provider is down: help falls back, booking still works.
        System.out.println("help: " + app1.help(false));
        System.out.println("book A2 while the provider is down: " + app2.book("key-cy", "A2", "cy"));
    }
}
`,
      output: String.raw`winners for A1: 1
retry replays the original reply: true
owner unchanged after retry: true
help: help unavailable, showing the refund policy page instead
book A2 while the provider is down: 201 A2 -> cy`
    },
    takeaways: ['One authority (the database) owns the seat transition. Instances, cache and AI help do not.', 'Conditional write plus rows-affected check gives one winner. The idempotency key makes retries replay.', 'Script the demo: fixture, commands, expected result written first, output.', 'A small race proves the invariant for the tested paths, not throughput or failover.'],
    interview: [
      ['Walk me through your booking architecture in two minutes.', 'Users hit a load balancer in front of two stateless Spring Boot instances. Every booking goes to one PostgreSQL database, which is the single authority: a conditional UPDATE sets the owner only if the seat is free, and the service checks that one row changed. The same transaction records the reply under the client’s idempotency key, so retries replay instead of double-booking. Reads can come from a short-lived cache, and an optional AI help feature answers policy questions with citations. Neither the cache nor the model can change ownership, so if they fail, booking keeps working. I show that with a race test, a retry test and a forced provider timeout.'],
      ['Why is the cache never allowed to decide whether a seat is free?', 'A cache is a copy, and copies lag. Two instances could each read "free" from the cache within the same millisecond and both promise the seat. The cache can make the seat map fast to display, but the decision must be made where all writers serialize, which is the conditional write in the database. If the cache says free and the database says taken, the user gets a 409 and a refreshed map, which is an acceptable experience. If the cache were the authority, the failure would be a double booking, which is not acceptable. That asymmetry is why the cache is advisory.'],
      ['The product team now wants cross-region confirmation. What changes first?', 'Ownership of the decision changes first. Today one database serializes all claims. With two regions I must choose between one primary authority for each seat, so remote users pay extra latency, a consensus-backed store that agrees across regions, or partitioning seats so each region exclusively owns some of them. I also need fencing so a region that lost its leadership cannot keep confirming, and a rule for partitions. The safest rule rejects or queues claims when agreement is impossible. I would prototype the partition case first, because that is where double bookings appear, and I would measure confirmation latency before promising it.']
    ],
    check: ['In CapstoneSim.java the winning client retries with the same idempotency key through the other instance. What happens?',
      ['A second seat is booked for the same user', 'The stored original reply is returned and ownership does not change', 'The request fails with 409 because the seat is taken', 'The other instance has no record, so it books again'], 1,
      'The idempotency record lives in the shared store, so any instance finds it and replays the reply without re-running the claim.'],
    practice: ['Write the README demo script for your own lab: reset command, start two instances, the race, the retry with the same key, one cited help answer, a forced provider timeout and a second booking. Write the expected output under each command before running it, then run it from a clean checkout.',
      ['Each step has a command and an expected result written before the run.', 'The race shows one 201 and one 409, and the database has one owner.', 'The retry returns the original reply byte for byte.', 'Booking succeeds while the provider is forced to time out.']],
    references: [['PostgreSQL · UPDATE (rows affected and WHERE conditions)', 'https://www.postgresql.org/docs/current/sql-update.html'], ['Stripe API · Idempotent requests', 'https://docs.stripe.com/api/idempotent_requests']]
  },
  'l-machine-02': {
    notes: [
      'An invariant test states a rule that must hold for every interleaving and then tries hard to break it. For booking the rule is: after any number of concurrent claims for a seat, exactly one claim returned success and the stored owner is that claimant. Unit tests that call claim() once per thread in sequence cannot fail on a race, so they prove nothing about concurrency. The test must start many claims at the same moment and must check both the return values and the final stored state.',
      'Use a start gate so the threads really compete. A CyclicBarrier or a CountDownLatch holds every client until all are ready, then releases them together. Repeat the round many times, with a fresh store each time, and count the rounds that broke the rule. InvariantRace.java runs 8 clients, split across two "instances", for 200 rounds against a conditional write and gets exactly one winner every time. A real cross-instance test uses two application processes and one database. Testcontainers can start a disposable PostgreSQL container from JUnit 5, so the test runs the same SQL as production.',
      'Prove that the test can fail. A race test that has never gone red may simply not be racing. InvariantRace.java includes a broken check-then-act store and forces the bad interleaving with a barrier between the check and the write, so all 8 clients "win". Seeing 8 winners on the broken version and 1 on the fixed version shows that the test detects the bug. With real databases, you can force the same interleaving by pausing one transaction between its SELECT and its UPDATE.',
      'Report results precisely: "200 of 200 rounds had exactly one winner with 8 clients on two instances" is a claim about those conditions. It is not a load test and it is not proof for every schedule. Keep a fixed seed or a fixed fixture so a failure can be reproduced, print the round number and the winners when a round fails, and run the test in CI so a later refactor that reintroduces check-then-act turns the build red.'
    ],
    code: {
      title: 'InvariantRace.java · a race test that fails on check-then-act and passes on a conditional write · java InvariantRace.java',
      text: String.raw`import java.util.*;
import java.util.concurrent.*;

public class InvariantRace {
    interface SeatStore { boolean claim(String seat, String user) throws Exception; }

    // Broken: check, then act, in two separate steps (like SELECT owner, then an UPDATE with no condition).
    static final class CheckThenAct implements SeatStore {
        private final Map<String, String> owners = new ConcurrentHashMap<>();
        private final CyclicBarrier afterCheck;   // test hook: every client finishes its check before anyone writes

        CheckThenAct(int clients) { afterCheck = new CyclicBarrier(clients); }

        public boolean claim(String seat, String user) throws Exception {
            boolean free = !owners.containsKey(seat);
            afterCheck.await();                    // the "unlucky" interleaving, made certain
            if (!free) return false;
            owners.put(seat, user);
            return true;
        }
    }

    // Correct: one atomic conditional write (like UPDATE ... WHERE owner IS NULL and checking rows affected = 1).
    static final class ConditionalWrite implements SeatStore {
        private final Map<String, String> owners = new ConcurrentHashMap<>();

        public boolean claim(String seat, String user) { return owners.putIfAbsent(seat, user) == null; }
    }

    // One round: clients split across two "instances" all try to claim seat A1 at the same moment.
    static int winners(SeatStore store, int clients) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(clients);
        CyclicBarrier start = new CyclicBarrier(clients);
        List<Future<Boolean>> results = new ArrayList<>();
        for (int i = 0; i < clients; i++) {
            String user = (i % 2 == 0 ? "app-1/" : "app-2/") + "user" + i;
            results.add(pool.submit(() -> { start.await(); return store.claim("A1", user); }));
        }
        int won = 0;
        for (Future<Boolean> r : results) if (r.get()) won++;
        pool.shutdown();
        return won;
    }

    public static void main(String[] args) throws Exception {
        int clients = 8, rounds = 200;
        System.out.println("check-then-act, forced interleaving: " + winners(new CheckThenAct(clients), clients) + " winners");

        int exactlyOne = 0;
        for (int r = 0; r < rounds; r++) if (winners(new ConditionalWrite(), clients) == 1) exactlyOne++;
        System.out.println("conditional write: exactly one winner in " + exactlyOne + "/" + rounds + " rounds");
    }
}
`,
      output: String.raw`check-then-act, forced interleaving: 8 winners
conditional write: exactly one winner in 200/200 rounds`
    },
    takeaways: ['State the invariant, then check both return values and final stored state.', 'Use a start gate (CyclicBarrier or CountDownLatch) and many fresh rounds.', 'Show the test going red on a deliberately broken version.', 'Testcontainers gives the cross-instance test a real database.'],
    interview: [
      ['How would you test that two instances never confirm the same seat?', 'I would start one PostgreSQL database, using Testcontainers in JUnit 5, and two application instances pointed at it. For each round I reset seat A1, create eight clients split across the two instances, and hold them at a CyclicBarrier so they send their claims at the same moment. After the round I assert that exactly one response was 201, the rest were 409, and the database row names the 201 client. I repeat for a few hundred rounds and print the failing round and responses if any assertion breaks. I also run the same test against a deliberately broken check-then-act version to prove the test can go red.'],
      ['Your race test passed 1,000 times. Is the code correct?', 'It means the invariant held for the interleavings that happened in those runs, on that machine, with that timing. It does not prove all schedules are safe. Races depend on timing, so a test can pass for months and then fail under different CPU load. That is why I also argue correctness from the design: one atomic conditional write, where the database serializes competing updates, and not a read followed by a write. I strengthen the test by forcing the dangerous interleaving with a barrier or a paused transaction, and by confirming that it fails on a broken version. Passing tests plus a sound design argument is the honest claim.'],
      ['Why does InvariantRace.java use a barrier inside the broken store?', 'Without it, the broken check-then-act version would usually pass, because one thread often finishes its check and write before another even starts. The test would then be flaky and could not show the bug on demand. The barrier makes every client complete its check, all seeing a free seat, before any of them writes, so all eight report success. That turns an unlikely interleaving into a certain one. It is a test hook, not production code. The same idea in a database test is pausing transaction one after its SELECT until transaction two has also read the row.']
    ],
    check: ['InvariantRace.java prints "8 winners" for check-then-act. Why is the result always 8, not a random number?',
      ['Because ConcurrentHashMap is not thread-safe', 'Because the barrier makes every client finish its check before anyone writes, so all see a free seat', 'Because eight threads always run in parallel on any machine', 'Because putIfAbsent is used in the broken version'], 1,
      'The barrier forces the worst interleaving, so every client passes the check and every client writes.'],
    practice: ['Copy InvariantRace.java. Add a third store that uses synchronized on the whole claim method, and a fourth that uses compute() on the map. Run 200 rounds for each and print the counts. Then make the round print the winning users when a round fails.',
      ['check-then-act shows more than one winner and the other three show 200/200.', 'A failing round prints its round number and winners.', 'One sentence on why synchronized works in one JVM but not across two processes.']],
    references: [['Testcontainers for Java', 'https://java.testcontainers.org/'], ['Java 21 API · CyclicBarrier', jdk + 'java/util/concurrent/CyclicBarrier.html'], ['JUnit 5 User Guide', 'https://junit.org/junit5/docs/current/user-guide/']]
  },
  'l-machine-02.dsa': {
    notes: [
      'Merge intervals is the core pattern for holds, meetings and bookings that occupy time. Sort the intervals by start time. Walk through them, keeping the last merged interval. If the next interval starts at or before the end of the last one, they overlap or touch, so extend the last interval to the larger end. Otherwise start a new merged interval. Sorting costs O(n log n) and the walk costs O(n).',
      'Choose and state the boundary convention. MergeHolds.java uses half-open intervals [start, end), so a hold ending at 20 and one starting at 20 do not overlap. The merge still joins touching intervals into one busy period ([0,10), [5,15) and [15,20) become [0,20)), which is a choice for display. The conflict check uses the overlap rule for half-open intervals: [a,b) and [c,d) overlap exactly when a < d and c < b. That is why a new hold [20,30) fits between [0,20) and [30,40), while [18,25) conflicts.',
      'Related problems reuse the same sorted sweep. Insert interval puts a new interval into a sorted list and merges around it. Meeting rooms I asks whether any two meetings overlap: sort and compare neighbours. Meeting rooms II asks how many rooms you need: use a min-heap of end times, or sort the starts and ends separately. For booking, the database version of the conflict check is a WHERE clause with the same two comparisons, or a PostgreSQL exclusion constraint on a range column.'
    ],
    code: {
      title: 'MergeHolds.java · merge overlapping holds and check a new hold for conflict · java MergeHolds.java',
      text: String.raw`import java.util.*;

public class MergeHolds {
    // A hold on one seat from start (inclusive) to end (exclusive), in minutes after the doors open.
    record Hold(int start, int end) {
        public String toString() { return "[" + start + "," + end + ")"; }
    }

    // Sort by start, then extend the last merged interval while the next one overlaps or touches it.
    static List<Hold> merge(List<Hold> holds) {
        List<Hold> sorted = new ArrayList<>(holds);
        sorted.sort(Comparator.comparingInt(Hold::start));
        List<Hold> merged = new ArrayList<>();
        for (Hold h : sorted) {
            if (!merged.isEmpty() && h.start() <= merged.get(merged.size() - 1).end()) {
                Hold last = merged.remove(merged.size() - 1);
                merged.add(new Hold(last.start(), Math.max(last.end(), h.end())));
            } else {
                merged.add(h);
            }
        }
        return merged;
    }

    // Half-open intervals [a,b) and [c,d) overlap exactly when a < d and c < b.
    static boolean conflicts(List<Hold> busy, Hold wanted) {
        for (Hold h : busy) if (wanted.start() < h.end() && h.start() < wanted.end()) return true;
        return false;
    }

    public static void main(String[] args) {
        List<Hold> holds = List.of(new Hold(30, 40), new Hold(0, 10), new Hold(5, 15), new Hold(15, 20), new Hold(50, 55));
        List<Hold> busy = merge(holds);
        System.out.println("busy: " + busy);
        System.out.println("hold [20,30) conflicts: " + conflicts(busy, new Hold(20, 30)));
        System.out.println("hold [18,25) conflicts: " + conflicts(busy, new Hold(18, 25)));
        System.out.println("merge of no holds: " + merge(List.of()));
    }
}
`,
      output: String.raw`busy: [[0,20), [30,40), [50,55)]
hold [20,30) conflicts: false
hold [18,25) conflicts: true
merge of no holds: []`
    },
    takeaways: ['Sort by start, then extend or start a new interval: O(n log n).', 'Half-open [a,b) and [c,d) overlap when a < d and c < b.', 'Decide whether touching intervals merge, and say so.', 'Meeting rooms II uses a min-heap of end times.'],
    interview: [
      ['Merge [[1,3],[2,6],[8,10],[15,18]]. Explain the algorithm and complexity.', 'First I sort by start, which this input already is. I keep [1,3] as the last merged interval. [2,6] starts at 2, which is not after 3, so it overlaps, and I extend the last interval to [1,6]. [8,10] starts after 6, so I add it as new. [15,18] starts after 10, so I add it too. The result is [[1,6],[8,10],[15,18]]. Sorting is O(n log n) and the single pass is O(n), so the total is O(n log n) time. The output list is O(n) space, and the sort may use O(log n) to O(n) extra space depending on the implementation.'],
      ['How do you decide whether two holds conflict, and what bug do people make?', 'For half-open intervals [a,b) and [c,d), they overlap exactly when a < d and c < b. The common bugs are checking only one endpoint, for example asking whether c is between a and b, which misses a new interval that completely contains an old one, and mixing inclusive and exclusive ends, so back-to-back holds are wrongly reported as conflicts. I fix the convention first, usually half-open because back-to-back bookings then work naturally, and I test containment, touching ends, identical intervals and no overlap. The same two comparisons go into the SQL WHERE clause.'],
      ['How many rooms are needed for meetings [[0,30],[5,10],[15,20]]?', 'Two rooms. I sort meetings by start and keep a min-heap of end times for rooms in use. At 0 the heap is empty, so I add end 30. At 5 the earliest end is 30, which is after 5, so I need a new room and add 10. At 15 the earliest end is 10, which is at or before 15, so I reuse that room by popping 10 and pushing 20. The heap size peaked at 2, which is the answer. Time is O(n log n) and space is O(n). An alternative sorts starts and ends separately and sweeps with two pointers.']
    ],
    check: ['Using half-open intervals, does a new hold [20,30) conflict with busy periods [0,20) and [30,40)?',
      ['Yes, because 20 equals the end of [0,20)', 'No, because 20 < 20 is false and 30 < 30 is false', 'Yes, because 30 equals the start of [30,40)', 'It depends on the order of the busy list'], 1,
      'Overlap needs a < d and c < b. Both comparisons fail at the touching ends, so the hold fits.'],
    practice: ['Copy MergeHolds.java. Add insert(List<Hold> sortedMerged, Hold h) that returns a new merged list in O(n) without re-sorting, and minRooms(List<Hold> meetings) using a PriorityQueue of end times.',
      ['insert([[0,20),[30,40)], [18,32)) returns [[0,40)].', 'minRooms([[0,30),[5,10),[15,20)]) returns 2.', 'Empty inputs return an empty list and 0.', 'State the time and space of both methods.']],
    references: [['Java 21 API · List.sort and Comparator', jdk + 'java/util/Comparator.html'], ['PostgreSQL · Range types and exclusion constraints', 'https://www.postgresql.org/docs/current/rangetypes.html']]
  },
  // @@packets
};

// ---------------------------------------------------------------------------------------------------------------
// Extra wrong options for the two-choice self-check pairs (index = pair order in session-qa.js), and explanations.
export const lateDistractors = {
  41: [
    ['Any read-only tool, because reads cannot leak data.', 'Whatever the system prompt allows, because the prompt is the policy.'],
    ['A fine-tuning method that teaches a model to use tools.', 'A vector database that stores tool results for retrieval.']
  ],
  42: [
    ['As a higher-priority system prompt, because it came from your own database.', 'As safe once it is wrapped in delimiters, so no output checks are needed.'],
    ['Immediately and in parallel to every provider, to minimize latency.', 'Only after a 400 Bad Request, because the provider may accept it next time.']
  ],
  43: [
    ['Hard-coded in the system prompt and edited by redeploying the app.', 'In the model’s weights through a nightly fine-tune of all policies.'],
    ['Nothing new, because the provider handles all evaluation.', 'Only a one-time training cost; no further maintenance is needed.']
  ],
  44: [
    ['A screenshot of the seat map after one successful booking.', 'A load-balancer health check that returns 200 OK.'],
    ['Whichever application instance received the request first.', 'The help assistant, because it reads the current policy.']
  ],
  // @@distractors
};
export const lateExplanations = {
  41: ['A proposal is untrusted input. The application checks the allowlist, validates the arguments and authorizes with the real caller before anything runs. Reads can leak data, and a prompt is not an access-control system.',
    'MCP standardizes how hosts, clients and servers discover and call tools, resources and prompts over JSON-RPC. It does not train models or store data, and it does not replace the server’s own authorization.'],
  42: ['Retrieved text is untrusted data even when it comes from your own store, because anyone who can edit a document can plant instructions. Delimiters reduce the risk but do not remove it, so output checks and authorization stay in place.',
    'Retry only transient failures, within the remaining deadline and cost budget, with backoff and jitter. Parallel fan-out multiplies cost, and a 400 will fail the same way again.'],
  43: ['Frequently changing facts belong in a maintained source read at request time, so edits apply at once and answers can cite them. Prompts and weights both freeze a copy that goes stale.',
    'Fine-tuning creates a model lifecycle. You curate data, train, deploy a new version, and rerun regression evaluations whenever the data or base model changes.'],
  44: ['A defensible demo starts from a known fixture, runs written commands and compares observable results with expectations written beforehand. Anyone can rerun it from a clean checkout.',
    'Only the database’s conditional write serializes competing claims across instances. Instance order, caches and the model are advisory and can be stale or wrong.'],
  // @@explanations
};

// Extra self-check questions (appended after the session's own questions; options in the order shown).
export const lateAssessment = {
  41: [
    { question: 'In ToolGate.java, U1 (venues = {VENUE-A}) sends cancelBooking(B-7). What is printed?',
      choices: ['cancelBooking -> rejected: U1 may not read VENUE-A', 'cancelBooking -> rejected: tool not allowed: cancelBooking', 'cancelBooking -> rejected: invalid arguments venue=null topic=null', 'The booking is cancelled because U1 owns B-7'], answer: 1,
      explanation: 'The allowlist runs first and contains only lookupPolicy, so the proposal is rejected before argument validation or authorization.' },
    { question: 'An MCP server receives tools/call for a tool name it never listed. Which response matches the specification’s guidance?',
      choices: ['A result with isError: true and the text "unknown tool"', 'A JSON-RPC error (the spec example uses -32602) because the request itself is invalid', 'An empty successful result so the model does not retry', 'Close the transport without replying'], answer: 1,
      explanation: 'Unknown tools and invalid arguments are protocol errors returned as JSON-RPC errors. isError: true is for a tool that ran and failed.' }
  ],
  42: [
    { question: 'In BudgetedCall.java the provider returns 503 after 120 ms, then 200 after 400 ms. What is printed as the result?',
      choices: ['answer in 520 ms', 'answer in 720 ms', 'fallback (status 503 is not retryable) in 120 ms', 'answer in 400 ms'], answer: 1,
      explanation: '120 ms for the first attempt, plus 200 ms backoff, plus 400 ms for the second attempt is 720 ms.' },
    { question: 'A model answer cites POL-9, but retrieval returned only POL-7 for this request. What should the application do?',
      choices: ['Show it, because the model may know POL-9 from training', 'Reject it and show the fallback, because the citation was not supplied', 'Fetch POL-9 and show the answer without checking it', 'Ask the model whether it is sure'], answer: 1,
      explanation: 'A grounded answer may cite only evidence supplied for this request. An unknown citation is unsupported, so the answer fails the check.' }
  ],
  43: [
    { question: 'The assistant gives correct policy facts but its answers are 3× too long and ignore the required format, even after prompt and few-shot changes measured on an eval set. What is a reasonable next step?',
      choices: ['Move the policies into the model weights', 'Consider fine-tuning on curated examples of the required format, keeping facts in retrieval', 'Increase retrieval top-k from 3 to 30', 'Remove the evaluation set to save time'], answer: 1,
      explanation: 'This is a measured behavior and format gap that prompting did not close. Fine-tuning targets that, while facts stay in retrieval.' },
    { question: 'Which statement about LoRA is correct?',
      choices: ['It retrains every weight of the base model', 'It trains small low-rank adapter weights while the base weights stay frozen', 'It is a retrieval method for long documents', 'It removes the need for an evaluation set'], answer: 1,
      explanation: 'LoRA freezes the base model and learns small low-rank updates. It lowers training cost but does not change the need to evaluate and deploy carefully.' }
  ],
  44: [
    { question: 'Two instances each run "SELECT owner FROM seat WHERE id = \'A1\'", see NULL, and then run "UPDATE seat SET owner = ? WHERE id = \'A1\'". What can happen?',
      choices: ['Nothing bad, because each instance has its own connection', 'Both updates succeed and the last writer silently replaces the first owner', 'The second UPDATE always fails with a constraint error', 'PostgreSQL merges the two owners into one row'], answer: 1,
      explanation: 'Check-then-act across two statements lets both callers pass the check. Without "AND owner IS NULL" in the UPDATE and a rows-affected check, both report success.' },
    { question: 'Your race test has passed 500 rounds. What is the most accurate claim?',
      choices: ['The booking service handles any production load', 'The invariant held for 500 rounds of the tested interleavings and fixture', 'Concurrency bugs are impossible in this code', 'The database no longer needs a conditional write'], answer: 1,
      explanation: 'A passing race test is evidence for the tested conditions only. Combine it with the design argument and a test shown to fail on a broken version.' }
  ],
  // @@assessment
};

// Saturday/Sunday stretch plans (4h 30m = 270 min beyond the 2h core), same shape as day-depth.js stretchPlans.
export const lateStretchPlans = {
  42: {
    assign: { 'ai-security-01.packet': 45, 'ai-operations-02.packet': 50, 'ai-security-01.stretch': 40, 'ai-security-01.dsa.packet': 30 },
    extra: [
      { id: 'ai-security-01.stretch-redteam', minutes: 45, title: 'Stretch lab · red-team your own help feature',
        prompt: 'Write 8 attack fixtures against the booking help flow: 3 direct injections, 3 instructions hidden in a retrieved policy text, 1 oversized input and 1 answer containing HTML. For each, predict which layer stops it (retrieval scope, tool authorization, size limit, output check) and run it through OutputGuard.java or your own guard.',
        acceptance: ['8 fixtures written with the expected stopping layer before running.', 'Every fixture is stopped or produces only a safe fallback.', 'One paragraph on the attack you could not fully block and why the booking invariant is still safe.'] },
      { id: 'ai-security-01.stretch-set', minutes: 35, title: 'Stretch DSA · three more queue and window problems',
        prompt: 'In one Java file solve: (1) number of recent calls within 3000 ms (same pattern as today); (2) first negative number in every window of size k using a deque of indices; (3) moving average of the last k values with a running sum. Write the time and space of each before coding.',
        acceptance: ['Recent calls [1,100,3001,3002] → 1,2,3,3.', 'First negatives of [12,-1,-7,8,-15,30,16,28], k=3 → -1,-1,-7,-15,-15,0.', 'Moving average of 1,10,3,5 with k=3 → 1.0, 5.5, 4.67, 6.0.', 'Time and space written for all three.'] },
      { id: 'ai-security-01.stretch-interview', minutes: 25, title: 'Stretch interview drill · answer aloud, then compare',
        prompt: 'Pick five of today’s interview questions, at least two on security and two on latency or cost. Answer each aloud in 2 minutes without opening the model answer, then open it and note one point you missed.',
        acceptance: ['Five answers recorded or written.', 'One missed point noted for each.'] }
    ]
  },
  43: {
    assign: { 'ai-customization-01.packet': 55, 'ai-customization-01.stretch': 45, 'ai-customization-01.dsa.packet': 30 },
    extra: [
      { id: 'ai-customization-01.stretch-eval', minutes: 60, title: 'Stretch lab · build a 20-question evaluation set',
        prompt: 'Write 20 booking-help questions with expected answers: 12 policy facts, 4 out-of-scope or injected questions that must be refused, and 4 format checks (answer ≤ 60 words, ends with a cited source). Store them as a CSV or a Java List, and write a tiny runner that scores any Answerer from StaleKnowledge.java against them.',
        acceptance: ['20 cases with expected answers written before any run.', 'The runner prints a score per category.', 'The retrieval answerer beats the tuned answerer after one policy edit.', 'One paragraph: which category would justify fine-tuning, and what score would trigger it.'] },
      { id: 'ai-customization-01.stretch-set', minutes: 45, title: 'Stretch DSA · three more heap problems',
        prompt: 'In one Java file solve: (1) kth largest element with a min-heap of size k; (2) k closest points to the origin; (3) merge k sorted int arrays with a heap of (value, array, index). Write the time and space of each before coding.',
        acceptance: ['kthLargest([3,2,1,5,6,4], 2) = 5.', 'kClosest([[1,3],[-2,2]], 1) = [[-2,2]].', 'Merging [1,4,5],[1,3,4],[2,6] gives [1,1,2,3,4,4,5,6].', 'Time and space written for all three.'] },
      { id: 'ai-customization-01.stretch-review', minutes: 35, title: 'Stretch review · AI week recap without notes',
        prompt: 'Without opening notes, write one paragraph each on Days 41–43: tool authorization, prompt-injection layers, retry budgets and the customization decision. Then open the notes and mark what you missed in a different colour.',
        acceptance: ['Four paragraphs written before opening notes.', 'At least one missed point marked per paragraph.'] }
    ]
  },
  // @@stretch
};

// Fuller model answers (80–200 words) for the three session interview questions of Days 41–56, in the same order as
// session-qa.js questions: [review recall, lesson variation, probe]. Codex's shorter originals are the starting point.
export const lateInterviewGuides = {
  41: [
    'The model only proposes a call: a tool name and arguments. Enforcement happens in the application and at the tool boundary, in a fixed order. First, the tool must be on the allowlist for this feature, and a help assistant gets read-only tools. Second, the arguments are validated against the schema and business rules. Third, the call is authorized with the authenticated principal from the session or token, not with any identity the model wrote into the arguments. The tool result goes back to the model as data and never widens permissions. A request for another venue must fail even when every argument is well-formed, so I test with a valid but out-of-scope ID as well as a malformed one.',
    'Inside the tool service, on every lookup, using the caller’s trusted identity. The service authenticates the caller, or receives delegated credentials scoped to that user, and derives the allowed venues from that identity. Then it checks the requested venue against that scope before reading anything. One broad "can read policies" permission is not enough, because the check must be per resource. Doing it only in the prompt or only in the front end leaves the tool open to a forged argument. I test it by sending a forged venue argument with valid syntax and confirming that no private text from that venue ever reaches the model or the logs.',
    'The host application and the MCP server authorize tool calls, not the protocol. MCP defines how clients discover tools and resources, how they call them over JSON-RPC, and, for HTTP transports, how a client obtains an OAuth 2.1 access token whose audience is that server. It does not decide whether this user may read VENUE-B. The server must validate arguments and check the token’s scope on every call, and the host should let the user deny or confirm sensitive invocations. I demonstrate the difference with two calls: one allowed lookup, and one syntactically valid call for a venue outside the token’s scope that returns isError: true.'
  ],
  42: [
    'Every retry costs time from the same request deadline and usually costs tokens again, so retries multiply both latency and spend. I set one overall budget, give each attempt only the time that remains, retry only transient failures (timeouts, 429, 503) with backoff and jitter, and record every timeout and fallback so the cost is visible. Retrieved text is treated as untrusted data even when it comes from an approved store, because anyone who can edit a document can plant instructions in it. Delimiters lower the risk but do not remove it. Tool authorization by the real caller and output validation, such as citations that must match retrieved IDs and HTML encoding, stay in the application.',
    'Budget the context before admitting user input. Reserve space for the system instructions, the policy evidence and the answer, then admit only what is left for the user’s text. If the request is too long, reject it with a clear size error, or deliberately truncate the parts that are not needed, such as a pasted transcript, rather than the evidence. Never cut the policy evidence to make room. If the evidence no longer fits, the safe choices are to abstain, or to retrieve a smaller, more focused set of passages and try again. Also cap the request size in bytes at the edge, because huge inputs cost money and are a common way to smuggle injection text.',
    'They share one clock. The request gets a deadline, admission control limits how much work runs at once, and each model attempt gets only the time that remains, minus any wait in a queue or for a connection. A retry happens only for a transient failure and only if a useful attempt still fits before the deadline. Otherwise the fallback is returned on time. Measure connection and queue waits separately, because they consume the budget before the model even sees the request. Before raising concurrency limits, run a controlled load test and check p95 latency, the fallback rate and the cost per request, since more admitted work can make every request slower.'
  ],
  43: [
    'Consider customization only for a reproducible behavior gap: the same kind of input keeps producing the wrong style, format or classification, even with an adequate prompt, the right evidence and simpler fixes already tried. First I define the metric for that behavior, for example "answers ≤ 60 words that end with a citation", and keep a held-out test set so I can see real improvement rather than memorization. Knowledge problems are different. A missing or frequently changing policy belongs in retrieval with controlled provenance, so edits take effect immediately and answers can cite them. Fine-tuning facts into weights would freeze them and remove the ability to check permissions per user.',
    'Keep the evidence and the labeled inputs fixed, and change only the instructions. I would test a more explicit style rubric (length, tone, structure), add two or three strong examples (few-shot), and require a structured output shape such as JSON with an answer and a citations field. Then I measure style compliance alongside readability, groundedness and cost per request on held-out tasks, so a style gain that hurts accuracy is visible. If one of these variants closes the gap, no training is needed. Fine-tuning becomes a candidate only when a stable, measured style gap survives the comparison and the task is stable enough to justify a model lifecycle.',
    'When the real problem is knowledge, not behavior. If a policy is missing, unavailable or outdated, training on labeled examples teaches the model yesterday’s answer and makes it sound confident about it. Fine-tuning also cannot cite a source or respect per-user access. The fix is a reliable, authorized evidence path: retrieval from the maintained policy store, with checks that the answer matches the cited passage, plus an evaluation of freshness and of correct abstention when evidence is missing. Factual authority should stay where the organization can update it in minutes. A further sign that fine-tuning is a poor fix is training data full of outdated answers or personal information.'
  ],
  44: [
    'One changed requirement is that booking must keep working when the AI provider is down. I first state the invariant: one confirmed owner per seat, decided by the database’s conditional write. Then I trace the paths: the help feature reads policies and calls the model, and booking never waits on either. The trade-off I make is that help degrades to a static policy page with a link instead of retrying for a long time, because a slow help answer is worse than an honest fallback. My demo shows a normal cited answer, then a forced provider timeout that returns the fallback within the deadline, and a booking for another seat that still commits.',
    'The single claim authority must change first. Today one PostgreSQL primary serializes every claim. With cross-region confirmation I need either one primary authority for each seat that every region calls, which costs latency for remote users, a store that agrees across regions using a consensus protocol, or exclusive seat ownership per region, so a region never confirms a seat it does not own. Whichever I choose, I add fencing so an old leader cannot keep confirming after a failover, and I define partition behavior. The safe default is to reject or queue claims when agreement is impossible, so availability drops but the one-owner rule holds. Browsing holds can stay local.',
    'A two-instance contention test supports one claim: for the tested fixture and code paths, exactly one claim commits and the losers get 409. It shows the decision lives in the shared database rather than in instance memory. It does not support claims about throughput, tail latency, connection-pool limits, hot-seat contention at scale or failover behavior. Those need a load run with a representative mix of reads and claims, many concurrent writers on one hot event, injected failures, and measurements of p95/p99 latency, error rates and an invariant check after the run. In an interview I link each claim to the command and output that produced it, and I say plainly which claims I have not measured.'
  ],
  // @@guides
};
