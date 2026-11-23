// lab-runner: PostgreSQL + JDBC. Run with: node checks/sql-fixtures.mjs (or see the lesson's run steps).
import java.sql.*;
import java.util.concurrent.*;

// Day 14 main lab: two JDBC connections race for the same seat in PostgreSQL, 100 rounds each way.
// Broken: SELECT owner, then an unconditional UPDATE -> both report success and the first owner is overwritten.
// Fixed:  UPDATE ... WHERE owner IS NULL and check the row count -> exactly one winner every round.
// A barrier forces both connections to read before either writes, so the broken version fails every round.
public class ConditionalUpdateRace {
    static String url;

    static void reset(Connection c) throws SQLException { try (Statement s = c.createStatement()) { s.execute("UPDATE seat SET owner = NULL WHERE id = 'A1'"); } }
    static String owner(Connection c) throws SQLException {
        try (Statement s = c.createStatement(); ResultSet r = s.executeQuery("SELECT owner FROM seat WHERE id = 'A1'")) { r.next(); return r.getString(1); }
    }

    // Read-then-write: the decision uses a value that can be out of date by the time the UPDATE runs.
    static boolean checkThenAct(Connection c, String user, CyclicBarrier bothRead) throws Exception {
        boolean free = owner(c) == null;
        bothRead.await(5, TimeUnit.SECONDS);
        if (!free) return false;
        try (PreparedStatement u = c.prepareStatement("UPDATE seat SET owner = ? WHERE id = 'A1'")) { u.setString(1, user); return u.executeUpdate() == 1; }
    }
    // Conditional write: the check and the change are one statement. If the other UPDATE has not committed yet,
    // this one waits for its row lock and then re-checks owner IS NULL on the committed row; either way it changes 0 rows.
    static boolean conditional(Connection c, String user, CyclicBarrier bothRead) throws Exception {
        owner(c);
        bothRead.await(5, TimeUnit.SECONDS);
        try (PreparedStatement u = c.prepareStatement("UPDATE seat SET owner = ? WHERE id = 'A1' AND owner IS NULL")) { u.setString(1, user); return u.executeUpdate() == 1; }
    }

    interface Claim { boolean run(Connection c, String user, CyclicBarrier b) throws Exception; }

    static void race(String label, Claim claim, Connection c1, Connection c2, ExecutorService pool) throws Exception {
        int rounds = 100, oneWinner = 0, bothWon = 0, ownerMatches = 0;
        for (int i = 0; i < rounds; i++) {
            reset(c1);
            CyclicBarrier barrier = new CyclicBarrier(2);
            Future<Boolean> f1 = pool.submit(() -> claim.run(c1, "U1", barrier));
            Future<Boolean> f2 = pool.submit(() -> claim.run(c2, "U2", barrier));
            boolean w1 = f1.get(), w2 = f2.get();
            String stored = owner(c1);
            if (w1 && w2) bothWon++;
            if (w1 ^ w2) { oneWinner++; if (stored.equals(w1 ? "U1" : "U2")) ownerMatches++; }
        }
        System.out.println(label + ": rounds=" + rounds + " oneWinner=" + oneWinner + " bothReportedSuccess=" + bothWon + " storedOwnerIsTheWinner=" + ownerMatches);
    }

    public static void main(String[] args) throws Exception {
        url = System.getenv().getOrDefault("BOOKING_DB_URL", "jdbc:postgresql://localhost:5432/booking?user=postgres");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try (Connection c1 = DriverManager.getConnection(url); Connection c2 = DriverManager.getConnection(url); Statement ddl = c1.createStatement()) {
            ddl.execute("DROP TABLE IF EXISTS seat");
            ddl.execute("CREATE TABLE seat (id text PRIMARY KEY, owner text)");
            ddl.execute("INSERT INTO seat VALUES ('A1', NULL)");
            race("check-then-act", ConditionalUpdateRace::checkThenAct, c1, c2, pool);
            race("conditional UPDATE", ConditionalUpdateRace::conditional, c1, c2, pool);
        } finally { pool.shutdown(); }
    }
}
