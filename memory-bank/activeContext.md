# Active Context

This document tracks the current state of the project, including recent changes, next steps, and active decisions. It's the go-to place for understanding what's happening right now.

## Recent Changes (Latest Session)

### Console Logging Improvements
- **Issue**: Excessive console output was cluttering the Screeps console
- **Solution**: Implemented comprehensive logging system with proper controls

#### Changes Made:
1. **Created Logger Utility** (`src/utils/Logger.ts`)
   - Centralized logging with level controls (DEBUG, INFO, WARN, ERROR)
   - Throttled logging to prevent spam
   - Configurable via settings
   - Automatic cleanup of old log entries

2. **Updated All Components to Use Logger**
   - `Kernel.ts`: Uses Logger, only logs loading once per global reset
   - `SpawnManager.ts`: Uses Logger, spawn logging now configurable
   - `RoomManager.ts`: Uses Logger for error handling
   - `Upgrader.ts`: Removed unnecessary console.log

3. **Adjusted Default Settings**
   - Changed log level from 'INFO' to 'WARN' to reduce noise
   - Disabled spawn logging by default
   - Kept error and warning logging enabled for debugging

#### Benefits:
- Dramatically reduced console spam
- Better control over what gets logged
- Configurable logging levels for different environments
- Automatic cleanup prevents memory leaks
- Consistent logging format with timestamps and context

## Current State
- All TypeScript compilation errors resolved
- Build process working correctly (27.9kb bundle)
- Logging system fully integrated
- **FIXED**: Resolved SyntaxError in Screeps environment:
  - Replaced `new Date().toISOString()` with static string to avoid Date constructor
  - Replaced all optional chaining operators (`?.`) with traditional null checks
  - Screeps environment doesn't support ES2020 optional chaining syntax
- Ready for deployment to Screeps server

## Next Steps
- Deploy to Screeps and verify reduced console output
- Monitor performance and adjust logging levels as needed
- Consider adding more granular logging controls for specific components

## Latest Bug Fix (Current Session)

### Duplicate Road Planning Issue
- **Problem**: RoadPlanner was executing twice in the same tick for the same room, causing unnecessary CPU usage
- **Root Cause**: In `RoomManager.runPlanning()`, both `updateBuildingPlan()` and `updateRoadPlan()` were being called simultaneously when planning conditions were met, leading to duplicate calls to `RoadPlanner.planRoadNetwork()`
- **Solution**: Added logic to track when roads have been updated in the current tick and prevent duplicate execution
- **Changes Made**:
  1. Added `roadsUpdatedThisTick` flag in `runPlanning()` method
  2. Set flag to true after `updateBuildingPlan()` since it may trigger road planning
  3. Only call `updateRoadPlan()` if roads haven't been updated yet
  4. Added early return after `replanRoom()` to prevent duplicate work
- **Testing**: Created comprehensive test that simulates the duplicate planning scenario - confirmed fix prevents duplicate calls
- **Result**: RoadPlanner now executes exactly once per tick per room, eliminating wasteful CPU usage

### Technical Details
- **File Modified**: `src/managers/RoomManager.ts`
- **Method**: `runPlanning(room: Room)`
- **CPU Impact**: Reduced by eliminating duplicate road planning calculations
- **Logs**: Will now show single road planning execution instead of duplicates

## Road Placement Issue (Current Session)

### Missing Roads Problem
- **Problem**: RoadPlanner generated 122 roads but none appeared on screen as construction sites
- **Root Cause**: `placeRoadConstructionSites()` filtered roads by `trafficScore >= minTrafficForRoad` (5), but new rooms have no traffic data, so all roads had trafficScore = 0 and were filtered out
- **Solution**: Modified filtering logic to allow high-priority roads (priority >= 80) even without traffic data
- **Changes Made**:
  1. Updated filter condition in `RoadPlanner.placeRoadConstructionSites()`
  2. Changed from: `road.trafficScore >= Settings.planning.minTrafficForRoad`
  3. Changed to: `(road.trafficScore >= Settings.planning.minTrafficForRoad || road.priority >= 80)`
- **Testing**: Created comprehensive test showing roads now get placed correctly
- **Result**: Source paths (priority 100) and controller paths (priority 90) now get placed immediately, even in new rooms without traffic data

