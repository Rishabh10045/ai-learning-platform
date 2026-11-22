import java.util.ArrayList;
import java.util.List;

public class SpiralGrid {
    // Walk the outer ring, then shrink the four bounds. Each cell is visited once: O(rows × cols).
    static List<Integer> spiral(int[][] g) {
        List<Integer> out = new ArrayList<>();
        if (g.length == 0) return out;
        int top = 0, bottom = g.length - 1, left = 0, right = g[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(g[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) out.add(g[r][right]);
            right--;
            if (top <= bottom) { for (int c = right; c >= left; c--) out.add(g[bottom][c]); bottom--; }
            if (left <= right) { for (int r = bottom; r >= top; r--) out.add(g[r][left]); left++; }
        }
        return out;
    }

    // Validate a seat map before using it: rectangular, values in range. Fail with a clear message.
    static void validate(int[][] g) {
        for (int r = 0; r < g.length; r++) {
            if (g[r].length != g[0].length) throw new IllegalArgumentException("row " + r + " has " + g[r].length + " seats, expected " + g[0].length);
            for (int v : g[r]) if (v < 0) throw new IllegalArgumentException("negative seat number in row " + r);
        }
    }

    public static void main(String[] args) {
        int[][] square = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        int[][] wide = {{1, 2, 3, 4}, {5, 6, 7, 8}};
        int[][] column = {{1}, {2}, {3}};
        System.out.println("3x3: " + spiral(square));
        System.out.println("2x4: " + spiral(wide));
        System.out.println("3x1: " + spiral(column));
        try {
            validate(new int[][] {{1, 2}, {3}});
        } catch (IllegalArgumentException e) {
            System.out.println("invalid map: " + e.getMessage());
        }
    }
}
