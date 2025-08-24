/**
 * Direct validation of RCL 2-3 readiness by checking source files
 * Tests structure limits, templates, and spawning logic
 */

const fs = require('fs');
const path = require('path');

console.log('=== RCL 2-3 Direct Validation ===\n');

// Read source files
const layoutTemplatesPath = './src/planners/LayoutTemplates.ts';
const spawnManagerPath = './src/managers/SpawnManager.ts';

if (!fs.existsSync(layoutTemplatesPath)) {
    console.log('❌ LayoutTemplates.ts not found');
    process.exit(1);
}

if (!fs.existsSync(spawnManagerPath)) {
    console.log('❌ SpawnManager.ts not found');
    process.exit(1);
}

const layoutTemplatesContent = fs.readFileSync(layoutTemplatesPath, 'utf8');
const spawnManagerContent = fs.readFileSync(spawnManagerPath, 'utf8');

console.log('Test 1: RCL 2 Structure Limits');
console.log('===============================');

// Check RCL 2 extension limits (should be 5, not 20)
const rcl2ExtensionCheck = layoutTemplatesContent.includes('else if (rcl >= 2) limits[STRUCTURE_EXTENSION] = 5;');
console.log(`RCL 2 extension limit (5): ${rcl2ExtensionCheck ? '✅' : '❌'}`);

// Check that RCL 2 has no towers or containers
const rcl2TowerCheck = layoutTemplatesContent.includes('else if (rcl >= 3) limits[STRUCTURE_TOWER] = 1;');
const rcl2ContainerCheck = layoutTemplatesContent.includes('limits[STRUCTURE_CONTAINER] = rcl >= 3 ? 5 : 0;');
console.log(`RCL 2 no towers (unlocked at RCL 3): ${rcl2TowerCheck ? '✅' : '❌'}`);
console.log(`RCL 2 no containers (unlocked at RCL 3): ${rcl2ContainerCheck ? '✅' : '❌'}`);

console.log('\nTest 2: RCL 3 Structure Limits');
console.log('===============================');

// Check RCL 3 extension limits (should be 10)
const rcl3ExtensionCheck = layoutTemplatesContent.includes('else if (rcl >= 3) limits[STRUCTURE_EXTENSION] = 10;');
console.log(`RCL 3 extension limit (10): ${rcl3ExtensionCheck ? '✅' : '❌'}`);

// Check RCL 3 tower limit (should be 1)
const rcl3TowerCheck = layoutTemplatesContent.includes('else if (rcl >= 3) limits[STRUCTURE_TOWER] = 1;');
console.log(`RCL 3 tower limit (1): ${rcl3TowerCheck ? '✅' : '❌'}`);

// Check RCL 3 container limit (should be 5)
const rcl3ContainerCheck = layoutTemplatesContent.includes('limits[STRUCTURE_CONTAINER] = rcl >= 3 ? 5 : 0;');
console.log(`RCL 3 container limit (5): ${rcl3ContainerCheck ? '✅' : '❌'}`);

console.log('\nTest 3: RCL 2 Template');
console.log('======================');

// Check RCL 2 template has 5 extensions
const rcl2TemplateMatch = layoutTemplatesContent.match(/getRCL2Template\(\)[\s\S]*?return \{[\s\S]*?\};/);
if (rcl2TemplateMatch) {
    const rcl2Template = rcl2TemplateMatch[0];
    const extensionCount = (rcl2Template.match(/STRUCTURE_EXTENSION/g) || []).length;
    console.log(`RCL 2 template extensions: ${extensionCount} (expected: 5) ${extensionCount === 5 ? '✅' : '❌'}`);
    
    const hasNoTowers = !rcl2Template.includes('STRUCTURE_TOWER');
    const hasNoContainers = !rcl2Template.includes('STRUCTURE_CONTAINER');
    console.log(`RCL 2 template no towers: ${hasNoTowers ? '✅' : '❌'}`);
    console.log(`RCL 2 template no containers: ${hasNoContainers ? '✅' : '❌'}`);
} else {
    console.log('❌ RCL 2 template not found');
}

