## 2024-06-07 - Use `useId` to reliably associate hints with inputs via `aria-describedby`
**Learning:** `aria-describedby` provides accessible descriptions of inputs (like hint text or validation messages), but hard-coded IDs can clash in a React environment when multiple instances of the same component render.
**Action:** Use React `useId()` inside form input components to dynamically generate globally unique IDs, and link hint components to inputs correctly via `id` and `aria-describedby` properties.
