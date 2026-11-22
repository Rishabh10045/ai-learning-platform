import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

public class TreeWalks {
    record Node(int key, Node left, Node right) {}

    static void preorder(Node n, List<Integer> out) {
        if (n == null) return;                 // base case
        out.add(n.key());
        preorder(n.left(), out);
        preorder(n.right(), out);
    }

    static void inorder(Node n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left(), out);
        out.add(n.key());
        inorder(n.right(), out);
    }

    static void postorder(Node n, List<Integer> out) {
        if (n == null) return;
        postorder(n.left(), out);
        postorder(n.right(), out);
        out.add(n.key());
    }

    static int height(Node n) {
        return n == null ? 0 : 1 + Math.max(height(n.left()), height(n.right()));
    }

    // Same inorder result with an explicit stack: no recursion depth limit.
    static List<Integer> inorderIterative(Node root) {
        List<Integer> out = new ArrayList<>();
        Deque<Node> stack = new ArrayDeque<>();
        Node cur = root;
        while (cur != null || !stack.isEmpty()) {
            while (cur != null) { stack.push(cur); cur = cur.left(); }
            cur = stack.pop();
            out.add(cur.key());
            cur = cur.right();
        }
        return out;
    }

    public static void main(String[] args) {
        //        40
        //      20    60
        //    10  30    70
        Node root = new Node(40,
            new Node(20, new Node(10, null, null), new Node(30, null, null)),
            new Node(60, null, new Node(70, null, null)));
        List<Integer> pre = new ArrayList<>(), in = new ArrayList<>(), post = new ArrayList<>();
        preorder(root, pre); inorder(root, in); postorder(root, post);
        System.out.println("preorder  : " + pre);
        System.out.println("inorder   : " + in);
        System.out.println("postorder : " + post);
        System.out.println("height " + height(root) + ", iterative inorder equal: " + in.equals(inorderIterative(root)));

        // A skewed tree (a sorted insert into a plain BST) has height n.
        Node skewed = null;
        for (int k = 1_000_000; k >= 1; k--) skewed = new Node(k, null, skewed);
        System.out.println("skewed height " + 1_000_000 + ", iterative inorder size " + inorderIterative(skewed).size());
        try {
            height(skewed);
            System.out.println("recursive height finished");
        } catch (StackOverflowError e) {
            System.out.println("recursive height: StackOverflowError (depth too large)");
        }
    }
}
