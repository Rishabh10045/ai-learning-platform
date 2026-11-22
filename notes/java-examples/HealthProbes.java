import java.util.*;

// Liveness vs readiness for a booking service, with one request traced through a log line and a metric.
public class HealthProbes {
    enum Db { UP, DOWN }
    static Db db = Db.UP;
    static boolean deadlocked = false;          // the only thing a restart can fix
    static final Map<String, Integer> metrics = new TreeMap<>();

    // Liveness: can this process still make progress? Never checks shared dependencies.
    static int liveness() { return deadlocked ? 503 : 200; }

    // Readiness: should the load balancer send booking traffic here right now?
    static int readiness() { return !deadlocked && db == Db.UP ? 200 : 503; }

    static int book(String requestId, String route, String seat) {
        int status = db == Db.UP ? 201 : 503;
        // Structured log: high-cardinality IDs belong here, not in metric labels.
        System.out.printf("{\"level\":\"%s\",\"requestId\":\"%s\",\"route\":\"%s\",\"seat\":\"%s\",\"status\":%d}%n",
            status < 500 ? "INFO" : "WARN", requestId, route, seat, status);
        // Metric: bounded labels only (route template and status class).
        metrics.merge("http_requests{route=" + route + ",class=" + status / 100 + "xx}", 1, Integer::sum);
        return status;
    }

    static void probes(String when) {
        System.out.println(when + ": liveness=" + liveness() + " readiness=" + readiness());
    }

    public static void main(String[] args) {
        probes("normal");
        book("req-101", "/events/{id}/bookings", "A7");
        db = Db.DOWN;
        probes("database down 30 s");
        book("req-102", "/events/{id}/bookings", "A8");
        System.out.println("-> instance leaves the load balancer; it is NOT restarted (a restart cannot fix the database)");
        db = Db.UP;
        probes("database back");
        book("req-103", "/events/{id}/bookings", "A8");
        deadlocked = true;
        probes("worker threads deadlocked");
        System.out.println("-> liveness fails, so the orchestrator restarts this one instance");
        System.out.println("metrics: " + metrics);
    }
}
