import java.util.Arrays;

public class RotateSeats {
    // Rotate right by k in place with three reversals. O(n) time, O(1) space.
    static void rotate(int[] a, int k) {
        int n = a.length;
        if (n == 0) return;
        k = ((k % n) + n) % n;                 // handles k > n and negative k
        reverse(a, 0, n - 1);
        reverse(a, 0, k - 1);
        reverse(a, k, n - 1);
    }

    static void reverse(int[] a, int i, int j) {
        while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
    }

    // Round-robin: which of the instances handles request r, starting from instance offset.
    static int route(long request, int instances, int offset) {
        return (int) ((request + offset) % instances);
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5, 6, 7};
        rotate(a, 3);
        System.out.println("rotate right 3: " + Arrays.toString(a));
        int[] b = {1, 2, 3};
        rotate(b, 5);
        System.out.println("rotate right 5 (= 2): " + Arrays.toString(b));
        int[] c = {1, 2, 3, 4};
        rotate(c, -1);
        System.out.println("rotate left 1: " + Arrays.toString(c));
        StringBuilder sb = new StringBuilder();
        for (long r = 0; r < 6; r++) sb.append(route(r, 2, 1)).append(r < 5 ? " " : "");
        System.out.println("round-robin over 2 instances from offset 1: " + sb);
    }
}
