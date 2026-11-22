import java.util.*;

public class PrefixWindows {
    // prefix[i] = total bad requests in minutes 0..i-1, so any range [from, to) costs O(1) after O(n) setup.
    static long[] prefix(int[] perMinute) {
        long[] p = new long[perMinute.length + 1];
        for (int i = 0; i < perMinute.length; i++) p[i + 1] = p[i] + perMinute[i];
        return p;
    }

    static long range(long[] p, int from, int to) { return p[to] - p[from]; }

    // Worst (largest) total over any window of k consecutive minutes, using the same prefix sums.
    static int worstWindowStart(long[] p, int k) {
        int best = 0;
        for (int s = 1; s + k < p.length; s++) if (range(p, s, s + k) > range(p, best, best + k)) best = s;
        return best;
    }

    public static void main(String[] args) {
        int[] badPerMinute = {0, 1, 0, 0, 7, 9, 4, 0, 1, 0, 0, 2};
        long[] p = prefix(badPerMinute);
        System.out.println("prefix: " + Arrays.toString(p));
        System.out.println("bad in minutes [4, 7): " + range(p, 4, 7));
        System.out.println("bad in all 12 minutes: " + range(p, 0, badPerMinute.length));
        int s = worstWindowStart(p, 3);
        System.out.println("worst 3-minute window starts at minute " + s + " with " + range(p, s, s + 3) + " bad");
    }
}
