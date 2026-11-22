import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class HashLookups {
    record SeatId(String code) {
        SeatId {
            if (code == null || code.isBlank()) throw new IllegalArgumentException("blank seat code");
            code = code.strip().toUpperCase(java.util.Locale.ROOT);   // one canonical form for equals and hashCode
        }
    }

    // One pass: look up the complement seen earlier. Expected O(n) time, O(n) space.
    static int[] twoSum(int[] a, int target) {
        Map<Integer, Integer> seenAt = new HashMap<>();
        for (int i = 0; i < a.length; i++) {
            Integer j = seenAt.get(target - a[i]);
            if (j != null) return new int[] {j, i};
            seenAt.putIfAbsent(a[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        // Different strings, same hash: the map keeps both and equals tells them apart.
        System.out.println("\"Aa\".hashCode() = " + "Aa".hashCode() + ", \"BB\".hashCode() = " + "BB".hashCode());
        Map<String, Integer> m = new HashMap<>();
        m.put("Aa", 1);
        m.put("BB", 2);
        System.out.println("get Aa = " + m.get("Aa") + ", get BB = " + m.get("BB") + ", size " + m.size());
        Integer old = m.put("Aa", 10);                       // same key: replaces, does not add
        System.out.println("second put Aa returned " + old + ", size still " + m.size());

        Map<SeatId, String> owners = new HashMap<>();
        owners.put(new SeatId("a1"), "U1");
        System.out.println("lookup with ' A1 ' finds " + owners.get(new SeatId(" A1 ")));

        System.out.println("twoSum([2, 7, 11, 15], 9) = " + Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9)));
        System.out.println("twoSum([3, 3], 6) = " + Arrays.toString(twoSum(new int[] {3, 3}, 6)));
        System.out.println("twoSum([1, 2], 7) = " + Arrays.toString(twoSum(new int[] {1, 2}, 7)));
    }
}
