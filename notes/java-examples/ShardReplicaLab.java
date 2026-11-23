import java.util.*;

// Day 21 main lab: replication lag and read-your-writes, then choosing a shard key and measuring how many
// keys move when a shard is added (hash mod N vs a consistent-hash ring). Index plans run in day21-indexes.sql.
public class ShardReplicaLab {
    // Primary + one asynchronous replica. Replication applies the log only when replicate() is called.
    static final class ReplicatedStore {
        final Map<String, String> primary = new HashMap<>(), replica = new HashMap<>();
        final Deque<String[]> log = new ArrayDeque<>();
        void write(String k, String v) { primary.put(k, v); log.add(new String[] {k, v}); }
        void replicate() { while (!log.isEmpty()) { String[] e = log.poll(); replica.put(e[0], e[1]); } }
    }
    // Router: after a user writes, read that user's data from the primary for a short window.
    static final class Router {
        final ReplicatedStore s; final Map<String, Integer> recentWriter = new HashMap<>(); int tick;
        Router(ReplicatedStore s) { this.s = s; }
        void book(String user, String seat) { s.write(seat, user); recentWriter.put(user, tick); }
        String read(String user, String seat, boolean readYourWrites) {
            boolean fresh = readYourWrites && recentWriter.containsKey(user) && tick - recentWriter.get(user) < 5;
            return (fresh ? "primary: " : "replica: ") + (fresh ? s.primary : s.replica).getOrDefault(seat, "free");
        }
    }

    static int modShard(String key, int n) { return Math.floorMod(key.hashCode(), n); }
    static int ringShard(String key, TreeMap<Integer, Integer> ring) {
        Map.Entry<Integer, Integer> e = ring.ceilingEntry(mix(key.hashCode()));
        return (e != null ? e : ring.firstEntry()).getValue();
    }
    static TreeMap<Integer, Integer> ring(int shards, int vnodes) {
        TreeMap<Integer, Integer> r = new TreeMap<>();
        for (int s = 0; s < shards; s++) for (int v = 0; v < vnodes; v++) r.put(mix(("shard-" + s + "#" + v).hashCode()), s);
        return r;
    }
    static int mix(int h) { h ^= h >>> 16; h *= 0x85ebca6b; h ^= h >>> 13; h *= 0xc2b2ae35; return h ^ (h >>> 16); }

    public static void main(String[] args) {
        Router router = new Router(new ReplicatedStore());
        router.book("U1", "A1");
        System.out.println("U1 reads A1, replica only:        " + router.read("U1", "A1", false));
        System.out.println("U1 reads A1, read-your-writes:    " + router.read("U1", "A1", true));
        System.out.println("U2 reads A1 (not the writer):     " + router.read("U2", "A1", true));
        router.s.replicate();
        System.out.println("after replication, U2 reads A1:   " + router.read("U2", "A1", true));

        List<String> keys = new ArrayList<>();
        for (int show = 0; show < 2000; show++) keys.add("show-" + show);
        int movedMod = 0, movedRing = 0;
        TreeMap<Integer, Integer> four = ring(4, 64), five = ring(5, 64);
        for (String k : keys) { if (modShard(k, 4) != modShard(k, 5)) movedMod++; if (ringShard(k, four) != ringShard(k, five)) movedRing++; }
        System.out.printf("adding shard 5: hash mod N moves %d%% of shows, consistent ring moves %d%%%n", movedMod * 100 / keys.size(), movedRing * 100 / keys.size());
        // Shard key choice: by seat, one show's 300 seats spread over every shard; by show, they share one shard,
        // so "hold these 2 seats together" stays a single-shard transaction (the cost: a hot show is one hot shard).
        Set<Integer> bySeat = new TreeSet<>(), byShow = new TreeSet<>();
        for (int seat = 1; seat <= 300; seat++) { bySeat.add(modShard("show-7/S" + seat, 4)); byShow.add(modShard("show-7", 4)); }
        System.out.println("shards touched by one 300-seat show: key=seat -> " + bySeat.size() + ", key=show -> " + byShow.size());
    }
}
