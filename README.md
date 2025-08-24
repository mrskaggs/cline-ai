# Screeps AI - Modular Autonomous Bot

A modular, CPU-efficient Screeps AI that autonomously progresses rooms from RCL1→8, designed for easy extension and configuration. Features comprehensive building and road planning systems for intelligent room development.

## Features

### Core Functionality (RCL1-8 Implementation)
- **Autonomous Bootstrap**: Fresh rooms automatically progress from RCL1 to RCL8 with zero human input
- **Intelligent Building Planning**: RCL-based building placement using hybrid template + dynamic algorithms
- **Traffic-Based Road Planning**: Roads placed along most-traveled paths using traffic analysis
- **Smart Room Layout Adaptation**: Terrain analysis adapts to each room's unique layout
- **Modular Architecture**: Clean separation of concerns with managers, roles, planners, and utilities
- **Error Handling**: Comprehensive error boundaries prevent single failures from crashing the entire tick
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Configurable**: Easy-to-modify settings for population targets, energy thresholds, and planning behaviors

### Implemented Systems
- **Kernel**: Main loop scheduler with CPU guards and error handling
- **Room Manager**: Scans rooms, populates memory, manages planning systems and tower defense
- **Spawn Manager**: Calculates required creeps and spawns them based on RCL progression
- **Role System**: Specialized creep behaviors (Harvester, Builder, Upgrader, Hauler)
- **Planning System**: Comprehensive building and road planning with traffic analysis
- **Memory Management**: Automatic cleanup of dead creeps and efficient memory usage

### Planning System Features
- **Building Planning**: RCL-based templates (1-8) with dynamic placement optimization
- **Road Planning**: Traffic analysis drives road placement along optimal paths
- **Terrain Analysis**: Room analysis identifies key positions and buildable areas
- **Construction Management**: Priority-based construction site placement and cleanup
- **Traffic Analysis**: Tracks creep movement patterns for road optimization
- **CPU Efficient**: Cadenced execution to manage CPU usage

## Project Structure

```
src/
├── kernel/
│   └── Kernel.ts          # Main loop scheduler and error handling
├── managers/
│   ├── RoomManager.ts     # Room state management, planning, and defense
│   └── SpawnManager.ts    # Creep spawning logic
├── roles/
│   ├── Harvester.ts       # Energy harvesting and basic tasks (RCL1)
│   ├── Builder.ts         # Construction and repair (RCL2+)
│   ├── Upgrader.ts        # Controller upgrading (RCL2+)
│   └── Hauler.ts          # Energy logistics and transport (RCL3+)
├── planners/
│   ├── TerrainAnalyzer.ts # Room terrain analysis and key position identification
│   ├── LayoutTemplates.ts # RCL-based building layout templates
│   ├── BaseLayoutPlanner.ts # Building placement with hybrid template + dynamic approach
│   └── RoadPlanner.ts     # Traffic-based road network planning
├── utils/
│   ├── Logger.ts          # Centralized logging system
│   ├── PathingUtils.ts    # Pathfinding utilities with cost matrix caching
│   └── TrafficAnalyzer.ts # Creep movement tracking and traffic analysis
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

4. Run validation tests:
   ```bash
   node test_system_validation.js
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

### Planning System
```typescript
planning: {
  enabled: true,
  planningCadence: 50,           // Ticks between planning runs
  constructionCadence: 10,       // Ticks between construction management
  maxConstructionSites: 5,       // Maximum construction sites per room
  trafficAnalysisEnabled: true,  // Enable traffic-based road planning
  buildingPlanningEnabled: true, // Enable building planning
  roadPlanningEnabled: true,     // Enable road planning
  useTemplates: true,            // Use RCL-based templates
  useDynamicPlacement: true,     // Use dynamic building placement
  minTrafficForRoad: 5,          // Minimum traffic to justify a road
  minTrafficDataPoints: 20       // Minimum data points before road planning
}
```

