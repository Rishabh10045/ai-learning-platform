import java.util.*;
import java.util.concurrent.*;

public class InvariantRace {
    interface SeatStore { boolean claim(String seat, String user) throws Exception; }

    // Broken: check, then act, in two separate steps (like SELECT owner, then an UPDATE with no condition).
    static final class CheckThenAct implements SeatStore {
        private final Map<String, String> owners = new ConcurrentHashMap<>();
        private final CyclicBarrier afterCheck;   // test hook: every client finishes its check before anyone writes

        CheckThenAct(int clients) { afterCheck = new CyclicBarrier(clients); }

        public boolean claim(String seat, String user) throws Exception {
            boolean free = !owners.containsKey(seat);
            afterCheck.await();                    // the "unlucky" interleaving, made certain
            if (!free) return false;
            owners.put(seat, user);
            return true;
        }
    }

    // Correct: one atomic conditional write (like UPDATE ... WHERE owner IS NULL and checking rows affected = 1).
    static final class ConditionalWrite implements SeatStore {
        private final Map<String, String> owners = new ConcurrentHashMap<>();

        public boolean claim(String seat, String user) { return owners.putIfAbsent(seat, user) == null; }
    }

    // One round: clients split across two "instances" all try to claim seat A1 at the same moment.
    static int winners(SeatStore store, int clients) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(clients);
        CyclicBarrier start = new CyclicBarrier(clients);
        List<Future<Boolean>> results = new ArrayList<>();
        for (int i = 0; i < clients; i++) {
            String user = (i % 2 == 0 ? "app-1/" : "app-2/") + "user" + i;
            results.add(pool.submit(() -> { start.await(); return store.claim("A1", user); }));
        }
        int won = 0;
        for (Future<Boolean> r : results) if (r.get()) won++;
        pool.shutdown();
        return won;
    }

    public static void main(String[] args) throws Exception {
        int clients = 8, rounds = 200;
        System.out.println("check-then-act, forced interleaving: " + winners(new CheckThenAct(clients), clients) + " winners");

        int exactlyOne = 0;
        for (int r = 0; r < rounds; r++) if (winners(new ConditionalWrite(), clients) == 1) exactlyOne++;
        System.out.println("conditional write: exactly one winner in " + exactlyOne + "/" + rounds + " rounds");
    }
}
