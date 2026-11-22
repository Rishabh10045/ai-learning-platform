import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class DuplicateIds {
    static boolean hasDuplicate(List<String> ids) {
        Set<String> seen = new HashSet<>();
        for (String id : ids) {
            if (!seen.add(id)) return true;      // add() returns false when the value is already present
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(hasDuplicate(List.of()));                 // false
        System.out.println(hasDuplicate(List.of("U1", "U2")));       // false
        System.out.println(hasDuplicate(List.of("U1", "U2", "U1"))); // true
        System.out.println(hasDuplicate(List.of("U1", "u1")));       // false: case-sensitive
    }
}
