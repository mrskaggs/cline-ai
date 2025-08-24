// Fix to mark existing structures as placed in the room plan
// This should be run in Screeps console after the force replan command

// Replace 'W35N32' with your actual room name if different
const roomName = 'W35N32';
const room = Game.rooms[roomName];

if (!room) {
    console.log(`Room ${roomName} not found or not visible`);
} else if (!room.memory.plan) {
    console.log(`No plan found for room ${roomName}`);
} else {
    console.log(`Checking existing structures in room ${roomName}...`);
    
    let updatedCount = 0;
    
    // Get all existing structures in the room
    const existingStructures = room.find(FIND_MY_STRUCTURES);
    console.log(`Found ${existingStructures.length} existing structures`);
    
    // Update the plan to mark existing structures as placed
    room.memory.plan.buildings.forEach(building => {
        if (!building.placed) {
            // Check if this building already exists at the planned position
            const pos = new RoomPosition(building.pos.x, building.pos.y, building.pos.roomName);
            const structuresAtPos = pos.lookFor(LOOK_STRUCTURES);
            const hasMatchingStructure = structuresAtPos.some(s => s.structureType === building.structureType);
            
            if (hasMatchingStructure) {
                console.log(`Marking ${building.structureType} at ${building.pos.x},${building.pos.y} as placed`);
                building.placed = true;
                updatedCount++;
            }
        }
    });
    
    console.log(`Updated ${updatedCount} buildings to mark them as placed`);
    console.log(`Plan now has ${room.memory.plan.buildings.filter(b => !b.placed).length} unplaced buildings`);
    
    if (updatedCount > 0) {
        room.memory.plan.lastUpdated = Game.time;
        console.log('Plan updated successfully!');
    }
}
