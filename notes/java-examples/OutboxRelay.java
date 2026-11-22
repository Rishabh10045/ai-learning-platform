import java.util.*;

public class OutboxRelay {
    // Producer database: the booking row and its outbox row are written in ONE local transaction.
    record OutboxRow(String eventId, String payload) {}
    static final Map<String, String> bookings = new LinkedHashMap<>();
    static final List<OutboxRow> outbox = new ArrayList<>();
    static final Set<String> sentIds = new HashSet<>();

    static synchronized void bookSeat(String seat, String user) {      // BEGIN ... COMMIT
        bookings.put(seat, user);
        outbox.add(new OutboxRow("evt-" + seat, "SeatBooked " + seat + " " + user));
    }

    // Broker: delivers at least once, so duplicates are possible.
    static final List<OutboxRow> broker = new ArrayList<>();

    // Relay: reads unsent rows, publishes, then marks them sent. It may crash between the two steps.
    static void relay(boolean crashBeforeMarking) {
        for (OutboxRow row : outbox) {
            if (sentIds.contains(row.eventId())) continue;
            broker.add(row);                                              // publish succeeded
            if (crashBeforeMarking) { System.out.println("relay crashed after publishing " + row.eventId()); return; }
            sentIds.add(row.eventId());
        }
    }

    // Consumer database: the side effect and the "processed" marker commit together.
    static final Set<String> processed = new HashSet<>();
    static final List<String> emailsQueued = new ArrayList<>();

    static synchronized void consume(OutboxRow event) {                 // BEGIN ... COMMIT
        if (!processed.add(event.eventId())) { System.out.println("duplicate " + event.eventId() + " ignored"); return; }
        emailsQueued.add("confirmation for " + event.payload());
    }

    public static void main(String[] args) {
        bookSeat("A1", "ana");
        relay(true);       // publishes evt-A1, crashes before marking it sent
        relay(false);      // restarts, sees evt-A1 still unsent, publishes it again
        System.out.println("events on the broker: " + broker.size());
        for (OutboxRow e : broker) consume(e);
        System.out.println("confirmation emails queued: " + emailsQueued.size());
        System.out.println("booking and event agree: " + (bookings.containsKey("A1") && sentIds.contains("evt-A1")));
    }
}
