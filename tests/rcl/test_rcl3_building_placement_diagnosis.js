// Test to diagnose why RCL3 buildings (towers, containers) aren't being placed
// User reports extensions are placed but not towers/containers

// Mock Screeps constants for Node.js environment
const STRUCTURE_SPAWN = 'spawn';
const STRUCTURE_EXTENSION = 'extension';
const STRUCTURE_TOWER = 'tower';
const STRUCTURE_CONTAINER = 'container';
const STRUCTURE_STORAGE = 'storage';
const STRUCTURE_LINK = 'link';
const STRUCTURE_TERMINAL = 'terminal';
const STRUCTURE_LAB = 'lab';
const STRUCTURE_FACTORY = 'factory';
const STRUCTURE_POWER_SPAWN = 'powerSpawn';
const STRUCTURE_NUKER = 'nuker';
const STRUCTURE_OBSERVER = 'observer';

console.log('=== RCL3 Building Placement Diagnosis ===');

// Simulate the getMinRCLForStructure method from BaseLayoutPlanner
function getMinRCLForStructure(structureType) {
  const rclRequirements = {
    [STRUCTURE_SPAWN]: 1,
    [STRUCTURE_EXTENSION]: 2,  // Extensions are available starting at RCL 2
    [STRUCTURE_TOWER]: 3,
    [STRUCTURE_STORAGE]: 4,
    [STRUCTURE_LINK]: 5,
    [STRUCTURE_TERMINAL]: 6,
    [STRUCTURE_LAB]: 6,
    [STRUCTURE_FACTORY]: 7,
    [STRUCTURE_POWER_SPAWN]: 8,
    [STRUCTURE_NUKER]: 8,
    [STRUCTURE_OBSERVER]: 8
  };
  
  return rclRequirements[structureType] || 1;
}

// Simulate RCL3 template buildings
const rcl3TemplateBuildings = [
  // Tower for defense
  { structureType: STRUCTURE_TOWER, offset: { x: 2, y: 0 }, priority: 1 },
  // Containers for energy logistics
  { structureType: STRUCTURE_CONTAINER, offset: { x: -3, y: -3 }, priority: 2 },
  { structureType: STRUCTURE_CONTAINER, offset: { x: 3, y: 3 }, priority: 2 },
  { structureType: STRUCTURE_CONTAINER, offset: { x: 0, y: 3 }, priority: 3 },
  // Additional extensions (5 more for total of 10)
  { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -1 }, priority: 2 },
  { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 1 }, priority: 2 },
  { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 1 }, priority: 2 },
  { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 0 }, priority: 3 },
  { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -2 }, priority: 3 }
];

console.log('\n=== Testing RCL Requirements ===');
const currentRCL = 3;

rcl3TemplateBuildings.forEach((building, index) => {
  const requiredRCL = getMinRCLForStructure(building.structureType);
  const eligible = requiredRCL <= currentRCL;
  
  console.log(`${index + 1}. ${building.structureType}:`);
  console.log(`   Required RCL: ${requiredRCL}`);
  console.log(`   Current RCL: ${currentRCL}`);
  console.log(`   Eligible: ${eligible ? '✅ YES' : '❌ NO'}`);
  console.log(`   Priority: ${building.priority}`);
  
  if (!eligible) {
    console.log(`   ⚠️  PROBLEM: This building won't be placed!`);
  }
});

console.log('\n=== ISSUE IDENTIFIED ===');
console.log('STRUCTURE_CONTAINER is missing from getMinRCLForStructure!');
console.log('This means containers get the default RCL requirement of 1.');
console.log('But let\'s check if there are other issues...');

// Check structure limits
function getStructureLimits(rcl) {
  const limits = {};
  
  limits[STRUCTURE_SPAWN] = rcl >= 8 ? 3 : rcl >= 7 ? 2 : 1;
  
  if (rcl >= 8) limits[STRUCTURE_EXTENSION] = 60;
  else if (rcl >= 7) limits[STRUCTURE_EXTENSION] = 50;
  else if (rcl >= 6) limits[STRUCTURE_EXTENSION] = 40;
  else if (rcl >= 5) limits[STRUCTURE_EXTENSION] = 30;
  else if (rcl >= 4) limits[STRUCTURE_EXTENSION] = 20;
  else if (rcl >= 3) limits[STRUCTURE_EXTENSION] = 10;
  else if (rcl >= 2) limits[STRUCTURE_EXTENSION] = 5;
  else limits[STRUCTURE_EXTENSION] = 0;
  
  if (rcl >= 8) limits[STRUCTURE_TOWER] = 6;
  else if (rcl >= 7) limits[STRUCTURE_TOWER] = 3;
  else if (rcl >= 5) limits[STRUCTURE_TOWER] = 2;
  else if (rcl >= 3) limits[STRUCTURE_TOWER] = 1;
  else limits[STRUCTURE_TOWER] = 0;
  
  limits[STRUCTURE_CONTAINER] = rcl >= 3 ? 5 : 0;
  limits[STRUCTURE_STORAGE] = rcl >= 4 ? 1 : 0;
  
  return limits;
}

console.log('\n=== Structure Limits Check ===');
const limits = getStructureLimits(currentRCL);
console.log(`RCL ${currentRCL} limits:`, limits);

// Count structures in template
const structureCounts = {};
rcl3TemplateBuildings.forEach(building => {
  structureCounts[building.structureType] = (structureCounts[building.structureType] || 0) + 1;
});

console.log('\nTemplate structure counts:', structureCounts);

console.log('\n=== Limit Validation ===');
let limitsOK = true;
Object.entries(structureCounts).forEach(([type, count]) => {
  const limit = limits[type] || 0;
  const valid = count <= limit;
  console.log(`${type}: ${count}/${limit} ${valid ? '✅' : '❌'}`);
  if (!valid) {
    limitsOK = false;
    console.log(`   ⚠️  PROBLEM: Template exceeds limit!`);
  }
});

console.log('\n=== DIAGNOSIS RESULTS ===');
if (limitsOK) {
  console.log('✅ Structure limits are OK');
} else {
  console.log('❌ Structure limits exceeded - this could cause issues');
}

console.log('\n=== POTENTIAL ISSUES FOUND ===');
console.log('1. STRUCTURE_CONTAINER missing from getMinRCLForStructure method');
console.log('   - This means containers get default RCL 1 instead of RCL 3');
console.log('   - But this should actually HELP placement, not prevent it');

console.log('\n2. Possible issues to investigate:');
console.log('   - Room memory might have old plan that needs replanning');
console.log('   - Construction site limits might be reached');
console.log('   - Positions might be blocked by existing structures');
console.log('   - Template anchor point might be wrong');

console.log('\n=== RECOMMENDED FIXES ===');
console.log('1. Add STRUCTURE_CONTAINER: 3 to getMinRCLForStructure method');
console.log('2. Force replan the room to ensure RCL3 template is applied');
console.log('3. Check if construction sites are being filtered out');
console.log('4. Verify template anchor point is correct');

console.log('\n=== NEXT STEPS ===');
console.log('1. Fix the missing STRUCTURE_CONTAINER RCL requirement');
console.log('2. Create a test to validate the complete RCL3 building placement');
console.log('3. Add diagnostic logging to see what\'s happening in real room');
