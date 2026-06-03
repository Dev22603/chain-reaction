## 2024-06-03 - [Robust Programmatic Association for Input Hints]
**Learning:** [When dealing with dynamic or reusable input components, relying on manual ID assignment is error-prone. Without proper `id` and `aria-describedby` linkage, screen readers miss the hint text entirely when focus moves to the input.]
**Action:** [Use React's `useId()` hook to robustly generate a unique `id` for inputs that lack an explicit ID or name, and use that `id` to associate the `<input>` with any associated hint text elements using `aria-describedby`.]
