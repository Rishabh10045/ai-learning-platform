import java.util.Arrays;
import java.util.PriorityQueue;

public class LeastLoaded {
    // Route each request to the instance that becomes free first (a min-heap on free time),
    // compared with plain round robin. Returns each request's latency = wait + service time.
    static long[] simulate(long[] arrival, long[] service, int instances, boolean leastLoaded) {
        long[] freeAt = new long[instances];
        PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> a[0] != b[0] ? Long.compare(a[0], b[0]) : Long.compare(a[1], b[1]));
        for (int i = 0; i < instances; i++) heap.add(new long[] {0, i});
        long[] latency = new long[arrival.length];
        for (int r = 0; r < arrival.length; r++) {
            int target;
            if (leastLoaded) target = (int) heap.poll()[1];
            else target = r % instances;
            long start = Math.max(arrival[r], freeAt[target]);
            freeAt[target] = start + service[r];
            if (leastLoaded) heap.add(new long[] {freeAt[target], target});
            latency[r] = freeAt[target] - arrival[r];
        }
        return latency;
    }

    // Nearest-rank percentile: the smallest value with at least p percent of samples at or below it.
    static long percentile(long[] values, int p) {
        long[] s = values.clone();
        Arrays.sort(s);
        int rank = (int) Math.ceil(p / 100.0 * s.length);
        return s[Math.max(rank, 1) - 1];
    }

    public static void main(String[] args) {
        int n = 40;
        long[] arrival = new long[n], service = new long[n];
        for (int i = 0; i < n; i++) {
            arrival[i] = i * 10L;
            service[i] = (i % 4 == 0) ? 100 : 10;      // every fourth request is a slow hot-seat booking
        }
        for (boolean ll : new boolean[] {false, true}) {
            long[] lat = simulate(arrival, service, 4, ll);
            long sum = 0;
            for (long v : lat) sum += v;
            System.out.println((ll ? "least loaded" : "round robin ") + ": mean " + (sum / n) + " ms, p50 "
                + percentile(lat, 50) + " ms, p95 " + percentile(lat, 95) + " ms, max " + percentile(lat, 100) + " ms");
        }
    }
}
