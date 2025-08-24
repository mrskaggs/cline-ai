// Diagnostic script to compare planned vs actual extension positions
// Run this in Screeps console to see the mismatch

const roomName = 'W35N32';
const room = Game.rooms[roomName];

if (!room) {
    console.log(`Room ${roomName} not found or not visible`);
} else {
    console.log(`=== Diagnosing Extension Positions in ${roomName} ===`);
    
    // Get actual extensions in the room
    const actualExtensions = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_EXTENSION
    });
    
    console.log(`\nActual Extensions in Room (${actualExtensions.length}):`);
    actualExtensions.forEach((ext, i) => {
        console.log(`  ${i + 1}. Extension at ${ext.pos.x},${ext.pos.y}`);
    });
    
    // Get planned extensions from memory
    if (room.memory.plan && room.memory.plan.buildings) {
        const plannedExtensions = room.memory.plan.buildings.filter(b => 
            b.structureType === STRUCTURE_EXTENSION || b.structureType === 'extension'
        );
        
        console.log(`\nPlanned Extensions in Memory (${plannedExtensions.length}):`);
        plannedExtensions.forEach((ext, i) => {
            console.log(`  ${i + 1}. Extension planned at ${ext.pos.x},${ext.pos.y} (placed: ${ext.placed})`);
        });
        
        // Check for mismatches
        console.log(`\n=== Position Analysis ===`);
        let matchCount = 0;
        
        plannedExtensions.forEach((planned, i) => {
            const actualAtPos = actualExtensions.find(actual => 
                actual.pos.x === planned.pos.x && actual.pos.y === planned.pos.y
            );
            
            if (actualAtPos) {
                console.log(`✓ Planned extension ${i + 1} at ${planned.pos.x},${planned.pos.y} matches actual extension`);
                matchCount++;
            } else {
                console.log(`✗ Planned extension ${i + 1} at ${planned.pos.x},${planned.pos.y} has NO actual extension`);
                
                // Check what's actually at that position
                const pos = new RoomPosition(planned.pos.x, planned.pos.y, roomName);
                const structures = pos.lookFor(LOOK_STRUCTURES);
                const terrain = room.getTerrain().get(pos.x, pos.y);
                
                if (structures.length > 0) {
                    console.log(`    Position has: ${structures.map(s => s.structureType).join(', ')}`);
                } else if (terrain & TERRAIN_MASK_WALL) {
                    console.log(`    Position is a WALL - cannot build here!`);
                } else {
                    console.log(`    Position is empty and buildable`);
                }
            }
        });
        
        console.log(`\nMatch Summary: ${matchCount}/${plannedExtensions.length} planned extensions match actual positions`);
        
        // Show actual extensions that aren't in the plan
        console.log(`\n=== Unplanned Extensions ===`);
        actualExtensions.forEach((actual, i) => {
            const plannedAtPos = plannedExtensions.find(planned => 
                planned.pos.x === actual.pos.x && planned.pos.y === actual.pos.y
            );
            
            if (!plannedAtPos) {
                console.log(`! Actual extension ${i + 1} at ${actual.pos.x},${actual.pos.y} is NOT in the plan`);
            }
        });
        
    } else {
        console.log('\nNo plan found in room memory');
    }
    
    console.log(`\n=== Recommendation ===`);
    console.log('If positions don\'t match, you need to either:');
    console.log('1. Update the plan to match actual extension positions, OR');
    console.log('2. Clear the plan and let the system create a new one based on actual structures');
}
