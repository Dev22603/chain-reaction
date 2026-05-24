## 2026-05-24 - [Avoid Array Allocations in Hot Paths]
**Learning:** In the backend game logic (like `applyMove` and related helpers), higher-order array functions (`.filter()`, `.some()`) and intermediate array creations create unnecessary garbage collection pressure and slow down server-side simulation due to frequent allocations in hot loops.
**Action:** Replace array-based operations with traditional `for` loops, direct mutations (e.g., `.push()`), and calculate conditions mathematically (like `getCriticalMass`) instead of relying on array length.
