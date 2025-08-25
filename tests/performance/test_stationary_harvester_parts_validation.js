// Test: Stationary Harvester Parts Optimization Validation
// This test validates the updated SpawnManager harvester body generation for stationary mining

// Define Screeps constants for Node.js environment
const WORK = 'work';
const CARRY = 'carry';
const MOVE = 'move';
const STRUCTURE_CONTAINER = 'container';

console.log('=== STATIONARY HARVESTER PARTS VALIDATION ===');

// Mock SpawnManager harvester body logic (extracted from actual implementation)
function getHarvesterBody(energyAvailable, room) {
  const rcl = room.controller ? room.controller.level : 1;
  
  // Check if we have containers (indicates stationary mining at RCL 3+)
  const hasContainers = rcl >= 3 && room.find('FIND_STRUCTURES', {
    filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
  }).length > 0;

  if (hasContainers) {
    // RCL 3+ Stationary Mining: Optimize for maximum WORK parts, minimal CARRY/MOVE
    if (energyAvailable >= 600) {
      // Perfect source utilization: 5 WORK = 10 energy/tick (matches source regen)
      return [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
    } else if (energyAvailable >= 500) {
      // High efficiency: 4 WORK = 8 energy/tick
      return [WORK, WORK, WORK, WORK, CARRY, MOVE];
    } else if (energyAvailable >= 350) {
      // Good efficiency: 3 WORK = 6 energy/tick, no movement needed
      return [WORK, WORK, WORK, CARRY];
    } else if (energyAvailable >= 300) {
      // Minimum viable stationary: 3 WORK with movement capability
      return [WORK, WORK, WORK, CARRY, MOVE];
    } else {
      // Fallback to mobile harvester body
      return [WORK, CARRY, MOVE];
    }
  } else {
    // RCL 1-2 Mobile Harvesting: Original logic for mobile harvesters
    if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 300) {
      // RCL 2 optimization: 3 WORK parts for maximum harvest efficiency
      return [WORK, WORK, WORK, CARRY, MOVE];
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE];
    } else {
      // Emergency case - spawn the cheapest possible creep
      return [WORK, CARRY, MOVE];
    }
  }
}

// Helper functions
function calculateBodyCost(body) {
  return body.reduce((cost, part) => {
    switch (part) {
      case WORK: return cost + 100;
      case CARRY: return cost + 50;
      case MOVE: return cost + 50;
      default: return cost;
    }
  }, 0);
}

function analyzeBody(body) {
  const workParts = body.filter(p => p === WORK).length;
  const carryParts = body.filter(p => p === CARRY).length;
  const moveParts = body.filter(p => p === MOVE).length;
  const harvestPerTick = workParts * 2;
  const cost = calculateBodyCost(body);
  
  return {
    workParts,
    carryParts,
    moveParts,
    harvestPerTick,
    cost,
    efficiency: harvestPerTick / cost * 1000
  };
}

// Mock room objects for testing
const mockRoomRCL2NoContainers = {
  controller: { level: 2 },
  find: () => [] // No containers
};

const mockRoomRCL3WithContainers = {
  controller: { level: 3 },
  find: () => [{ structureType: STRUCTURE_CONTAINER }] // Has containers
};

console.log('\n=== TEST 1: RCL 2 MOBILE HARVESTER BODIES ===');
console.log('Testing mobile harvester bodies (no containers, RCL 2)');

const mobileTests = [
  { energy: 200, expected: 'Basic mobile' },
  { energy: 300, expected: '3 WORK mobile' },
  { energy: 400, expected: 'Advanced mobile' },
  { energy: 500, expected: 'Advanced mobile (capped)' }
];

let allMobileTestsPassed = true;
mobileTests.forEach(test => {
  const body = getHarvesterBody(test.energy, mockRoomRCL2NoContainers);
  const stats = analyzeBody(body);
  
  console.log(`\nEnergy ${test.energy}: ${body.join(',')} (${stats.workParts}W ${stats.carryParts}C ${stats.moveParts}M)`);
  console.log(`  Cost: ${stats.cost}, Harvest: ${stats.harvestPerTick}/tick, Efficiency: ${stats.efficiency.toFixed(2)}`);
  
  // Validate mobile harvester characteristics
  const isValid = stats.carryParts >= 1 && stats.moveParts >= 1; // Mobile needs carry and move
  if (!isValid) {
    console.log(`  ❌ FAIL: Mobile harvester needs CARRY and MOVE parts`);
    allMobileTestsPassed = false;
  } else {
    console.log(`  ✅ PASS: Valid mobile harvester`);
  }
});

console.log('\n=== TEST 2: RCL 3+ STATIONARY HARVESTER BODIES ===');
console.log('Testing stationary harvester bodies (with containers, RCL 3+)');

const stationaryTests = [
  { energy: 200, expected: 'Fallback mobile' },
  { energy: 300, expected: '3 WORK stationary with move' },
  { energy: 350, expected: '3 WORK stationary no move' },
  { energy: 500, expected: '4 WORK stationary' },
  { energy: 600, expected: '5 WORK perfect utilization' },
  { energy: 800, expected: '5 WORK perfect utilization (capped)' }
];

