// Test to verify the pos.lookFor fix in BaseLayoutPlanner
// This test simulates the scenario where RoomPosition objects from memory
// lose their prototype methods and need to be reconstructed

const { BaseLayoutPlanner } = require('./dist/planners/BaseLayoutPlanner');

// Mock Screeps API
global.LOOK_STRUCTURES = 'structures';
global.LOOK_CONSTRUCTION_SITES = 'constructionSites';
global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_EXTENSION = 'extension';

// Mock RoomPosition constructor
global.RoomPosition = class RoomPosition {
  constructor(x, y, roomName) {
    this.x = x;
    this.y = y;
    this.roomName = roomName;
  }
  
  lookFor(lookConstant) {
    // Mock implementation that returns empty arrays
    // In real Screeps, this would return actual structures/sites
    if (lookConstant === LOOK_STRUCTURES) {
      return []; // No existing structures
    }
    if (lookConstant === LOOK_CONSTRUCTION_SITES) {
      return []; // No existing construction sites
    }
    return [];
  }
};

// Mock Logger
global.Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
};

function testPositionLookForFix() {
  console.log('Testing pos.lookFor fix...');
  
  try {
    // Create a position object that simulates what comes from memory
    // (plain object without RoomPosition prototype methods)
    const memoryPosition = {
      x: 25,
      y: 25,
      roomName: 'W35N32'
    };
    
    // Test hasStructureAtPosition method
    console.log('Testing hasStructureAtPosition with memory position...');
    
    // This should not throw an error anymore
    const hasStructure = BaseLayoutPlanner.hasStructureAtPosition(
      null, // room parameter not used in the method
      memoryPosition,
      STRUCTURE_SPAWN
    );
    
    console.log(`✓ hasStructureAtPosition returned: ${hasStructure}`);
    
    // Test findConstructionSiteId method
    console.log('Testing findConstructionSiteId with memory position...');
    
    // This should not throw an error anymore
    const siteId = BaseLayoutPlanner.findConstructionSiteId(
      null, // room parameter not used in the method
      memoryPosition,
      STRUCTURE_EXTENSION
    );
    
    console.log(`✓ findConstructionSiteId returned: ${siteId}`);
    
    console.log('✅ All tests passed! The pos.lookFor fix is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  const success = testPositionLookForFix();
  process.exit(success ? 0 : 1);
}

module.exports = { testPositionLookForFix };