### Logging
```typescript
logging: {
  enabled: true,
  logLevel: 'INFO',
  logSpawning: true,
  logCreepActions: false
}
```

## Architecture Principles

1. **Modularity**: Small, testable units behind clear contracts
2. **Deterministic Tick**: Priority scheduler with idempotent managers
3. **Config Over Code**: Tune behavior without editing logic
4. **Failure-Safe**: Error boundaries prevent tick crashes
5. **Visibility**: Decisions and KPIs visible in logs
6. **CPU Efficiency**: Cadenced execution and optimized algorithms

## Planning System

### Building Planning
- **RCL Templates**: Predefined layouts for each RCL (1-8) with optimal building placement
- **Dynamic Placement**: Intelligent positioning based on room terrain and key positions
- **Hybrid Approach**: Combines templates for reliability with dynamic placement for optimization
- **Priority System**: Buildings placed based on importance and RCL requirements

### Road Planning
- **Traffic Analysis**: Tracks creep movement patterns to identify high-traffic areas
- **Optimal Pathfinding**: Calculates efficient paths between key positions (sources, controller, spawns)
- **Traffic-Based Optimization**: Places roads along most-traveled routes
- **Adaptive Network**: Road network evolves based on actual usage patterns

### Terrain Analysis
- **Room Scanning**: Analyzes terrain to identify buildable areas and obstacles
- **Key Position Detection**: Locates sources, controller, mineral, spawns, and exits
- **Central Area Calculation**: Finds optimal central location for building clusters
- **Buildable Area Mapping**: Identifies suitable positions for different structure types

## RCL Progression Strategy

### RCL 1
- **Harvesters Only**: Multi-purpose creeps handle harvesting, building, and upgrading
- **Population**: 4 harvesters (2 per source minimum)
- **Focus**: Establish basic energy flow and upgrade to RCL2
- **Planning**: Basic spawn placement, prepare for extensions

### RCL 2
- **Specialized Roles**: Dedicated harvesters, builders, and upgraders
- **Buildings**: 5 extensions in cross pattern around spawn
- **Population**: 2 harvesters, 1 upgrader, 1-2 builders
- **Planning**: Extension placement for energy capacity

### RCL 3
- **Defense**: First tower for room defense
- **Logistics**: Hauler role for efficient energy transport from containers
- **Buildings**: Tower + 5 additional extensions (10 total)
- **Population**: 2 harvesters, 2 upgraders, 1-2 builders, 3 haulers (1.5 per source)
- **Planning**: Tower placement for optimal coverage, container-based energy logistics
- **Efficiency**: Haulers transport energy from source containers to spawn/extensions/towers

### RCL 4-8
- **Advanced Structures**: Storage, terminal, labs, factory, etc.
- **Complex Layouts**: Multi-spawn setups, lab clusters, defensive positions
- **Specialized Buildings**: Power spawn, nuker, observer for high-level rooms
- **Road Networks**: Comprehensive road systems based on traffic analysis

## Hauler Role System (RCL 3+)

The Hauler role provides efficient energy logistics for RCL 3+ rooms with container-based energy collection:

### Smart Collection Priority
- **Containers**: Primary energy source from harvester deposits
- **Storage**: Secondary source when available
- **Dropped Energy**: Cleanup of scattered energy
- **Links**: Integration with link networks

### Intelligent Delivery Priority
- **Spawn**: Highest priority for creep production
- **Extensions**: Essential for larger creep spawning
- **Towers**: Defense and repair capabilities
- **Storage**: Excess energy storage
- **Controller Containers**: Support for upgrader operations

### Energy-Optimized Bodies
- **Scaling Design**: Bodies scale from 2-carry (200 energy) to 8-carry (800 energy)
- **Efficient Movement**: Balanced MOVE/CARRY ratio for optimal speed
- **Cost Effective**: Adapts to available energy capacity

