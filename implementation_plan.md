# Implementation Plan

## Overview
Create a comprehensive building and road planning system that intelligently designs room layouts based on RCL progression, analyzes traffic patterns for optimal road placement, and adapts to unique room terrain while maintaining CPU efficiency.

The system will implement a hybrid approach combining predefined layout templates with dynamic positioning algorithms. It will start with optimal paths between key structures and refine road networks based on actual creep movement patterns. The planner will calculate complete layouts before placing construction sites, ensuring coordinated development that maximizes efficiency while adapting to each room's unique characteristics.

## Types
Define comprehensive type system for planning data structures and room layout management.

```typescript
// Planning system types
interface RoomPlan {
  roomName: string;
  rcl: number;
  lastUpdated: number;
  buildings: PlannedBuilding[];
  roads: PlannedRoad[];
  status: 'planning' | 'ready' | 'building' | 'complete';
  priority: number;
}

interface PlannedBuilding {
  structureType: BuildableStructureConstant;
  pos: RoomPosition;
  priority: number;
  rclRequired: number;
  placed: boolean;
  constructionSiteId?: Id<ConstructionSite>;
  reason: string; // Why this position was chosen
}

interface PlannedRoad {
  pos: RoomPosition;
  priority: number;
  trafficScore: number;
  placed: boolean;
  constructionSiteId?: Id<ConstructionSite>;
  pathType: 'source' | 'controller' | 'mineral' | 'exit' | 'internal';
}

interface TrafficData {
  [key: string]: { // position key "x,y"
    count: number;
    lastSeen: number;
    creepTypes: string[];
  };
}

interface LayoutTemplate {
  name: string;
  rcl: number;
  buildings: TemplateBuilding[];
  centerOffset: { x: number; y: number };
}

interface TemplateBuilding {
  structureType: BuildableStructureConstant;
  offset: { x: number; y: number };
  priority: number;
}

// Memory extensions
interface RoomMemory {
  plan?: RoomPlan;
  trafficData?: TrafficData;
  layoutAnalysis?: {
    terrain: TerrainAnalysis;
    keyPositions: KeyPositions;
    lastAnalyzed: number;
  };
}

interface TerrainAnalysis {
  openSpaces: RoomPosition[];
  walls: RoomPosition[];
  swamps: RoomPosition[];
  exits: RoomPosition[];
  centralArea: RoomPosition;
}

interface KeyPositions {
  spawn: RoomPosition[];
  sources: RoomPosition[];
  controller: RoomPosition;
  mineral: RoomPosition;
  exits: RoomPosition[];
}
```

## Files
Create new planning system files and modify existing managers to integrate planning functionality.

**New Files:**
- `src/planners/BaseLayoutPlanner.ts` - Main building placement logic with template and dynamic systems
- `src/planners/RoadPlanner.ts` - Road network planning with traffic analysis
- `src/planners/TerrainAnalyzer.ts` - Room terrain analysis and key position identification
- `src/planners/LayoutTemplates.ts` - Predefined building layout templates for each RCL
- `src/utils/PathingUtils.ts` - Pathfinding utilities and cost matrix management
- `src/utils/TrafficAnalyzer.ts` - Creep movement tracking and traffic pattern analysis

**Modified Files:**
- `src/managers/RoomManager.ts` - Integrate planning system calls and construction site management
- `src/kernel/Kernel.ts` - Register new planner managers in the execution pipeline
- `src/types.d.ts` - Add new type definitions for planning system
- `src/config/settings.ts` - Add planning system configuration options

## Functions
Define core planning functions with specific responsibilities and integration points.

**BaseLayoutPlanner Functions:**
- `planRoom(room: Room): RoomPlan` - Main planning entry point
- `analyzeRoomLayout(room: Room): LayoutAnalysis` - Analyze room terrain and existing structures
- `generateBuildingPlan(room: Room, rcl: number): PlannedBuilding[]` - Create building placement plan
- `applyTemplate(room: Room, template: LayoutTemplate, anchor: RoomPosition): PlannedBuilding[]` - Apply template layout
- `optimizeDynamicPlacement(room: Room, buildings: PlannedBuilding[]): PlannedBuilding[]` - Dynamic position optimization
- `placeConstructionSites(room: Room, plan: RoomPlan): void` - Place construction sites from plan

**RoadPlanner Functions:**
- `planRoadNetwork(room: Room, buildings: PlannedBuilding[]): PlannedRoad[]` - Plan complete road network
- `calculateOptimalPaths(room: Room, keyPositions: KeyPositions): RoomPosition[][]` - Calculate base path network
- `analyzeTrafficPatterns(room: Room): TrafficData` - Analyze creep movement patterns
- `optimizeRoadPlacement(paths: RoomPosition[][], trafficData: TrafficData): PlannedRoad[]` - Optimize roads based on traffic
- `updateTrafficData(room: Room): void` - Update traffic tracking data

