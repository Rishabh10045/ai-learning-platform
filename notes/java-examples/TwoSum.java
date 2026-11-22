import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class TwoSum {
    // Returns indices {i, j} with i < j and nums[i] + nums[j] == target, or an empty array.
    static int[] twoSum(int[] nums, int target) {
        Map<Long, Integer> indexOf = new HashMap<>();
        for (int j = 0; j < nums.length; j++) {
            Integer i = indexOf.get((long) target - nums[j]);   // look up the partner before inserting
            if (i != null) return new int[] { i, j };
            indexOf.put((long) nums[j], j);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        if (twoSum(new int[] {Integer.MAX_VALUE, 1}, Integer.MIN_VALUE).length != 0) {
            throw new AssertionError("Wrapped sum must not match the target");
        }
        System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9))); // [0, 1]
        System.out.println(Arrays.toString(twoSum(new int[] {3, 3}, 6)));         // [0, 1]
        System.out.println(Arrays.toString(twoSum(new int[] {1, 2}, 7)));         // []
    }
}
