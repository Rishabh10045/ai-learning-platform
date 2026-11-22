import java.util.ArrayDeque;
import java.util.Deque;

public class ValidBrackets {
    // Every closer must match the most recent unmatched opener: last in, first out, so use a stack.
    static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '(' -> stack.push(')');
                case '[' -> stack.push(']');
                case '{' -> stack.push('}');
                case ')', ']', '}' -> {
                    if (stack.isEmpty() || stack.pop() != c) return false;   // closer with no opener, or wrong type
                }
                default -> { }                                                 // ignore other characters
            }
        }
        return stack.isEmpty();                                                // unclosed openers fail
    }

    public static void main(String[] args) {
        String[] inputs = {"()[]{}", "{[()]}", "(]", "([)]", "((", "", "{\"venue\":[1,2]}"};
        for (String in : inputs) System.out.println("\"" + in + "\" -> " + isValid(in));
    }
}
