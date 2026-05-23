## 2024-05-23 - [Optimizing Hot Loops in Game Logic]
**Learning:** In highly called functions like `getCriticalMass` and `getNeighbors`, using array allocations and higher-order functions like `.filter()` causes significant garbage collection overhead.
**Action:** Compute lengths and bounds mathematically and use direct mutations (e.g., `.push()`) rather than array mappings/filters to keep hot loops performant and GC-friendly.
