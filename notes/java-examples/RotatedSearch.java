// Binary search in a sorted array that was rotated, e.g. ticket IDs after a wrap-around.
public class RotatedSearch {
    static int search(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) return mid;
            if (a[lo] <= a[mid]) {                       // left half is sorted
                if (a[lo] <= target && target < a[mid]) hi = mid - 1; else lo = mid + 1;
            } else {                                     // right half is sorted
                if (a[mid] < target && target <= a[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return -1;
    }

    // Index of the smallest element = number of positions rotated.
    static int rotationPoint(int[] a) {
        int lo = 0, hi = a.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] > a[hi]) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] a = {40, 50, 60, 70, 10, 20, 30};
        System.out.println("search 20 -> index " + search(a, 20));
        System.out.println("search 60 -> index " + search(a, 60));
        System.out.println("search 35 -> index " + search(a, 35));
        System.out.println("rotation point -> index " + rotationPoint(a) + " (value " + a[rotationPoint(a)] + ")");
        System.out.println("not rotated {1,2,3}: search 3 -> " + search(new int[]{1, 2, 3}, 3) + ", rotation point " + rotationPoint(new int[]{1, 2, 3}));
        System.out.println("single {5}: search 5 -> " + search(new int[]{5}, 5) + ", empty: " + search(new int[]{}, 5));
    }
}
