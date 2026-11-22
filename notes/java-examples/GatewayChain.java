import java.util.*;

public class GatewayChain {
    record Request(String method, String path, String token, String client) {}
    record Response(int status, String body) {}

    interface Filter { Optional<Response> apply(Request r, Map<String, String> headers); }   // empty = continue

    // Edge concerns live in the gateway: auth presence, rate limits, request IDs, routing. Business rules do not.
    static final Map<String, String> routes = new LinkedHashMap<>(Map.of(
            "/api/bookings", "booking-service", "/api/help", "help-service", "/api/events", "catalog-service"));
    static final Map<String, Integer> usedThisMinute = new HashMap<>();
    static int nextRequestId = 1;

    static final Filter requestId = (r, h) -> { h.put("X-Request-Id", "req-" + nextRequestId++); return Optional.empty(); };
    static final Filter authenticated = (r, h) ->
            r.path().startsWith("/api/events") || r.token() != null ? Optional.empty()
                    : Optional.of(new Response(401, "missing bearer token"));
    static final Filter rateLimit = (r, h) -> {
        int used = usedThisMinute.merge(r.client(), 1, Integer::sum);
        return used <= 3 ? Optional.empty() : Optional.of(new Response(429, "Retry-After: 60"));
    };
    static final Filter route = (r, h) -> {
        String best = null;   // longest matching prefix wins
        for (String prefix : routes.keySet())
            if ((r.path().equals(prefix) || r.path().startsWith(prefix + "/")) && (best == null || prefix.length() > best.length())) best = prefix;
        if (best == null) return Optional.of(new Response(404, "no route"));
        return Optional.of(new Response(200, "forwarded to " + routes.get(best) + " with " + h.get("X-Request-Id")));
    };

    static Response handle(Request r) {
        Map<String, String> headers = new HashMap<>();
        for (Filter f : List.of(requestId, authenticated, rateLimit, route)) {
            Optional<Response> stop = f.apply(r, headers);
            if (stop.isPresent()) return stop.get();
        }
        throw new IllegalStateException("route filter always answers");
    }

    public static void main(String[] args) {
        List<Request> requests = List.of(
                new Request("GET", "/api/events/42", null, "web-1"),
                new Request("POST", "/api/bookings", null, "web-1"),
                new Request("POST", "/api/bookings", "t1", "web-1"),
                new Request("GET", "/api/help/refunds", "t1", "web-1"),
                new Request("GET", "/api/bookings/b-100", "t1", "web-1"),
                new Request("GET", "/api/admin", "t2", "app-2"));
        for (Request r : requests) {
            Response res = handle(r);
            System.out.println(r.method() + " " + r.path() + " -> " + res.status() + " " + res.body());
        }
    }
}
