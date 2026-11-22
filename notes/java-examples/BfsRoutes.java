import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class BfsRoutes {
    // Undirected graph as adjacency lists; TreeMap keeps neighbour order deterministic.
    static Map<String, List<String>> graph(String... edges) {
        Map<String, List<String>> g = new TreeMap<>();
        for (String e : edges) {
            String[] p = e.split("-");
            g.computeIfAbsent(p[0], k -> new ArrayList<>()).add(p[1]);
            g.computeIfAbsent(p[1], k -> new ArrayList<>()).add(p[0]);
        }
        return g;
    }

    // Multi-source BFS: every source starts at distance 0. Mark on enqueue.
    static Map<String, String> bfs(Map<String, List<String>> g, List<String> sources, Map<String, Integer> dist) {
        Map<String, String> parent = new TreeMap<>();
        Deque<String> queue = new ArrayDeque<>();
        for (String s : sources) { dist.put(s, 0); queue.add(s); }
        int enqueues = sources.size();
        while (!queue.isEmpty()) {
            String v = queue.poll();
            for (String w : g.getOrDefault(v, List.of())) {
                if (dist.containsKey(w)) continue;      // already discovered
                dist.put(w, dist.get(v) + 1);
                parent.put(w, v);
                queue.add(w);
                enqueues++;
            }
        }
        dist.put("#enqueues", enqueues);
        return parent;
    }

    static List<String> path(Map<String, String> parent, Map<String, Integer> dist, String target) {
        if (!dist.containsKey(target)) return List.of();   // unreachable
        List<String> p = new ArrayList<>();
        for (String v = target; v != null; v = parent.get(v)) p.add(v);
        Collections.reverse(p);
        return p;
    }

    public static void main(String[] args) {
        Map<String, List<String>> g = graph("A-B", "A-C", "C-D", "B-E", "E-D");
        g.put("Z", new ArrayList<>());                    // isolated seat
        Map<String, Integer> dist = new TreeMap<>();
        Map<String, String> parent = bfs(g, List.of("A"), dist);
        int enq = dist.remove("#enqueues");
        System.out.println("from A: dist " + dist + ", enqueues " + enq);
        System.out.println("route A->D: " + path(parent, dist, "D"));
        System.out.println("route A->Z: " + path(parent, dist, "Z") + " (unreachable)");

        Map<String, Integer> multi = new TreeMap<>();
        Map<String, String> p2 = bfs(g, List.of("B", "D"), multi);
        multi.remove("#enqueues");
        System.out.println("two entrances B and D: dist " + multi + ", E reached via " + p2.get("E"));
    }
}
