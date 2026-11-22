public class RecurrenceTrace {
    static long factorial(int n) {
        if (n < 0 || n > 20) throw new IllegalArgumentException("Require 0 <= n <= 20");
        return n <= 1 ? 1 : n * factorial(n - 1);
    }

    static long fibonacci(int n, int[] calls) {
        if (n < 0 || n > 20) throw new IllegalArgumentException("Require 0 <= n <= 20 for the naive trace");
        return fibonacciCalls(n, calls);
    }

    private static long fibonacciCalls(int n, int[] calls) {
        calls[0]++;
        return n <= 1 ? n : fibonacciCalls(n - 1, calls) + fibonacciCalls(n - 2, calls);
    }

    static long fibonacciIterative(int n) {
        if (n < 0 || n > 92) throw new IllegalArgumentException("Require 0 <= n <= 92");
        if (n == 0) return 0;
        long previous = 0;
        long current = 1;
        for (int i = 2; i <= n; i++) {
            long next = previous + current;
            previous = current;
            current = next;
        }
        return current;
    }

    public static void main(String[] args) {
        int[] calls = { 0 };
        long f = fibonacci(5, calls);
        if (factorial(0) != 1 || factorial(4) != 24 || f != 5 || calls[0] != 15
                || f != fibonacciIterative(5) || fibonacciIterative(92) != 7540113804746346429L) {
            throw new AssertionError("Recurrence or boundary result differs");
        }
        for (int n : new int[] { -1, 21 }) {
            try {
                factorial(n);
                throw new AssertionError("Accepted invalid factorial input " + n);
            } catch (IllegalArgumentException expected) {
                // The public factorial method rejects unsupported inputs.
            }
        }
        System.out.println("factorial(4)=24 fib(5)=5 calls=15");
    }
}
