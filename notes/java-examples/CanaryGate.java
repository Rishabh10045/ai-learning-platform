import java.util.*;

public class CanaryGate {
    // Metrics for one 10-minute window, for the stable fleet (baseline) and the new version (canary).
    record Window(String name, long attempts, long bad, int p95Millis) {
        double badRate() { return attempts == 0 ? 0 : (double) bad / attempts; }
    }

    // Promotion rule, decided before the release: enough traffic, bad rate not worse than baseline by more than
    // 0.5 percentage points, and p95 within 20% of baseline. Anything else rolls back automatically.
    static String decide(Window baseline, Window canary) {
        if (canary.attempts() < 500) return "WAIT (only " + canary.attempts() + " canary attempts, need 500)";
        double extra = canary.badRate() - baseline.badRate();
        if (extra > 0.005) return String.format("ROLLBACK (bad rate %.2f%% vs %.2f%%)", 100 * canary.badRate(), 100 * baseline.badRate());
        if (canary.p95Millis() > baseline.p95Millis() * 1.2) return "ROLLBACK (p95 " + canary.p95Millis() + " ms vs " + baseline.p95Millis() + " ms)";
        return "PROMOTE to the next traffic step";
    }

    public static void main(String[] args) {
        Window baseline = new Window("v41", 19_000, 38, 240);
        List<Window> canaries = List.of(
                new Window("v42 at 5% for 2 min", 210, 0, 230),
                new Window("v42 at 5% for 10 min", 1_000, 3, 250),
                new Window("v43 at 5% for 10 min", 1_000, 14, 245),
                new Window("v44 at 5% for 10 min", 1_000, 2, 410));
        for (Window c : canaries) System.out.println(c.name() + ": " + decide(baseline, c));
    }
}
