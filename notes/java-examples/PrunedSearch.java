import java.util.*;

public class PrunedSearch {
    static int calls;

    // Combination sum: every multiset of ticket prices (reuse allowed) that adds up to the budget exactly.
    static void combine(int[] prices, int start, int remaining, Deque<Integer> chosen, List<List<Integer>> out, boolean prune) {
        calls++;
        if (remaining == 0) { out.add(new ArrayList<>(chosen)); return; }
        if (remaining < 0) return;                         // dead end, discovered only after stepping into it
        for (int i = start; i < prices.length; i++) {
            if (prune && prices[i] > remaining) break;      // prices are sorted: every later price is too big as well
            chosen.addLast(prices[i]);
            combine(prices, i, remaining - prices[i], chosen, out, prune);   // i, not i + 1: a price may repeat
            chosen.removeLast();                            // undo the choice before trying the next one
        }
    }

    // N-Queens count: place one queen per row; prune any column or diagonal already attacked.
    static int queens(int n, int row, boolean[] col, boolean[] diag, boolean[] anti) {
        if (row == n) return 1;
        int count = 0;
        for (int c = 0; c < n; c++) {
            if (col[c] || diag[row - c + n - 1] || anti[row + c]) continue;
            col[c] = diag[row - c + n - 1] = anti[row + c] = true;
            count += queens(n, row + 1, col, diag, anti);
            col[c] = diag[row - c + n - 1] = anti[row + c] = false;
        }
        return count;
    }

    public static void main(String[] args) {
        int[] prices = {2, 3, 5, 7};                         // sorted, so the pruning rule is valid
        for (boolean prune : new boolean[] {false, true}) {
            calls = 0;
            List<List<Integer>> out = new ArrayList<>();
            combine(prices, 0, 10, new ArrayDeque<>(), out, prune);
            System.out.println((prune ? "pruned:   " : "unpruned: ") + out + " in " + calls + " calls");
        }
        for (int n : new int[] {4, 6, 8}) System.out.println(n + "-queens solutions: " + queens(n, 0, new boolean[n], new boolean[2 * n - 1], new boolean[2 * n - 1]));
    }
}
