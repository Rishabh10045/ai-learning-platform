import java.util.*;

public class ListCycles {
    static final class Node { final int val; Node next; Node(int v) { val = v; } }

    static Node build(int... vals) {
        Node head = null, tail = null;
        for (int v : vals) { Node n = new Node(v); if (head == null) head = n; else tail.next = n; tail = n; }
        return head;
    }

    static String show(Node head) {
        StringJoiner sj = new StringJoiner(" -> ", "[", "]");
        for (Node n = head; n != null; n = n.next) sj.add(String.valueOf(n.val));
        return sj.toString();
    }

    // Iterative reversal: three pointers, O(n) time, O(1) space.
    static Node reverse(Node head) {
        Node prev = null, cur = head;
        while (cur != null) { Node next = cur.next; cur.next = prev; prev = cur; cur = next; }
        return prev;
    }

    // Floyd: slow moves 1, fast moves 2. They meet inside a cycle; then a pointer from head and one from the
    // meeting point, both moving 1, meet at the cycle's first node.
    static Node cycleStart(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next; fast = fast.next.next;
            if (slow == fast) {
                Node a = head;
                while (a != slow) { a = a.next; slow = slow.next; }
                return a;
            }
        }
        return null;
    }

    static Node middle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        return slow;
    }

    public static void main(String[] args) {
        Node list = build(1, 2, 3, 4, 5);
        System.out.println("middle of " + show(list) + " = " + middle(list).val);
        System.out.println("reversed: " + show(reverse(list)));
        System.out.println("reverse of empty: " + show(reverse(null)));
        Node cyc = build(3, 2, 0, -4);
        cyc.next.next.next.next = cyc.next;          // -4 points back to 2
        Node start = cycleStart(cyc);
        System.out.println("cycle starts at node " + (start == null ? "none" : start.val));
        System.out.println("acyclic list: " + (cycleStart(build(1, 2)) == null ? "no cycle" : "cycle"));
    }
}
