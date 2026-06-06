## 2024-06-06 - [Accessible Form Hints]
**Learning:** For accessible forms and inputs, rely on programmatic associations rather than just visual hints. Use the `aria-describedby` attribute on the `<input>` element pointing to the unique `id` of the hint text element to ensure screen readers announce the hint when the input receives focus.
**Action:** In React components, prefer using `useId()` to robustly generate these unique IDs for `<input>` descriptions.
