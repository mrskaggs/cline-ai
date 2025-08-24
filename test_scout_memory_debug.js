// Debug script to check scout memory and room selection
console.log('=== Scout Memory Debug ===');

// Check current room memory state
console.log('\n--- Current Room Memory ---');
for (const roomName in Memory.rooms) {
    const room = Memory.rooms[roomName];
    if (room.scoutData) {
        console.log(`${roomName}: lastScouted=${room.scoutData.lastScouted}, currentTick=${Game.time}, age=${Game.time - room.scoutData.lastScouted}`);
    } else {
        console.log(`${roomName}: NO scoutData`);
    }
}

// Check what rooms would be selected for scouting
console.log('\n--- Room Selection Logic ---');
const homeRoom = 'W35N32'; // Assuming this is your home room
const exits = {
    '1': 'W35N31',
    '3': 'W36N32', 
    '5': 'W35N33',
    '7': 'W34N32'
};

console.log(`Home room: ${homeRoom}`);
console.log('Adjacent rooms:');

for (const [direction, roomName] of Object.entries(exits)) {
    const roomMemory = Memory.rooms[roomName];
    
    if (!roomMemory) {
        console.log(`  ${roomName}: NO MEMORY - WOULD BE SELECTED`);
    } else if (!roomMemory.scoutData) {
        console.log(`  ${roomName}: NO scoutData - WOULD BE SELECTED`);
    } else {
        const age = Game.time - roomMemory.scoutData.lastScouted;
        const wouldSelect = age >= 1000;
        console.log(`  ${roomName}: lastScouted=${roomMemory.scoutData.lastScouted}, age=${age}, wouldSelect=${wouldSelect}`);
    }
}

// Check if W34N32 specifically has memory
console.log('\n--- W34N32 Specific Check ---');
if (Memory.rooms['W34N32']) {
    console.log('W34N32 memory exists:', JSON.stringify(Memory.rooms['W34N32'], null, 2));
} else {
    console.log('W34N32 has NO memory - this is why scout keeps selecting it!');
}

console.log('\n=== Debug Complete ===');