### Smart Spawning Logic
- **Container Detection**: Only spawns when containers are available
- **Population Scaling**: 1.5 haulers per source (3 haulers for 2-source rooms)
- **Priority Integration**: Spawns after harvesters but before upgraders/builders

## Defense System

- **Tower Control**: Automatic tower targeting of hostile creeps
- **Priority Targeting**: Focus fire on closest threats
- **Energy Management**: Towers only fire when they have energy
- **Multi-Tower Coordination**: All towers target the same threat for maximum damage

## Traffic Analysis & Road Planning

### Traffic Tracking
- **Movement Monitoring**: Tracks all creep movements in real-time
- **Pattern Analysis**: Identifies frequently used paths and positions
- **Data Persistence**: Maintains traffic history with automatic cleanup
- **Role-Based Analysis**: Tracks different creep types for specialized routing

### Road Optimization
- **High-Traffic Detection**: Identifies positions that justify road placement
- **Path Prioritization**: Source paths > Controller paths > Internal paths
- **Dynamic Updates**: Road network adapts as traffic patterns change
- **CPU Efficient**: Cadenced analysis to manage computational load

## Memory Structure

The AI maintains structured memory for efficient operation:

```typescript
interface RoomMemory {
  sources: { [id: string]: SourceMemory };
  controllerId?: Id<StructureController>;
  spawnIds: Id<StructureSpawn>[];
  lastUpdated: number;
  rcl: number;
  plan?: RoomPlan;                    // Building and road plans
  trafficData?: TrafficData;          // Traffic analysis data
  layoutAnalysis?: LayoutAnalysis;    // Terrain analysis cache
}

interface RoomPlan {
  roomName: string;
  buildings: PlannedBuilding[];
  roads: PlannedRoad[];
  rcl: number;
  lastUpdated: number;
  status: 'planning' | 'building' | 'ready' | 'complete';
  priority: number;
}

interface CreepMemory {
  role: string;
  homeRoom: string;
  working?: boolean;
  sourceId?: Id<Source>;
  targetId?: Id<Structure | ConstructionSite>;
  hauling?: boolean;                  // Hauler role state tracking
}
```

## Performance

- **CPU Efficient**: Designed to run within standard CPU limits with cadenced execution
- **Error Recovery**: Graceful degradation when errors occur
- **Memory Cleanup**: Automatic cleanup of dead creeps, old traffic data, and expired plans
- **Optimized Pathfinding**: Efficient movement with cached cost matrices
- **Smart Scheduling**: Planning systems run on different cadences to distribute CPU load

## Recent Bug Fixes & Improvements

### Construction Site Placement Error Fix (Critical)
- **Issue**: `TypeError: pos.lookFor is not a function` causing RoomManager crashes
- **Root Cause**: Memory serialization strips prototype methods from RoomPosition objects
- **Fix**: Applied RoomPosition reconstruction pattern throughout planning system
- **Files Fixed**: BaseLayoutPlanner.ts, TerrainAnalyzer.ts, RoadPlanner.ts
- **Impact**: Eliminated all construction site placement crashes, system now stable
- **Pattern**: `const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);`

### Extension Position Mismatch Fix
- **Issue**: ERR_RCL_NOT_ENOUGH errors when placing extensions at RCL 2
- **Root Cause**: Room plan coordinates didn't match actual extension positions
- **Fix**: Created diagnostic and alignment scripts to sync plan with reality
- **Tools**: `diagnose_extension_positions.js`, `fix_plan_to_match_reality.js`
- **Impact**: System now correctly handles existing structures and avoids duplicate placement

### Memory Serialization Robustness
- **Issue**: Multiple methods failing due to memory-serialized position objects
- **Fix**: Comprehensive audit and fix of all position-dependent methods
- **Methods Fixed**: `hasStructureAtPosition()`, `findConstructionSiteId()`, `isSuitableForStructure()`, `hasRoadOrStructure()`
- **Impact**: Robust handling of memory data throughout the planning system

