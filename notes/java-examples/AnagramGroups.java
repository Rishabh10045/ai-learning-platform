import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class AnagramGroups {
    // Key = the word's letters sorted. O(n · k log k) for n words of length k.
    static String key(String w) {
        char[] c = w.toCharArray();
        Arrays.sort(c);
        return new String(c);
    }

    static Map<String, List<String>> groupLoop(List<String> words) {
        Map<String, List<String>> groups = new TreeMap<>();
        for (String w : words) groups.computeIfAbsent(key(w), k -> new ArrayList<>()).add(w);
        return groups;
    }

    // The same grouping as a stream pipeline; TreeMap::new keeps the printed order stable.
    static Map<String, List<String>> groupStream(List<String> words) {
        return words.stream().collect(Collectors.groupingBy(AnagramGroups::key, TreeMap::new, Collectors.toList()));
    }

    // Generic helper: the largest group, ties broken by the smaller key.
    static <K extends Comparable<K>, V> K largest(Map<K, List<V>> groups) {
        K best = null;
        for (Map.Entry<K, List<V>> e : groups.entrySet())
            if (best == null || e.getValue().size() > groups.get(best).size()) best = e.getKey();
        return best;
    }

    public static void main(String[] args) {
        List<String> words = List.of("listen", "silent", "enlist", "google", "gooegl", "cat", "act", "tac", "dog");
        Map<String, List<String>> g = groupLoop(words);
        System.out.println("groups: " + g.values());
        System.out.println("stream version equal: " + g.equals(groupStream(words)));
        System.out.println("largest group key: " + largest(g) + " -> " + g.get(largest(g)));
    }
}
