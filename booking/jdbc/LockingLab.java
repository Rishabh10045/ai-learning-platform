// lab-runner: PostgreSQL + JDBC. Run with: node checks/sql-fixtures.mjs (or see the lesson's run steps).
import java.sql.*;

// Day 15 main lab: pessimistic vs optimistic locking in PostgreSQL with two real connections.
// Pessimistic: SELECT ... FOR UPDATE holds the row lock until commit; the other connection waits or fails fast.
// Optimistic: no lock while the user thinks; UPDATE ... WHERE version = ? detects a concurrent change (0 rows).
public class LockingLab {
    public static void main(String[] args) throws Exception {
        String url = System.getenv().getOrDefault("BOOKING_DB_URL", "jdbc:postgresql://localhost:5432/booking?user=postgres");
        try (Connection a = DriverManager.getConnection(url); Connection b = DriverManager.getConnection(url); Statement ddl = a.createStatement()) {
            ddl.execute("DROP TABLE IF EXISTS seat");
            ddl.execute("CREATE TABLE seat (id text PRIMARY KEY, owner text, version int NOT NULL DEFAULT 0)");
            ddl.execute("INSERT INTO seat(id) VALUES ('A1'), ('A2')");

            // --- Pessimistic ---
            a.setAutoCommit(false);
            try (Statement s = a.createStatement(); ResultSet r = s.executeQuery("SELECT owner FROM seat WHERE id = 'A1' FOR UPDATE")) {
                r.next(); System.out.println("A locks A1 FOR UPDATE, sees owner=" + r.getString(1));
            }
            b.setAutoCommit(false);
            try (Statement s = b.createStatement()) {
                s.execute("SET LOCAL lock_timeout = '300ms'");
                s.executeQuery("SELECT owner FROM seat WHERE id = 'A1' FOR UPDATE");
                System.out.println("B got the lock (unexpected)");
            } catch (SQLException e) {
                System.out.println("B waits 300 ms then fails: SQLSTATE " + e.getSQLState() + " (lock_not_available)");
                b.rollback();
            }
            try (Statement s = b.createStatement()) {
                s.executeQuery("SELECT owner FROM seat WHERE id = 'A1' FOR UPDATE NOWAIT");
            } catch (SQLException e) {
                System.out.println("B with NOWAIT fails at once: SQLSTATE " + e.getSQLState());
                b.rollback();
            }
            try (Statement s = a.createStatement()) { s.executeUpdate("UPDATE seat SET owner = 'U1' WHERE id = 'A1'"); }
            a.commit();
            try (Statement s = b.createStatement(); ResultSet r = s.executeQuery("SELECT owner FROM seat WHERE id = 'A1' FOR UPDATE")) {
                r.next(); System.out.println("after A commits, B locks A1 and sees owner=" + r.getString(1) + " -> B returns 409");
            }
            b.commit();
            a.setAutoCommit(true); b.setAutoCommit(true);

            // --- Optimistic ---
            int va = readVersion(a, "A2"), vb = readVersion(b, "A2");
            System.out.println("A and B both read A2 at version " + va + " and " + vb + " (no locks held)");
            System.out.println("A: UPDATE ... WHERE version = " + va + " -> rows=" + claim(a, "A2", "U1", va));
            System.out.println("B: UPDATE ... WHERE version = " + vb + " -> rows=" + claim(b, "A2", "U2", vb) + " -> conflict, B re-reads");
            int fresh = readVersion(b, "A2");
            try (Statement s = b.createStatement(); ResultSet r = s.executeQuery("SELECT owner FROM seat WHERE id = 'A2'")) {
                r.next(); System.out.println("B re-reads: version=" + fresh + " owner=" + r.getString(1) + " -> B returns 409 without retrying the claim");
            }
        }
    }
    static int readVersion(Connection c, String seat) throws SQLException {
        try (PreparedStatement p = c.prepareStatement("SELECT version FROM seat WHERE id = ?")) { p.setString(1, seat); try (ResultSet r = p.executeQuery()) { r.next(); return r.getInt(1); } }
    }
    static int claim(Connection c, String seat, String user, int expectedVersion) throws SQLException {
        try (PreparedStatement p = c.prepareStatement("UPDATE seat SET owner = ?, version = version + 1 WHERE id = ? AND version = ? AND owner IS NULL")) {
            p.setString(1, user); p.setString(2, seat); p.setInt(3, expectedVersion); return p.executeUpdate();
        }
    }
}
