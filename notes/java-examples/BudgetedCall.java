import java.util.*;

public class BudgetedCall {
    // A scripted model provider so the trace is repeatable: each attempt has a latency and a status.
    record Attempt(int latencyMs, int status) {}

    static final int DEADLINE_MS = 2000;        // the whole help request must answer within 2 s
    static final int PER_ATTEMPT_TIMEOUT_MS = 800;
    static final int MAX_ATTEMPTS = 3;
    static final Set<Integer> RETRYABLE = Set.of(429, 503);   // transient; 400 or 401 will not get better

    static String call(List<Attempt> script) {
        int elapsed = 0, backoff = 200;
        for (int i = 0; i < MAX_ATTEMPTS && i < script.size(); i++) {
            int remaining = DEADLINE_MS - elapsed;
            int timeout = Math.min(PER_ATTEMPT_TIMEOUT_MS, remaining);   // never wait past the overall deadline
            if (timeout < 100) break;                                     // not worth starting another attempt
            Attempt a = script.get(i);
            if (a.latencyMs() > timeout) {
                elapsed += timeout;
                System.out.println("  attempt " + (i + 1) + ": timeout after " + timeout + " ms (elapsed " + elapsed + ")");
            } else {
                elapsed += a.latencyMs();
                System.out.println("  attempt " + (i + 1) + ": status " + a.status() + " after " + a.latencyMs() + " ms (elapsed " + elapsed + ")");
                if (a.status() == 200) return "answer in " + elapsed + " ms";
                if (!RETRYABLE.contains(a.status())) return "fallback (status " + a.status() + " is not retryable) in " + elapsed + " ms";
            }
            if (DEADLINE_MS - (elapsed + backoff) < 100)                  // no time left for a useful retry
                return "fallback (deadline) in " + elapsed + " ms";
            elapsed += backoff;                                           // real code adds random jitter here
            backoff *= 2;
        }
        return "fallback (attempts used up) in " + elapsed + " ms";
    }

    // Example prices only: check your provider's current price list.
    static double costUsd(int inputTokens, int outputTokens, double inPerMillion, double outPerMillion) {
        return inputTokens / 1_000_000.0 * inPerMillion + outputTokens / 1_000_000.0 * outPerMillion;
    }

    public static void main(String[] args) {
        Map<String, List<Attempt>> cases = new LinkedHashMap<>();
        cases.put("fast success", List.of(new Attempt(350, 200)));
        cases.put("503 then success", List.of(new Attempt(120, 503), new Attempt(400, 200)));
        cases.put("two timeouts", List.of(new Attempt(5000, 200), new Attempt(5000, 200), new Attempt(300, 200)));
        cases.put("bad request", List.of(new Attempt(90, 400), new Attempt(90, 200)));
        for (var e : cases.entrySet()) {
            System.out.println(e.getKey() + ":");
            System.out.println("  -> " + call(e.getValue()));
        }
        System.out.printf("cost of 1 call (3000 in, 400 out at $0.50/$1.50 per 1M): $%.6f%n", costUsd(3000, 400, 0.50, 1.50));
        System.out.printf("same call x 20000 per day: $%.2f%n", 20000 * costUsd(3000, 400, 0.50, 1.50));
    }
}
