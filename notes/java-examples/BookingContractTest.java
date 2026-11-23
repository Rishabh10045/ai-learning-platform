import java.util.*;

// Day 8 main lab: a runnable contract test for the booking service (winner, loser, invalid input),
// with the dependencies behind interfaces (SOLID: dependency inversion) so the test uses fakes.
public class BookingContractTest {
    enum Outcome { CONFIRMED, CONFLICT }

    interface SeatRepository { Optional<String> ownerOf(String seat); boolean exists(String seat); boolean claimIfFree(String seat, String user); }
    interface Notifier { void confirmed(String seat, String user); }

    interface BookingService { Outcome book(String seat, String user); }

    // The class under test: validates first, then makes one guarded state change, then notifies.
    static final class GuardedBookingService implements BookingService {
        private final SeatRepository seats; private final Notifier notifier;
        GuardedBookingService(SeatRepository seats, Notifier notifier) { this.seats = seats; this.notifier = notifier; }
        public Outcome book(String seat, String user) {
            if (user == null || user.isBlank()) throw new IllegalArgumentException("user is required");
            if (seat == null || !seats.exists(seat)) throw new IllegalArgumentException("unknown seat " + seat);
            if (!seats.claimIfFree(seat, user)) return Outcome.CONFLICT;
            notifier.confirmed(seat, user);
            return Outcome.CONFIRMED;
        }
    }

    // A deliberately broken implementation: it overwrites the owner. The same tests must catch it.
    static final class OverwritingBookingService implements BookingService {
        private final InMemorySeats seats; private final Notifier notifier;
        OverwritingBookingService(InMemorySeats seats, Notifier notifier) { this.seats = seats; this.notifier = notifier; }
        public Outcome book(String seat, String user) {
            seats.owners.put(seat, user);
            notifier.confirmed(seat, user);
            return Outcome.CONFIRMED;
        }
    }

    // Fakes: real behaviour, in memory, fully observable by the test.
    static final class InMemorySeats implements SeatRepository {
        final Map<String, String> owners = new HashMap<>();
        final Set<String> known = new HashSet<>(Set.of("A1", "A2"));
        public Optional<String> ownerOf(String seat) { return Optional.ofNullable(owners.get(seat)); }
        public boolean exists(String seat) { return known.contains(seat); }
        public boolean claimIfFree(String seat, String user) { return owners.putIfAbsent(seat, user) == null; }
    }
    static final class RecordingNotifier implements Notifier {
        final List<String> sent = new ArrayList<>();
        public void confirmed(String seat, String user) { sent.add(seat + "->" + user); }
    }

    interface Factory { BookingService create(InMemorySeats seats, RecordingNotifier notifier); }
    static int passed, failed;

    static void check(String name, boolean ok) {
        if (ok) passed++; else failed++;
        System.out.println((ok ? "  PASS " : "  FAIL ") + name);
    }

    static void runContract(String label, Factory factory) {
        passed = 0; failed = 0;
        System.out.println(label);
        { // winner: first claim confirms, stores the owner and sends exactly one notification
            InMemorySeats seats = new InMemorySeats(); RecordingNotifier n = new RecordingNotifier();
            Outcome o = factory.create(seats, n).book("A1", "U1");
            check("winner gets CONFIRMED, owner U1, one notification", o == Outcome.CONFIRMED && seats.ownerOf("A1").orElse("").equals("U1") && n.sent.equals(List.of("A1->U1")));
        }
        { // loser: second claim for the same seat conflicts and changes nothing
            InMemorySeats seats = new InMemorySeats(); RecordingNotifier n = new RecordingNotifier();
            BookingService s = factory.create(seats, n);
            s.book("A1", "U1");
            Outcome o = s.book("A1", "U2");
            check("loser gets CONFLICT, owner still U1, no second notification", o == Outcome.CONFLICT && seats.ownerOf("A1").orElse("").equals("U1") && n.sent.size() == 1);
        }
        { // invalid input: rejected before any state change
            InMemorySeats seats = new InMemorySeats(); RecordingNotifier n = new RecordingNotifier();
            BookingService s = factory.create(seats, n);
            int rejected = 0;
            for (String[] bad : new String[][] {{"A1", " "}, {"A1", null}, {"Z9", "U1"}}) {
                try { s.book(bad[0], bad[1]); } catch (IllegalArgumentException e) { rejected++; }
            }
            check("invalid input throws, no owner, no notification", rejected == 3 && seats.owners.isEmpty() && n.sent.isEmpty());
        }
        System.out.println("  " + passed + " passed, " + failed + " failed");
    }

    public static void main(String[] args) {
        runContract("GuardedBookingService", (seats, n) -> new GuardedBookingService(seats, n));
        runContract("OverwritingBookingService (must fail)", (seats, n) -> new OverwritingBookingService(seats, n));
    }
}
