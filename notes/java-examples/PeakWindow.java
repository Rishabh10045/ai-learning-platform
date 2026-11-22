public class PeakWindow {
    // Largest number of requests in any window of width ms, from sorted timestamps. Two pointers: O(n).
    static int[] peak(long[] t, long width) {
        int best = 0, bestStart = 0, left = 0;
        for (int right = 0; right < t.length; right++) {
            while (t[right] - t[left] >= width) left++;   // keep window [t[left], t[left] + width)
            if (right - left + 1 > best) { best = right - left + 1; bestStart = left; }
        }
        return new int[] {best, bestStart};
    }

    public static void main(String[] args) {
        long[] ts = {0, 200, 400, 1000, 1100, 1150, 1180, 1190, 2500, 4000};
        int[] r = peak(ts, 1000);
        System.out.println("peak in any 1000 ms window: " + r[0] + " requests, starting at " + ts[r[1]] + " ms");
        System.out.println("average over the whole period: " + Math.round(10.0 * ts.length / ((ts[ts.length - 1] - ts[0]) / 1000.0)) / 10.0 + " requests per second");
        long peakRps = r[0];
        int perInstance = 4;
        System.out.println("instances needed at peak with " + perInstance + " req/s each: " + (peakRps + perInstance - 1) / perInstance);
    }
}
