import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class BoundedFanOut {
    // A pretend database call: it holds one of a limited number of connections for 10 ms.
    static void dbCall(AtomicInteger inFlight, AtomicInteger peak) throws InterruptedException {
        int now = inFlight.incrementAndGet();
        peak.accumulateAndGet(now, Math::max);
        try { Thread.sleep(10); } finally { inFlight.decrementAndGet(); }
    }

    static int run(int tasks, Semaphore permits) throws Exception {
        AtomicInteger inFlight = new AtomicInteger(), peak = new AtomicInteger();
        try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {   // one cheap thread per task
            for (int i = 0; i < tasks; i++) {
                exec.submit(() -> {
                    if (permits == null) { dbCall(inFlight, peak); return null; }
                    permits.acquire();                       // admission control in front of the scarce resource
                    try { dbCall(inFlight, peak); } finally { permits.release(); }
                    return null;
                });
            }
        }                                                    // close() waits for every task to finish
        return peak.get();
    }

    public static void main(String[] args) throws Exception {
        int tasks = 1000, poolSize = 8;
        int unbounded = run(tasks, null);
        int bounded = run(tasks, new Semaphore(poolSize));
        System.out.println("1000 virtual threads, no limit: peak concurrent DB calls > 8: " + (unbounded > poolSize));
        System.out.println("1000 virtual threads, Semaphore(8): peak concurrent DB calls = " + bounded);
    }
}
