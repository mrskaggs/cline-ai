# Project Brief

Build a modular, CPU-efficient Screeps AI that autonomously progresses rooms from **RCL1→8**, runs **remote mining**, **expands** intelligently, manages **market/factory/labs**, fields **coordinated combat squads**, and supports **power creeps**---while remaining easy to extend and tune via configuration.

**Outcomes (Acceptance Criteria)**

-   Fresh room **bootstraps to RCL3** with zero human input.

-   By RCL5--6: maintain **≥90% energy uptime**, **≤15% controller downtime**, and **1--2 remotes per owned room**.

-   **Defense MTTR < 200 ticks** vs common raids (sustained structure damage prevented ≤RCL6).

-   **War mode** achieves a successful raid/siege vs parity opponents within **≤10k ticks**.

-   Average tick CPU ≤ **90% of `Game.cpu.limit`** with bucket guardrails; graceful degradation when bucket low.

Roles (Responsibilities & KPIs)
-------------------------------

-   **Miner**: fixed to source/mineral on container; KPI: >95% source uptime.

-   **Hauler**: logistics from containers/links; KPI: <60 ticks pickup→dropoff.

-   **Upgrader**: maintain controller progress with cap awareness.

-   **Builder/Repairer**: site throughput; roads ≤10% decay; ramparts to target band.

-   **Harvester (early)**: phased out post RCL2--3.

-   **Scout/Reserver**: intel freshness & reservation SLAs.

-   **Defender/Squads**: tower sync, focus HEAL→RANGED→WORK.

-   **Power Creeps**: Operator boosts on spawn/lab/factory/terminal.

* * * * *

Economy, Logistics & Market
---------------------------

-   **Energy pipeline**: source → container → link hub → storage/terminal → consumers.

-   **Link network**: source→hub→controller; periodic balance tick.

-   **Factory chains**: maintain buffers; throttle to CPU budget.

-   **Terminal policy**: maintain `energy: 20k`, `ops: 2k`, priority minerals.

-   **Market AI**: fee-aware spreads, cooldown handling, cancel stale orders.

* * * * *

Expansion & Remote Mining
-------------------------

**Room scoring (0..100)**\
`score = w1*sources + w2*mineralTier + w3*safePath - w4*hostiles - w5*distance`

-   Auto-claim & bootstrap sequence with seed creeps + defenses.

-   Remote routes avoid SK/portals unless intentional; target **1--2 remotes** by RCL5--6.

* * * * *

Pathfinding
-----------

-   Wrap `PathFinder`; per-room cached cost matrices with a `LAST_MODIFIED` signature.

-   Road bias, swamp penalty; dynamic avoidance of enemy ramparts/roads.

-   Serialize & TTL paths in `Memory.caches.paths`.

* * * * *

Defense & Combat Doctrine
-------------------------

-   **Defense**: towers focus-fire; rampart gating; emergency spawn mix.

-   **Raids/Siege**: dismantle squads for hardpoints; kite vs melee blobs.

-   **Boosts**: tiered by stance (`peace`, `alert`, `war`) with lab prep windows.

-   **Retreat logic**: flee on low TTL or heal deficit; regroup at rally flags.