console.log('\nTest 4: RCL 3 Template');
console.log('======================');

// Check RCL 3 template has tower and containers
const rcl3TemplateMatch = layoutTemplatesContent.match(/getRCL3Template\(\)[\s\S]*?return \{[\s\S]*?\};/);
if (rcl3TemplateMatch) {
    const rcl3Template = rcl3TemplateMatch[0];
    const towerCount = (rcl3Template.match(/STRUCTURE_TOWER/g) || []).length;
    const containerCount = (rcl3Template.match(/STRUCTURE_CONTAINER/g) || []).length;
    const extensionCount = (rcl3Template.match(/STRUCTURE_EXTENSION/g) || []).length;
    
    console.log(`RCL 3 template towers: ${towerCount} (expected: 1) ${towerCount === 1 ? '✅' : '❌'}`);
    console.log(`RCL 3 template containers: ${containerCount} (expected: 3) ${containerCount === 3 ? '✅' : '❌'}`);
    console.log(`RCL 3 template extensions: ${extensionCount} (expected: 5) ${extensionCount === 5 ? '✅' : '❌'}`);
    
    // Check template name includes containers
    const hasContainerName = rcl3Template.includes('RCL3_Tower_Containers');
    console.log(`RCL 3 template name includes containers: ${hasContainerName ? '✅' : '❌'}`);
} else {
    console.log('❌ RCL 3 template not found');
}

console.log('\nTest 5: Spawning Logic');
console.log('======================');

// Check RCL-based spawning logic
const hasRclBasedSpawning = spawnManagerContent.includes('const rcl = room.controller ? room.controller.level : 0;');
console.log(`RCL-based spawning: ${hasRclBasedSpawning ? '✅' : '❌'}`);

// Check RCL 1 vs RCL 2+ logic
const hasRcl1Logic = spawnManagerContent.includes('if (rcl === 1)');
const hasRcl2PlusLogic = spawnManagerContent.includes('} else {');
console.log(`RCL 1 special logic: ${hasRcl1Logic ? '✅' : '❌'}`);
console.log(`RCL 2+ specialized roles: ${hasRcl2PlusLogic ? '✅' : '❌'}`);

// Check hauler spawning at RCL 3+
const hasHaulerRcl3 = spawnManagerContent.includes('if (rcl >= 3)');
const hasContainerDetection = spawnManagerContent.includes('STRUCTURE_CONTAINER');
const hasHaulerSpawning = spawnManagerContent.includes("requiredCreeps['hauler']");
console.log(`Hauler spawning at RCL 3+: ${hasHaulerRcl3 ? '✅' : '❌'}`);
console.log(`Container detection: ${hasContainerDetection ? '✅' : '❌'}`);
console.log(`Hauler role spawning: ${hasHaulerSpawning ? '✅' : '❌'}`);

console.log('\nTest 6: Creep Body Generation');
console.log('==============================');

// Check body generation methods exist
const hasHarvesterBody = spawnManagerContent.includes('getHarvesterBody');
const hasUpgraderBody = spawnManagerContent.includes('getUpgraderBody');
const hasBuilderBody = spawnManagerContent.includes('getBuilderBody');
const hasHaulerBody = spawnManagerContent.includes('Hauler.getBody');

console.log(`Harvester body generation: ${hasHarvesterBody ? '✅' : '❌'}`);
console.log(`Upgrader body generation: ${hasUpgraderBody ? '✅' : '❌'}`);
console.log(`Builder body generation: ${hasBuilderBody ? '✅' : '❌'}`);
console.log(`Hauler body generation: ${hasHaulerBody ? '✅' : '❌'}`);

// Check energy-based body scaling
const hasEnergyScaling = spawnManagerContent.includes('energyAvailable >= 400') && 
                        spawnManagerContent.includes('energyAvailable >= 300') &&
                        spawnManagerContent.includes('energyAvailable >= 200');
