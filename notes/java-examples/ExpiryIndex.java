import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class ExpiryIndex {
    // Holds ordered by expiry time (then ID, so equal times stay distinct). Range queries are O(log n + k).
    record Key(long expiresAt, String holdId) implements Comparable<Key> {
        public int compareTo(Key o) {
            int c = Long.compare(expiresAt, o.expiresAt);
            return c != 0 ? c : holdId.compareTo(o.holdId);
        }
    }

    private final TreeMap<Key, String> bySeat = new TreeMap<>();   // key -> seat

    void add(String holdId, String seat, long expiresAt) { bySeat.put(new Key(expiresAt, holdId), seat); }

    // A hold is valid while now < expiresAt, so a hold expiring exactly at now is expired.
    List<String> expired(long now) {
        List<String> out = new ArrayList<>();
        for (Map.Entry<Key, String> e : bySeat.headMap(new Key(now, "\uffff"), true).entrySet())
            out.add(e.getKey().holdId() + "@" + e.getValue());
        return out;
    }

    // Earliest upcoming expiry after now: tells a cleanup job how long it may sleep.
    Long nextExpiry(long now) {
        Key k = bySeat.higherKey(new Key(now, "\uffff"));
        return k == null ? null : k.expiresAt();
    }

    public static void main(String[] args) {
        ExpiryIndex idx = new ExpiryIndex();
        idx.add("H1", "A1", 1_000);
        idx.add("H2", "A2", 1_500);
        idx.add("H3", "B7", 1_500);
        idx.add("H4", "C3", 3_000);
        System.out.println("expired at 999:  " + idx.expired(999));
        System.out.println("expired at 1000: " + idx.expired(1_000) + " - equality counts as expired");
        System.out.println("expired at 1500: " + idx.expired(1_500));
        System.out.println("next expiry after 1500: " + idx.nextExpiry(1_500));
        System.out.println("next expiry after 3000: " + idx.nextExpiry(3_000));
    }
}
