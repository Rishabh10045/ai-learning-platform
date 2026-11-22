import java.util.*;

// Scores a labelled set and keeps retrieval, grounding and abstention
// as separate measures, each with its own denominator.
public class EvalHarness {
    enum Kind { ANSWERABLE, UNANSWERABLE }
    enum Outcome { SUPPORTED, UNSUPPORTED, FALLBACK }
    record Case(String id, Kind kind, String gold, List<String> retrieved, Outcome outcome) {}

    static String pct(int n, int d) { return d == 0 ? "n/a" : String.format("%d/%d = %.0f%%", n, d, 100.0 * n / d); }

    static void report(String name, List<Case> cases, int k) {
        int answerable = 0, hit = 0, answeredGiven = 0, grounded = 0, falseRefusal = 0;
        int unanswerable = 0, correctAbstain = 0;
        List<String> retrievalMisses = new ArrayList<>(), groundingFailures = new ArrayList<>();
        for (Case c : cases) {
            if (c.kind() == Kind.ANSWERABLE) {
                answerable++;
                boolean inTopK = c.retrieved().stream().limit(k).anyMatch(c.gold()::equals);
                if (inTopK) hit++; else retrievalMisses.add(c.id());
                if (c.outcome() == Outcome.FALLBACK) falseRefusal++;
                else { answeredGiven++; if (c.outcome() == Outcome.SUPPORTED) grounded++; else if (inTopK) groundingFailures.add(c.id()); }
            } else {
                unanswerable++;
                if (c.outcome() == Outcome.FALLBACK) correctAbstain++;
            }
        }
        System.out.println("== " + name);
        System.out.println("  hit@" + k + "               " + pct(hit, answerable));
        System.out.println("  grounded (answered) " + pct(grounded, answeredGiven));
        System.out.println("  false refusals      " + pct(falseRefusal, answerable));
        System.out.println("  correct abstention  " + pct(correctAbstain, unanswerable));
        System.out.println("  retrieval misses " + retrievalMisses + ", grounding failures " + groundingFailures);
    }

    public static void main(String[] args) {
        List<Case> v1 = List.of(
            new Case("refund-48h", Kind.ANSWERABLE, "P2", List.of("P2", "P4"), Outcome.SUPPORTED),
            new Case("hold-expiry", Kind.ANSWERABLE, "P4", List.of("P2", "P9"), Outcome.UNSUPPORTED),
            new Case("refund-exception", Kind.ANSWERABLE, "P2", List.of("P2"), Outcome.UNSUPPORTED),
            new Case("seat-map", Kind.ANSWERABLE, "P5", List.of("P5"), Outcome.SUPPORTED),
            new Case("parking", Kind.UNANSWERABLE, null, List.of("P2"), Outcome.UNSUPPORTED),
            new Case("pets", Kind.UNANSWERABLE, null, List.of(), Outcome.FALLBACK));
        // v2: stricter validator on the same frozen cases.
        List<Case> v2 = List.of(
            new Case("refund-48h", Kind.ANSWERABLE, "P2", List.of("P2", "P4"), Outcome.SUPPORTED),
            new Case("hold-expiry", Kind.ANSWERABLE, "P4", List.of("P2", "P9"), Outcome.FALLBACK),
            new Case("refund-exception", Kind.ANSWERABLE, "P2", List.of("P2"), Outcome.FALLBACK),
            new Case("seat-map", Kind.ANSWERABLE, "P5", List.of("P5"), Outcome.FALLBACK),
            new Case("parking", Kind.UNANSWERABLE, null, List.of("P2"), Outcome.FALLBACK),
            new Case("pets", Kind.UNANSWERABLE, null, List.of(), Outcome.FALLBACK));
        report("v1", v1, 2);
        report("v2 (stricter validator)", v2, 2);
    }
}