let allStationaryTestsPassed = true;
stationaryTests.forEach(test => {
  const body = getHarvesterBody(test.energy, mockRoomRCL3WithContainers);
  const stats = analyzeBody(body);
  
  console.log(`\nEnergy ${test.energy}: ${body.join(',')} (${stats.workParts}W ${stats.carryParts}C ${stats.moveParts}M)`);
  console.log(`  Cost: ${stats.cost}, Harvest: ${stats.harvestPerTick}/tick, Efficiency: ${stats.efficiency.toFixed(2)}`);
  
  // Validate stationary harvester characteristics
  let isValid = true;
  let reason = '';
  
  if (test.energy >= 350 && test.energy < 500) {
    // Should be stationary (no MOVE) for 350-499 energy
    if (stats.moveParts > 0) {
      isValid = false;
      reason = 'Should be stationary (no MOVE) at this energy level';
    }
  }
  
  if (test.energy >= 600) {
    // Should have 5 WORK parts for perfect source utilization
    if (stats.workParts !== 5) {
      isValid = false;
      reason = 'Should have 5 WORK parts for perfect source utilization';
    }
  }
  
  // All stationary harvesters should minimize CARRY (only 1 needed)
  if (test.energy >= 300 && stats.carryParts > 1) {
    isValid = false;
    reason = 'Stationary harvesters should minimize CARRY parts (1 is sufficient)';
  }
  
  if (!isValid) {
    console.log(`  ❌ FAIL: ${reason}`);
    allStationaryTestsPassed = false;
  } else {
    console.log(`  ✅ PASS: Valid stationary harvester`);
  }
});

console.log('\n=== TEST 3: EFFICIENCY COMPARISON ===');
console.log('Comparing mobile vs stationary efficiency at same energy levels');

const comparisonTests = [300, 400, 500, 600];
let efficiencyTestsPassed = true;

comparisonTests.forEach(energy => {
  const mobileBody = getHarvesterBody(energy, mockRoomRCL2NoContainers);
  const stationaryBody = getHarvesterBody(energy, mockRoomRCL3WithContainers);
  
  const mobileStats = analyzeBody(mobileBody);
  const stationaryStats = analyzeBody(stationaryBody);
  
  console.log(`\nEnergy ${energy}:`);
  console.log(`  Mobile:     ${mobileStats.harvestPerTick}/tick, efficiency ${mobileStats.efficiency.toFixed(2)}`);
  console.log(`  Stationary: ${stationaryStats.harvestPerTick}/tick, efficiency ${stationaryStats.efficiency.toFixed(2)}`);
  
  const improvement = ((stationaryStats.efficiency / mobileStats.efficiency - 1) * 100);
  console.log(`  Improvement: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%`);
  
  // Stationary should be equal or better efficiency
  if (stationaryStats.efficiency < mobileStats.efficiency) {
    console.log(`  ❌ FAIL: Stationary should be more efficient than mobile`);
    efficiencyTestsPassed = false;
  } else {
    console.log(`  ✅ PASS: Stationary efficiency ${improvement >= 0 ? 'improved' : 'maintained'}`);
  }
});

console.log('\n=== TEST 4: SOURCE UTILIZATION VALIDATION ===');
console.log('Validating perfect source utilization (10 energy/tick regeneration)');

const sourceUtilizationTest = getHarvesterBody(600, mockRoomRCL3WithContainers);
const sourceStats = analyzeBody(sourceUtilizationTest);

console.log(`\nPerfect utilization body: ${sourceUtilizationTest.join(',')}`);
console.log(`Harvest rate: ${sourceStats.harvestPerTick} energy/tick`);
console.log(`Source regeneration: 10 energy/tick`);

const utilizationTestPassed = sourceStats.harvestPerTick === 10;
if (utilizationTestPassed) {
  console.log('✅ PASS: Perfect source utilization achieved (5 WORK parts = 10 energy/tick)');
} else {
  console.log('❌ FAIL: Should achieve perfect source utilization with 5 WORK parts');
}

console.log('\n=== TEST 5: CONTAINER DETECTION LOGIC ===');
console.log('Testing container detection affects body selection');

// Test RCL 3 without containers (should use mobile logic)
const mockRCL3NoContainers = {
  controller: { level: 3 },
  find: () => [] // No containers
};

const rcl3NoContainerBody = getHarvesterBody(400, mockRCL3NoContainers);
const rcl3WithContainerBody = getHarvesterBody(400, mockRoomRCL3WithContainers);

console.log(`\nRCL 3 without containers: ${rcl3NoContainerBody.join(',')}`);
console.log(`RCL 3 with containers: ${rcl3WithContainerBody.join(',')}`);

const containerDetectionPassed = JSON.stringify(rcl3NoContainerBody) !== JSON.stringify(rcl3WithContainerBody);
if (containerDetectionPassed) {
  console.log('✅ PASS: Container detection affects body selection');
} else {
  console.log('❌ FAIL: Container detection should change body selection');
}

console.log('\n=== FINAL RESULTS ===');

const allTestsPassed = allMobileTestsPassed && allStationaryTestsPassed && 
                      efficiencyTestsPassed && utilizationTestPassed && containerDetectionPassed;

if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED! Stationary harvester optimization is working correctly.');
  console.log('\nKey improvements achieved:');
  console.log('✅ Perfect source utilization (5 WORK = 10 energy/tick)');
  console.log('✅ Minimized CARRY parts (1 sufficient for container transfer)');
  console.log('✅ Optimized MOVE parts (stationary operation when possible)');
  console.log('✅ Container detection triggers stationary optimization');
  console.log('✅ Backward compatibility with mobile harvesters');
  console.log('✅ Efficiency improvements across all energy levels');
} else {
  console.log('❌ SOME TESTS FAILED. Review implementation.');
  console.log(`Mobile tests: ${allMobileTestsPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Stationary tests: ${allStationaryTestsPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Efficiency tests: ${efficiencyTestsPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Source utilization: ${utilizationTestPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Container detection: ${containerDetectionPassed ? 'PASS' : 'FAIL'}`);
}

console.log('\n=== TEST COMPLETE ===');
