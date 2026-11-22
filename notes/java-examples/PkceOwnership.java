import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

public class PkceOwnership {
    // PKCE (RFC 7636): the client keeps a random verifier and sends only its SHA-256 challenge with the login redirect.
    static String challenge(String verifier) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }

    // Object-level authorization: a valid token with the right scope still may only touch its own bookings.
    record Booking(String id, String ownerSub) {}
    static final Map<String, Booking> bookings = Map.of("b-100", new Booking("b-100", "u1"), "b-200", new Booking("b-200", "u2"));

    static String cancel(String sub, Set<String> scopes, String bookingId) {
        if (!scopes.contains("booking:write")) return "403 insufficient_scope";
        Booking b = bookings.get(bookingId);
        if (b == null || !b.ownerSub().equals(sub)) return "404 not found";   // do not reveal other users' bookings
        return "204 cancelled " + bookingId;
    }

    public static void main(String[] args) throws Exception {
        String verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";            // example verifier from RFC 7636 Appendix B
        String sentWithLogin = challenge(verifier);
        System.out.println("code_challenge (S256): " + sentWithLogin);
        System.out.println("matches RFC 7636 example: " + sentWithLogin.equals("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"));
        // At the token exchange the server recomputes the challenge from the verifier the client now reveals.
        System.out.println("token exchange with right verifier: " + challenge(verifier).equals(sentWithLogin));
        System.out.println("token exchange with stolen code, guessed verifier: " + challenge("attacker-guess").equals(sentWithLogin));

        Set<String> write = Set.of("booking:read", "booking:write");
        System.out.println("u1 cancels b-100: " + cancel("u1", write, "b-100"));
        System.out.println("u1 cancels b-200: " + cancel("u1", write, "b-200"));
        System.out.println("u2 cancels b-200 with read-only scope: " + cancel("u2", Set.of("booking:read"), "b-200"));
    }
}