**TerrainAnalyzer Functions:**
- `analyzeRoom(room: Room): TerrainAnalysis` - Complete room terrain analysis
- `findCentralArea(room: Room): RoomPosition` - Find optimal central building area
- `identifyKeyPositions(room: Room): KeyPositions` - Identify sources, controller, exits, etc.
- `calculateBuildableArea(room: Room): RoomPosition[]` - Find all buildable positions

## Classes
Define main planner classes and their integration with existing manager system.

**BaseLayoutPlanner Class:**
- Location: `src/planners/BaseLayoutPlanner.ts`
- Purpose: Main building placement and layout planning
- Key Methods: `run()`, `planRoom()`, `executeConstructionPlan()`
- Integration: Called by RoomManager on cadence (every 50 ticks)

**RoadPlanner Class:**
- Location: `src/planners/RoadPlanner.ts`
- Purpose: Road network planning and traffic analysis
- Key Methods: `run()`, `planRoads()`, `updateTrafficAnalysis()`
- Integration: Called by RoomManager after building planning

**TrafficAnalyzer Class:**
- Location: `src/utils/TrafficAnalyzer.ts`
- Purpose: Track creep movements and analyze traffic patterns
- Key Methods: `trackCreepMovement()`, `analyzePatterns()`, `getTrafficScore()`
- Integration: Called every tick by Kernel for active creeps

**Modified RoomManager Class:**
- Add planner integration: `runPlanners()` method
- Add construction management: `manageConstruction()` method
- Add planning cadence control (every 50 ticks for planning, every 10 ticks for construction)

## Dependencies
Identify required packages and integration requirements.

**No New External Dependencies Required**
- Uses existing Screeps API and TypeScript
- Leverages existing PathFinder for pathfinding
- Integrates with current Logger and Settings systems

**Internal Dependencies:**
- Extends existing Memory interface in `types.d.ts`
- Uses Settings configuration system
- Integrates with Logger for debugging and monitoring
- Uses existing Kernel manager registration system

## Testing
Define testing approach and validation strategies.

**Unit Testing Strategy:**
- Create test files: `tests/planners/BaseLayoutPlanner.test.ts`, `tests/planners/RoadPlanner.test.ts`
- Mock Screeps API objects (Room, RoomPosition, etc.)
- Test layout generation algorithms with various room configurations
- Validate traffic analysis calculations
- Test template application and dynamic optimization

**Integration Testing:**
- Test complete planning cycle from room analysis to construction site placement
- Validate memory usage and CPU performance
- Test interaction between building and road planning
- Verify construction site management and priority handling

**Performance Validation:**
- Monitor CPU usage during planning operations
- Validate memory efficiency of traffic data storage
- Test planning cadence impact on overall system performance
- Ensure graceful degradation under CPU constraints

## Implementation Order
Define step-by-step implementation sequence to minimize conflicts and ensure successful integration.

1. **Foundation Setup** (Types and Utilities)
   - Update `src/types.d.ts` with new planning interfaces
   - Create `src/utils/PathingUtils.ts` with basic pathfinding utilities
   - Update `src/config/settings.ts` with planning configuration

2. **Terrain Analysis System**
   - Implement `src/planners/TerrainAnalyzer.ts`
   - Create room analysis and key position identification
   - Test terrain analysis with various room types

3. **Layout Templates System**
   - Create `src/planners/LayoutTemplates.ts` with RCL-based templates
   - Implement template application logic
   - Test template placement in different room configurations

4. **Building Planning Core**
   - Implement `src/planners/BaseLayoutPlanner.ts`
   - Create dynamic placement optimization algorithms
   - Integrate template and dynamic systems

5. **Traffic Analysis System**
   - Create `src/utils/TrafficAnalyzer.ts`
   - Implement creep movement tracking
   - Add traffic pattern analysis algorithms

6. **Road Planning System**
   - Implement `src/planners/RoadPlanner.ts`
   - Create optimal path calculation
   - Integrate traffic-based road optimization

7. **Manager Integration**
   - Update `src/managers/RoomManager.ts` to integrate planners
   - Add construction site management logic
   - Implement planning cadence control

8. **Kernel Integration**
   - Update `src/kernel/Kernel.ts` to register planners
   - Add traffic tracking to creep execution loop
   - Test complete system integration

9. **Testing and Optimization**
   - Comprehensive testing of all components
   - Performance optimization and CPU usage validation
   - Memory usage optimization and cleanup
   - Final integration testing and bug fixes
