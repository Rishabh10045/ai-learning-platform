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
