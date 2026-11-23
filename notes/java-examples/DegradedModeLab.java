import java.util.*;
import java.util.concurrent.*;

// Day 25 main lab: timeouts, a circuit breaker and degraded operation during a partition.
// Rule: the booking write stays consistent (refuse when the primary is unreachable); optional features
// (help answers, seat-map freshness) degrade with a clear label instead of failing the page.
public class DegradedModeLab {
    static final ScheduledExecutorService timer = Executors.newScheduledThreadPool(2);

    // A dependency that answers after `delayMs`.
    static CompletableFuture<String> slowHelp(long delayMs) {
        CompletableFuture<String> f = new CompletableFuture<>();
        timer.schedule(() -> f.complete("cited answer from policy P1"), delayMs, TimeUnit.MILLISECONDS);
        return f;
    }

    // Opens after 3 consecutive failures; while open, calls fail fast without waiting for the timeout.
    static final class CircuitBreaker {
        int failures = 0; boolean open = false; int shortCircuited = 0;
        String call(long delayMs, long timeoutMs) {
            if (open) { shortCircuited++; return "fallback (breaker open, no wait)"; }
            try {
                String r = slowHelp(delayMs).orTimeout(timeoutMs, TimeUnit.MILLISECONDS).join();
                failures = 0; return r;
            } catch (CompletionException e) {
                if (e.getCause() instanceof TimeoutException && ++failures >= 3) open = true;
                return "fallback (timed out after " + timeoutMs + " ms)";
            }
        }
    }

    record SeatMap(Map<String, String> seats, boolean stale) {}
    static final class Booking {
        boolean primaryReachable = true; final Map<String, String> primary = new HashMap<>(); Map<String, String> cachedMap = Map.of();
        String book(String seat, String user) {
            if (!primaryReachable) return "503 booking paused: primary unreachable, try again (no double booking risk)";
            if (primary.putIfAbsent(seat, user) != null) return "409 " + seat + " taken";
            cachedMap = Map.copyOf(primary); return "201 " + seat + " -> " + user;
        }
        SeatMap seatMap() { return primaryReachable ? new SeatMap(Map.copyOf(primary), false) : new SeatMap(cachedMap, true); }
    }

    public static void main(String[] args) {
        CircuitBreaker help = new CircuitBreaker();
        System.out.println("help, healthy (20 ms):  " + help.call(20, 200));
        for (int i = 1; i <= 3; i++) System.out.println("help, slow #" + i + " (1 s):   " + help.call(1000, 100));
        long t0 = System.nanoTime();
        String fast = help.call(1000, 100);
        System.out.println("help, 4th call:         " + fast + ", answered in under 50 ms: " + ((System.nanoTime() - t0) / 1_000_000 < 50));

        Booking b = new Booking();
        System.out.println(b.book("A1", "U1"));
        b.primaryReachable = false;                                    // network partition to the database primary
        System.out.println(b.book("A2", "U2"));
        SeatMap m = b.seatMap();
        System.out.println("seat map during partition: " + new TreeMap<>(m.seats()) + (m.stale() ? " [stale, labelled 'may be out of date']" : ""));
        b.primaryReachable = true;
        System.out.println("after recovery: " + b.book("A2", "U2"));
        timer.shutdownNow();
    }
}
