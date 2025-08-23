# Implementation Plan

[Overview]
This plan outlines the foundational steps to create a modular, CPU-efficient, and fully autonomous Screeps bot, focusing on achieving a stable bootstrap from Room Control Level (RCL) 1 to RCL3.

The initial implementation will establish the core architectural components, including a kernel for process scheduling, essential managers for spawning, room control, and logistics, and the basic creep roles required for early-game progression. This foundational milestone will ensure the AI can autonomously harvest energy, upgrade the controller, build essential structures, and defend itself, providing a stable platform for future expansion into more advanced features like remote mining, complex combat, and late-game economy management.

[Types]
This section defines the core TypeScript interfaces and type aliases for managing game state in Memory, ensuring type safety and clarity across the codebase.

```typescript
// file: src/types.d.ts

// -- Memory Structures -- //

interface CreepMemory {
  role: string;
  task?: string;
  sourceId?: Id<Source>;
  targetId?: Id<Structure> | Id<ConstructionSite> | Id<Creep>;
  working?: boolean;
  homeRoom: string;
}

interface RoomMemory {
  sources: { [id: Id<Source>]: SourceMemory };
  controllerId?: Id<StructureController>;
  spawnIds: Id<StructureSpawn>[];
  lastUpdated: number;
  rcl: number;
}

interface SourceMemory {
  minerId?: Id<Creep>;
  containerId?: Id<StructureContainer>;
  linkId?: Id<StructureLink>;
  path?: RoomPosition[];
}

interface Memory {
  uuid: number;
  log: any;
  creeps: { [name: string]: CreepMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  flags: { [name: string]: FlagMemory };
  empire: any;
}

// -- Global & Kernel -- //

declare namespace NodeJS {
  interface Global {
    kernel: IKernel;
  }
}

interface IKernel {
  run(): void;
  // Add more kernel methods as needed
}
```

[Files]
This section details the file and directory structure for the initial RCL1-3 implementation, based on the modular architecture defined in `systemPatterns.md`.

**New Files to be Created:**
-   `src/main.ts`: Main game loop entry point.
-   `src/types.d.ts`: Global TypeScript type definitions.
-   `src/kernel/Kernel.ts`: Core process scheduler and CPU manager.
-   `src/managers/RoomManager.ts`: Manages room-level state and progression.
-   `src/managers/SpawnManager.ts`: Handles creep spawning logic and queues.
-   `src/managers/LogisticsManager.ts`: Coordinates energy harvesting and distribution.
-   `src/roles/Harvester.ts`: Early-game creep for harvesting, upgrading, and building.
-   `src/roles/Upgrader.ts`: Dedicated controller upgrader.
-   `src/roles/Builder.ts`: Dedicated construction worker.
-   `src/utils/helpers.ts`: Generic utility functions.
-   `src/config/settings.ts`: Global configuration and constants.
-   `package.json`: Project manifest and dependencies.
-   `tsconfig.json`: TypeScript compiler configuration.
-   `.eslintrc.js`: ESLint configuration.
-   `.prettierrc`: Prettier configuration.
-   `screeps.json`: `screeps-cli` configuration file for deployment.

[Functions]
This section describes key utility functions required for the initial implementation.

**New Functions:**
-   `getEnergy(creep: Creep)` in `src/utils/helpers.ts`: A helper function to find the nearest energy source (container, storage, or dropped resource) for a creep.
-   `runRole(creep: Creep)` in `src/main.ts`: A top-level function to delegate creep logic to the appropriate role module.
-   `safelyExecute(callback: () => void)` in `src/kernel/Kernel.ts`: An error-handling wrapper to prevent a single error from crashing the entire tick.

[Classes]
This section outlines the core classes that form the backbone of the AI's architecture for the RCL1-3 milestone.

**New Classes:**
-   `Kernel` in `src/kernel/Kernel.ts`: Manages the main loop, schedules processes, and monitors CPU usage. Key methods: `run()`, `load()`, `shutdown()`.
-   `RoomManager` in `src/managers/RoomManager.ts`: Responsible for initializing and updating room memory, scanning for sources, and tracking RCL progress. Key methods: `run(room: Room)`.
-   `SpawnManager` in `src/managers/SpawnManager.ts`: Determines which creeps to spawn based on room needs and manages the spawn queue. Key methods: `run(spawn: StructureSpawn)`.
-   `LogisticsManager` in `src/managers/LogisticsManager.ts`: A placeholder for early-game logic, which will later manage haulers and energy distribution. Initially, it will be minimal. Key methods: `run(room: Room)`.
-   `Harvester`, `Upgrader`, `Builder` in `src/roles/*.ts`: Classes representing creep roles, each with a `run(creep: Creep)` method that contains the state machine for that role's behavior.

[Dependencies]
This section lists the npm packages required for development, testing, and deployment.

**New Dependencies:**
-   `typescript`: The TypeScript compiler.
-   `ts-node`: To run TypeScript files directly.
-   `esbuild`: A fast bundler to compile TypeScript to JavaScript for Screeps.
-   `eslint` & `prettier`: For code linting and formatting.
-   `@types/node`: Type definitions for Node.js.
-   `@types/screeps`: Official type definitions for the Screeps API.
-   `screeps-cli`: For uploading code to the Screeps server.
-   `@typescript-eslint/parser` & `@typescript-eslint/eslint-plugin`: For ESLint to understand TypeScript.

[Testing]
This section describes the initial approach to testing.

A `tests/` directory will be created for unit tests. Initial tests will focus on pure functions in `src/utils/helpers.ts` and the logic within the `SpawnManager` to ensure correct creep body generation and population counts. A testing framework like `jest` will be added in a future iteration. For now, testing will be primarily done via simulation in the Screeps environment.

[Implementation Order]
This section provides the logical sequence of steps for building the RCL1-3 bootstrap functionality.

1.  **Project Setup:** Initialize `package.json`, install all dependencies, and configure `tsconfig.json`, `.eslintrc.js`, `.prettierrc`, and `screeps.json`.
2.  **Type Definitions:** Create `src/types.d.ts` with all the core memory interfaces.
3.  **Kernel Implementation:** Build the `Kernel` class to manage the main loop and provide error handling.
4.  **Main Loop:** Implement the main entry point in `src/main.ts`, which will instantiate and run the `Kernel`.
5.  **Room Manager:** Implement the `RoomManager` to scan rooms and populate `RoomMemory`.
6.  **Initial Roles:** Create the `Harvester` role, which will be the only creep type at RCL1.
7.  **Spawn Manager:** Implement the `SpawnManager` to calculate the required number of `Harvester` creeps and spawn them.
8.  **Refine Roles for RCL2+:** Implement dedicated `Builder` and `Upgrader` roles and update the `SpawnManager` to handle the new creep types as the room progresses.
9.  **Basic Defense:** Add simple tower logic within the `RoomManager` to attack any hostile creeps.
10. **Configuration:** Create `src/config/settings.ts` to store constants like creep body parts and population targets.
