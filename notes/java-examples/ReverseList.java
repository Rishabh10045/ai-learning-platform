// Iterative reversal (save next first!) and merging two sorted lists by relinking nodes.
public class ReverseList {
    static final class Node { final String v; Node next; Node(String v, Node next) { this.v = v; this.next = next; } }

    static Node list(String... vs) { Node h = null; for (int i = vs.length - 1; i >= 0; i--) h = new Node(vs[i], h); return h; }
    static String show(Node h) { StringBuilder sb = new StringBuilder(); for (Node n = h; n != null; n = n.next) sb.append(n.v).append(n.next != null ? "→" : ""); return sb.length() == 0 ? "(empty)" : sb.toString(); }

    static Node reverse(Node head) {
        Node prev = null, cur = head;
        while (cur != null) {
            Node next = cur.next;   // 1. save the rest of the list
            cur.next = prev;        // 2. point back
            prev = cur;             // 3. advance both
            cur = next;
        }
        return prev;
    }

    static Node mergeSorted(Node a, Node b) {
        Node dummy = new Node("", null), tail = dummy;
        while (a != null && b != null) {
            if (a.v.compareTo(b.v) <= 0) { tail.next = a; a = a.next; } else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = a != null ? a : b;
        return dummy.next;
    }

    public static void main(String[] args) {
        System.out.println("reverse A→B→C : " + show(reverse(list("A", "B", "C"))));
        System.out.println("reverse A     : " + show(reverse(list("A"))));
        System.out.println("reverse empty : " + show(reverse(null)));
        Node r = reverse(list("A", "B", "C"));
        Node tail = r; while (tail.next != null) tail = tail.next;
        System.out.println("new tail is " + tail.v + ", tail.next = " + tail.next);
        System.out.println("merge         : " + show(mergeSorted(list("A", "D", "F"), list("B", "C", "G"))));
    }
}
