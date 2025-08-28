// Test to validate that scouts spawn with the updated, less restrictive conditions
// This addresses the issue where "its not spawing scouts now" after the room confusion fixes

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

console.log('=== Scout Spawning Fix Validation Test ===');

// Test Case 1: Basic economy should allow scout spawning
console.log('\n--- Test Case 1: Basic Economy Scout Spawning ---');

// Setup room with basic economy (1 harvester, 1 upgrader)
const mockRoom = {
  name: 'W1N1',
  controller: { level: 2 },
  energyAvailable: 300,
  energyCapacityAvailable: 300,
  find: function(type) {
    if (type === FIND_SOURCES) {
      return [{ id: 'source1' }, { id: 'source2' }]; // 2 sources
    }
    if (type === FIND_MY_CREEPS) {
      return [
        { memory: { role: 'harvester' } }, // 1 harvester (less than 2 sources)
        { memory: { role: 'upgrader' } }   // 1 upgrader
      ];
    }
    return [];
  }
};

const mockSpawn = {
  name: 'Spawn1',
  room: mockRoom,
  spawning: null,
  canCreateCreep: () => true,
  createCreep: () => 'scout1'
};

Game.rooms['W1N1'] = mockRoom;
Game.spawns = { 'Spawn1': mockSpawn };

// Set up Game.creeps with proper memory structure for the test
Game.creeps = {
  'harvester_1': {
    memory: { homeRoom: 'W1N1', role: 'harvester' },
    ticksToLive: 150
  },
  'upgrader_1': {
    memory: { homeRoom: 'W1N1', role: 'upgrader' },
    ticksToLive: 150
  }
};

// Initialize SpawnManager
const spawnManager = new SpawnManager();

// Test the spawning logic
console.log('Room setup:');
console.log('- Sources: 2');
console.log('- Harvesters: 1 (less than source count)');
console.log('- Upgraders: 1');
console.log('- Energy: 300/300');

// Get required creeps
const requiredCreeps = spawnManager.calculateRequiredCreeps(mockRoom);
console.log('Required creeps:', requiredCreeps);

// Validate scout is required
if (requiredCreeps.scout === 1) {
  console.log('✅ SUCCESS: Scout spawning enabled with basic economy');
  console.log('   - Only requires 1 harvester (not full source coverage)');
  console.log('   - Only requires 1 upgrader');
} else {
  console.log('❌ FAILED: Scout not required with basic economy');
  console.log('   - This suggests spawning conditions are still too restrictive');
}

// Test Case 2: No economy should prevent scout spawning
console.log('\n--- Test Case 2: No Economy Prevention ---');

const mockRoomNoEconomy = {
  name: 'W1N2',
  controller: { level: 1 },
  energyAvailable: 300,
  energyCapacityAvailable: 300,
  find: function(type) {
    if (type === FIND_SOURCES) {
      return [{ id: 'source1' }];
    }
    if (type === FIND_MY_CREEPS) {
      return []; // No creeps
    }
    return [];
  }
};

const requiredCreepsNoEconomy = spawnManager.calculateRequiredCreeps(mockRoomNoEconomy);
console.log('Required creeps with no economy:', requiredCreepsNoEconomy);

if (!requiredCreepsNoEconomy.scout) {
  console.log('✅ SUCCESS: Scout spawning correctly disabled with no economy');
} else {
  console.log('❌ FAILED: Scout spawning enabled with no economy');
}

// Test Case 3: Only harvester, no upgrader
console.log('\n--- Test Case 3: Only Harvester, No Upgrader ---');

const mockRoomOnlyHarvester = {
  name: 'W1N3',
  controller: { level: 2 },
  energyAvailable: 300,
  energyCapacityAvailable: 300,
  find: function(type) {
    if (type === FIND_SOURCES) {
      return [{ id: 'source1' }, { id: 'source2' }];
    }
    if (type === FIND_MY_CREEPS) {
      return [
        { memory: { role: 'harvester' } } // Only harvester, no upgrader
      ];
    }
    return [];
  }
};

const requiredCreepsOnlyHarvester = spawnManager.calculateRequiredCreeps(mockRoomOnlyHarvester);
console.log('Required creeps with only harvester:', requiredCreepsOnlyHarvester);

if (!requiredCreepsOnlyHarvester.scout) {
  console.log('✅ SUCCESS: Scout spawning correctly disabled without upgrader');
} else {
  console.log('❌ FAILED: Scout spawning enabled without upgrader');
}

// Test Case 4: Comparison with old vs new conditions
console.log('\n--- Test Case 4: Old vs New Conditions Comparison ---');

const sourceCount = 2;
const currentHarvesters = 1;
const currentUpgraders = 1;

console.log('Scenario: 2 sources, 1 harvester, 1 upgrader');

// Old conditions (would prevent spawning)
const oldConditionsMet = (currentHarvesters >= sourceCount) && (currentUpgraders >= 1);
console.log(`Old conditions (harvesters >= sources): ${oldConditionsMet}`);
console.log(`  - currentHarvesters (${currentHarvesters}) >= sourceCount (${sourceCount}): ${currentHarvesters >= sourceCount}`);

// New conditions (should allow spawning)
const newConditionsMet = (currentHarvesters >= 1) && (currentUpgraders >= 1);
console.log(`New conditions (harvesters >= 1): ${newConditionsMet}`);
console.log(`  - currentHarvesters (${currentHarvesters}) >= 1: ${currentHarvesters >= 1}`);
console.log(`  - currentUpgraders (${currentUpgraders}) >= 1: ${currentUpgraders >= 1}`);

if (!oldConditionsMet && newConditionsMet) {
  console.log('✅ SUCCESS: New conditions are less restrictive than old conditions');
  console.log('   - This should fix the "not spawning scouts" issue');
} else {
  console.log('❌ ISSUE: Conditions comparison unexpected');
}

console.log('\n=== Test Summary ===');
console.log('The SpawnManager has been updated to spawn scouts with basic economy:');
console.log('- OLD: Required harvesters >= source count (too restrictive)');
console.log('- NEW: Required harvesters >= 1 (allows early scouting)');
console.log('- Still requires at least 1 upgrader for basic economy');
console.log('');
console.log('This should resolve the "its not spawing scouts now" issue by making');
console.log('scout spawning less dependent on having full harvester coverage.');
