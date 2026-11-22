import java.lang.management.*;
import java.util.*;
import java.util.concurrent.*;

public class LockDiagnosis {
    static final Object seatMapLock = new Object();
    static final Object lockA = new Object(), lockB = new Object();

    // Wait until a thread reaches the expected state, so the "dump" below is not a matter of timing luck.
    static void awaitState(Thread t, Thread.State s) throws InterruptedException {
        while (t.getState() != s) Thread.sleep(5);
    }

    public static void main(String[] args) throws Exception {
        ThreadMXBean mx = ManagementFactory.getThreadMXBean();

        // 1. Contention: worker-1 holds the monitor while it "calls the network"; worker-2 is BLOCKED behind it.
        CountDownLatch release = new CountDownLatch(1);
        Thread w1 = new Thread(() -> { synchronized (seatMapLock) { awaitQuietly(release); } }, "worker-1");
        Thread w2 = new Thread(() -> { synchronized (seatMapLock) { } }, "worker-2");
        w1.start(); awaitState(w1, Thread.State.WAITING);    // inside the lock, waiting on the latch
        w2.start(); awaitState(w2, Thread.State.BLOCKED);    // trying to enter the same monitor
        ThreadInfo info = mx.getThreadInfo(w2.threadId());
        System.out.println(info.getThreadName() + " " + info.getThreadState() + " on a lock held by " + info.getLockOwnerName());
        release.countDown(); w1.join(); w2.join();
        System.out.println("after release: worker-1 " + w1.getState() + ", worker-2 " + w2.getState());

        // 2. Deadlock: two threads take the same two locks in opposite order.
        CyclicBarrier bothHoldOne = new CyclicBarrier(2);
        Thread t1 = new Thread(() -> lockInOrder(lockA, lockB, bothHoldOne), "booking-thread");
        Thread t2 = new Thread(() -> lockInOrder(lockB, lockA, bothHoldOne), "refund-thread");
        t1.setDaemon(true); t2.setDaemon(true);              // so the JVM can still exit after the demo
        t1.start(); t2.start();
        long[] ids;
        while ((ids = mx.findDeadlockedThreads()) == null) Thread.sleep(5);
        List<String> names = new ArrayList<>();
        for (ThreadInfo ti : mx.getThreadInfo(ids)) names.add(ti.getThreadName() + " waits for " + ti.getLockOwnerName());
        Collections.sort(names);
        System.out.println("deadlocked: " + names);
    }

    static void lockInOrder(Object first, Object second, CyclicBarrier barrier) {
        synchronized (first) {
            try { barrier.await(); } catch (Exception e) { return; }   // both threads now hold their first lock
            synchronized (second) { System.out.println("never printed"); }
        }
    }

    static void awaitQuietly(CountDownLatch latch) {
        try { latch.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
