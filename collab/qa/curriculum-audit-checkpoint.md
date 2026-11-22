# Curriculum audit checkpoint

22 November 2026, 01:08 IST. Phase 1 is in progress. The DSA Track 1 inventory is complete. The audit began at `gpt/qa` commit `1d283b7`. The public `main` revision was `bb2a613`. Grok’s independent subject-first branch was `0e97dfa`, with its v2 contract and QA report available for reference. The working branch is `gpt/qa`.

## Completed in this batch

- [DSA evidence and gap matrix](curriculum-dsa-coverage.md) maps all 73 public bullets across Classes 1–24 to physical PDF pages 7–9. Fourteen rows are covered after the lesson fixes, 32 are partial and 27 are missing. Each open row includes a proposed placement, exercise and minutes. The last verified row is Class 24, item 3, matrix-chain multiplication and palindrome partitioning.
- Day 26 teaches the Java recursion contract, stack unwinding, factorial and Fibonacci. A runnable `SumTrace.java` example appears in Learn. Day 27 teaches and assigns recursive as well as iterative binary search. Existing lesson IDs, block IDs and 120-minute sessions are preserved. The changes cover three source rows that had gaps. Hanoi, dedicated permutations/combinations, maze, N-Queens and Sudoku still need scheduled DSA slots.
- The Java 21 source launcher ran the displayed Day 26 example, and separate fixtures checked factorial, Fibonacci call counts and depth, negative inputs, and both binary search implementations including duplicates and absent targets. Those are selected actual executions. The source matrix’s other checks are editorial.
- The current GFG AI public listing links a revised PDF. The course points at it and retains the older PDF as provenance. Its revised modules have been identified and are pending content reconciliation.

## Sources ready for the next batches

