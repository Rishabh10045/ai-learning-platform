import java.util.*;

// LRU cache from a HashMap of node references plus a doubly linked list, with an invariant check after every step.
public class LruNodes {
    static final class Node { final String key; int value; Node prev, next; Node(String k, int v) { key = k; value = v; } }
    private final int capacity;
    private final Map<String, Node> map = new HashMap<>();
    private final Node head = new Node("HEAD", 0), tail = new Node("TAIL", 0);   // sentinels: head.next = most recent

    LruNodes(int capacity) { if (capacity < 1) throw new IllegalArgumentException("capacity >= 1"); this.capacity = capacity; head.next = tail; tail.prev = head; }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void addFront(Node n) { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }

    Integer get(String key) {
        Node n = map.get(key);                 // O(1): the map hands us the node itself
        if (n == null) return null;
        unlink(n); addFront(n);                // a read CHANGES recency
        return n.value;
    }

    void put(String key, int value) {
        Node n = map.get(key);
        if (n != null) { n.value = value; unlink(n); addFront(n); return; }
        if (map.size() == capacity) { Node lru = tail.prev; unlink(lru); map.remove(lru.key); }   // remove from BOTH
        n = new Node(key, value); map.put(key, n); addFront(n);
    }

    List<String> order() { List<String> o = new ArrayList<>(); for (Node n = head.next; n != tail; n = n.next) o.add(n.key); return o; }

    void checkInvariant() {
        List<String> o = order();
        if (o.size() != map.size() || !new HashSet<>(o).equals(map.keySet()) || o.size() > capacity)
            throw new IllegalStateException("map " + map.keySet() + " vs list " + o);
    }

    public static void main(String[] args) {
        LruNodes c = new LruNodes(2);
        c.put("A", 1); c.checkInvariant();
        c.put("B", 2); c.checkInvariant();
        System.out.println("get(A) = " + c.get("A") + ", order " + c.order()); c.checkInvariant();
        c.put("C", 3); c.checkInvariant();
        System.out.println("after put(C): order " + c.order() + ", get(B) = " + c.get("B"));
        c.put("A", 10); c.checkInvariant();
        System.out.println("update A: order " + c.order() + ", get(A) = " + c.get("A"));
        LruNodes one = new LruNodes(1);
        one.put("X", 1); one.put("Y", 2); one.checkInvariant();
        System.out.println("capacity 1: order " + one.order() + ", get(X) = " + one.get("X"));
    }
}
