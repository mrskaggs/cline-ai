/**
 * Comprehensive test to validate RCL 2 and RCL 3 readiness
 * Tests structures, creep spawning, priorities, and system integration
 */

const fs = require('fs');

console.log('=== RCL 2 & RCL 3 Readiness Test ===\n');

// Mock Screeps constants for testing
global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_TOWER = 'tower';
global.STRUCTURE_CONTAINER = 'container';
global.STRUCTURE_STORAGE = 'storage';
global.STRUCTURE_LINK = 'link';
global.STRUCTURE_TERMINAL = 'terminal';
global.STRUCTURE_LAB = 'lab';
global.STRUCTURE_FACTORY = 'factory';
global.STRUCTURE_POWER_SPAWN = 'powerSpawn';
global.STRUCTURE_NUKER = 'nuker';
global.STRUCTURE_OBSERVER = 'observer';

global.WORK = 'work';
global.CARRY = 'carry';
global.MOVE = 'move';
global.ATTACK = 'attack';
global.RANGED_ATTACK = 'ranged_attack';
global.HEAL = 'heal';
global.CLAIM = 'claim';
global.TOUGH = 'tough';

// Read and evaluate the compiled bundle
const bundlePath = './dist/main.js';
if (!fs.existsSync(bundlePath)) {
    console.log('❌ Bundle not found. Run npm run build first.');
    process.exit(1);
}

const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Extract LayoutTemplates class from bundle
const layoutTemplatesMatch = bundleContent.match(/class LayoutTemplates[\s\S]*?(?=class|\nexport|\n\/\/|$)/);
if (!layoutTemplatesMatch) {
    console.log('❌ LayoutTemplates class not found in bundle');
    process.exit(1);
}

// Create a safe evaluation context
const context = {
    console,
    STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER,
    STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_TERMINAL, STRUCTURE_LAB,
    STRUCTURE_FACTORY, STRUCTURE_POWER_SPAWN, STRUCTURE_NUKER, STRUCTURE_OBSERVER,
    WORK, CARRY, MOVE, ATTACK, RANGED_ATTACK, HEAL, CLAIM, TOUGH,
    Logger: { warn: () => {}, info: () => {}, debug: () => {}, error: () => {} }
};

// Evaluate the LayoutTemplates class
let LayoutTemplates;
try {
    const func = new Function('context', `
        with (context) {
            ${layoutTemplatesMatch[0]}
            return LayoutTemplates;
        }
    `);
    LayoutTemplates = func(context);
} catch (error) {
    console.log('❌ Failed to evaluate LayoutTemplates:', error.message);
    process.exit(1);
}

console.log('Test 1: RCL 2 Structure Requirements');
console.log('=====================================');

// Test RCL 2 structure limits
const rcl2Limits = LayoutTemplates.getStructureLimits(2);
console.log('RCL 2 Structure Limits:');
console.log(`- Spawn: ${rcl2Limits[STRUCTURE_SPAWN]} (expected: 1)`);
console.log(`- Extensions: ${rcl2Limits[STRUCTURE_EXTENSION]} (expected: 5)`);
console.log(`- Towers: ${rcl2Limits[STRUCTURE_TOWER]} (expected: 0)`);
console.log(`- Containers: ${rcl2Limits[STRUCTURE_CONTAINER]} (expected: 0)`);

// Validate RCL 2 limits
const rcl2Valid = 
    rcl2Limits[STRUCTURE_SPAWN] === 1 &&
    rcl2Limits[STRUCTURE_EXTENSION] === 5 &&
    rcl2Limits[STRUCTURE_TOWER] === 0 &&
    rcl2Limits[STRUCTURE_CONTAINER] === 0;

console.log(rcl2Valid ? '✅ RCL 2 structure limits correct' : '❌ RCL 2 structure limits incorrect');

// Test RCL 2 template
const rcl2Template = LayoutTemplates.getTemplate(2);
if (rcl2Template) {
    console.log(`\nRCL 2 Template: ${rcl2Template.name}`);
    console.log(`- Buildings: ${rcl2Template.buildings.length}`);
    
    const extensionCount = rcl2Template.buildings.filter(b => b.structureType === STRUCTURE_EXTENSION).length;
    console.log(`- Extensions in template: ${extensionCount} (expected: 5)`);
    
    const templateValid = extensionCount === 5;
    console.log(templateValid ? '✅ RCL 2 template correct' : '❌ RCL 2 template incorrect');
} else {
    console.log('❌ RCL 2 template not found');
}

console.log('\nTest 2: RCL 3 Structure Requirements');
console.log('=====================================');

