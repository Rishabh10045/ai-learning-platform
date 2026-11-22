import java.util.*;

public class MergeHolds {
    // A hold on one seat from start (inclusive) to end (exclusive), in minutes after the doors open.
    record Hold(int start, int end) {
        public String toString() { return "[" + start + "," + end + ")"; }
    }

    // Sort by start, then extend the last merged interval while the next one overlaps or touches it.
    static List<Hold> merge(List<Hold> holds) {
        List<Hold> sorted = new ArrayList<>(holds);
        sorted.sort(Comparator.comparingInt(Hold::start));
        List<Hold> merged = new ArrayList<>();
        for (Hold h : sorted) {
            if (!merged.isEmpty() && h.start() <= merged.get(merged.size() - 1).end()) {
                Hold last = merged.remove(merged.size() - 1);
                merged.add(new Hold(last.start(), Math.max(last.end(), h.end())));
            } else {
                merged.add(h);
            }
        }
        return merged;
    }

    // Half-open intervals [a,b) and [c,d) overlap exactly when a < d and c < b.
    static boolean conflicts(List<Hold> busy, Hold wanted) {
        for (Hold h : busy) if (wanted.start() < h.end() && h.start() < wanted.end()) return true;
        return false;
    }

    public static void main(String[] args) {
        List<Hold> holds = List.of(new Hold(30, 40), new Hold(0, 10), new Hold(5, 15), new Hold(15, 20), new Hold(50, 55));
        List<Hold> busy = merge(holds);
        System.out.println("busy: " + busy);
        System.out.println("hold [20,30) conflicts: " + conflicts(busy, new Hold(20, 30)));
        System.out.println("hold [18,25) conflicts: " + conflicts(busy, new Hold(18, 25)));
        System.out.println("merge of no holds: " + merge(List.of()));
    }
}
