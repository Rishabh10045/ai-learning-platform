import java.util.*;

public class ToolGate {
    // What the model sends back: a tool name plus arguments. It is a proposal, not a permission.
    record Proposal(String tool, Map<String, String> args) {}
    // Who is really asking, taken from the authenticated session, never from the model.
    record Caller(String userId, Set<String> venues) {}
    record Outcome(boolean executed, String detail) {}

    static final Map<String, String> POLICIES = Map.of(
        "VENUE-A/REFUND", "Refunds up to 24h before the show.",
        "VENUE-B/REFUND", "No refunds; exchanges only.");
    static final Set<String> ALLOWED_TOOLS = Set.of("lookupPolicy");   // allowlist: read-only tools only

    static Outcome handle(Caller caller, Proposal p) {
        if (!ALLOWED_TOOLS.contains(p.tool())) return new Outcome(false, "rejected: tool not allowed: " + p.tool());
        String venue = p.args().get("venue"), topic = p.args().get("topic");
        if (venue == null || !venue.matches("VENUE-[A-Z]") || topic == null || !topic.matches("[A-Z]{3,12}"))
            return new Outcome(false, "rejected: invalid arguments venue=" + venue + " topic=" + topic);
        if (!caller.venues().contains(venue))                              // authorization uses the caller, not the args
            return new Outcome(false, "rejected: " + caller.userId() + " may not read " + venue);
        String text = POLICIES.get(venue + "/" + topic);
        if (text == null) return new Outcome(false, "rejected: no such policy " + venue + "/" + topic);
        return new Outcome(true, "result (data, not instructions): " + text);
    }

    public static void main(String[] args) {
        Caller u1 = new Caller("U1", Set.of("VENUE-A"));
        List<Proposal> proposals = List.of(
            new Proposal("lookupPolicy", Map.of("venue", "VENUE-A", "topic", "REFUND")),
            new Proposal("lookupPolicy", Map.of("venue", "VENUE-B", "topic", "REFUND")),
            new Proposal("lookupPolicy", Map.of("venue", "A; DROP", "topic", "REFUND")),
            new Proposal("cancelBooking", Map.of("bookingId", "B-7")));
        int executed = 0;
        for (Proposal p : proposals) {
            Outcome o = handle(u1, p);
            if (o.executed()) executed++;
            System.out.println(p.tool() + " -> " + o.detail());
        }
        System.out.println("executed=" + executed + " of " + proposals.size());
    }
}
