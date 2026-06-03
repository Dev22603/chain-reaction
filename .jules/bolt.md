
## 2024-06-03 - [Optimize Grid Boundary Checks in Game Logic]
**Learning:** In backend game logic, avoid intermediate array allocations and higher-order functions (e.g., `.filter`) in hot loops like `applyMove` (specifically `getNeighbors` and `getCriticalMass`). When optimizing grid boundary checks, use an additive approach from a base of 0 (e.g., `if (row > 0) mass += 1`) rather than a subtractive approach from 4. This correctly accounts for 1x1 or 1xN grid edge cases where a cell touches multiple opposing boundaries simultaneously, and prevents garbage collection bottlenecks.
**Action:** Always prefer primitives, mathematical boundary checks, and direct array mutations (like `.push()`) for game simulation calculations over creating intermediary arrays or chaining array methods.
