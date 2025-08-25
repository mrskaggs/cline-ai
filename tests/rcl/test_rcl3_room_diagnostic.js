// Comprehensive diagnostic tool for RCL3 building placement issues
// This script can be run in the Screeps console to diagnose real room issues

console.log('=== RCL3 Room Diagnostic Tool ===');
console.log('Copy and paste this into your Screeps console to diagnose building placement issues');
console.log('');
console.log('// ===== SCREEPS CONSOLE SCRIPT START =====');
console.log('');
console.log(`
// RCL3 Room Diagnostic Script
// Replace 'W35N32' with your actual room name
const roomName = 'W35N32'; // CHANGE THIS TO YOUR ROOM NAME
const room = Game.rooms[roomName];

if (!room) {
  console.log('❌ Room not found or not visible. Make sure you own/have vision of the room.');
} else {
  console.log('=== RCL3 Room Diagnostic Results ===');
  
  // Basic room info
  const rcl = room.controller ? room.controller.level : 0;
  const energyCapacity = room.energyCapacityAvailable;
  const energyAvailable = room.energyAvailable;
  
  console.log(\`Room: \${roomName}\`);
  console.log(\`RCL: \${rcl}\`);
  console.log(\`Energy: \${energyAvailable}/\${energyCapacity}\`);
  
  if (rcl !== 3) {
    console.log(\`⚠️  Room is not RCL 3 (it's RCL \${rcl})\`);
  }
  
  // Check existing structures
  const structures = room.find(FIND_MY_STRUCTURES);
  const structureCounts = {};
  structures.forEach(s => {
    structureCounts[s.structureType] = (structureCounts[s.structureType] || 0) + 1;
  });
  
  console.log('\\n=== Existing Structures ===');
  console.log('Spawns:', structureCounts[STRUCTURE_SPAWN] || 0);
  console.log('Extensions:', structureCounts[STRUCTURE_EXTENSION] || 0);
  console.log('Towers:', structureCounts[STRUCTURE_TOWER] || 0);
  console.log('Containers:', structureCounts[STRUCTURE_CONTAINER] || 0);
  
  // Check construction sites
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
  const siteCounts = {};
  sites.forEach(s => {
    siteCounts[s.structureType] = (siteCounts[s.structureType] || 0) + 1;
  });
  
  console.log('\\n=== Construction Sites ===');
  console.log('Total sites:', sites.length);
  console.log('Extensions:', siteCounts[STRUCTURE_EXTENSION] || 0);
  console.log('Towers:', siteCounts[STRUCTURE_TOWER] || 0);
  console.log('Containers:', siteCounts[STRUCTURE_CONTAINER] || 0);
  
  // Check room memory plan
  const plan = room.memory.plan;
  if (!plan) {
    console.log('\\n❌ No room plan found in memory!');
    console.log('This could be why buildings aren\\'t being placed.');
    console.log('The room needs to be planned first.');
  } else {
    console.log('\\n=== Room Plan Analysis ===');
    console.log(\`Plan RCL: \${plan.rcl}\`);
    console.log(\`Plan Status: \${plan.status}\`);
    console.log(\`Last Updated: \${Game.time - plan.lastUpdated} ticks ago\`);
    console.log(\`Total Buildings in Plan: \${plan.buildings.length}\`);
    
    // Analyze buildings in plan
    const planCounts = {};
    const placedCounts = {};
    const unplacedCounts = {};
    
    plan.buildings.forEach(b => {
      planCounts[b.structureType] = (planCounts[b.structureType] || 0) + 1;
      if (b.placed) {
        placedCounts[b.structureType] = (placedCounts[b.structureType] || 0) + 1;
      } else {
        unplacedCounts[b.structureType] = (unplacedCounts[b.structureType] || 0) + 1;
      }
    });
    
    console.log('\\n=== Planned Buildings ===');
    console.log('Extensions:', planCounts[STRUCTURE_EXTENSION] || 0, 
                '(placed:', placedCounts[STRUCTURE_EXTENSION] || 0, 
                ', unplaced:', unplacedCounts[STRUCTURE_EXTENSION] || 0, ')');
    console.log('Towers:', planCounts[STRUCTURE_TOWER] || 0,
                '(placed:', placedCounts[STRUCTURE_TOWER] || 0,
                ', unplaced:', unplacedCounts[STRUCTURE_TOWER] || 0, ')');
    console.log('Containers:', planCounts[STRUCTURE_CONTAINER] || 0,
                '(placed:', placedCounts[STRUCTURE_CONTAINER] || 0,
                ', unplaced:', unplacedCounts[STRUCTURE_CONTAINER] || 0, ')');
    
    // Check if plan needs updating
    if (plan.rcl < rcl) {
      console.log(\`\\n⚠️  Plan is outdated! Plan RCL: \${plan.rcl}, Current RCL: \${rcl}\`);
      console.log('The room needs to be replanned to get RCL 3 buildings.');
    }
    
    // Check unplaced high-priority buildings
    const unplacedHighPriority = plan.buildings.filter(b => 
      !b.placed && 
      (b.structureType === STRUCTURE_TOWER || b.structureType === STRUCTURE_CONTAINER) &&
      b.rclRequired <= rcl
    );
    
    if (unplacedHighPriority.length > 0) {
      console.log('\\n⚠️  Unplaced RCL3 Buildings Found:');
      unplacedHighPriority.forEach(b => {
        console.log(\`- \${b.structureType} at \${b.pos.x},\${b.pos.y} (priority: \${b.priority}, RCL req: \${b.rclRequired})\`);
        
        // Check why this building isn't placed
        const pos = new RoomPosition(b.pos.x, b.pos.y, roomName);
        const terrain = room.getTerrain().get(pos.x, pos.y);
        const structures = pos.lookFor(LOOK_STRUCTURES);
        const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const creeps = pos.lookFor(LOOK_CREEPS);
        
        if (terrain & TERRAIN_MASK_WALL) {
          console.log(\`  ❌ Position is a wall\`);
        } else if (structures.length > 0) {
          console.log(\`  ❌ Position blocked by: \${structures.map(s => s.structureType).join(', ')}\`);
        } else if (constructionSites.length > 0) {
          console.log(\`  ❌ Position has construction site: \${constructionSites.map(s => s.structureType).join(', ')}\`);
        } else if (creeps.length > 0) {
          console.log(\`  ❌ Position blocked by creeps\`);
        } else {
          console.log(\`  ✅ Position appears clear - should be buildable\`);
        }
      });
    }
  }
  
  // Check RCL3 structure limits
  console.log('\\n=== RCL3 Structure Limits Check ===');
  const limits = {
    [STRUCTURE_EXTENSION]: 10,
    [STRUCTURE_TOWER]: 1,
    [STRUCTURE_CONTAINER]: 5
  };
  
  Object.entries(limits).forEach(([type, limit]) => {
    const existing = structureCounts[type] || 0;
    const sites = siteCounts[type] || 0;
    const total = existing + sites;
    const remaining = limit - total;
    
    console.log(\`\${type}: \${existing} built + \${sites} sites = \${total}/\${limit} (can build \${Math.max(0, remaining)} more)\`);
    
    if (type === STRUCTURE_TOWER && total === 0) {
      console.log('  ❌ NO TOWERS! This is the main issue.');
    }
    if (type === STRUCTURE_CONTAINER && total === 0) {
      console.log('  ❌ NO CONTAINERS! Missing logistics infrastructure.');
    }
  });
  
  // Recommendations
  console.log('\\n=== Recommendations ===');
  
  if (!plan) {
    console.log('1. ❗ CRITICAL: Room has no plan. The planning system needs to run.');
    console.log('   - Wait for the next planning cycle, or force a replan');
  } else if (plan.rcl < rcl) {
    console.log('1. ❗ CRITICAL: Plan is outdated. Force a replan to get RCL3 buildings.');
    console.log('   - Delete room.memory.plan to force replanning');
  } else if ((structureCounts[STRUCTURE_TOWER] || 0) === 0 && (siteCounts[STRUCTURE_TOWER] || 0) === 0) {
    console.log('1. ❗ CRITICAL: No towers planned or built.');
    console.log('   - Check if tower positions are blocked');
    console.log('   - Verify construction site limits aren\\'t reached');
  }
  
  if (sites.length >= 100) {
    console.log('2. ⚠️  Too many construction sites. Some buildings may be waiting.');
  }
  
  console.log('\\n=== Quick Fixes ===');
  console.log('// Force replan (clears old plan):');
  console.log(\`delete Game.rooms['\${roomName}'].memory.plan;\`);
  console.log('');
  console.log('// Check construction site limit:');
  console.log(\`console.log('Construction sites:', Game.rooms['\${roomName}'].find(FIND_MY_CONSTRUCTION_SITES).length);\`);
}
`);
console.log('');
console.log('// ===== SCREEPS CONSOLE SCRIPT END =====');
console.log('');
console.log('Instructions:');
console.log('1. Copy the script above (between START and END)');
console.log('2. Change the roomName variable to your actual room name');
console.log('3. Paste and run it in your Screeps console');
console.log('4. Review the diagnostic results');
console.log('5. Follow the recommendations to fix the issue');
