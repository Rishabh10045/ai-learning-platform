import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class BookingAccess {
    record Booking(String id, String ownerId, String venue, String seat) {}
    // The caller comes from the verified token or session, never from the request body.
    record Caller(String userId, Set<String> scopes, String role, Set<String> venues) {}
    record Response(int status, String body) {}

    static final Map<String, Booking> DB = Map.of(
        "P", new Booking("P", "U1", "venue-A", "12C"),
        "Q", new Booking("Q", "U3", "venue-B", "4A"));

    // Authentication -> scope (category of action) -> resource rule (this booking).
    static Response getBooking(Optional<Caller> auth, String bookingId) {
        if (auth.isEmpty()) return new Response(401, "{\"error\":\"unauthenticated\"}");
        Caller c = auth.get();
        if (!c.scopes().contains("booking:read")) return new Response(403, "{\"error\":\"forbidden\"}");
        Booking b = DB.get(bookingId);
        boolean allowed = b != null && (b.ownerId().equals(c.userId())
            || ("SUPPORT".equals(c.role()) && c.venues().contains(b.venue())));
        // Same answer for "missing" and "not yours": no hint that the booking exists.
        if (!allowed) return new Response(404, "{\"error\":\"not found\"}");
        return new Response(200, "{\"id\":\"" + b.id() + "\",\"seat\":\"" + b.seat() + "\"}");
    }

    public static void main(String[] args) {
        Caller u1 = new Caller("U1", Set.of("booking:read"), "USER", Set.of());
        Caller u2 = new Caller("U2", Set.of("booking:read"), "USER", Set.of());
        Caller noScope = new Caller("U1", Set.of("profile:read"), "USER", Set.of());
        Caller staffA = new Caller("S1", Set.of("booking:read"), "SUPPORT", Set.of("venue-A"));
        Object[][] cases = {
            {"anonymous    -> P", Optional.empty(), "P"},
            {"U1 (owner)   -> P", Optional.of(u1), "P"},
            {"U2 (other)   -> P", Optional.of(u2), "P"},
            {"U1 no scope  -> P", Optional.of(noScope), "P"},
            {"staff venueA -> P", Optional.of(staffA), "P"},
            {"staff venueA -> Q", Optional.of(staffA), "Q"},
            {"U2 missing   -> Z", Optional.of(u2), "Z"}};
        for (Object[] t : cases) {
            @SuppressWarnings("unchecked")
            Response r = getBooking((Optional<Caller>) t[1], (String) t[2]);
            System.out.println(t[0] + ": " + r.status() + " " + r.body());
        }
    }
}
