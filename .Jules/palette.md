## 2025-01-21 - Accessible Input Hints
**Learning:** In reusable input components, hints often rely only on visual proximity. Adding a dynamic `aria-describedby` pointing to a generated `id` ensures screen readers announce the hint when the input receives focus.
**Action:** Always map optional help/hint text to its corresponding input using `aria-describedby` in shared UI components.
