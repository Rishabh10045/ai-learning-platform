import java.util.*;

// Maximum of every window of size k in O(n) with a monotonic deque,
// e.g. the worst latency in each 3-request window.
public class WindowMax {
    static int[] maxPerWindow(int[] a, int k) {
        if (k <= 0 || k > a.length) throw new IllegalArgumentException("need 1 <= k <= " + a.length);
        int[] out = new int[a.length - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();          // indices, values decreasing from front to back
        for (int i = 0; i < a.length; i++) {
            if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();        // left the window
            while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();     // can never be a max again
            dq.offerLast(i);
            if (i >= k - 1) out[i - k + 1] = a[dq.peekFirst()];
        }
        return out;
    }

    static int[] naive(int[] a, int k) {
        int[] out = new int[a.length - k + 1];
        for (int s = 0; s + k <= a.length; s++) { int m = Integer.MIN_VALUE; for (int j = s; j < s + k; j++) m = Math.max(m, a[j]); out[s] = m; }
        return out;
    }

    public static void main(String[] args) {
        int[] latency = {120, 340, 90, 410, 150, 150, 700, 80};
        System.out.println("k=3 max: " + Arrays.toString(maxPerWindow(latency, 3)));
        System.out.println("k=1 max: " + Arrays.toString(maxPerWindow(latency, 1)));
        System.out.println("k=n max: " + Arrays.toString(maxPerWindow(latency, latency.length)));
        Random r = new Random(7);
        boolean same = true;
        for (int t = 0; t < 200; t++) {
            int[] a = r.ints(1 + r.nextInt(30), -50, 50).toArray();
            int k = 1 + r.nextInt(a.length);
            same &= Arrays.equals(maxPerWindow(a, k), naive(a, k));
        }
        System.out.println("matches naive on 200 random arrays: " + same);
        try { maxPerWindow(latency, 0); } catch (IllegalArgumentException e) { System.out.println("k=0 -> " + e.getMessage()); }
    }
}
