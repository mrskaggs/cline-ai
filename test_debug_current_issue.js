// Debug test to understand why the invalid plan detection isn't working

console.log('=== Debugging Current Issue ===');

// Mock the exact scenario from the logs
const mockPlan = {
  roomName: 'W35N32',
  rcl: 2,
  lastUpdated: 72541400, // Recent enough
  buildings: Array(21).fill().map((_, i) => ({
    structureType: i < 15 ? 'extension' : 'spawn',
    pos: { x: 25 + (i % 5), y: 26 + Math.floor(i / 5) },
    rclRequired: 2,
    placed: false
  })),
  roads: [],
  status: 'ready',
  priority: 20
};

// Mock current game time
const currentTime = 72541470;

// Mock Settings
const Settings = {
  planning: {
    layoutAnalysisTTL: 1000
  }
};

// Mock LayoutTemplates with corrected limits
const LayoutTemplates = {
  getStructureLimits: (rcl) => {
    const limits = {};
    if (rcl >= 2) limits['extension'] = 5;
    else limits['extension'] = 0;
    return limits;
  }
};

// Test the hasInvalidStructureCounts logic
const hasInvalidStructureCounts = (plan) => {
  const currentLimits = LayoutTemplates.getStructureLimits(plan.rcl);
  const structureCounts = {};
  
  // Count structures in the plan
  plan.buildings.forEach(building => {
    const type = building.structureType;
    structureCounts[type] = (structureCounts[type] || 0) + 1;
  });
  
  console.log('Structure counts in plan:', structureCounts);
  console.log('Current limits for RCL', plan.rcl, ':', currentLimits);
  
  // Check if any structure type exceeds the current limits
  for (const [structureType, count] of Object.entries(structureCounts)) {
    const limit = currentLimits[structureType] || 0;
    console.log(`Checking ${structureType}: ${count} vs limit ${limit}`);
    if (count > limit) {
      console.log(`❌ INVALID: ${structureType} count ${count} exceeds limit ${limit}`);
      return true;
    }
  }
  
  return false;
};

// Test the shouldReplan logic
const shouldReplan = (plan) => {
  const age = currentTime - plan.lastUpdated;
  const ageBasedReplan = age > Settings.planning.layoutAnalysisTTL;
  const statusBasedReplan = plan.status === 'planning';
  const invalidStructures = hasInvalidStructureCounts(plan);
  
  console.log(`\nReplan analysis:`);
  console.log(`- Plan age: ${age} ticks (threshold: ${Settings.planning.layoutAnalysisTTL})`);
  console.log(`- Age-based replan: ${ageBasedReplan}`);
  console.log(`- Status-based replan: ${statusBasedReplan}`);
  console.log(`- Invalid structures: ${invalidStructures}`);
  
  const result = ageBasedReplan || statusBasedReplan || invalidStructures;
  console.log(`- Should replan: ${result}`);
  
  return result;
};

console.log('Testing with plan that has 15 extensions at RCL 2...\n');

const needsReplan = shouldReplan(mockPlan);

if (needsReplan) {
  console.log('\n✅ SUCCESS: System should trigger replan');
  console.log('Expected log: "Replanning room W35N32 - Invalid structure counts detected"');
} else {
  console.log('\n❌ PROBLEM: System will NOT trigger replan');
  console.log('This explains why we still see 15 extensions being attempted');
}

// Additional debugging
console.log('\n=== Additional Debugging ===');
console.log('Total buildings in plan:', mockPlan.buildings.length);
console.log('Extensions in plan:', mockPlan.buildings.filter(b => b.structureType === 'extension').length);
console.log('Expected extensions for RCL 2:', LayoutTemplates.getStructureLimits(2)['extension']);

console.log('\n=== Possible Issues ===');
console.log('1. Code changes not deployed to Screeps server yet');
console.log('2. LayoutTemplates.getStructureLimits not returning corrected values');
console.log('3. hasInvalidStructureCounts method not being called');
console.log('4. Logic error in the validation');
