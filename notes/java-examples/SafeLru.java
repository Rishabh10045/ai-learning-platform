import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.locks.*;

// Machine-coding style: interface first, LinkedHashMap in access order, one lock around every operation
// (get mutates recency too), and a concurrent stress test that checks the size invariant.
public class SafeLru {
    interface Cache<K, V> { V get(K key); void put(K key, V value); int size(); }

    static final class LockedLru<K, V> implements Cache<K, V> {
        private final Lock lock = new ReentrantLock();
        private final LinkedHashMap<K, V> map;
        LockedLru(int capacity) {
            map = new LinkedHashMap<>(16, 0.75f, true) {              // true = access order: get moves the entry
                @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }
            };
        }
        public V get(K key) { lock.lock(); try { return map.get(key); } finally { lock.unlock(); } }
        public void put(K key, V value) { lock.lock(); try { map.put(key, value); } finally { lock.unlock(); } }
        public int size() { lock.lock(); try { return map.size(); } finally { lock.unlock(); } }
        List<K> order() { lock.lock(); try { return new ArrayList<>(map.keySet()); } finally { lock.unlock(); } }
    }

    public static void main(String[] args) throws Exception {
        LockedLru<String, Integer> c = new LockedLru<>(2);
        c.put("A", 1); c.put("B", 2); c.get("A"); c.put("C", 3);
        System.out.println("least -> most recent: " + c.order() + " (B evicted)");

        LockedLru<Integer, Integer> shared = new LockedLru<>(100);
        ExecutorService pool = Executors.newFixedThreadPool(8);
        List<Future<?>> fs = new ArrayList<>();
        for (int t = 0; t < 8; t++) {
            final int seed = t;
            fs.add(pool.submit(() -> {
                Random r = new Random(seed);
                for (int i = 0; i < 20_000; i++) { int k = r.nextInt(500); if (r.nextBoolean()) shared.put(k, i); else shared.get(k); }
            }));
        }
        for (Future<?> f : fs) f.get();
        pool.shutdown();
        System.out.println("8 threads x 20,000 ops: final size " + shared.size() + " (capacity 100), order list size " + shared.order().size());
    }
}
