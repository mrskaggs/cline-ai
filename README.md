# Screeps AI - Modular Autonomous Bot

A modular, CPU-efficient Screeps AI that autonomously progresses rooms from RCL1→8, designed for easy extension and configuration.

## Features

### Core Functionality (RCL1-3 Implementation)
- **Autonomous Bootstrap**: Fresh rooms automatically progress from RCL1 to RCL3 with zero human input
- **Modular Architecture**: Clean separation of concerns with managers, roles, and utilities
- **Error Handling**: Comprehensive error boundaries prevent single failures from crashing the entire tick
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Configurable**: Easy-to-modify settings for population targets, energy thresholds, and behaviors

### Implemented Systems
- **Kernel**: Main loop scheduler with CPU guards and error handling
- **Room Manager**: Scans rooms, populates memory, and manages basic tower defense
- **Spawn Manager**: Calculates required creeps and spawns them based on RCL progression
- **Role System**: Specialized creep behaviors (Harvester, Builder, Upgrader)
- **Memory Management**: Automatic cleanup of dead creeps and efficient memory usage

## Project Structure

```
src/
├── kernel/
│   └── Kernel.ts          # Main loop scheduler and error handling
├── managers/
│   ├── RoomManager.ts     # Room state management and defense
│   └── SpawnManager.ts    # Creep spawning logic
├── roles/
│   ├── Harvester.ts       # Energy harvesting and basic tasks (RCL1)
│   ├── Builder.ts         # Construction and repair (RCL2+)
│   └── Upgrader.ts        # Controller upgrading (RCL2+)
├── config/
│   └── settings.ts        # Global configuration and constants
├── types.d.ts             # TypeScript type definitions
└── main.ts                # Entry point and game loop
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Screeps account (for deployment)

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

### Development Scripts

- `npm run build` - Build the project for deployment
- `npm run build:watch` - Build and watch for changes
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier

### Deployment

1. Build the project: `npm run build`
2. Copy the contents of `dist/main.js` to your Screeps console
3. Or use screeps-cli (when available) for automated deployment

## Configuration

The AI behavior can be customized through `src/config/settings.ts`:

### Population Targets
```typescript
population: {
  harvester: { rcl1: 4, rcl2Plus: 2 },
  upgrader: { rcl2: 1, rcl3Plus: 2 },
  builder: { base: 1, withConstructionSites: 2 }
}
```

### Energy Thresholds
```typescript
energy: {
  emergency: 200,  // Minimum energy for basic creep
  basic: 300,      // Enhanced creep
  advanced: 400,   // Advanced creep
  premium: 500     // Premium creep
}
```

### Logging
```typescript
logging: {
  enabled: true,
  logLevel: 'INFO',
  logSpawning: true
}
```

## Architecture Principles

1. **Modularity**: Small, testable units behind clear contracts
2. **Deterministic Tick**: Priority scheduler with idempotent managers
3. **Config Over Code**: Tune behavior without editing logic
4. **Failure-Safe**: Error boundaries prevent tick crashes
5. **Visibility**: Decisions and KPIs visible in logs

## RCL Progression Strategy

### RCL 1
- **Harvesters Only**: Multi-purpose creeps handle harvesting, building, and upgrading
- **Population**: 4 harvesters (2 per source minimum)
- **Focus**: Establish basic energy flow and upgrade to RCL2

### RCL 2+
- **Specialized Roles**: Dedicated harvesters, builders, and upgraders
- **Harvesters**: 1-2 per source for energy collection
- **Upgraders**: 1-2 dedicated controller upgraders
- **Builders**: 1-2 for construction and repair (more when construction sites exist)

## Defense System

- **Tower Control**: Automatic tower targeting of hostile creeps
- **Priority Targeting**: Focus fire on closest threats
- **Energy Management**: Towers only fire when they have energy

## Future Expansion

This foundation supports easy extension to advanced features:
- Remote mining operations
- Complex combat and squad coordination
- Market and factory automation
- Power creep management
- Multi-room empire coordination

## Memory Structure

The AI maintains structured memory for efficient operation:

```typescript
interface RoomMemory {
  sources: { [id: string]: SourceMemory };
  controllerId?: Id<StructureController>;
  spawnIds: Id<StructureSpawn>[];
  lastUpdated: number;
  rcl: number;
}

interface CreepMemory {
  role: string;
  homeRoom: string;
  working?: boolean;
  sourceId?: Id<Source>;
  targetId?: Id<Structure | ConstructionSite>;
}
```

## Performance

- **CPU Efficient**: Designed to run within standard CPU limits
- **Error Recovery**: Graceful degradation when errors occur
- **Memory Cleanup**: Automatic cleanup of dead creeps and structures
- **Optimized Pathfinding**: Efficient movement with visual path indicators

## Contributing

The modular architecture makes it easy to extend:

1. **New Roles**: Add to `src/roles/` and register in `Kernel.ts`
2. **New Managers**: Add to `src/managers/` and register in `Kernel.ts`
3. **Configuration**: Extend `src/config/settings.ts` for new options
4. **Types**: Update `src/types.d.ts` for new memory structures

## License

ISC License - Feel free to use and modify for your Screeps adventures!
