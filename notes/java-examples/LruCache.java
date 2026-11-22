import java.util.*;

public class LruCache<K, V> {
    // HashMap for O(1) lookup + doubly linked list for O(1) "move to most recent" and "evict least recent".
    private final class Node {
        final K key; V value; Node prev, next;
        Node(K key, V value) { this.key = key; this.value = value; }
    }

    private final int capacity;
    private final Map<K, Node> index = new HashMap<>();
    private final Node head = new Node(null, null), tail = new Node(null, null);   // sentinels: head.next is the LRU

    LruCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("capacity must be positive");
        this.capacity = capacity;
        head.next = tail; tail.prev = head;
    }

    V get(K key) {
        Node n = index.get(key);
        if (n == null) return null;
        unlink(n); append(n);                 // now the most recently used
        return n.value;
    }

    void put(K key, V value) {
        Node n = index.get(key);
        if (n != null) { n.value = value; unlink(n); append(n); return; }
        if (index.size() == capacity) {       // evict the least recently used
            Node lru = head.next;
            unlink(lru); index.remove(lru.key);
        }
        n = new Node(key, value);
        index.put(key, n); append(n);
    }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }

    private void append(Node n) { n.prev = tail.prev; n.next = tail; tail.prev.next = n; tail.prev = n; }

    public String toString() {                // least recent first
        StringJoiner j = new StringJoiner(", ", "[", "]");
        for (Node n = head.next; n != tail; n = n.next) j.add(n.key + "=" + n.value);
        return j.toString();
    }

    public static void main(String[] args) {
        LruCache<String, String> cache = new LruCache<>(2);
        cache.put("A1", "free");
        cache.put("A2", "held");
        System.out.println("get A1 -> " + cache.get("A1") + "   order " + cache);
        cache.put("A3", "free");              // evicts A2, the least recently used
        System.out.println("after put A3: " + cache + "   get A2 -> " + cache.get("A2"));
        cache.put("A1", "sold");              // update moves A1 to most recent
        cache.put("A4", "free");              // evicts A3
        System.out.println("after update A1 and put A4: " + cache);
    }
}
