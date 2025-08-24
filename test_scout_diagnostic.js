// Scout System Diagnostic Tool
// Run this in Screeps console to diagnose scout issues

console.log("=== SCOUT SYSTEM DIAGNOSTIC ===\n");

// Get the first owned room
const roomName = Object.keys(Game.rooms)[0];
const room = Game.rooms[roomName];

if (!room || !room.controller || !room.controller.my) {
    console.log("❌ ERROR: No owned room found");
} else {
    console.log(`🏠 Diagnosing scout system in room: ${roomName}\n`);
    
    // 1. Check if scouts exist
    console.log("1. SCOUT CREEP STATUS:");
    const scouts = Object.values(Game.creeps).filter(c => c.memory.role === 'scout');
    console.log(`   Active scouts: ${scouts.length}`);
    
    if (scouts.length === 0) {
        console.log("   ❌ NO SCOUTS FOUND");
        console.log("   🔧 Check SpawnManager - scouts should spawn at RCL 2+");
        
        // Check spawn conditions
        const rcl = room.controller.level;
        const harvesters = Object.values(Game.creeps).filter(c => c.memory.role === 'harvester').length;
        const sources = room.find(FIND_SOURCES).length;
        const upgraders = Object.values(Game.creeps).filter(c => c.memory.role === 'upgrader').length;
        
        console.log(`   Room RCL: ${rcl} (scouts spawn at RCL 2+)`);
        console.log(`   Harvesters: ${harvesters}/${sources} (need >= sources)`);
        console.log(`   Upgraders: ${upgraders} (need >= 1)`);
        
        if (rcl >= 2 && harvesters >= sources && upgraders >= 1) {
            console.log("   ✅ Conditions met for scout spawning");
        } else {
            console.log("   ⚠️  Conditions not met for scout spawning");
        }
    } else {
        // Analyze each scout
        scouts.forEach((scout, i) => {
            console.log(`\n   Scout ${i + 1}: ${scout.name}`);
            console.log(`   - Position: ${scout.pos.x},${scout.pos.y} in ${scout.room.name}`);
            console.log(`   - Phase: ${scout.memory.scoutingPhase || 'undefined'}`);
            console.log(`   - Target Room: ${scout.memory.targetRoom || 'none'}`);
            console.log(`   - Home Room: ${scout.memory.homeRoom || 'undefined'}`);
            console.log(`   - Last Explored: ${scout.memory.lastExplored || 'never'}`);
            
            // Check if scout is stuck
            if (scout.memory.scoutingPhase === 'moving' && scout.memory.targetRoom) {
                if (scout.room.name === scout.memory.targetRoom) {
                    console.log("   ⚠️  Scout is in target room but still in 'moving' phase");
                } else {
                    console.log(`   ➡️  Scout moving from ${scout.room.name} to ${scout.memory.targetRoom}`);
                }
            }
            
            if (scout.memory.scoutingPhase === 'exploring') {
                const centerPos = new RoomPosition(25, 25, scout.room.name);
                const distance = scout.pos.getRangeTo(centerPos);
                console.log(`   🔍 Scout exploring, distance to center: ${distance}`);
                
                if (scout.memory.lastExplored) {
                    const explorationTime = Game.time - scout.memory.lastExplored;
                    console.log(`   ⏱️  Exploration time: ${explorationTime} ticks`);
                }
            }
        });
    }
    
    // 2. Check room memory and scout data
    console.log("\n2. ROOM MEMORY ANALYSIS:");
    const adjacentRooms = Game.map.describeExits(roomName);
    
    if (adjacentRooms) {
        const roomNames = Object.values(adjacentRooms);
        console.log(`   Adjacent rooms: ${roomNames.join(', ')}`);
        
        roomNames.forEach(adjRoomName => {
            const roomMem = Memory.rooms[adjRoomName];
            console.log(`\n   Room ${adjRoomName}:`);
            
            if (!roomMem) {
                console.log("     - No memory exists ✅ (ready for scouting)");
            } else if (!roomMem.scoutData) {
                console.log("     - Memory exists but no scout data ✅ (ready for scouting)");
            } else {
                const scoutData = roomMem.scoutData;
                const age = Game.time - scoutData.lastScouted;
                console.log(`     - Last scouted: ${age} ticks ago`);
                console.log(`     - Exploration complete: ${scoutData.explorationComplete || false}`);
                console.log(`     - Room type: ${scoutData.roomType || 'unknown'}`);
                console.log(`     - Sources: ${scoutData.sources ? scoutData.sources.length : 0}`);
                console.log(`     - Remote score: ${scoutData.remoteScore || 0}`);
                console.log(`     - Inaccessible: ${scoutData.inaccessible || false}`);
                
                // Determine if room should be scouted
                if (scoutData.inaccessible) {
                    console.log("     - Status: ❌ Marked as inaccessible");
                } else if (!scoutData.explorationComplete) {
                    console.log("     - Status: 🔄 Incomplete exploration (should be selected)");
                } else if (age >= 1000) {
                    console.log("     - Status: 🔄 Stale data (should be re-scouted)");
                } else {
                    console.log("     - Status: ✅ Recently scouted and complete");
                }
            }
        });
    }
    
    // 3. Check spawn manager integration
    console.log("\n3. SPAWN MANAGER INTEGRATION:");
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn && spawn.spawning) {
        const spawningCreep = Game.creeps[spawn.spawning.name];
        if (spawningCreep && spawningCreep.memory.role === 'scout') {
            console.log("   🥚 Currently spawning a scout");
        }
    }
    
    // Check if scouts are in spawn queue (this would require checking SpawnManager logic)
    console.log("   📋 To check spawn queue, examine SpawnManager.calculateRequiredCreeps()");
    
    // 4. Check for common issues
    console.log("\n4. COMMON ISSUES CHECK:");
    
    // Issue 1: Scout stuck in exploration phase
    const stuckScouts = scouts.filter(s => 
        s.memory.scoutingPhase === 'exploring' && 
        s.memory.lastExplored && 
        (Game.time - s.memory.lastExplored) > 20
    );
    
    if (stuckScouts.length > 0) {
        console.log("   ⚠️  Found scouts stuck in exploration phase:");
        stuckScouts.forEach(scout => {
            const stuckTime = Game.time - scout.memory.lastExplored;
            console.log(`     - ${scout.name}: stuck for ${stuckTime} ticks`);
        });
    }
    
    // Issue 2: Scout cycling between rooms
    const cyclingScouts = scouts.filter(s => 
        s.memory.scoutingPhase === 'moving' && 
        !s.memory.targetRoom
    );
    
    if (cyclingScouts.length > 0) {
        console.log("   🔄 Found scouts without target rooms (potential cycling):");
        cyclingScouts.forEach(scout => {
            console.log(`     - ${scout.name}: no target room selected`);
        });
    }
    
    // Issue 3: Scout can't find rooms to scout
    if (scouts.length > 0) {
        const scoutWithoutTarget = scouts.find(s => 
            s.memory.scoutingPhase === 'returning' && 
            s.room.name === s.memory.homeRoom
        );
        
        if (scoutWithoutTarget) {
            console.log("   🏠 Scout returned home - checking room selection logic");
            
            // Simulate room selection
            const exits = Game.map.describeExits(roomName);
            if (exits) {
                const roomsToCheck = Object.values(exits);
                let foundTarget = false;
                
                for (const checkRoom of roomsToCheck) {
                    const roomMemory = Memory.rooms[checkRoom];
                    
                    if (!roomMemory || !roomMemory.scoutData) {
                        console.log(`     ✅ ${checkRoom} should be selected (no data)`);
                        foundTarget = true;
                        break;
                    }
                    
                    if (!roomMemory.scoutData.explorationComplete) {
                        console.log(`     ✅ ${checkRoom} should be selected (incomplete)`);
                        foundTarget = true;
                        break;
                    }
                    
                    const age = Game.time - roomMemory.scoutData.lastScouted;
                    if (age >= 1000) {
                        console.log(`     ✅ ${checkRoom} should be selected (stale: ${age} ticks)`);
                        foundTarget = true;
                        break;
                    }
                }
                
                if (!foundTarget) {
                    console.log("     ⚠️  No rooms available for scouting (all recently scouted)");
                }
            }
        }
    }
    
    // 5. Recommendations
    console.log("\n5. RECOMMENDATIONS:");
    
    if (scouts.length === 0) {
        console.log("   🔧 No scouts found - check SpawnManager spawning conditions");
    }
    
    if (stuckScouts.length > 0) {
        console.log("   🔧 Reset stuck scouts: delete creep.memory.lastExplored");
    }
    
    if (cyclingScouts.length > 0) {
        console.log("   🔧 Check room selection logic in findNextRoomToScout()");
    }
    
    // Check if all adjacent rooms are fully explored
    if (adjacentRooms) {
        const allExplored = Object.values(adjacentRooms).every(roomName => {
            const roomMem = Memory.rooms[roomName];
            return roomMem && roomMem.scoutData && roomMem.scoutData.explorationComplete;
        });
        
        if (allExplored) {
            console.log("   ✅ All adjacent rooms fully explored - scout system working correctly");
        }
    }
    
    console.log("\n=== DIAGNOSTIC COMPLETE ===");
}
