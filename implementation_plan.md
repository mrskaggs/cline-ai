# Implementation Plan

## Overview
Redesign the Scout role system to eliminate room cycling and timing issues by implementing a center-first exploration approach with proper state management and memory synchronization.

The current scout logic suffers from fundamental timing issues where scouts attempt to explore rooms while still moving to optimal positions, creating race conditions with memory updates and room visibility. This causes scouts to cycle between rooms without completing proper intelligence gathering. The solution implements a 5-state machine with a dedicated positioning phase where scouts move to room center and wait for memory systems to stabilize before beginning exploration.

## Types
Enhanced ScoutMemory interface with positioning state and exploration completion tracking.

```typescript
export interface ScoutMemory {
    role: 'scout';
    targetRoom?: string;
    homeRoom: string;
    state: 'idle' | 'moving' | 'positioning' | 'exploring' | 'returning';
    positioningStartTick?: number;
    explorationStartTick?: number;
    arrivalTick?: number;
}

interface ScoutData {
    lastScouted: number;
    explorationComplete: boolean;  // NEW: Prevents room cycling
    roomType: 'normal' | 'highway' | 'center' | 'sourcekeeper' | 'unknown';
    sources?: Array<{
        id: string;
        pos: RoomPosition;
        energyCapacity: number;
    }>;
    mineral?: {
        id: string;
        pos: RoomPosition;
        mineralType: MineralConstant;
        density: number;
    };
    controller?: {
        id: string;
        pos: RoomPosition;
        level: number;
        owner?: string;
        reservation?: {
            username: string;
            ticksToEnd: number;
        };
    };
    hostileCount: number;
    hasHostileStructures: boolean;
    structureCount: number;
    hasSpawn: boolean;
    hasTower: boolean;
    remoteScore: number;
    inaccessible: boolean;
}
```

## Files
Complete Scout role rewrite with enhanced state management and timing controls.

**Modified Files:**
- `src/roles/Scout.ts` - Complete rewrite with 5-state machine and positioning phase
- `src/types.d.ts` - Enhanced ScoutMemory and ScoutData interfaces
- `src/managers/SpawnManager.ts` - Optional: Enhanced scout spawning logic for multiple scouts

**New Files:**
- `tests/scout/test_enhanced_scout_system.js` - Comprehensive test suite for new implementation
- `tests/scout/test_positioning_phase_validation.js` - Specific tests for positioning phase timing

## Functions
Complete Scout class rewrite with enhanced state management and timing controls.

**New Functions in Scout class:**
- `handlePositioning(creep: Creep): void` - NEW: Manages center positioning and waiting phase
- `isAtRoomCenter(creep: Creep): boolean` - NEW: Validates scout position at room center
- `shouldStartExploration(creep: Creep): boolean` - NEW: Timing validation for exploration start
- `findNextRoomToScout(creep: Creep): string | null` - ENHANCED: Implements explorationComplete logic
- `markExplorationComplete(roomName: string): void` - NEW: Properly marks rooms as fully explored

**Modified Functions:**
- `run(creep: Creep): void` - Enhanced with 5-state machine (idle->moving->positioning->exploring->returning)
- `handleIdle(creep: Creep): void` - Enhanced room selection with explorationComplete checks
- `handleMoving(creep: Creep): void` - Enhanced with arrival timing validation
- `handleExploring(creep: Creep): void` - Enhanced with longer exploration time and completion marking
- `handleReturning(creep: Creep): void` - Enhanced with proper cleanup
- `gatherIntel(room: Room): void` - Enhanced intelligence gathering with explorationComplete flag

## Classes
Scout class complete rewrite with enhanced state management.

**Scout Class Modifications:**
- **State Machine**: Enhanced from 4-state to 5-state machine with positioning phase
- **Timing Controls**: Added positioning wait time (5-10 ticks) and longer exploration (10-15 ticks)
- **Memory Management**: Enhanced with explorationComplete flags and proper cleanup
- **Error Handling**: Robust error boundaries and inaccessible room handling
- **Room Selection**: Priority-based selection preventing cycling issues

**Key Implementation Details:**
- **Positioning Phase**: Scout moves to room center (25,25) and waits 5-10 ticks for memory stabilization
- **Exploration Completion**: Rooms marked with explorationComplete: true to prevent revisiting
- **Room Selection Priority**: 1) No memory, 2) Incomplete exploration, 3) Stale data (>1000 ticks)
- **Visual Feedback**: Enhanced creep speech with positioning indicators (📍 for positioning phase)

## Dependencies
No new external dependencies required.

All enhancements use existing Screeps API and TypeScript features. The implementation maintains ES2019 compatibility and integrates with existing Logger, Memory, and Game systems.

## Testing
Comprehensive test suite validating timing controls and state management.

**Test Files:**
- `test_enhanced_scout_system.js` - Complete system integration testing
- `test_positioning_phase_validation.js` - Positioning phase timing validation
- `test_room_cycling_prevention.js` - Validates explorationComplete flag system
- `test_scout_memory_management.js` - Memory cleanup and error handling validation

**Test Scenarios:**
- Positioning phase timing (5-10 tick wait at center)
- Room cycling prevention with explorationComplete flags
- Memory synchronization during positioning phase
- Error handling for inaccessible rooms
- Multiple scout coordination (if implemented)
- State transition validation for all 5 states

## Implementation Order
Logical sequence to minimize conflicts and ensure successful integration.

1. **Step 1: Update TypeScript Interfaces** - Enhance ScoutMemory and ScoutData in `src/types.d.ts`
2. **Step 2: Implement Enhanced Scout Class** - Complete rewrite of `src/roles/Scout.ts` with 5-state machine
3. **Step 3: Add Positioning Phase Logic** - Implement center movement and waiting mechanics
4. **Step 4: Implement ExplorationComplete System** - Add room completion tracking and selection logic
5. **Step 5: Enhance Memory Management** - Proper cleanup and error handling for all edge cases
6. **Step 6: Create Comprehensive Tests** - Validate all timing controls and state transitions
7. **Step 7: Integration Testing** - Ensure compatibility with existing SpawnManager and Kernel systems
8. **Step 8: Performance Validation** - Verify CPU efficiency and memory usage optimization
9. **Step 9: Deploy and Monitor** - Deploy with enhanced logging and monitor for room cycling elimination
10. **Step 10: Optional Multi-Scout Enhancement** - If needed, implement multiple scout coordination
