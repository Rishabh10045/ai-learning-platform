import java.util.*;

// Production-style metrics for the help feature: latency percentiles,
// fallback rate by reason and token cost, compared across two versions.
public class AiMetrics {
    record Call(long millis, String result, int tokens) {} // result: "ok" or a fallback reason

    static long percentile(List<Long> sorted, double p) {     // nearest-rank method
        int rank = (int) Math.ceil(p / 100.0 * sorted.size());
        return sorted.get(Math.max(0, rank - 1));
    }

    static void summary(String name, List<Call> calls) {
        List<Long> ms = calls.stream().map(Call::millis).sorted().toList();
        Map<String, Integer> reasons = new TreeMap<>();
        int tokens = 0;
        for (Call c : calls) { if (!c.result().equals("ok")) reasons.merge(c.result(), 1, Integer::sum); tokens += c.tokens(); }
        int fallbacks = reasons.values().stream().mapToInt(Integer::intValue).sum();
        double mean = ms.stream().mapToLong(Long::longValue).average().orElse(0);
        System.out.printf("%-3s n=%d  mean=%.0fms  p50=%dms  p95=%dms  max=%dms  fallbacks=%d/%d %s  tokens/call=%.0f%n",
            name, calls.size(), mean, percentile(ms, 50), percentile(ms, 95), ms.get(ms.size() - 1),
            fallbacks, calls.size(), reasons, (double) tokens / calls.size());
    }

    public static void main(String[] args) {
        List<Call> v1 = new ArrayList<>(), v2 = new ArrayList<>();
        long[] base = {420, 450, 480, 510, 530, 560, 600, 640, 700, 760, 820, 900, 980, 1100, 1250, 1400, 1600, 1900, 2000, 2000};
        for (int i = 0; i < base.length; i++) {
            v1.add(new Call(base[i], base[i] >= 2000 ? "timeout" : (i == 7 ? "invalid output" : "ok"), 900));
            // v2 adds a re-ranking step: +150 ms each, fewer invalid outputs, one extra timeout.
            long t = Math.min(2000, base[i] + 150);
            v2.add(new Call(t, t >= 2000 ? "timeout" : "ok", 1150));
        }
        summary("v1", v1);
        summary("v2", v2);
        System.out.println("v2 removes invalid output but adds a timeout, +150 ms at p50 and 28% more tokens: a trade-off, not a clear win.");
    }
}
