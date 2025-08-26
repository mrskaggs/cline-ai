# Repair System Analysis - Things Disappearing Issue

## Current Repair Systems

### ✅ What We Have
1. **Builder Role Repair Logic** (`src/roles/Builder.ts`)
   - **Priority 2**: Damaged structures below 80% health (excludes walls/ramparts)
   - **Priority 3**: Roads and containers below 50% health
   - **Settings**: `repairThreshold: 0.8` and `roadRepairThreshold: 0.5`

2. **Repair Thresholds** (`src/config/settings.ts`)
   - General structures: 80% health threshold
   - Roads/containers: 50% health threshold

### ❌ What's Missing - Likely Causes of "Things Disappearing"

#### 1. **No Dedicated Repairer Role**
- **Problem**: Builders prioritize construction over repair
- **Impact**: Structures decay while builders focus on new construction sites
- **Solution**: Need dedicated Repairer role or better Builder priority

#### 2. **Insufficient Builder Population**
- **Problem**: Not enough builders to handle both construction AND repair
- **Current Logic**: Max 2-3 builders regardless of repair workload
- **Impact**: Repair backlog causes structure decay and disappearance

#### 3. **No Rampart/Wall Maintenance**
- **Problem**: Builder explicitly excludes walls and ramparts from repair
- **Impact**: Defensive structures decay to 0 and disappear
- **Critical**: Ramparts protect other structures from decay

#### 4. **No Emergency Repair System**
- **Problem**: No priority system for critically damaged structures
- **Impact**: Structures at <10% health may disappear before repair
- **Need**: Emergency repair when hits < hitsMax * 0.1

#### 5. **No Repair Monitoring**
- **Problem**: No visibility into what needs repair
- **Impact**: Can't identify repair bottlenecks or failures
- **Need**: Repair status logging and metrics

## Specific "Disappearing" Scenarios

### Scenario 1: Rampart Decay
- **Cause**: Ramparts not repaired (excluded from Builder logic)
- **Effect**: Ramparts decay to 0 hits and disappear
- **Impact**: Protected structures become vulnerable and decay faster

### Scenario 2: Road Network Decay
- **Cause**: Roads only repaired at 50% health, may decay faster than repair rate
- **Effect**: Roads disappear, causing pathfinding issues
- **Impact**: Creep efficiency drops, CPU usage increases

### Scenario 3: Container Decay
- **Cause**: Containers decay over time, only repaired at 50% health
- **Effect**: Energy storage disappears, disrupting logistics
- **Impact**: Energy collection becomes inefficient

### Scenario 4: Extension/Tower Decay
- **Cause**: Under attack or natural decay, insufficient repair priority
- **Effect**: Critical infrastructure disappears
- **Impact**: Energy capacity or defense capability lost

## Recommended Solutions

### 1. **Immediate Fix: Enhanced Builder Repair**
- Include ramparts in repair logic (critical for defense)
- Lower repair thresholds for critical structures
- Add emergency repair priority for structures < 10% health

### 2. **Medium Term: Dedicated Repairer Role**
- Create specialized Repairer role focused only on maintenance
- Spawn repairers when repair workload is high
- Better resource allocation between construction and repair

### 3. **Long Term: Intelligent Repair System**
- Repair priority based on structure importance
- Predictive repair before critical decay
- Repair efficiency monitoring and optimization

## Next Steps
1. Implement emergency repair fixes in Builder role
2. Add rampart repair capability
3. Create repair monitoring and logging
4. Test with structures at various decay levels
