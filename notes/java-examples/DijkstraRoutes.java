import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.TreeMap;

public class DijkstraRoutes {
    record Edge(String to, int cost) {}
    record Entry(String vertex, int dist) {}

    static void add(Map<String, List<Edge>> g, String a, String b, int cost) {
        g.computeIfAbsent(a, k -> new ArrayList<>()).add(new Edge(b, cost));
        g.computeIfAbsent(b, k -> new ArrayList<>()).add(new Edge(a, cost));
    }

    // Dijkstra with lazy deletion: skip stale queue entries. Needs non-negative costs.
    static Map<String, Integer> shortest(Map<String, List<Edge>> g, String src, Map<String, String> parent) {
        Map<String, Integer> dist = new TreeMap<>();
        PriorityQueue<Entry> pq = new PriorityQueue<>((x, y) -> x.dist() != y.dist()
            ? Integer.compare(x.dist(), y.dist()) : x.vertex().compareTo(y.vertex()));
        dist.put(src, 0);
        pq.add(new Entry(src, 0));
        while (!pq.isEmpty()) {
            Entry e = pq.poll();
            if (e.dist() > dist.get(e.vertex())) continue;   // stale
            for (Edge edge : g.getOrDefault(e.vertex(), List.of())) {
                int nd = e.dist() + edge.cost();
                if (nd < dist.getOrDefault(edge.to(), Integer.MAX_VALUE)) {
                    dist.put(edge.to(), nd);
                    parent.put(edge.to(), e.vertex());
                    pq.add(new Entry(edge.to(), nd));
                }
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        Map<String, List<Edge>> g = new TreeMap<>();
        add(g, "S", "T", 5);
        add(g, "S", "A", 1);
        add(g, "A", "T", 1);
        add(g, "T", "U", 2);
        Map<String, String> parent = new TreeMap<>();
        Map<String, Integer> dist = shortest(g, "S", parent);
        List<String> route = new ArrayList<>();
        for (String v = "T"; v != null; v = parent.get(v)) route.add(v);
        Collections.reverse(route);
        System.out.println("distances from S: " + dist);
        System.out.println("cheapest S->T: " + route + " cost " + dist.get("T") + " (BFS would pick S->T, 1 hop, cost 5)");
    }
}
