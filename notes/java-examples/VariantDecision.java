import java.util.*;

public class VariantDecision {
    // Results of running each variant on the same fixed 40-question evaluation set.
    record Result(String variant, int correct, int total, int unsupported, int p95Millis, double costPer1kRequests) {
        double accuracy() { return 100.0 * correct / total; }
    }

    // The decision rule is written down BEFORE looking at the numbers.
    static final double MIN_ACCURACY = 90.0;
    static final int MAX_UNSUPPORTED = 0;   // an answer citing a source it was not given fails the feature
    static final int P95_BUDGET_MILLIS = 2500;

    static String verdict(Result r) {
        List<String> reasons = new ArrayList<>();
        if (r.accuracy() < MIN_ACCURACY) reasons.add(String.format("accuracy %.1f%% < %.0f%%", r.accuracy(), MIN_ACCURACY));
        if (r.unsupported() > MAX_UNSUPPORTED) reasons.add(r.unsupported() + " unsupported answers");
        if (r.p95Millis() > P95_BUDGET_MILLIS) reasons.add("p95 " + r.p95Millis() + " ms > " + P95_BUDGET_MILLIS + " ms");
        return reasons.isEmpty() ? "passes" : "fails: " + String.join(", ", reasons);
    }

    public static void main(String[] args) {
        List<Result> results = List.of(
                new Result("prompt only, large model", 31, 40, 4, 1900, 9.00),
                new Result("RAG top-3, small model", 37, 40, 0, 1400, 1.20),
                new Result("RAG top-3, large model", 38, 40, 0, 2300, 9.60),
                new Result("RAG top-10, large model", 38, 40, 0, 3100, 14.10));
        for (Result r : results) {
            System.out.printf("%-26s %5.1f%%  unsupported=%d  p95=%dms  cost=$%.2f/1k  %s%n",
                    r.variant(), r.accuracy(), r.unsupported(), r.p95Millis(), r.costPer1kRequests(), verdict(r));
        }
        // Among passing variants, pick the cheapest. Accuracy ties beyond the bar are not worth 8x the cost.
        Result chosen = results.stream().filter(r -> verdict(r).equals("passes"))
                .min(Comparator.comparingDouble(Result::costPer1kRequests)).orElseThrow();
        System.out.println("chosen: " + chosen.variant());
    }
}
