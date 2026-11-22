import java.util.*;

public class WeightedPaths {
    record Edge(int to, int w) {}

    static List<List<Edge>> graph(int n, int[][] edges) {
        List<List<Edge>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) g.get(e[0]).add(new Edge(e[1], e[2]));
        return g;
    }

    // Dijkstra: correct only when every edge weight is >= 0. Lazy deletion skips stale queue entries.
    static long[] dijkstra(List<List<Edge>> g, int src) {
        long[] dist = new long[g.size()];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[1]));
        pq.add(new long[] {src, 0});
        boolean[] done = new boolean[g.size()];
        while (!pq.isEmpty()) {
            int u = (int) pq.poll()[0];
            if (done[u]) continue;
            done[u] = true;                                   // dist[u] is final, assuming no negative edges
            for (Edge e : g.get(u))
                if (!done[e.to()] && dist[u] + e.w() < dist[e.to()]) {
                    dist[e.to()] = dist[u] + e.w();
                    pq.add(new long[] {e.to(), dist[e.to()]});
                }
        }
        return dist;
    }

    // DAG shortest paths: relax edges in topological order. Works with negative weights, needs no cycles.
    static long[] dagShortest(List<List<Edge>> g, int src) {
        int n = g.size();
        int[] indeg = new int[n];
        for (List<Edge> es : g) for (Edge e : es) indeg[e.to()]++;
        Deque<Integer> ready = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) ready.add(i);
        List<Integer> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            int u = ready.poll();
            order.add(u);
            for (Edge e : g.get(u)) if (--indeg[e.to()] == 0) ready.add(e.to());
        }
        if (order.size() < n) throw new IllegalArgumentException("cycle: no topological order");
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        for (int u : order) {
            if (dist[u] == Long.MAX_VALUE) continue;
            for (Edge e : g.get(u)) dist[e.to()] = Math.min(dist[e.to()], dist[u] + e.w());
        }
        return dist;
    }

    public static void main(String[] args) {
        // Travel minutes between venue gates (directed): 0 entrance, 1 lobby, 2 hall A, 3 hall B, 4 seats.
        List<List<Edge>> venue = graph(5, new int[][] {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}, {2, 3, 5}, {3, 4, 3}});
        System.out.println("Dijkstra from 0:     " + Arrays.toString(dijkstra(venue, 0)));
        System.out.println("DAG relaxation:      " + Arrays.toString(dagShortest(venue, 0)));

        // Same shape, but a voucher makes edge 1->3 cost -4 (a negative weight).
        List<List<Edge>> withVoucher = graph(4, new int[][] {{0, 1, 5}, {0, 2, 2}, {1, 3, -4}, {2, 3, 1}});
        System.out.println("negative edge, DAG:  " + Arrays.toString(dagShortest(withVoucher, 0)));
        System.out.println("negative edge, Dijkstra (wrong): " + Arrays.toString(dijkstra(withVoucher, 0)));
        try {
            dagShortest(graph(3, new int[][] {{0, 1, 1}, {1, 2, 1}, {2, 0, 1}}), 0);
        } catch (IllegalArgumentException e) {
            System.out.println("cyclic graph: " + e.getMessage());
        }
    }
}
