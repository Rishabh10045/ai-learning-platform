import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

public class HashRing {
    // Consistent hashing: nodes and keys hash onto a ring; a key belongs to the first node clockwise.
    private final TreeMap<Long, String> ring = new TreeMap<>();
    private final int virtualNodes;

    HashRing(int virtualNodes) { this.virtualNodes = virtualNodes; }

    static long hash(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes(StandardCharsets.UTF_8));
            long h = 0;
            for (int i = 0; i < 8; i++) h = (h << 8) | (d[i] & 0xff);
            return h;
        } catch (Exception e) { throw new IllegalStateException(e); }
    }

    void add(String node) { for (int v = 0; v < virtualNodes; v++) ring.put(hash(node + "#" + v), node); }
    void remove(String node) { for (int v = 0; v < virtualNodes; v++) ring.remove(hash(node + "#" + v)); }

    String nodeFor(String key) {
        SortedMap<Long, String> tail = ring.tailMap(hash(key));
        return tail.isEmpty() ? ring.firstEntry().getValue() : tail.get(tail.firstKey());
    }

    public static void main(String[] args) {
        HashRing r = new HashRing(100);
        for (String n : new String[] {"db-1", "db-2", "db-3"}) r.add(n);
        int keys = 10_000;
        Map<String, Integer> load = new TreeMap<>();
        String[] before = new String[keys];
        for (int i = 0; i < keys; i++) { before[i] = r.nodeFor("event-" + i); load.merge(before[i], 1, Integer::sum); }
        System.out.println("load on 3 nodes: " + load);
        r.add("db-4");
        int moved = 0;
        for (int i = 0; i < keys; i++) if (!r.nodeFor("event-" + i).equals(before[i])) moved++;
        System.out.println("adding db-4 moved " + moved + " of " + keys + " keys (modulo hashing would move about 7500)");
        System.out.println("a hot key still lives on one node: event-42 -> " + r.nodeFor("event-42"));
    }
}
