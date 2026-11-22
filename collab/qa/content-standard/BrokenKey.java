import java.util.*;

public class BrokenKey {
    // equals() overridden but hashCode() NOT: breaks the contract.
    static final class Point {
        final int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }
        @Override public boolean equals(Object o) {
            return o instanceof Point p && p.x == x && p.y == y;
        }
    }
    // Fixed version: equal objects must have equal hash codes.
    record FixedPoint(int x, int y) { }

    public static void main(String[] args) {
        Map<Point, String> broken = new HashMap<>();
        broken.put(new Point(1, 2), "A");
        System.out.println("broken get  -> " + broken.get(new Point(1, 2)));   // almost always null

        Map<FixedPoint, String> fixed = new HashMap<>();
        fixed.put(new FixedPoint(1, 2), "A");
        System.out.println("record get  -> " + fixed.get(new FixedPoint(1, 2))); // A

        // Mutable key pitfall: mutate after insert and the entry is "lost".
        List<Integer> key = new ArrayList<>(List.of(1));
        Map<List<Integer>, String> m = new HashMap<>();
        m.put(key, "v");
        key.add(2);                                   // hashCode changes
        System.out.println("mutated key -> " + m.get(key) + ", size=" + m.size()); // null, size=1
    }
}
