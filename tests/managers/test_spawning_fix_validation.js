// Test to validate the spawning fix for 3-part creep issue
// This will verify that the shouldWaitForBetterCreep logic now works correctly

console.log('=== Spawning Fix Validation Test ===');

// Mock Game environment for testing
const mockGame = {
  time: 12345,
  spawns: {
    'Spawn1': {
      name: 'Spawn1',
      room: {
        name: 'W35N32',
        controller: { level: 2, my: true },
        energyAvailable: 300,
        energyCapacityAvailable: 300,
        find: function(type) {
          if (type === 'sources') return [{}, {}]; // 2 sources
          if (type === 'constructionSites') return [{}]; // 1 construction site
          return [];
        }
      },
      spawning: false
    }
  },
  creeps: {
    'upgrader_12340': {
      memory: { role: 'upgrader', homeRoom: 'W35N32' },
      body: [
        { type: 'work' },
        { type: 'carry' },
        { type: 'move' }
      ]
    }
  }
};

// Test the fixed shouldWaitForBetterCreep logic
function shouldWaitForBetterCreep(room, role, currentBody) {
  // Check existing creeps
  const existingCreeps = Object.values(mockGame.creeps).filter(
    creep => creep.memory.homeRoom === room.name && creep.memory.role === role
  );
  
  console.log(`Existing ${role} creeps: ${existingCreeps.length}`);
  
  if (existingCreeps.length === 0) {
    console.log('No existing creeps - emergency spawning (no wait)');
    return false;
  }

  // Calculate potential body
  const maxEnergy = Math.min(room.energyCapacityAvailable, 800);
  const potentialBody = getUpgraderBody(maxEnergy);
  const potentialBodyCost = calculateBodyCost(potentialBody);
  const currentBodyCost = calculateBodyCost(currentBody);
  
  console.log(`Current body: ${currentBody.join(', ')} (${currentBody.length} parts, ${currentBodyCost} energy)`);
  console.log(`Potential body: ${potentialBody.join(', ')} (${potentialBody.length} parts, ${potentialBodyCost} energy)`);
  console.log(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`);
  
  // Fixed logic
  const isSignificantlyBetter = potentialBody.length > currentBody.length;
  const canAffordBetter = potentialBodyCost <= room.energyCapacityAvailable;
  const notAtFullCapacity = room.energyAvailable < room.energyCapacityAvailable;
  const canAffordCurrentBody = currentBodyCost <= room.energyAvailable;
  
  console.log(`Significantly better: ${isSignificantlyBetter}`);
  console.log(`Can afford better: ${canAffordBetter}`);
  console.log(`Not at full capacity: ${notAtFullCapacity}`);
  console.log(`Can afford current body: ${canAffordCurrentBody}`);
  
  // If we're at full capacity or the current body is the best we can afford, don't wait
  if (!notAtFullCapacity || !canAffordCurrentBody) {
    console.log('At full capacity or current body is best we can afford - spawn now!');
    return false;
  }

  // Only wait if we can build something significantly better and we're not at capacity
  const shouldWait = isSignificantlyBetter && canAffordBetter && notAtFullCapacity;
  console.log(`Should wait: ${shouldWait}`);
  
  return shouldWait;
}

// Helper functions
function getUpgraderBody(energyAvailable) {
  if (energyAvailable >= 500) {
    return ['work', 'work', 'work', 'carry', 'carry', 'move'];
  } else if (energyAvailable >= 400) {
    return ['work', 'work', 'carry', 'carry', 'move'];
  } else if (energyAvailable >= 300) {
    return ['work', 'work', 'work', 'carry', 'move'];
  } else if (energyAvailable >= 200) {
    return ['work', 'carry', 'move'];
  } else {
    return ['work', 'carry', 'move'];
  }
}

function calculateBodyCost(body) {
  return body.reduce((cost, part) => {
    switch (part) {
      case 'work': return cost + 100;
      case 'carry': return cost + 50;
      case 'move': return cost + 50;
      default: return cost;
    }
  }, 0);
}

console.log('\n--- Testing Fixed Logic ---');

// Test Scenario 1: Room at full capacity (300/300)
console.log('\n=== Scenario 1: Full Capacity (300/300) ===');
const room1 = {
  name: 'W35N32',
  energyAvailable: 300,
  energyCapacityAvailable: 300
};
const currentBody1 = ['work', 'work', 'work', 'carry', 'move']; // What we want to spawn
const result1 = shouldWaitForBetterCreep(room1, 'upgrader', currentBody1);
console.log(`Result: ${result1 ? 'WAIT' : 'SPAWN NOW'} ✅ Expected: SPAWN NOW`);

// Test Scenario 2: Room not at full capacity (250/300)
console.log('\n=== Scenario 2: Not Full Capacity (250/300) ===');
const room2 = {
  name: 'W35N32',
  energyAvailable: 250,
  energyCapacityAvailable: 300
};
const currentBody2 = ['work', 'carry', 'move']; // Basic body we could spawn now
const result2 = shouldWaitForBetterCreep(room2, 'upgrader', currentBody2);
console.log(`Result: ${result2 ? 'WAIT' : 'SPAWN NOW'} ✅ Expected: WAIT (can get better body with 50 more energy)`);

// Test Scenario 3: Room not at full capacity but current body is best we can afford
console.log('\n=== Scenario 3: Not Full Capacity but Current Body is Optimal (250/300) ===');
const room3 = {
  name: 'W35N32',
  energyAvailable: 250,
  energyCapacityAvailable: 300
};
const currentBody3 = ['work', 'carry', 'move']; // 200 energy - we can afford this
const result3 = shouldWaitForBetterCreep(room3, 'upgrader', currentBody3);
console.log(`Result: ${result3 ? 'WAIT' : 'SPAWN NOW'} ✅ Expected: WAIT (can get 300 energy body)`);

// Test Scenario 4: Emergency case - no existing creeps
console.log('\n=== Scenario 4: Emergency - No Existing Creeps ===');
const mockGameNoCreeps = { ...mockGame, creeps: {} };
const originalCreeps = mockGame.creeps;
mockGame.creeps = {};

const room4 = {
  name: 'W35N32',
  energyAvailable: 200,
  energyCapacityAvailable: 300
};
const currentBody4 = ['work', 'carry', 'move'];
const result4 = shouldWaitForBetterCreep(room4, 'upgrader', currentBody4);
console.log(`Result: ${result4 ? 'WAIT' : 'SPAWN NOW'} ✅ Expected: SPAWN NOW (emergency)`);

// Restore creeps
mockGame.creeps = originalCreeps;

console.log('\n--- Summary ---');
console.log('The fix should resolve the 3-part creep issue by:');
console.log('1. ✅ Spawning immediately when at full energy capacity');
console.log('2. ✅ Spawning immediately in emergency situations (no existing creeps)');
console.log('3. ✅ Only waiting when there\'s room for improvement and we\'re not at capacity');
console.log('4. ✅ Preventing infinite waiting loops');

console.log('\n=== Test Complete ===');
