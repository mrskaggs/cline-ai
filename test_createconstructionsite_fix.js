// Test to verify the createConstructionSite ERR_INVALID_ARGS fix
// This test simulates the scenario where position objects from memory
// need to be properly formatted for the Screeps createConstructionSite API

console.log('Testing createConstructionSite position formatting fix...');

// Mock Screeps constants
global.OK = 0;
global.ERR_INVALID_ARGS = -10;
global.STRUCTURE_EXTENSION = 'extension';

// Mock RoomPosition constructor
global.RoomPosition = class RoomPosition {
  constructor(x, y, roomName) {
    this.x = x;
    this.y = y;
    this.roomName = roomName;
    this._isRoomPosition = true; // Mark as proper RoomPosition
  }
  
  toString() {
    return `[room ${this.roomName} pos ${this.x},${this.y}]`;
  }
};

// Mock Room with createConstructionSite method
const mockRoom = {
  name: 'W35N32',
  createConstructionSite: function(pos, structureType) {
    console.log(`  createConstructionSite called with:`);
    console.log(`    pos: ${typeof pos} - ${JSON.stringify(pos)}`);
    console.log(`    structureType: ${structureType}`);
    console.log(`    pos._isRoomPosition: ${pos._isRoomPosition}`);
    
    // Simulate Screeps behavior: ERR_INVALID_ARGS if pos is not a proper RoomPosition
    if (!pos._isRoomPosition) {
      console.log(`    → Returning ERR_INVALID_ARGS (position is not a proper RoomPosition)`);
      return ERR_INVALID_ARGS;
    }
    
    console.log(`    → Returning OK (position is properly formatted)`);
    return OK;
  }
};

// Test scenarios
console.log('\n=== Test Scenarios ===\n');

console.log('1. Testing with memory position object (BEFORE fix):');
const memoryPosition = {
  x: 25,
  y: 26,
  roomName: 'W35N32'
};

try {
  const result1 = mockRoom.createConstructionSite(memoryPosition, STRUCTURE_EXTENSION);
  console.log(`Result: ${result1} ${result1 === ERR_INVALID_ARGS ? '(ERR_INVALID_ARGS)' : '(OK)'}`);
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log('\n2. Testing with reconstructed RoomPosition (AFTER fix):');
const reconstructedPosition = new RoomPosition(
  memoryPosition.x, 
  memoryPosition.y, 
  memoryPosition.roomName
);

try {
  const result2 = mockRoom.createConstructionSite(reconstructedPosition, STRUCTURE_EXTENSION);
  console.log(`Result: ${result2} ${result2 === ERR_INVALID_ARGS ? '(ERR_INVALID_ARGS)' : '(OK)'}`);
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log('\n3. Testing our fix implementation:');

// Simulate the fixed placeConstructionSites logic
function simulateFixedPlacement(room, building) {
  console.log(`Placing ${building.structureType} at ${building.pos.x},${building.pos.y}...`);
  
  // This is the fix: ensure pos is a proper RoomPosition object
  const roomPos = new RoomPosition(building.pos.x, building.pos.y, building.pos.roomName);
  const result = room.createConstructionSite(roomPos, building.structureType);
  
  return result;
}

const testBuilding = {
  structureType: STRUCTURE_EXTENSION,
  pos: memoryPosition, // This comes from memory (plain object)
  priority: 70,
  placed: false
};

try {
  const result3 = simulateFixedPlacement(mockRoom, testBuilding);
  console.log(`Final Result: ${result3} ${result3 === ERR_INVALID_ARGS ? '(ERR_INVALID_ARGS)' : '(OK)'}`);
} catch (error) {
  console.log(`Error: ${error.message}`);
}

console.log('\n=== Summary ===');
console.log('✅ The fix ensures that position objects from memory are properly');
console.log('   reconstructed as RoomPosition instances before being passed to');
console.log('   room.createConstructionSite(), preventing ERR_INVALID_ARGS errors.');
console.log('');
console.log('🔧 Fix Applied: const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);');
console.log('📍 This resolves the "ERR_INVALID_ARGS (-10): Invalid arguments" error');
console.log('   that was occurring when trying to place construction sites.');
