import java.util.*;

public class BeanOrder {
    // Kahn's algorithm: create a bean only after everything it depends on exists.
    static List<String> creationOrder(Map<String, List<String>> dependsOn) {
        Map<String, Integer> missing = new TreeMap<>();           // bean -> number of dependencies not yet created
        Map<String, List<String>> neededBy = new HashMap<>();     // dependency -> beans waiting for it
        for (var e : dependsOn.entrySet()) {
            missing.putIfAbsent(e.getKey(), 0);
            for (String dep : e.getValue()) {
                missing.putIfAbsent(dep, 0);
                missing.merge(e.getKey(), 1, Integer::sum);
                neededBy.computeIfAbsent(dep, k -> new ArrayList<>()).add(e.getKey());
            }
        }
        PriorityQueue<String> ready = new PriorityQueue<>();      // alphabetical among ready beans, for a stable order
        missing.forEach((bean, n) -> { if (n == 0) ready.add(bean); });
        List<String> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            String bean = ready.poll();
            order.add(bean);
            for (String waiting : neededBy.getOrDefault(bean, List.of()))
                if (missing.merge(waiting, -1, Integer::sum) == 0) ready.add(waiting);
        }
        if (order.size() < missing.size()) {
            List<String> stuck = new ArrayList<>();
            missing.forEach((bean, n) -> { if (n > 0) stuck.add(bean); });
            throw new IllegalStateException("circular dependency among " + stuck);
        }
        return order;
    }

    public static void main(String[] args) {
        Map<String, List<String>> app = Map.of(
                "bookingController", List.of("bookingService"),
                "bookingService", List.of("seatRepository", "clock", "auditService"),
                "auditService", List.of("dataSource"),
                "seatRepository", List.of("dataSource"));
        System.out.println("creation order: " + creationOrder(app));
        try {
            creationOrder(Map.of("a", List.of("b"), "b", List.of("c"), "c", List.of("a"), "d", List.of()));
        } catch (IllegalStateException e) {
            System.out.println(e.getMessage());
        }
    }
}
