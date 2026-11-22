import java.util.*;

public class StreamMedian {
    // Two heaps: "low" (max-heap) holds the smaller half, "high" (min-heap) the larger half; low may hold one extra.
    private final PriorityQueue<Integer> low = new PriorityQueue<>(Comparator.reverseOrder());
    private final PriorityQueue<Integer> high = new PriorityQueue<>();

    void add(int x) {
        if (low.isEmpty() || x <= low.peek()) low.add(x); else high.add(x);
        if (low.size() > high.size() + 1) high.add(low.poll());     // rebalance so sizes differ by at most one
        else if (high.size() > low.size()) low.add(high.poll());
    }

    double median() {
        if (low.isEmpty()) throw new IllegalStateException("no values yet");
        return low.size() > high.size() ? low.peek() : (low.peek() + high.peek()) / 2.0;
    }

    public static void main(String[] args) {
        StreamMedian m = new StreamMedian();
        int[] latenciesMs = {120, 95, 400, 110, 105, 2600, 98};      // model call latencies as they arrive
        StringBuilder out = new StringBuilder();
        for (int x : latenciesMs) { m.add(x); out.append(x).append("->").append(m.median()).append("  "); }
        System.out.println(out.toString().trim());
        System.out.println("median after 7 calls: " + m.median() + " ms (the 2600 ms outlier barely moves it)");
    }
}
