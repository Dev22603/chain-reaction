## 2024-05-19 - Avoid Array Allocation in Hot Game Loops
**Learning:** In heavily iterated game logic loops (like Chain Reaction cascade resolutions), creating small arrays and filtering them for derived state (e.g., finding the number of valid neighbors by filtering an array of coordinates) compounds massively and creates significant garbage collection overhead.
**Action:** When calculating fixed grid properties like critical mass, use geometric boundaries (O(1) subtraction) rather than relation-based filtering, avoiding array allocations in hot paths.
