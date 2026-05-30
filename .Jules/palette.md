## 2024-05-30 - [Input hint accessibility]
**Learning:** For accessible forms and inputs, visual hints must be programmatically associated with the input so screen readers read the hint when the input is focused.
**Action:** Use the `aria-describedby` attribute on the `<input>` element pointing to the unique `id` of the hint text element to ensure screen readers announce the hint when the input receives focus.
