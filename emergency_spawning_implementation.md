# Emergency-Only Spawning System Implementation

## Overview

Implemented a comprehensive emergency-only spawning system that prevents the unnecessary spawning of cheap creeps (≤250 energy) unless there's a true emergency. This addresses the user's concern that "building a lesser creep just because we don't want to wait for extensions to fill up doesn't make much sense" since "creeps live for a long time."

## Problem Solved

**Before**: The system would spawn cheap 200-250 energy creeps whenever energy was low, even when existing creeps were healthy and could continue working while extensions filled up.

**After**: Cheap creeps only spawn in genuine emergencies where the base's functionality would be compromised without immediate action.

## Implementation Details

### Emergency Detection Logic

The system defines specific emergency conditions for each role:

#### Harvesters
- **Emergency**: No healthy harvesters (>50 ticks to live) remaining
- **Logic**: If all harvesters are dying soon, spawn cheap harvester to prevent economy collapse
- **Non-Emergency**: Healthy harvesters exist - wait for extensions to fill for better creeps

#### Upgraders  
- **Emergency**: No upgraders AND controller <5000 ticks to downgrade
- **Logic**: Controller downgrade risk requires immediate upgrader spawning
- **Non-Emergency**: Controller safe or upgraders exist - wait for better creeps

#### Builders
- **Emergency**: No builders AND critical structures <10% health
- **Logic**: Spawn/Extension/Tower at critical health needs immediate repair
- **Non-Emergency**: No critical repairs needed - wait for better creeps

#### Haulers
- **Emergency**: No haulers AND containers full AND spawn/extensions empty
- **Logic**: Energy logistics breakdown requires immediate hauler
- **Non-Emergency**: Energy flow working - wait for better creeps

#### Scouts
- **Emergency**: NEVER (luxury units)
- **Logic**: Scouts are intelligence gathering units, never critical for base survival
- **Result**: Cheap scouts never spawn regardless of situation

### Emergency Threshold

- **Emergency Bodies**: ≤250 energy cost
- **Normal Bodies**: >250 energy cost
- **Examples**:
  - `[WORK, CARRY, MOVE]` = 200 energy (Emergency Only)
  - `[WORK, CARRY, MOVE, MOVE]` = 250 energy (Emergency Only)  
  - `[WORK, WORK, CARRY, MOVE]` = 300 energy (Normal spawning logic)

### Waiting Logic

```typescript
if (isEmergencyBody && !isEmergency) {
  Logger.debug(`Refusing to spawn cheap ${role} (${cost} energy) - not an emergency. Waiting for extensions to fill.`);
  return true; // Wait for better creep
}
```

## Benefits

### 1. **Longer-Lived Creeps**
- Creeps spawned with full energy capacity live much longer
- Better energy efficiency over creep lifetime
- Reduced spawning frequency and CPU overhead

### 2. **Better Resource Utilization**
- Extensions fill up and get used for optimal creep bodies
- No energy waste on suboptimal creeps
- Perfect energy utilization at each RCL level

### 3. **Improved Performance**
- Stronger creeps work more efficiently
- Fewer total creeps needed for same productivity
- Better scaling to higher RCL levels

### 4. **Smart Emergency Response**
- System still responds to genuine crises immediately
- Prevents base collapse in critical situations
- Maintains reliability while optimizing efficiency

## Emergency Scenarios Handled

### Scenario 1: Harvester Death Spiral
- **Situation**: All harvesters dying, energy production stopping
- **Response**: Spawn cheap harvester immediately to maintain economy
- **Result**: Base survives crisis, better harvesters spawn once energy recovers

### Scenario 2: Controller Downgrade Risk
- **Situation**: No upgraders, controller <5000 ticks to downgrade
- **Response**: Spawn cheap upgrader to prevent RCL loss
- **Result**: Controller maintained, better upgraders spawn later

### Scenario 3: Critical Structure Damage
- **Situation**: Spawn at 5% health, no builders available
- **Response**: Spawn cheap builder for emergency repairs
- **Result**: Critical infrastructure saved, normal building continues

### Scenario 4: Energy Logistics Breakdown
- **Situation**: Containers full, spawn empty, no haulers
- **Response**: Spawn cheap hauler to restore energy flow
- **Result**: Energy distribution restored, better haulers spawn later

## Non-Emergency Examples

### Example 1: Normal Energy Shortage
- **Situation**: 200/550 energy, healthy harvesters working
- **Old Behavior**: Spawn cheap 200-energy harvester
- **New Behavior**: Wait for extensions to fill, spawn 550-energy harvester
- **Result**: Much stronger, longer-lived creep

### Example 2: Scout Spawning
- **Situation**: 200/550 energy, no scouts
- **Old Behavior**: Might spawn cheap scout
- **New Behavior**: Never spawn cheap scout (luxury unit)
- **Result**: Only spawn scouts with proper energy investment

## Testing Results

✅ **All 6 test scenarios passed**:
1. Non-emergency scenario correctly waits for better creeps
2. Emergency scenario correctly spawns cheap creeps immediately  
3. Controller emergency correctly triggers cheap upgrader
4. Critical repair emergency correctly triggers cheap builder
5. Scout luxury unit correctly never triggers emergency spawning
6. High energy scenario correctly uses normal spawning logic

## Configuration

The emergency system is controlled by these key parameters:

```typescript
// Emergency body threshold
const isEmergencyBody = currentBodyCost <= 250;

// Emergency detection thresholds
const HEALTHY_CREEP_THRESHOLD = 50; // ticks to live
const CONTROLLER_EMERGENCY_THRESHOLD = 5000; // ticks to downgrade
const CRITICAL_HEALTH_THRESHOLD = 0.1; // 10% health
```

## Expected User Experience

### Before Implementation
- Frequent spawning of weak 200-energy creeps
- Extensions often unused while cheap creeps spawned
- Shorter creep lifespans requiring frequent replacement
- Suboptimal energy efficiency

### After Implementation  
- Cheap creeps only in genuine emergencies
- Extensions fill up and create powerful creeps
- Longer creep lifespans with better efficiency
- Optimal energy utilization at all RCL levels
- Clear debug messages explaining spawning decisions

## Conclusion

The emergency-only spawning system successfully addresses the user's concern by ensuring cheap creeps are only spawned when absolutely necessary for base survival. This results in more efficient resource utilization, longer-lived creeps, and better overall performance while maintaining the system's ability to respond to genuine crises.

**Key Achievement**: Transformed wasteful "impatient" spawning into intelligent emergency-only spawning, maximizing the value of every energy point invested in creeps.
