## 2024-06-08 - [Enhance Input Hint Accessibility]
**Learning:** Found a missing link in the reusable `<Input />` component where the hint text was not programmatically associated with the actual input. Without this, screen readers do not read the helpful sub-text when focusing on the main input field.
**Action:** Used `useId` to dynamically generate an ID (falling back to user-provided ID), and conditionally set `id={hintId}` on the hint element, alongside `aria-describedby={hintId}` on the `<input>` itself. This ensures accessible programmatic associations with forms.
