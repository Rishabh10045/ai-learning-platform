import java.util.HashSet;
import java.util.Set;

public class ConsecutiveRun {
    // Longest run of consecutive seat numbers, in expected O(n): start counting only at run starts.
    static int[] longestRun(int[] seats) {
        Set<Integer> set = new HashSet<>();
        for (int s : seats) set.add(s);
        int bestLen = 0, bestStart = 0;
        for (int s : set) {
            if (set.contains(s - 1)) continue;          // not the start of a run
            int len = 1;
            while (set.contains(s + len)) len++;
            if (len > bestLen || (len == bestLen && s < bestStart)) { bestLen = len; bestStart = s; }
        }
        return new int[] {bestStart, bestLen};
    }

    public static void main(String[] args) {
        int[] free = {100, 4, 200, 1, 3, 2, 2, 101, 102};
        int[] r = longestRun(free);
        System.out.println("longest run starts at " + r[0] + ", length " + r[1]);
        int[] tie = {10, 11, 1, 2};
        int[] t = longestRun(tie);
        System.out.println("tie: starts at " + t[0] + ", length " + t[1]);
        System.out.println("empty: length " + longestRun(new int[0])[1]);
    }
}
