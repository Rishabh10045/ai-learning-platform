import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MergeSorted {
    // Merge two sorted arrays in O(n + m); on ties take from a first so the merge is stable.
    static int[] merge(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
        while (i < a.length) out[k++] = a[i++];
        while (j < b.length) out[k++] = b[j++];
        return out;
    }

    // Values present in both sorted arrays, each reported once.
    static List<Integer> intersect(int[] a, int[] b) {
        List<Integer> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < a.length && j < b.length) {
            if (a[i] < b[j]) i++;
            else if (a[i] > b[j]) j++;
            else {
                if (out.isEmpty() || out.get(out.size() - 1) != a[i]) out.add(a[i]);
                i++; j++;
            }
        }
        return out;
    }

    public static void main(String[] args) {
        int[] morning = {1, 3, 5, 5, 9}, evening = {2, 3, 5, 10};
        System.out.println("merged: " + Arrays.toString(merge(morning, evening)));
        System.out.println("in both: " + intersect(morning, evening));
        System.out.println("merge with empty: " + Arrays.toString(merge(new int[0], evening)));
    }
}
