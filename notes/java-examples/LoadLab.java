import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

// Day 24 main lab: (1) a deterministic queue simulation of round-robin vs least-outstanding-requests with one slow
// instance, reporting p50/p95/p99 including queue wait; (2) a bounded load run against a shared seat store
// that checks the booking invariant and rejects work beyond the queue limit instead of growing latency forever.
public class LoadLab {
    static long pct(long[] sorted, double p) { return sorted[(int) Math.ceil(p / 100 * sorted.length) - 1]; }

    // Discrete-event model: requests arrive every 5 ms (offered load 86% of total capacity); instance service times 10, 10, 30 ms (instance 3 is slow).
    static long[] simulate(boolean leastOutstanding) {
        int[] service = {10, 10, 30}; long[] freeAt = new long[3]; int[] outstanding = new int[3];
        List<long[]> inFlight = new ArrayList<>();   // {instance, finishTime}
        long[] latency = new long[3000]; int rr = 0;
        for (int i = 0; i < latency.length; i++) {
            long arrive = i * 5L;
            for (Iterator<long[]> it = inFlight.iterator(); it.hasNext();) { long[] f = it.next(); if (f[1] <= arrive) { outstanding[(int) f[0]]--; it.remove(); } }
            int pick;
            if (leastOutstanding) { pick = 0; for (int s = 1; s < 3; s++) if (outstanding[s] < outstanding[pick]) pick = s; }
            else pick = rr++ % 3;
            long start = Math.max(arrive, freeAt[pick]), finish = start + service[pick];
            freeAt[pick] = finish; outstanding[pick]++; inFlight.add(new long[] {pick, finish});
            latency[i] = finish - arrive;                         // queue wait + service time
        }
        Arrays.sort(latency);
        return latency;
    }

    public static void main(String[] args) throws Exception {
        for (boolean lor : new boolean[] {false, true}) {
            long[] l = simulate(lor);
            System.out.printf("%-20s p50=%dms p95=%dms p99=%dms%n", lor ? "least-outstanding" : "round-robin", pct(l, 50), pct(l, 95), pct(l, 99));
        }

        // Bounded load: 4 workers, queue of 20, 400 clients race for 50 seats. Overflow is rejected (HTTP 503).
        ConcurrentHashMap<String, String> owners = new ConcurrentHashMap<>();
        ThreadPoolExecutor pool = new ThreadPoolExecutor(4, 4, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(20), new ThreadPoolExecutor.AbortPolicy());
        AtomicInteger ok = new AtomicInteger(), conflict = new AtomicInteger(), rejected = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        Map<String, List<String>> winnersBySeat = new ConcurrentHashMap<>();
        for (int c = 0; c < 400; c++) {
            String seat = "S" + (c % 50), user = "U" + c;
            try {
                futures.add(pool.submit(() -> {
                    try { Thread.sleep(1); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                    if (owners.putIfAbsent(seat, user) == null) { ok.incrementAndGet(); winnersBySeat.computeIfAbsent(seat, s -> new CopyOnWriteArrayList<>()).add(user); }
                    else conflict.incrementAndGet();
                }));
            } catch (RejectedExecutionException e) { rejected.incrementAndGet(); }
        }
        for (Future<?> f : futures) f.get();
        pool.shutdown();
        boolean oneWinnerEach = winnersBySeat.values().stream().allMatch(w -> w.size() == 1);
        boolean ownersMatchWinners = winnersBySeat.entrySet().stream().allMatch(e -> owners.get(e.getKey()).equals(e.getValue().get(0)));
        System.out.println("accounted for every request: " + (ok.get() + conflict.get() + rejected.get() == 400));
        System.out.println("some requests shed with 503 instead of queueing: " + (rejected.get() > 0));
        System.out.println("invariant: at most one winner per seat: " + oneWinnerEach + ", stored owner = winner: " + ownersMatchWinners);
    }
}
