import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class Components {
    // Count connected components with an iterative DFS from every unvisited vertex.
    static int[] label(List<List<Integer>> adj) {
        int n = adj.size();
        int[] comp = new int[n];
        java.util.Arrays.fill(comp, -1);
        int count = 0;
        for (int s = 0; s < n; s++) {
            if (comp[s] != -1) continue;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(s);
            comp[s] = count;
            while (!stack.isEmpty()) {
                int v = stack.pop();
                for (int w : adj.get(v)) {
                    if (comp[w] == -1) { comp[w] = count; stack.push(w); }
                }
            }
            count++;
        }
        return comp;
    }

    // Directed cycle check: a back edge to a vertex still on the DFS path (GREY) means a cycle.
    static boolean hasCycle(List<List<Integer>> adj) {
        int[] colour = new int[adj.size()];   // 0 white, 1 grey, 2 black
        for (int s = 0; s < adj.size(); s++) if (colour[s] == 0 && dfs(adj, s, colour)) return true;
        return false;
    }

    static boolean dfs(List<List<Integer>> adj, int v, int[] colour) {
        colour[v] = 1;
        for (int w : adj.get(v)) {
            if (colour[w] == 1) return true;
            if (colour[w] == 0 && dfs(adj, w, colour)) return true;
        }
        colour[v] = 2;
        return false;
    }

    static List<List<Integer>> undirected(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
        return adj;
    }

    static List<List<Integer>> directed(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]);
        return adj;
    }

    public static void main(String[] args) {
        int[] comp = label(undirected(7, new int[][] {{0, 1}, {1, 2}, {3, 4}, {5, 5}}));
        int groups = java.util.Arrays.stream(comp).max().getAsInt() + 1;
        System.out.println("components: " + groups + ", labels " + java.util.Arrays.toString(comp));
        System.out.println("tasks 0->1->2, 0->2: cycle " + hasCycle(directed(3, new int[][] {{0, 1}, {1, 2}, {0, 2}})));
        System.out.println("tasks 0->1->2->0: cycle " + hasCycle(directed(3, new int[][] {{0, 1}, {1, 2}, {2, 0}})));
    }
}
