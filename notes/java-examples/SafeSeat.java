import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

public class SafeSeat {
    static final class LockedSeat {
        private String owner;                               // guarded by this
        synchronized boolean claim(String user) {           // check + write under ONE monitor
            if (owner != null) return false;
            owner = user;
            return true;
        }
        synchronized String owner() { return owner; }
    }
    static final class CasSeat {
        private final AtomicReference<String> owner = new AtomicReference<>();
        boolean claim(String user) { return owner.compareAndSet(null, user); } // atomic check-and-set
        String owner() { return owner.get(); }
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        int lockedDouble = 0, casDouble = 0;
        for (int run = 0; run < 1000; run++) {
            LockedSeat a = new LockedSeat(); CasSeat b = new CasSeat();
            CyclicBarrier start = new CyclicBarrier(2);
            Callable<Integer> race = () -> { start.await(); return (a.claim(Thread.currentThread().getName()) ? 1 : 0) + (b.claim(Thread.currentThread().getName()) ? 10 : 0); };
            Future<Integer> f1 = pool.submit(race), f2 = pool.submit(race);
            int r = f1.get(5, TimeUnit.SECONDS) + f2.get(5, TimeUnit.SECONDS);
            if (r % 10 != 1) lockedDouble++;
            if (r / 10 != 1) casDouble++;
        }
        pool.shutdown();
        System.out.println("runs=1000 lockedSeatWrongWinners=" + lockedDouble + " casSeatWrongWinners=" + casDouble);
    }
}
