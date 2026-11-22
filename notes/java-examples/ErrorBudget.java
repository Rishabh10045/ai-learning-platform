import java.util.*;

public class ErrorBudget {
    // One booking attempt as seen by the load balancer / service logs.
    record Attempt(int status, int millis) {}

    // SLI definition, written down before looking at data:
    //   eligible  = every booking attempt except client errors the user caused (400, 401, 403) and legitimate 409 conflicts
    //   good      = eligible AND status 2xx AND answered within 1000 ms
    static boolean eligible(Attempt a) { return !(a.status() == 400 || a.status() == 401 || a.status() == 403 || a.status() == 409); }
    static boolean good(Attempt a) { return a.status() >= 200 && a.status() < 300 && a.millis() <= 1000; }

    public static void main(String[] args) {
        List<Attempt> log = new ArrayList<>();
        for (int i = 0; i < 960; i++) log.add(new Attempt(201, 180));     // fast successful bookings
        for (int i = 0; i < 25; i++) log.add(new Attempt(409, 90));       // seat already taken: correct behaviour
        for (int i = 0; i < 6; i++) log.add(new Attempt(503, 30));        // database timeouts surfaced as 503
        for (int i = 0; i < 4; i++) log.add(new Attempt(201, 2400));      // succeeded, but too slow to count as good
        for (int i = 0; i < 5; i++) log.add(new Attempt(401, 10));        // expired tokens: the client's problem

        long eligibleCount = log.stream().filter(ErrorBudget::eligible).count();
        long goodCount = log.stream().filter(a -> eligible(a) && good(a)).count();
        double sli = 100.0 * goodCount / eligibleCount;
        System.out.printf("SLI = %d good / %d eligible = %.2f%%%n", goodCount, eligibleCount, sli);

        double slo = 99.0;                                     // target over a 28-day window
        double allowedBadFraction = (100 - slo) / 100;          // 1% of eligible attempts may be bad
        long bad = eligibleCount - goodCount;
        double budgetUsed = bad / (allowedBadFraction * eligibleCount);
        System.out.printf("SLO %.1f%%: error budget allows %.1f bad of %d, used %d = %.0f%% of the budget%n",
                slo, allowedBadFraction * eligibleCount, eligibleCount, bad, 100 * budgetUsed);

        // Burn rate = observed bad fraction / allowed bad fraction. 1.0 spends the budget exactly over the window.
        double burn = ((double) bad / eligibleCount) / allowedBadFraction;
        System.out.printf("burn rate %.2f -> %s%n", burn, burn >= 14.4 ? "page now" : burn >= 1 ? "budget will run out early: ticket" : "within budget");
    }
}
