## 2026-06-01 - Input Component Accessibility Hint Association
**Learning:** React `useId()` is highly effective for enforcing accessibility standards on generic input components that lack explicit IDs or need to associate helper text programmatically (like `aria-describedby` for hints).
**Action:** Always prefer dynamically generating IDs with `useId()` as fallbacks for custom inputs, ensuring screen readers can consistently associate labels and hint text correctly.
