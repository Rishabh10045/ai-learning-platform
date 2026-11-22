import java.util.*;

public class HashIndex {
    // Same spreading HashMap uses (Java 8+): mix high bits into low bits.
    static int spread(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
    static int bucket(Object key, int capacity) { return (capacity - 1) & spread(key); }

    public static void main(String[] args) {
        int capacity = 16;                       // default table size
        for (String k : List.of("apple", "banana", "cherry", "Aa", "BB")) {
            System.out.printf("%-7s hashCode=%-11d bucket=%d%n", k, k.hashCode(), bucket(k, capacity));
        }
        // "Aa" and "BB" have the same hashCode (2112): a real collision, same bucket.
        Map<String, Integer> m = new HashMap<>();
        m.put("Aa", 1); m.put("BB", 2); m.put(null, 0); // one null key is allowed (bucket 0)
        System.out.println(m.get("Aa") + " " + m.get("BB") + " " + m.get(null));
        // Threshold = capacity * loadFactor = 16 * 0.75 = 12: the 13th put doubles the table to 32.
    }
}
