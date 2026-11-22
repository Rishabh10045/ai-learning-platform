# LLD source-to-lesson QA

Reviewed the 55-session snapshot at `dbe599b4d8f5f6b069c8a12d8272f96b6f0b0641` on 22 November 2026 IST. Source rows follow the headings and order on physical pp. 2–3 of the [GfG LLD/HLD syllabus](https://media.geeksforgeeks.org/courses/syllabus/f968df9d7b7f24623e8c14b2c22bbd45.pdf#page=2). The saved PDF SHA-256 is `24595db1588537d2f5febbdb19c9714bd1f73f913894469fefc7680cbb8a12f6`. Coverage means the actual notes explain the rule and the lesson supplies a concrete trace and an evidence-bearing practice item. A source link, an interview prompt or an unscheduled draft alone does not meet that threshold.

The matrix includes the Day 1 repair in this PR. Day numbers refer to existing lessons. The estimated work is learner time within the proposed 96-session plan and weekend labs. Related rows can share the same lab.

| Source and page | Topic | Current day or topic ID | Coverage and evidence | Required lesson work |
| --- | --- | --- | --- | --- |
| GfG 2 · OOP | Class and objects | D1 `j-oop-01` | Covered. Notes trace two Seat instances and the Java fixture constructs one authoritative Seat. | — |
| GfG 2 · OOP | Encapsulation | D1 `j-oop-01` | Covered. Private owner, explicit claim method and a test observing final ownership after a conflict. | — |
| GfG 2 · OOP | Inheritance | D5 `j-oop-02` | Partial. Notes explain hierarchy coupling without a subtype behavior fixture. | 15 min, compare a subclass with delegation under a shared contract. |
| GfG 2 · OOP | Abstraction | D5 `j-oop-02` | Partial. Interface versus abstract class is explained, but the exercise targets failure outcomes. | 15 min, swap two repository implementations and exercise the contract. |
| GfG 2 · OOP | Polymorphism | D5/D8 | Partial. Repository seams enable substitution. No explicit dispatch trace or acceptance test. | 15 min, call two implementations through the same reference type. |
| GfG 2 · OOP | Operator overloading | D5 `j-strings-01` | Covered for the Java adaptation. Notes distinguish built-in plus from method overloads and state Java’s language limit. A Java 21 fixture shows numeric-first and string-first outcomes. | — |
| GfG 2 · OOP | Association | D8 `l-uml-01` | Partial. BookingService dependency is drawn, with little explicit association notation. | 10 min, draw a navigable association and label both ends. |
| GfG 2 · OOP | Aggregation | D8 `l-uml-01` | Missing. Lifecycle and shared part semantics are unmodeled. | 10 min, compare a collection of shared resources with composition. |
| GfG 2 · OOP | Composition | D5 `j-oop-02` | Partial. Notes favor ownership or delegation when appropriate. UML lifecycle rules and disposal test are absent. | 15 min, separate ownership from use, show a lifecycle trace. |
| GfG 2 · OOP | Class diagrams | D8 `l-uml-01` | Covered. Notes and practice map participants and ownership to a booking invariant. | — |
| GfG 2 · OOP | Procedural versus OO | D1 | Missing as a comparison lesson. Current exercise starts with objects. | 12 min, refactor a procedural state-and-functions version and compare mutation paths. |
| GfG 2 · Constructors | Default constructor | D1 `j-oop-01` | Partial. Notes and quiz distinguish the generated constructor from an explicit overload. The repo has no inline constructor comparison lab. | 8 min, compile types with implicit and explicit constructors and predict both calls. |
| GfG 2 · Constructors | Parameterized constructor | D1 `j-oop-01` | Covered after repair. Instantiation validates an ID and supplies the dependency. Topic exercise checks a second independent Seat. | — |
| GfG 2 · Constructors | Copy constructor | D1 `j-oop-01` | Partial. Notes and question address copy versus alias and read-only views. | 15 min, implement a defensive copy for a mutable member and test it. |
| GfG 2 · Constructors | this and operations | D1 `j-oop-01` | Covered for field qualification. Notes also teach this(...) delegation. | Optional 5 min extension to practice constructor delegation. |
| GfG 2 · UML | UML overview | D8 `l-uml-01` | Partial. Class and sequence viewpoints are taught clearly. Coverage of additional views is open. | 12 min, select a diagram by question and compare all four relevant views. |
| GfG 2 · UML | Object diagram | — | Missing. Current class sketch shows type relationships. | 12 min, snapshot two concrete seats and links after one booking. |
| GfG 2 · UML | Activity diagram | — | Missing. Request trace and sequence are present. | 15 min, model a decision, merge and competing workflow path. |
| GfG 2 · UML | Sequence diagram | D8 `l-uml-01` | Covered. Practice asks for participants, call order and the alternate conflict branch, with a final-state check. | — |
| GfG 2 · UML | State diagram | D19 `l-invariants-02` | Partial. The interactive lifecycle traces hold, expiry and confirmation. UML guards and rejected transitions need a formal exercise. | 15 min, draw transitions with event, guard and outcome, including exactly-at-expiry. |
| GfG 2 · SOLID | Single responsibility | D8 `l-solid-01` | Covered. Uses HTTP formatting as a separate reason to change and asks for a responsibility boundary with an invariant check. | — |
| GfG 2 · SOLID | Open/closed | D8 `l-solid-01` | Partial. An extension seam and Strategy appear in notes. No behavior-preserving extension exercise. | 15 min, add a hold policy without changing the existing test outcomes. |
| GfG 2 · SOLID | Liskov substitution | D5/D8 | Partial. Lesson states that substitutes must honor the contract. | 20 min, test two substitutes with shared contract tests and a failing subtype. |
| GfG 2 · SOLID | Interface segregation | D8 `l-solid-01` | Partial. Notes name narrow consumer interfaces. | 15 min, split booking reads and commands and show dependency reduction. |
| GfG 2 · SOLID | Dependency inversion | D8/D9 `b-di-01` | Covered. Invariant test uses a repository seam and Spring lesson injects the resolved implementation. | — |
| GfG 2 · Principles | GRASP | D8 | Missing as a topic. Responsibility discussion alone provides starting examples. | 25 min, teach Information Expert, Creator, Controller, Low Coupling and High Cohesion with a responsibility table and variant. |
| GfG 2 · Principles | DRY | — | Missing. | 10 min, consolidate duplicate knowledge in two booking rules and run regression cases. |
| GfG 2 · Principles | KISS | D8 | Partial. Lesson favors the simplest code expressing the invariant. | 12 min, compare a direct guard with a state hierarchy and justify the selected design. |
| GfG 2 · Patterns | Strategy | D8/D19 | Partial. Variation behind a stable contract is explained but learners do not implement two strategies. | 25 min, provide two hold policies and an invariant test for each. |
| GfG 2 · Patterns | Observer | — | Missing. Kafka delivery in D23 has different responsibilities. | 25 min, add/remove in-process subscribers and check notification behavior when a subscriber fails. |
| GfG 2 · Patterns | Factory | — | Missing. Spring bean construction alone gives no comparable factory exercise. | 25 min, centralize product selection, compare simple factory and Factory Method. |
| GfG 2 · Patterns | Abstract Factory | — | Missing. | 25 min, create consistent payment and receipt families and test invalid combinations. |
| GfG 2 · Patterns | Singleton | D5 `j-oop-02` | Partial. Runtime and Spring context scope are explained. | 18 min, implement an enum singleton, demonstrate different process scope and test shared state separately. |
| GfG 2 · Patterns | Command | — | Missing. Request DTO and delayed delivery work elsewhere do not teach this pattern. | 25 min, model a command with explicit execute and outcomes for rejection and duplicate delivery. |
| GfG 2 · Patterns | Proxy | D47 `b-di-02` | Partial. Spring proxy and self-invocation are taught. The general pattern and delegation boundaries lack a standalone exercise. | 20 min, implement a logging or permission-check proxy, compare it with Adapter. |
| GfG 2 · Patterns | Bridge | — | Missing. | 25 min, vary the notification type and transport independently. |
| GfG 2 · Patterns | Template Method | — | Missing. | 20 min, fix a three-step workflow with override points and test their order. |
| GfG 2 · Patterns | Composite | — | Missing. | 25 min, recursively price items and bundles without special-casing callers. |
| GfG 2 · Patterns | Iterator | — | Missing as a design lesson. | 20 min, iterate a nested domain collection and define exhaustion and mutation behavior. |
| GfG 3 · Cases | Movie Ticket Booking | D1/D19/D44 | Partial. Single-seat ownership, timed holds and conditional writes transfer. Show-scoped inventory and all-or-none group holds are absent as a case. | 78 min core plus weekend lab, model movie, theatre, show and show seat. Test same seat labels in two shows and prevent partial group claims. |
| GfG 3 · Cases | Airline Booking | — | Missing. | 78 min core plus weekend lab, model segment inventory, seat assignment and a multi-segment cancellation or rollback. |
| GfG 3 · Cases | Unnamed live cases | — | Source unverified. The PDF supplies no titles or acceptance criteria. | Keep open until a named syllabus or recording provides evidence. |

## Added case obligations

The 96-session plan already lists independent cases. Keep Parking Lot, Elevator, Rate Limiter, Vending Machine, board game, Chess, Library, ATM, logger/notification and Food Delivery under `source: added`. Verify each against its own requirements and acceptance checks. GfG Java Backend supplies the Splitwise source obligation. D29 teaches LRU with Java practice and a capacity policy. LFU, transfer testing, and concurrent machine coding each require separate evidence. See the [repair plan](curriculum-repair-plan.md).

## Dedicated HLD source · Module 1

| Current public module row | Day and evidence | Status | Next lesson change |
| --- | --- | --- | --- |
| 1.1 HLD scope, goals, functional and non-functional requirements | D18 `h-requirements-01`, classify booking behavior and measurable constraints | Covered | — |
| 1.2 PEDALS and RESHADED interview frameworks | No lesson names or exercises those checklists | Missing | 15 min, run a requirements interview and compare checklists. |
| 1.3 DAU, QPS and storage estimation | D18 `h-estimates-01` calculates burst RPS and hot-key origin traffic; DAU/store size are absent | Partial | 15 min, derive daily volume and retained bytes with assumptions. |
| 1.4 Bottlenecks and constraints | D18 hot seat and D24 queue/latency trace | Covered | — |
| 1.5 API contracts and interface design | D10 `b-http-01` and `b-rest-01` require status and state checks | Covered | — |
| 1.6 Client-server architecture | D1 `h-request-01` traces DNS, HTTPS, handler and authoritative write; practice labels the full path | Covered | — |
| 1.7 Trade-off frameworks, CAP and latency versus consistency | D25 `h-consistency-01` traces a partition and stale responses | Partial | 20 min, separate partition decisions from ordinary latency/consistency trade-offs. |

Module 1 locators are from the saved public listing of the [GfG System Design course](https://www.geeksforgeeks.org/courses/system-design-training-program). Next source row is HLD Module 2, vertical and horizontal scaling. Equivalent named HLD cases in the combined syllabus remain separate source obligations.

The Java Strings follow-up moves the operator-language row to covered for the Java adaptation. At the original LLD checkpoint it was missing. The current 42 rows now have 9 covered, 17 partial, 15 missing and 1 source unverified.
