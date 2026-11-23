import java.util.*;

// Day 22 main lab: cache-aside with a TTL, a demonstrated stale read, delete-on-write, the slow-reader race
// that puts the old value back after the delete, and a version check that rejects it.
// Time is a counter we move by hand, so every interleaving below is exact and repeatable.
public class StaleCacheLab {
    record Entry(String value, long version, long expiresAt) {}
    static long now = 0;

    static final class Db { String owner = "free"; long version = 1; int reads = 0;
        String[] read() { reads++; return new String[] {owner, String.valueOf(version)}; }
        void write(String o) { owner = o; version++; } }

    static final class Cache {
        final Map<String, Entry> map = new HashMap<>(); final long ttl; final boolean versionCheck;
        Cache(long ttl, boolean versionCheck) { this.ttl = ttl; this.versionCheck = versionCheck; }
        Entry get(String k) { Entry e = map.get(k); return e != null && now < e.expiresAt() ? e : null; }
        void put(String k, String v, long version) {
            Entry cur = map.get(k);
            if (versionCheck && cur != null && (cur.version() > version || (cur.version() == version && cur.value() != null))) return;   // never older data
            map.put(k, new Entry(v, version, now + ttl));
        }
        // With version checks, invalidation leaves an expired tombstone that remembers the committed version.
        void delete(String k, long committedVersion) { if (versionCheck) map.put(k, new Entry(null, committedVersion, 0)); else map.remove(k); }
    }

    // Cache-aside read: try the cache, on a miss read the database and fill the cache.
    static String read(Cache c, Db db) {
        Entry e = c.get("A1");
        if (e != null) return e.value() + " (cache)";
        String[] row = db.read(); c.put("A1", row[0], Long.parseLong(row[1]));
        return row[0] + " (db)";
    }

    public static void main(String[] args) {
        Db db = new Db(); Cache cache = new Cache(30, false);
        System.out.println("t=0  read: " + read(cache, db));
        db.write("U1");                                                    // booking written, cache NOT invalidated
        now = 10; System.out.println("t=10 read after U1 booked, no invalidation: " + read(cache, db) + " <- stale");
        now = 31; System.out.println("t=31 read after TTL: " + read(cache, db));

        // Delete-on-write fixes the simple case.
        db = new Db(); cache = new Cache(30, false); now = 0;
        read(cache, db); db.write("U1"); cache.delete("A1", db.version);
        System.out.println("delete-on-write, next read: " + read(cache, db));

        // The race: R misses and reads the OLD row, W writes U2 and invalidates, then R (slow) fills the cache with old data.
        for (boolean versionCheck : new boolean[] {false, true}) {
            db = new Db(); db.write("U1"); cache = new Cache(30, versionCheck); now = 0;
            String[] slowRead = db.read();                                  // R: miss, reads owner=U1 v2
            db.write("U2"); cache.delete("A1", db.version);                 // W: commit U2 v3, invalidate
            cache.put("A1", slowRead[0], Long.parseLong(slowRead[1]));      // R finally writes its old value
            now = 5;
            System.out.println((versionCheck ? "with version check: " : "without version check: ") + "next read -> " + read(cache, db) + ", then -> " + read(cache, db) + ", database says " + db.owner);
        }
    }
}
