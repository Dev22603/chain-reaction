## 2024-06-10 - Optimized backend game logic boundary checks

**Learning:** Intermediate array allocations and higher-order functions (e.g., `.filter`) inside frequently called game logic (like `applyMove` hot loops) generate significant garbage collection pressure. Additionally, using subtractive logic for boundary calculation (e.g., subtracting from 4) can introduce subtle bugs in 1x1 or 1xN grids.
**Action:** Replace intermediate array allocations and `.filter` with primitive math-based boundary checks and direct array mutations (`neighbors.push()`) in pure game logic modules. When checking boundaries, always use additive logic (starting from 0 and adding for each valid bound) instead of subtractive logic to cleanly handle all grid edge cases.
