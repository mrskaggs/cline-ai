# Tech Context

-   **TypeScript**, `tsup`/`esbuild`, ESLint, Prettier, `screeps-cli` (upload).

-   Optional: `screeps-profiler`, local sim (`screeps-simulator`).

-   Strict TS, no `any`; avoid global mutation outside `global`.

-   Commit style: feat/fix/refactor/test/chore; small atomic PRs.

-   Each manager/role has README with lifecycle & KPIs.

-   Catch/log errors; never crash tick; degrade gracefully.

-   Feature flags: `settings.stance = 'peace' | 'alert' | 'war'`.

## Diagnostic Tools & Testing

-   **Memory Serialization Pattern**: `const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);` before calling prototype methods.

-   **Diagnostic Scripts**: Create standalone scripts to identify root causes before implementing fixes.

-   **Position Validation**: Always validate positions before API calls to prevent ERR_INVALID_TARGET/ERR_INVALID_ARGS.

-   **Plan-Reality Alignment**: Tools to sync memory plans with actual room layouts for legacy rooms.

## Recent Diagnostic Tools Created

-   `diagnose_extension_positions.js`: Compare planned vs actual structure positions
-   `fix_plan_to_match_reality.js`: Align room plans with actual structure layouts  
-   `fix_existing_structure_marking.js`: Mark existing structures as placed in plans
-   `force_replan_command.js`: Clear room memory to trigger fresh planning
-   `test_existing_structure_detection.js`: Validate structure detection logic

## Error Handling Patterns

-   **Memory Position Safety**: Always reconstruct RoomPosition objects from memory data
-   **API Validation**: Validate all parameters before Screeps API calls
-   **Graceful Degradation**: System continues functioning even when individual components fail
-   **Comprehensive Logging**: Human-readable error messages with diagnostic context
