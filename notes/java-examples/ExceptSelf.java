import java.util.Arrays;

public class ExceptSelf {
    // out[i] = product of all a[j] with j != i, without division. O(n) time, O(1) extra besides the output.
    static long[] productExceptSelf(int[] a) {
        int n = a.length;
        long[] out = new long[n];
        long prefix = 1;
        for (int i = 0; i < n; i++) { out[i] = prefix; prefix *= a[i]; }
        long suffix = 1;
        for (int i = n - 1; i >= 0; i--) { out[i] *= suffix; suffix *= a[i]; }
        return out;
    }

    // Prefix sums answer many range-total queries in O(1) each after O(n) setup.
    static long[] prefixSums(int[] a) {
        long[] p = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) p[i + 1] = p[i] + a[i];
        return p;
    }

    public static void main(String[] args) {
        System.out.println("except self [1, 2, 3, 4] -> " + Arrays.toString(productExceptSelf(new int[] {1, 2, 3, 4})));
        System.out.println("with a zero [2, 0, 5] -> " + Arrays.toString(productExceptSelf(new int[] {2, 0, 5})));
        int[] bookingsPerHour = {3, 8, 5, 0, 6, 9};
        long[] p = prefixSums(bookingsPerHour);
        System.out.println("bookings in hours [1, 4) = " + (p[4] - p[1]) + ", in [0, 6) = " + (p[6] - p[0]));
    }
}