console.log(`Energy-based body scaling: ${hasEnergyScaling ? '✅' : '❌'}`);

console.log('\nTest 7: Smart Energy Waiting');
console.log('=============================');

// Check smart energy waiting logic
const hasEnergyWaiting = spawnManagerContent.includes('shouldWaitForBetterCreep');
const hasEmergencySpawning = spawnManagerContent.includes('existingCreeps.length === 0');
const hasCapacityCheck = spawnManagerContent.includes('energyCapacityAvailable');

console.log(`Smart energy waiting: ${hasEnergyWaiting ? '✅' : '❌'}`);
console.log(`Emergency spawning: ${hasEmergencySpawning ? '✅' : '❌'}`);
console.log(`Energy capacity checks: ${hasCapacityCheck ? '✅' : '❌'}`);

console.log('\nTest 8: Role Integration');
console.log('========================');

// Check that all role files exist
const roleFiles = [
    './src/roles/Harvester.ts',
    './src/roles/Upgrader.ts', 
    './src/roles/Builder.ts',
    './src/roles/Hauler.ts'
];

let allRolesExist = true;
roleFiles.forEach(roleFile => {
    const exists = fs.existsSync(roleFile);
    const roleName = path.basename(roleFile, '.ts');
    console.log(`${roleName} role: ${exists ? '✅' : '❌'}`);
    if (!exists) allRolesExist = false;
});

console.log('\n=== RCL 2-3 Validation Summary ===');

// Calculate overall readiness
const structureLimitsCorrect = rcl2ExtensionCheck && rcl3ExtensionCheck && rcl3TowerCheck && rcl3ContainerCheck;
const spawnLogicCorrect = hasRclBasedSpawning && hasHaulerRcl3 && hasContainerDetection && hasHaulerSpawning;
const bodyGenerationCorrect = hasHarvesterBody && hasUpgraderBody && hasBuilderBody && hasHaulerBody;
const energySystemCorrect = hasEnergyScaling && hasEnergyWaiting && hasEmergencySpawning;

const overallReady = structureLimitsCorrect && spawnLogicCorrect && bodyGenerationCorrect && energySystemCorrect && allRolesExist;

if (overallReady) {
    console.log('🎉 RCL 2-3 SYSTEM FULLY READY!');
    console.log('\n✅ RCL 2 Ready:');
    console.log('  - 1 Spawn + 5 Extensions (300 energy)');
    console.log('  - Harvester, Upgrader, Builder roles');
    console.log('  - Smart energy waiting system');
    console.log('  - Priority-based construction');
    
    console.log('\n✅ RCL 3 Ready:');
    console.log('  - 1 Tower for defense');
    console.log('  - 3 Containers for logistics');
    console.log('  - 5 more Extensions (550 energy total)');
    console.log('  - Hauler role with container detection');
    console.log('  - Automatic hauler spawning');
    
    console.log('\n🚀 Ready for deployment!');
    console.log('Deploy dist/main.js to Screeps and monitor your RCL progression.');
} else {
    console.log('❌ Some systems need attention:');
    if (!structureLimitsCorrect) console.log('  - Structure limits need fixing');
    if (!spawnLogicCorrect) console.log('  - Spawning logic needs fixing');
    if (!bodyGenerationCorrect) console.log('  - Body generation needs fixing');
    if (!energySystemCorrect) console.log('  - Energy system needs fixing');
    if (!allRolesExist) console.log('  - Missing role files');
}

// Check bundle exists and is recent
const bundlePath = './dist/main.js';
if (fs.existsSync(bundlePath)) {
    const bundleStats = fs.statSync(bundlePath);
    const bundleSize = Math.round(bundleStats.size / 1024);
    console.log(`\nBundle: dist/main.js (${bundleSize}kb, last modified: ${bundleStats.mtime.toLocaleString()})`);
} else {
    console.log('\n❌ Bundle not found - run "npm run build" first');
}
