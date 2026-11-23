import java.util.*;

// Day 16 main lab: a plain-Java MODEL of a JPA persistence context (no Hibernate jar): identity map,
// dirty checking at flush, the N+1 query pattern vs one join, and @Version optimistic checks.
// Every "SQL" line is counted so the cost is visible. The real SQL runs in booking/sql/day16-jpa-sql.sql.
public class PersistenceContextLab {
    static final class Row { String status; int version; final String seat; Row(String seat, String status) { this.seat = seat; this.status = status; } }
    static final class Database {
        final Map<Long, Row> bookings = new TreeMap<>(); final Map<String, String> seatRow = new HashMap<>();
        int queries = 0; final List<String> log = new ArrayList<>();
        void sql(String s) { queries++; log.add(s); }
    }
    static final class Booking { final long id; String status; final int loadedVersion; final String seatId;
        Booking(long id, String status, int v, String seatId) { this.id = id; this.status = status; this.loadedVersion = v; this.seatId = seatId; } }

    // One persistence context = one unit of work. find() returns the SAME object for the same id.
    static final class EntityManager {
        final Database db; final Map<Long, Booking> identity = new LinkedHashMap<>(); final Map<Long, String> snapshot = new HashMap<>();
        EntityManager(Database db) { this.db = db; }
        Booking find(long id) {
            Booking b = identity.get(id);
            if (b != null) return b;                                    // first-level cache hit: no SQL
            db.sql("select * from booking where id=" + id);
            Row r = db.bookings.get(id);
            b = new Booking(id, r.status, r.version, r.seat); identity.put(id, b); snapshot.put(id, r.status);
            return b;
        }
        String seatOf(Booking b) { db.sql("select * from seat where id='" + b.seatId + "'"); return db.seatRow.get(b.seatId); }
        // flush(): compare each managed entity with its snapshot and emit one versioned UPDATE per dirty entity.
        void flush() {
            for (Booking b : identity.values()) {
                if (b.status.equals(snapshot.get(b.id))) continue;
                db.sql("update booking set status='" + b.status + "', version=" + (b.loadedVersion + 1) + " where id=" + b.id + " and version=" + b.loadedVersion);
                Row r = db.bookings.get(b.id);
                if (r.version != b.loadedVersion) throw new IllegalStateException("OptimisticLockException: booking " + b.id + " changed (version " + r.version + ", loaded " + b.loadedVersion + ")");
                r.status = b.status; r.version++; snapshot.put(b.id, b.status);
            }
        }
    }

    public static void main(String[] args) {
        Database db = new Database();
        for (long i = 1; i <= 5; i++) { db.bookings.put(i, new Row("A" + i, "HELD")); db.seatRow.put("A" + i, "row " + i); }

        EntityManager em = new EntityManager(db);
        Booking a = em.find(1), again = em.find(1);
        System.out.println("same instance in one context: " + (a == again) + ", queries: " + db.queries);
        a.status = "CONFIRMED";                                         // no save() call: dirty checking finds it
        em.flush();
        System.out.println("after flush: " + db.log.get(db.log.size() - 1));
        em.flush();
        System.out.println("second flush with no change adds no SQL: queries=" + db.queries);

        db.queries = 0; EntityManager listView = new EntityManager(db);
        db.sql("select * from booking");                                // 1 query for the list ...
        for (long id : db.bookings.keySet()) { listView.identity.put(id, new Booking(id, db.bookings.get(id).status, db.bookings.get(id).version, db.bookings.get(id).seat)); }
        for (Booking b : listView.identity.values()) listView.seatOf(b);   // ... plus N lazy loads
        System.out.println("N+1 for 5 bookings: " + db.queries + " queries");
        db.queries = 0; db.sql("select b.*, s.* from booking b join seat s on s.id = b.seat_id");
        System.out.println("join fetch for 5 bookings: " + db.queries + " query");

        // Two contexts load booking 2 at version 0; the first flush wins, the second is rejected.
        EntityManager t1 = new EntityManager(db), t2 = new EntityManager(db);
        Booking x1 = t1.find(2), x2 = t2.find(2);
        x1.status = "CONFIRMED"; t1.flush();
        x2.status = "CANCELLED";
        try { t2.flush(); } catch (IllegalStateException e) { System.out.println(e.getMessage()); }
        System.out.println("stored: status=" + db.bookings.get(2L).status + " version=" + db.bookings.get(2L).version);
    }
}
