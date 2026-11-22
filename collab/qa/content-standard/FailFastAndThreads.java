import java.util.*;
import java.util.concurrent.*;

public class FailFastAndThreads {
    public static void main(String[] args) throws Exception {
        Map<String, Integer> stock = new HashMap<>(Map.of("pen", 0, "book", 3, "bag", 0));
        try {
            for (String k : stock.keySet()) if (stock.get(k) == 0) stock.remove(k); // structural change mid-iteration
        } catch (ConcurrentModificationException e) {
            System.out.println("fail-fast: " + e.getClass().getSimpleName());
        }
        stock.values().removeIf(v -> v == 0);       // correct way
        System.out.println("after removeIf: " + stock);

        // Lost updates: HashMap is not thread-safe. ConcurrentHashMap.merge is atomic per key.
        System.out.println("HashMap total = " + count(new HashMap<>()) + " (expected 80000; usually less, may even throw)");
        System.out.println("ConcurrentHashMap total = " + count(new ConcurrentHashMap<>()));
    }

    static int count(Map<Integer, Integer> map) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(8);
        for (int t = 0; t < 8; t++) pool.submit(() -> {
            for (int i = 0; i < 10_000; i++) map.merge(i % 100, 1, Integer::sum);
        });
        pool.shutdown();
        pool.awaitTermination(10, TimeUnit.SECONDS);
        return map.values().stream().mapToInt(Integer::intValue).sum();
    }
}
