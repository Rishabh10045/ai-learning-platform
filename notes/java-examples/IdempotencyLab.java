import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

// Day 20 main lab: idempotency keys with a stored reply. Same key + same payload -> the original reply is
// replayed and the booking runs once. Same key + different payload -> 422. Concurrent duplicates -> one execution.
public class IdempotencyLab {
    record StoredReply(String payloadHash, String reply) {}

    static final class BookingApi {
        private final ConcurrentHashMap<String, CompletableFuture<StoredReply>> byKey = new ConcurrentHashMap<>();
        private final Map<String, String> owners = new ConcurrentHashMap<>();
        final AtomicInteger executions = new AtomicInteger();

        String post(String idempotencyKey, String payload) throws Exception {
            String hash = sha(payload);
            CompletableFuture<StoredReply> mine = new CompletableFuture<>();
            CompletableFuture<StoredReply> existing = byKey.putIfAbsent(idempotencyKey, mine);   // claim the key atomically
            if (existing != null) {
                StoredReply stored = existing.get(2, TimeUnit.SECONDS);                       // wait for the first request
                return stored.payloadHash().equals(hash) ? stored.reply() + " (replayed)" : "422 key reused with a different payload";
            }
            executions.incrementAndGet();
            String[] p = payload.split(",");
            String reply = owners.putIfAbsent(p[0], p[1]) == null ? "201 " + p[0] + " -> " + p[1] : "409 " + p[0] + " taken";
            mine.complete(new StoredReply(hash, reply));      // in a database: same transaction as the booking row
            return reply;
        }
        static String sha(String s) throws Exception {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        }
    }

    public static void main(String[] args) throws Exception {
        BookingApi api = new BookingApi();
        System.out.println("first POST k1          -> " + api.post("k1", "A1,U1"));
        System.out.println("retry POST k1 (timeout) -> " + api.post("k1", "A1,U1"));
        System.out.println("POST k1 other payload   -> " + api.post("k1", "A2,U1"));
        System.out.println("new key k2 for A1       -> " + api.post("k2", "A1,U2"));

        // 8 concurrent retries of one new request: exactly one runs, the others replay its reply.
        BookingApi race = new BookingApi();
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<String>> results = new ArrayList<>();
        for (int i = 0; i < 8; i++) results.add(pool.submit(() -> { start.await(); return race.post("k9", "B1,U7"); }));
        start.countDown();
        long replays = 0; for (Future<String> f : results) if (f.get().endsWith("(replayed)")) replays++;
        pool.shutdown();
        System.out.println("8 concurrent duplicates: executions=" + race.executions.get() + ", replays=" + replays);
    }
}
