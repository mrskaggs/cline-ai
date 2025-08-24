// Fix to align the room plan with actual extension positions
// This will update the plan to match where extensions are actually built

const roomName = 'W35N32';
const room = Game.rooms[roomName];

if (!room) {
    console.log(`Room ${roomName} not found or not visible`);
} else if (!room.memory.plan) {
    console.log(`No plan found for room ${roomName}`);
} else {
    console.log(`=== Fixing Plan to Match Reality for ${roomName} ===`);
    
    // Get actual extensions in the room
    const actualExtensions = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_EXTENSION
    });
    
    console.log(`Found ${actualExtensions.length} actual extensions in room`);
    
    // Get current planned extensions
    const plannedExtensions = room.memory.plan.buildings.filter(b => 
        b.structureType === STRUCTURE_EXTENSION || b.structureType === 'extension'
    );
    
    console.log(`Found ${plannedExtensions.length} planned extensions in memory`);
    
    // Remove all planned extensions from the plan
    room.memory.plan.buildings = room.memory.plan.buildings.filter(b => 
        b.structureType !== STRUCTURE_EXTENSION && b.structureType !== 'extension'
    );
    
    console.log(`Removed all planned extensions from plan`);
    
    // Add actual extensions to the plan as placed structures
    let addedCount = 0;
    actualExtensions.forEach((ext, index) => {
        const newPlannedBuilding = {
            structureType: STRUCTURE_EXTENSION,
            pos: {
                x: ext.pos.x,
                y: ext.pos.y,
                roomName: ext.pos.roomName
            },
            priority: 70, // Standard extension priority
            rclRequired: 2,
            placed: true, // Mark as already placed since it exists
            reason: `Existing extension discovered at ${ext.pos.x},${ext.pos.y}`
        };
        
        room.memory.plan.buildings.push(newPlannedBuilding);
        addedCount++;
        console.log(`Added existing extension at ${ext.pos.x},${ext.pos.y} to plan`);
    });
    
    // Update plan metadata
    room.memory.plan.lastUpdated = Game.time;
    room.memory.plan.status = 'building'; // Set appropriate status
    
    console.log(`\n=== Summary ===`);
    console.log(`- Removed ${plannedExtensions.length} old planned extensions`);
    console.log(`- Added ${addedCount} actual extensions to plan`);
    console.log(`- Plan now has ${room.memory.plan.buildings.length} total buildings`);
    console.log(`- Plan updated at tick ${Game.time}`);
    
    // Verify the fix
    const newPlannedExtensions = room.memory.plan.buildings.filter(b => 
        b.structureType === STRUCTURE_EXTENSION || b.structureType === 'extension'
    );
    
    const unplacedExtensions = newPlannedExtensions.filter(b => !b.placed);
    
    console.log(`\n=== Verification ===`);
    console.log(`- Plan now has ${newPlannedExtensions.length} extension entries`);
    console.log(`- ${newPlannedExtensions.filter(b => b.placed).length} marked as placed`);
    console.log(`- ${unplacedExtensions.length} marked as unplaced`);
    
    if (unplacedExtensions.length === 0) {
        console.log(`✓ SUCCESS: All extensions in plan are marked as placed!`);
        console.log(`The system should no longer try to place extension construction sites.`);
    } else {
        console.log(`⚠ WARNING: Some extensions still marked as unplaced`);
    }
}
