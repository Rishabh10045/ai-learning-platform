// lab-runner: PostgreSQL + JDBC. Run with: node checks/sql-fixtures.mjs (or see the lesson's run steps).
import java.io.*;
import java.sql.*;
import java.util.*;

// Day 17 main lab: two separate JVM processes (two "application instances") book the same 100 seats in one
// PostgreSQL database. A lock inside one JVM cannot see the other JVM; only the database can decide.
// PostgreSQL advisory locks are used as a start gate so both processes really overlap.
public class TwoJvmRace {
    static final int SEATS = 100;

    public static void main(String[] args) throws Exception {
        String url = System.getenv().getOrDefault("BOOKING_DB_URL", "jdbc:postgresql://localhost:5432/booking?user=postgres");
        if (args.length == 2) { child(url, args[0], args[1]); return; }
        try (Connection c = DriverManager.getConnection(url); Statement s = c.createStatement()) {
            for (String mode : new String[] {"check-then-act", "conditional"}) {
                s.execute("DROP TABLE IF EXISTS seat, ready");
                s.execute("CREATE TABLE seat (id text PRIMARY KEY, owner text)");
                s.execute("CREATE TABLE ready (pid bigint)");
                s.execute("INSERT INTO seat SELECT 'S' || g, NULL FROM generate_series(1, " + SEATS + ") g");
                s.execute("SELECT pg_advisory_lock(1), pg_advisory_lock(2)");          // hold both gates closed
                Process p1 = start(mode, "U1"), p2 = start(mode, "U2");
                waitForRows(s, "SELECT count(*) FROM ready", 2);                       // both JVMs connected
                s.execute("SELECT pg_advisory_unlock(1)");                             // gate 1: read phase
                waitForRows(s, "SELECT count(*) FROM ready", 4);                       // both finished reading
                s.execute("SELECT pg_advisory_unlock(2)");                             // gate 2: write phase
                List<String> out1 = read(p1), out2 = read(p2);
                Set<String> won1 = new HashSet<>(Arrays.asList(out1.get(1).split(" "))), won2 = new HashSet<>(Arrays.asList(out2.get(1).split(" ")));
                won1.remove(""); won2.remove("");
                Set<String> both = new HashSet<>(won1); both.retainAll(won2);
                int ownersMatching = 0;
                try (ResultSet r = s.executeQuery("SELECT id, owner FROM seat")) {
                    while (r.next()) if ((won1.contains(r.getString(1)) && "U1".equals(r.getString(2)) && !won2.contains(r.getString(1)))
                                      || (won2.contains(r.getString(1)) && "U2".equals(r.getString(2)) && !won1.contains(r.getString(1)))) ownersMatching++;
                }
                if (mode.equals("check-then-act")) System.out.println("two JVMs, different PIDs: " + !out1.get(0).equals(out2.get(0)));
                System.out.println(mode + ": successes reported=" + (won1.size() + won2.size()) + " for " + SEATS + " seats, seats both JVMs were told they won=" + both.size()
                    + ", seats whose stored owner is its only winner=" + ownersMatching);
            }
        }
    }

    static void child(String url, String mode, String user) throws Exception {
        try (Connection c = DriverManager.getConnection(url); Statement s = c.createStatement()) {
            s.execute("INSERT INTO ready VALUES (pg_backend_pid())");
            s.execute("SELECT pg_advisory_lock_shared(1)");                            // blocks until the parent opens gate 1
            List<String> seenFree = new ArrayList<>();
            try (ResultSet r = s.executeQuery("SELECT id FROM seat WHERE owner IS NULL ORDER BY id")) { while (r.next()) seenFree.add(r.getString(1)); }
            s.execute("INSERT INTO ready VALUES (pg_backend_pid())");
            s.execute("SELECT pg_advisory_lock_shared(2)");                            // blocks until gate 2
            List<String> won = new ArrayList<>();
            String sql = mode.equals("conditional") ? "UPDATE seat SET owner = ? WHERE id = ? AND owner IS NULL" : "UPDATE seat SET owner = ? WHERE id = ?";
            try (PreparedStatement u = c.prepareStatement(sql)) {
                for (String seat : seenFree) {
                    synchronized (TwoJvmRace.class) {          // a JVM-local lock: it only excludes threads in THIS process
                        u.setString(1, user); u.setString(2, seat);
                        if (u.executeUpdate() == 1) won.add(seat);
                    }
                }
            }
            System.out.println(ProcessHandle.current().pid());
            System.out.println(String.join(" ", won));
        }
    }

    static Process start(String mode, String user) throws IOException {
        ProcessHandle.Info info = ProcessHandle.current().info();
        List<String> cmd = new ArrayList<>();
        cmd.add(info.command().orElse(System.getProperty("java.home") + "/bin/java"));
        cmd.addAll(Arrays.asList(info.arguments().orElseThrow(() -> new IllegalStateException("cannot read this JVM's arguments"))));
        cmd.add(mode); cmd.add(user);
        return new ProcessBuilder(cmd).redirectError(ProcessBuilder.Redirect.INHERIT).start();
    }
    static List<String> read(Process p) throws Exception {
        List<String> lines = new BufferedReader(new InputStreamReader(p.getInputStream())).lines().toList();
        if (p.waitFor() != 0 || lines.size() < 2) throw new IllegalStateException("child failed: " + lines);
        return lines;
    }
    static void waitForRows(Statement s, String sql, int n) throws Exception {
        for (int i = 0; i < 300; i++) { try (ResultSet r = s.executeQuery(sql)) { r.next(); if (r.getInt(1) >= n) return; } Thread.sleep(50); }
        throw new IllegalStateException("children did not reach " + n + " ready rows");
    }
}
