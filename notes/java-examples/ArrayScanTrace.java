import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.OptionalInt;

public class ArrayScanTrace {
    static int firstIndex(int[] values, int target) {
        for (int i = 0; i < values.length; i++) {
            if (values[i] == target) return i;
        }
        return -1;
    }

    static long[] prefix(int[] values) {
        long[] sums = new long[values.length + 1];
        for (int i = 0; i < values.length; i++) {
            sums[i + 1] = sums[i] + values[i];
        }
        return sums;
    }

    static long rangeSum(long[] sums, int from, int to) {
        if (from < 0 || from > to || to >= sums.length) {
            throw new IndexOutOfBoundsException("Invalid half-open range");
        }
        return sums[to] - sums[from];
    }

    static int insert(int[] buffer, int size, int index, int value) {
        if (size < 0 || size >= buffer.length || index < 0 || index > size) {
            throw new IllegalArgumentException("Invalid insertion or full buffer");
        }
        for (int i = size; i > index; i--) buffer[i] = buffer[i - 1];
        buffer[index] = value;
        return size + 1;
    }

    static int delete(int[] buffer, int size, int index) {
        if (size < 0 || size > buffer.length || index < 0 || index >= size) {
            throw new IllegalArgumentException("Invalid deletion");
        }
        for (int i = index; i < size - 1; i++) buffer[i] = buffer[i + 1];
        return size - 1;
    }

    static OptionalInt secondDistinctMaximum(int[] values) {
        long largest = Long.MIN_VALUE;
        long second = Long.MIN_VALUE;
        for (int value : values) {
            if (value > largest) {
                second = largest;
                largest = value;
            } else if (value < largest && value > second) {
                second = value;
            }
        }
        return second == Long.MIN_VALUE ? OptionalInt.empty() : OptionalInt.of((int) second);
    }

    static List<Integer> strictLeaders(int[] values) {
        List<Integer> leaders = new ArrayList<>();
        long maxOnRight = Long.MIN_VALUE;
        for (int i = values.length - 1; i >= 0; i--) {
            if (values[i] > maxOnRight) {
                leaders.add(values[i]);
                maxOnRight = values[i];
            }
        }
        Collections.reverse(leaders);
        return leaders;
    }

    static void require(boolean condition, String description) {
        if (!condition) throw new AssertionError(description);
    }

    public static void main(String[] args) {
        int[] values = { 4, -2, 7, 4 };
        long[] sums = prefix(values);
        require(firstIndex(values, 4) == 0, "Returns first match");
        require(firstIndex(values, 3) == -1 && firstIndex(new int[0], 4) == -1, "Missing target");
        require(rangeSum(sums, 1, 3) == 5 && rangeSum(sums, 2, 2) == 0, "Range sums");
        require(rangeSum(prefix(new int[] { Integer.MAX_VALUE, 1 }), 0, 2) == 2147483648L, "Wide sum");
        int[] buffer = { 4, 9, 0 };
        int size = insert(buffer, 2, 1, 7);
        require(size == 3 && buffer[1] == 7 && buffer[2] == 9, "Shift right");
        size = delete(buffer, size, 1);
        require(size == 2 && buffer[0] == 4 && buffer[1] == 9, "Shift left");
        require(secondDistinctMaximum(new int[] { 7, 7, -2 }).orElseThrow() == -2, "Distinct maximum");
        require(secondDistinctMaximum(new int[] { 7 }).isEmpty(), "No second maximum");
        require(secondDistinctMaximum(new int[] { 0, Integer.MIN_VALUE }).orElseThrow() == Integer.MIN_VALUE, "Minimum int is data");
        require(strictLeaders(new int[] { 8, 8, 3 }).equals(List.of(8, 3)), "Strict leader contract");
        require(strictLeaders(new int[0]).isEmpty(), "Empty leaders");
        System.out.println("firstIndex=0 rangeSum=5 second=-2 leaders=[8, 3]");
    }
}
