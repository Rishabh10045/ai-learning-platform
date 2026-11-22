import java.util.ArrayDeque;
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
