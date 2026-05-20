## 2024-05-20 - Adding Loading States to Async Buttons
**Learning:** Loading states for async operations are crucial, but they must use existing components. The codebase already has `lucide-react` which provides icons like `Loader2` that can be animated with Tailwind's `animate-spin` utility.
**Action:** When adding loading states to buttons, always check if `lucide-react` is available for a quick, native-feeling spinner icon before looking for more complex solutions. Always preserve existing `aria-hidden` attributes on decorative icons.
