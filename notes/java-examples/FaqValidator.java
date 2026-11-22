import java.util.*;
import java.util.regex.*;

// Validates a parsed model reply in two stages: shape (schema) and meaning (sources + claim support).
// A reply can pass the schema and still be wrong.
public class FaqValidator {
    record Reply(String answer, boolean answerable, List<String> sources) {}
    sealed interface Verdict permits Accept, Reject {}
    record Accept(Reply reply) implements Verdict {}
    record Reject(String category) implements Verdict {}

    static final Map<String, String> SUPPLIED = new TreeMap<>(Map.of(
        "P1", "Cancel up to 48 hours before the show for a full refund.",
        "P2", "Holds expire after 10 minutes."));

    // Stage 1: shape. In a real app Spring AI's .call().entity(Reply.class) or Jackson maps the JSON to the record.
    static Optional<Reply> parse(Map<String, Object> json) {
        if (!(json.get("answer") instanceof String a) || !(json.get("answerable") instanceof Boolean ok)
            || !(json.get("sources") instanceof List<?> s) || !s.stream().allMatch(x -> x instanceof String)) return Optional.empty();
        return Optional.of(new Reply(a, ok, s.stream().map(String.class::cast).toList()));
    }

    // Stage 2: meaning.
    static Verdict validate(Map<String, Object> json) {
        Optional<Reply> r = parse(json);
        if (r.isEmpty()) return new Reject("malformed");
        Reply reply = r.get();
        if (!reply.answerable()) return reply.sources().isEmpty() ? new Accept(reply) : new Reject("fallback with sources");
        if (reply.sources().isEmpty()) return new Reject("no source");
        for (String id : reply.sources()) if (!SUPPLIED.containsKey(id)) return new Reject("unknown source " + id);
        Matcher m = Pattern.compile("\\d+ (hours|minutes)").matcher(reply.answer());
        while (m.find()) {
            String claim = m.group();
            if (reply.sources().stream().noneMatch(id -> SUPPLIED.get(id).contains(claim))) return new Reject("unsupported claim '" + claim + "'");
        }
        return new Accept(reply);
    }

    public static void main(String[] args) {
        Map<String, Map<String, Object>> cases = new LinkedHashMap<>();
        cases.put("supported", Map.of("answer", "You can cancel up to 48 hours before the show.", "answerable", true, "sources", List.of("P1")));
        cases.put("malformed", Map.of("answer", "Yes", "answerable", "true", "sources", List.of("P1")));
        cases.put("unknown P9", Map.of("answer", "You can cancel up to 48 hours before.", "answerable", true, "sources", List.of("P9")));
        cases.put("wrong number", Map.of("answer", "You can cancel up to 24 hours before.", "answerable", true, "sources", List.of("P1")));
        cases.put("honest fallback", Map.of("answer", "", "answerable", false, "sources", List.of()));
        cases.forEach((name, json) -> System.out.printf("%-16s -> %s%n", name, validate(json)));
    }
}
