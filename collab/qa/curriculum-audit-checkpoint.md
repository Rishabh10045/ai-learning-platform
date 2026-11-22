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
