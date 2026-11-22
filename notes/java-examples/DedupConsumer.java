import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class DedupConsumer {
    record Event(String id, String seat, String type) {}

    // Same key -> same partition, so events for one seat stay in order.
    static int partitionFor(String key, int partitions) { return Math.floorMod(key.hashCode(), partitions); }

    // The processed-ID set and the effect change together, as one database transaction would.
    static final Set<String> processed = new HashSet<>();
    static final Map<String, String> seatState = new LinkedHashMap<>();
    static int applied = 0, skipped = 0;

    static void handle(Event e) {
        if (!processed.add(e.id())) { skipped++; return; }    // already applied: acknowledge and skip
        seatState.put(e.seat(), e.type());
        applied++;
    }

    public static void main(String[] args) {
        int partitions = 3;
        List<List<Event>> log = new ArrayList<>();
        for (int p = 0; p < partitions; p++) log.add(new ArrayList<>());
        Event[] produced = {
            new Event("e1", "A1", "HELD"), new Event("e2", "B4", "HELD"), new Event("e3", "A1", "BOOKED"),
            new Event("e4", "C2", "HELD"), new Event("e5", "B4", "RELEASED")
        };
        for (Event e : produced) log.get(partitionFor(e.seat(), partitions)).add(e);
        for (int p = 0; p < partitions; p++) System.out.println("partition " + p + ": " + log.get(p));

        // Consume partition by partition; the consumer crashes after applying offset 0 of the
        // first non-empty partition but before committing it, so that record is delivered again.
        for (List<Event> part : log) {
            int committed = 0;
            for (int offset = committed; offset < part.size(); offset++) handle(part.get(offset));
            if (!part.isEmpty() && applied == part.size() && skipped == 0) {
                System.out.println("crash before commit; redelivering " + part.get(0).id());
                handle(part.get(0));
            }
        }
        System.out.println("applied " + applied + ", duplicates skipped " + skipped);
        System.out.println("final seat states: " + seatState);
    }
}
