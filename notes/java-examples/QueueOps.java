import java.util.*;

// Queues: FIFO with ArrayDeque, a queue built from two stacks (amortized O(1)), and a recent-hits counter.
public class QueueOps {
    static final class TwoStackQueue<T> {
        private final Deque<T> in = new ArrayDeque<>(), out = new ArrayDeque<>();
        int moves = 0;
        void offer(T x) { in.push(x); }
        T poll() {
            if (out.isEmpty()) while (!in.isEmpty()) { out.push(in.pop()); moves++; }   // each item moves at most once
            return out.poll();
        }
    }

    // Count requests in the last 3,000 ms: drop timestamps from the front as they expire.
    static final class RecentCounter {
        private final Deque<Long> times = new ArrayDeque<>();
        int ping(long t) { times.offerLast(t); while (times.peekFirst() < t - 3000) times.pollFirst(); return times.size(); }
    }

    public static void main(String[] args) {
        Deque<String> fifo = new ArrayDeque<>();
        fifo.offer("req-1"); fifo.offer("req-2"); fifo.offer("req-3");
        System.out.println("FIFO poll: " + fifo.poll() + ", then peek: " + fifo.peek());

        TwoStackQueue<Integer> q = new TwoStackQueue<>();
        for (int i = 1; i <= 3; i++) q.offer(i);
        StringBuilder sb = new StringBuilder("two-stack queue: " + q.poll());
        q.offer(4);
        Integer x; while ((x = q.poll()) != null) sb.append(' ').append(x);
        System.out.println(sb + " (moves between stacks: " + q.moves + " for 4 items)");

        RecentCounter rc = new RecentCounter();
        long[] ts = {1, 100, 3001, 3002, 7000};
        StringBuilder hits = new StringBuilder("recent hits:");
        for (long t : ts) hits.append(" t=").append(t).append("->").append(rc.ping(t));
        System.out.println(hits);
    }
}
