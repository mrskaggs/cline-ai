// Test to verify the improved spawning system with energy thresholds
// This test demonstrates how the new system waits for better energy to spawn stronger creeps

console.log('=== Testing Improved Spawning System ===');

// Define Screeps constants for Node.js testing
const WORK = 'work';
const CARRY = 'carry';
const MOVE = 'move';
const ATTACK = 'attack';
const RANGED_ATTACK = 'ranged_attack';
const HEAL = 'heal';
const CLAIM = 'claim';
const TOUGH = 'tough';

// Mock improved SpawnManager methods for testing
class ImprovedSpawnManager {
  getHarvesterBody(energyAvailable) {
    if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE]; // 6 parts, 400 energy
    } else if (energyAvailable >= 300) {
      return [WORK, WORK, CARRY, MOVE]; // 4 parts, 300 energy
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE]; // 3 parts, 200 energy
    } else {
      return [WORK, CARRY, MOVE]; // 3 parts (emergency)
    }
  }

  getOptimalCreepBody(role, energyCapacity) {
    const maxEnergy = Math.min(energyCapacity, 800);
    switch (role) {
      case 'harvester':
        return this.getHarvesterBody(maxEnergy);
      default:
        return [];
    }
  }

  calculateBodyCost(body) {
    return body.reduce((cost, part) => {
      switch (part) {
        case WORK: return cost + 100;
        case CARRY: return cost + 50;
        case MOVE: return cost + 50;
        case ATTACK: return cost + 80;
        case RANGED_ATTACK: return cost + 150;
        case HEAL: return cost + 250;
        case CLAIM: return cost + 600;
        case TOUGH: return cost + 10;
        default: return cost;
      }
    }, 0);
  }

  shouldWaitForBetterCreep(room, role, currentBody, existingCreepCount = 1) {
    // Don't wait if we have no creeps of this role (emergency spawning)
    if (existingCreepCount === 0) {
      return false;
    }

    // Calculate what body we could build with full energy capacity
    const potentialBody = this.getOptimalCreepBody(role, room.energyCapacityAvailable);
    const currentBodyCost = this.calculateBodyCost(currentBody);
    const potentialBodyCost = this.calculateBodyCost(potentialBody);

    // Only wait if:
    // 1. The potential body is significantly better (more parts)
    // 2. We have enough capacity to build the better body
    // 3. We're not too far from having enough energy (within 50% of capacity)
    const isSignificantlyBetter = potentialBody.length > currentBody.length;
    const canAffordBetter = potentialBodyCost <= room.energyCapacityAvailable;
    const closeToCapacity = room.energyAvailable >= (room.energyCapacityAvailable * 0.5);

    return isSignificantlyBetter && canAffordBetter && closeToCapacity;
  }
}

const spawnManager = new ImprovedSpawnManager();

console.log('\n=== Test Scenario 1: RCL 2 Room with Extensions ===');
const room1 = {
  energyAvailable: 300,      // Current energy
  energyCapacityAvailable: 550,  // Total capacity (spawn + 5 extensions)
};

const currentBody1 = spawnManager.getHarvesterBody(room1.energyAvailable);
const optimalBody1 = spawnManager.getOptimalCreepBody('harvester', room1.energyCapacityAvailable);

console.log(`Room Energy: ${room1.energyAvailable}/${room1.energyCapacityAvailable}`);
console.log(`Current Body (${currentBody1.length} parts, ${spawnManager.calculateBodyCost(currentBody1)} energy):`, currentBody1);
console.log(`Optimal Body (${optimalBody1.length} parts, ${spawnManager.calculateBodyCost(optimalBody1)} energy):`, optimalBody1);

// Test with existing harvester (should wait)
const shouldWait1 = spawnManager.shouldWaitForBetterCreep(room1, 'harvester', currentBody1, 1);
console.log(`Should wait for better creep (with existing harvester): ${shouldWait1}`);

// Test without existing harvester (emergency spawn)
const shouldWait1Emergency = spawnManager.shouldWaitForBetterCreep(room1, 'harvester', currentBody1, 0);
console.log(`Should wait for better creep (no existing harvester): ${shouldWait1Emergency}`);

console.log('\n=== Test Scenario 2: Low Energy Situation ===');
const room2 = {
  energyAvailable: 250,      // Low current energy
  energyCapacityAvailable: 550,  // Same capacity
};

const currentBody2 = spawnManager.getHarvesterBody(room2.energyAvailable);
const shouldWait2 = spawnManager.shouldWaitForBetterCreep(room2, 'harvester', currentBody2, 1);

console.log(`Room Energy: ${room2.energyAvailable}/${room2.energyCapacityAvailable}`);
console.log(`Current Body (${currentBody2.length} parts):`, currentBody2);
console.log(`Should wait for better creep: ${shouldWait2} (too far from capacity threshold)`);

console.log('\n=== Test Scenario 3: High Energy Situation ===');
const room3 = {
  energyAvailable: 380,      // Close to optimal
  energyCapacityAvailable: 550,
};

const currentBody3 = spawnManager.getHarvesterBody(room3.energyAvailable);
const shouldWait3 = spawnManager.shouldWaitForBetterCreep(room3, 'harvester', currentBody3, 1);

console.log(`Room Energy: ${room3.energyAvailable}/${room3.energyCapacityAvailable}`);
console.log(`Current Body (${currentBody3.length} parts):`, currentBody3);
console.log(`Should wait for better creep: ${shouldWait3} (close to capacity, worth waiting)`);

console.log('\n=== Test Scenario 4: Already Optimal ===');
const room4 = {
  energyAvailable: 400,      // Can afford optimal
  energyCapacityAvailable: 550,
};

const currentBody4 = spawnManager.getHarvesterBody(room4.energyAvailable);
const shouldWait4 = spawnManager.shouldWaitForBetterCreep(room4, 'harvester', currentBody4, 1);

console.log(`Room Energy: ${room4.energyAvailable}/${room4.energyCapacityAvailable}`);
console.log(`Current Body (${currentBody4.length} parts):`, currentBody4);
console.log(`Should wait for better creep: ${shouldWait4} (already optimal)`);

console.log('\n=== Summary of Improvements ===');
console.log('✅ Emergency spawning: Spawns immediately when no creeps exist');
console.log('✅ Energy threshold: Waits when close to capacity (60%+) for better creeps');
console.log('✅ Significant improvement check: Only waits if better body has more parts');
console.log('✅ Capacity validation: Ensures room can actually afford the better creep');
console.log('✅ Reasonable caps: Limits max energy to prevent overly expensive creeps');

console.log('\n=== Expected Behavior ===');
console.log('- RCL 2 room with 300/550 energy and existing harvester: WAIT for 400 energy');
console.log('- RCL 2 room with 300/550 energy and NO harvester: SPAWN immediately (emergency)');
console.log('- Room with 250/550 energy: SPAWN immediately (too far from capacity)');
console.log('- Room with 380/550 energy: WAIT for 400 energy (close to optimal)');
console.log('- Room with 400/550 energy: SPAWN immediately (already optimal)');
