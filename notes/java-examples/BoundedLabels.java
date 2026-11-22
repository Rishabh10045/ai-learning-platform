import java.util.*;
import java.util.regex.*;

// Turns raw request paths into bounded metric labels, so a metric never gets one series per user, seat or request.
public class BoundedLabels {
    static final List<Map.Entry<Pattern, String>> ROUTES = List.of(
        Map.entry(Pattern.compile("^/events/\\d+/bookings$"), "/events/{id}/bookings"),
        Map.entry(Pattern.compile("^/events/\\d+/seats$"), "/events/{id}/seats"),
        Map.entry(Pattern.compile("^/bookings/[a-z0-9-]+$"), "/bookings/{id}"),
        Map.entry(Pattern.compile("^/actuator/health(/\\w+)?$"), "/actuator/health"));
    static final Set<String> FORBIDDEN = Set.of("requestId", "userId", "seatId", "email");

    static String template(String path) {
        for (var r : ROUTES) if (r.getKey().matcher(path).matches()) return r.getValue();
        return "other";                                  // unknown paths collapse into one series
    }

    static Map<String, String> labels(Map<String, String> wanted) {
        for (String k : wanted.keySet())
            if (FORBIDDEN.contains(k)) throw new IllegalArgumentException(k + " is unbounded: put it in logs or trace attributes");
        return new TreeMap<>(wanted);
    }

    public static void main(String[] args) {
        Map<String, Integer> series = new TreeMap<>();
        String[] paths = {"/events/42/bookings", "/events/43/bookings", "/events/42/seats", "/bookings/b-100",
            "/bookings/b-101", "/actuator/health/readiness", "/wp-admin.php", "/events/42/bookings"};
        for (String p : paths) series.merge(template(p), 1, Integer::sum);
        System.out.println(paths.length + " requests -> " + series.size() + " series: " + series);
        System.out.println("labels ok: " + labels(Map.of("route", "/bookings/{id}", "outcome", "2xx")));
        try {
            labels(Map.of("route", "/bookings/{id}", "userId", "u-981"));
        } catch (IllegalArgumentException e) {
            System.out.println("rejected: " + e.getMessage());
        }
        int users = 50_000, routes = 4, outcomes = 3;
        System.out.println("series with route x outcome: " + routes * outcomes + "; adding userId would give " + (long) routes * outcomes * users);
    }
}
