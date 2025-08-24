// Test to verify handling of existing invalid extensions in memory
// This tests the scenario where 15 extensions are already planned in memory from old incorrect limits

console.log('=== Testing Existing Invalid Extensions in Memory ===');

// Mock constants
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_SPAWN = 'spawn';
global.OK = 0;
global.ERR_RCL_NOT_ENOUGH = -14;

// Mock Logger
global.Logger = {
  warn: (msg) => console.log(`WARN: ${msg}`),
  error: (msg) => console.log(`ERROR: ${msg}`),
  info: (msg) => console.log(`INFO: ${msg}`),
  debug: (msg) => console.log(`DEBUG: ${msg}`)
};

// Test 1: Simulate existing memory with 15 extensions planned for RCL 2
console.log('\n--- Test 1: Existing Memory with Invalid Extensions ---');

const mockRoomMemory = {
  plan: {
    roomName: 'W35N32',
    rcl: 2,
    lastUpdated: 1000,
    buildings: [
      // 15 extensions planned (from old incorrect limits)
      { structureType: 'extension', pos: { x: 25, y: 26, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 24, y: 30, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 23, y: 30, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 25, y: 29, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 25, y: 30, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 23, y: 26, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 22, y: 30, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 25, y: 28, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 22, y: 26, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 21, y: 30, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 22, y: 27, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 22, y: 28, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 23, y: 29, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 23, y: 27, roomName: 'W35N32' }, rclRequired: 2, placed: false },
      { structureType: 'extension', pos: { x: 24, y: 28, roomName: 'W35N32' }, rclRequired: 2, placed: false }
    ],
    roads: [],
    status: 'ready',
    priority: 20
  }
};

console.log(`Existing plan has ${mockRoomMemory.plan.buildings.length} extensions planned for RCL ${mockRoomMemory.plan.rcl}`);

// Test 2: Check what happens when placeConstructionSites is called
console.log('\n--- Test 2: Construction Site Placement with Invalid Memory ---');

const currentRCL = 2;
const maxExtensionsAtRCL2 = 5; // Correct limit after fix

// Simulate the filtering logic from placeConstructionSites
const eligibleBuildings = mockRoomMemory.plan.buildings.filter(building => 
  !building.placed && 
  building.rclRequired <= currentRCL
);

console.log(`Current RCL: ${currentRCL}`);
console.log(`Max extensions allowed at RCL 2: ${maxExtensionsAtRCL2}`);
console.log(`Extensions in memory plan: ${eligibleBuildings.length}`);
console.log(`Extensions that would fail: ${eligibleBuildings.length - maxExtensionsAtRCL2}`);

// Simulate what would happen when trying to place each extension
let successfulPlacements = 0;
let failedPlacements = 0;

for (let i = 0; i < eligibleBuildings.length; i++) {
  const building = eligibleBuildings[i];
  
  // Simulate the Screeps API behavior
  if (successfulPlacements < maxExtensionsAtRCL2) {
    console.log(`Extension ${i + 1}: Would place successfully at ${building.pos.x},${building.pos.y}`);
    successfulPlacements++;
  } else {
    console.log(`Extension ${i + 1}: Would fail with ERR_RCL_NOT_ENOUGH at ${building.pos.x},${building.pos.y}`);
    failedPlacements++;
  }
}

console.log(`\nResult: ${successfulPlacements} successful, ${failedPlacements} failed`);

// Test 3: Check replanning conditions
console.log('\n--- Test 3: Replanning Conditions Analysis ---');

// Simulate the shouldReplan logic
const shouldReplan = (plan) => {
  const currentTime = 2000; // Simulate current game time
  const age = currentTime - plan.lastUpdated;
  const layoutAnalysisTTL = 1000; // From settings
  
  return age > layoutAnalysisTTL || plan.status === 'planning';
};

const needsReplan = shouldReplan(mockRoomMemory.plan);
console.log(`Plan age: ${2000 - mockRoomMemory.plan.lastUpdated} ticks`);
console.log(`Should replan due to age: ${needsReplan}`);
console.log(`RCL changed: ${mockRoomMemory.plan.rcl < currentRCL ? 'YES' : 'NO'}`);

// Test 4: Demonstrate the problem
console.log('\n--- Test 4: Problem Demonstration ---');

if (!needsReplan && mockRoomMemory.plan.rcl === currentRCL) {
  console.log('❌ PROBLEM: System will NOT replan automatically');
  console.log('   - RCL has not changed (still 2)');
  console.log('   - Plan is not old enough to trigger replan');
  console.log('   - System will keep trying to place 15 extensions');
  console.log('   - 10 extensions will fail with ERR_RCL_NOT_ENOUGH');
} else {
  console.log('✅ System will replan and fix the issue');
}

// Test 5: Proposed solution
console.log('\n--- Test 5: Proposed Solution ---');
console.log('Need to add structure count validation to trigger replanning when:');
console.log('1. Existing plan has more structures than current RCL allows');
console.log('2. This indicates the structure limits have been corrected');
console.log('3. Force a replan to generate a valid plan with correct limits');

// Simulate the proposed validation
const validatePlanStructureLimits = (plan, currentRCL) => {
  const correctLimits = {
    2: { extensions: 5 },
    3: { extensions: 10 },
    4: { extensions: 20 }
  };
  
  const limit = correctLimits[currentRCL];
  if (!limit) return true; // No validation for unknown RCL
  
  const extensionCount = plan.buildings.filter(b => b.structureType === 'extension').length;
  return extensionCount <= limit.extensions;
};

const planIsValid = validatePlanStructureLimits(mockRoomMemory.plan, currentRCL);
console.log(`Plan structure counts are valid: ${planIsValid ? 'YES' : 'NO'}`);

if (!planIsValid) {
  console.log('✅ SOLUTION: Force replan due to invalid structure counts');
  console.log('   This would generate a new plan with only 5 extensions');
}

console.log('\n=== Test Summary ===');
console.log('❌ Current system has a gap: existing invalid plans are not automatically fixed');
console.log('✅ Solution needed: Add structure count validation to trigger replanning');
console.log('✅ This ensures the system recovers from incorrect structure limits');
