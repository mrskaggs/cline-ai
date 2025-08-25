// Test Scout Room Bouncing Fix
// This test validates that the scout waits for stable room transition before exploring

console.log('=== Scout Room Bouncing Fix Test ===');

// Mock Game environment
global.Game = {
    time: 1000,
    creeps: {},
    rooms: {},
    map: {
        describeExits: (roomName) => {
            if (roomName === 'W35N32') {
                return {
                    1: 'W35N31', // TOP
                    3: 'W35N33', // BOTTOM
                    5: 'W36N32', // RIGHT
                    7: 'W34N32'  // LEFT
                };
            }
            return null;
        }
    }
};

global.Memory = {
    rooms: {
        'W35N32': {
            sources: {},
            spawnIds: [],
            lastUpdated: 1000,
            rcl: 2
        },
        'W36N32': {
            sources: {},
            spawnIds: [],
            lastUpdated: 950,
            rcl: 0,
            scoutData: {
                lastScouted: 500,
                roomType: 'normal',
                hostileCount: 0,
                hasHostileStructures: false,
                structureCount: 0,
                hasSpawn: false,
                hasTower: false,
                remoteScore: 60,
                explorationComplete: false // Not complete, should be selected
            }
        }
    },
    creeps: {}
};

// Mock constants
global.FIND_SOURCES = 'sources';
global.FIND_MINERALS = 'minerals';
global.FIND_HOSTILE_CREEPS = 'hostile_creeps';
global.FIND_HOSTILE_STRUCTURES = 'hostile_structures';
global.FIND_STRUCTURES = 'structures';
global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_TOWER = 'tower';
global.ERR_NO_PATH = -2;
global.ERR_INVALID_ARGS = -10;
global.OK = 0;

// Mock Logger
const Logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.log(`[WARN] ${msg}`),
    error: (msg) => console.log(`[ERROR] ${msg}`)
};

// Mock Scout class with the fix
class Scout {
    static run(creep) {
        try {
            const memory = creep.memory;
            
            // Initialize scout memory if needed
            if (!memory.scoutingPhase) {
                memory.scoutingPhase = 'moving';
                memory.homeRoom = creep.room.name;
                console.log(`Scout ${creep.name}: Initialized - Home: ${memory.homeRoom}, Phase: ${memory.scoutingPhase}`);
            }

            switch (memory.scoutingPhase) {
                case 'moving':
                    this.moveToTarget(creep);
                    break;
                case 'exploring':
                    this.exploreRoom(creep);
                    break;
                case 'returning':
                    this.returnHome(creep);
                    break;
            }
        } catch (error) {
            console.log(`Scout ${creep.name}: ERROR in run - ${error}`);
        }
    }

    static moveToTarget(creep) {
        const memory = creep.memory;
        
        if (!memory.targetRoom) {
            // Find next room to scout
            const nextRoom = this.findNextRoomToScout(creep);
            if (!nextRoom) {
                console.log(`Scout ${creep.name}: No rooms available to scout, returning home`);
                memory.scoutingPhase = 'returning';
                return;
            }
            memory.targetRoom = nextRoom;
            console.log(`Scout ${creep.name}: Selected target room: ${nextRoom}`);
        }

        // Move to target room
        if (creep.room.name !== memory.targetRoom) {
            console.log(`Scout ${creep.name}: Moving from ${creep.room.name} to ${memory.targetRoom}`);
            // Simulate movement - for test, we'll manually change room
            return;
        } else {
            // Room name matches target - add delay before switching to exploration
            console.log(`Scout ${creep.name}: Arrived at target room ${memory.targetRoom}, waiting to ensure stable position`);
            
            // Add a small delay to ensure the creep is fully in the room
            if (!memory.arrivalTick) {
                memory.arrivalTick = Game.time;
                console.log(`Scout ${creep.name}: Recording arrival at tick ${Game.time}`);
                return;
            }
            
            // Wait at least 2 ticks to ensure stable room transition
            const ticksInRoom = Game.time - memory.arrivalTick;
            if (ticksInRoom < 2) {
                console.log(`Scout ${creep.name}: Waiting for stable position (${ticksInRoom}/2 ticks)`);
                return;
            }
            
            // Final verification before switching to exploration
            if (creep.room.name === memory.targetRoom) {
                console.log(`Scout ${creep.name}: Confirmed stable arrival at ${memory.targetRoom} after ${ticksInRoom} ticks, switching to exploration`);
                memory.scoutingPhase = 'exploring';
                delete memory.lastExplored; // Reset exploration timer for new room
                delete memory.arrivalTick; // Clean up arrival tracking
            } else {
                console.log(`Scout ${creep.name}: Room mismatch after ${ticksInRoom} ticks - Current: ${creep.room.name}, Target: ${memory.targetRoom}`);
                console.log(`Scout ${creep.name}: Resetting arrival tracking and continuing movement`);
                delete memory.arrivalTick;
                return;
            }
        }
    }