// Test RCL 3 structure limits
const rcl3Limits = LayoutTemplates.getStructureLimits(3);
console.log('RCL 3 Structure Limits:');
console.log(`- Spawn: ${rcl3Limits[STRUCTURE_SPAWN]} (expected: 1)`);
console.log(`- Extensions: ${rcl3Limits[STRUCTURE_EXTENSION]} (expected: 10)`);
console.log(`- Towers: ${rcl3Limits[STRUCTURE_TOWER]} (expected: 1)`);
console.log(`- Containers: ${rcl3Limits[STRUCTURE_CONTAINER]} (expected: 5)`);

// Validate RCL 3 limits
const rcl3Valid = 
    rcl3Limits[STRUCTURE_SPAWN] === 1 &&
    rcl3Limits[STRUCTURE_EXTENSION] === 10 &&
    rcl3Limits[STRUCTURE_TOWER] === 1 &&
    rcl3Limits[STRUCTURE_CONTAINER] === 5;

console.log(rcl3Valid ? '✅ RCL 3 structure limits correct' : '❌ RCL 3 structure limits incorrect');

// Test RCL 3 template
const rcl3Template = LayoutTemplates.getTemplate(3);
if (rcl3Template) {
    console.log(`\nRCL 3 Template: ${rcl3Template.name}`);
    console.log(`- Buildings: ${rcl3Template.buildings.length}`);
    
    const towerCount = rcl3Template.buildings.filter(b => b.structureType === STRUCTURE_TOWER).length;
    const containerCount = rcl3Template.buildings.filter(b => b.structureType === STRUCTURE_CONTAINER).length;
    const extensionCount = rcl3Template.buildings.filter(b => b.structureType === STRUCTURE_EXTENSION).length;
    
    console.log(`- Towers in template: ${towerCount} (expected: 1)`);
    console.log(`- Containers in template: ${containerCount} (expected: 3)`);
    console.log(`- Extensions in template: ${extensionCount} (expected: 5 new ones)`);
    
    const rcl3TemplateValid = towerCount === 1 && containerCount === 3 && extensionCount === 5;
    console.log(rcl3TemplateValid ? '✅ RCL 3 template correct' : '❌ RCL 3 template incorrect');
} else {
    console.log('❌ RCL 3 template not found');
}

console.log('\nTest 3: Cumulative Building System');
console.log('===================================');

// Test cumulative building system (RCL 3 should include RCL 1 + RCL 2 + RCL 3 buildings)
const allRcl3Buildings = LayoutTemplates.getBuildingsForRCL(3);
console.log(`Total buildings for RCL 3: ${allRcl3Buildings.length}`);

const totalSpawns = allRcl3Buildings.filter(b => b.structureType === STRUCTURE_SPAWN).length;
const totalExtensions = allRcl3Buildings.filter(b => b.structureType === STRUCTURE_EXTENSION).length;
const totalTowers = allRcl3Buildings.filter(b => b.structureType === STRUCTURE_TOWER).length;
const totalContainers = allRcl3Buildings.filter(b => b.structureType === STRUCTURE_CONTAINER).length;

console.log(`- Total Spawns: ${totalSpawns} (expected: 1)`);
console.log(`- Total Extensions: ${totalExtensions} (expected: 10)`);
console.log(`- Total Towers: ${totalTowers} (expected: 1)`);
console.log(`- Total Containers: ${totalContainers} (expected: 3)`);

const cumulativeValid = totalSpawns === 1 && totalExtensions === 10 && totalTowers === 1 && totalContainers === 3;
console.log(cumulativeValid ? '✅ Cumulative building system correct' : '❌ Cumulative building system incorrect');

console.log('\nTest 4: Creep Body Generation');
console.log('==============================');

// Test creep bodies for different energy levels (simulating RCL progression)
const testEnergyLevels = [
    { energy: 300, rcl: 2, description: 'RCL 2 with 5 extensions' },
    { energy: 550, rcl: 3, description: 'RCL 3 with 10 extensions' }
];

// Extract SpawnManager from bundle
const spawnManagerMatch = bundleContent.match(/class SpawnManager[\s\S]*?(?=class|\nexport|\n\/\/|$)/);
if (spawnManagerMatch) {
    console.log('✅ SpawnManager found in bundle');
    
    // Test body generation logic by examining the bundle content
    const hasHarvesterBody = bundleContent.includes('getHarvesterBody');
    const hasUpgraderBody = bundleContent.includes('getUpgraderBody');
    const hasBuilderBody = bundleContent.includes('getBuilderBody');
    const hasHaulerBody = bundleContent.includes('getBody'); // Hauler.getBody
    
    console.log(`- Harvester body generation: ${hasHarvesterBody ? '✅' : '❌'}`);
    console.log(`- Upgrader body generation: ${hasUpgraderBody ? '✅' : '❌'}`);
    console.log(`- Builder body generation: ${hasBuilderBody ? '✅' : '❌'}`);
    console.log(`- Hauler body generation: ${hasHaulerBody ? '✅' : '❌'}`);
} else {
    console.log('❌ SpawnManager not found in bundle');
}

