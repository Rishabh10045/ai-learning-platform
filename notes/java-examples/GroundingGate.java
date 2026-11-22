import java.util.*;
import java.util.regex.*;

public class GroundingGate {
    record Passage(String id, String text) {}

    // Accept an answer only if (0) it does not claim a booking outcome (booking state comes from the booking service,
    // never from the model), (1) it cites at least one passage, (2) every cited ID was supplied for THIS request,
    // (3) every number in the answer appears in a cited passage.
    static String check(String answer, List<Passage> supplied) {
        Map<String, String> byId = new HashMap<>();
        for (Passage p : supplied) byId.put(p.id(), p.text());
        Matcher cite = Pattern.compile("\\[(POL-\\d+)]").matcher(answer);
        List<String> cited = new ArrayList<>();
        while (cite.find()) cited.add(cite.group(1));
        if (answer.toLowerCase().matches(".*\\b(confirmed|booked|reserved for you)\\b.*")) return "REJECT claims a booking outcome";
        if (cited.isEmpty()) return "REJECT no citation";
        for (String id : cited) if (!byId.containsKey(id)) return "REJECT cites " + id + ", which was not supplied";
        String evidence = String.join(" ", cited.stream().map(byId::get).toList());
        Matcher num = Pattern.compile("\\d+").matcher(answer.replaceAll("\\[POL-\\d+]", ""));
        while (num.find()) if (!evidence.contains(num.group())) return "REJECT number " + num.group() + " not in cited text";
        return "ACCEPT";
    }

    public static void main(String[] args) {
        List<Passage> supplied = List.of(new Passage("POL-1", "Refunds are allowed up to 24 hours before the show."),
                new Passage("POL-4", "Wheelchair seats are in row A."));
        Map<String, String> answers = new LinkedHashMap<>();
        answers.put("grounded", "You can get a refund up to 24 hours before the show [POL-1].");
        answers.put("no citation", "Refunds are allowed up to 24 hours before.");
        answers.put("unknown source", "Refunds are allowed up to 48 hours before [POL-9].");
        answers.put("wrong number", "Refunds are allowed up to 48 hours before the show [POL-1].");
        answers.put("booking claim", "Seat A2 is confirmed for you in row A [POL-4].");
        answers.forEach((k, a) -> System.out.println(k + ": " + check(a, supplied)));
    }
}
