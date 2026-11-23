import java.time.*;
import java.util.*;

// Day 19 main lab: temporary holds with an expiry, driven by a fake clock so the test controls time.
// States: FREE -> HELD(user, expiresAt) -> CONFIRMED, and HELD -> FREE when the hold expires.
public class HoldExpiryLab {
    // A Clock we can move forward by hand (java.time.Clock is abstract, so tests can substitute it).
    static final class FakeClock extends Clock {
        private Instant now; FakeClock(Instant start) { now = start; }
        void advance(Duration d) { now = now.plus(d); }
        public Instant instant() { return now; }
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
    }
    record Hold(String user, Instant expiresAt) {}

    static final class SeatHolds {
        private final Clock clock; private final Duration ttl;
        private final Map<String, Hold> holds = new HashMap<>(); private final Map<String, String> confirmed = new HashMap<>();
        SeatHolds(Clock clock, Duration ttl) { this.clock = clock; this.ttl = ttl; }

        // One method decides "is the seat available now?", so hold and confirm can never disagree about expiry.
        private boolean activeHold(String seat) { Hold h = holds.get(seat); return h != null && clock.instant().isBefore(h.expiresAt()); }

        synchronized String hold(String seat, String user) {
            if (confirmed.containsKey(seat)) return "409 already booked by " + confirmed.get(seat);
            if (activeHold(seat) && !holds.get(seat).user().equals(user)) return "409 held by " + holds.get(seat).user();
            Hold h = new Hold(user, clock.instant().plus(ttl)); holds.put(seat, h);
            return "200 held for " + user + " until " + h.expiresAt();
        }
        synchronized String confirm(String seat, String user) {
            if (confirmed.containsKey(seat)) return "409 already booked by " + confirmed.get(seat);
            if (!activeHold(seat)) return "410 hold expired or missing";
            if (!holds.get(seat).user().equals(user)) return "403 hold belongs to " + holds.get(seat).user();
            holds.remove(seat); confirmed.put(seat, user);
            return "201 confirmed " + seat + " for " + user;
        }
    }

    public static void main(String[] args) {
        FakeClock clock = new FakeClock(Instant.parse("2026-12-06T20:00:00Z"));
        SeatHolds seats = new SeatHolds(clock, Duration.ofMinutes(10));
        System.out.println("t+0m  U1 hold A1    -> " + seats.hold("A1", "U1"));
        System.out.println("t+0m  U2 hold A1    -> " + seats.hold("A1", "U2"));
        clock.advance(Duration.ofMinutes(9).plusSeconds(59));
        System.out.println("t+9m59s U2 confirm  -> " + seats.confirm("A1", "U2"));
        clock.advance(Duration.ofSeconds(1));
        System.out.println("t+10m U1 confirm    -> " + seats.confirm("A1", "U1"));
        System.out.println("t+10m U2 hold A1    -> " + seats.hold("A1", "U2"));
        clock.advance(Duration.ofMinutes(3));
        System.out.println("t+13m U2 confirm    -> " + seats.confirm("A1", "U2"));
        System.out.println("t+13m U1 hold A1    -> " + seats.hold("A1", "U1"));
    }
}
