import java.util.concurrent.*;

public class RaceTrace {
    static final class Seat {
        private String owner;                       // deliberately unsynchronized
        boolean claim(String user, CountDownLatch bothRead) throws InterruptedException {
            boolean free = owner == null;           // 1. read + decide
            bothRead.countDown();
            bothRead.await(2, TimeUnit.SECONDS);    // 2. park until the other worker has also read
            if (!free) return false;
            owner = user;                           // 3. write
            return true;
        }
        synchronized String owner() { return owner; }
    }

    public static void main(String[] args) throws Exception {
        Seat seat = new Seat();                     // ONE shared instance
        CountDownLatch bothRead = new CountDownLatch(2);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        Future<Boolean> t1 = pool.submit(() -> seat.claim("U1", bothRead));
        Future<Boolean> t2 = pool.submit(() -> seat.claim("U2", bothRead));
        boolean r1 = t1.get(5, TimeUnit.SECONDS), r2 = t2.get(5, TimeUnit.SECONDS);
        pool.shutdown();
        System.out.println("U1=" + r1 + " U2=" + r2 + " finalOwner=" + seat.owner());
        System.out.println(r1 && r2 ? "RACE: two successes, one owner" : "no race this run");
    }
}
