public class MaxSubarray {
    // Kadane: best sum of a non-empty contiguous subarray, with its bounds. O(n) time, O(1) space.
    static long[] kadane(int[] a) {
        long best = a[0], cur = a[0];
        int bestL = 0, bestR = 0, curL = 0;
        for (int i = 1; i < a.length; i++) {
            if (cur < 0) { cur = a[i]; curL = i; }      // a negative prefix never helps: restart here
            else cur += a[i];
            if (cur > best) { best = cur; bestL = curL; bestR = i; }
        }
        return new long[] {best, bestL, bestR};
    }

    static long bruteForce(int[] a) {
        long best = Long.MIN_VALUE;
        for (int i = 0; i < a.length; i++) {
            long s = 0;
            for (int j = i; j < a.length; j++) { s += a[j]; best = Math.max(best, s); }
        }
        return best;
    }

    public static void main(String[] args) {
        int[] demand = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        long[] r = kadane(demand);
        System.out.println("best sum " + r[0] + " from index " + r[1] + " to " + r[2]);
        long[] neg = kadane(new int[] {-8, -3, -6});
        System.out.println("all negative: best " + neg[0] + " at index " + neg[1]);
        java.util.Random rnd = new java.util.Random(7);
        boolean ok = true;
        for (int t = 0; t < 1000; t++) {
            int[] a = new int[1 + rnd.nextInt(12)];
            for (int i = 0; i < a.length; i++) a[i] = rnd.nextInt(21) - 10;
            ok &= kadane(a)[0] == bruteForce(a);
        }
        System.out.println("1000 random arrays match brute force: " + ok);
    }
}