    static exploreRoom(creep) {
        const memory = creep.memory;
        const room = creep.room;

        // CRITICAL: Verify we're in the target room before exploring
        if (memory.targetRoom && room.name !== memory.targetRoom) {
            console.log(`Scout ${creep.name}: ERROR - In exploration phase but in wrong room! Current: ${room.name}, Target: ${memory.targetRoom}`);
            console.log(`Scout ${creep.name}: Switching back to moving phase to reach target room`);
            memory.scoutingPhase = 'moving';
            delete memory.lastExplored; // Reset exploration timer
            return;
        }

        console.log(`Scout ${creep.name}: Exploring room ${room.name}`);
        // Simulate exploration completion
        memory.scoutingPhase = 'returning';
    }

    static returnHome(creep) {
        const memory = creep.memory;
        console.log(`Scout ${creep.name}: Returning home to ${memory.homeRoom}`);
        // Simulate return
        delete memory.targetRoom;
        memory.scoutingPhase = 'moving';
    }

    static findNextRoomToScout(creep) {
        const homeRoom = creep.room;
        const exits = Game.map.describeExits(homeRoom.name);
        
        if (!exits) return undefined;

        const roomsToCheck = Object.values(exits);
        
        for (const roomName of roomsToCheck) {
            const roomMemory = Memory.rooms[roomName];
            
            if (!roomMemory) {
                console.log(`Scout ${creep.name}: Selected ${roomName} - no memory exists`);
                return roomName;
            }
            
            if (!roomMemory.scoutData) {
                console.log(`Scout ${creep.name}: Selected ${roomName} - no scout data exists`);
                return roomName;
            }
            
            // Check if exploration is actually complete
            if (!roomMemory.scoutData.explorationComplete) {
                console.log(`Scout ${creep.name}: Selected ${roomName} - exploration not complete`);
                return roomName;
            }
        }

        return undefined;
    }
}

// Test Scenario: Scout room bouncing fix
console.log('\n--- Test 1: Scout Arrival Timing Fix ---');

// Create mock creep in home room with pre-set target
const mockCreep = {
    name: 'scout_test',
    room: { name: 'W35N32' },
    memory: {
        role: 'scout',
        scoutingPhase: 'moving',
        homeRoom: 'W35N32',
        targetRoom: 'W36N32'  // Pre-set target to test the timing fix
    },
    pos: { getRangeTo: () => 5 },
    moveTo: () => console.log('Moving...')
};

// Tick 1: Scout is moving to target room (still in home room)
console.log('\nTick 1000: Scout moving to target room');
Game.time = 1000;
Scout.run(mockCreep);

// Tick 2: Scout "arrives" at target room (simulate room change)
console.log('\nTick 1001: Scout arrives at target room');
Game.time = 1001;
mockCreep.room.name = 'W36N32'; // Simulate room transition
Scout.run(mockCreep);

// Tick 3: Scout still waiting for stable position
console.log('\nTick 1002: Scout waiting for stable position');
Game.time = 1002;
Scout.run(mockCreep);

// Tick 4: Scout confirms stable arrival and switches to exploration
console.log('\nTick 1003: Scout confirms stable arrival');
Game.time = 1003;
Scout.run(mockCreep);

// Verify the fix worked
console.log('\n--- Test Results ---');
console.log(`Final phase: ${mockCreep.memory.scoutingPhase}`);
console.log(`Target room: ${mockCreep.memory.targetRoom}`);
console.log(`Arrival tick tracking: ${mockCreep.memory.arrivalTick ? 'Present' : 'Cleaned up'}`);

if (mockCreep.memory.scoutingPhase === 'exploring' && !mockCreep.memory.arrivalTick) {
    console.log('✅ TEST PASSED: Scout waits for stable room transition before exploring');
} else {
    console.log('❌ TEST FAILED: Scout timing fix not working correctly');
}

// Test Scenario: Room mismatch detection
console.log('\n--- Test 2: Room Mismatch Detection ---');

// Reset for second test
const mockCreep2 = {
    name: 'scout_test2',
    room: { name: 'W35N32' },
    memory: {
        role: 'scout',
        scoutingPhase: 'exploring',
        targetRoom: 'W36N32'
    }
};

console.log('\nScout in exploration phase but wrong room:');
Scout.run(mockCreep2);

if (mockCreep2.memory.scoutingPhase === 'moving') {
    console.log('✅ TEST PASSED: Scout correctly detects room mismatch and switches back to moving');
} else {
    console.log('❌ TEST FAILED: Scout room mismatch detection not working');
}

console.log('\n=== Scout Room Bouncing Fix Test Complete ===');
