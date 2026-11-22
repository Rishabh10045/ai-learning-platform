import java.util.*;

// Stacks: delimiter validation that reports WHERE it fails, and a min-stack with O(1) minimum.
public class StackTools {
    static String validate(String s) {
        Deque<int[]> stack = new ArrayDeque<>();          // {char, index}
        String open = "([{", close = ")]}";
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (open.indexOf(c) >= 0) stack.push(new int[]{c, i});
            else if (close.indexOf(c) >= 0) {
                if (stack.isEmpty()) return "unexpected '" + c + "' at " + i;
                int[] top = stack.pop();
                if (open.indexOf(top[0]) != close.indexOf(c)) return "'" + (char) top[0] + "' at " + top[1] + " closed by '" + c + "' at " + i;
            }
        }
        return stack.isEmpty() ? "valid" : "unclosed '" + (char) stack.peek()[0] + "' at " + stack.peek()[1];
    }

    static final class MinStack {
        private final Deque<Integer> values = new ArrayDeque<>(), mins = new ArrayDeque<>();
        void push(int x) { values.push(x); mins.push(mins.isEmpty() ? x : Math.min(x, mins.peek())); }
        int pop() { mins.pop(); return values.pop(); }
        int min() { return mins.peek(); }
    }

    public static void main(String[] args) {
        for (String s : List.of("{seat:[A1,(B2)]}", "([)]", "(()", "())", ""))
            System.out.printf("%-18s %s%n", "\"" + s + "\"", validate(s));
        MinStack m = new MinStack();
        for (int x : new int[]{5, 3, 7, 3, 1}) m.push(x);
        StringBuilder sb = new StringBuilder("min after pushes 5 3 7 3 1: " + m.min());
        for (int k = 0; k < 3; k++) { m.pop(); sb.append(", after pop: ").append(m.min()); }
        System.out.println(sb);
    }
}
