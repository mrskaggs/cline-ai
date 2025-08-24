// Test to verify existing structure detection is working correctly
// This will help us understand why the system is trying to place extensions where they already exist

// Mock Screeps globals
global.Game = { time: 1000 };
global.LOOK_STRUCTURES = 'structures';
global.LOOK_CONSTRUCTION_SITES = 'constructionSites';
global.FIND_MY_STRUCTURES = 'myStructures';
global.FIND_MY_CONSTRUCTION_SITES = 'myConstructionSites';

// Mock RoomPosition
global.RoomPosition = function(x, y, roomName) {
  this.x = x;
  this.y = y;
  this.roomName = roomName;
};

// Simulate room with existing extensions at RCL 2
const mockRoom = {
  name: 'W35N32',
  controller: { level: 2 },
  memory: {
    plan: {
      roomName: 'W35N32',
      rcl: 2,
      lastUpdated: Game.time - 100,
      buildings: [
        // 5 extensions from RCL2 template
        { structureType: 'extension', pos: { x: 22, y: 28, roomName: 'W35N32' }, priority: 2, rclRequired: 2, placed: false },
        { structureType: 'extension', pos: { x: 24, y: 28, roomName: 'W35N32' }, priority: 2, rclRequired: 2, placed: false },
        { structureType: 'extension', pos: { x: 23, y: 27, roomName: 'W35N32' }, priority: 2, rclRequired: 2, placed: false },
        { structureType: 'extension', pos: { x: 23, y: 29, roomName: 'W35N32' }, priority: 2, rclRequired: 2, placed: false },
        { structureType: 'extension', pos: { x: 22, y: 27, roomName: 'W35N32' }, priority: 3, rclRequired: 2, placed: false }
      ],
      roads: [],
      status: 'building',
      priority: 20
    }
  },
  find: function(findType) {
    if (findType === FIND_MY_STRUCTURES) {
      // Simulate 5 existing extensions at the planned positions
      return [
        { structureType: 'extension', pos: { x: 22, y: 28, roomName: 'W35N32' } },
        { structureType: 'extension', pos: { x: 24, y: 28, roomName: 'W35N32' } },
        { structureType: 'extension', pos: { x: 23, y: 27, roomName: 'W35N32' } },
        { structureType: 'extension', pos: { x: 23, y: 29, roomName: 'W35N32' } },
        { structureType: 'extension', pos: { x: 22, y: 27, roomName: 'W35N32' } }
      ];
    }
    if (findType === FIND_MY_CONSTRUCTION_SITES) {
      return []; // No construction sites
    }
    return [];
  },
  createConstructionSite: function(pos, structureType) {
    console.log(`Attempting to create ${structureType} at ${pos.x},${pos.y}`);
    return -14; // ERR_RCL_NOT_ENOUGH - this is what we're seeing
  }
};

// Mock RoomPosition.lookFor to simulate existing structures
const originalLookFor = RoomPosition.prototype.lookFor;
RoomPosition.prototype.lookFor = function(lookType) {
  if (lookType === LOOK_STRUCTURES) {
    // Check if this position has an existing extension
    const existingExtensions = [
      { x: 22, y: 28 }, { x: 24, y: 28 }, { x: 23, y: 27 }, 
      { x: 23, y: 29 }, { x: 22, y: 27 }
    ];
    
    const hasExtension = existingExtensions.some(ext => ext.x === this.x && ext.y === this.y);
    if (hasExtension) {
      return [{ structureType: 'extension' }];
    }
  }
  if (lookType === LOOK_CONSTRUCTION_SITES) {
    return []; // No construction sites
  }
  return [];
};

console.log('=== Testing Existing Structure Detection ===');

// Test the hasStructureAtPosition logic
function testHasStructureAtPosition(room, pos, structureType) {
  const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
  const structures = roomPos.lookFor(LOOK_STRUCTURES);
  const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
  
  const hasStructure = structures.some(s => s.structureType === structureType) ||
                      sites.some(s => s.structureType === structureType);
  
  console.log(`Position ${pos.x},${pos.y}: structures=${structures.length}, sites=${sites.length}, hasExtension=${hasStructure}`);
  return hasStructure;
}

// Test each planned extension position
mockRoom.memory.plan.buildings.forEach((building, index) => {
  console.log(`\nTesting building ${index + 1}: ${building.structureType} at ${building.pos.x},${building.pos.y}`);
  const hasExisting = testHasStructureAtPosition(mockRoom, building.pos, building.structureType);
  console.log(`Should skip this building: ${hasExisting}`);
});

// Test the filtering logic from placeConstructionSites
console.log('\n=== Testing Filtering Logic ===');
const currentRCL = mockRoom.controller.level;
const eligibleBuildings = mockRoom.memory.plan.buildings
  .filter(building => {
    const notPlaced = !building.placed;
    const rclOk = building.rclRequired <= currentRCL;
    const noExistingStructure = !testHasStructureAtPosition(mockRoom, building.pos, building.structureType);
    
    console.log(`Building ${building.structureType} at ${building.pos.x},${building.pos.y}:`);
    console.log(`  - Not placed: ${notPlaced}`);
    console.log(`  - RCL OK (${building.rclRequired} <= ${currentRCL}): ${rclOk}`);
    console.log(`  - No existing structure: ${noExistingStructure}`);
    console.log(`  - Eligible: ${notPlaced && rclOk && noExistingStructure}`);
    
    return notPlaced && rclOk && noExistingStructure;
  });

console.log(`\nTotal eligible buildings: ${eligibleBuildings.length}`);
console.log('This should be 0 if existing structure detection is working correctly!');

// Restore original lookFor
RoomPosition.prototype.lookFor = originalLookFor;

console.log('\n=== Test Complete ===');
console.log('If eligible buildings > 0, then the existing structure detection is not working properly.');
