// Simple validation script for the planning system
// This can be run in the Screeps console to test the implementation

// Test function to validate planning system integration
function testPlanningSystem() {
  console.log('=== Planning System Validation ===');
  
  // Check if all required classes are available
  const requiredClasses = [
    'TerrainAnalyzer',
    'BaseLayoutPlanner', 
    'RoadPlanner',
    'TrafficAnalyzer',
    'LayoutTemplates',
    'PathingUtils'
  ];
  
  let allClassesAvailable = true;
  
  for (const className of requiredClasses) {
    try {
      const classModule = require(`./src/planners/${className}`) || require(`./src/utils/${className}`);
      if (classModule[className]) {
        console.log(`✓ ${className} class loaded successfully`);
      } else {
        console.log(`✗ ${className} class not found in module`);
        allClassesAvailable = false;
      }
    } catch (error) {
      console.log(`✗ Failed to load ${className}: ${error.message}`);
      allClassesAvailable = false;
    }
  }
  
  // Test room processing if we have rooms
  if (Object.keys(Game.rooms).length > 0) {
    const roomName = Object.keys(Game.rooms)[0];
    const room = Game.rooms[roomName];
    
    if (room && room.controller && room.controller.my) {
      console.log(`\n=== Testing with room ${roomName} ===`);
      
      // Check room memory structure
      if (Memory.rooms[roomName]) {
        const roomMemory = Memory.rooms[roomName];
        console.log(`✓ Room memory exists`);
        
        if (roomMemory.plan) {
          console.log(`✓ Room plan exists with ${roomMemory.plan.buildings.length} buildings and ${roomMemory.plan.roads.length} roads`);
        } else {
          console.log(`- Room plan not yet initialized (will be created on next planning cycle)`);
        }
        
        if (roomMemory.trafficData) {
          const trafficPoints = Object.keys(roomMemory.trafficData).length;
          console.log(`✓ Traffic data exists with ${trafficPoints} tracked positions`);
        } else {
          console.log(`- Traffic data not yet initialized`);
        }
        
        if (roomMemory.layoutAnalysis) {
          console.log(`✓ Layout analysis exists`);
        } else {
          console.log(`- Layout analysis not yet performed`);
        }
      } else {
        console.log(`- Room memory not yet initialized`);
      }
      
      // Check construction sites
      const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
      console.log(`✓ Room has ${sites.length} construction sites`);
      
      // Check existing structures
      const structures = room.find(FIND_MY_STRUCTURES);
      const structureTypes = {};
      structures.forEach(s => {
        structureTypes[s.structureType] = (structureTypes[s.structureType] || 0) + 1;
      });
      console.log(`✓ Room structures:`, structureTypes);
    }
  } else {
    console.log('\n- No owned rooms available for testing');
  }
  
  // Check settings
  console.log(`\n=== Settings Validation ===`);
  console.log(`✓ Planning enabled: ${Settings.planning.enabled}`);
  console.log(`✓ Building planning: ${Settings.planning.buildingPlanningEnabled}`);
  console.log(`✓ Road planning: ${Settings.planning.roadPlanningEnabled}`);
  console.log(`✓ Traffic analysis: ${Settings.planning.trafficAnalysisEnabled}`);
  
  console.log('\n=== Validation Complete ===');
  return allClassesAvailable;
}

// Export for console use
global.testPlanningSystem = testPlanningSystem;

// Auto-run if in Screeps environment
if (typeof Game !== 'undefined') {
  testPlanningSystem();
}
