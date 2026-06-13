## 2024-11-20 - [Fix Input Accessibility]
**Learning:** Wrapping an input and its hint text in a single `<label>` tag causes screen readers to incorrectly announce the hint as part of the primary accessible name.
**Action:** Instead, separate them using a `<div>` wrapper, use a distinct `<label htmlFor="...">` for the label text, and link the hint using `aria-describedby` on the input.