import java.util.*;

public class EventRing {
    // Fixed-capacity ring buffer of the most recent events, addressed by an ever-increasing sequence number.
    private final String[] slots;
    private long nextSeq = 1;                        // sequence number the next event will get

    EventRing(int capacity) { slots = new String[capacity]; }

    long append(String event) {
        slots[(int) (nextSeq % slots.length)] = event;   // overwrite the oldest slot when full
        return nextSeq++;
    }

    long oldestRetained() { return Math.max(1, nextSeq - slots.length); }

    // Events with seq > after, or empty if the client is up to date; null signals a gap (client must resync).
    List<String> since(long after) {
        if (after + 1 < oldestRetained()) return null;
        List<String> out = new ArrayList<>();
        for (long s = after + 1; s < nextSeq; s++) out.add(s + ":" + slots[(int) (s % slots.length)]);
        return out;
    }

    public static void main(String[] args) {
        EventRing ring = new EventRing(4);
        for (String e : List.of("A1 held", "A2 sold", "A1 sold")) ring.append(e);
        System.out.println("since 1: " + ring.since(1));
        System.out.println("since 3: " + ring.since(3));
        for (String e : List.of("A3 held", "A4 held", "A5 held")) ring.append(e);
        System.out.println("oldest retained: " + ring.oldestRetained());
        System.out.println("since 2: " + ring.since(2));
        System.out.println("since 1: " + (ring.since(1) == null ? "gap, resync from snapshot" : ring.since(1)));
    }
}
