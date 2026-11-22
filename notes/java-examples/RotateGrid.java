import java.util.*;

public class RotateGrid {
    // Clockwise rotation of an r x c grid gives a c x r grid: new[j][r - 1 - i] = old[i][j].
    static int[][] rotateClockwise(int[][] g) {
        int r = g.length, c = g[0].length;
        int[][] out = new int[c][r];
        for (int i = 0; i < r; i++)
            for (int j = 0; j < c; j++) out[j][r - 1 - i] = g[i][j];
        return out;
    }

    // In place for a square n x n grid: transpose, then reverse every row. O(n^2) time, O(1) extra space.
    static void rotateSquareInPlace(int[][] m) {
        int n = m.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) { int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t; }
        for (int[] row : m)
            for (int a = 0, b = n - 1; a < b; a++, b--) { int t = row[a]; row[a] = row[b]; row[b] = t; }
    }

    static String show(int[][] g) {
        StringJoiner j = new StringJoiner(" / ");
        for (int[] row : g) j.add(Arrays.toString(row));
        return j.toString();
    }

    public static void main(String[] args) {
        int[][] seats = {{1, 2, 3}, {4, 5, 6}};                     // 2 rows x 3 columns
        int[][] turned = rotateClockwise(seats);
        System.out.println("2x3: " + show(seats));
        System.out.println("rotated 3x2: " + show(turned));
        System.out.println("four rotations restore it: " + Arrays.deepEquals(seats, rotateClockwise(rotateClockwise(rotateClockwise(turned)))));
        int[][] square = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        rotateSquareInPlace(square);
        System.out.println("3x3 in place: " + show(square));
    }
}
