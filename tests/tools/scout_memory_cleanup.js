// Scout Memory Cleanup Utility
// This script helps clean up old scout memory from the previous complex implementation
// and prepares the system for the new simple scout implementation

console.log('=== Scout Memory Cleanup Utility ===');

// This would be run in the Screeps console
const cleanupScript = `
// Scout Memory Cleanup - Run this in Screeps console

console.log('=== Scout Memory Cleanup ===');

// 1. Clean up existing scout creep memory
let scoutCreepsFound = 0;
let scoutCreepsCleaned = 0;

for (const creepName in Memory.creeps) {
  const creepMemory = Memory.creeps[creepName];
  if (creepMemory && creepMemory.role === 'scout') {
    scoutCreepsFound++;
    
    // Check if this is old complex scout memory
    const hasOldMemory = creepMemory.scoutingPhase || 
                        creepMemory.lastExplored || 
                        creepMemory.arrivalTick ||
                        creepMemory.explorationComplete;
    
    if (hasOldMemory) {
      console.log(\`Cleaning old scout memory for \${creepName}\`);
      
      // Keep essential properties, remove old complex ones
      const cleanMemory = {
        role: 'scout',
        homeRoom: creepMemory.homeRoom || 'unknown'
        // state will be initialized by new scout system
      };
      
      Memory.creeps[creepName] = cleanMemory;
      scoutCreepsCleaned++;
    }
  }
}

console.log(\`Scout creeps found: \${scoutCreepsFound}, cleaned: \${scoutCreepsCleaned}\`);

// 2. Clean up room scout data if needed (optional - new system is compatible)
let roomsWithScoutData = 0;
let roomsWithOldData = 0;

for (const roomName in Memory.rooms) {
  const roomMemory = Memory.rooms[roomName];
  if (roomMemory && roomMemory.scoutData) {
    roomsWithScoutData++;
    
    // Check for old complex scout data properties
    const hasOldData = roomMemory.scoutData.explorationComplete !== undefined ||
                      roomMemory.scoutData.sources && Array.isArray(roomMemory.scoutData.sources);
    
    if (hasOldData) {
      roomsWithOldData++;
      console.log(\`Room \${roomName} has old scout data - keeping it (new system is compatible)\`);
      // Note: We keep the old data as the new system can work with it
    }
  }
}

console.log(\`Rooms with scout data: \${roomsWithScoutData}, with old format: \${roomsWithOldData}\`);

// 3. Summary
console.log('=== Cleanup Summary ===');
console.log(\`✓ Scout creep memory: \${scoutCreepsCleaned} cleaned\`);
console.log(\`✓ Room scout data: Compatible (no cleanup needed)\`);
console.log('✓ New scout system ready to use existing data');
console.log('');
console.log('The new scout system will:');
console.log('- Initialize new state-based memory for scout creeps');
console.log('- Work with existing room scout data');
console.log('- Gradually update room data with new format');
console.log('');
console.log('No further action needed - deploy the new code!');
`;

console.log('Scout Memory Cleanup Script:');
console.log('Copy and paste the following into your Screeps console:');
console.log('');
console.log(cleanupScript);

// Also provide analysis of what the new system expects vs old system
console.log('\n=== Memory Format Comparison ===');

console.log('\nOLD Scout Creep Memory:');
console.log(`{
  role: 'scout',
  targetRoom: 'W36N32',
  homeRoom: 'W35N32',
  scoutingPhase: 'moving' | 'exploring' | 'returning',  // OLD
  lastExplored: 12345,                                  // OLD
  arrivalTick: 12340,                                   // OLD
  explorationComplete: true                             // OLD
}`);

console.log('\nNEW Scout Creep Memory:');
console.log(`{
  role: 'scout',
  targetRoom: 'W36N32',                    // SAME
  homeRoom: 'W35N32',                      // SAME
  state: 'idle' | 'moving' | 'exploring' | 'returning',  // NEW (simpler)
  explorationStartTick: 12345              // NEW (simpler timing)
}`);

console.log('\nRoom Scout Data:');
console.log('✓ NEW system is compatible with OLD room scout data');
console.log('✓ Will gradually update to new format as rooms are re-scouted');
console.log('✓ No manual cleanup required for room data');

console.log('\n=== Action Required ===');
console.log('1. Run the cleanup script in Screeps console (optional but recommended)');
console.log('2. Deploy the new scout code');
console.log('3. Existing scouts will automatically transition to new memory format');
console.log('4. New scouts will use the simple state-based system');