### Duplicate Road Planning Fix
- **Issue**: RoadPlanner was executing twice per tick, wasting CPU
- **Fix**: Added execution tracking to prevent duplicate planning calls
- **Impact**: Reduced CPU usage and eliminated duplicate log messages

### Road Placement Fix
- **Issue**: Generated roads weren't appearing as construction sites
- **Root Cause**: Traffic requirement filtered out all roads in new rooms (no traffic data)
- **Fix**: Allow high-priority roads (spawn-source, spawn-controller) without traffic data
- **Impact**: Critical infrastructure roads now appear immediately in new rooms

### Console Logging Improvements
- **Issue**: Excessive console spam cluttering Screeps interface
- **Fix**: Implemented centralized Logger with configurable levels and throttling
- **Impact**: Clean console output with meaningful information only

### Priority-Based Building System
- **Issue**: Builders were going back and forth between construction sites based on proximity rather than importance
- **Root Cause**: Construction site selection used `findClosestByPath` without considering priority
- **Fix**: Implemented priority-based targeting system that uses existing priority values from room plans
- **Impact**: Builders now focus on high-priority structures (spawns, source roads) before lower-priority ones
- **Algorithm**: Sorts construction sites by priority (highest first), then distance (closest first) for tie-breaking
- **Testing**: Comprehensive test suite with 4 scenarios - all tests pass
- **Benefits**: Eliminates inefficient back-and-forth movement, faster base development, better CPU efficiency

### Hauler Role Implementation (RCL 3+ Ready)
- **Feature**: Complete Hauler role system for efficient energy logistics at RCL 3+
- **Smart Collection**: Prioritizes containers → storage → dropped energy → links
- **Intelligent Delivery**: Spawn → extensions → towers → storage → controller containers
- **Energy-Optimized Bodies**: Scales from 2-carry (200 energy) to 8-carry (800 energy)
- **Smart Spawning**: Container detection with 1.5 haulers per source scaling
- **State Management**: Visual feedback with 🔄 pickup and 🚚 delivery indicators
- **ES2019 Compatibility**: Removed optional chaining for Screeps compatibility
- **Integration**: Full SpawnManager and Kernel integration with priority-based spawning
- **Testing**: Comprehensive test suite validates all functionality - all tests pass
- **Impact**: Ready for RCL 3 transition with efficient container-based energy logistics

## Testing

The project includes comprehensive validation tests:

```bash
# Run system validation tests
node test_system_validation.js

# Test duplicate road planning fix
node test_duplicate_road_planning_fix.js

# Test road placement fix
node test_road_placement_fix.js

# Test priority-based building system
node test_priority_building_system.js
```

Tests validate:
- Settings system loading
- Logger functionality with throttling
- Terrain analysis and key position identification
- Layout templates and building planning (33 buildings for RCL 3)
- Traffic analysis and road planning (122 roads planned, high-priority placed immediately)
- Pathfinding utilities and cost matrix caching
- Duplicate execution prevention
- Road placement logic with priority-based filtering
- Full system integration and error handling

## Future Expansion

This foundation supports easy extension to advanced features:
- Remote mining operations with road networks
- Complex combat and squad coordination
- Market and factory automation
- Power creep management
- Multi-room empire coordination
- Advanced traffic optimization
- Dynamic layout adaptation

## Contributing

The modular architecture makes it easy to extend:

1. **New Roles**: Add to `src/roles/` and register in `Kernel.ts`
2. **New Managers**: Add to `src/managers/` and register in `Kernel.ts`
3. **New Planners**: Add to `src/planners/` and integrate with `RoomManager.ts`
4. **Configuration**: Extend `src/config/settings.ts` for new options
5. **Types**: Update `src/types.d.ts` for new memory structures

## License

ISC License - Feel free to use and modify for your Screeps adventures!
