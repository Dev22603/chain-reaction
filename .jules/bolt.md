## 2026-06-08 - [Array allocation avoidance]
**Learning:** In backend game logic, avoiding intermediate array allocations and higher-order functions like .filter in hot loops prevents garbage collection bottlenecks. For grid boundary checks, an additive approach correctly accounts for all edge cases.
**Action:** Use primitives and direct array mutations in hot loops.
