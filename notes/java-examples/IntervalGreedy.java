import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class IntervalGreedy {
    record Booking(String id, int start, int end) {}   // half-open [start, end), minutes

    // Earliest finish first: maximizes the NUMBER of non-overlapping bookings.
    static List<String> select(List<Booking> bookings, int bufferMinutes) {
        List<Booking> sorted = new ArrayList<>(bookings);
        sorted.sort(Comparator.comparingInt(Booking::end).thenComparing(Booking::id));
        List<String> chosen = new ArrayList<>();
        long freeFrom = Long.MIN_VALUE;
        for (Booking b : sorted) {
            if (b.start() >= freeFrom) {
                chosen.add(b.id());
                freeFrom = (long) b.end() + bufferMinutes;   // reset time before the next one
            }
        }
        return chosen;
    }

    static int greedyCoins(int[] coins, int target) {
        int[] c = coins.clone();
        Arrays.sort(c);
        int count = 0;
        for (int i = c.length - 1; i >= 0; i--) { count += target / c[i]; target %= c[i]; }
        return target == 0 ? count : -1;
    }

    static int dpCoins(int[] coins, int target) {
        int[] best = new int[target + 1];
        Arrays.fill(best, Integer.MAX_VALUE);
        best[0] = 0;
        for (int t = 1; t <= target; t++)
            for (int c : coins)
                if (c <= t && best[t - c] != Integer.MAX_VALUE) best[t] = Math.min(best[t], best[t - c] + 1);
        return best[target] == Integer.MAX_VALUE ? -1 : best[target];
    }

    public static void main(String[] args) {
        List<Booking> day = List.of(new Booking("A", 540, 600), new Booking("B", 570, 630),
            new Booking("C", 600, 660), new Booking("D", 610, 700), new Booking("E", 660, 720));
        System.out.println("earliest finish: " + select(day, 0));
        System.out.println("with 10-min reset: " + select(day, 10));
        List<Booking> edge = List.of(new Booking("P", 0, 60), new Booking("Q", 69, 90),
            new Booking("R", 70, 100), new Booking("S", 71, 120));
        System.out.println("reset edge cases (9, 10, 11 min after P ends): " + select(edge, 10));
        System.out.println("coins [1,3,4] for 6: greedy " + greedyCoins(new int[] {1, 3, 4}, 6)
            + ", optimal " + dpCoins(new int[] {1, 3, 4}, 6));
    }
}
