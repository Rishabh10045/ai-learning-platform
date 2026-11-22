import java.util.*;

public class SubsetSumDp {
    // 0/1 subset sum, compressed to one row: reach[s] = can some subset of the items seen so far sum to s.
    // Iterate s DOWNWARD so reach[s - w] still describes the state BEFORE this item (each item used at most once).
    static boolean[] zeroOne(int[] weights, int target, boolean descending) {
        boolean[] reach = new boolean[target + 1];
        reach[0] = true;
        for (int w : weights) {
            if (descending) { for (int s = target; s >= w; s--) reach[s] |= reach[s - w]; }
            else            { for (int s = w; s <= target; s++) reach[s] |= reach[s - w]; }   // bug for 0/1: reuses w
        }
        return reach;
    }

    static List<Integer> reachable(boolean[] reach) {
        List<Integer> out = new ArrayList<>();
        for (int s = 0; s < reach.length; s++) if (reach[s]) out.add(s);
        return out;
    }

    // Matrix-chain multiplication: cost[i][j] = cheapest way to multiply matrices i..j. Fill by increasing length.
    static long matrixChain(int[] dims) {
        int n = dims.length - 1;                   // matrix k has shape dims[k] x dims[k+1]
        long[][] cost = new long[n][n];
        for (int len = 2; len <= n; len++)
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                cost[i][j] = Long.MAX_VALUE;
                for (int k = i; k < j; k++)
                    cost[i][j] = Math.min(cost[i][j], cost[i][k] + cost[k + 1][j] + (long) dims[i] * dims[k + 1] * dims[j + 1]);
            }
        return cost[0][n - 1];
    }

    public static void main(String[] args) {
        System.out.println("one item of weight 3, descending (0/1): " + reachable(zeroOne(new int[] {3}, 6, true)));
        System.out.println("one item of weight 3, ascending (bug):  " + reachable(zeroOne(new int[] {3}, 6, false)));
        boolean[] r = zeroOne(new int[] {3, 34, 4, 12, 5, 2}, 9, true);
        System.out.println("{3,34,4,12,5,2} reaches 9: " + r[9]);
        System.out.println("matrix chain 10x30, 30x5, 5x60: " + matrixChain(new int[] {10, 30, 5, 60}) + " multiplications");
    }
}
