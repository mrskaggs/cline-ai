// Diagnostic script to understand the pos values issue
// This will help identify what those encoded position strings represent

console.log('=== Position Values Diagnostic ===');

// Test 1: Check what happens when we store RoomPosition objects in memory
console.log('\n🧪 Test 1: RoomPosition Memory Serialization');

// Create a test RoomPosition
const testPos = new RoomPosition(25, 30, 'W35N32');
console.log('Original RoomPosition:', testPos);
console.log('  x:', testPos.x);
console.log('  y:', testPos.y);
console.log('  roomName:', testPos.roomName);

// Simulate storing in memory (what Screeps does internally)
const memoryObject = {
  pos: testPos,
  otherData: 'test'
};

console.log('\nAfter storing in memory object:');
console.log('memoryObject.pos:', memoryObject.pos);
console.log('typeof memoryObject.pos:', typeof memoryObject.pos);

// Test 2: Check if the encoded strings can be decoded
console.log('\n🧪 Test 2: Encoded String Analysis');

const encodedExamples = ['1pfy', '1p1y', 'ipfy'];
for (const encoded of encodedExamples) {
  console.log(`\nAnalyzing encoded string: "${encoded}"`);
  console.log('  Length:', encoded.length);
  console.log('  Characters:', encoded.split('').join(', '));
  
  // Try to find patterns
  if (encoded.includes('p')) {
    const parts = encoded.split('p');
    console.log('  Split by "p":', parts);
    
    // Check if parts could be base-36 encoded coordinates
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part) {
        const decoded = parseInt(part, 36);
        console.log(`    Part ${i} "${part}" as base-36: ${decoded} (valid: ${!isNaN(decoded)})`);
      }
    }
  }
}

// Test 3: Check current memory structure
console.log('\n🧪 Test 3: Current Memory Analysis');

// Look for rooms with construction data
for (const roomName in Memory.rooms) {
  const roomMemory = Memory.rooms[roomName];
  if (roomMemory && roomMemory.plan && roomMemory.plan.buildings) {
    console.log(`\nRoom ${roomName} has ${roomMemory.plan.buildings.length} planned buildings`);
    
    // Check first few buildings for pos format
    for (let i = 0; i < Math.min(3, roomMemory.plan.buildings.length); i++) {
      const building = roomMemory.plan.buildings[i];
      console.log(`  Building ${i}:`, building.structureType);
      console.log(`    pos:`, building.pos);
      console.log(`    pos type:`, typeof building.pos);
      
      if (building.pos && typeof building.pos === 'object') {
        console.log(`    pos.x:`, building.pos.x);
        console.log(`    pos.y:`, building.pos.y);
        console.log(`    pos.roomName:`, building.pos.roomName);
      }
    }
    break; // Only check first room with data
  }
}

// Test 4: Check if this is related to construction sites
console.log('\n🧪 Test 4: Construction Site Analysis');

for (const roomName in Game.rooms) {
  const room = Game.rooms[roomName];
  if (room && room.controller && room.controller.my) {
    const sites = room.find(FIND_CONSTRUCTION_SITES);
    if (sites.length > 0) {
      console.log(`\nRoom ${roomName} has ${sites.length} construction sites`);
      
      for (let i = 0; i < Math.min(2, sites.length); i++) {
        const site = sites[i];
        console.log(`  Site ${i}: ${site.structureType} at ${site.pos.x},${site.pos.y}`);
        console.log(`    pos object:`, site.pos);
        console.log(`    pos type:`, typeof site.pos);
      }
    }
    break; // Only check first owned room
  }
}

// Test 5: Check if encoded strings appear in specific memory locations
console.log('\n🧪 Test 5: Memory Search for Encoded Strings');

function searchMemoryForEncodedStrings(obj, path = '') {
  if (typeof obj === 'string' && /\w*p\w*/.test(obj) && obj.length < 10) {
    console.log(`  Found potential encoded string at ${path}: "${obj}"`);
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        searchMemoryForEncodedStrings(obj[key], path ? `${path}.${key}` : key);
      }
    }
  }
}

console.log('Searching Memory.rooms for encoded strings...');
searchMemoryForEncodedStrings(Memory.rooms, 'Memory.rooms');

console.log('Searching Memory.creeps for encoded strings...');
searchMemoryForEncodedStrings(Memory.creeps, 'Memory.creeps');

// Test 6: Recommendations
console.log('\n📋 Analysis Summary:');
console.log('1. Your codebase uses standard RoomPosition objects with x, y, roomName properties');
console.log('2. No custom position encoding found in your TypeScript source code');
console.log('3. The encoded strings like "1pfy" are likely Screeps internal serialization');
console.log('4. This could be happening during memory storage/retrieval or in the game console display');

console.log('\n💡 Recommendations:');
console.log('1. Check if these values appear in the actual game memory or just in console display');
console.log('2. Verify that RoomPosition objects are being properly reconstructed when retrieved from memory');
console.log('3. The Memory Bank mentions "Memory Serialization Safety" - this might be related');
console.log('4. If causing issues, ensure all memory positions are reconstructed as proper RoomPosition objects');

console.log('\n=== Diagnostic Complete ===');
