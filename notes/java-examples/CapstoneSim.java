import java.util.*;
import java.util.concurrent.*;

public class CapstoneSim {
    // The "database": the single authority for seat ownership and for idempotency records.
    static final class Store {
        private final Map<String, String> owner = new HashMap<>();     // seat -> user
        private final Map<String, String> replies = new HashMap<>();   // idempotency key -> stored reply

        // Plays the role of one transaction:
        //   UPDATE seat SET owner = ? WHERE id = ? AND owner IS NULL   -- 1 row means we won, 0 rows means conflict
        //   INSERT INTO idempotency_key (key, reply) VALUES (?, ?)
        synchronized String claim(String key, String seat, String user) {
            String previous = replies.get(key);
            if (previous != null) return previous;                   // same logical request: replay, do not re-run
            String reply = owner.putIfAbsent(seat, user) == null
                    ? "201 " + seat + " -> " + user
                    : "409 " + seat + " is taken";
            replies.put(key, reply);
            return reply;
        }

        synchronized String ownerOf(String seat) { return owner.get(seat); }
    }

    // An application instance holds no booking state of its own; every decision goes to the store.
    record Instance(String name, Store db) {
        String book(String key, String seat, String user) { return db.claim(key, seat, user); }

        String help(boolean providerUp) {
            if (!providerUp) return "help unavailable, showing the refund policy page instead";
            return "Refunds are allowed up to 24h before the show [POL-REFUND-1]";
        }
    }

    public static void main(String[] args) throws Exception {
        Store db = new Store();
        Instance app1 = new Instance("app-1", db), app2 = new Instance("app-2", db);

        // 1. Two users race for seat A1 through different instances, released at the same moment.
        CountDownLatch go = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<String> ana = pool.submit(() -> { go.await(); return app1.book("key-ana", "A1", "ana"); });
        Future<String> ben = pool.submit(() -> { go.await(); return app2.book("key-ben", "A1", "ben"); });
        go.countDown();
        String anaReply = ana.get(), benReply = ben.get();
        pool.shutdown();
        int winners = (anaReply.startsWith("201") ? 1 : 0) + (benReply.startsWith("201") ? 1 : 0);
        System.out.println("winners for A1: " + winners);

        // 2. The client timed out and retries with the same key, this time through the other instance.
        String winnerKey = anaReply.startsWith("201") ? "key-ana" : "key-ben";
        String original = anaReply.startsWith("201") ? anaReply : benReply;
        String retry = app2.book(winnerKey, "A1", "whoever");
        System.out.println("retry replays the original reply: " + retry.equals(original));
        System.out.println("owner unchanged after retry: " + original.endsWith(db.ownerOf("A1")));

        // 3. The model provider is down: help falls back, booking still works.
        System.out.println("help: " + app1.help(false));
        System.out.println("book A2 while the provider is down: " + app2.book("key-cy", "A2", "cy"));
    }
}