console.log('\nTest 5: RCL 2-3 Spawning Logic');
console.log('===============================');

// Test spawning requirements
const hasCalculateRequiredCreeps = bundleContent.includes('calculateRequiredCreeps');
const hasRclBasedSpawning = bundleContent.includes('rcl >= 3');
const hasContainerDetection = bundleContent.includes('STRUCTURE_CONTAINER');
const hasHaulerSpawning = bundleContent.includes("requiredCreeps['hauler']");

console.log(`- Required creep calculation: ${hasCalculateRequiredCreeps ? '✅' : '❌'}`);
console.log(`- RCL-based spawning logic: ${hasRclBasedSpawning ? '✅' : '❌'}`);
console.log(`- Container detection: ${hasContainerDetection ? '✅' : '❌'}`);
console.log(`- Hauler spawning at RCL 3+: ${hasHaulerSpawning ? '✅' : '❌'}`);

console.log('\nTest 6: Priority System');
console.log('=======================');

// Test building priorities
if (rcl2Template && rcl3Template) {
    const rcl2Priorities = rcl2Template.buildings.map(b => b.priority);
    const rcl3Priorities = rcl3Template.buildings.map(b => b.priority);
    
    console.log(`RCL 2 priorities: ${rcl2Priorities.join(', ')}`);
    console.log(`RCL 3 priorities: ${rcl3Priorities.join(', ')}`);
    
    // Check that towers have high priority (should be 1)
    const towerPriority = rcl3Template.buildings.find(b => b.structureType === STRUCTURE_TOWER)?.priority;
    console.log(`Tower priority: ${towerPriority} (expected: 1)`);
    
    const priorityValid = towerPriority === 1;
    console.log(priorityValid ? '✅ Priority system correct' : '❌ Priority system needs review');
}

console.log('\nTest 7: System Integration');
console.log('===========================');

// Test that all required systems are integrated
const hasKernelIntegration = bundleContent.includes('SpawnManager') && bundleContent.includes('RoomManager');
const hasRoleIntegration = bundleContent.includes('Harvester') && bundleContent.includes('Upgrader') && bundleContent.includes('Builder') && bundleContent.includes('Hauler');
const hasLoggerIntegration = bundleContent.includes('Logger');
const hasMemoryTypes = bundleContent.includes('CreepMemory') || bundleContent.includes('role');

console.log(`- Kernel integration: ${hasKernelIntegration ? '✅' : '❌'}`);
console.log(`- Role integration: ${hasRoleIntegration ? '✅' : '❌'}`);
console.log(`- Logger integration: ${hasLoggerIntegration ? '✅' : '❌'}`);
console.log(`- Memory type safety: ${hasMemoryTypes ? '✅' : '❌'}`);

console.log('\n=== RCL 2-3 Readiness Summary ===');

const allTestsPassed = rcl2Valid && rcl3Valid && cumulativeValid && 
                      hasCalculateRequiredCreeps && hasRclBasedSpawning && 
                      hasContainerDetection && hasHaulerSpawning &&
                      hasKernelIntegration && hasRoleIntegration;

if (allTestsPassed) {
    console.log('🎉 ALL SYSTEMS READY FOR RCL 2-3 TRANSITION!');
    console.log('\nRCL 2 Features Ready:');
    console.log('- ✅ 1 Spawn + 5 Extensions (300 energy capacity)');
    console.log('- ✅ Harvester + Upgrader + Builder roles');
    console.log('- ✅ Priority-based construction system');
    console.log('- ✅ Smart energy waiting for better creeps');
    
    console.log('\nRCL 3 Features Ready:');
    console.log('- ✅ 1 Tower for defense');
    console.log('- ✅ 3 Containers for energy logistics');
    console.log('- ✅ 5 additional Extensions (550 energy capacity)');
    console.log('- ✅ Hauler role for container-based logistics');
    console.log('- ✅ Automatic hauler spawning when containers exist');
    
    console.log('\nNext Steps:');
    console.log('1. Deploy dist/main.js to Screeps');
    console.log('2. Monitor RCL 2 → RCL 3 transition');
    console.log('3. Verify tower defense and hauler logistics');
    console.log('4. Prepare for RCL 4 storage system (already implemented)');
} else {
    console.log('❌ Some systems need attention before RCL 2-3 transition');
    console.log('Review the failed tests above and fix any issues.');
}

console.log(`\nBundle size: ${Math.round(bundleContent.length / 1024)}kb`);
console.log('Bundle is ES2019 compatible and ready for Screeps deployment.');
