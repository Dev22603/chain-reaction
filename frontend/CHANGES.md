# Changes Log

## Summary
The frontend codebase has been systematically refactored to align with Next.js App Router best practices and enforce the DRY principle. The app now heavily leverages Server Components to fetch data, reducing client-side JavaScript. Authentication was migrated from `localStorage` to secure `httpOnly` cookies, using Server Actions for mutations. A centralized API client was built, and domain-specific modules have been decoupled. Duplicate logic and components were identified and componentized into reusable UI building blocks.

## File Changes
1. `src/types/index.ts`: Centralized shared interfaces (e.g. `PublicPlayer`, `AuthResult`, `LeaderboardEntry`, etc).
2. `src/config/index.ts`: Centralized Next.js environment configurations.
3. `src/lib/api/`: Created `client.ts` to manage default fetch settings and cookies, and domain-specific modules (`auth.ts`, `leaderboard.ts`, `players.ts`).
4. `src/lib/actions/auth.ts`: Introduced Next.js Server Actions for setting and deleting `httpOnly` cookies.
5. `middleware.ts`: Implemented routing protection for authenticated routes.
6. `src/app/leaderboard/page.tsx` & `src/app/players/[playerId]/page.tsx`: Migrated to Server Components (removed "use client", `useState`, `useEffect`).
7. `src/app/leaderboard/loading.tsx`, `error.tsx` & `src/app/players/[playerId]/loading.tsx`, `error.tsx`: Implemented Suspense and Error Boundaries for server-rendered routes.
8. `src/app/providers.tsx` & `src/hooks/useAuth.ts`: Implemented `@tanstack/react-query` to handle client-side data fetching and caching state without `useEffect`.
9. `src/components/ui/Alert.tsx` & `src/components/ui/EmptyState.tsx`: Extracted repeating UI DOM patterns into standardized functional components.
10. `src/components/ui/index.ts` & `src/hooks/index.ts`: Implemented barrel exports for simpler `import` statements.

## DRY Violations Found & Addressed
- **Repeated UI Logic**: Several `div` wrappers containing `WifiOff`, `AlertTriangle`, and `Sparkles` were manually repeated in `AuthPanel`, `Leaderboard/error.tsx`, `app/page.tsx`, etc. These were replaced entirely by `<Alert type="..." message="..." />`.
- **Repeated Empty States**: Empty arrays for `Matches` and `Leaderboard` were replaced with `<EmptyState message="..." />`.
- **Repeated Fetch Calls**: Auth, Player, and Leaderboard API requests were isolated from components and moved directly into `lib/api/` domains.
- **Repeated Interface Declarations**: Moved all types from `lib/api.ts` into `types/index.ts`.

## Architecture Decisions
- Transitioned `auth.ts` fully to an `httpOnly` cookie utilizing Next.js `cookies()` and Server Actions, instead of the insecure `localStorage`.
- Migrated dynamic Next.js App routes (`leaderboard`, `players/[playerId]`) completely over to Server Components rather than `React Query`. Data loads flawlessly without needing client-side JS processing.

## Remaining Recommendations
- The API backend lacks an OpenAPI / Swagger spec. If one is made available, `openapi-typescript` can be implemented to auto-generate the models rather than doing it manually in `src/types/index.ts`.
- The `src/app/page.tsx` contains a very large and sophisticated component that relies heavily on WebSockets and sound effects. Although UI components were extracted, the logic hooks could be broken up further.
