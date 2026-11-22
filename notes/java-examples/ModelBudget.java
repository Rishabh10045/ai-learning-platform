import java.util.*;

// Compares two model options on the SAME fixtures: grounded answers, correct fallbacks, latency and cost.
// Numbers are fixtures for the exercise, not real vendor prices.
public class ModelBudget {
    record Option(String name, double inputPer1k, double outputPer1k, int contextTokens) {}
    record Run(String caseId, boolean answerable, boolean evidenceSupplied, String outcome, long millis, int inTok, int outTok) {}

    static void report(Option o, List<Run> runs, int promptTokensNeeded) {
        int answerable = 0, grounded = 0, unanswerable = 0, abstained = 0;
        List<Long> ms = new ArrayList<>();
        double cost = 0;
        for (Run r : runs) {
            if (r.answerable()) { answerable++; if (r.outcome().equals("supported")) grounded++; }
            else { unanswerable++; if (r.outcome().equals("fallback")) abstained++; }
            ms.add(r.millis());
            cost += r.inTok() / 1000.0 * o.inputPer1k() + r.outTok() / 1000.0 * o.outputPer1k();
        }
        Collections.sort(ms);
        long p95 = ms.get((int) Math.ceil(0.95 * ms.size()) - 1);
        System.out.printf("%-6s grounded %d/%d  abstained %d/%d  p95 %d ms  cost/100 calls %.2f  fits prompt (%d tok): %s%n",
            o.name(), grounded, answerable, abstained, unanswerable, p95, cost / runs.size() * 100, promptTokensNeeded,
            promptTokensNeeded <= o.contextTokens() ? "yes" : "NO");
    }

    public static void main(String[] args) {
        Option small = new Option("small", 0.10, 0.40, 8_000);
        Option large = new Option("large", 1.00, 4.00, 128_000);
        List<Run> smallRuns = List.of(
            new Run("refund", true, true, "supported", 380, 900, 60),
            new Run("hold", true, true, "supported", 410, 850, 55),
            new Run("seat-map", true, false, "unsupported", 400, 600, 70),
            new Run("parking", false, false, "fallback", 300, 500, 20));
        List<Run> largeRuns = List.of(
            new Run("refund", true, true, "supported", 1200, 900, 80),
            new Run("hold", true, true, "supported", 1350, 850, 75),
            new Run("seat-map", true, false, "unsupported", 1300, 600, 90),
            new Run("parking", false, false, "fallback", 900, 500, 25));
        report(small, smallRuns, 2_400);
        report(large, largeRuns, 2_400);
        System.out.println("Both fail 'seat-map' because its passage was never retrieved: fix retrieval before paying for the larger model.");
    }
}
