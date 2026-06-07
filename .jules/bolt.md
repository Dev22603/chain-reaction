## 2024-06-07 - Optimization of GC Bottlenecks in Hot Loops
**Learning:** In backend game logic, intermediate array allocations and higher-order functions (e.g., `.filter`) can cause garbage collection bottlenecks in hot loops like `applyMove`. Generating a new neighbor array purely to get its length for `getCriticalMass` is a significant waste.
**Action:** When calculating grid properties that only require boundary information, use an additive approach from a base of 0 (e.g., `if (row > 0) mass += 1;`). This accurately handles grid boundary conditions without memory allocations.
