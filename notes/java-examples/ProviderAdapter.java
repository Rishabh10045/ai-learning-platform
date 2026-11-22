import java.util.*;
import java.util.concurrent.*;

public class ProviderAdapter {
    // The application's contract. Nothing outside the adapter sees the provider's wire format.
    record HelpAnswer(String text, List<String> citations) {}
    sealed interface Outcome permits Answered, Fallback {}
    record Answered(HelpAnswer answer) implements Outcome {}
    record Fallback(String reason) implements Outcome {}

    // Decoded provider responses (what a JSON library would give you). v2 moved the text into "output".
    static Map<String, Object> wireV1(String text, List<String> cites) { return Map.of("choices", List.of(Map.of("message", Map.of("content", text))), "citations", cites); }
    static Map<String, Object> wireV2(String text, List<String> cites) { return Map.of("output", List.of(Map.of("type", "text", "text", text)), "citations", cites); }

    // The only place that knows both wire shapes. Unknown or malformed shapes become a Fallback, never an exception upstream.
    @SuppressWarnings("unchecked")
    static Outcome toContract(Map<String, Object> wire) {
        try {
            String text = null;
            if (wire.get("choices") instanceof List<?> ch && !ch.isEmpty())
                text = (String) ((Map<String, Object>) ((Map<String, Object>) ch.get(0)).get("message")).get("content");
            else if (wire.get("output") instanceof List<?> out && !out.isEmpty())
                text = (String) ((Map<String, Object>) out.get(0)).get("text");
            List<String> cites = (List<String>) wire.getOrDefault("citations", List.of());
            if (text == null || text.isBlank()) return new Fallback("invalid output: no text");
            if (cites.isEmpty()) return new Fallback("invalid output: no citation");
            return new Answered(new HelpAnswer(text.strip(), List.copyOf(cites)));
        } catch (ClassCastException e) {
            return new Fallback("invalid output: unexpected types");
        }
    }

    // Deadline around the remote call: a slow provider turns into a Fallback within the budget.
    static Outcome call(Callable<Map<String, Object>> provider, long budgetMs) {
        CompletableFuture<Map<String, Object>> f = CompletableFuture.supplyAsync(() -> {
            try { return provider.call(); } catch (Exception e) { throw new CompletionException(e); }
        });
        try {
            return toContract(f.orTimeout(budgetMs, TimeUnit.MILLISECONDS).join());
        } catch (CompletionException e) {
            return new Fallback(e.getCause() instanceof TimeoutException ? "timeout after " + budgetMs + " ms" : "provider error: " + e.getCause().getMessage());
        }
    }

    public static void main(String[] args) {
        List<String> cite = List.of("POL-1");
        Map<String, Callable<Map<String, Object>>> cases = new LinkedHashMap<>();
        cases.put("v1 wire format", () -> wireV1(" Refunds up to 24h before the show. ", cite));
        cases.put("v2 wire format", () -> wireV2("Refunds up to 24h before the show.", cite));
        cases.put("no citation", () -> wireV2("Refunds anytime!", List.of()));
        cases.put("unknown shape", () -> Map.of("result", 42));
        cases.put("provider down", () -> { throw new IllegalStateException("503 from provider"); });
        cases.put("slow provider", () -> { Thread.sleep(500); return wireV1("late", cite); });
        cases.forEach((name, provider) -> System.out.println(name + " -> " + call(provider, 200)));
        System.out.println("booking path calls none of this: booking still works during every fallback above");
    }
}
