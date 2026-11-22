import java.util.*;

public class OutputGuard {
    // What the model returned for a help question, already parsed from structured (JSON) output.
    record Answer(String text, List<String> citations) {}

    static final int MAX_CHARS = 300;

    // Model output is untrusted: check it against what the application actually supplied, then encode it for HTML.
    static String check(Answer a, Set<String> retrievedIds) {
        if (a.text().length() > MAX_CHARS) return "REJECT too long (" + a.text().length() + " chars)";
        if (a.citations().isEmpty()) return "REJECT no citation";
        for (String c : a.citations())
            if (!retrievedIds.contains(c)) return "REJECT cites " + c + ", which was not retrieved";
        if (a.text().toLowerCase().contains("http")) return "REJECT contains a link";      // no model-written links
        return "SHOW " + escapeHtml(a.text());
    }

    static String escapeHtml(String s) {
        StringBuilder out = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                case '&' -> out.append("&amp;");
                case '"' -> out.append("&quot;");
                case '\'' -> out.append("&#x27;");
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    public static void main(String[] args) {
        Set<String> retrieved = Set.of("POL-7");   // the only document retrieval returned for this question
        List<Answer> answers = List.of(
            new Answer("Refunds are allowed up to 24h before the show.", List.of("POL-7")),
            new Answer("Refunds are always allowed.", List.of("POL-9")),
            new Answer("See <img src=x onerror=alert(1)> for details.", List.of("POL-7")),
            new Answer("Claim your refund at http://refund.example", List.of("POL-7")),
            new Answer("Refunds are allowed.", List.of()));
        for (Answer a : answers) System.out.println(check(a, retrieved));
    }
}
