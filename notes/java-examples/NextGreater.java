import java.util.*;

// Next greater element with a monotonic stack: for each day, how many days until a higher load?
public class NextGreater {
    static int[] nextGreaterIndex(int[] a) {
        int[] ans = new int[a.length];
        Arrays.fill(ans, -1);
        Deque<Integer> stack = new ArrayDeque<>();       // indices with values decreasing from bottom to top
        for (int i = 0; i < a.length; i++) {
            while (!stack.isEmpty() && a[stack.peek()] < a[i]) ans[stack.pop()] = i;
            stack.push(i);
        }
        return ans;                                      // indices left on the stack have no greater element
    }

    static int[] daysToWait(int[] a) {
        int[] idx = nextGreaterIndex(a), out = new int[a.length];
        for (int i = 0; i < a.length; i++) out[i] = idx[i] < 0 ? 0 : idx[i] - i;
        return out;
    }

    public static void main(String[] args) {
        int[] load = {73, 74, 75, 71, 69, 72, 76, 73};
        System.out.println("next greater index: " + Arrays.toString(nextGreaterIndex(load)));
        System.out.println("days to wait     : " + Arrays.toString(daysToWait(load)));
        System.out.println("decreasing       : " + Arrays.toString(nextGreaterIndex(new int[]{5, 4, 3})));
        System.out.println("equal values     : " + Arrays.toString(nextGreaterIndex(new int[]{2, 2, 3})));
        System.out.println("empty            : " + Arrays.toString(nextGreaterIndex(new int[]{})));
    }
}
