import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

public class TopKNearest {
    record Departure(String id, int minutesAway, int arrival) {}

    // Rank: fewer minutes first; on a tie, earlier arrival first (stable).
    static final Comparator<Departure> RANK =
        Comparator.comparingInt(Departure::minutesAway).thenComparingInt(Departure::arrival);

    // Keep the k best in a max-heap of the current k: the root is the worst kept item.
    static List<Departure> nearest(List<Departure> stream, int k) {
        if (k <= 0) return List.of();
        PriorityQueue<Departure> heap = new PriorityQueue<>(RANK.reversed());
        for (Departure d : stream) {
            if (heap.size() < k) heap.offer(d);
            else if (RANK.compare(d, heap.peek()) < 0) { heap.poll(); heap.offer(d); }
        }
        List<Departure> out = new ArrayList<>(heap);
        out.sort(RANK);                        // a heap is not sorted: sort the k survivors
        return out;
    }

    static List<String> ids(List<Departure> ds) {
        return ds.stream().map(d -> d.id() + "(" + d.minutesAway() + ")").toList();
    }

    public static void main(String[] args) {
        int[] mins = {7, 2, 6, 1, 4};
        List<Departure> stream = new ArrayList<>();
        for (int i = 0; i < mins.length; i++) stream.add(new Departure("D" + i, mins[i], i));
        System.out.println("k=3 nearest: " + ids(nearest(stream, 3)));

        List<Departure> ties = List.of(new Departure("A", 5, 0), new Departure("B", 3, 1),
            new Departure("C", 5, 2), new Departure("D", 5, 3));
        System.out.println("tie k=2: " + ids(nearest(ties, 2)) + " - A arrived before C and D");
        System.out.println("k=0: " + nearest(stream, 0) + ", k=10: " + nearest(stream, 10).size() + " items");
    }
}
