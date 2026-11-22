import java.util.ArrayList;
import java.util.List;

public class BstChecks {
    static final class Node {
        final int key; Node left, right;
        Node(int key) { this.key = key; }
    }

    static Node insert(Node n, int key) {
        if (n == null) return new Node(key);
        if (key < n.key) n.left = insert(n.left, key);
        else if (key > n.key) n.right = insert(n.right, key);   // duplicates ignored
        return n;
    }

    // Every node must lie inside bounds inherited from all its ancestors, not just its parent.
    static boolean isBst(Node n, long low, long high) {
        if (n == null) return true;
        if (n.key <= low || n.key >= high) return false;
        return isBst(n.left, low, n.key) && isBst(n.right, n.key, high);
    }

    // Visit only the subtrees that can contain keys in [lo, hi].
    static void range(Node n, int lo, int hi, List<Integer> out) {
        if (n == null) return;
        if (lo < n.key) range(n.left, lo, hi, out);
        if (lo <= n.key && n.key <= hi) out.add(n.key);
        if (n.key < hi) range(n.right, lo, hi, out);
    }

    public static void main(String[] args) {
        Node root = null;
        for (int k : new int[] {40, 20, 60, 10, 30, 70, 30}) root = insert(root, k);
        System.out.println("valid BST: " + isBst(root, Long.MIN_VALUE, Long.MAX_VALUE));
        List<Integer> r = new ArrayList<>();
        range(root, 25, 65, r);
        System.out.println("keys in [25, 65]: " + r);

        // 50 sits in 40's left subtree: fine for its parent 20, wrong for its grandparent 40.
        root.left.right = new Node(50);
        System.out.println("after putting 50 under 20: valid BST " + isBst(root, Long.MIN_VALUE, Long.MAX_VALUE));
        System.out.println("parent-only check would say: " + (root.left.right.key > root.left.key));
    }
}
