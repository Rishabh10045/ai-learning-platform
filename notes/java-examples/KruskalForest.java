import java.util.*;

public class KruskalForest {
    record Edge(int u, int v, int w) {
        public String toString() { return u + "-" + v + "(" + w + ")"; }
    }

    static int[] parent, size;

    static int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }   // path halving
        return x;
    }

    static boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                       // same component: this edge would close a cycle
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra; size[ra] += size[rb];
        return true;
    }

    // Kruskal: sort by weight (ties by endpoints, so the output is deterministic), keep each edge whose union succeeds.
    static List<Edge> kruskal(int n, List<Edge> edges) {
        parent = new int[n]; size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        List<Edge> sorted = new ArrayList<>(edges);
        sorted.sort(Comparator.comparingInt(Edge::w).thenComparingInt(Edge::u).thenComparingInt(Edge::v));
        List<Edge> kept = new ArrayList<>();
        for (Edge e : sorted) if (union(e.u(), e.v())) kept.add(e);
        return kept;
    }

    static int cost(List<Edge> es) { return es.stream().mapToInt(Edge::w).sum(); }

    // Brute force for small graphs: the cheapest acyclic edge subset with the maximum possible number of edges.
    static int bruteForce(int n, List<Edge> edges) {
        int best = Integer.MAX_VALUE, bestCount = -1;
        for (int mask = 0; mask < (1 << edges.size()); mask++) {
            parent = new int[n]; size = new int[n];
            for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
            boolean acyclic = true; int count = 0, c = 0;
            for (int i = 0; i < edges.size() && acyclic; i++) if ((mask >> i & 1) == 1) {
                Edge e = edges.get(i);
                acyclic = union(e.u(), e.v()); count++; c += e.w();
            }
            if (!acyclic) continue;
            if (count > bestCount || (count == bestCount && c < best)) { bestCount = count; best = c; }
        }
        return best;
    }

    public static void main(String[] args) {
        // 6 vertices: 0..4 connected, 5 isolated; a duplicate edge, a tie and one negative weight.
        List<Edge> edges = List.of(new Edge(0, 1, 4), new Edge(0, 2, 1), new Edge(1, 2, 2), new Edge(1, 3, 5),
                new Edge(2, 3, 8), new Edge(3, 4, -3), new Edge(2, 4, 5), new Edge(0, 2, 1));
        List<Edge> forest = kruskal(6, edges);
        Set<Integer> roots = new TreeSet<>();
        for (int v = 0; v < 6; v++) roots.add(find(v));
        System.out.println("kept " + forest + " cost " + cost(forest));
        System.out.println("edges " + forest.size() + " = V - components = 6 - " + roots.size());
        System.out.println("brute force minimum: " + bruteForce(6, edges));

        // Maximum spanning tree: same algorithm on negated weights.
        List<Edge> negated = edges.stream().map(e -> new Edge(e.u(), e.v(), -e.w())).toList();
        System.out.println("maximum spanning forest cost: " + -cost(kruskal(6, negated)));
        System.out.println("empty graph: " + kruskal(0, List.of()) + " cost " + cost(kruskal(0, List.of())));
    }
}