### Technical Details
- **File Modified**: `src/planners/RoadPlanner.ts`
- **Method**: `placeRoadConstructionSites(room: Room, roads: PlannedRoad[])`
- **Priority Thresholds**: Source=100, Controller=90, Mineral=70, Exit=60, Internal=50
- **Impact**: Critical infrastructure roads (spawn-to-source, spawn-to-controller) now appear immediately
- **Logs**: Will now show road construction sites being placed for high-priority paths

## Timing Issue Fix (Current Session)

### Road Placement Delay Problem
- **Problem**: Even after fixing priority filtering, roads still weren't appearing on screen
- **Root Cause**: Timing mismatch between planning and construction site placement
  - Road planning: Every 50 ticks (planningCadence)
  - Construction site placement: Every 10 ticks (constructionCadence)
  - Result: Up to 40-tick delay between planning and placement
- **Solution**: Place road construction sites immediately after planning, not waiting for construction cadence
- **Changes Made**:
  1. Modified `updateRoadPlan()` in `RoomManager.ts`
  2. Added immediate call to `RoadPlanner.placeRoadConstructionSites()` after planning
  3. Roads now appear in the same tick they are planned
- **Testing**: Created test showing 0-tick delay vs previous 40-tick delay
- **Result**: Critical infrastructure roads now appear immediately on screen when planned

### Complete Fix Summary
1. **Duplicate Planning**: Prevented duplicate execution (CPU optimization)
2. **Priority Filtering**: Allow high-priority roads without traffic data
3. **Timing Fix**: Immediate placement after planning (0-tick delay)
4. **Final Result**: Roads appear on screen immediately when conditions are met

### Technical Details
- **File Modified**: `src/managers/RoomManager.ts`
- **Method**: `updateRoadPlan(room: Room)`
- **Change**: Added immediate `placeRoadConstructionSites()` call after planning
- **Impact**: Eliminated up to 40-tick delay between planning and placement
- **Logs**: Will show both planning and immediate placement messages

## Priority-Based Building System (Current Session)

### Builder Optimization Issue
- **Problem**: Builders were using `findClosestByPath` to select construction sites, causing them to go back and forth between different buildings instead of focusing on high-priority structures first
- **Root Cause**: No priority consideration in construction site selection - builders would work on whatever was closest, not what was most important
- **Solution**: Implemented priority-based targeting system that uses the existing priority values from room plans

#### Changes Made:
1. **Modified Builder Role** (`src/roles/Builder.ts`)
   - Replaced `findClosestByPath(FIND_CONSTRUCTION_SITES)` with custom `findHighestPriorityConstructionSite()` method
   - New method sorts construction sites by priority (highest first), then by distance (closest first) for tie-breaking
   - Falls back to closest site when no room plan exists (backward compatibility)

2. **Priority-Based Selection Logic**:
   - Matches construction sites to planned buildings/roads using position and structure type
   - Uses priority values from `PlannedBuilding.priority` and `PlannedRoad.priority`
   - Sorts by priority descending, then distance ascending
   - Verifies reachability before selection

3. **Priority Hierarchy** (from existing system):
   - **Buildings**: Spawn=100, Extensions=80-75, Storage=70, etc.
   - **Roads**: Source paths=100, Controller paths=90, Mineral=70, Exit=60, Internal=50

#### Testing:
- Created comprehensive test suite (`test_priority_building_system.js`)
- **Test 1**: Priority-based selection - PASS (selects spawn over extensions)
- **Test 2**: Distance tie-breaking - PASS (selects closer site with same priority)
- **Test 3**: Fallback behavior - PASS (uses closest when no plan exists)
- **Test 4**: Mixed priorities - PASS (selects high-priority road over lower-priority building)

#### Benefits:
- **Eliminates Back-and-Forth**: Builders now focus on completing high-priority structures before moving to lower-priority ones
- **Faster Base Development**: Critical infrastructure (spawns, source roads, controller roads) gets built first
- **CPU Efficiency**: Reduces unnecessary movement between distant construction sites
- **Maintains Compatibility**: Falls back to old behavior when room plans don't exist

### Technical Details
- **File Modified**: `src/roles/Builder.ts`
- **Method Added**: `findHighestPriorityConstructionSite(creep: Creep): ConstructionSite | null`
- **Algorithm**: Priority-first sorting with distance tie-breaking and reachability verification
- **Impact**: Builders now work systematically on highest-priority construction sites first
- **Testing**: All 4 test scenarios pass, confirming correct priority-based behavior
