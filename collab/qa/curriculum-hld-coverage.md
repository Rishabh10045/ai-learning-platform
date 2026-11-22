# System design source coverage

Reviewed the published curriculum at `76d7e560bce88d469e351c2bc32da4b2e2ca5161` on 22 November 2026 IST, then applied the Day 17 scaling repair in this batch. Rows refer to the [current GfG System Design module listing](https://www.geeksforgeeks.org/courses/system-design-training-program) and its [published PDF](https://media.geeksforgeeks.org/courses/syllabus/973f73599e070cabefcf71cd54e1ff1f.pdf). Module names and row order use the saved public listing. The [Module 1 audit](curriculum-lld-coverage.md#dedicated-hld-source--module-1) establishes the previous checkpoint. Combined HLD-track topics and independent capstones still need separate reconciliation.

**Covered** requires instruction plus a specific trace, check or evidence-bearing exercise. **Partial** means an aspect of the source wording or its application remains open. **Missing** means there is no dedicated teaching evidence. These are editorial checks. The referenced infrastructure labs require an execution environment.

## Module 2 · Scalability Fundamentals

| Source row | Current day and evidence | Status | Required repair |
| --- | --- | --- | --- |
| 2.1 Vertical and horizontal scaling | D17 `h-scaling-01` compares resizing a host and adding app replicas. Predicts a 120 RPS shared dependency ceiling despite 160 RPS application capacity. | Covered in this batch | — |
| 2.2 Stateless architecture | D17 `h-scaling-01` explains process-local state and shared booking ownership. Exercise routes a write and read to different workers and removes one process. | Covered | Run and capture the two-process Spring and PostgreSQL lab separately. |
| 2.3 Round robin, least connections and IP hash | D24 `h-loadbalance-01` introduces routing choices. The D17 packet now gives each rule and a skew/failover caveat. No assignment isolates the three policies against the same request sequence. | Partial | 20 min, trace uneven request durations under all three and defend the load-balancer choice. |
| 2.4 Sticky sessions | D17 `h-scaling-01` explains how affinity can mask app-local session dependencies, gives shared store and token alternatives, and asks for a failover trace and changed case. | Covered in this batch | Execute the controlled removal fixture before marking the lab run verified. |
| 2.5 Autoscaling fundamentals and policies | D17 `h-scaling-01` now compares saturation signals, dependency bottlenecks, bounds and readiness delay. It has no policy comparison with a step-load or cooldown fixture. | Partial | 25 min, select a signal, forecast startup delay and show scale-up/down under two load shapes. |
| 2.6 Geographic distribution and multi-region deployment | D25 `h-consistency-01` and D45 `h-review-01` ask about remote reads or a changed requirement. The D17 packet names region constraints without a worked regional topology. | Partial | 40 min, draw active/passive writes with read latency, region failure, RPO/RTO and recovery. |
| 2.7 Cost versus performance | D17 `h-scaling-01` works a basic extra-replica trade-off. D24 tracks traffic mix and latency. No priced capacity comparison or latency target exercise. | Partial | 20 min, compare two instance plans against a p95 target, spend and failover headroom. |

## Module 3 · Database Fundamentals

| Source row | Current day and evidence | Status | Required repair |
| --- | --- | --- | --- |
| 3.1 RDBMS versus NoSQL | D12 `b-sql-01` teaches constraints and transactional identity. D21 `h-databases-01` surveys storage placement. No explicit comparison of a transactional store, key-value and document workloads. | Partial | 30 min, choose a data model for booking and search and explain which queries and invariants each store supports. |
| 3.2 ACID and BASE | D13 `b-transactions-01` teaches atomicity and isolation with a paired-session trace. D25 discusses admissible lag. BASE and a complete ACID comparison are absent as taught requirements. | Partial | 25 min, distinguish constraints, isolation anomalies, durability and convergence using one lifecycle. |
| 3.3 CAP and PACELC | D25 `h-consistency-01` traces partitioned browsing and booking. PACELC and the normal-operation latency trade-off lack a worked trace. | Partial | 25 min, map failure and healthy-state choices for at least two operations. |
| 3.4 B-tree, hash and composite indexes | D21 `b-sql-02` discusses an ordered access path and selectivity. It asks for a plan comparison but does not teach hash index restrictions or composite key order in depth. | Partial | 30 min, compare equality, range and ordered composite queries on one seed dataset. |
| 3.5 Schema design and query optimization | D12 `b-sql-01` models identity and constraints. D21 `b-sql-02` asks for EXPLAIN. Normalization and controlled plan evidence remain open. | Partial | 35 min, choose a normalized schema, change one lookup and justify its measured plan. |
| 3.6 Performance bottlenecks | D17 `h-scaling-01` traces a constrained shared database. D24 `h-observability-01` separates app work and database wait in a controlled experiment. The lesson does not isolate locks, pool wait and I/O in a reproducible exercise. | Partial | 30 min, diagnose three bounded tests with metrics that distinguish those causes. |

The next source locator is **Module 4 row 4.1**, horizontal database partitioning. This batch does not close design-case coverage or verify production measurements.
