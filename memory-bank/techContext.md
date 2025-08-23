# Tech Context

-   **TypeScript**, `tsup`/`esbuild`, ESLint, Prettier, `screeps-cli` (upload).

-   Optional: `screeps-profiler`, local sim (`screeps-simulator`).

-   Strict TS, no `any`; avoid global mutation outside `global`.

-   Commit style: feat/fix/refactor/test/chore; small atomic PRs.

-   Each manager/role has README with lifecycle & KPIs.

-   Catch/log errors; never crash tick; degrade gracefully.

-   Feature flags: `settings.stance = 'peace' | 'alert' | 'war'`.
