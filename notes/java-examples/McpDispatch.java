import java.util.*;

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
