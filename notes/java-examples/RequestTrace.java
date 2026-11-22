import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.*;
import java.util.concurrent.ConcurrentHashMap;

public class RequestTrace {
    public static void main(String[] args) throws Exception {
        ConcurrentHashMap<String, String> owners = new ConcurrentHashMap<>(); // the authoritative store
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/bookings", ex -> {                            // routing: method + path -> handler
            String user = new String(ex.getRequestBody().readAllBytes()).trim();
            int status;
            if (!"POST".equals(ex.getRequestMethod())) status = 405;
            else if (user.isBlank()) status = 400;
            else status = owners.putIfAbsent("A1", user) == null ? 201 : 409;  // write before the success reply
            byte[] body = ("owner=" + owners.get("A1")).getBytes();
            ex.sendResponseHeaders(status, body.length);
            ex.getResponseBody().write(body);
            ex.close();
        });
        server.start();
        HttpClient client = HttpClient.newHttpClient();
        URI uri = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/bookings");
        for (String user : new String[] { "U1", "U2", " " }) {
            HttpRequest req = HttpRequest.newBuilder(uri).POST(HttpRequest.BodyPublishers.ofString(user)).build();
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            System.out.println("POST as '" + user + "' -> " + res.statusCode() + " " + res.body());
        }
        server.stop(0);
    }
}
