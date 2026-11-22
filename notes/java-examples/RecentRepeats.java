import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class RecentRepeats {
    // Is any request ID repeated within k positions? Keep a sliding set of the last k IDs: O(n) time, O(k) space.
    static boolean repeatWithin(String[] ids, int k) {
        Set<String> window = new HashSet<>();
        for (int i = 0; i < ids.length; i++) {
            if (!window.add(ids[i])) return true;          // add returns false if already present
            if (window.size() > k) window.remove(ids[i - k]);
        }
        return false;
    }

    // Is any key repeated within ttl time units? Remember when each key was last seen.
    static int replaysWithin(String[] keys, long[] at, long ttl) {
        Map<String, Long> lastSeen = new HashMap<>();
        int replays = 0;
        for (int i = 0; i < keys.length; i++) {
            Long prev = lastSeen.get(keys[i]);
            if (prev != null && at[i] - prev < ttl) replays++;
            else lastSeen.put(keys[i], at[i]);              // first use, or the old record expired
        }
        return replays;
    }

    public static void main(String[] args) {
        String[] ids = {"k1", "k2", "k3", "k1", "k4"};
        System.out.println("repeat within 3: " + repeatWithin(ids, 3));
        System.out.println("repeat within 2: " + repeatWithin(ids, 2));
        String[] keys = {"a", "b", "a", "a", "b"};
        long[] at = {0, 10, 50, 200, 400};
        System.out.println("replays within ttl 100: " + replaysWithin(keys, at, 100));
        System.out.println("replays within ttl 1000: " + replaysWithin(keys, at, 1000));
    }
}
