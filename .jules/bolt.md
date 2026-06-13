## 2026-06-13 - Array Allocation and Iterator Overhead in Hot Paths
**Learning:** In backend game logic, intermediate array allocations (like `.filter`) and iterator objects from `for...of` loops cause noticeable garbage collection pressure in hot paths like `applyMove`. Also, calculating `getCriticalMass` mathematically instead of counting an allocated array improves performance.
**Action:** Use primitives, mathematical boundary checks, direct array mutations (`.push()`), and classic `for` loops in performance-critical sections to eliminate unnecessary allocations.
