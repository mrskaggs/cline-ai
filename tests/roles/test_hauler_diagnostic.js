/**
 * Hauler Diagnostic Test
 * Analyzes why haulers are sitting idle at room center
 */

// Change this to your actual room name
const roomName = 'W35N32'; // CHANGE THIS TO YOUR ROOM

console.log('=== HAULER DIAGNOSTIC TEST ===');

const room = Game.rooms[roomName];
if (!room) {
    console.log(`❌ Room ${roomName} not found or not visible`);
    return;
}

console.log(`🏠 Room: ${roomName} (RCL ${room.controller ? room.controller.level : 'Unknown'})`);

// 1. Check if haulers exist
const haulers = Object.values(Game.creeps).filter(creep => 
    creep.memory.homeRoom === roomName && creep.memory.role === 'hauler'
);

console.log(`👷 Haulers found: ${haulers.length}`);

if (haulers.length === 0) {
    console.log('❌ NO HAULERS FOUND - This is the problem!');
    
    // Check if containers exist (requirement for hauler spawning)
    const containers = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
    });
    
    console.log(`📦 Containers in room: ${containers.length}`);
    
    if (containers.length === 0) {
        console.log('❌ NO CONTAINERS - Haulers only spawn when containers exist');
        console.log('💡 Solution: Build containers near sources first');
    } else {
        console.log('✅ Containers exist, haulers should spawn');
        console.log('💡 Check SpawnManager logic or energy availability');
    }
    
    return;
}

// 2. Analyze each hauler
haulers.forEach((hauler, index) => {
    console.log(`\n--- Hauler ${index + 1}: ${hauler.name} ---`);
    console.log(`📍 Position: ${hauler.pos.x},${hauler.pos.y}`);
    console.log(`⚡ Energy: ${hauler.store.energy}/${hauler.store.getCapacity()}`);
    console.log(`🔄 State: ${hauler.memory.hauling ? 'Delivering' : 'Collecting'}`);
    console.log(`💬 Say: "${hauler.saying}"`);
    
    // Check what they should be doing
    if (hauler.memory.hauling) {
        console.log('🚚 Should be DELIVERING energy');
        
        // Check delivery targets
        const spawn = hauler.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter: (spawn) => spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_EXTENSION &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_TOWER &&
                       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        
        console.log(`  🏭 Spawn needs energy: ${spawn ? 'YES' : 'NO'}`);
        console.log(`  🔌 Extensions needing energy: ${extensions.length}`);
        console.log(`  🗼 Towers needing energy: ${towers.length}`);
        
        if (!spawn && extensions.length === 0 && towers.length === 0) {
            console.log('  ❌ NO DELIVERY TARGETS - This could be why they\'re idle');
        }
        
    } else {
        console.log('🔄 Should be COLLECTING energy');
        
        // Check collection sources
        const containers = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_CONTAINER &&
                       structure.store[RESOURCE_ENERGY] > 0;
            }
        });
        
        const droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
            filter: (resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 50
        });
        
        console.log(`  📦 Containers with energy: ${containers.length}`);
        console.log(`  💎 Dropped energy piles: ${droppedEnergy.length}`);
        
        if (containers.length === 0 && droppedEnergy.length === 0) {
            console.log('  ❌ NO ENERGY SOURCES - This could be why they\'re idle');
        }
        
        // Test StorageManager integration
        try {
            const StorageManager = require('StorageManager');
            const optimalSources = StorageManager.getOptimalEnergySources(room);
            console.log(`  🎯 StorageManager optimal sources: ${optimalSources.length}`);
        } catch (error) {
            console.log(`  ❌ StorageManager error: ${error}`);
        }
    }
});

// 3. Check room energy situation
console.log('\n=== ROOM ENERGY ANALYSIS ===');
console.log(`⚡ Room energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`);

const sources = room.find(FIND_SOURCES);
console.log(`🌟 Sources: ${sources.length}`);

sources.forEach((source, index) => {
    console.log(`  Source ${index + 1}: ${source.energy}/${source.energyCapacity} energy`);
    
    // Check for containers near sources
    const nearbyContainers = source.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
    });
    
    console.log(`    📦 Nearby containers: ${nearbyContainers.length}`);
    nearbyContainers.forEach(container => {
        console.log(`      Container: ${container.store.energy}/${container.store.getCapacity()} energy`);
    });
    
    // Check for dropped energy near sources
    const nearbyDropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 2, {
        filter: (resource) => resource.resourceType === RESOURCE_ENERGY
    });
    
    console.log(`    💎 Nearby dropped energy: ${nearbyDropped.length}`);
    nearbyDropped.forEach(resource => {
        console.log(`      Dropped: ${resource.amount} energy`);
    });
});

// 4. Check harvesters (they should be filling containers)
const harvesters = Object.values(Game.creeps).filter(creep => 
    creep.memory.homeRoom === roomName && creep.memory.role === 'harvester'
);

console.log(`\n=== HARVESTER ANALYSIS ===`);
console.log(`👷 Harvesters: ${harvesters.length}`);

harvesters.forEach((harvester, index) => {
    console.log(`  Harvester ${index + 1}: ${harvester.name}`);
    console.log(`    📍 Position: ${harvester.pos.x},${harvester.pos.y}`);
    console.log(`    ⚡ Energy: ${harvester.store.energy}/${harvester.store.getCapacity()}`);
    console.log(`    💬 Say: "${harvester.saying}"`);
});

console.log('\n=== DIAGNOSTIC COMPLETE ===');
console.log('💡 Common issues:');
console.log('  1. No containers built yet (haulers won\'t spawn)');
console.log('  2. No energy in containers (harvesters not working)');
console.log('  3. All delivery targets full (nowhere to deliver)');
console.log('  4. StorageManager integration issues');
console.log('  5. Haulers not spawning due to energy/RCL requirements');
