import java.util.*;

public class DisjointSet {
    // Union-find with path compression and union by size: near-constant time per operation.
    private final int[] parent, size;

    DisjointSet(int n) {
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                      // already connected
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra; size[ra] += size[rb];
        return true;
    }

    public static void main(String[] args) {
        // Events 0..6. A pair (a, b) means "event b was caused by event a" (same saga / correlation).
        String[] events = {"hold A1", "charge ana", "ticket A1", "hold B2", "refund ana", "release A1", "hold C3"};
        int[][] causedBy = {{0, 1}, {1, 2}, {3, 3}, {1, 4}, {4, 5}};
        DisjointSet ds = new DisjointSet(events.length);
        for (int[] p : causedBy) ds.union(p[0], p[1]);

        Map<Integer, List<String>> groups = new TreeMap<>();
        for (int i = 0; i < events.length; i++) groups.computeIfAbsent(ds.find(i), k -> new ArrayList<>()).add(events[i]);
        System.out.println("sagas: " + groups.size());
        groups.values().forEach(g -> System.out.println("  " + g));
        System.out.println("union(2, 5) adds a link: " + ds.union(2, 5));
    }
}
