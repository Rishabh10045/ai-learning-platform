import java.util.Arrays;

public class ThreeWayPartition {
    // Dutch national flag: 0 = free, 1 = held, 2 = booked. One pass, O(1) extra space.
    // Invariant: [0, low) are 0s, [low, mid) are 1s, (high, end] are 2s, [mid, high] unknown.
    static void partition(int[] a) {
        int low = 0, mid = 0, high = a.length - 1;
        while (mid <= high) {
            if (a[mid] == 0) swap(a, low++, mid++);
            else if (a[mid] == 1) mid++;
            else swap(a, mid, high--);           // do not advance mid: the swapped-in value is unknown
        }
    }

    static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

    public static void main(String[] args) {
        int[] states = {2, 0, 2, 1, 1, 0, 0, 2, 1};
        partition(states);
        System.out.println("partitioned: " + Arrays.toString(states));
        int[] one = {2, 2, 2};
        partition(one);
        System.out.println("all booked: " + Arrays.toString(one));
        int[] random = new java.util.Random(3).ints(1000, 0, 3).toArray();
        int[] expected = random.clone();
        Arrays.sort(expected);
        partition(random);
        System.out.println("1000 random states match a sort: " + Arrays.equals(random, expected));
    }
}
