import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.SQLException;
import java.util.*;

// Day 12 main lab (Java side of the SQL day): versioned migrations with checksums, the way Flyway-style tools
// refuse an edited migration, and translating PostgreSQL constraint errors (SQLSTATE) into API responses.
// The SQL itself runs against PostgreSQL in booking/sql/day12-constraints.sql (see the run steps).
public class MigrationLab {
    record Migration(int version, String description, String sql) {}
    record Applied(int version, String checksum) {}

    static String checksum(String sql) throws Exception {
        byte[] d = MessageDigest.getInstance("SHA-256").digest(sql.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(d, 0, 4);
    }

    // Applies pending migrations in version order; refuses gaps, out-of-order files and edited history.
    static List<String> migrate(List<Migration> files, List<Applied> history) throws Exception {
        List<String> log = new ArrayList<>();
        Map<Integer, String> applied = new HashMap<>();
        for (Applied a : history) applied.put(a.version(), a.checksum());
        List<Migration> sorted = files.stream().sorted(Comparator.comparingInt(Migration::version)).toList();
        int latest = history.stream().mapToInt(Applied::version).max().orElse(0);
        for (Migration m : sorted) {
            String sum = checksum(m.sql());
            if (applied.containsKey(m.version())) {
                if (!applied.get(m.version()).equals(sum)) throw new IllegalStateException("V" + m.version() + " was edited after it ran (checksum " + applied.get(m.version()) + " -> " + sum + ")");
                continue;
            }
            if (m.version() < latest) throw new IllegalStateException("V" + m.version() + " is older than applied V" + latest + "; add a new version instead");
            history.add(new Applied(m.version(), sum)); applied.put(m.version(), sum); latest = m.version();
            log.add("applied V" + m.version() + " " + m.description());
        }
        return log;
    }

    // PostgreSQL SQLSTATE classes: 23505 unique_violation, 23503 foreign_key_violation, 23514 check_violation, 23502 not_null_violation.
    static String toHttp(SQLException e) {
        return switch (e.getSQLState()) {
            case "23505" -> "409 Conflict (" + e.getMessage() + ")";
            case "23503", "23514", "23502" -> "422 Unprocessable (" + e.getMessage() + ")";
            default -> "500 Internal error";
        };
    }

    public static void main(String[] args) throws Exception {
        List<Migration> files = new ArrayList<>(List.of(
            new Migration(1, "create seat and booking", "CREATE TABLE seat (...); CREATE TABLE booking (...);"),
            new Migration(2, "partial unique index on active bookings", "CREATE UNIQUE INDEX one_active_booking_per_seat ON booking (seat_id) WHERE status IN ('HELD','CONFIRMED');")));
        List<Applied> history = new ArrayList<>();
        System.out.println(migrate(files, history));
        System.out.println("rerun is a no-op: " + migrate(files, history));

        files.add(new Migration(3, "expand: add nullable booked_at", "ALTER TABLE booking ADD COLUMN booked_at timestamptz;"));
        System.out.println(migrate(files, history));

        files.set(1, new Migration(2, "partial unique index on active bookings", "CREATE UNIQUE INDEX one_active_booking_per_seat ON booking (seat_id);"));
        try { migrate(files, history); } catch (IllegalStateException e) { System.out.println("refused: " + e.getMessage().replaceAll("checksum \\w+ -> \\w+", "checksum changed")); }

        System.out.println(toHttp(new SQLException("one_active_booking_per_seat", "23505")));
        System.out.println(toHttp(new SQLException("booking_seat_id_fkey", "23503")));
        System.out.println(toHttp(new SQLException("booking_status_check", "23514")));
    }
}
