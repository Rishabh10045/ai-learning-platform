import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

public class VenueGroups {
    // Union-find (disjoint sets) with path compression and union by size.
    static int[] parent, size;

    static int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    }

    static boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;          // already connected
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }

    public static void main(String[] args) {
        String[] venues = {"A", "B", "C", "D", "E", "F"};
        int n = venues.length;
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        // Venues that share a support team: staff of one may see bookings of the other.
        int[][] shared = {{0, 1}, {1, 2}, {3, 4}, {0, 2}};
        for (int[] s : shared)
            System.out.println("share " + venues[s[0]] + "-" + venues[s[1]] + ": " + (union(s[0], s[1]) ? "merged" : "already in one group"));
        Map<Integer, TreeSet<String>> groups = new TreeMap<>();
        for (int i = 0; i < n; i++) groups.computeIfAbsent(find(i), k -> new TreeSet<>()).add(venues[i]);
        System.out.println("groups: " + groups.values());
        System.out.println("A and C same team: " + (find(0) == find(2)) + ", A and D: " + (find(0) == find(3)));
    }
}
