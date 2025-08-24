// Command to force a replan by clearing room memory
// Copy and paste this into your Screeps console to force a replan

// Replace 'W35N32' with your actual room name if different
const roomName = 'W35N32';

if (Memory.rooms[roomName] && Memory.rooms[roomName].plan) {
    console.log(`Before: Room ${roomName} has ${Memory.rooms[roomName].plan.buildings.length} buildings planned`);
    
    // Clear the plan to force a complete replan
    delete Memory.rooms[roomName].plan;
    
    // Also clear layout analysis to force fresh analysis
    if (Memory.rooms[roomName].layoutAnalysis) {
        delete Memory.rooms[roomName].layoutAnalysis;
    }
    
    console.log(`Cleared plan for room ${roomName} - will replan on next planning cycle`);
    console.log('Planning runs every 50 ticks, so wait a moment and check the logs');
} else {
    console.log(`No plan found for room ${roomName}`);
}
