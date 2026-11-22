import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

public class AccessRegressionTest {
    record Result(int status, String body) {}

    // System under test: a deliberately simple handler. Swap in the buggy version to see tests fail.
    static final Map<String, String> OWNER = Map.of("P", "U1");
    static Result secure(String caller, String id) {
        if (caller == null) return new Result(401, "unauthenticated");
        if (!caller.equals(OWNER.get(id))) return new Result(404, "not found");
        return new Result(200, "booking " + id + " seat 12C");
    }
    static Result buggy(String caller, String id) {   // checks login but forgets ownership (IDOR)
        if (caller == null) return new Result(401, "unauthenticated");
        return OWNER.containsKey(id) ? new Result(200, "booking " + id + " seat 12C") : new Result(404, "not found");
    }

    interface Handler { Result call(String caller, String id); }

    static List<String> run(Handler h) {
        List<String> failures = new ArrayList<>();
        check(failures, "owner reads own booking", h.call("U1", "P"), r -> r.status() == 200);
        check(failures, "anonymous gets 401", h.call(null, "P"), r -> r.status() == 401);
        check(failures, "other user is refused", h.call("U2", "P"), r -> r.status() == 404 || r.status() == 403);
        check(failures, "refusal leaks no booking data", h.call("U2", "P"), r -> !r.body().contains("12C"));
        check(failures, "missing and foreign look the same", h.call("U2", "Z"), r -> r.equals(h.call("U2", "P")));
        return failures;
    }

    static void check(List<String> failures, String name, Result r, Function<Result, Boolean> ok) {
        if (!ok.apply(r)) failures.add(name + " (got " + r.status() + ")");
    }

    public static void main(String[] args) {
        List<String> secureFailures = run(AccessRegressionTest::secure);
        List<String> buggyFailures = run(AccessRegressionTest::buggy);
        System.out.println("secure handler: " + (5 - secureFailures.size()) + "/5 pass");
        System.out.println("buggy handler : " + (5 - buggyFailures.size()) + "/5 pass");
        buggyFailures.forEach(f -> System.out.println("  FAIL " + f));
    }
}
