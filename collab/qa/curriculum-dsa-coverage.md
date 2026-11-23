# GeeksforGeeks DSA coverage audit

Audited the 54-day baseline in `gpt/qa` at `1d283b7` on 22 November 2026 IST. The matrix reflects that baseline plus the two lesson fixes in this checkpoint. Public `main` at `bb2a613` contains the earlier UI. Grok’s v2 work at `0e97dfa` uses example curriculum data. The table tracks the real Codex lessons.

The public class listing has 24 classes and 73 published bullets. Each row below corresponds to one listed bullet and identifies the status of the individual topics when they differ. The Track 1 curriculum in the PDF spans physical pages 7–9. Its topics all appear in the finer class listing. The supplemental programme and catalogue text mention additional topics that are recorded separately. Track 2 System Design is a separate reconciliation.

After this checkpoint, 14 of the 73 rows are covered (including the Java equivalent of the STL exercises), 32 are partial and 27 are missing. Counts are per source row. A row listing five topics can be partial even when four are taught.

- [Official course class listing](https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course)
- [Official syllabus PDF, Track 1 starts on page 7](https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf#page=7)
- Downloaded PDF SHA-256 `374a73058f8c3a9050c7ea0f31e866a8f4465709df0d0f59c3be82ba8a192ee9` matches the saved snapshot.

A row is **covered** when the topic has instructional evidence in notes and a trace or a learner check. **Partial** means a named part, an algorithm derivation, or applied practice still needs work. **Missing** means comparable teaching was absent. **Optional extension** applies to an explicit out-of-core offering or supplementary technique. **Source unverified** means the public material does not specify what is required. Coverage is editorial unless a Java fixture is explicitly recorded. Proposed minutes are for the named addition and can share a 30-minute DSA slot with a related addition. They do not change the existing day numbers.

## Lesson evidence index

| Day | Stable lesson ID | Evidence reviewed |
| --- | --- | --- |
| 1 | `j-oop-01` | Set-based duplicate scan in Java with time and memory assumptions |
| 4 | `j-equality-01` | Immutable keys, equality, collision fixture, and comparison of map/set contracts |
| 26 | `d-complexity-01` | Algorithm cost, scan and frequency counts, prefix-sum example, and added recursion trace and exercises |
| 27 | `d-pointers-01` | Monotone boundaries, distinct window, and iterative and recursive lower-bound fixtures |
| 28 | `d-sort-01` | Stable merge trace, singly linked reversal, and Java stack delimiter check |
| 29 | `d-lru-02` | Hash map plus doubly linked list, hit/update/eviction invariants, and access-order comparison |
| 30 | `d-recursion-01` | Recursive tree visit, depth limits, BST inorder and bounded heap top-k trace |
| 31 | `d-graphs-01` | Adjacency lists, BFS parents, DFS components, and multi-source BFS extension |
| 32 | `d-greedy-01` | Earliest-finish exchange argument, weighted counterexample, and recurrence |
| 52 | `d-backtracking-01` | Choose/recurse/undo, dependency cycles, topological ordering and Dijkstra selection |
| 53 | `d-math-01` | Java GCD and rotation fixtures, subset-sum update direction, and matrix-chain trace |

## PDF page 7 · Classes 1–10

| Class item | Topic and coverage | Current evidence and remaining work |
| --- | --- | --- |
| 1.1 | Time, space and asymptotic analysis — **covered** | D26 defines input size, worst-case work and auxiliary space. Compare scan, prefix preprocessing and range-query costs. |
| 1.2 | Bitwise parity and swapping — **missing** | Add 15 min after basic complexity. Trace bit masks and parity for positive and negative ints. Compare XOR swap with a readable temporary variable, including the same-position case. |
| 1.3 | Binary, octal, decimal, hex and conversion — **missing** | Add 20 min in Math Foundations. Round-trip a value through three bases and reject an invalid digit. State signed input and overflow rules. |
| 2.1 | Primality checking — **missing** | Add 15 min before the sieve. Use the square-root bound and fixtures for 0, 1, 2 and a perfect square. Use `d <= n / d` for large ints. |
| 2.2 | Sieve of Eratosthenes — **missing** | Add 20 min after prime checking. Trace marking from p² and verify generated primes through 30 and bounds below 2. |
| 2.3 | Euclid, LCM and arrays — **partial** | D53 teaches Euclid with zero and ordinary pairs. Add 20 min for LCM from GCD, divide-before-multiply, zero policy and an array fold. Place in Math Foundations before array rotation. |
| 2.4 | Fractions and modular arithmetic — **missing** | Add 20 min after GCD. Exercise reducing signed fractions and distinguishing Java remainder from normalized modulo. The listing gives no additional problem names. |
| 3.1 | Arrays, updates, second maximum and leaders — **partial** | D26 covers indexing, shifting and scans. Add 25 min for insertion/deletion contracts, second *distinct* maximum and suffix leaders, including duplicates and a one-element array. |
| 3.2 | Kadane and single buy/sell — **missing** | Add 30 min after scanning. Derive best suffix and best so far on all-negative data. Give stock a no-transaction option and test a decreasing sequence. |
| 3.3 | Juggling and reversal rotations — **missing** | D53 rotates a matrix. Add 30 min of 1-D array rotation after GCD, with normalization for k ≥ n, a nontrivial GCD and empty input. |
| 4.1 | Boyer–Moore majority vote — **missing** | Add 20 min after frequency counting. Trace candidate cancellation and verify the candidate when a majority is not guaranteed. |
| 4.2 | Subarrays, subsequences, prefix and suffix arrays — **partial** | D26 teaches prefix sums and D27 uses contiguous spans. Add 25 min to distinguish subsequences and demonstrate suffix aggregates with an exact expected result. |
| 4.3 | Sum, product and window problems — **partial** | D26 gives range-sum preprocessing and D27 gives a distinct window. Add 30 min for signed product tracking and a sum-window problem, including when negative numbers invalidate a shrinking sum window. |
| 5.1 | Two-pointer pair and triplet sums — **partial** | D27 teaches two moving bounds for a distinct window. Add 30 min for sorted pair/triplet elimination, duplicate handling and a safe target arithmetic policy. |
| 5.2 | Dutch National Flag — **missing** | Add 25 min after two pointers. Trace low/mid/high regions and retest the value swapped in from the end. Verify counts and order for an input containing all three categories. |
| 5.3 | Window maximum sum and longest substring — **partial** | D27 covers a longest distinct window over strings or IDs. Add 20 min for fixed-length maximum sum, including negative values, invalid k and a comparison with unrestricted Kadane. |
| 6.1 | Hash functions, collisions and hash tables — **covered** | D4 explains stable hashing and equality and assigns colliding unequal keys. D26 explains expected lookup cost under a hash and key-cost assumption. |
| 6.2 | Unordered map/set implementation in STL — **covered by Java equivalent** | D1 uses a Set for membership and D4 implements an immutable-key map exercise. Java uses `HashMap` and `HashSet`. The source’s C++ container syntax is an **optional extension** outside the Java-first pathway. |
| 6.3 | Frequencies, subarray sums and hash-map patterns — **partial** | D26 covers frequencies and prefix range sums. Add 25 min for target-sum subarray counts using earlier prefix frequencies, including zero prefixes and mixed signs. |
| 7.1 | Call stack, decreasing measure and base cases — **covered** | Baseline D30 introduced these only inside tree traversal. D26 now teaches the standalone contract, shows a runnable Java call/unwind trace and asks for depth and work analysis before D28 and D30. |
| 7.2 | Factorial and Fibonacci — **covered** | Both were absent as dedicated baseline exercises. D26 now explains the two base contracts, repeated work in Fibonacci and exact Java fixtures, including negative-input rejection. |
| 7.3 | Hanoi and introduction to backtracking — **partial** | D52 already teaches recursive choose/undo through seat assignments. Add 30 min after D26 for three-peg Hanoi, its output recurrence, and replay that checks every move is legal. Keep D52’s choose/undo as a later revisit. |
| 8.1 | Linear search — **partial** | D26 teaches linear scans, but exact-match and first-index contracts are absent. Add 10 min before binary search with a duplicate and a missing target. |
| 8.2 | Iterative and recursive binary search — **covered** | D27 now teaches both versions of lower bound and the exact-match wrapper. Tests include duplicate targets, a missing interior target and an empty array. |
| 8.3 | Rotated-array search, floor and ceiling — **partial** | D27 lower bound gives the ceiling when it exists. Add 25 min for floor via upper bound and sorted-half selection on rotated arrays. Specify a separate duplicate case. |
| 9.1 | Bubble, selection and insertion sort — **missing** | Add 30 min before merge sort. Compare swaps/writes, early exit and stability with tagged equal keys. |
| 9.2 | Merge sort and quicksort — **partial** | D28 traces and checks stable merge sort. Quicksort appears as a brief cost comparison. Add 30 min for partition invariants, all-equal keys, pivot choice, and worst-case depth. |
| 9.3 | Cyclic sort and Shell sort — **missing** | Add 25 min in Sorting. Explicitly state the bounded-value or permutation precondition for index-placement cyclic sort. Trace Shell’s gap passes and compare with the final insertion pass. |
| 10.1 | Row, column and spiral traversal — **missing** | D53 covers rotation. Add 25 min in Matrices to traverse rectangular rows and columns and shrink spiral boundaries without emitting a single row or column twice. |
| 10.2 | Rotation, transpose and matrix search — **partial** | D53 teaches rotation and the transpose step, including a rectangular fixture. Add 25 min for a standalone rectangular transpose and matrix search with an explicit sortedness contract. |
| 10.3 | Directional matrix exercises — **missing** | Add 20 min after spiral traversal. Verify bounds and order on a one-row grid, a one-column grid and an empty grid. Public label names no other mandatory exercises. |

## PDF page 8 · Classes 11–19

| Class item | Topic and coverage | Current evidence and remaining work |
| --- | --- | --- |
| 11.1 | Singly, doubly and circular linked lists — **partial** | D28 covers singly linked reversal and D29 uses doubly linked nodes in LRU. Add 30 min for head/tail insert/remove, empty and singleton invariants, and circular termination. |
| 11.2 | Middle, reversal and intersection — **partial** | D28 teaches reversal with saved next reference. Add 30 min for slow/fast middle with an even-length policy and intersection by node identity, including disjoint lists. |
| 11.3 | Floyd cycle detection — **missing** | Add 25 min after slow/fast middle. Trace the meeting argument, a self-loop and a noncyclic list. |
| 12.1 | Cycle length and entry — **missing** | Add 20 min after detection. Count one lap from the meeting point. Reset one pointer to head and trace the equal-step entry search. |
| 12.2 | LRU cache from links and hashing — **covered** | D29 gives a map-of-nodes and doubly linked list implementation task with exact capacity-two hit/update/eviction checks and consistency across both structures. |
| 12.3 | Merge k sorted lists — **missing** | Add 30 min after heaps as a spiral review of linked nodes. Merge known head values with a min-heap, verify empty lists and compare with pairwise merge. |
| 13.1 | Stack backed by array or linked list — **partial** | D28 teaches LIFO using `ArrayDeque` in delimiter validation. Add 30 min for both representations, resizing or overflow policy and underflow behavior. |
| 13.2 | FIFO, circular queue and deque — **partial** | D31 uses FIFO in BFS and D28 names `ArrayDeque`. Add 30 min for ring-buffer wraparound, empty/full distinction and operations at both ends. |
| 13.3 | Expression evaluation, bracket balance and undo/redo — **partial** | D28 teaches bracket matching. Add 30 min for postfix evaluation with operand order and two-stack undo/redo with redo invalidation after a new action. |
| 14.1 | Next greater element and window maximum — **missing** | Add 30 min after stack and deque. Maintain monotone indices, state the equal-value rule and test expiry at the window boundary. |
| 14.2 | Stack↔queue implementations — **missing** | Add 25 min after both underlying structures. Trace two-stack queue transfer and one-queue stack rotation. Explain the costs per operation and amortized queue cost. |
| 14.3 | Stack and queue optimization practice — **partial** | D28 delimiter validation and D29 recency operations are available. Use 15 min after 14.1 and 14.2 to compare brute force with amortized designs. The public listing gives no extra problems. |
| 15.1 | Permutations of arrays or strings — **partial** | D52 covers ordered distinct seat assignments through choose/recurse/undo. Add 25 min to generate all permutations explicitly and handle duplicate inputs with `[1,1,2]`. |
| 15.2 | Combinations and subsets — **missing** | Add 30 min after the recursion prerequisite. Teach take/skip and increasing start index. Verify the empty subset and choose-0 or choose-too-many boundaries. |
| 15.3 | Recursive search trees — **covered** | D52 traces two users and three seats through state, choice, recursive descent and undo. The exercise is enough for the published broad description. Separate tests remain needed for named problem families. |
| 16.1 | Maze backtracking — **missing** | Add 25 min after subset/search-tree exercises. Specify the allowed moves and whether outputs count paths or return one path. Test a blocked entrance and no-solution grid. |
| 16.2 | N-Queens pruning — **missing** | Add 30 min for row state and column/diagonal guards. Verify 0 solutions at n=2 and 2 at n=4. Compare valid pruning with mistakenly discarding a viable branch. |
| 16.3 | Sudoku validation and solver — **missing** | Add 45 min in two DSA slots after N-Queens. Detect contradictory clues, preserve clues and verify a solved grid. Distinguish invalid starting grid from a valid grid with no solution. |
| 17.1 | Tree basics, types, linked and array representations — **partial** | D30 assumes linked child visits and sketches BST order. Add 25 min to define full, complete and skewed trees and translate a small array-indexed example to nodes. |
| 17.2 | Preorder, inorder and postorder — **covered** | D30 teaches all three visits with a base case and a worked three-node tree trace. |
| 17.3 | Height, node count and sum — **partial** | D30 relates height to stack depth. Add 30 min for three recursive aggregations with explicit empty-tree height convention, including empty and skewed fixtures. |
| 18.1 | BST search, insert and delete — **missing** | D30 mentions valid BST inorder. Add 45 min across two slots for search/insert and leaf, one-child and two-child deletion with a duplicate policy. |
| 18.2 | BST inorder predecessor and successor — **missing** | Add 25 min after BST mutation. Trace ancestor and subtree cases, including a boundary where no predecessor or successor exists. |
| 18.3 | BST exercises and path sum — **missing** | Add 25 min for BST invariant validation and root-to-leaf path sum. Test a prefix with the target total where the last node is still internal. |
| 19.1 | Min- and max-heap concepts — **partial** | D30 uses the max-heap root as the top-k retention threshold and contrasts applications. Add 15 min for min-heap indexing, child selection and heap vs sorted order. |
| 19.2 | Heapify, insert and delete — **partial** | D30 uses root replacement and `PriorityQueue` but does not implement sift steps. Add 30 min for bottom-up heapify and insert/pop, with singleton and arbitrary input tests. |
| 19.3 | Priority queue applications — **covered** | D30’s streaming top-k lab uses a bounded queue and checks the final output and tie handling. D52 gives a later graph application. |

## PDF page 9 · Classes 20–24

| Class item | Topic and coverage | Current evidence and remaining work |
| --- | --- | --- |
| 20.1 | Adjacency list and adjacency matrix — **partial** | D31 teaches lists and sparsity. Add 20 min to build both from the same edge list and compare neighbor iteration, edge query and space. |
| 20.2 | DFS and BFS — **covered** | D31 teaches stack/recursion versus queue, BFS discovery and parents, DFS components and a disconnected-vertex fixture. |
| 20.3 | Components, reachability and simple cycles — **partial** | D31 teaches components and reachable vertices and names the parent rule. Add 25 min to implement undirected cycle detection and test a triangle and a forest. |
| 21.1 | Directed and undirected cycle detection — **partial** | D31 distinguishes the parent, active and completed states. D52 tests a dependency cycle. Add a 25-min shared cycle exercise for a converging DAG vs a directed back edge, together with the undirected fixture. |
| 21.2 | DAG topological sort with DFS and Kahn — **partial** | D52 teaches the contract and cycle behavior. Add 30 min to implement indegrees and DFS postorder, compare valid outputs and reject a cycle in both. |
| 21.3 | Tasks and dependency resolution — **covered** | D52 uses prerequisites, a cycle and topological ordering. DSA extension should revisit separate choices of valid orders and scheduling constraints. |
| 22.1 | Dijkstra — **partial** | D52 checks the nonnegative-weight assumption and asks for a small comparison. Add 30 min to trace relaxation and stale queue entries and check distances, unreachable nodes and negative-edge rejection. |
| 22.2 | Multi-source BFS and flood fill — **partial** | D31 adds multi-source initialization and tie/unreachable checks. Add 25 min to implement flood fill on a rectangular grid, including a source already in the new color. |
| 22.3 | Course scheduling and dependency examples — **covered** | D52’s prerequisite ordering can use course prerequisites directly. The named success and cycle checks are present. |
| 23.1 | Fractional knapsack and greedy coin change — **missing** | Add 30 min after activity selection. Prove fractional value/weight order and give a noncanonical coin set where largest-first loses. |
| 23.2 | Activity selection — **covered** | D32 teaches the earliest-finish exchange and endpoint conventions, then contrasts the weighted problem. |
| 23.3 | 0/1 knapsack and subset sum — **partial** | D53 teaches 0/1 reachability and rejects reusing one weight. Add 30 min for value maximization with capacity, descending updates and a case where highest value alone is suboptimal. |
| 24.1 | Unbounded knapsack and coin-change DP — **partial** | D53 distinguishes ascending reuse conceptually. Add 30 min for an implemented unbounded value case and minimum-coin DP, separating unreachable states and combination counts. |
| 24.2 | Longest common and palindromic subsequences — **missing** | Add 45 min across two slots after prefix DP. Derive LCS and reconstruct one answer, then teach interval-state LPS with empty and singleton cases. |
| 24.3 | Matrix-chain multiplication and palindrome partitioning — **partial** | D53 provides a worked recurrence with two split costs. Add 30 min for palindrome partitioning with a minimum-cuts state, empty-string policy and multiple plausible cuts. |

## Additional public DSA items

| Locator | Topic and status | Scope and proposed check |
| --- | --- | --- |
| PDF p. 5, Skills You’ll Learn | Competitive programming and coding interview problem solving — **source unverified** for technique-level mapping | The skills are named without a separate problem list. Use Classes 1–24 for the published topic requirements. |
| PDF pp. 2 and 4, assessment and preparation overview | Coding assessment and interview-oriented practice — **partial** | The baseline has Day 45 evidence and interview prompts. Plan a subject-end timed problem set and score correctness, explanation and complexity. Verify it during the teaching-depth phase. |

## Sequencing and schedule repair

1. The primary missing prerequisite was an explicit Java recursion lesson before tree traversal and backtracking. D26 now reserves 30 minutes of the existing 65-minute practice block for call tracing and factorial/Fibonacci. D27 applies the contract to binary search. D26 and D27 still total 120 minutes each and retain their original lesson IDs and block IDs.
2. Sequence the next missing DSA groups as number/math foundations → arrays/windows → hashing and search → sorting and matrices → linked lists/stacks/queues → backtracking → trees/heaps → graphs → greedy/DP. The open rows estimate 1,555 minutes before reuse. Counting the shared graph-cycle fixture once gives 1,530 minutes, or 25 hours 30 minutes. This is a first-pass estimate of gap work. Pair short exercises and split longer exercises when mapping them into 30-minute DSA slots.
3. Build recurring DSA lesson slots in the subject-first schedule once the day/lesson adapter is ready. The existing core after Day 1 has 12 min revision, 28 min teaching, 65 min practice and 15 min review. It does not implement the agreed 12/78/30 allocation across all days. A mere reassignment of session titles would leave many hours of work unscheduled.
4. Give each cluster both a worked case and an independent Java task with checks. Use weekend stretch for multi-problem mocks, the second Sudoku slot or slower recurrence derivations. Keep the one-session-per-date rule and the 9–11 PM IST core while estimating which additional study days are necessary.

## Day 56 repair · 22 November 2026 IST

The original 73-row audit stays available as the historical baseline. Day 56 `d-bits-01` now includes five source-backed topic packets and a single standalone Java 21 program. The following rows changed.

| Source locator | Topic ID | Current status and evidence |
| --- | --- | --- |
| PDF p. 7 · Class 1.2 | `d-bits-01` | Covered. Signed odd/even, bit masks and XOR swap with independent and aliased indices. |
| PDF p. 7 · Class 1.3 | `d-bases-01` | Covered. Binary, octal and hexadecimal signed round trips, invalid digit and signed int overflow checks. |
| PDF p. 7 · Class 2.1 | `d-primes-01` | Covered. A factor-pair proof, inclusive sqrt boundary, prime square and maximum positive int fixture. |
| PDF p. 7 · Class 2.2 | `d-sieve-01` | Covered. Interactive trace from p², primes through 30, plus exhaustive small-bound comparison with trial division. |
| PDF p. 7 · Class 2.3 | `d-lcm-01` | Covered. Euclid and array LCM with zero/empty input, divide-first and checked overflow. |
| PDF p. 7 · Class 2.4 | — | Still missing the fractions and modular-arithmetic practice cluster. |

Re-evaluating the five changed rows against the original matrix gives 19 covered, 31 partial and 23 missing. This comparison concerns only the tracked 73 source rows. The 30-minute daily independent DSA lane remains open. Day 56 provides a prerequisite repair without renumbering prior study days.

## Days 26–27 source reconciliation · 23 November 2026 IST

Reviewed `main@cf892c462ca434cb8c712974f5f24238ca448043` and its newer Day 41–56 materials. The [GFG DSA and System Design public listing](https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course) supplied the numbered Classes 2–8 sections below. The official [combined PDF, physical page 7](https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf#page=7) supplies the chapter groupings. Its downloaded SHA-256 matched the saved snapshot (`374a73058f8c3a9050c7ea0f31e866a8f4465709df0d0f59c3be82ba8a192ee9`). These rows supersede the matching earlier judgments. Untouched rows retain their original review revision.

| Listing locator and topic | Day and current evidence | Status | Remaining work and minutes |
| --- | --- | --- | --- |
| Class 2.4 · Fractions and modular arithmetic | D53 `d-math-01` teaches modular inverse, including `3 mod 11 → 4` and no inverse for `2 mod 4`. | Partial | Add 20 min after GCD. Simplify −6/−8 → 3/4, normalize zero over a negative denominator, reject denominator zero and compare Java remainder with floorMod. The signed-long boundary is in the [corrections ledger](curriculum-enrichment-and-corrections.md). |
| Class 3.1 · Array operations, second largest, leaders | D26 `d-arrays-01` teaches logical size and shift order, second **distinct** maximum, and strict suffix leaders. Java fixture inserts and removes 7 in logical [4,9], returns −2 for [7,7,−2], and returns [8,3] for [8,8,3]. | Covered in this batch | The 30-minute lane adds full-buffer, invalid-position and invalid-range fixtures for the learner. The fixture executes ordinary shifts and duplicate boundaries. |
| Class 3.2 · Maximum subarray and single stock trade | D27 `d-pointers-01` works a fixed-width window. The plan lacks the unrestricted-sum ending-here recurrence and a one-trade running minimum. | Missing | Assign a 30-minute array slot after scans. Kadane on [−4,−2,−7] → −2 under a nonempty contract. Prices [7,1,5,3,6,4] → 5 and descending prices → 0 when skipping a trade is allowed. |
| Class 3.3 · Array rotations with juggling and reversal | D53 teaches matrix rotation, a different operation. | Missing | Assign 30 min after GCD. Left rotate [1,2,3,4,5,6] by 8 → [3,4,5,6,1,2]. Trace two gcd cycles and compare three reversals. State empty and negative-distance policies. |
| Class 4.3 · Subarray sum, product and windows | D26 `d-arrays-01` teaches half-open prefix sums. D27 `d-pointers-01` teaches fixed-width maxima including all-negative input and why signed values can invalidate a greedy sum window. | Partial | Use 25 min for maximum-product subarrays. Carry maximum and minimum ending products and test [−2,3,−4] → 24, plus a zero separator. |
| Class 5.1 · Sorted two-pointer pair and triplet | D27 `d-pointers-01` explains endpoint elimination and duplicate-aware triplets. The Java pair fixture rejects a false integer-overflow match. The triplet exercise expects (−2,0,2) exactly once. | Covered editorially | Execute the triplet extension and learner acceptance cases. The provided pair implementation ran. |
| Class 5.3 · Fixed-window maximum sum and longest distinct substring | D27 `d-pointers-01` has fixed-window and distinct-window traces. Java returns −7 on the negative fixed-window example and 3 on the distinct-window sequence. Text distinguishes UTF-16 units from code points. | Covered in this batch | ASCII maps to the tested ID sequence. A Unicode code-point implementation remains an optional exercise. |
| Class 6.3 · Frequencies and subarray-sum patterns | D51 prefix-frequency packet teaches earlier prefix counts, seeds zero, and covers zero and mixed signs. The supplied `PrefixWindows.java` runs a range and fixed-window example. | Covered editorially | Execute the target-sum count itself. For [0,0] with target 0 the result must be 3. |
| Class 7.1–7.2 · Call stack, base cases, factorial and Fibonacci | D26 `d-recursion-02` supplies a separate contract, call/unwind traces and Java 21 boundary checks. F(5) produces 5 in 15 calls and at most five active recurrence frames. Factorial(4) returns 24. | Covered in this batch | The learner compares iterative and naive execution and tests the F(93) rejection. |
| Class 7.3 · Hanoi and introductory backtracking | D52 `d-backtracking-01` teaches choose, recurse and undo. `PrunedSearch.java` also ran N-Queens examples (2/4/92 solutions for sizes 4/6/8). | Partial | Add a 30-minute Hanoi slot after D26. Replay three disks’ seven moves against peg-order constraints and verify zero disks makes zero moves. |
| Class 8.1 · Linear search | D26 `d-arrays-01` uses first hit, absence and empty input. D27 `d-search-01` contrasts linear search on unsorted input with the sorted-input condition for binary search. | Covered in this batch | — |
| Class 8.2 · Iterative and recursive binary search | D27 `d-search-01` provides both lower-bound versions, immediate duplicate and absent-target tests, and an exact-search sentinel check. | Covered in this batch | — |
| Class 8.3 · Rotated search, floor and ceiling | D27 `d-search-01` teaches and runs floor via upper bound and ceiling via lower bound. | Partial | Add 25 min for rotated-array search. Isolate the sorted half, include an absent key and document how repeated equal endpoints can force linear work. |

Other source classes and previously identified missing maze and Sudoku lessons stay open. Continue with Classes 4–6 and 8 after reading their existing source rows and the later Grok lessons.

## Days 28–29 and linked DSA prerequisites · 24 November 2026 IST

Reconciled `main@b7fac781615bb9119f0066d85ae00ca4cc0d037e` against all 15 bullets in Classes 9 and 11–14 of the [current GFG public listing](https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course). The [official combined PDF](https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf) groups Class 9 on physical p. 7 and Classes 11–14 on physical p. 8. The PDF matched the saved SHA-256 `374a73058f8c3a9050c7ea0f31e866a8f4465709df0d0f59c3be82ba8a192ee9`. These rows supersede the original 54-session judgments where they differ.

| Public listing row | Current lesson and verification | Status | Remaining repair and minutes |
| --- | --- | --- | --- |
| 9.1 Bubble, selection and insertion | D28 `d-sort-01` now teaches early-exit bubble, insertion and selection comparisons. The main lesson’s Java 21 `ElementarySortTrace` asserts distinct tagged orders and 3/3/6 comparisons on four sorted values. | Covered | The core trace uses 8 min of the existing D28 practice. |
| 9.2 Merge sort and quicksort | D28 `d-sort-01` runs stable merge and traces unbalanced endpoint pivots. D14 `ThreeWayPartition.java` runs three-way partition and assigns a quicksort extension. | Partial | Add 25 min to apply the partition recursively, trace all equal and sorted distinct values, and count recursive depth. |
| 9.3 Cyclic Sort and Shell Sort | No dedicated teaching examples. | Missing | Add 25 min. State the restricted key range for permutation placement, then trace Shellsort gaps 4, 2 and 1 on descending eight values. |
| 11.1 Singly, doubly and circular lists | D28 `d-linkedlist-01` teaches singly relinking. D29 `d-lru-02` executes doubly linked sentinel operations. | Partial | Add 25 min for circular insert/delete, zero/one-item cases and termination after one lap. |
| 11.2 Middle, reversal and intersection | D28 `d-linkedlist-01` runs reversal. The displayed destructive merge assumes disjoint acyclic nodes and does not enforce that precondition. D37 `ListCycles.java` runs middle/entry. | Partial | Add 15 min to return the first shared node via aligned lengths. Two heads sharing C→D must return C. Equal values in independent nodes must return no intersection. |
| 11.3 Floyd cycle detection | D37 `ListCycles.java` runs tortoise/hare, acyclic, null and cycle-entry examples. | Covered | — |
| 12.1 Cycle length and start | D37 `ListCycles.java` returns the cycle start, with length only assigned. | Partial | Add 10 min to count one full lap. Test lengths 3, 1 and 0, including a cycle at the head. |
| 12.2 LRU from list and hashing | D29 `d-lru-02` runs `LruNodes.java` with A/B/access A/C → [C,A] and removes B from both structures. | Covered | — |
| 12.3 Merge k sorted lists | D35 `KthLargest.java` merges indexable lists with a heap. Linked nodes and their per-list successor contract are absent. | Partial | Add 20 min to store heads, poll and push only the popped node’s successor, and handle empty inputs and ties. State the indexed-access assumption if comparing implementations. |
| 13.1 Stack, array and linked implementations | D28 `d-stacks-01` executes ArrayDeque and a paired minimum stack but has inconsistent empty behavior across methods. A separate Java 21 fixture reproduced the unboxing failure. | Partial | Add 25 min for learner-built resizing-array and linked-head stacks with push, pop, peek and growth/empty tests. |
| 13.2 FIFO, circular queue and deque | D29 `d-queues-01` executes FIFO and a timestamp deque. The D29 main lesson now runs a fixed-capacity array ring with distinct full and empty, FIFO wraparound and no silent overwrite. D40 adds a two-ended deque. | Covered | Use 12 min of the existing D29 review for A/B → reject C → poll A → accept C → drain B/C. |
| 13.3 Expression evaluation, nesting and undo | D28 `d-stacks-01` runs delimiter errors. The source’s postfix and undo demonstrations remain open. | Partial | Implement the postfix and undo extensions in 25 min. Verify 8 3 - → 5, underflow rejects, and a new edit clears redo. |
| 14.1 Next greater and window maximum | D34 `NextGreater.java` and D40 `WindowMax.java` run. The latter compares 200 random cases against brute force. | Covered | — |
| 14.2 Stack using queue and queue using stacks | D29 `d-queues-01` runs the two-stack queue and proves the amortized bound. The reverse construction is assigned. | Partial | Add 15 min for the one-queue rotation. Pushing A/B/C and popping must return C/B/A. Compare O(n) push versus O(1) pop. |
| 14.3 Optimization and problem solving | D28/29 use tagged records and boundary cases. D34/40 ask for brute-force comparisons and give implemented traces. | Covered | — |

The topic-level Java fixture checks distinguish the published applications from unmerged candidate repairs. See the [corrections ledger](curriculum-enrichment-and-corrections.md) for shared suffix, stack underflow and late timestamps. Continue Class 15 onward after the Class 10 Matrix supplement below. Class 7.3 Hanoi remains open.

## Class 10 matrix reconciliation · 24 November 2026 IST

Reviewed `main@b7fac781615bb9119f0066d85ae00ca4cc0d037e`. The current public listing and saved listing have identical wording for all three Class 10 bullets. Class 10 is **Matrix**. The Track 1 PDF groups it under Phase 2 and explicitly lists matrix traversal, rotation, transpose and spiral order. The live listing additionally names binary search and directional exercises. PDF SHA-256 `374a73058f8c3a9050c7ea0f31e866a8f4465709df0d0f59c3be82ba8a192ee9`. [Official listing, Class 10: Matrix](https://www.geeksforgeeks.org/courses/dsa-system-design-live-sde-interview-course) · [Syllabus, physical p. 7, Track 1 Phase 2](https://media.geeksforgeeks.org/courses/syllabus/4fba2a7424e0c6195d2a0dc8966739d4.pdf#page=7)

| Source locator and exact topic | Status | Scheduled teaching and executed evidence | Remaining gap and planned minutes |
| --- | --- | --- | --- |
| 10.1, Class 10 bullet 1 · Matrix traversal: row-wise, column-wise, spiral order | **Partial** | Day 11 lane `b-validation-01.dsa` teaches four shrinking bounds and why a remaining-row and remaining-column guard prevent repeated cells. The displayed `SpiralGrid.java` reads 3×3, 2×4 and 3×1 grids in order. Day 53 lane `d-matrix-01` includes an answered spiral walkthrough. | Standalone full row-major and column-major traversals are unnamed in learner materials. Spend 8 minutes within Day 11's existing DSA lane comparing the loop order for `[[1,2,3],[4,5,6]]`. Row-major returns `[1,2,3,4,5,6]`, column-major returns `[1,4,2,5,3,6]`, spiral returns `[1,2,3,6,5,4]`. Explicitly require a rectangle and count each cell once. |
| 10.2, Class 10 bullet 2 · Matrix rotation, transpose, and binary search in matrix | **Partial** | Day 53 lane `d-matrix-01` teaches square transpose and row reversal, explains why swaps start at `j > i`, and uses a newly allocated rectangle for a quarter-turn. Displayed `RotateGrid.java` maps 2×3 to 3×2 and restores the original after four turns. Day 11 assigns top-right sorted-matrix search. Its acceptance list states the starting corner and cost. | Add 6 minutes for standalone rectangular transpose and 10 minutes for the search contracts in the Day 53 lane. Use existing spiral as a short recall instead of assigning its full implementation again. Compare top-right staircase for monotone rows **and** columns with flat binary search requiring globally nondecreasing row-major order. Require present, missing and empty search fixtures. Define the rotation input contract or explicitly handle zero-row input before reading `g[0]`. |
| 10.3, Class 10 bullet 3 · Directional traversals and problem-solving exercises | **Covered** for published generic scope | Day 11 lane `b-validation-01.dsa` teaches clockwise turns and bounded passes and assigns learner checks for singleton and empty grids. Day 36 lane `ai-prompting-01.dsa` teaches four-neighbor offsets, bounds checks and mark-on-enqueue on a venue grid, then asks for a path and distance map. Displayed `GridBfs.java` returns 14 steps, 0 for identical endpoints and −1 when blocked or unreachable. Extra Java fixture verified one-row and zero-row spirals. | Source names no other mandatory problem. Improve Day 11’s validation lab in 5 optional minutes by showing `validate` before traversal or making checked shape an explicit precondition. A direct call on a jagged array otherwise throws `ArrayIndexOutOfBoundsException`. |

All three displayed programs above match their checked-in Java sources and their exact expected outputs on JDK 21. The separate audit trace verified axis-sorted-only `[[1,4,7],[2,5,9]]` gives `2 → (1,0)` with staircase search and flat binary search misses present `4`. A globally row-major sorted `[[1,2,4],[5,7,9]]` gives `2 → (0,1)` with binary search and both valid contracts reject absent `6`. Empty and zero-column search return no coordinate. The current `rotateClockwise` on zero rows and direct `spiral` on a ragged array reproduced the thrown bounds errors. The trace was executed separately from the published Day 53 lesson. No video playback was tested. [Sorted matrix search, staircase and binary-search variants](https://www.geeksforgeeks.org/dsa/search-in-row-wise-and-column-wise-sorted-matrix/) · [Java SE 21 Language Specification §10.2, array variables and dimensions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html#jls-10.2)

[Independent string corrections](curriculum-enrichment-and-corrections.md#independent-string-practice-and-correctness-ledger) track adjacent interview coverage.

Next source row is Class 15.1, permutations of arrays or strings. The higher-value immediate existing-day addition is the 10-minute Day 53 matrix search trace contrasting the axis-sorted and globally sorted inputs. It can replace the repeated Day 53 spiral-assignment time within the 30-minute lane. The underlying Day 11 teaching remains available for spiral traversal.
