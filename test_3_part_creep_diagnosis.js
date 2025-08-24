// Test to diagnose why creeps are spawning with only 3 parts
// This will help identify the root cause of the spawning issue

console.log('=== 3-Part Creep Diagnosis Test ===');

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

// Mock Memory
const mockMemory = {
  rooms: {
    'W35N32': {}
  }
};

// Test the SpawnManager body generation logic
console.log('\n--- Testing SpawnManager Body Generation ---');

// Simulate the body generation methods from SpawnManager
function getUpgraderBody(energyAvailable) {
  console.log(`Testing upgrader body with ${energyAvailable} energy:`);
  
  if (energyAvailable >= 500) {
    const body = ['work', 'work', 'work', 'carry', 'carry', 'move'];
    console.log(`  500+ energy: ${body.join(', ')} (${body.length} parts)`);
    return body;
  } else if (energyAvailable >= 400) {
    const body = ['work', 'work', 'carry', 'carry', 'move'];
    console.log(`  400+ energy: ${body.join(', ')} (${body.length} parts)`);
    return body;
  } else if (energyAvailable >= 300) {
    // RCL 2 optimization: 3 WORK parts for maximum upgrade speed
    const body = ['work', 'work', 'work', 'carry', 'move'];
    console.log(`  300+ energy: ${body.join(', ')} (${body.length} parts)`);
    return body;
  } else if (energyAvailable >= 200) {
    const body = ['work', 'carry', 'move'];
    console.log(`  200+ energy: ${body.join(', ')} (${body.length} parts)`);
    return body;
  } else {
    const body = ['work', 'carry', 'move'];
    console.log(`  <200 energy: ${body.join(', ')} (${body.length} parts)`);
    return body;
  }
}

// Test different energy levels
console.log('\nTesting different energy scenarios:');
getUpgraderBody(150);  // Emergency
getUpgraderBody(200);  // Basic
getUpgraderBody(300);  // Should be 5 parts
getUpgraderBody(400);  // Should be 5 parts
getUpgraderBody(500);  // Should be 6 parts

console.log('\n--- Analyzing Current Creep ---');
const currentCreep = mockGame.creeps['upgrader_12340'];
console.log(`Current upgrader has ${currentCreep.body.length} parts:`);
currentCreep.body.forEach((part, i) => {
  console.log(`  ${i + 1}. ${part.type}`);
});

console.log('\n--- Testing shouldWaitForBetterCreep Logic ---');

// Simulate the waiting logic
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
  
  console.log(`Current body: ${currentBody.length} parts`);
  console.log(`Potential body: ${potentialBody.length} parts`);
  console.log(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`);
  
  const isSignificantlyBetter = potentialBody.length > currentBody.length;
  const closeToCapacity = room.energyAvailable >= (room.energyCapacityAvailable * 0.5);
  
  console.log(`Significantly better: ${isSignificantlyBetter}`);
  console.log(`Close to capacity: ${closeToCapacity} (${room.energyAvailable} >= ${room.energyCapacityAvailable * 0.5})`);
  
  const shouldWait = isSignificantlyBetter && closeToCapacity;
  console.log(`Should wait: ${shouldWait}`);
  
  return shouldWait;
}

// Test the waiting logic with current room state
const room = mockGame.spawns.Spawn1.room;
const currentBody = ['work', 'carry', 'move'];
shouldWaitForBetterCreep(room, 'upgrader', currentBody);

console.log('\n--- Diagnosis Summary ---');
console.log('Expected behavior with 300 energy:');
console.log('  - Should spawn [WORK, WORK, WORK, CARRY, MOVE] (5 parts)');
console.log('  - This gives 3 WORK parts for maximum upgrade efficiency');
console.log('');
console.log('Actual behavior:');
console.log('  - Spawning [WORK, CARRY, MOVE] (3 parts)');
console.log('  - This suggests either:');
console.log('    1. Energy available is less than 300');
console.log('    2. shouldWaitForBetterCreep is preventing spawning');
console.log('    3. There\'s a bug in the body selection logic');

console.log('\n=== Test Complete ===');
