import java.util.*;

public class TxPropagation {
    enum Propagation { REQUIRED, REQUIRES_NEW }

    // A toy transaction manager with the same rules Spring applies for REQUIRED and REQUIRES_NEW.
    static final class Tx {
        final int id; final List<String> pending = new ArrayList<>(); boolean rollbackOnly;
        Tx(int id) { this.id = id; }
    }
    static final Deque<Tx> stack = new ArrayDeque<>();
    static final List<String> committed = new ArrayList<>();
    static int nextId = 1;

    interface Work { void run() throws Exception; }

    static void inTx(Propagation p, String name, Work work) throws Exception {
        boolean joins = p == Propagation.REQUIRED && !stack.isEmpty();
        Tx tx = joins ? stack.peek() : new Tx(nextId++);
        if (!joins) stack.push(tx);              // REQUIRES_NEW suspends the outer tx by pushing a new one
        try {
            work.run();
        } catch (RuntimeException e) {           // default rule: unchecked exceptions roll back
            if (joins) tx.rollbackOnly = true;   // a participant cannot roll back alone: it marks the shared tx
            else { stack.pop(); System.out.println("  " + name + ": tx" + tx.id + " rolled back"); }
            throw e;
        }
        if (joins) return;                       // only the tx owner commits
        stack.pop();
        if (tx.rollbackOnly) {
            System.out.println("  " + name + ": tx" + tx.id + " was marked rollback-only, nothing committed");
            throw new IllegalStateException("UnexpectedRollback: transaction silently rolled back because it has been marked as rollback-only");
        }
        committed.addAll(tx.pending);
        System.out.println("  " + name + ": tx" + tx.id + " committed " + tx.pending);
    }

    static void write(String row) { stack.peek().pending.add(row); }

    static void audit(Propagation p, boolean fail) throws Exception {
        inTx(p, "audit", () -> { write("audit-row"); if (fail) throw new RuntimeException("audit failed"); });
    }

    static void scenario(String title, Propagation auditPropagation, boolean auditFails) {
        committed.clear(); stack.clear();
        System.out.println(title);
        try {
            inTx(Propagation.REQUIRED, "booking", () -> {
                write("booking-row");
                try { audit(auditPropagation, auditFails); }
                catch (RuntimeException e) { System.out.println("  booking caught: " + e.getMessage()); }
            });
        } catch (Exception e) {
            System.out.println("  caller sees: " + e.getMessage().split(":")[0]);
        }
        System.out.println("  rows in database: " + committed);
    }

    public static void main(String[] args) {
        scenario("1. audit REQUIRED, succeeds", Propagation.REQUIRED, false);
        scenario("2. audit REQUIRED, fails, booking catches it", Propagation.REQUIRED, true);
        scenario("3. audit REQUIRES_NEW, fails, booking catches it", Propagation.REQUIRES_NEW, true);
    }
}
