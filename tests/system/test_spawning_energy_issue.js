// Test to demonstrate the spawning energy issue at RCL 2
// This test shows why creeps are spawned with only 3 parts even when extensions exist

// Define Screeps constants for Node.js testing
const WORK = 'work';
const CARRY = 'carry';
const MOVE = 'move';
const FIND_SOURCES = 'sources';
const FIND_CONSTRUCTION_SITES = 'construction_sites';

console.log('=== Testing Spawning Energy Issue at RCL 2 ===');

// Simulate RCL 2 room with extensions
const mockRoom = {
  controller: { level: 2, my: true },
  energyAvailable: 300,  // Current energy (spawn + some extensions)
  energyCapacityAvailable: 550,  // Total capacity (spawn + 5 extensions)
  find: (type) => {
    if (type === FIND_SOURCES) return [{}, {}]; // 2 sources
    if (type === FIND_CONSTRUCTION_SITES) return [{}]; // 1 construction site
    return [];
  }
};

// Mock SpawnManager methods for testing
class TestSpawnManager {
  getHarvesterBody(energyAvailable) {
    if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE]; // 6 parts
    } else if (energyAvailable >= 300) {
      return [WORK, WORK, CARRY, MOVE]; // 4 parts
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE]; // 3 parts
    } else {
      return [WORK, CARRY, MOVE]; // 3 parts (emergency)
    }
  }

  getUpgraderBody(energyAvailable) {
    if (energyAvailable >= 500) {
      return [WORK, WORK, WORK, CARRY, CARRY, MOVE]; // 6 parts
    } else if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE]; // 5 parts
    } else if (energyAvailable >= 300) {
      return [WORK, WORK, CARRY, MOVE]; // 4 parts
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE]; // 3 parts
    } else {
      return [WORK, CARRY, MOVE]; // 3 parts (emergency)
    }
  }

  getBuilderBody(energyAvailable) {
    if (energyAvailable >= 450) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE]; // 6 parts
    } else if (energyAvailable >= 350) {
      return [WORK, CARRY, CARRY, MOVE, MOVE]; // 5 parts
    } else if (energyAvailable >= 250) {
      return [WORK, CARRY, MOVE, MOVE]; // 4 parts
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE]; // 3 parts
    } else {
      return [WORK, CARRY, MOVE]; // 3 parts (emergency)
    }
  }
}

const spawnManager = new TestSpawnManager();

console.log('\n=== Current Behavior (Problem) ===');
console.log(`Room Energy Available: ${mockRoom.energyAvailable}`);
console.log(`Room Energy Capacity: ${mockRoom.energyCapacityAvailable}`);

// Test current spawning behavior
const harvesterBody = spawnManager.getHarvesterBody(mockRoom.energyAvailable);
const upgraderBody = spawnManager.getUpgraderBody(mockRoom.energyAvailable);
const builderBody = spawnManager.getBuilderBody(mockRoom.energyAvailable);

console.log(`Harvester body (${harvesterBody.length} parts):`, harvesterBody);
console.log(`Upgrader body (${upgraderBody.length} parts):`, upgraderBody);
console.log(`Builder body (${builderBody.length} parts):`, builderBody);

console.log('\n=== Problem Analysis ===');
console.log('ISSUE: SpawnManager uses energyAvailable (current energy) instead of energyCapacityAvailable (max capacity)');
console.log('RESULT: Even with extensions built, creeps are spawned based on current energy, not potential energy');
console.log('IMPACT: Suboptimal creeps spawned when room could support better ones');

console.log('\n=== Proposed Solution ===');
console.log('1. Add energy threshold checking before spawning');
console.log('2. Wait for more energy if room capacity supports better creeps');
console.log('3. Use energyCapacityAvailable for body planning, energyAvailable for spawn timing');

// Test improved behavior
console.log('\n=== Improved Behavior (Solution) ===');
const targetEnergy = Math.min(mockRoom.energyCapacityAvailable, 500); // Cap at reasonable limit
console.log(`Target Energy for Body Planning: ${targetEnergy}`);

const improvedHarvesterBody = spawnManager.getHarvesterBody(targetEnergy);
const improvedUpgraderBody = spawnManager.getUpgraderBody(targetEnergy);
const improvedBuilderBody = spawnManager.getBuilderBody(targetEnergy);

console.log(`Improved Harvester body (${improvedHarvesterBody.length} parts):`, improvedHarvesterBody);
console.log(`Improved Upgrader body (${improvedUpgraderBody.length} parts):`, improvedUpgraderBody);
console.log(`Improved Builder body (${improvedBuilderBody.length} parts):`, improvedBuilderBody);

// Calculate energy costs
function calculateEnergyCost(body) {
  return body.reduce((cost, part) => {
    switch(part) {
      case WORK: return cost + 100;
      case CARRY: return cost + 50;
      case MOVE: return cost + 50;
      default: return cost;
    }
  }, 0);
}

console.log('\n=== Energy Cost Analysis ===');
console.log(`Current Harvester Cost: ${calculateEnergyCost(harvesterBody)} energy`);
console.log(`Improved Harvester Cost: ${calculateEnergyCost(improvedHarvesterBody)} energy`);
console.log(`Room can afford improved creep: ${calculateEnergyCost(improvedHarvesterBody) <= mockRoom.energyCapacityAvailable}`);

console.log('\n=== Recommendation ===');
console.log('Implement energy threshold system:');
console.log('- Calculate optimal body based on energyCapacityAvailable');
console.log('- Only spawn when energyAvailable >= body cost');
console.log('- Add minimum energy thresholds to prevent spawning weak creeps');
console.log('- Consider emergency spawning for critical situations');
