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

## MCP Server Resources

### Context7 MCP Server - Screeps Documentation
**Available Libraries:**
- `/screeps/screeps` - Standalone server (8 code snippets)
- `/screeps/docs` - Official documentation (503 code snippets)

**Access Pattern:**
```javascript
// 1. Resolve library ID
use_mcp_tool('github.com/upstash/context7-mcp', 'resolve-library-id', {libraryName: 'screeps'})

// 2. Get documentation for specific topics
use_mcp_tool('github.com/upstash/context7-mcp', 'get-library-docs', {
  context7CompatibleLibraryID: '/screeps/docs',
  topic: 'pathfinding' | 'performance' | 'labs' | 'factory' | 'market',
  tokens: 8000
})
```

**Immediate Applications:**
- **PathFinder optimization**: Advanced PathFinder.search with custom cost matrices
- **CPU profiling**: Per-creep CPU monitoring with `Game.cpu.getUsed()`
- **Movement optimization**: `moveTo({reusePath: 50})` patterns for CPU efficiency
- **Memory management**: `Room.serializePath` for efficient path storage

**Future Development Resources:**
- **RCL 6+ Labs**: Complete reaction chains and creep boosting systems
- **RCL 7+ Factory**: Commodity production for economic growth
- **Power Creeps**: Advanced room management capabilities
- **Market automation**: Resource trading and price analysis systems

**Key Examples Available:**
- PathFinder with custom cost matrices and room callbacks
- CPU-optimized movement patterns with conditional pathfinding
- Lab reaction systems for mineral compound production
- Factory commodity production recipes and cooldowns
- Market order creation and price history analysis
- Power creep creation and ability usage patterns

**Usage Priority:** Use when implementing advanced features, optimizing performance, or researching new game mechanics. Particularly valuable for RCL 6+ development phases.
