import java.util.*;
import java.util.function.*;

public class QueryCount {
    // A stand-in for one result row. Spring's RowMapper<T> has the same job: (ResultSet rs, int rowNum) -> T.
    record Row(Map<String, Object> columns) {
        String getString(String c) { return (String) columns.get(c); }
        long getLong(String c) { return ((Number) columns.get(c)).longValue(); }
    }
    interface RowMapper<T> { T mapRow(Row rs, int rowNum); }

    record Booking(long id, String seat, String userId) {}
    record User(String id, String name) {}
    record BookingView(String seat, String userName) {}

    // A tiny fake database that counts every query, like a datasource proxy or Hibernate statistics in a test.
    static final class Db {
        int queries = 0;
        final List<Row> bookings = List.of(
                row("id", 1L, "seat", "A1", "user_id", "u1"), row("id", 2L, "seat", "A2", "user_id", "u2"),
                row("id", 3L, "seat", "A3", "user_id", "u1"), row("id", 4L, "seat", "A4", "user_id", "u3"));
        final Map<String, String> users = Map.of("u1", "Asha", "u2", "Ben", "u3", "Chen");

        <T> List<T> query(String sql, RowMapper<T> mapper, Predicate<Row> where) {
            queries++;
            List<T> out = new ArrayList<>();
            int n = 0;
            for (Row r : bookings) if (where.test(r)) out.add(mapper.mapRow(r, n++));
            return out;
        }
        String userName(String id) { queries++; return users.get(id); }   // SELECT name FROM users WHERE id = ?
        List<BookingView> joined() {                                       // SELECT b.seat, u.name FROM bookings b JOIN users u ...
            queries++;
            List<BookingView> out = new ArrayList<>();
            for (Row r : bookings) out.add(new BookingView(r.getString("seat"), users.get(r.getString("user_id"))));
            return out;
        }
        static Row row(Object... kv) {
            Map<String, Object> m = new LinkedHashMap<>();
            for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
            return new Row(m);
        }
    }

    static final RowMapper<Booking> BOOKING = (rs, rowNum) ->
            new Booking(rs.getLong("id"), rs.getString("seat"), rs.getString("user_id"));

    public static void main(String[] args) {
        Db db = new Db();
        List<Booking> forU1 = db.query("SELECT id, seat, user_id FROM bookings WHERE user_id = ?", BOOKING,
                r -> r.getString("user_id").equals("u1"));
        System.out.println("bookings for u1: " + forU1);

        db.queries = 0;
        List<BookingView> nPlusOne = new ArrayList<>();
        for (Booking b : db.query("SELECT id, seat, user_id FROM bookings", BOOKING, r -> true))
            nPlusOne.add(new BookingView(b.seat(), db.userName(b.userId())));   // one extra query per row
        System.out.println("N+1 version: " + db.queries + " queries");

        db.queries = 0;
        List<BookingView> joined = db.joined();
        System.out.println("JOIN version: " + db.queries + " query, same result: " + joined.equals(nPlusOne));
    }
}
