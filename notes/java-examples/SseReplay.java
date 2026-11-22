import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class SseReplay {
    // Server keeps the last 3 seat events. Each SSE event has an id so a reconnecting browser can send Last-Event-ID.
    static final List<String[]> history = Collections.synchronizedList(new ArrayList<>());   // {id, data}
    static final int RETAINED = 3;
    static int nextId = 1;

    static synchronized void publish(String data) {
        history.add(new String[] { String.valueOf(nextId++), data });
        if (history.size() > RETAINED) history.remove(0);
    }

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/seats/stream", exchange -> {
            String last = exchange.getRequestHeaders().getFirst("Last-Event-ID");
            exchange.getResponseHeaders().add("Content-Type", "text/event-stream");
            exchange.sendResponseHeaders(200, 0);
            try (Writer out = new OutputStreamWriter(exchange.getResponseBody(), StandardCharsets.UTF_8)) {
                long after = last == null ? 0 : Long.parseLong(last);
                long oldest = Long.parseLong(history.get(0)[0]);
                if (last != null && after < oldest - 1) {
                    // The gap is no longer retained: tell the client to reload a snapshot instead of pretending.
                    out.write("event: reset\ndata: reload snapshot from GET /seats\n\n");
                    return;
                }
                for (String[] e : List.copyOf(history))
                    if (Long.parseLong(e[0]) > after) out.write("id: " + e[0] + "\ndata: " + e[1] + "\n\n");
            }   // a real stream stays open; this demo closes after sending what it has
        });
        server.start();
        String url = "http://127.0.0.1:" + server.getAddress().getPort() + "/seats/stream";
        HttpClient client = HttpClient.newHttpClient();

        publish("A1 held"); publish("A2 sold");
        System.out.println("first connect:      " + read(client, url, null));
        publish("A1 sold");
        System.out.println("resume after id 2:  " + read(client, url, "2"));
        publish("A3 held"); publish("A4 held"); publish("A5 held");
        System.out.println("resume after id 2:  " + read(client, url, "2"));
        server.stop(0);
    }

    // Returns the events as "id:data" items, or the reset instruction.
    static String read(HttpClient client, String url, String lastEventId) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url));
        if (lastEventId != null) b.header("Last-Event-ID", lastEventId);
        List<String> lines = client.send(b.build(), HttpResponse.BodyHandlers.ofLines()).body().toList();
        List<String> events = new ArrayList<>();
        String id = null, type = "message";
        for (String line : lines) {
            if (line.startsWith("id: ")) id = line.substring(4);
            else if (line.startsWith("event: ")) type = line.substring(7);
            else if (line.startsWith("data: ")) events.add(type.equals("reset") ? "RESET (" + line.substring(6) + ")" : id + ":" + line.substring(6));
        }
        return String.join(", ", events);
    }
}
