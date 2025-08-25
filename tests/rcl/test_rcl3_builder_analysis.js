// Test to analyze RCL3 builder spawning issue
// Problem: User reports only 1 builder at RCL3, but system should spawn more

// Mock Screeps constants for Node.js environment
const FIND_SOURCES = 'sources';
const FIND_CONSTRUCTION_SITES = 'construction_sites';

console.log('=== RCL3 Builder Spawning Analysis ===');

// Simulate RCL3 room conditions
const mockRoom = {
  controller: { level: 3 },
  find: (type) => {
    if (type === FIND_SOURCES) {
      return [{ id: 'source1' }, { id: 'source2' }]; // 2 sources
    }
    if (type === FIND_CONSTRUCTION_SITES) {
      // RCL3 typically has many construction sites (towers, extensions, roads)
      return new Array(15).fill(null).map((_, i) => ({ id: `site${i}` }));
    }
    return [];
  }
};

// Simulate SpawnManager calculateRequiredCreeps logic for RCL3
function calculateRequiredCreeps(room) {
  const rcl = room.controller.level;
  const sources = room.find(FIND_SOURCES);
  const sourceCount = sources.length;
  const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

  console.log(`Room RCL: ${rcl}`);
  console.log(`Sources: ${sourceCount}`);
  console.log(`Construction Sites: ${constructionSites.length}`);

  let requiredCreeps = {};

  if (rcl === 1) {
    requiredCreeps['harvester'] = Math.max(2, sourceCount * 2);
  } else {
    // RCL2+: Specialized roles
    requiredCreeps['harvester'] = sourceCount;
    
    if (rcl === 2) {
      requiredCreeps['upgrader'] = constructionSites.length > 5 ? 2 : 3;
    } else {
      requiredCreeps['upgrader'] = rcl >= 3 ? 2 : 1; // This line is wrong!
    }
    
    // Builder logic - THIS IS THE PROBLEM
    if (constructionSites.length > 0) {
      requiredCreeps['builder'] = constructionSites.length > 3 ? 2 : 1;
    } else {
      requiredCreeps['builder'] = rcl >= 3 ? 1 : 0;
    }
  }

  return requiredCreeps;
}

const required = calculateRequiredCreeps(mockRoom);
console.log('\n=== Current Logic Results ===');
console.log('Required creeps:', required);

console.log('\n=== PROBLEM IDENTIFIED ===');
console.log('1. Upgrader logic: rcl >= 3 ? 2 : 1');
console.log('   - At RCL3, this gives 2 upgraders (correct)');
console.log('   - But at RCL2, this gives 1 upgrader (should be 2-3)');

console.log('\n2. Builder logic with 15 construction sites:');
console.log('   - constructionSites.length > 3 ? 2 : 1');
console.log('   - 15 > 3 = true, so 2 builders');
console.log('   - This seems correct, but maybe not enough for RCL3');

console.log('\n=== RECOMMENDED FIX ===');
console.log('RCL3 should have more builders due to:');
console.log('- Tower construction (high priority)');
console.log('- 10 extensions vs 5 at RCL2');
console.log('- More roads needed');
console.log('- Container construction');

// Test improved logic
function calculateImprovedCreeps(room) {
  const rcl = room.controller.level;
  const sources = room.find(FIND_SOURCES);
  const sourceCount = sources.length;
  const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

  let requiredCreeps = {};

  if (rcl === 1) {
    requiredCreeps['harvester'] = Math.max(2, sourceCount * 2);
  } else {
    requiredCreeps['harvester'] = sourceCount;
    
    // Fixed upgrader logic
    if (rcl === 2) {
      requiredCreeps['upgrader'] = constructionSites.length > 5 ? 2 : 3;
    } else if (rcl === 3) {
      // RCL3: More upgraders for faster progression to RCL4
      requiredCreeps['upgrader'] = constructionSites.length > 10 ? 2 : 3;
    } else {
      requiredCreeps['upgrader'] = 2; // RCL4+
    }
    
    // Improved builder logic for RCL3
    if (constructionSites.length > 0) {
      if (rcl >= 3) {
        // RCL3+: More builders due to complexity
        if (constructionSites.length > 10) {
          requiredCreeps['builder'] = 3; // Heavy construction phase
        } else if (constructionSites.length > 5) {
          requiredCreeps['builder'] = 2; // Moderate construction
        } else {
          requiredCreeps['builder'] = 1; // Light construction
        }
      } else {
        // RCL2: Original logic
        requiredCreeps['builder'] = constructionSites.length > 3 ? 2 : 1;
      }
    } else {
      // No construction: Maintenance builders
      requiredCreeps['builder'] = rcl >= 3 ? 1 : 0;
    }
  }

  return requiredCreeps;
}

const improved = calculateImprovedCreeps(mockRoom);
console.log('\n=== IMPROVED Logic Results ===');
console.log('Required creeps:', improved);

console.log('\n=== COMPARISON ===');
console.log(`Builders: ${required.builder} -> ${improved.builder} (+${improved.builder - required.builder})`);
console.log(`Upgraders: ${required.upgrader} -> ${improved.upgrader} (+${improved.upgrader - required.upgrader})`);

console.log('\n=== CONCLUSION ===');
console.log('The current logic gives only 2 builders for 15 construction sites at RCL3.');
console.log('RCL3 needs more builders due to increased complexity:');
console.log('- Towers (critical infrastructure)');
console.log('- Double the extensions (10 vs 5)');
console.log('- More roads and containers');
console.log('- Larger room layouts');
console.log('\nRecommendation: Increase builders to 3 for heavy construction phases at RCL3+');
