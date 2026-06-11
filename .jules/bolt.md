## 2024-06-11 - [Optimize Hot Loops]
**Learning:** In backend game logic, intermediate array allocations (e.g. `[row - 1, col]`), higher-order functions (e.g., `.filter`), and iterators (e.g., `for...of`) in hot loops like `applyMove` cause garbage collection bottlenecks.
**Action:** Use primitives, mathematical boundary checks, direct array mutations (like `.push()`), and classic `for` loops in performance-critical JavaScript/TypeScript hot paths.
