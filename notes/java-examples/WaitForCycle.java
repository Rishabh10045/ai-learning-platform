import java.util.*;

public class WaitForCycle {
    // Wait-for graph: an edge T1 -> T2 means "T1 waits for a lock that T2 holds". A cycle means deadlock.
    static List<String> findCycle(Map<String, List<String>> waitsFor) {
        Map<String, Integer> color = new HashMap<>();   // absent = unvisited, 1 = on the current path, 2 = done
        Deque<String> path = new ArrayDeque<>();
        for (String start : new TreeSet<>(waitsFor.keySet())) {
            List<String> cycle = dfs(start, waitsFor, color, path);
            if (cycle != null) return cycle;
        }
        return List.of();
    }

    static List<String> dfs(String node, Map<String, List<String>> g, Map<String, Integer> color, Deque<String> path) {
        Integer c = color.get(node);
        if (c != null && c == 2) return null;
        if (c != null && c == 1) {                      // back edge: the cycle is the path from node to the top
            List<String> cycle = new ArrayList<>();
            boolean in = false;
            for (Iterator<String> it = path.descendingIterator(); it.hasNext(); ) {
                String p = it.next();
                if (p.equals(node)) in = true;
                if (in) cycle.add(p);
            }
            cycle.add(node);
            return cycle;
        }
        color.put(node, 1);
        path.push(node);
        for (String next : g.getOrDefault(node, List.of())) {
            List<String> cycle = dfs(next, g, color, path);
            if (cycle != null) return cycle;
        }
        path.pop();
        color.put(node, 2);
        return null;
    }

    public static void main(String[] args) {
        Map<String, List<String>> healthy = Map.of(
                "booking", List.of("pool"), "refund", List.of("pool"), "pool", List.of());
        Map<String, List<String>> stuck = Map.of(
                "booking", List.of("refund"), "refund", List.of("audit"), "audit", List.of("booking"), "report", List.of("audit"));
        System.out.println("healthy cycle: " + findCycle(healthy));
        System.out.println("stuck cycle: " + String.join(" -> ", findCycle(stuck)));
    }
}
