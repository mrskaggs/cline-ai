// Test to validate that the shouldWaitForBetterCreep fix allows scouts to spawn
// This addresses the specific issue where scouts were blocked by the emergency-only logic

// Mock Screeps constants
global.WORK = 'work';
global.CARRY = 'carry';
global.MOVE = 'move';
global.ATTACK = 'attack';
global.RANGED_ATTACK = 'ranged_attack';
global.HEAL = 'heal';
global.CLAIM = 'claim';
global.TOUGH = 'tough';

global.FIND_SOURCES = 105;
global.FIND_CONSTRUCTION_SITES = 107;
global.FIND_STRUCTURES = 106;
global.FIND_MY_CREEPS = 'find_my_creeps';

global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_TOWER = 'tower';
global.STRUCTURE_CONTAINER = 'container';
global.STRUCTURE_WALL = 'constructedWall';
global.STRUCTURE_RAMPART = 'rampart';
global.STRUCTURE_STORAGE = 'storage';

global.RESOURCE_ENERGY = 'energy';

global.OK = 0;
global.ERR_NOT_ENOUGH_ENERGY = -6;

// Mock the Screeps API
global.Game = {
  rooms: {},
  creeps: {},
  time: 1000
};

global.Memory = {
  rooms: {},
  creeps: {},
  spawn: {}
};

// Import the SpawnManager from built dist
const { SpawnManager } = require('../../dist/main.js');

console.log('=== Scout shouldWaitForBetterCreep Fix Validation ===');

// Test Case 1: Scout with 100 energy body should spawn (not wait for better)
console.log('\n--- Test Case 1: Scout Body Cost vs shouldWaitForBetterCreep ---');

// Setup room with basic economy and low energy (100 energy available)
const mockRoom = {
  name: 'W1N1',
  controller: { level: 2 },
  energyAvailable: 100,        // Low energy - scout body costs exactly 100
  energyCapacityAvailable: 300, // Higher capacity available
  find: function(type) {
    if (type === FIND_SOURCES) {
      return [{ id: 'source1' }, { id: 'source2' }];
    }
    if (type === FIND_CONSTRUCTION_SITES) {
      return [];
    }
    if (type === FIND_STRUCTURES) {
      return [];
    }
    return [];
  }
};

// Set up Game.creeps with proper memory structure
Game.creeps = {
  'harvester_1': {
    memory: { homeRoom: 'W1N1', role: 'harvester' },
    ticksToLive: 150
  },
  'upgrader_1': {
    memory: { homeRoom: 'W1N1', role: 'upgrader' },
    ticksToLive: 150
  }
  // No scouts exist yet
};

Game.rooms['W1N1'] = mockRoom;

// Initialize SpawnManager
const spawnManager = new SpawnManager();

console.log('Room setup:');
console.log('- Energy: 100/300 (low energy scenario)');
console.log('- Harvesters: 1, Upgraders: 1, Scouts: 0');
console.log('- Scout body cost: 100 energy (2 MOVE parts)');

// Get required creeps
const requiredCreeps = spawnManager.calculateRequiredCreeps(mockRoom);
console.log('Required creeps:', requiredCreeps);

// Test the actual spawning logic (getNextCreepToSpawn)
const creepToSpawn = spawnManager.getNextCreepToSpawn(mockRoom, requiredCreeps);
console.log('Next creep to spawn:', creepToSpawn);

if (creepToSpawn && creepToSpawn.role === 'scout') {
  console.log('✅ SUCCESS: Scout will spawn with 100 energy');
  console.log('   - shouldWaitForBetterCreep fix is working');
  console.log('   - Scout body:', creepToSpawn.body);
  console.log('   - Body cost: 100 energy (2 MOVE parts)');
} else if (requiredCreeps.scout === 1) {
  console.log('❌ FAILED: Scout is required but shouldWaitForBetterCreep is blocking it');
  console.log('   - This indicates the fix did not work');
  console.log('   - Scout should spawn with 100 energy but is being blocked');
} else {
  console.log('❌ FAILED: Scout not even required (different issue)');
}

// Test Case 2: Verify other roles still respect the emergency logic
console.log('\n--- Test Case 2: Other Roles Still Respect Emergency Logic ---');

// Test harvester with low energy (should wait for better if not emergency)
Game.creeps = {
  'harvester_1': {
    memory: { homeRoom: 'W1N1', role: 'harvester' },
    ticksToLive: 150  // Healthy harvester, so not emergency
  },
  'upgrader_1': {
    memory: { homeRoom: 'W1N1', role: 'upgrader' },
    ticksToLive: 150
  }
};

const creepToSpawnWithHealthyHarvester = spawnManager.getNextCreepToSpawn(mockRoom, { harvester: 2, upgrader: 3, scout: 1 });
console.log('Next creep with healthy harvester:', creepToSpawnWithHealthyHarvester);

if (creepToSpawnWithHealthyHarvester && creepToSpawnWithHealthyHarvester.role === 'scout') {
  console.log('✅ SUCCESS: Scout spawns even when other roles are waiting');
  console.log('   - Scout bypasses shouldWaitForBetterCreep logic correctly');
} else {
  console.log('❌ ISSUE: Scout not spawning when it should');
}

// Test Case 3: Emergency harvester should still spawn
console.log('\n--- Test Case 3: Emergency Harvester Should Still Spawn ---');

Game.creeps = {
  'harvester_dying': {
    memory: { homeRoom: 'W1N1', role: 'harvester' },
    ticksToLive: 30  // Dying harvester - emergency!
  },
  'upgrader_1': {
    memory: { homeRoom: 'W1N1', role: 'upgrader' },
    ticksToLive: 150
  }
};

const creepToSpawnEmergency = spawnManager.getNextCreepToSpawn(mockRoom, { harvester: 2, upgrader: 3, scout: 1 });
console.log('Next creep in emergency:', creepToSpawnEmergency);

if (creepToSpawnEmergency && creepToSpawnEmergency.role === 'harvester') {
  console.log('✅ SUCCESS: Emergency harvester spawns correctly');
  console.log('   - Emergency logic still works for other roles');
} else {
  console.log('❌ ISSUE: Emergency harvester not spawning');
}

console.log('\n=== shouldWaitForBetterCreep Fix Summary ===');
console.log('The fix adds a special case for scouts:');
console.log('');
console.log('```typescript');
console.log('// Special case: Scouts are intentionally cheap units and should always spawn when needed');
console.log('if (role === "scout") {');
console.log('  return false; // Never wait for better scout - they\'re designed to be minimal');
console.log('}');
console.log('```');
console.log('');
console.log('This allows scouts to bypass the emergency-only logic for cheap creeps,');
console.log('since scouts are intentionally designed to be minimal (100 energy) units.');
console.log('');
console.log('✅ Scout spawning issue should now be resolved!');
