import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

public class CachePolicies {
    // LRU via LinkedHashMap access order; LFU by counting uses (ties: least recently used first).
    static int lruHits(String[] trace, int capacity) {
        Map<String, Boolean> cache = new LinkedHashMap<>(16, 0.75f, true) {
            @Override protected boolean removeEldestEntry(Map.Entry<String, Boolean> e) { return size() > capacity; }
        };
        int hits = 0;
        for (String k : trace) { if (cache.get(k) != null) hits++; else cache.put(k, true); }
        return hits;
    }

    static int lfuHits(String[] trace, int capacity) {
        Map<String, Integer> freq = new HashMap<>();
        Map<String, Integer> lastUse = new HashMap<>();
        int hits = 0;
        for (int t = 0; t < trace.length; t++) {
            String k = trace[t];
            if (freq.containsKey(k)) hits++;
            else if (freq.size() == capacity) {
                String victim = null;
                for (String c : freq.keySet())
                    if (victim == null || freq.get(c) < freq.get(victim)
                        || (freq.get(c).equals(freq.get(victim)) && lastUse.get(c) < lastUse.get(victim))) victim = c;
                freq.remove(victim); lastUse.remove(victim);
            }
            freq.merge(k, 1, Integer::sum);
            lastUse.put(k, t);
        }
        return hits;
    }

    public static void main(String[] args) {
        // A popular event map (E) is read constantly; a one-off scan of other events passes through.
        String[] scan = {"E", "E", "E", "A", "B", "C", "E", "D", "F", "G", "E", "E"};
        System.out.println("scan trace, capacity 3: LRU hits " + lruHits(scan, 3) + ", LFU hits " + lfuHits(scan, 3));
        // Interest shifts: X was popular, now Y and Z are.
        String[] shift = {"X", "X", "X", "X", "Y", "Z", "Y", "Z", "Y", "Z"};
        System.out.println("shift trace, capacity 2: LRU hits " + lruHits(shift, 2) + ", LFU hits " + lfuHits(shift, 2));
    }
}
