import java.util.ArrayDeque;
import java.util.Deque;

public class MinStack {
    // Each entry stores its value and the minimum of the stack at the time it was pushed.
    private record Entry(int value, int min) {}
    private final Deque<Entry> stack = new ArrayDeque<>();

    void push(int x) {
        int min = stack.isEmpty() ? x : Math.min(x, stack.peek().min());
        stack.push(new Entry(x, min));
    }

    int pop() {
        if (stack.isEmpty()) throw new IllegalStateException("empty stack");
        return stack.pop().value();
    }

    int top() { return stack.peek().value(); }
    int min() {
        if (stack.isEmpty()) throw new IllegalStateException("empty stack");
        return stack.peek().min();
    }

    public static void main(String[] args) {
        MinStack s = new MinStack();
        for (int x : new int[] {5, 3, 7, 3, 2}) { s.push(x); System.out.print("push " + x + " min " + s.min() + "; "); }
        System.out.println();
        while (true) {
            int v = s.pop();
            if (s.stack.isEmpty()) { System.out.println("pop " + v + " -> empty"); break; }
            System.out.print("pop " + v + " min " + s.min() + "; ");
        }
        try { s.min(); } catch (IllegalStateException e) { System.out.println("min on empty: " + e.getMessage()); }
    }
}
