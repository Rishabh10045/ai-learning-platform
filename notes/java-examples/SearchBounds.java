import java.util.Arrays;

public class SearchBounds {
    // First index i with a[i] >= key (n if none). Half-open [lo, hi): O(log n).
    static int lowerBound(int[] a, int key) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;          // no overflow, unlike (lo + hi) / 2
            if (a[mid] < key) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    // First index i with a[i] > key.
    static int upperBound(int[] a, int key) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] <= key) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] rows = {2, 4, 4, 4, 7, 9};               // sorted seat rows that have bookings
        System.out.println("rows " + Arrays.toString(rows));
        for (int key : new int[] {4, 5, 1, 10}) {
            int lo = lowerBound(rows, key), hi = upperBound(rows, key);
            System.out.println("key " + key + ": lower " + lo + ", upper " + hi + ", count " + (hi - lo));
        }
        System.out.println("Arrays.binarySearch for 5 returns " + Arrays.binarySearch(rows, 5) + " = -(insertion point) - 1");
        System.out.println("empty array lower bound: " + lowerBound(new int[0], 3));
    }
}
