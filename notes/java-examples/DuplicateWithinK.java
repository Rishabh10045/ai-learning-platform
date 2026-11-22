import java.util.HashMap;
import java.util.Map;

public class DuplicateWithinK {
    // true if some value appears at indices i < j with j - i <= k
    static boolean nearbyDuplicate(int[] nums, int k) {
        Map<Integer, Integer> lastIndex = new HashMap<>();
        for (int j = 0; j < nums.length; j++) {
            Integer i = lastIndex.put(nums[j], j);       // put returns the previous index (or null)
            if (i != null && j - i <= k) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(nearbyDuplicate(new int[] {1, 2, 3, 1}, 3));       // true  (distance 3)
        System.out.println(nearbyDuplicate(new int[] {1, 0, 1, 1}, 1));       // true  (last two)
        System.out.println(nearbyDuplicate(new int[] {1, 2, 3, 1, 2, 3}, 2)); // false (all distances 3)
    }
}
