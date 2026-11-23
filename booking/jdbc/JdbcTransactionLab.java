// lab-runner: PostgreSQL + JDBC. Run with: node checks/sql-fixtures.mjs (or see the lesson's run steps).
import java.sql.*;

// Day 13 main lab: real JDBC against PostgreSQL. Parameter binding, commit vs rollback of a two-statement
// unit of work, and READ COMMITTED vs REPEATABLE READ seen from two connections.
// Needs the PostgreSQL JDBC driver on the classpath and BOOKING_DB_URL (see run steps).
public class JdbcTransactionLab {
    static int count(Connection c, String sql, String... params) throws SQLException {
        try (PreparedStatement s = c.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) s.setString(i + 1, params[i]);
            try (ResultSet r = s.executeQuery()) { r.next(); return r.getInt(1); }
        }
    }
    static String owner(Connection c) throws SQLException {
        try (Statement s = c.createStatement(); ResultSet r = s.executeQuery("SELECT owner FROM seat WHERE id = 'A1'")) { r.next(); return r.getString(1); }
    }

    // One unit of work: insert the booking and the payment, then commit; any failure rolls back both.
    static String book(Connection c, String seat, String user, boolean failAfterFirstInsert) throws SQLException {
        c.setAutoCommit(false);
        try (PreparedStatement booking = c.prepareStatement("INSERT INTO booking(seat_id, user_id) VALUES (?, ?)");
             PreparedStatement payment = c.prepareStatement("INSERT INTO payment(seat_id, amount) VALUES (?, ?)")) {
            booking.setString(1, seat); booking.setString(2, user); booking.executeUpdate();
            if (failAfterFirstInsert) throw new SQLException("payment provider timeout", "08006");
            payment.setString(1, seat); payment.setInt(2, 450); payment.executeUpdate();
            c.commit();
            return "committed";
        } catch (SQLException e) {
            c.rollback();
            return "rolled back (" + e.getMessage() + ")";
        } finally { c.setAutoCommit(true); }
    }

    public static void main(String[] args) throws Exception {
        String url = System.getenv().getOrDefault("BOOKING_DB_URL", "jdbc:postgresql://localhost:5432/booking?user=postgres");
        try (Connection a = DriverManager.getConnection(url); Connection b = DriverManager.getConnection(url); Statement ddl = a.createStatement()) {
            ddl.execute("DROP TABLE IF EXISTS payment, booking, seat");
            ddl.execute("CREATE TABLE seat (id text PRIMARY KEY, owner text)");
            ddl.execute("CREATE TABLE booking (id bigserial PRIMARY KEY, seat_id text NOT NULL, user_id text NOT NULL)");
            ddl.execute("CREATE TABLE payment (id bigserial PRIMARY KEY, seat_id text NOT NULL, amount int NOT NULL CHECK (amount > 0))");
            ddl.execute("INSERT INTO seat VALUES ('A1', NULL)");

            // Binding: the hostile value is stored as plain data; it never becomes SQL.
            String hostile = "U9'); DELETE FROM seat; --";
            System.out.println("book A1 for a hostile user id: " + book(a, "A1", hostile, false));
            System.out.println("seats still present: " + count(a, "SELECT count(*) FROM seat") + ", stored user id equals input: "
                + (count(a, "SELECT count(*) FROM booking WHERE user_id = ?", hostile) == 1));

            System.out.println("book A2, payment fails: " + book(a, "A2", "U2", true));
            System.out.println("rows for A2 after rollback: booking=" + count(a, "SELECT count(*) FROM booking WHERE seat_id = ?", "A2")
                + " payment=" + count(a, "SELECT count(*) FROM payment WHERE seat_id = ?", "A2"));

            // Isolation: A reads twice inside one transaction while B commits a change in between.
            for (int level : new int[] {Connection.TRANSACTION_READ_COMMITTED, Connection.TRANSACTION_REPEATABLE_READ}) {
                try (Statement reset = a.createStatement()) { reset.execute("UPDATE seat SET owner = NULL WHERE id = 'A1'"); }
                a.setAutoCommit(false); a.setTransactionIsolation(level);
                String first = owner(a);
                try (Statement w = b.createStatement()) { w.executeUpdate("UPDATE seat SET owner = 'U7' WHERE id = 'A1'"); }   // B autocommits
                String second = owner(a);
                a.commit(); a.setAutoCommit(true);
                System.out.println((level == Connection.TRANSACTION_READ_COMMITTED ? "READ COMMITTED " : "REPEATABLE READ") + ": first read=" + first + ", second read=" + second);
            }
        }
    }
}
