import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

// Day 10 main lab: a real local HTTP server (JDK only) with REST semantics:
// POST -> 201 + Location, GET -> 200/404, a second POST for the same seat -> 409, wrong method -> 405 + Allow.
public class HttpSemanticsLab {
    record Booking(int id, String seat, String user) {}

    public static void main(String[] args) throws Exception {
        Map<Integer, Booking> bookings = new ConcurrentHashMap<>();
        Map<String, Integer> bookingBySeat = new ConcurrentHashMap<>();
        AtomicInteger ids = new AtomicInteger(100);
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/bookings", ex -> {
            try (ex) {
                String path = ex.getRequestURI().getPath();
                if (path.equals("/bookings") && ex.getRequestMethod().equals("POST")) {
                    Map<String, String> form = parse(new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                    String seat = form.get("seat"), user = form.get("user");
                    if (seat == null || user == null) { send(ex, 400, "seat and user are required"); return; }
                    int id = ids.incrementAndGet();
                    Integer existing = bookingBySeat.putIfAbsent(seat, id);         // one atomic decision per seat
                    if (existing != null) { send(ex, 409, "seat " + seat + " already booked as /bookings/" + existing); return; }
                    bookings.put(id, new Booking(id, seat, user));
                    ex.getResponseHeaders().set("Location", "/bookings/" + id);
                    send(ex, 201, "booked " + seat + " for " + user);
                } else if (path.matches("/bookings/\\d+") && ex.getRequestMethod().equals("GET")) {
                    Booking b = bookings.get(Integer.parseInt(path.substring("/bookings/".length())));
                    if (b == null) send(ex, 404, "no such booking"); else send(ex, 200, b.seat() + " " + b.user());
                } else {
                    ex.getResponseHeaders().set("Allow", path.equals("/bookings") ? "POST" : "GET");
                    send(ex, 405, "method not allowed");
                }
            }
        });
        server.start();
        String base = "http://127.0.0.1:" + server.getAddress().getPort();
        HttpClient client = HttpClient.newHttpClient();
        try {
            HttpResponse<String> created = post(client, base + "/bookings", "seat=A1&user=U1");
            String location = created.headers().firstValue("Location").orElse("-");
            System.out.println("POST A1/U1   -> " + created.statusCode() + " Location: " + location);
            System.out.println("GET Location -> " + get(client, base + location));
            HttpResponse<String> conflict = post(client, base + "/bookings", "seat=A1&user=U2");
            System.out.println("POST A1/U2   -> " + conflict.statusCode() + " " + conflict.body());
            System.out.println("POST no user -> " + post(client, base + "/bookings", "seat=A2").statusCode());
            System.out.println("GET unknown  -> " + get(client, base + "/bookings/999"));
            HttpResponse<String> del = client.send(HttpRequest.newBuilder(URI.create(base + "/bookings")).DELETE().build(), HttpResponse.BodyHandlers.ofString());
            System.out.println("DELETE /bookings -> " + del.statusCode() + " Allow: " + del.headers().firstValue("Allow").orElse("-"));
        } finally { server.stop(0); }
    }

    static HttpResponse<String> post(HttpClient c, String url, String body) throws Exception {
        return c.send(HttpRequest.newBuilder(URI.create(url)).header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }
    static String get(HttpClient c, String url) throws Exception {
        HttpResponse<String> r = c.send(HttpRequest.newBuilder(URI.create(url)).GET().build(), HttpResponse.BodyHandlers.ofString());
        return r.statusCode() + " " + r.body();
    }
    static Map<String, String> parse(String body) {
        Map<String, String> m = new HashMap<>();
        for (String kv : body.split("&")) { String[] p = kv.split("=", 2); if (p.length == 2 && !p[1].isBlank()) m.put(p[0], p[1]); }
        return m;
    }
    static void send(HttpExchange ex, int status, String body) throws java.io.IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(status, bytes.length);
        ex.getResponseBody().write(bytes);
    }
}
