import java.util.*;

// Heaps: the k largest values of a stream with a size-k min-heap, and merging k sorted lists.
public class KthLargest {
    static List<Integer> topK(int[] stream, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();   // min-heap holding the k largest so far
        for (int x : stream) {
            if (heap.size() < k) heap.offer(x);
            else if (x > heap.peek()) { heap.poll(); heap.offer(x); }
        }
        List<Integer> out = new ArrayList<>(heap);
        out.sort(Comparator.reverseOrder());
        return out;
    }

    static List<Integer> mergeSorted(List<List<Integer>> lists) {
        // heap entries: {value, listIndex, position}
        PriorityQueue<int[]> heap = new PriorityQueue<>(Comparator.comparingInt((int[] e) -> e[0]).thenComparingInt(e -> e[1]));
        for (int i = 0; i < lists.size(); i++) if (!lists.get(i).isEmpty()) heap.offer(new int[]{lists.get(i).get(0), i, 0});
        List<Integer> out = new ArrayList<>();
        while (!heap.isEmpty()) {
            int[] e = heap.poll();
            out.add(e[0]);
            int next = e[2] + 1;
            if (next < lists.get(e[1]).size()) heap.offer(new int[]{lists.get(e[1]).get(next), e[1], next});
        }
        return out;
    }

    public static void main(String[] args) {
        int[] latencies = {120, 340, 90, 410, 150, 700, 80, 410};
        System.out.println("top 3 latencies: " + topK(latencies, 3));
        System.out.println("3rd largest    : " + topK(latencies, 3).get(2));
        System.out.println("k > n          : " + topK(new int[]{5, 1}, 3));
        System.out.println("merge 3 lists  : " + mergeSorted(List.of(List.of(1, 4, 9), List.of(2, 3, 10), List.of(), List.of(5))));
    }
}
