// Test: Stationary Harvester Part Optimization Analysis
// This test analyzes whether harvester parts should be optimized for stationary container-based mining

// Define Screeps constants for Node.js environment
const WORK = 'work';
const CARRY = 'carry';
const MOVE = 'move';

console.log('=== STATIONARY HARVESTER OPTIMIZATION ANALYSIS ===');

// Current harvester body configurations from SpawnManager
const currentBodies = {
  basic: [WORK, CARRY, MOVE],           // 200 energy
  optimized: [WORK, WORK, WORK, CARRY, MOVE], // 300 energy  
  advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] // 400 energy
};

// Calculate body costs and efficiency
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

function analyzeBody(name, body) {
  const cost = calculateBodyCost(body);
  const workParts = body.filter(p => p === WORK).length;
  const carryParts = body.filter(p => p === CARRY).length;
  const moveParts = body.filter(p => p === MOVE).length;
  
  // Harvest efficiency: each WORK part harvests 2 energy per tick
  const harvestPerTick = workParts * 2;
  
  // Carry capacity: each CARRY part holds 50 energy
  const carryCapacity = carryParts * 50;
  
  // Movement efficiency: fatigue vs move parts
  const fatiguePerMove = body.length - moveParts; // Non-MOVE parts generate fatigue
  const moveEfficiency = moveParts >= fatiguePerMove ? 'Optimal' : 'Slow';
  
  console.log(`\n${name}:`);
  console.log(`  Cost: ${cost} energy`);
  console.log(`  Parts: ${workParts}W ${carryParts}C ${moveParts}M`);
  console.log(`  Harvest: ${harvestPerTick} energy/tick`);
  console.log(`  Carry: ${carryCapacity} energy capacity`);
  console.log(`  Movement: ${moveEfficiency}`);
  console.log(`  Efficiency: ${(harvestPerTick / cost * 1000).toFixed(2)} harvest/1000 energy`);
  
  return {
    cost,
    workParts,
    carryParts,
    moveParts,
    harvestPerTick,
    carryCapacity,
    moveEfficiency,
    efficiency: harvestPerTick / cost * 1000
  };
}

console.log('\n=== CURRENT BODY ANALYSIS ===');
const basicStats = analyzeBody('Basic (200)', currentBodies.basic);
const optimizedStats = analyzeBody('Optimized (300)', currentBodies.optimized);
const advancedStats = analyzeBody('Advanced (400)', currentBodies.advanced);

console.log('\n=== STATIONARY MINING CONSIDERATIONS ===');

console.log('\nFor stationary harvesters at RCL 3+ with containers:');
console.log('1. MOVEMENT: Minimal movement needed (just to adjacent container position)');
console.log('2. HARVEST PRIORITY: Maximum WORK parts for energy generation');
console.log('3. CARRY CAPACITY: Only need enough to transfer to container');
console.log('4. MOVE PARTS: Minimal needed since they stay in one place');

console.log('\n=== PROPOSED STATIONARY OPTIMIZATIONS ===');

// Proposed optimized bodies for stationary mining
const stationaryBodies = {
  // Focus on maximum WORK parts, minimal CARRY/MOVE
  efficient200: [WORK, WORK, WORK, CARRY], // 200 energy, 4 parts, no MOVE (for truly stationary)
  efficient250: [WORK, WORK, WORK, WORK, CARRY, MOVE], // 250 energy, max WORK
  efficient300: [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], // 300 energy, 5 WORK parts
  efficient350: [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE], // 350 energy
};

console.log('\nProposed stationary bodies:');
analyzeBody('Stationary 200 (No Move)', stationaryBodies.efficient200);
analyzeBody('Stationary 250', stationaryBodies.efficient250);
analyzeBody('Stationary 300', stationaryBodies.efficient300);
analyzeBody('Stationary 350', stationaryBodies.efficient350);

console.log('\n=== EFFICIENCY COMPARISON ===');

console.log('\nHarvest efficiency (energy/tick per 100 cost):');
console.log(`Current Basic: ${(basicStats.harvestPerTick / basicStats.cost * 100).toFixed(2)}`);
console.log(`Current Optimized: ${(optimizedStats.harvestPerTick / optimizedStats.cost * 100).toFixed(2)}`);
console.log(`Current Advanced: ${(advancedStats.harvestPerTick / advancedStats.cost * 100).toFixed(2)}`);

// Calculate proposed efficiencies
const proposed300 = analyzeBody('Proposed 300', stationaryBodies.efficient300);
console.log(`Proposed 300: ${(proposed300.harvestPerTick / proposed300.cost * 100).toFixed(2)}`);

console.log('\n=== RECOMMENDATIONS ===');

console.log('\nFor RCL 3+ stationary harvesters with containers:');

if (proposed300.efficiency > optimizedStats.efficiency) {
  console.log('✅ OPTIMIZATION RECOMMENDED');
  console.log(`  Current 300 energy: ${optimizedStats.harvestPerTick} energy/tick (${optimizedStats.workParts} WORK)`);
  console.log(`  Proposed 300 energy: ${proposed300.harvestPerTick} energy/tick (${proposed300.workParts} WORK)`);
  console.log(`  Improvement: +${((proposed300.efficiency / optimizedStats.efficiency - 1) * 100).toFixed(1)}% efficiency`);
  
  console.log('\nProposed changes to SpawnManager.getHarvesterBody():');
  console.log('- For RCL 3+ with containers: Maximize WORK parts');
  console.log('- Reduce CARRY parts (only need 1 for container transfer)');
  console.log('- Minimize MOVE parts (stationary operation)');
  
} else {
  console.log('❌ NO OPTIMIZATION NEEDED');
  console.log('Current bodies are already optimal for stationary mining');
}

console.log('\n=== IMPLEMENTATION CONSIDERATIONS ===');

console.log('\n1. MOVEMENT REQUIREMENTS:');
console.log('   - Harvesters need 1 MOVE to reach container position initially');
console.log('   - After positioning, no movement needed');
console.log('   - Consider 0 MOVE for truly stationary (spawn adjacent to source)');

console.log('\n2. CARRY REQUIREMENTS:');
console.log('   - Only need enough CARRY to transfer to container');
console.log('   - 1 CARRY part (50 capacity) sufficient for most cases');
console.log('   - Excess CARRY parts are wasted energy');

console.log('\n3. WORK OPTIMIZATION:');
console.log('   - Each WORK part = 2 energy/tick harvest');
console.log('   - Source regenerates 10 energy/tick');
console.log('   - 5 WORK parts = 10 energy/tick = perfect source utilization');

console.log('\n4. CONTAINER INTEGRATION:');
console.log('   - Harvesters fill containers, haulers transport');
console.log('   - No need for harvesters to move to spawn/extensions');
console.log('   - Focus purely on energy generation efficiency');

console.log('\n=== TEST COMPLETE ===');
