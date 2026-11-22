import java.util.*;

// A trie for exact lookup and prefix search over policy codes and words.
public class PrefixTrie {
    static final class Node {
        final Map<Character, Node> next = new TreeMap<>();
        boolean end;
        int count; // words passing through this node
    }
    private final Node root = new Node();

    void insert(String word) {
        Node n = root;
        for (char c : word.toCharArray()) {
            n = n.next.computeIfAbsent(c, x -> new Node());
            n.count++;
        }
        n.end = true;
    }

    private Node walk(String s) {
        Node n = root;
        for (char c : s.toCharArray()) {
            n = n.next.get(c);
            if (n == null) return null;
        }
        return n;
    }

    boolean contains(String word) { Node n = walk(word); return n != null && n.end; }
    int countPrefix(String prefix) { Node n = walk(prefix); return n == null ? 0 : n.count; }

    List<String> withPrefix(String prefix, int limit) {
        List<String> out = new ArrayList<>();
        Node n = walk(prefix);
        if (n != null) collect(n, new StringBuilder(prefix), out, limit);
        return out;
    }

    private void collect(Node n, StringBuilder sb, List<String> out, int limit) {
        if (out.size() >= limit) return;
        if (n.end) out.add(sb.toString());
        for (var e : n.next.entrySet()) {
            sb.append(e.getKey());
            collect(e.getValue(), sb, out, limit);
            sb.deleteCharAt(sb.length() - 1);
        }
    }

    public static void main(String[] args) {
        PrefixTrie t = new PrefixTrie();
        for (String w : List.of("CANCEL-02", "CANCEL-04", "CANCEL-10", "CAPACITY-01", "REFUND-01")) t.insert(w);
        System.out.println("contains CANCEL-04 = " + t.contains("CANCEL-04"));
        System.out.println("contains CANCEL-0  = " + t.contains("CANCEL-0"));
        System.out.println("prefix CANCEL-     = " + t.withPrefix("CANCEL-", 10));
        System.out.println("count  CA          = " + t.countPrefix("CA"));
        System.out.println("prefix CANCEL-, limit 2 = " + t.withPrefix("CANCEL-", 2));
        System.out.println("prefix XYZ         = " + t.withPrefix("XYZ", 5));
    }
}
