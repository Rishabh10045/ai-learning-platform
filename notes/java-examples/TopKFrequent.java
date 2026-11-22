import java.util.*;

public class TopKFrequent {
    // k most frequent values. Count with a HashMap, keep a min-heap of size k ordered by count (on a tie, the alphabetically later value leaves first).
    static List<String> topK(String[] items, int k) {
        Map<String, Integer> count = new HashMap<>();
        for (String s : items) count.merge(s, 1, Integer::sum);
        Comparator<String> byCount = Comparator.<String>comparingInt(count::get).thenComparing(Comparator.reverseOrder());
        PriorityQueue<String> heap = new PriorityQueue<>(byCount);       // head = weakest of the current top k
        for (String s : count.keySet()) {
            heap.offer(s);
            if (heap.size() > k) heap.poll();                            // drop the weakest, keep size k
        }
        List<String> out = new ArrayList<>(heap);
        out.sort(byCount.reversed());                                    // strongest first
        return out;
    }

    public static void main(String[] args) {
        String[] questions = {"refund", "parking", "refund", "seat", "refund", "parking", "food", "seat", "parking", "refund"};
        System.out.println(topK(questions, 2));
        System.out.println(topK(questions, 3));
        System.out.println(topK(new String[] {"b", "a", "c"}, 2));       // all tied: alphabetical order breaks ties
        System.out.println(topK(new String[] {}, 2));
    }
}
