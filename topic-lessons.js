import { backendFoundationTopics } from './notes/topic-backend-foundations.js';
import { foundationTopics } from './notes/topic-foundations.js';
import { numberAlgorithmTopics } from './notes/topic-number-algorithms.js';
import { depthPackets, packetCode } from './day-depth.js';
import { lateTopicAnswers, lateTopicCode, lateTopicNotes } from './late-depth.js';
import { systemFoundationTopics } from './notes/topic-system-foundations.js';

// A topic gets its own teaching material only when each item is written for that topic.
export const topicLessons = {
  ...numberAlgorithmTopics,
  ...foundationTopics,
  ...backendFoundationTopics,
  ...systemFoundationTopics,
  'd-complexity-01': {
    notes: [
      'Pick the input parameter before choosing a bound. Here n is the number of booking IDs in an array. Count key comparisons in firstIndex. Searching for 4 in [4, -2, 7, 4] makes one comparison. Searching for 7 makes three, and searching for 3 makes four. For arrays of length n, the worst case is the maximum comparison count over the inputs of that size. Its tight growth rate is Θ(n).',
      'Big-O names an asymptotic upper bound and Θ names a tight bound. A linear scan is also O(n²), but Θ(n) is more informative for its worst case. The best case for a nonempty array is Θ(1). A claim about average or expected cost needs a distribution on input positions or hash behavior. A dynamic-array append has amortized O(1) cost across appends even though an individual growth step can copy Θ(n) items.',
      'Arrays expose 0-based indexing in constant time under the usual word RAM model. Allocating a prefix array costs Θ(n) time and Θ(n) auxiliary space. Each later range query uses two entries and is Θ(1). For q queries the resulting time is Θ(n+q), compared with Θ(nq) when each scan can cover the entire array. This trade-off assumes the source array is static between preprocessing and queries.',
      'Report stack frames and anything you allocate separately from the input. An iterative firstIndex uses O(1) auxiliary space. A recursive linear scan makes Θ(n) calls and can keep Θ(n) live frames. Checking only a short successful input can hide the cost and the stack risk on a long miss.'
    ],
    takeaways: ['State n and what work is counted.', 'Worst case chooses inputs, while Big-O and Θ describe growth.', 'Report precomputation, query and update costs separately.', 'Count the live stack in auxiliary space.'],
    practice: ['Use ArrayScanTrace.java in the DSA lane. Add a counter to firstIndex. Spend 10 minutes checking first, last and missing targets at n=4 and n=8, then compare 100 full-range queries with a prefix-array build and 100 constant-time queries.', ['Predicted first/last/missing comparisons are 1/4/4 and 1/8/8.', 'The explanation distinguishes Θ(n) worst-case scan from Θ(1) best case.', 'Report Θ(n) prefix setup and auxiliary space, and explain when an update invalidates the prefix array.']],
    interview: [
      ['If an array scan stops at the first hit, can you still say worst-case Θ(n)?', 'Yes. Pick an absent target or a hit at the last index to force n comparisons. The existence of an input that returns immediately changes the best case.'],
      ['Why might a one-time range sum use a scan instead of preprocessing?', 'Both can cost linear time for a full range, and the scan needs constant auxiliary space. A prefix array pays off when many queries reuse stable input.'],
      ['What separates expected constant lookup from amortized constant append?', 'Expectation uses a probability or distribution assumption. Amortization bounds total work across a sequence even when individual steps are expensive, such as resizing a dynamic array.'],
      ['What changes if comparing each string examines up to m characters?', 'The key operation now has a worst-case O(m) cost, so n comparisons can cost O(nm). State whether m is bounded before treating comparisons as constant time.']
    ],
    check: ['One search inspects the first element and returns. What can be concluded?', ['The worst-case time is always constant.', 'The best case for nonempty input can be constant and the worst case is still linear.', 'The algorithm must allocate a prefix array.', 'The expected time is constant for every input distribution.'], 1, 'An absent target still forces a scan of every element.'],
    references: [['Princeton Algorithms · Analysis of Algorithms', 'https://algs4.cs.princeton.edu/14analysis/']]
  },
  'd-arrays-01': {
    notes: [
      'An array’s physical length is fixed. A partially filled array also has a logical size. To insert in the middle, validate index and free capacity, then shift entries from right to left. Inserting 7 at index 1 of logical [4, 9] shifts 9 to index 2. Deleting that index shifts left and lowers the logical size; slots at or above the new size no longer count. Reversing the shift order can overwrite values still needed later.',
      'For a static array, define prefix[i] as the sum of elements with index below i. For [4, -2, 7, 4], the prefix array is [0, 4, 2, 9, 13]. The sum over [1, 3) is prefix[3] − prefix[1] = 5. An empty valid interval [2, 2) has sum zero. Reject bounds outside 0 ≤ from ≤ to ≤ n. Using long for int inputs avoids wraparound on MAX_VALUE + 1. An update can invalidate all prefix entries after the changed index.',
      'For the second distinct maximum, maintain the two largest different values seen so far. A duplicate of the maximum changes neither. [7, 7, -2] gives -2, and [7, 7] has no result. OptionalInt expresses absence and a sentinel outside the input type keeps Integer.MIN_VALUE representable as genuine data in this implementation.',
      'For strict suffix leaders, maintain the largest value already seen from the right. An element qualifies only if it is larger than every element after it, so [8, 8, 3] returns [8, 3]. If an interview defines leaders with greater-than-or-equal, both 8s qualify. Clarify the rule and reverse the output once to restore encounter order.'
    ],
    takeaways: ['Check logical size and capacity before shifting.', 'With prefix[0] = 0, sum [l, r) is prefix[r] − prefix[l].', 'State distinctness and duplicate policy.', 'Choose a numeric type and absence representation that fit the contract.'],
    practice: ['Spend 30 minutes on ArrayScanTrace.java: 12 minutes tracing insert/delete and strict leaders, 10 minutes implementing firstIndex and rangeSum without looking, and 8 minutes extending the test cases. Add full-buffer, invalid-position and invalid-range tests. Explain why a valid empty range returns zero.', ['Insertion and deletion recover [4, 9] with logical size 2.', 'First 4 is at index 0 and a missing value returns -1.', 'Range [1, 3) gives 5 and [2, 2) gives 0. An invalid range is rejected.', 'The all-equal array has no second distinct maximum. [8, 8, 3] has strict leaders [8, 3].']],
    interview: [
      ['Why shift right from the end when inserting?', 'A rightward write would otherwise overwrite the next source before it is copied. Moving from the last occupied slot to the insertion point preserves every displaced element.'],
      ['Why does prefix subtraction still work with negative numbers?', 'It cancels the identical prefix before the left boundary by addition and subtraction. The proof does not rely on monotonic sums.'],
      ['How do you track a second maximum with duplicates and negative values?', 'Keep the two largest distinct values, update both when a new maximum arrives, and ignore equal maxima. Use an explicit absent result or an out-of-domain sentinel.'],
      ['What makes a suffix-leader scan linear?', 'Each element is compared once to an aggregate maximum from the suffix already processed. Apart from the result list, the scan needs one running maximum.']
    ],
    check: ['For [4, -2, 7, 4], prefix = [0, 4, 2, 9, 13]. What is the sum for [1, 3)?', ['9', '7', '5', '11'], 2, 'The elements are -2 and 7. Subtract prefix[1] from prefix[3].'],
    references: [
      ['GFG DSA plus System Design · course listing, Class 3', 'https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course'],
      ['Java 21 API · System.arraycopy', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/System.html#arraycopy(java.lang.Object,int,java.lang.Object,int,int)']
    ],
    code: { title: 'ArrayScanTrace.java · java ArrayScanTrace.java', text: "import java.util.ArrayList;\nimport java.util.Collections;\nimport java.util.List;\nimport java.util.OptionalInt;\n\npublic class ArrayScanTrace {\n    static int firstIndex(int[] values, int target) {\n        for (int i = 0; i < values.length; i++) {\n            if (values[i] == target) return i;\n        }\n        return -1;\n    }\n\n    static long[] prefix(int[] values) {\n        long[] sums = new long[values.length + 1];\n        for (int i = 0; i < values.length; i++) {\n            sums[i + 1] = sums[i] + values[i];\n        }\n        return sums;\n    }\n\n    static long rangeSum(long[] sums, int from, int to) {\n        if (from < 0 || from > to || to >= sums.length) {\n            throw new IndexOutOfBoundsException(\"Invalid half-open range\");\n        }\n        return sums[to] - sums[from];\n    }\n\n    static int insert(int[] buffer, int size, int index, int value) {\n        if (size < 0 || size >= buffer.length || index < 0 || index > size) {\n            throw new IllegalArgumentException(\"Invalid insertion or full buffer\");\n        }\n        for (int i = size; i > index; i--) buffer[i] = buffer[i - 1];\n        buffer[index] = value;\n        return size + 1;\n    }\n\n    static int delete(int[] buffer, int size, int index) {\n        if (size < 0 || size > buffer.length || index < 0 || index >= size) {\n            throw new IllegalArgumentException(\"Invalid deletion\");\n        }\n        for (int i = index; i < size - 1; i++) buffer[i] = buffer[i + 1];\n        return size - 1;\n    }\n\n    static OptionalInt secondDistinctMaximum(int[] values) {\n        long largest = Long.MIN_VALUE;\n        long second = Long.MIN_VALUE;\n        for (int value : values) {\n            if (value > largest) {\n                second = largest;\n                largest = value;\n            } else if (value < largest && value > second) {\n                second = value;\n            }\n        }\n        return second == Long.MIN_VALUE ? OptionalInt.empty() : OptionalInt.of((int) second);\n    }\n\n    static List<Integer> strictLeaders(int[] values) {\n        List<Integer> leaders = new ArrayList<>();\n        long maxOnRight = Long.MIN_VALUE;\n        for (int i = values.length - 1; i >= 0; i--) {\n            if (values[i] > maxOnRight) {\n                leaders.add(values[i]);\n                maxOnRight = values[i];\n            }\n        }\n        Collections.reverse(leaders);\n        return leaders;\n    }\n\n    static void require(boolean condition, String description) {\n        if (!condition) throw new AssertionError(description);\n    }\n\n    public static void main(String[] args) {\n        int[] values = { 4, -2, 7, 4 };\n        long[] sums = prefix(values);\n        require(firstIndex(values, 4) == 0, \"Returns first match\");\n        require(firstIndex(values, 3) == -1 && firstIndex(new int[0], 4) == -1, \"Missing target\");\n        require(rangeSum(sums, 1, 3) == 5 && rangeSum(sums, 2, 2) == 0, \"Range sums\");\n        require(rangeSum(prefix(new int[] { Integer.MAX_VALUE, 1 }), 0, 2) == 2147483648L, \"Wide sum\");\n        int[] buffer = { 4, 9, 0 };\n        int size = insert(buffer, 2, 1, 7);\n        require(size == 3 && buffer[1] == 7 && buffer[2] == 9, \"Shift right\");\n        size = delete(buffer, size, 1);\n        require(size == 2 && buffer[0] == 4 && buffer[1] == 9, \"Shift left\");\n        require(secondDistinctMaximum(new int[] { 7, 7, -2 }).orElseThrow() == -2, \"Distinct maximum\");\n        require(secondDistinctMaximum(new int[] { 7 }).isEmpty(), \"No second maximum\");\n        require(secondDistinctMaximum(new int[] { 0, Integer.MIN_VALUE }).orElseThrow() == Integer.MIN_VALUE, \"Minimum int is data\");\n        require(strictLeaders(new int[] { 8, 8, 3 }).equals(List.of(8, 3)), \"Strict leader contract\");\n        require(strictLeaders(new int[0]).isEmpty(), \"Empty leaders\");\n        System.out.println(\"firstIndex=0 rangeSum=5 second=-2 leaders=[8, 3]\");\n    }\n}\n", output: 'firstIndex=0 rangeSum=5 second=-2 leaders=[8, 3]' }
  },
  'd-recursion-02': {
    notes: [
      'Define the method’s input domain, a base result, and a measure that shrinks on every recursive edge. For factorial with 0 ≤ n ≤ 20, return 1 for n = 0 or n = 1. Otherwise compute n × factorial(n − 1). The pending multiplications live in separate frames. For n = 4, the calls descend 4 → 3 → 2 → 1 and values return 1 → 2 → 6 → 24.',
      'Fibonacci has two base results, F(0)=0 and F(1)=1. In the direct form F(n)=F(n−1)+F(n−2), F(5) expands to 15 calls yet reaches only five active frames at its deepest path. Total calls grow exponentially, whereas stack depth grows linearly. Trace F(3) under both branches of F(5) to identify repeated subproblems.',
      'Memoization reuses each computed value and leaves the recursion stack in place. Iteration can keep the previous two values in O(1) auxiliary space and compute F(n) in O(n) time. Use a small input for the naive trace. For signed long, 20! and F(92) fit but 21! and F(93) do not. Numeric range and stack capacity are independent limits.',
      'Invalid inputs need a separate decision. If factorial accepts a negative n and always recurses with n − 1, it moves away from its valid base case. A very deep valid recursion can also exhaust the JVM stack. A decreasing measure proves algorithmic termination under its model and does not promise enough runtime stack space.'
    ],
    takeaways: ['Define domain, base result and a shrinking measure.', 'Distinguish total work from peak stack depth.', 'Repeated subproblems motivate memoization or iteration.', 'Check numeric range independently of recursion depth.'],
    practice: ['Use 24 minutes in the main practice block. Draw the factorial(4) stack and Fibonacci(5) call tree. Run RecurrenceTrace.java and compare the two Fibonacci algorithms. Add one rejection test for fibonacciIterative(93) and explain why the Fibonacci call counter cannot stand in for peak depth.', ['factorial(0)=1 and factorial(4)=24. Invalid -1 and 21 fail.', 'The naive Fibonacci result is 5 with 15 calls and at most five active recurrence frames.', 'Iterative Fibonacci gives the same small answer and rejects 93.', 'Explain the work and auxiliary space of both approaches.']],
    interview: [
      ['How do you show that a recursive algorithm terminates?', 'Name an ordered measure bounded below and show it decreases on every recursive call until a handled base case. Validate inputs outside the declared domain.'],
      ['Why are Fibonacci’s work and stack bounds different?', 'One call can start two subcalls, so the full call tree contains repeated branches. The implementation runs those branches in sequence and only one path is active at a time.'],
      ['How would memoization change the direct implementation?', 'Cache by n and compute each distinct state once. Time becomes O(n), while the memo table and pending recursion frames use O(n) space.'],
      ['Why can replacing recursion with iteration still give a wrong answer for F(93)?', 'Iteration reduces stack usage. The exact value still exceeds a signed long. Validate the bound or use BigInteger if larger results are required.']
    ],
    check: ['Naive Fibonacci(5) makes 15 calls. What does that tell you about stack depth?', ['It proves all 15 calls are active at once.', 'It proves the depth is constant for every n.', 'The count is total work. Peak depth is measured along the deepest live path.', 'It proves the result is 15.'], 2, 'Only one path is live at a time in this sequential recursion.'],
    references: [
      ['Princeton · Recursion', 'https://introcs.cs.princeton.edu/java/23recursion/'],
      ['Java 21 API · Math and overflow checks', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Math.html']
    ],
    code: { title: 'RecurrenceTrace.java · java RecurrenceTrace.java', text: "public class RecurrenceTrace {\n    static long factorial(int n) {\n        if (n < 0 || n > 20) throw new IllegalArgumentException(\"Require 0 <= n <= 20\");\n        return n <= 1 ? 1 : n * factorial(n - 1);\n    }\n\n    static long fibonacci(int n, int[] calls) {\n        if (n < 0 || n > 20) throw new IllegalArgumentException(\"Require 0 <= n <= 20 for the naive trace\");\n        return fibonacciCalls(n, calls);\n    }\n\n    private static long fibonacciCalls(int n, int[] calls) {\n        calls[0]++;\n        return n <= 1 ? n : fibonacciCalls(n - 1, calls) + fibonacciCalls(n - 2, calls);\n    }\n\n    static long fibonacciIterative(int n) {\n        if (n < 0 || n > 92) throw new IllegalArgumentException(\"Require 0 <= n <= 92\");\n        if (n == 0) return 0;\n        long previous = 0;\n        long current = 1;\n        for (int i = 2; i <= n; i++) {\n            long next = previous + current;\n            previous = current;\n            current = next;\n        }\n        return current;\n    }\n\n    public static void main(String[] args) {\n        int[] calls = { 0 };\n        long f = fibonacci(5, calls);\n        if (factorial(0) != 1 || factorial(4) != 24 || f != 5 || calls[0] != 15\n                || f != fibonacciIterative(5) || fibonacciIterative(92) != 7540113804746346429L) {\n            throw new AssertionError(\"Recurrence or boundary result differs\");\n        }\n        for (int n : new int[] { -1, 21 }) {\n            try {\n                factorial(n);\n                throw new AssertionError(\"Accepted invalid factorial input \" + n);\n            } catch (IllegalArgumentException expected) {\n                // The public factorial method rejects unsupported inputs.\n            }\n        }\n        System.out.println(\"factorial(4)=24 fib(5)=5 calls=15\");\n    }\n}\n", output: 'factorial(4)=24 fib(5)=5 calls=15' }
  },
  'd-pointers-01': {
    notes: [
      'A two-pointer algorithm is useful when an ordering or an invariant justifies eliminating several candidates with one move. In a sorted int array, start a pair-sum search with the smallest and largest remaining values. If their sum is below the target, pairing the left value with any other remaining value is also too small, so advance left. If the sum is above the target, pairing the right value with any other remaining value is also too large, so decrease right. Keep left < right so an item cannot pair with itself. Use long sums for int inputs. The scan is O(n) with O(1) auxiliary space after sorting, and sorting an unsorted input adds its own time and space cost.',
      'For unique value triplets, fix each distinct first value in a sorted array and solve the remaining pair problem to its right. For [-2, 0, 0, 2, 2, 3] with target 0, fixing -2 gives (-2, 0, 2). Move both pointers past equal values after emitting that triple and skip equal first values. This is O(n²) after sorting with O(1) scan space, excluding the output. If the question asks for all index triplets, skipping equal values can discard valid index combinations. Define which contract you are implementing before writing the loop.',
      'A variable window tracks a contiguous range. Store the latest index for each seat ID to keep the active interval [left, right] distinct. For [A, B, B, A, C], when the second B arrives, set left to 2. The next A was seen at index 0, outside the window, so left must stay 2. Updating left to previous + 1 unconditionally would move it back to 1 and include both Bs. Use max(left, previous + 1). After processing C the longest valid window has length 3. With appropriate hashing and constant-cost keys, the map scan is O(n) expected time and uses O(u) memory for u distinct IDs. The same rule solves longest distinct substring if each element is a text unit. Say whether a Java String task counts UTF-16 code units or Unicode code points. The ASCII example ABBAC gives length 3 under either policy.',
      'For the maximum sum of a fixed length k, compute the first complete window, then add the entering value and subtract the departing one. Start best at the first window sum so an all-negative input can return a negative answer. For [-8, -3, -5, -2] with k = 2, the sums are -11, -8 and -7. Accumulate int values in a long. The fixed-width scan has O(n) time and O(1) extra space. A different problem that shrinks a window while its sum exceeds a threshold usually needs nonnegative inputs. With [5, -4] and threshold 2, dropping 5 as soon as it exceeds the threshold loses a valid length-two window of sum 1.'
    ],
    takeaways: [
      'Prove every pointer move can discard the whole eliminated group.',
      'Advance the left boundary monotonically in a last-seen window.',
      'Initialize a fixed-window maximum from a valid complete window.',
      'State whether answers are unique value tuples or distinct index tuples.'
    ],
    practice: ['Use 20 minutes of Day 27’s existing practice block. Run Day27Windows.java with Java 21, then trace [A, B, B, A, C] by hand. Extend pair search to emit unique sorted value triplets. Use a fixed first value and two pointers in the remaining suffix.', [
      'The longest distinct lengths are 3 and 0 for the shown nonempty and empty inputs.',
      'The maximum sums are -7 for the all-negative case and 4294967294 for two large ints, and invalid window sizes are rejected.',
      'The sorted pair routine finds 0 + 2 = 2 and rejects a false overflow match.',
      'For [-2, 0, 0, 2, 2, 3] and target 0, the triplet routine emits (-2, 0, 2) once. An all-zero input with at least three items yields exactly one value triplet.'
    ]],
    interview: [
      ['Why is moving the left pointer safe when the endpoint sum is too small?', 'The right endpoint is the largest partner still in range. Pairing the same left endpoint with any smaller candidate cannot reach the target.'],
      ['Why keep the old left boundary when the last seen index falls before it?', 'The earlier occurrence is already outside the distinct window. Moving left backwards would reintroduce elements already eliminated for a duplicate.'],
      ['Would zero be a safe initial best for a fixed-length maximum sum?', 'Only if the problem permits an empty result with sum zero. Every valid fixed-length window can have a negative sum. Initialize to the sum of the first valid window.'],
      ['Do you skip duplicate values if asked for every index triplet?', 'No. Equal values at different indices can represent distinct valid answers. Skipping repeats suits an answer contract based on unique value tuples.'],
      ['What makes a shrink-on-large-sum strategy unreliable with negative numbers?', 'A later negative number can reduce the sum of a longer window that has already been discarded. The sum no longer changes monotonically when you extend or shrink the interval.']
    ],
    check: ['While scanning [A, B, B, A, C], left is 2 just before the second A at index 3. Its last position is 0. What is left after processing that A?', ['0', '1', '2', '3'], 2, 'The previous A is already outside the active window. max(2, 0 + 1) preserves the distinct range.'],
    references: [
      ['GeeksforGeeks syllabus · Track 1, Array II and III', 'https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf#page=7'],
      ['Java 21 API · HashMap', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html'],
      ['USACO Guide · Two Pointers and Sliding Window', 'https://usaco.guide/silver/two-pointers']
    ],
    code: { title: 'Day27Windows.java · java Day27Windows.java', text: `import java.util.HashMap;
import java.util.Map;

class Day27Windows {
    static int longestDistinct(String[] values) {
        Map<String, Integer> lastSeen = new HashMap<>();
        int left = 0;
        int best = 0;
        for (int right = 0; right < values.length; right++) {
            Integer previous = lastSeen.put(values[right], right);
            if (previous != null) {
                left = Math.max(left, previous + 1);
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    static long maxFixedSum(int[] values, int width) {
        if (width < 1 || width > values.length) {
            throw new IllegalArgumentException("window width outside input");
        }
        long sum = 0;
        for (int i = 0; i < width; i++) {
            sum += values[i];
        }
        long best = sum;
        for (int right = width; right < values.length; right++) {
            sum += (long) values[right] - values[right - width];
            best = Math.max(best, sum);
        }
        return best;
    }

    static boolean hasSortedPair(int[] values, long target) {
        int left = 0;
        int right = values.length - 1;
        while (left < right) {
            long sum = (long) values[left] + values[right];
            if (sum == target) return true;
            if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return false;
    }

    public static void main(String[] args) {
        int distinct = longestDistinct(new String[]{"A", "B", "B", "A", "C"});
        if (distinct != 3 || longestDistinct(new String[0]) != 0) {
            throw new AssertionError("distinct window");
        }

        long maximum = maxFixedSum(new int[]{-8, -3, -5, -2}, 2);
        long large = maxFixedSum(new int[]{Integer.MAX_VALUE, Integer.MAX_VALUE}, 2);
        if (maximum != -7 || large != 4_294_967_294L) {
            throw new AssertionError("fixed window");
        }
        try {
            maxFixedSum(new int[]{1, 2}, 3);
            throw new AssertionError("invalid window accepted");
        } catch (IllegalArgumentException expected) {
            System.out.println("invalid window rejected");
        }

        boolean pair = hasSortedPair(new int[]{-3, 0, 2, 4, 7}, 2);
        boolean overflowMatch = hasSortedPair(new int[]{1, Integer.MAX_VALUE}, Integer.MIN_VALUE);
        if (!pair || overflowMatch || hasSortedPair(new int[]{2}, 4)) {
            throw new AssertionError("pair sum");
        }
        System.out.printf("distinct=%d maxNegative=%d maxLarge=%d pair=%b%n",
                distinct, maximum, large, pair);
    }
}
`, output: 'invalid window rejected\ndistinct=3 maxNegative=-7 maxLarge=4294967294 pair=true' }
  },
  'd-search-01': {
    notes: [
      'Linear search can find the first matching index of an unsorted array by scanning in order. It takes O(n) time in the worst case and O(1) auxiliary space. A sorted array can answer repeated positional queries faster. Its lower bound is the first index whose value is greater than or equal to the target, including an insertion point when the exact target is absent. Return length when every element is smaller. Checking a[i] == target is a separate step, guarded by i < length.',
      'Maintain a half-open search interval [lo, hi). Values before lo are strictly below the target and values from hi onward meet the predicate. Test mid = lo + (hi - lo) / 2. If values[mid] < target, raise lo to mid + 1. Otherwise make hi equal to mid, which retains mid as a possible boundary and looks for an earlier match. For [10, 15, 15, 27] and target 15, start (lo, hi) = (0, 4). Testing indices 2, 1 and 0 brings the boundaries to (1, 1). Returning immediately on equality might give index 2, which breaks the first-match contract.',
      'The recursive form uses the same invariant. Stop when lo equals hi and return that boundary, with no access to an element in an empty interval. Each call strictly shrinks the interval. Passing mid as the new lo on a failing predicate can repeat a one-element interval forever. An iterative implementation uses O(1) auxiliary memory and the recursive version uses O(log n) stack space. Both use O(log n) comparisons on a sorted random-access array.',
      'A ceiling is the value at lowerBound if that position exists. A floor is the value immediately before upperBound, where upperBound finds the first index with a value strictly greater than the target. For [10, 15, 15, 27] and target 15, lowerBound = 1 and upperBound = 3. The first exact index is 1 and the last is 2. For target 16, ceiling is 27 and floor is 15. A rotated array can violate the false-then-true predicate, so this routine does not apply to it without accounting for the rotation.',
      'Java Arrays.binarySearch accepts sorted input and returns an index of any matching duplicate when the key is present. If the key is absent, a negative result encodes the insertion point as -(result + 1). A found index is insufficient to answer a first-match query in the presence of duplicates.'
    ],
    takeaways: [
      'Use linear search for an unsorted first-match query unless you have an index or can afford preprocessing.',
      'A first-true search needs a monotone predicate and a shrinking interval.',
      'The end sentinel is a valid insertion point but an invalid array index.',
      'Lower and upper bound use different predicates on duplicates.'
    ],
    practice: ['Use 20 minutes of Day 27’s DSA block. Run Day27Bounds.java with Java 21, then write out each [lo, hi) state for targets 15 and 30. Explain the one predicate difference in upperBound, then implement your own floor and last-index wrappers. Compare sorted search with the unsorted firstLinear scan.', [
      'Iterative and recursive lower bounds agree for duplicate, empty, and absent targets, including the array-length sentinel.',
      'The first exact index of 15 is 1 and exact search for 16 returns -1. On unsorted [27, 15, 10, 15], firstLinear returns 1 for 15 and -1 for 16.',
      'upperBound(15) is 3, the last exact index is 2, and for target 16 the floor is 15 and ceiling is 27.',
      'No floor exists below 10 and no ceiling exists above 27. The learner explains why binary search fails without a sorted or otherwise monotone predicate.'
    ]],
    interview: [
      ['What invariant guarantees that lowerBound returns the first possible match?', 'Each step puts a verified false prefix before lo or a verified true suffix from hi onward. Once lo equals hi there is a unique boundary between those regions.'],
      ['Why do you use hi = mid when the predicate is true?', 'mid could be the first true index, but any index between lo and mid could be earlier. Retaining mid as the candidate boundary lets the search check those positions.'],
      ['What does the algorithm return for an empty array or for a target larger than the last element?', 'It returns 0 for the empty array and the array length when the target is larger than every element. In both cases, no matching index exists.'],
      ['How do you get a floor and the last matching index from upperBound?', 'The floor is the value at upperBound minus 1 when that index exists. It is the last match only if that value equals the target.'],
      ['Would Arrays.binarySearch replace lowerBound in a first-duplicate query?', 'Its successful result can be any matching index. For a first-duplicate requirement, implement a lower bound or use an API that guarantees the first boundary.']
    ],
    check: ['On [10, 15, 15, 27] with target 30, what should lowerBound return?', ['0', '3', '4', '-1'], 2, 'All four values are below 30. Index 4 represents insertion after the last value and must not be dereferenced.'],
    references: [
      ['GeeksforGeeks syllabus · Track 1, Searching', 'https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf#page=7'],
      ['Java 21 API · Arrays.binarySearch', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html#binarySearch(int%5B%5D,int)'],
      ['Princeton Algorithms · Binary search reference implementation', 'https://algs4.cs.princeton.edu/11model/BinarySearch.java.html']
    ],
    code: { title: 'Day27Bounds.java · java Day27Bounds.java', text: `class Day27Bounds {
    static int lowerBound(int[] values, int target) {
        int lo = 0;
        int hi = values.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (values[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    static int lowerBoundRecursive(int[] values, int target, int lo, int hi) {
        if (lo == hi) return lo;
        int mid = lo + (hi - lo) / 2;
        return values[mid] < target
                ? lowerBoundRecursive(values, target, mid + 1, hi)
                : lowerBoundRecursive(values, target, lo, mid);
    }

    static int upperBound(int[] values, int target) {
        int lo = 0;
        int hi = values.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (values[mid] <= target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    static int firstLinear(int[] values, int target) {
        for (int i = 0; i < values.length; i++) {
            if (values[i] == target) return i;
        }
        return -1;
    }

    static int firstExact(int[] values, int target) {
        int i = lowerBound(values, target);
        return i < values.length && values[i] == target ? i : -1;
    }

    static void checkLowerBound(int[] values, int target, int expected) {
        if (lowerBound(values, target) != expected
                || lowerBoundRecursive(values, target, 0, values.length) != expected) {
            throw new AssertionError("unexpected boundary for " + target);
        }
    }

    public static void main(String[] args) {
        int[] values = {10, 15, 15, 27};
        checkLowerBound(values, 0, 0);
        checkLowerBound(values, 15, 1);
        checkLowerBound(values, 16, 3);
        checkLowerBound(values, 30, 4);
        checkLowerBound(new int[0], 10, 0);
        int[] unsorted = {27, 15, 10, 15};
        if (firstLinear(unsorted, 15) != 1 || firstLinear(unsorted, 16) != -1
                || firstLinear(new int[0], 10) != -1) {
            throw new AssertionError("linear search contract");
        }
        if (firstExact(values, 15) != 1 || firstExact(values, 16) != -1
                || firstExact(values, 30) != -1 || firstExact(new int[0], 10) != -1
                || upperBound(values, 15) != 3 || upperBound(values, 9) != 0) {
            throw new AssertionError("upper bound or exact-match contract");
        }
        System.out.printf("lower(15)=%d upper(15)=%d floor(16)=%d ceiling(16)=%d exact(30)=%d%n",
                lowerBound(values, 15), upperBound(values, 15),
                values[upperBound(values, 16) - 1], values[lowerBound(values, 16)],
                firstExact(values, 30));
    }
}
`, output: 'lower(15)=1 upper(15)=3 floor(16)=15 ceiling(16)=27 exact(30)=-1' }
  },
  'j-oop-01': {
    notes: [
      'A class defines fields and operations. An object owns a particular set of field values. Construct Seat A1 and A2 separately so that choosing an owner for A1 leaves A2 available. The constructor initializes the identity before callers can use the object. Mark the id final, allow the owner to change through the booking operation and use private fields to limit the points where state can change.',
      'In Seat(String id), id names the constructor parameter and this.id names the current object’s field. Validate the parameter first, then assign the field. Because Seat declares this parameterized constructor, Java supplies no implicit no-argument constructor. A type with a valid default can explicitly delegate from a no-argument constructor to the parameterized path using this(...). Both paths can then share validation.',
      'A copy constructor is an ordinary constructor accepting an instance of the same type. Assignment of a reference copies that reference. Copying a value object can create an independent value, with deliberate handling of mutable members. For a booking entity, creating another mutable copy with the same seat identity would put ownership in two places. Use a read-only view for queries and keep one authoritative Seat for writes.',
      'BookingService owns the request boundary. It resolves the only valid seat ID before asking the Seat to claim itself. Seat validates the customer ID before checking ownership, so its invariant also holds for a direct call. A1 initially has no owner. U1 gets true. U2 and a repeated U1 request get false under this lesson’s contract. The original owner stays U1 for all failed attempts, including those rejected as invalid input.'
    ],
    takeaways: ['Create independent objects for independent state.', 'Construct valid instances with one validation path.', 'Distinguish an entity’s source of truth from a read-only view.', 'Verify both the result and the resulting state.'],
    practice: ['Copy the standalone ClaimTrace from Day 1 Learn into ClaimTrace.java and run java ClaimTrace.java. Within the same file, construct an A2 booking service and check that booking A1 does not change A2. Try constructing a seat from a blank ID.', [
      'The supplied program prints first=true, second=false, owner=U1 and exits successfully.',
      'Unknown seat, whitespace-only user and null user are rejected while U1 remains the owner.',
      'A2 starts unowned after the A1 claim. A blank seat ID fails during construction.',
      'Explain how this.id differs from id and why a Seat copy with the same ID would create conflicting authority.'
    ]],
    interview: [
      ['Why does Seat require an ID in its constructor?', 'An ID is required for a valid Seat. Constructor validation enforces that rule at creation and a final field keeps the identity stable.'],
      ['When does Java supply a default constructor?', 'It supplies an implicit no-argument default constructor when the class declares none. Once Seat(String id) is declared, a no-argument overload would need its own declaration.'],
      ['What would break if every service could set the owner directly?', 'A caller could overwrite an existing owner without checking the booking rule. A guarded transition preserves the rule and makes the permitted updates easy to locate.'],
      ['What should a query return if callers need a point-in-time copy?', 'Return a read-only value representing the seat ID and observed owner. Keep the original Seat as the write authority and document that the observed value can become stale.']
    ],
    check: ['Seat declares only Seat(String id). What happens if a caller uses new Seat()?', ['Java passes null implicitly.', 'The call fails to compile.', 'Java creates a valid seat with an empty ID.', 'Java generates a default no-argument constructor.'], 1, 'Java only generates an implicit default constructor when the class declares no constructors.'],
    references: [
      ['Dev.java · Creating classes and constructors', 'https://dev.java/learn/language/oop/classes-objects/creating-classes/'],
      ['JLS 21 · Default constructor', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.9']
    ]
  },
  'j-equality-01': {
    notes: [
      'Reference identity asks whether two references point to the same instance. Value equality expresses an application rule. Two independently parsed seat IDs both denoting A1 should retrieve the same mapping. Define that rule in equals, and derive hashCode from the same fields. A hash map can use the hash to narrow where it looks and then use equality to distinguish candidates.',
      'Equal objects must have equal hash codes. Unequal objects may collide. Store two unequal keys with the same hash and confirm that both still retrieve their own values. If an equality field changes after insertion, the table can search a different bucket. Keeping the key immutable prevents that failure and makes an independently constructed equivalent key safe to use.',
      'Object equality and sorted ordering are separate contracts. A sorted map can treat two keys as one when their comparison returns zero. Decide whether your ordering and equality represent the same identity. If a display can ignore case but the backing IDs are case-sensitive, use a display comparator without discarding one of the underlying keys.'
    ],
    takeaways: ['Equal keys must have equal hashes.', 'A collision does not imply equality.', 'Use immutable fields for key identity and test independently allocated keys.'],
    practice: ['Define an immutable SeatId and test its behavior as a key in HashMap.', ['A separately constructed equal key retrieves the stored value.', 'Two unequal keys with forced collisions remain distinguishable.']],
    interview: [
      ['Why does HashMap need both equals and hashCode?', 'The hash narrows the search. Equality decides which candidate is the key. Equal keys must hash equally and unequal keys may still collide.'],
      ['Why can mutating a key break a successful lookup?', 'If its equality fields change, the new hash or comparison can no longer locate the entry placed using the old identity. Store changing fields in the value.'],
      ['How would you test a case-insensitive SeatId?', 'Normalize through one rule at construction. Insert A1 and retrieve with a separately created a1, check equal hashes, then use unequal IDs with the same hash to prove the distinction.']
    ],
    check: ['Two different keys have the same hash. Can a HashMap hold both?', ['Yes, when equals distinguishes them.', 'Only when their values are identical.', 'No, the second must overwrite the first.', 'Only when the map compares keys by identity.'], 0, 'Hash collisions are allowed. Equality determines whether a found key is the same key.'],
    references: [['Dev.java · Choosing map keys', 'https://dev.java/learn/api/collections-and-streams/collections-framework/choosing-keys/']]
  },
  'j-collections-01': {
    notes: [
      'Choose a collection by the operations and guarantees the caller needs. HashMap suits lookup by a stable ID when iteration order can vary. LinkedHashMap preserves insertion order by default and can maintain access order for an LRU design. TreeMap orders keys and supports range queries. A set models membership when each ID has no associated value.',
      'OpenJDK 21 HashMap spreads the original hash into the lower bits with h ^ (h >>> 16), then uses (capacity - 1) & spreadHash to select a bucket in a power-of-two table. The strings Aa and BB both hash to 2112 and map to bucket 0 at capacity 16. Walk the candidates in that bucket and use equals to tell the keys apart. Both entries remain retrievable.',
      'A default map allocates its first table on insertion. With capacity 16 and a load factor of 0.75, the threshold is 12. Adding a thirteenth distinct entry grows the table under ordinary distribution. A resize can split an old bucket using one newly significant hash bit, so its entries either remain at index i or move to i plus the old capacity. A collision-heavy bucket can prompt earlier growth. At sufficient capacity the implementation can represent a crowded bucket as a tree. These details belong to the implementation and vary across insertion paths.',
      'The API describes expected constant time for ordinary get and put with well-distributed hashes. Tree bins help with collision-heavy inputs, and equally hashed non-comparable keys can still lead to broader searches. HashMap allows a null key and null values. Use containsKey when you need to distinguish a missing entry from a stored null. Updates by competing threads require a matching synchronization policy or a concurrent collection.',
      'When a key changes in a field used by hashCode or equals, future lookups can miss a mapping that still contributes to size. For internal booking IDs use an immutable value type, and put mutable booking state in the value. For read-heavy caches measure hits, misses and latency separately. Use a reproducible workload before attributing slow lookups to collisions.'
    ],
    takeaways: [
      'Pick a map by lookup, ordering, range and concurrency requirements.',
      'The hash selects candidates. Key equality identifies the entry.',
      'Keep key identity stable. Put mutable booking state in the value.',
      'Treat growth and tree bins as OpenJDK implementation details.',
      'Use containsKey to distinguish a missing key from a stored null.'
    ],
    practice: ['Spend 20 minutes running HashIndex.java and BrokenKey.java from the reading links with Java 21 source-file mode. Predict the results first, then change the capacity to 32 in HashIndex and explain which bucket indices can change. Next store a null value and compare get and containsKey for that key and an absent one.', [
      'Aa and BB report the same hash and bucket. Their independent lookups return 1 and 2.',
      'The record key looks up the stored value A. The mutated list key trial keeps size 1 and lookup returns null in the supplied Java 21 example.',
      'Explain the low-bit mask at capacities 16 and 32. A present null value and an absent key both return null from get, while containsKey distinguishes them.',
      'State one case for LinkedHashMap and one case for TreeMap.'
    ]],
    interview: [
      ['How does HashMap retrieve Aa and BB correctly when their hashes match?', 'The stored hash narrows the candidates. equals distinguishes the keys inside the bucket, so distinct keys retain distinct values.'],
      ['How does the current OpenJDK implementation redistribute entries when the table doubles?', 'It inspects one higher address bit in the spread hash. Entries remain at the old index when that bit is zero and move by the old capacity when it is one.'],
      ['What happens when a list used as a key gains another element?', 'Its hash or equality can change. Lookup using the modified key may miss the original entry, which still occupies the table. Use an immutable key or a defensive copy.'],
      ['When would you replace this map with LinkedHashMap, TreeMap or ConcurrentHashMap?', 'Choose LinkedHashMap for stable insertion or access order, TreeMap for sorted ranges, and ConcurrentHashMap for shared concurrent lookups and atomic updates per key, with a different null policy.'],
      ['Can you promise logarithmic lookup for every collision-heavy key in a tree bin?', 'The implementation can search broadly when hashes match and keys provide no usable comparable order. Discuss hash quality and key behavior before promising a bound.']
    ],
    check: ['The map contains an ID whose stored value is null. Which operation can distinguish it from an absent ID?', ['get', 'containsKey', 'hashCode', 'getOrDefault(id, null)'], 1, 'get can return null in either case. containsKey checks membership directly.'],
    references: [
      ['Java 21 API · HashMap', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html'],
      ['OpenJDK 21 · HashMap implementation', 'https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/HashMap.java'],
      ['Java lab · HashIndex.java', 'https://github.com/Rishabh10045/ai-learning-platform/blob/109a37d8c0b049b26a1ffbd2088f31bf6c0cd14e/collab/qa/content-standard/HashIndex.java'],
      ['Java lab · BrokenKey.java', 'https://github.com/Rishabh10045/ai-learning-platform/blob/109a37d8c0b049b26a1ffbd2088f31bf6c0cd14e/collab/qa/content-standard/BrokenKey.java']
    ]
  },
  'j-strings-01': {
    notes: [
      'A String is an immutable sequence of UTF-16 code units. Operations such as strip and toUpperCase return a String result and leave the original value intact. Reassigning a variable changes which object the variable refers to. In a booking request, keep the business rule for case and whitespace explicit. A distinct copy of A1 should find the same exact-match seat ID.',
      'String.equals compares contents, while reference equality with == checks whether two operands refer to the same object. Java interns string literals and constant-expression Strings. In the Java 21 example, both the literal "A1" and the constant expression "A" + "1" refer to the pooled value. An explicit new String("A") plus "1" produces a runtime String equal in content and distinct in identity. Use equals or Objects.equals for business comparisons. Use intern only when canonical identity is a deliberate design choice with measured benefit.',
      'Java assigns built-in meaning to operators. Plus adds numeric operands and concatenates when an operand is a String. Evaluation groups left to right, so 1 + 2 + " seats" produces "3 seats" and "Seats " + 1 + 2 produces "Seats 12". Java method overloads use different parameter lists and have a separate mechanism. Java provides no user-defined operator overloading.',
      'When assembling one result across many iterations, an unshared StringBuilder allows append operations followed by one toString call. A String produced by toString retains its contents if the builder is later changed. StringBuffer synchronizes methods, and a sequence of calls can still require external coordination. Use simple concatenation for short expressions and choose a builder for a growing result when profiling or clear loop structure justifies it.'
    ],
    takeaways: ['Use value equality for identifiers.', 'String immutability stays true when a variable is reassigned.', 'Folded constant expressions and runtime concatenation have different identity guarantees.', 'Use an unshared builder for deliberate incremental construction.'],
    practice: ['Run the displayed SeatIdStrings.java example in Day 5 Learn with Java 21. Predict its output first. Then replace the run-time part with another literal, add an empty builder, and explain the changed identity and value comparisons.', [
      'Distinct references containing A1 compare equal and retrieve the same HashMap entry.',
      'A strip operation returns A1 and preserves the original padded String.',
      'The builder produces A1,A2. Appending A3 keeps the first String unchanged. An empty builder produces the empty String.',
      'The two plus expressions produce 3 seats and Seats 12. Explain the left-to-right grouping.'
    ]],
    interview: [
      ['Why can two Strings display A1 even when == is false?', 'The operator compares the two references. Each can refer to a different object holding the same characters. String.equals compares character contents.'],
      ['How do a literal, a constant-expression concatenation and a runtime concatenation differ?', 'The first two are interned and use the same canonical String if equal. A nonconstant concatenation produces a new String even when its contents match the literal.'],
      ['What changes after storing the result of input.strip() in the same variable?', 'The reference can change. The original String contents stay unchanged, and any other variable holding that reference still sees them.'],
      ['When would you use StringBuilder for booking labels?', 'Use an unshared builder when looping through labels to construct a growing result, then call toString once at the boundary. For a short fixed expression, ordinary concatenation is clear.'],
      ['Does StringBuffer make a read-then-append sequence atomic?', 'Its individual calls can synchronize. A compound sequence still needs coordination outside the buffer or an owner that keeps the buffer local.']
    ],
    check: ['A database returns a runtime String containing A1. Which comparison expresses the booking rule?', ['value == "A1"', '"A1".equals(value)', 'value.hashCode() == "A1".hashCode()', 'value.compareTo("A1") > 0'], 1, 'String.equals checks the identifier contents. Reference identity is narrower and different values can share a hash.'],
    references: [
      ['Java 21 API · String', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html'],
      ['JLS 21 · String literals and interning', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-3.html#jls-3.10.5'],
      ['JLS 21 · String concatenation', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.1'],
      ['Java 21 API · StringBuffer', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html']
    ]
  },
  'j-streams-01': {
    notes: [
      'A stream pipeline separates an input, intermediate operations and a terminal operation. On an ordered list of seats, filter can keep open seats and map can extract their IDs. These intermediate steps describe work. Traversal starts when a terminal operation asks for a result. With findFirst, the pipeline can stop after the first match in encounter order.',
      'Trace [A1 closed, A2 open, A3 open]. Filtering passes A2 and A3. With findFirst, A3 need not be examined once A2 is found in a sequential traversal. With toList, both eligible IDs are needed. The output list returned by Stream.toList is unmodifiable, and mutable elements referenced by it can still change.',
      'Use pure predicates and transformations so tests can reason about the result rather than callback side effects. A terminal operation is allowed to avoid work that cannot affect its result. For example, count may use the size already known for a list-backed stream instead of running a mapping callback. Choose a conventional loop when the operation depends on ordered state changes.'
    ],
    takeaways: ['Terminal demand drives intermediate work.', 'findFirst and toList have different stopping conditions.', 'Keep observable state changes outside a projection pipeline.'],
    practice: ['Implement a loop and a stream for finding the first open seat.', ['Both return A2 for [A1 closed, A2 open, A3 open].', 'Both return an empty result on an empty input or when all seats are closed.']],
    interview: [
      ['What does laziness buy in a filtered findFirst pipeline?', 'Intermediate work happens as a result is demanded. A sequential pipeline can stop at its first matching item.'],
      ['Why is map a poor place for logging that must happen for every element?', 'Stream implementations can short-circuit or elide operations where their side effects are irrelevant to the result. An explicit traversal or terminal operation gives a clearer contract.'],
      ['What changes when you replace findFirst with toList?', 'The result changes from a possible first match to all matching IDs. Traversal usually must consider the entire input and the collected list needs memory proportional to the output.']
    ],
    check: ['Which operation asks an ordered pipeline to produce its first matching value?', ['filter', 'map', 'findFirst', 'sorted'], 2, 'filter and map are intermediate operations. findFirst is a short-circuiting terminal operation.'],
    references: [['Dev.java · Stream API', 'https://dev.java/learn/api/collections-and-streams/streams/']]
  },
  'j-concurrency-02': {
    notes: [
      'Visibility asks whether a thread can observe a write made by another thread. Atomicity asks whether competing threads can interleave inside a sequence of actions. A volatile holder can make an individual write visible. Both workers can still read an empty holder before either writes, so volatile alone leaves a check-then-act race.',
      'Guard the read of the holder, the decision and the assignment with the same monitor. In the intended trace the first thread enters, reads empty, writes U1 and unlocks. The second thread then locks and sees U1. The unlock happens-before a later lock on that monitor. A barrier for starting the workers belongs outside this guarded sequence so one worker never waits for the other to enter an already occupied critical section.',
      'The monitor protects cooperating threads using that object in the same JVM. Independent JVMs can each see their own empty local copy. When the invariant applies across processes, put it in a shared authoritative write, such as a database update guarded by an availability predicate.'
    ],
    takeaways: ['One shared monitor must protect the full check and write.', 'Happens-before explains visibility across matching monitor operations.', 'Independent JVMs need a shared authority for cross-process invariants.'],
    practice: ['Run a two-thread claim fixture using a shared seat and a start latch.', ['Exactly one result is true and the final owner matches the winner.', 'A deliberately unguarded control shows why separate reads and writes are unsafe.']],
    interview: [
      ['Why can a volatile owner still allow two successful claims?', 'Reads and writes may be individually ordered, but both threads can observe empty before either assignment. The multi-step operation lacks atomicity.'],
      ['What synchronization event orders the critical sections?', 'An unlock on a monitor happens-before a subsequent lock of that same monitor. The read and write must take part in that protocol.'],
      ['What changes when your application runs in two JVMs?', 'Java monitor identity stays inside one process. Apply the guard in a shared authority and test two original writers.'],
      ['Where should the test’s start barrier live?', 'Before entering the same exclusive lock. A barrier inside it can wait forever for a worker which cannot enter.']
    ],
    check: ['Both threads read empty before either writes a volatile owner. What can happen?', ['Both can report success.', 'Volatile guarantees exactly one winner.', 'Java refuses the second read.', 'The second write throws an exception.'], 0, 'Visibility of one field does not make the check and write one atomic action.'],
    references: [['Java Language Specification · Happens-before order', 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5']]
  },
  'b-transactions-01': {
    notes: [
      'A transaction groups statements into one unit. Committing keeps the unit’s changes and rolling back discards them. In JDBC the statements must share the same connection with auto-commit disabled for this exercise. If a booking update is committed before an audit insert, failure in the insert cannot roll back the booking that already committed.',
      'Atomicity and isolation answer different questions. In PostgreSQL Read Committed, ordinary statements see committed data as of the beginning of each statement. In Repeatable Read, the transaction keeps the snapshot established by its first relevant statement. A second query in the same transaction can still read the older owner even after a different connection commits a new value.',
      'A serialization failure asks the caller to reconsider the whole transaction, including reads used to make decisions. Retry by opening a fresh transaction under a bounded policy. Verify durable results from an independent connection. A result read on the same connection may see that transaction’s own uncommitted work.'
    ],
    takeaways: ['Group dependent writes on one connection.', 'Snapshot visibility depends on isolation and when a read starts.', 'Retry a failed serializable transaction from its decision reads.'],
    practice: ['Compare two PostgreSQL connections. Read A1 on B, update and commit A, then read again on B.', ['At Read Committed, a new B statement sees the new value.', 'At Repeatable Read, an established B snapshot sees the old value.', 'Rolling back a separate trial leaves the committed state unchanged.']],
    interview: [
      ['Why is a JDBC transaction scoped to a connection?', 'The database session holds the transaction state and applies commit or rollback to the statements executed in that unit. A separate connection owns a separate unit.'],
      ['How do you prove which snapshot a query saw?', 'Coordinate two connections, record read and commit order, fix the isolation level, and compare the second read in the same transaction with the first read in a new transaction.'],
      ['How do you retry a serialization failure safely?', 'Roll back the failed transaction, start a fresh one, recreate all decision inputs and enforce a retry limit.']
    ],
    check: ['B reads A1 under PostgreSQL Repeatable Read. A then commits a new owner. What can B read again before ending its transaction?', ['The owner from its first snapshot.', 'The new owner in every case.', 'An uncommitted owner from another session.', 'Nothing; the row stays locked until A ends.'], 0, 'PostgreSQL Repeatable Read retains the established transaction snapshot for ordinary reads.'],
    references: [['PostgreSQL · Transaction isolation', 'https://www.postgresql.org/docs/current/transaction-iso.html']]
  },
  'b-validation-01': {
    notes: [
      'Validation at the Spring MVC boundary rejects input that cannot be used as a command. Malformed JSON fails during request decoding. A well-formed JSON object can still fail DTO validation, for example if a required seat ID is blank. These are different paths and can share HTTP 400 with different stable public error codes.',
      'A syntactically valid request can reach the application and fail for a business reason. In this booking API a nonexistent seat yields 404 and a valid claim on an occupied seat yields 409. The application must always protect ownership. An internal importer can bypass MVC, which is why checking caller authority and essential business preconditions only in annotations leaves an uncovered path.',
      'Protect error details. Return enough structured information for clients to choose a repair, and omit stack traces and internal storage information. Record an authorization decision before disclosing existence if the product uses that security policy. In the test, check the response status and error code as well as the final ownership state.'
    ],
    takeaways: ['Decoding, request validation and domain checks have different responsibilities.', 'Document stable client error codes.', 'Verify the protected state stays unchanged after a rejected request.'],
    practice: ['Exercise request decoding and DTO validation, then call the booking service directly with invalid input.', ['Malformed JSON and blank IDs map to 400 with distinct documented codes.', 'Unknown and occupied seats map to the documented 404 and 409 with no unintended state change.']],
    interview: [
      ['What can @Valid protect?', 'It validates the request object at the configured entry point. It does not cover callers that bypass MVC or replace checks inside the domain’s authoritative operation.'],
      ['When can a request produce 409?', 'When it is valid but conflicts with current resource state, such as another owner already taking the seat.'],
      ['How do you confirm malformed input did no damage?', 'Exercise the real endpoint and also check the persisted owner, with a direct-service fixture for use cases which bypass HTTP.']
    ],
    check: ['A valid booking request targets a known occupied seat. Which status fits this API?', ['400 malformed request', '409 conflict', '201 created', '404 not found'], 1, 'The request can be decoded and validated. The protected write fails because the seat is already owned.'],
    references: [['Spring Framework · MVC validation', 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html']]
  },
  'l-uml-01': {
    notes: [
      'A class diagram describes the static design. For the booking example it can show that BookingService uses a SeatRepository and Seat protects its transition. Names, responsibilities and cardinalities should trace back to a requirement. Include a relationship only when it explains an ownership rule or dependency in the task.',
      'A sequence diagram describes one execution. Draw the caller, service, repository and Seat as participants. The service looks up the seat and asks it to claim itself. Show an alternate branch for an occupied seat and the return to the caller. A class diagram tells you which objects can collaborate. The sequence explains when they do and what happens on the failure path.',
      'Compare the diagrams against the actual method and test. If a controller invokes a generic owner setter in the diagram, the design allows a path that bypasses the invariant. Move the transition into the owner of the rule, then redraw the sequence and test that a rejected request leaves the original owner in place.'
    ],
    takeaways: ['Use class diagrams for responsibilities and relationships.', 'Use sequence diagrams for calls, order and branches.', 'Trace the diagrams back to code and an invariant test.'],
    practice: ['Draw a class and sequence view for the same two booking outcomes.', ['Both diagrams agree on the object that protects ownership.', 'Show the alternate conflict path and one test that checks the final owner.']],
    interview: [
      ['What does a sequence diagram reveal that a class diagram does not?', 'Its timeline shows who calls whom, ordering and result branches. The class view describes relationships and static responsibilities.'],
      ['How would you extend the diagram for cancellation?', 'Add an explicit cancel interaction with caller authorization and an alternate branch for a mismatch, while the domain transition remains protected.'],
      ['What code evidence would support the UML?', 'A small test of the actual booking and conflict path that asserts the return value and final owner.']
    ],
    references: [['LLD roadmap · UML and sequence examples', 'https://rishabh10045.github.io/studyapp/lld/roadmap.html']]
  },
  'h-scaling-01': {
    notes: [
      'Scale vertically by giving one instance more capacity. This can be a quick upgrade when the service saturates CPU or memory and the hardware limit and restart cost are acceptable. Scale horizontally by adding instances and routing traffic over healthy targets. This can improve availability as well as throughput, while making routing, coordination and deployment more complex. Start from the saturated resource and a measurable latency or availability objective.',
      'Suppose an application sustains 80 requests per second per instance at the agreed p95 latency, and the database sustains 120 requests per second for the same mix. One instance can handle up to 80 under these assumptions. Two app instances give a 160 RPS app ceiling and still cap the system at 120. Adding a third app instance leaves the same ceiling until the dependency changes. Include the cost of each replica and verify the real curve with measurements.',
      'Round robin routes successive requests around ready targets. Least connections can favor a target with fewer active connections when connection counts track work. IP hashing can route one source consistently, and shared proxies can skew it. Sticky routing that keeps a session in an app process can lose that session when the process fails or is replaced. Store necessary session state in a shared store or use a verified token for the appropriate state, and keep booking ownership in the authoritative database.',
      'Autoscaling needs a signal, target range, upper and lower bounds, and time for new instances to become ready. A growing queue with saturated workers can justify adding capacity. A growing queue caused by a saturated database needs a dependency fix or load control, since more workers can add contention. Deploying across regions adds latency and consistency decisions for the shared write path. Treat those decisions separately from adding replicas inside one region.'
    ],
    takeaways: ['Measure saturation at the app and its dependencies.', 'Adding replicas improves the capacity of the layer you replicate.', 'Verify an identical outcome when requests reach different healthy targets.', 'Choose scaling signals and wait for readiness before shifting traffic.'],
    practice: ['Spend 15 minutes in the Day 17 Learn block working the capacity trace, then use the existing hands-on assignment to route requests to two processes and observe a shared database. Repeat after removing one ready app process.', [
      'State the 80 RPS app limit with one process and the 120 RPS dependency limit with two, showing units and assumptions.',
      'Identify one useful vertical upgrade and one scenario where healthy horizontal replicas improve availability.',
      'A request to the remaining process observes the authoritative owner after the other process is removed. Competing attempts still leave one owner.',
      'Explain when routing affinity would hide a process-local session dependency and how to verify failover without it.'
    ]],
    interview: [
      ['What are the vertical and horizontal scaling choices for an overloaded application?', 'A vertical change increases resources on one process or host. A horizontal change uses more instances and routes work across them. The saturated layer, restart risk, availability need and measured cost determine the choice.'],
      ['Why does adding a third app node fail to increase this example’s throughput?', 'Two nodes already offer 160 RPS of app capacity while the dependency caps the same workload at 120 RPS. Use dependency metrics and a fixed traffic mix to verify that boundary.'],
      ['What problem can sticky routing hide?', 'An app may store essential session state in one process. Affinity makes that appear to work until failover, process replacement or imbalance. Route the same workflow across different instances to expose it.'],
      ['What should be checked before scaling on queue depth?', 'Check whether app workers or a downstream dependency are saturated, set replica limits, and measure how long new instances take to become healthy. The useful action depends on the causing layer.']
    ],
    check: ['Two app processes can serve 80 RPS each. The shared database supports 120 RPS for the same workload. What is the system ceiling in the example?', ['80 RPS', '120 RPS', '160 RPS', '200 RPS'], 1, 'The application ceiling is 160 RPS and the dependency ceiling is 120 RPS. The smaller capacity limits this workload.'],
    references: [
      ['GeeksforGeeks · System Design Training, Module 2', 'https://www.geeksforgeeks.org/courses/system-design-training-program'],
      ['Kubernetes · Horizontal Pod Autoscaling', 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/']
    ]
  },
  'h-estimates-01': {
    notes: [
      'Start a capacity estimate with a time window and workload units. For example, 12,000 visitors over a ten-minute wave is 20 visitors per second on average in that wave. At five seat-map requests per visitor, that is 100 read requests per second. At ten percent booking conversion there are about two write attempts per second. Report the assumptions so another person can change one and recalculate.',
      'The average inside the wave is still an average. A threefold peak gives 300 reads/s. If a single event receives 80 percent of those reads, its key receives around 240 reads/s. A steady 95 percent cache hit rate would send around 12 reads/s for the hot event to the origin, assuming one fetch per miss. A cold-cache surge or slow fill can produce a different result.',
      'Translate a quantity into a decision you can test. Read origin load suggests a cache refill and admission policy. Concurrent claims on one seat point to coordination and lock-wait behavior at the authoritative write. Measure traffic shape, cache hit rate and tail latency to check your assumptions.'
    ],
    takeaways: ['State units and the time window.', 'Estimate average, peak and hot-key load separately.', 'Connect a number to a tested design decision.'],
    practice: ['Recompute peak origin load at hit rates of 95 and 80 percent for the hot event.', ['At 240 reads/s the two estimates are 12 and 48 origin reads/s respectively.', 'Name a measurable symptom a cold-cache burst would change.']],
    interview: [
      ['How do you justify your first scale decision?', 'Compute the relevant workload and hot key from stated assumptions, name the bottleneck and propose a measurement to test it.'],
      ['Why can aggregate traffic hide overload?', 'Load can concentrate on one database row, cache key or partition. Per-key arrival and queueing can saturate before the aggregate does.'],
      ['What changes if the cache is cold?', 'The steady hit assumption fails. Misses can coalesce or amplify. Bound origin work and measure actual fill and connection wait.']
    ],
    check: ['A hot event gets 240 reads/s and has a 95% hit rate. With one origin fetch per miss, what is its steady origin rate?', ['12 reads/s', '24 reads/s', '228 reads/s', '48 reads/s'], 0, 'The miss rate is 5%. Multiplying 240 by 0.05 yields 12 reads per second.'],
    references: [['GFG · System Design syllabus, scaling foundations', 'https://media.geeksforgeeks.org/courses/syllabus/973f73599e070cabefcf71cd54e1ff1f.pdf#page=4']]
  },
  'd-union-find-01': {
    notes: [
      'Union-Find, or disjoint-set union, represents a partition into connected components. Each element starts as a root. find walks parents until it reaches a root. union searches for both representatives and links them only when they differ. The number of components decreases exactly once per successful union.',
      'Trace four independent vertices. Union(0,1) leaves three components. Union(1,2) leaves two. Union(0,2) changes nothing because a path already connects those vertices. Vertex 3 remains isolated. Query find each time because representatives may change after a merge.',
      'Attach the smaller component root to the larger root, storing meaningful size only at roots. Path compression shortens future lookups. Together they yield amortized inverse-Ackermann cost per operation after initialization. This structure tracks additions well. A deletion may split one component and requires more information than the stored representatives provide. Use the Day 55 Java example to see how Kruskal consumes the union result.'
    ],
    takeaways: ['A component’s representative can change.', 'Skip merges of matching roots.', 'Separate dynamic connectivity from edge deletion and shortest paths.'],
    practice: ['Run the Day 55 Java example and test the UnionFind component counter separately.', ['After 0–1 and 1–2, exactly two components remain among four vertices.', 'A redundant 0–2 union returns false and keeps the count unchanged.']],
    interview: [
      ['What invariant does the parent array maintain?', 'Every vertex follows a chain to a representative root, and two vertices are in the same set exactly when their current roots are equal.'],
      ['Why combine union by size and path compression?', 'Linking by size controls new depth. Finding a root shortens existing paths. Together they make repeated operations cheap under the amortized bound.'],
      ['Why does ordinary Union-Find struggle with edge deletion?', 'Its parent links represent set membership and may not correspond to original graph edges. It cannot tell whether removing an original edge splits the set.'],
      ['How does the union result support Kruskal?', 'A successful union adds connectivity without a cycle, so the sorted edge can be accepted. A redundant union signals an existing path.']
    ],
    check: ['With four vertices, union(0,1), union(1,2) and union(0,2) run in that order. How many components remain?', ['1', '2', '3', '4'], 1, 'The first two unions merge sets. The third endpoints already match, and vertex 3 remains separate.'],
    references: [['Princeton · Union-Find', 'https://algs4.cs.princeton.edu/15uf/']]
  },
  'ai-rag-01': {
    notes: [
      'A retrieval-augmented generation system looks up relevant reference passages at request time, gives the model a bounded context and then validates the result. For the booking help feature, a retriever should select current, authorized policy text and retain passage IDs. A policy answer can cite those IDs and explain a rule. The booking service itself still enforces ownership through its authoritative operation.',
      'Retrieval and grounding fail in different places. If the current 48-hour refund policy never appears in the selected context, diagnose candidate filtering, chunk boundaries and ranking. If the correct passage appears and the model says 24 hours, retrieval found evidence and the generated claim is unsupported. A valid JSON response that cites the correct passage can still contradict it.',
      'Test three outcomes with deterministic Java fixtures. A supported answer passes. A plausible claim that conflicts with the supplied text falls back after validation. A question with no authorized evidence also falls back. Keep separate counts for retrieval misses, unsupported claims and correct abstentions so that a misleading aggregate score does not hide what needs repair.'
    ],
    takeaways: ['Keep retrieval, generation and validation observable as separate stages.', 'Citation membership alone does not establish claim support.', 'Return the defined fallback when approved evidence is missing or insufficient.'],
    practice: ['Build three Java evaluator fixtures using a versioned refund policy excerpt.', ['An answer that matches the authorized excerpt is accepted. A contradicting answer falls back even with the right citation.', 'No available evidence yields the documented fallback. Report the failure stage for each fixture.']],
    interview: [
      ['Which parts of a RAG pipeline can fail independently?', 'Retrieval can miss the required passage, generation can contradict a retrieved passage, and validation can accept an unsupported claim. Control one stage at a time in tests.'],
      ['How would you separate a retrieval miss from a model failure?', 'Give the model the known relevant passage directly and compare with normal retrieval. Inspect authorized top-k results separately from supported claims.'],
      ['What must a citation validator verify?', 'The cited passage belongs to the approved context, and its content actually supports the material claim. A stable ID alone is insufficient.'],
      ['What happens when the provider or evidence path fails?', 'The help feature returns a bounded deterministic fallback. Booking authority and domain transitions stay in the Java service and database.']
    ],
    check: ['The correct passage was retrieved and cited, but the answer contradicts it. Which result should be recorded?', ['Retrieval was a miss.', 'The candidate is supported because the source ID exists.', 'Retrieval succeeded but grounding or its validation failed.', 'The passage was wrong and should be removed from the index.'], 2, 'The evidence was present. Compare the actual generated claim with that passage and measure grounding separately.'],
    references: [['Spring AI · Retrieval Augmented Generation', 'https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html']]
  }
};

// Day 1–2 packets added by Grok (2026-11-22); keys outside the topic index (lane packets) stay in day-depth.js.
for (const [id, packet] of Object.entries(depthPackets)) if (!id.includes('.')) topicLessons[id] = packet;
for (const [id, code] of Object.entries(packetCode)) if (topicLessons[id] && !topicLessons[id].code) topicLessons[id].code = code;
// Days 55–56 (Grok, late-depth.js): fuller answers for existing questions; only applied while the question text matches.
for (const [id, answers] of Object.entries(lateTopicAnswers)) for (const qa of topicLessons[id]?.interview || []) if (answers[qa[0]]) qa[1] = answers[qa[0]];
// Day 39 (Grok, late-depth.js): runnable Java for existing packets without code.
for (const [id, code] of Object.entries(lateTopicCode)) if (topicLessons[id] && !topicLessons[id].code) topicLessons[id].code = code;
// Days 9–25 (Grok, late-depth.js): extra paragraphs for short Codex packets; appended once, never replacing Codex text.
for (const [id, extra] of Object.entries(lateTopicNotes)) if (topicLessons[id]) topicLessons[id].notes = [...topicLessons[id].notes, ...extra];
