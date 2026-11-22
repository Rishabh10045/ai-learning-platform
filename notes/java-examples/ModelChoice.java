import java.util.*;

public class ModelChoice {
    // One interface, three adapters. The booking path never depends on any of them.
    interface ModelClient { String name(); Optional<String> answer(String question, List<String> passages, long deadlineMs); }

    // Deterministic fixture: proves parsing, citation checks and the fallback path in CI. Says nothing about quality.
    static final class FixtureClient implements ModelClient {
        public String name() { return "fixture"; }
        public Optional<String> answer(String q, List<String> p, long d) { return Optional.of("Refunds up to 24h before the show [POL-1]"); }
    }

    // Measured characteristics of the real adapters on the same 40-question evaluation set (recorded earlier).
    record Measured(String name, double groundedPct, int p95Ms, boolean dataMayLeaveNetwork) {}

    static String verdict(Measured m, int p95BudgetMs, boolean policyAllowsExternal) {
        List<String> fails = new ArrayList<>();
        if (m.groundedPct() < 90) fails.add("grounded " + m.groundedPct() + "% < 90%");
        if (m.p95Ms() > p95BudgetMs) fails.add("p95 " + m.p95Ms() + " ms > " + p95BudgetMs + " ms");
        if (m.dataMayLeaveNetwork() && !policyAllowsExternal) fails.add("data policy forbids external calls");
        return fails.isEmpty() ? "eligible" : "rejected: " + String.join(", ", fails);
    }

    public static void main(String[] args) {
        ModelClient fixture = new FixtureClient();
        System.out.println(fixture.name() + " -> " + fixture.answer("Can I get a refund?", List.of("[POL-1] Refunds up to 24h before the show."), 2000).orElse("fallback"));

        List<Measured> options = List.of(
                new Measured("local 8B model (Ollama, CPU)", 91.0, 6200, false),
                new Measured("local 8B model (Ollama, GPU)", 91.0, 1700, false),
                new Measured("hosted model", 96.5, 1300, true));
        for (boolean external : new boolean[] {false, true}) {
            System.out.println("policy allows sending policy text to an external provider: " + external);
            for (Measured m : options) System.out.println("  " + m.name() + ": " + verdict(m, 2500, external));
        }
    }
}
