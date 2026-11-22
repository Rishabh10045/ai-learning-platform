import java.util.*;

public class KeyAtTime {
    // Signing keys rotate. Each key is valid from its start time until the next key starts.
    // To verify a token issued at time t, find the last key whose start is <= t: a "floor" binary search.
    static int floorIndex(long[] starts, long t) {
        int lo = 0, hi = starts.length - 1, ans = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;           // avoids int overflow of (lo + hi)
            if (starts[mid] <= t) { ans = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        return ans;
    }

    public static void main(String[] args) {
        long[] starts = {1000, 2000, 3500, 5000};
        String[] kids = {"k1", "k2", "k3", "k4"};
        for (long t : new long[] {999, 1000, 2999, 3500, 9999}) {
            int i = floorIndex(starts, t);
            System.out.println("issued at " + t + " -> " + (i < 0 ? "no key (reject)" : kids[i]));
        }
        TreeMap<Long, String> byStart = new TreeMap<>(Map.of(1000L, "k1", 2000L, "k2", 3500L, "k3", 5000L, "k4"));
        System.out.println("TreeMap.floorEntry(2999) -> " + byStart.floorEntry(2999L).getValue());
    }
}
