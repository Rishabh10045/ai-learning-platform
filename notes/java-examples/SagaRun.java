import java.util.*;

public class SagaRun {
    // An orchestrated saga: each step has an action and a compensation. On a permanent failure, completed steps
    // are compensated in reverse order. Each step commits locally; there is no global rollback.
    record Step(String name, String action, String compensation) {}

    static final List<String> log = new ArrayList<>();
    static final Set<String> compensated = new HashSet<>();   // makes compensation idempotent

    static boolean perform(Step s, Map<String, Integer> transientFailures, Set<String> permanentFailures) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            int left = transientFailures.getOrDefault(s.name(), 0);
            if (permanentFailures.contains(s.name())) { log.add(s.name() + ": permanent failure (card declined)"); return false; }
            if (left > 0) { transientFailures.put(s.name(), left - 1); log.add(s.name() + ": attempt " + attempt + " timed out, retrying"); continue; }
            log.add(s.name() + ": " + s.action());
            return true;
        }
        log.add(s.name() + ": gave up after 3 attempts");
        return false;
    }

    static void compensate(Step s) {
        if (!compensated.add(s.name())) { log.add(s.name() + ": compensation already done, skipped"); return; }
        log.add(s.name() + ": COMPENSATE " + s.compensation());
    }

    static String run(String title, Map<String, Integer> transientFailures, Set<String> permanentFailures) {
        log.clear(); compensated.clear();
        List<Step> steps = List.of(
                new Step("hold", "seat A1 held for 10 min", "release hold on A1"),
                new Step("payment", "card charged Rs 500", "refund Rs 500"),
                new Step("ticket", "ticket T-1 issued", "void ticket T-1"));
        Deque<Step> done = new ArrayDeque<>();
        String outcome = "CONFIRMED";
        for (Step s : steps) {
            if (perform(s, new HashMap<>(transientFailures), permanentFailures)) { done.push(s); continue; }
            outcome = "CANCELLED";
            while (!done.isEmpty()) compensate(done.pop());   // reverse order
            break;
        }
        System.out.println(title);
        log.forEach(l -> System.out.println("  " + l));
        return outcome;
    }

    public static void main(String[] args) {
        System.out.println("  => " + run("1. payment times out once, then succeeds", Map.of("payment", 1), Set.of()));
        System.out.println("  => " + run("2. payment is declined", Map.of(), Set.of("payment")));
        compensate(new Step("hold", "", "release hold on A1"));   // a duplicated compensation message arrives
        System.out.println("  " + log.get(log.size() - 1));
    }
}
