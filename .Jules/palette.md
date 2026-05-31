## 2024-05-31 - Accessible Form Hints
**Learning:** Adding a `hint` prop to custom form inputs may result in the text being inaccessible to screen reader users if not properly programmatically linked to the `<input>`.
**Action:** Always map hints to inputs using `aria-describedby` pointing to the hint element's `id`. This pattern is now built into the shared `<Input />` component.
