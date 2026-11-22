import java.util.*;

// Breadth-first search: shortest walk from the entrance to a seat in a venue grid ('#' = blocked).
public class GridBfs {
    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    static int shortest(String[] grid, int sr, int sc, int tr, int tc) {
        int rows = grid.length, cols = grid[0].length();
        if (grid[sr].charAt(sc) == '#' || grid[tr].charAt(tc) == '#') return -1;
        int[][] dist = new int[rows][cols];
        for (int[] row : dist) Arrays.fill(row, -1);
        Deque<int[]> q = new ArrayDeque<>();
        q.add(new int[]{sr, sc});
        dist[sr][sc] = 0;
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            if (cur[0] == tr && cur[1] == tc) return dist[tr][tc];
            for (int[] d : DIRS) {
                int r = cur[0] + d[0], c = cur[1] + d[1];
                if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r].charAt(c) == '#' || dist[r][c] >= 0) continue;
                dist[r][c] = dist[cur[0]][cur[1]] + 1;      // mark when queued, so each cell is queued once
                q.add(new int[]{r, c});
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        String[] venue = {
            "E..#....",
            ".#.#.##.",
            ".#...#..",
            "...#.#.S"};
        System.out.println("entrance (0,0) -> seat (3,7): " + shortest(venue, 0, 0, 3, 7) + " steps");
        System.out.println("start = target: " + shortest(venue, 0, 0, 0, 0));
        System.out.println("target blocked: " + shortest(venue, 0, 0, 0, 3));
        String[] walled = {"E#.", "##.", "..S"};
        System.out.println("unreachable   : " + shortest(walled, 0, 0, 2, 2));
    }
}
