import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

public class TokenCheck {
    // Teaching model of what a resource server checks on every request. Real services use Spring Security's
    // resource server with RS256/ES256 keys from the issuer's JWKS endpoint; HS256 with a shared demo key keeps this short.
    static final byte[] KEY = "demo-key-not-for-production-use!".getBytes(StandardCharsets.UTF_8);
    static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    static final long NOW = 1_800_000_000L;   // fixed clock (seconds) so the output is repeatable

    static String sign(String payloadJson) throws Exception {
        String header = B64.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = B64.encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + "." + B64.encodeToString(hmac(header + "." + payload));
    }

    static byte[] hmac(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(KEY, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    // Tiny claim reader for this demo's flat JSON only (a real service uses a JSON library via Spring Security).
    static String claim(String json, String name) {
        int i = json.indexOf("\"" + name + "\":");
        if (i < 0) return null;
        int start = i + name.length() + 3;
        if (json.charAt(start) == '"') return json.substring(start + 1, json.indexOf('"', start + 1));
        int end = start;
        while (end < json.length() && Character.isDigit(json.charAt(end))) end++;
        return json.substring(start, end);
    }

    static String check(String authorization, String requiredScope) throws Exception {
        if (authorization == null || !authorization.startsWith("Bearer ")) return "401 missing token";
        String[] parts = authorization.substring(7).split("\\.");
        if (parts.length != 3) return "401 malformed token";
        byte[] expected = hmac(parts[0] + "." + parts[1]);
        if (!MessageDigest.isEqual(expected, Base64.getUrlDecoder().decode(parts[2]))) return "401 bad signature";
        String json = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        if (!"https://id.example.com".equals(claim(json, "iss"))) return "401 wrong issuer";
        if (Long.parseLong(claim(json, "exp")) <= NOW) return "401 expired";
        if (!"booking-api".equals(claim(json, "aud"))) return "401 wrong audience";
        List<String> scopes = Arrays.asList(Objects.requireNonNullElse(claim(json, "scope"), "").split(" "));
        if (!scopes.contains(requiredScope)) return "403 insufficient_scope (needs " + requiredScope + ")";
        return "200 ok for " + claim(json, "sub");
    }

    public static void main(String[] args) throws Exception {
        String good = sign("{\"iss\":\"https://id.example.com\",\"sub\":\"u1\",\"aud\":\"booking-api\",\"scope\":\"booking:read booking:write\",\"exp\":1800000600}");
        String readOnly = sign("{\"iss\":\"https://id.example.com\",\"sub\":\"u2\",\"aud\":\"booking-api\",\"scope\":\"booking:read\",\"exp\":1800000600}");
        String forHelp = sign("{\"iss\":\"https://id.example.com\",\"sub\":\"u1\",\"aud\":\"help-api\",\"scope\":\"booking:write\",\"exp\":1800000600}");
        String expired = sign("{\"iss\":\"https://id.example.com\",\"sub\":\"u1\",\"aud\":\"booking-api\",\"scope\":\"booking:write\",\"exp\":1799999999}");
        String tampered = good.substring(0, good.lastIndexOf('.')) + "." + B64.encodeToString(new byte[32]);

        Map<String, String> cases = new LinkedHashMap<>();
        cases.put("no header", null);
        cases.put("tampered signature", "Bearer " + tampered);
        cases.put("expired", "Bearer " + expired);
        cases.put("token for help-api", "Bearer " + forHelp);
        cases.put("read-only token", "Bearer " + readOnly);
        cases.put("valid token", "Bearer " + good);
        for (var c : cases.entrySet()) System.out.println("POST /bookings, " + c.getKey() + " -> " + check(c.getValue(), "booking:write"));
    }
}
