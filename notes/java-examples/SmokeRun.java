import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class SmokeRun {
    // A tiny stand-in for the packaged app: health, claim (conditional write) and help with a provider switch.
    static final Map<String, String> owners = new ConcurrentHashMap<>();
    static volatile boolean providerUp = true;

    static HttpServer start() throws Exception {
        HttpServer s = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        s.createContext("/actuator/health", ex -> reply(ex, 200, "{\"status\":\"UP\"}"));
        s.createContext("/bookings", ex -> {
            String[] kv = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8).split("&");
            String seat = kv[0].split("=")[1], user = kv[1].split("=")[1];
            boolean won = owners.putIfAbsent(seat, user) == null;
            reply(ex, won ? 201 : 409, won ? seat + " -> " + user : seat + " taken");
        });
        s.createContext("/help", ex -> reply(ex, 200, providerUp ? "Refunds up to 24h [POL-1]" : "fallback: see /policies/refunds"));
        s.start();
        return s;
    }

    static void reply(com.sun.net.httpserver.HttpExchange ex, int status, String body) throws java.io.IOException {
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(status, b.length);
        try (var out = ex.getResponseBody()) { out.write(b); }
    }

    public static void main(String[] args) throws Exception {
        HttpServer app = start();
        String base = "http://127.0.0.1:" + app.getAddress().getPort();
        HttpClient http = HttpClient.newHttpClient();
        List<String[]> results = new ArrayList<>();   // {check, expected, actual}

        results.add(new String[] {"health", "200", String.valueOf(get(http, base + "/actuator/health").statusCode())});
        results.add(new String[] {"first claim A1", "201", String.valueOf(post(http, base + "/bookings", "seat=A1&user=ana").statusCode())});
        results.add(new String[] {"competing claim A1", "409", String.valueOf(post(http, base + "/bookings", "seat=A1&user=ben").statusCode())});
        results.add(new String[] {"help cites a policy", "true", String.valueOf(get(http, base + "/help").body().contains("[POL-1]"))});
        providerUp = false;                                      // simulate a provider outage
        results.add(new String[] {"help falls back", "true", String.valueOf(get(http, base + "/help").body().startsWith("fallback"))});
        results.add(new String[] {"booking during outage", "201", String.valueOf(post(http, base + "/bookings", "seat=A2&user=cy").statusCode())});
        app.stop(0);

        int failed = 0;
        for (String[] r : results) {
            boolean ok = r[1].equals(r[2]);
            if (!ok) failed++;
            System.out.printf("%-4s %-22s expected %-5s got %s%n", ok ? "PASS" : "FAIL", r[0], r[1], r[2]);
        }
        System.out.println(failed == 0 ? "smoke run passed: 6/6" : "smoke run FAILED: " + failed + " checks");
    }

    static HttpResponse<String> get(HttpClient c, String url) throws Exception {
        return c.send(HttpRequest.newBuilder(URI.create(url)).build(), HttpResponse.BodyHandlers.ofString());
    }

    static HttpResponse<String> post(HttpClient c, String url, String form) throws Exception {
        return c.send(HttpRequest.newBuilder(URI.create(url)).POST(HttpRequest.BodyPublishers.ofString(form)).build(), HttpResponse.BodyHandlers.ofString());
    }
}
