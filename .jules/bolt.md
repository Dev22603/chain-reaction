## 2024-06-01 - Optimize boundary checks in hot loops
**Learning:** In backend game logic, intermediate array allocations and higher-order functions (e.g., `.filter`) in hot loops like `applyMove` cause garbage collection bottlenecks.
**Action:** Use primitives, mathematical boundary checks, and direct array mutations (like `.push()`) to prevent garbage collection bottlenecks, and use an additive approach from a base of 0 for grid boundary checks.
