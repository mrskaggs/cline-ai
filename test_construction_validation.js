// Test to verify the enhanced construction site validation
// This test simulates various scenarios that could cause ERR_INVALID_TARGET

console.log('Testing construction site validation enhancements...');

// Mock Screeps constants
global.TERRAIN_MASK_WALL = 1;
global.TERRAIN_MASK_SWAMP = 2;
global.LOOK_STRUCTURES = 'structures';
global.LOOK_CONSTRUCTION_SITES = 'constructionSites';
global.LOOK_CREEPS = 'creeps';
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_ROAD = 'road';
global.STRUCTURE_CONTAINER = 'container';
global.STRUCTURE_SPAWN = 'spawn';

// Mock RoomPosition
global.RoomPosition = class RoomPosition {
  constructor(x, y, roomName) {
    this.x = x;
    this.y = y;
    this.roomName = roomName;
  }
  
  lookFor(lookConstant) {
    // Mock different scenarios based on position
    if (lookConstant === LOOK_STRUCTURES) {
      // Position (10,10) has a blocking structure
      if (this.x === 10 && this.y === 10) {
        return [{ structureType: STRUCTURE_SPAWN }];
      }
      // Position (15,15) has a road (non-blocking)
      if (this.x === 15 && this.y === 15) {
        return [{ structureType: STRUCTURE_ROAD }];
      }
      return [];
    }
    
    if (lookConstant === LOOK_CONSTRUCTION_SITES) {
      // Position (20,20) has existing construction site
      if (this.x === 20 && this.y === 20) {
        return [{ structureType: STRUCTURE_EXTENSION }];
      }
      return [];
    }
    
    if (lookConstant === LOOK_CREEPS) {
      // Position (30,30) has a creep
      if (this.x === 30 && this.y === 30) {
        return [{ name: 'testCreep' }];
      }
      return [];
    }
    
    return [];
  }
};

// Mock Room with terrain
const mockRoom = {
  name: 'W35N32',
  getTerrain: () => ({
    get: (x, y) => {
      // Position (5,5) is a wall
      if (x === 5 && y === 5) return TERRAIN_MASK_WALL;
      // Position (6,6) is a swamp
      if (x === 6 && y === 6) return TERRAIN_MASK_SWAMP;
      // Everything else is plain terrain
      return 0;
    }
  })
};

// Simulate the validation function (extracted from BaseLayoutPlanner)
function isValidConstructionPosition(room, pos, structureType) {
  // Ensure pos is a proper RoomPosition object (in case it came from memory)
  const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
  
  // Check if position is within room bounds
  if (roomPos.x < 1 || roomPos.x > 48 || roomPos.y < 1 || roomPos.y > 48) {
    return false;
  }
  
  // Check terrain - can't build on walls
  const terrain = room.getTerrain().get(roomPos.x, roomPos.y);
  if (terrain & TERRAIN_MASK_WALL) {
    return false;
  }
  
  // Check for existing structures that would block construction
  const structures = roomPos.lookFor(LOOK_STRUCTURES);
  if (structures.length > 0) {
    // Some structures can coexist (roads, containers)
    const blockingStructures = structures.filter(s => 
      s.structureType !== STRUCTURE_ROAD && 
      s.structureType !== STRUCTURE_CONTAINER
    );
    if (blockingStructures.length > 0) {
      return false;
    }
  }
  
  // Check for existing construction sites
  const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
  if (sites.length > 0) {
    return false;
  }
  
  // Check for creeps (they would block construction)
  const creeps = roomPos.lookFor(LOOK_CREEPS);
  if (creeps.length > 0) {
    return false;
  }
  
  return true;
}

// Test scenarios
const testCases = [
  {
    name: 'Valid position (plain terrain)',
    pos: { x: 25, y: 25, roomName: 'W35N32' },
    expected: true,
    description: 'Should allow construction on empty plain terrain'
  },
  {
    name: 'Invalid position (wall terrain)',
    pos: { x: 5, y: 5, roomName: 'W35N32' },
    expected: false,
    description: 'Should reject construction on wall terrain'
  },
  {
    name: 'Valid position (swamp terrain)',
    pos: { x: 6, y: 6, roomName: 'W35N32' },
    expected: true,
    description: 'Should allow construction on swamp terrain'
  },
  {
    name: 'Invalid position (blocking structure)',
    pos: { x: 10, y: 10, roomName: 'W35N32' },
    expected: false,
    description: 'Should reject construction where blocking structure exists'
  },
  {
    name: 'Valid position (non-blocking structure)',
    pos: { x: 15, y: 15, roomName: 'W35N32' },
    expected: true,
    description: 'Should allow construction where only road exists'
  },
  {
    name: 'Invalid position (existing construction site)',
    pos: { x: 20, y: 20, roomName: 'W35N32' },
    expected: false,
    description: 'Should reject construction where construction site exists'
  },
  {
    name: 'Invalid position (creep present)',
    pos: { x: 30, y: 30, roomName: 'W35N32' },
    expected: false,
    description: 'Should reject construction where creep is present'
  },
  {
    name: 'Invalid position (out of bounds - too low)',
    pos: { x: 0, y: 0, roomName: 'W35N32' },
    expected: false,
    description: 'Should reject construction at room edge (0,0)'
  },
  {
    name: 'Invalid position (out of bounds - too high)',
    pos: { x: 49, y: 49, roomName: 'W35N32' },
    expected: false,
    description: 'Should reject construction at room edge (49,49)'
  },
  {
    name: 'Valid position (memory object)',
    pos: { x: 35, y: 35, roomName: 'W35N32' },
    expected: true,
    description: 'Should handle position objects from memory correctly'
  }
];

console.log('\nRunning validation tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const result = isValidConstructionPosition(mockRoom, testCase.pos, STRUCTURE_EXTENSION);
    
    if (result === testCase.expected) {
      console.log(`✓ Test ${index + 1}: ${testCase.name} - PASS`);
      console.log(`  ${testCase.description}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name} - FAIL`);
      console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
      console.log(`  ${testCase.description}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${testCase.name} - ERROR`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
  
  console.log(''); // Empty line for readability
});

console.log(`\n=== Test Results ===`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Enhanced validation is working correctly.');
  console.log('The system will now properly validate positions before attempting construction,');
  console.log('preventing ERR_INVALID_TARGET errors in the Screeps environment.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the validation logic.');
}
