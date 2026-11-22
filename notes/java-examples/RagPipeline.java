import java.util.*;
import java.util.regex.*;

// Retrieve -> generate -> validate, with each stage observable.
// The generator is a fixture so every outcome is repeatable.
public class RagPipeline {
    record Passage(String id, String venue, int version, boolean current, String text) {}
    record Candidate(String text, List<String> citations) {}
    sealed interface Result permits Answer, Fallback {}
    record Answer(String text, List<String> citations) implements Result {}
    record Fallback(String stage, String reason) implements Result {}

    static final List<Passage> POLICY = List.of(
        new Passage("P2", "hall-a", 3, true,  "Cancel up to 48 hours before the show for a full refund."),
        new Passage("P2-old", "hall-a", 2, false, "Cancel up to 24 hours before the show for a full refund."),
        new Passage("P4", "hall-a", 1, true,  "A seat hold expires after 10 minutes without payment."),
        new Passage("B7", "hall-b", 1, true,  "Cancel up to 2 hours before the show for a full refund.")
    );

    static List<Passage> retrieve(String question, String venue) {
        String q = question.toLowerCase(Locale.ROOT);
        return POLICY.stream()
            .filter(p -> p.venue().equals(venue) && p.current())          // authorized + current only
            .filter(p -> Arrays.stream(q.split("\\W+")).filter(w -> w.length() > 4)
                .anyMatch(w -> p.text().toLowerCase(Locale.ROOT).contains(w.substring(0, 5))))
            .toList();
    }

    // Every number with a unit in the answer must appear in a cited passage.
    static Optional<String> unsupported(Candidate c, List<Passage> context) {
        Map<String, Passage> byId = new HashMap<>();
        context.forEach(p -> byId.put(p.id(), p));
        if (c.citations().isEmpty()) return Optional.of("no citation");
        for (String id : c.citations()) if (!byId.containsKey(id)) return Optional.of("cites " + id + " outside context");
        Matcher m = Pattern.compile("\\d+ (hours|minutes)").matcher(c.text());
        while (m.find()) {
            String claim = m.group();
            boolean found = c.citations().stream().anyMatch(id -> byId.get(id).text().contains(claim));
            if (!found) return Optional.of("claim '" + claim + "' not in cited text");
        }
        return Optional.empty();
    }

    static Result answer(String question, String venue, java.util.function.Function<List<Passage>, Candidate> model) {
        List<Passage> context = retrieve(question, venue);
        if (context.isEmpty()) return new Fallback("retrieval", "no authorized evidence");
        Candidate c = model.apply(context);
        Optional<String> problem = unsupported(c, context);
        if (problem.isPresent()) return new Fallback("validation", problem.get());
        return new Answer(c.text(), c.citations());
    }

    public static void main(String[] args) {
        String q = "Until when can I cancel for a refund?";
        System.out.println("context ids: " + retrieve(q, "hall-a").stream().map(Passage::id).toList());
        System.out.println("supported : " + answer(q, "hall-a", ctx -> new Candidate("You can cancel up to 48 hours before the show.", List.of("P2"))));
        System.out.println("stale 24h : " + answer(q, "hall-a", ctx -> new Candidate("You can cancel up to 24 hours before the show.", List.of("P2"))));
        System.out.println("bad cite  : " + answer(q, "hall-a", ctx -> new Candidate("You can cancel up to 2 hours before.", List.of("B7"))));
        System.out.println("no cite   : " + answer(q, "hall-a", ctx -> new Candidate("You can cancel up to 48 hours before the show.", List.of())));
        System.out.println("no evidence: " + answer("Is parking included with tickets?", "hall-a", ctx -> new Candidate("Yes.", List.of("P2"))));
    }
}
