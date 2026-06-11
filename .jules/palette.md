## 2024-06-11 - Input Component Accessibility
**Learning:** Wrapping an input and its hint text in a single `<label>` tag incorrectly bundles the hint into the accessible name instead of the accessible description.
**Action:** Use a wrapper `<div>`, generate unique IDs (e.g., with `useId`), link the `<label>` to the input via `htmlFor`, and link the hint text to the input via `aria-describedby`.