| Source | Verified availability and next locator |
| --- | --- |
| [GeeksforGeeks LLD/HLD supplementary PDF](https://media.geeksforgeeks.org/courses/syllabus/f968df9d7b7f24623e8c14b2c22bbd45.pdf#page=2) | The standalone PDF responds and is stored as `lld-gfg.pdf`. Begin on pp. 2–3 with OOP, constructors, UML, principles, eleven named pattern families, Movie Ticket Booking and Airline Booking. Unnamed live case studies are source unverified. |
| [Existing LLD roadmap](https://rishabh10045.github.io/studyapp/lld/roadmap.html) | Available. Cross-check the roadmap data and lesson manifest against the GFG LLD rows. Also audit the requested BookMyShow, Splitwise, Parking Lot and Elevator cases as distinct lessons. Record whether a case is sourced or added. |
| [Dedicated GFG HLD course](https://www.geeksforgeeks.org/courses/system-design-training-program) and [its PDF](https://media.geeksforgeeks.org/courses/syllabus/973f73599e070cabefcf71cd54e1ff1f.pdf) | PDF matches the saved snapshot. The listing exposes 24 modules and 143 extracted topic bullets. Reconcile these with the combo PDF’s Track 2, pp. 10–13, and track cases separately. |
| [GFG Java Backend course](https://www.geeksforgeeks.org/courses/Java-backend-live) and [its PDF](https://media.geeksforgeeks.org/courses/syllabus/168b174933486cd366a5d51dff5738b6.pdf) | PDF matches the saved snapshot. The listing exposes 24 sessions and 108 extracted bullets. Audit Java, APIs, Concurrency, SQL/JDBC and Spring independently, including the source’s two project series. |
| [Current GFG AI course](https://www.geeksforgeeks.org/courses/ai-engineering-course-generative-agentic-ai) and [current PDF](https://media.geeksforgeeks.org/courses/syllabus/9e2e6c838d855413f1805def9a931bbb.pdf) | Current listing has 16 numbered modules, a prerequisite and capstone review. There are 132 extracted bullets. Reconcile the four phases on PDF pp. 3–4. SHA-256 `3ed1084e6f875f25e17600df7401fa68585ae7df945d3d5246d61ffa3f7965af`. [Previous PDF](https://media.geeksforgeeks.org/courses/syllabus/37aebb307d00b1ab3dbcb601ad1534ae.pdf) remains available for comparison. |

Source downloads, parsed live listing TSVs and Java fixtures are in `/workspace/work/audit-sources/`. Re-fetch from the URLs above if a new workspace cannot see the local snapshots. The repository stores original findings and source locators.

## Resume here

1. Audit LLD first. Start with the OOP/constructor section on page 2 of the LLD PDF, then continue through UML, principles, patterns and the independent cases on page 3. Check actual lessons on Days 1, 5, 8, 19, 29, 44 and 45. In particular, model the differences between the existing single-seat lab, a multi-show movie ticket system and the airline inventory case.
2. Continue with the dedicated HLD listing and combo Track 2. Start at Module 1, trace each bullet and identify duplicate versus new requirements by source. Check whether the baseline implements or merely mentions URL shortener and chat. Keep each independent case distinct from the seat-booking capstone.
3. Close the DSA gaps in dependency order. Start with Class 1 bitwise operations and bases, then Class 2 primes/sieve/LCM. The current schedule has no daily 30-minute DSA slot beyond selected DSA lessons. The v2 adapter must schedule real, evidenced lessons with stable IDs. It must preserve existing progress and the 9–11 PM IST core. Record the updated finish date after fitting all subjects, including Monday–Friday defaults and the owner’s Saturday/Sunday 390-minute decision. Use the DSA row estimates for planning.
4. Continue Java/Spring/SQL and AI mapping. Compare Grok's 124-topic interview checklist with the verified sources and label requested enrichment as `source: added`. Begin Phase 2 only after all the coverage rows and gaps are accounted for.

GitHub connector permissions were pull true and push false for the target repository. The local checkpoint and updated Git bundle preserve the work. The branch, report and lesson changes still need publication through an authorized connection.

## Branch and scope update · 22 November 2026 IST

Resume in `/workspace/work/gpt-curriculum` on `gpt/curriculum`. This branch now includes the 54-session audit, the 96-slot repair plan and the first implemented lessons. The old `gpt/qa` worktree preserves the frozen 54-session baseline at `83318bd`. The DSA matrix still refers to that baseline for its 73 source rows. The broader audit marks all 124 Grok references separately and names missing independent additions.

Next, close the confirmed DSA gaps in dependency order and reconcile every native Java, LLD, HLD and current GenAI source row. For each subject make a linked list of GFG omissions and corrections with source, estimated time and acceptance criteria. Independently verify the live video segments and runnable fixtures as the materials are authored. Finish the coverage accounting before signing off on depth. See the [baseline audit](curriculum-124-topic-audit.md) and [repair plan](curriculum-repair-plan.md) for scope, current code, tests and the remaining release work.

## Topic depth and learner takeaways · 22 November 2026 IST

The [topic content audit](topic-content-audit.md) records existing materials, gaps and backend needs for the current 116 index IDs. Nine topics now have focused notes and question sets. Learner takeaways use a separate topic-ID keyed store through the existing SQLite account API and appear at revision time. For future audits track whether an exact topic has its own explanation, diagnostic question, learner evidence and source. Keep “parent lesson exists” and “topic materials exist” as separate facts. Upcoming authoring should start with gaps blocking prerequisites and record topics added beyond the selected syllabi.


## Published handoff and content repair · 22 November 2026 IST

The account owner connection published the former local `e81533a` content as `dd96648` on [draft PR #5](https://github.com/Rishabh10045/ai-learning-platform/pull/5). Fetch `origin/gpt/topic-index` and work from its current SHA. The previous Git CLI identity and its permission error remain historical evidence. The [resume prompt](../resume-study-desk.md) points both agents to the PR thread.

Cross-checked Grok's fixture report against the current app and documented the differing baselines, backend gaps and remaining depth criteria in the [topic audit](topic-content-audit.md). Promoted Day 4 `j-collections-01` to dedicated HashMap materials. Next source row is LLD PDF page 2, OOP and constructors. Next topic-depth row is Java Core String immutability/pool/builder, after inventory and prerequisites are verified.

## LLD source and all-day presence QA · 2026-11-22 10:42 IST

Reviewed the published `gpt/topic-index` snapshot at `dbe599b4d8f5f6b069c8a12d8272f96b6f0b0641`. [LLD source-to-lesson QA](curriculum-lld-coverage.md) now accounts for all 42 LLD rows on the GfG PDF's physical pages 2–3. It also covers the seven current HLD Module 1 rows. Unnamed live case studies remain source unverified. The end of the LLD source inventory still leaves concrete practice and case repairs. Next source locator is HLD Module 2 row 2.1, vertical and horizontal scaling, paired with Day 17 `h-scaling-01`.

Fixed Day 1's displayed Java exercise and gave existing topic `j-oop-01` dedicated constructor/encapsulation notes, four answered interview questions, takeaways, practice and a check. The [day and topic readiness matrix](lesson-readiness-matrix.md) records all 55 day and 116 topic rows and the result of 76 reading probes. Three displayed Java snippets ran on JDK 21. Node, Chromium and two-browser progress checks passed.

Pending Phase 1 includes HLD Modules 2–24 and all independent HLD cases, the Java/Spring and AI source-by-source rows, and fixing known DSA gaps. Pending topic depth starts with Java strings and pool behavior. Keep the existing 73-row DSA checklist and the independent 124-row QA baseline unchanged. Day-level field presence is screening evidence. Full teaching sign-off still needs the content and lab run-by-run review, lesson pacing and independent daily DSA scheduling.

## Java Strings VIP and HLD Modules 2–3 · 2026-11-22 11:04 IST

Reviewed and extended `gpt/topic-index@76d7e56`. Day 5 now has an added Java interview topic `j-strings-01` under unchanged parent lesson `j-oop-02`. Java String identity, value equality, interning, immutability, builder behavior and the built-in plus rule are explained and tested with the displayed JDK 21 lab. Use 12 minutes of the existing Learn block, preserving the 120-minute core and prior progress IDs. The selected Java Backend outline provides adjacent Java language context. This String depth packet is `source: added`. The GfG LLD requirement for operator behavior now has a Java-specific teaching row.

Day 17 `h-scaling-01` now has a worked capacity trace, concrete routing and failover acceptance checks and one diagnostic question. [HLD Modules 2–3](curriculum-hld-coverage.md) maps all 13 source rows. Module 2 has three covered and four partial. All six Module 3 rows are partial. The local browser check verifies the new pages and the Java fixture runs. The two-process Spring and PostgreSQL failover exercise still needs separate execution.

Next source locator is HLD Module 4 row 4.1, horizontal partitioning. Next content candidates are Java collectors and `CompletableFuture` after the relevant source rows are checked. Grok acknowledged on [PR #5](https://github.com/Rishabh10045/ai-learning-platform/pull/5#issuecomment-7074768563) and owns Day 1 UI integration from the launch baseline. The unanswered-contact round is resolved.

## Day 1–56 expansion · 2026-11-22 11:20 IST

Started from `gpt/topic-index@17d3fc0`. Day 56 now runs end-to-end through the course and day selectors, Learn, Practice and Coach, scored quiz and topic library. Five Java DSA packets map GfG Class 1.2–1.3 and Class 2.1–2.3 to runnable examples. Day 1's four previously undedicated topics now have notes, practice, interview answers, takeaways and concept checks. Further foundation material covers the Day 2 race, Day 4 collision, Day 5 contracts/exceptions/responsibility, and Day 6 generics. All existing day, block and topic IDs are preserved.

The [readiness matrix](lesson-readiness-matrix.md) now gives 56 day rows and 122 topic rows, with 28 dedicated. The next editorial gap by day is Day 7, executors and JVM memory. The HLD source audit resumes at Module 4 row 4.1. Additional DSA source repairs start with Class 2.4 and Class 3 arrays. Continue topic by topic, verify exercises, and preserve Grok's `ui/**` ownership.

## Days 7–16 and HLD Module 4 · 2026-11-22 11:28 IST

Built on `cdf9d21`. Dedicated packets now exist for every indexed topic in Days 1–16 and Day 56, with 43 of 122 overall. The latest 15 cover executors/JVM, SOLID and tests, Maven/DI, HTTP/REST, constraints and migrations, JDBC, atomic writes and locking, JPA query counts and PostgreSQL integration tests. The Day 7 displayed Java 21 example passes bounded-work, rejection, timeout and termination checks. Spring and PostgreSQL assignments have explicit expected evidence. The exercises requiring running external infrastructure remain execution-unverified.

The HLD Module 4 matrix records six rows with one covered, three partial and two missing. The next HLD source locator is Module 5 row 5.1. The next missing dedicated topic by day is `h-requirements-01` on Day 18, followed by holds, transactions, caching, messaging and resilience. The [readiness matrix](lesson-readiness-matrix.md) maps every remaining topic by day and subject.

## Days 18–25 and v2 integration reconciliation · 2026-11-22 13:58 IST

Merged the released UI and Day 1–3 depth work from main `0203934` into the draft based on `ad54d12`. Saved study IDs and the account storage contract are retained. The 16 new topic packets complete authoring for all indexed topics assigned to Days 1–25 and Day 56. Across the entire course 59 of 122 topics have dedicated materials. New packets cover timed holds, idempotency, partitioning and indexes, cache-aside, Kafka, percentile latency and reliability. Redis, Kafka, PostgreSQL and other external-service assignments remain execution-unverified. The 15 reference probes from this batch returned HTTP 200.

Confirmed the earlier Java warm-up explanation omitted the definite-assignment error for an uninitialized final field and clarified how the HTTP/3 transport differs from HTTP/1.1 and HTTP/2. The Day 2 Two Sum complement now uses long arithmetic. The Java 21 fixture passed the added integer-overflow case.

HLD Module 5 source rows map to Day 22. Two are covered and three partial. Next HLD locator is Module 6 row 6.1. The first remaining topic by day is Day 26 `d-complexity-01`. Follow with its arrays and recursion packets and the next DSA source repairs. [Day and topic matrix](lesson-readiness-matrix.md) lists every row.

Integration blocker was reported on [PR #5](https://github.com/Rishabh10045/ai-learning-platform/pull/5#issuecomment-7076527978). The v2 UI adapter passes an array index as the packet object while flattening notes, hiding text for most packets on a multi-topic day. Topic records, interview answers and practice data are present. Grok owns the rendering change. Keep the 56-session branch in draft pending visual verification against that fix and live account setup.
