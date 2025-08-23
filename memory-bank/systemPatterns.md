# System Patterns

1.  **Modularity > monolith**: small, testable units behind contracts.

2.  **Deterministic tick**: priority scheduler; idempotent planners/managers.

3.  **Config over code**: tune behavior without editing logic.

4.  **Failure-safe**: error boundaries; never crash the tick.

5.  **Cadence & rate limits**: plan/scan on cadence; critical paths every tick.

6.  **Visibility**: decisions & KPIs visible in HUD/logs.

* * * * *

Architecture Overview
---------------------

`main loop
 ├─ Kernel (priority scheduler, CPU guards, error boundaries)
 ├─ Intel (terrain, sources, hostiles, lastSeen, threat scores)
 ├─ Planners
 │   ├─ BaseLayoutPlanner (stamps: spawn, extension rings, roads)
 │   ├─ RemoteMiningPlanner (routes, reservations)
 │   └─ DefensePlanner (ramparts, walls, tower placement)
 ├─ Managers
 │   ├─ SpawnManager (mix calc, queues, renew/recycle)
 │   ├─ LogisticsManager (hauling, link net, routing)
 │   ├─ EconomyManager (labs, factory, terminal, market)
 │   ├─ RoomManager (RCL strategy, construction convergence)
 │   ├─ CombatManager (defense, squads, boosts)
 │   ├─ ExpansionManager (scoring, claim/seed/bootstrap)
 │   └─ PowerManager (Operator/Commander routines)
 ├─ Roles (miner, hauler, builder, upgrader, repairer, reserver, scout, defender...)
 ├─ Pathing (PathFinder wrapper, matrix cache, serialization)
 ├─ Visualization (HUD overlays, heatmaps)
 └─ Telemetry (logger, profiler hooks, stats export)`

* * * * *

Tick Pipeline (Definition of Done per Tick)
-------------------------------------------

1.  **Boot/Guards**: mount global, safe prototypes, error boundary.

2.  **CPU/Bucket Policy**: if `bucket < settings.bucketFloor` → run *critical-only* set.

3.  **Intel Update (cadenced)**: structures, sources, threats, reservations, market quotes.

4.  **Planner Pass (cadenced)**: base stamps, remotes, defenses; reconcile construction sites.

5.  **Managers (priority order)**:

    1.  Spawn → 2) Logistics → 3) Economy → 4) Room → 5) Combat → 6) Expansion → 7) Power

6.  **Role Execution**: state machines per creep, minimal per-tick allocations.

7.  **Visuals & Stats**: HUD overlays, counters, optional export.

8.  **Maintenance**: memory GC, cache trims, error flush.


`/src
  /kernel        // scheduler, guards
  /intel         // room/empire intel
  /planners      // base/remote/defense planners
  /managers      // spawn/logistics/economy/room/combat/expansion/power
  /roles         // creep behaviors
  /pathing       // PathFinder wrapper, cost matrices, caches
  /visuals       // HUD overlays
  /telemetry     // logger, stats, profiler hooks
  /config        // defaults + per-room overrides
  /utils         // pure helpers, math, guards
main.ts
types.d.ts
README.md`
