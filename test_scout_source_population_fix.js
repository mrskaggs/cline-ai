// Test to diagnose and fix Scout source population issue
// The sources object is empty despite scoutData having source information

console.log('=== Scout Source Population Diagnostic ===');

// Simulate the current Scout logic
function simulateCurrentScoutLogic() {
    console.log('\n1. Testing Current Scout Logic:');
    
    // Mock room memory structure
    const roomMemory = {
        sources: {},
        spawnIds: [],
        lastUpdated: 72560843,
        rcl: 0,
        scoutData: {
            lastScouted: 72560843,
            roomType: 'normal',
            hostileCount: 0,
            hasHostileStructures: false,
            structureCount: 0,
            hasSpawn: false,
            hasTower: false,
            remoteScore: 60,
            sources: [
                {
                    id: 'source1',
                    pos: { x: 10, y: 20, roomName: 'W34N32' },
                    energyCapacity: 3000
                },
                {
                    id: 'source2', 
                    pos: { x: 40, y: 30, roomName: 'W34N32' },
                    energyCapacity: 3000
                }
            ]
        }
    };

    // Current Scout logic (BROKEN)
    console.log('Current logic - sources before:', JSON.stringify(roomMemory.sources));
    
    // This is what the current Scout code does (creates empty objects)
    const sources = roomMemory.scoutData.sources;
    for (const source of sources) {
        if (!roomMemory.sources[source.id]) {
            roomMemory.sources[source.id] = {}; // ← PROBLEM: Empty object!
        }
    }
    
    console.log('Current logic - sources after:', JSON.stringify(roomMemory.sources));
    console.log('PROBLEM: Sources object has empty values, not source data!');
    
    return roomMemory;
}

// Fixed Scout logic
function simulateFixedScoutLogic() {
    console.log('\n2. Testing Fixed Scout Logic:');
    
    // Reset room memory
    const roomMemory = {
        sources: {},
        spawnIds: [],
        lastUpdated: 72560843,
        rcl: 0,
        scoutData: {
            lastScouted: 72560843,
            roomType: 'normal',
            hostileCount: 0,
            hasHostileStructures: false,
            structureCount: 0,
            hasSpawn: false,
            hasTower: false,
            remoteScore: 60,
            sources: [
                {
                    id: 'source1',
                    pos: { x: 10, y: 20, roomName: 'W34N32' },
                    energyCapacity: 3000
                },
                {
                    id: 'source2', 
                    pos: { x: 40, y: 30, roomName: 'W34N32' },
                    energyCapacity: 3000
                }
            ]
        }
    };

    console.log('Fixed logic - sources before:', JSON.stringify(roomMemory.sources));
    
    // FIXED: Populate sources object with actual data
    const sources = roomMemory.scoutData.sources;
    for (const source of sources) {
        roomMemory.sources[source.id] = {
            pos: source.pos,
            energyCapacity: source.energyCapacity,
            // Add other properties that other systems might expect
            lastUpdated: 72560843
        };
    }
    
    console.log('Fixed logic - sources after:', JSON.stringify(roomMemory.sources, null, 2));
    console.log('SUCCESS: Sources object now has proper source data!');
    
    return roomMemory;
}

// Test both approaches
try {
    const brokenResult = simulateCurrentScoutLogic();
    const fixedResult = simulateFixedScoutLogic();
    
    console.log('\n=== COMPARISON ===');
    console.log('Broken - sources count:', Object.keys(brokenResult.sources).length);
    console.log('Broken - sources have data:', Object.values(brokenResult.sources).some(s => s.pos));
    
    console.log('Fixed - sources count:', Object.keys(fixedResult.sources).length);
    console.log('Fixed - sources have data:', Object.values(fixedResult.sources).some(s => s.pos));
    
    console.log('\n=== CONCLUSION ===');
    console.log('The issue is in Scout.ts line ~174-178:');
    console.log('Current: roomMemory.sources[source.id] = {}; // Empty object');
    console.log('Fixed: roomMemory.sources[source.id] = { pos: source.pos, energyCapacity: source.energyCapacity };');
    
} catch (error) {
    console.error('Test failed:', error);
}
