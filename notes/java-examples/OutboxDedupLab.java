import java.util.*;

// Day 23 main lab: dual-write failure, the transactional outbox, at-least-once relay with a crash between
// "publish" and "mark sent", and a consumer that deduplicates by event id. Per-key order is kept by partition.
public class OutboxDedupLab {
    record Event(String id, String seat, String type) {}

    static final class Db {   // the booking table and the outbox table commit together (one local transaction)
        final Map<String, String> bookings = new LinkedHashMap<>(); final List<Event> outbox = new ArrayList<>(); final Set<String> sent = new HashSet<>();
        void bookWithOutbox(String seat, String user, String eventId) { bookings.put(seat, user); outbox.add(new Event(eventId, seat, "BookingConfirmed")); }
    }
    static final class Broker { final Map<Integer, List<Event>> partitions = new TreeMap<>();
        void publish(Event e) { partitions.computeIfAbsent(Math.floorMod(e.seat().hashCode(), 3), p -> new ArrayList<>()).add(e); }
        int total() { return partitions.values().stream().mapToInt(List::size).sum(); } }

    // Relay: read unsent rows, publish, then mark sent. A crash between the two steps causes a re-publish.
    static void relay(Db db, Broker broker, String crashAfterPublishing) {
        for (Event e : db.outbox) {
            if (db.sent.contains(e.id())) continue;
            broker.publish(e);
            if (e.id().equals(crashAfterPublishing)) { System.out.println("relay crashed after publishing " + e.id() + " (not marked sent)"); return; }
            db.sent.add(e.id());
        }
    }
    static final class Consumer { final Set<String> processed = new HashSet<>(); int emails = 0, duplicatesSkipped = 0;
        void consume(Event e) { if (!processed.add(e.id())) { duplicatesSkipped++; return; } emails++; } }   // processed-id insert + effect in one transaction

    public static void main(String[] args) {
        // Dual write: commit the booking, then the process dies before the broker call -> the event is lost forever.
        Map<String, String> bookings = new HashMap<>(); Broker lost = new Broker();
        bookings.put("A1", "U1"); /* crash here: lost.publish(...) never runs */
        System.out.println("dual write: bookings=" + bookings.size() + ", events published=" + lost.total());

        Db db = new Db(); Broker broker = new Broker();
        db.bookWithOutbox("A1", "U1", "e1"); db.bookWithOutbox("A2", "U2", "e2"); db.bookWithOutbox("A3", "U3", "e3");
        relay(db, broker, "e2");
        relay(db, broker, null);                                                      // restarted relay
        System.out.println("outbox rows=" + db.outbox.size() + ", messages on broker=" + broker.total() + " (at-least-once)");

        Consumer c = new Consumer();
        broker.partitions.values().forEach(p -> p.forEach(c::consume));
        System.out.println("consumer: emails sent=" + c.emails + ", duplicates skipped=" + c.duplicatesSkipped);

        // Order: events for the same seat go to one partition, so a CANCEL can never overtake its CONFIRM.
        Broker ordered = new Broker();
        ordered.publish(new Event("e7", "B9", "BookingConfirmed")); ordered.publish(new Event("e8", "B9", "BookingCancelled"));
        System.out.println("same seat, one partition, order: " + ordered.partitions.values().iterator().next().stream().map(Event::type).toList());
    }
}
