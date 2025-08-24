// Test script to verify priority-based building system for creeps
// This test simulates the Builder role's priority-based construction site targeting

// Mock Screeps API for testing
const mockGame = {
  time: 1000,
  rooms: {}
};

const mockMemory = {
  rooms: {}
};

// Mock room with construction sites and room plan
function createMockRoom(roomName) {
  const room = {
    name: roomName,
    find: function(findType) {
      if (findType === 'FIND_CONSTRUCTION_SITES') {
        return this.constructionSites || [];
      }
      return [];
    },
    constructionSites: []
  };
  
  mockGame.rooms[roomName] = room;
  return room;
}

// Mock creep
function createMockCreep(roomName, x, y) {
  const room = mockGame.rooms[roomName];
  return {
    room: room,
    pos: {
      x: x,
      y: y,
      getRangeTo: function(pos) {
        return Math.abs(this.x - pos.x) + Math.abs(this.y - pos.y);
      },
      findPathTo: function(pos) {
        // Simple mock - assume all positions are reachable
        return [{ x: pos.x, y: pos.y }];
      },
      findClosestByPath: function(targets) {
        if (!targets || targets.length === 0) return null;
        
        let closest = targets[0];
        let closestDistance = this.getRangeTo(closest.pos);
        
        for (let i = 1; i < targets.length; i++) {
          const distance = this.getRangeTo(targets[i].pos);
          if (distance < closestDistance) {
            closest = targets[i];
            closestDistance = distance;
          }
        }
        
        return closest;
      }
    },
    memory: {
      working: true
    }
  };
}

// Mock construction site
function createMockConstructionSite(x, y, structureType) {
  return {
    pos: { x: x, y: y },
    structureType: structureType,
    id: `site_${x}_${y}_${structureType}`
  };
}

// Simplified version of the Builder's findHighestPriorityConstructionSite method
function findHighestPriorityConstructionSite(creep) {
  const room = creep.room;
  const roomMemory = mockMemory.rooms[room.name];
  
  // Get all construction sites in the room
  const constructionSites = room.find('FIND_CONSTRUCTION_SITES');
  if (constructionSites.length === 0) {
    return null;
  }

  // If no room plan exists, fall back to closest site
  if (!roomMemory || !roomMemory.plan) {
    return creep.pos.findClosestByPath(constructionSites) || null;
  }

  // Create a map of construction sites with their priorities
  const sitesWithPriority = [];

  for (const site of constructionSites) {
    let priority = 0;
    
    // Find priority from planned buildings
    const plannedBuilding = roomMemory.plan.buildings.find(building => 
      building.pos.x === site.pos.x && 
      building.pos.y === site.pos.y && 
      building.structureType === site.structureType
    );
    
    if (plannedBuilding) {
      priority = plannedBuilding.priority;
    } else {
      // Find priority from planned roads
      const plannedRoad = roomMemory.plan.roads.find(road => 
        road.pos.x === site.pos.x && 
        road.pos.y === site.pos.y
      );
      
      if (plannedRoad) {
        priority = plannedRoad.priority;
      }
    }

    // Calculate distance for tie-breaking
    const distance = creep.pos.getRangeTo(site.pos);
    
    sitesWithPriority.push({
      site,
      priority,
      distance
    });
  }

  // Sort by priority (highest first), then by distance (closest first)
  sitesWithPriority.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return a.distance - b.distance; // Closer first for same priority
  });

  // Return the highest priority site that's reachable
  for (const item of sitesWithPriority) {
    const path = creep.pos.findPathTo(item.site.pos);
    if (path.length > 0) {
      return item.site;
    }
  }

  // If no sites are reachable, return the highest priority one anyway
  return sitesWithPriority.length > 0 ? sitesWithPriority[0].site : null;
}

// Test scenarios
function runTests() {
  console.log('=== Testing Priority-Based Building System ===\n');

  // Test 1: Priority-based selection
  console.log('Test 1: Priority-based construction site selection');
  
  const room1 = createMockRoom('W1N1');
  const creep1 = createMockCreep('W1N1', 25, 25);
  
  // Add construction sites with different priorities
  const spawn = createMockConstructionSite(20, 20, 'spawn');
  const extension1 = createMockConstructionSite(22, 22, 'extension');
  const extension2 = createMockConstructionSite(23, 23, 'extension');
  const road1 = createMockConstructionSite(21, 21, 'road');
  const road2 = createMockConstructionSite(24, 24, 'road');
  
  room1.constructionSites = [spawn, extension1, extension2, road1, road2];
  
  // Set up room plan with priorities
  mockMemory.rooms['W1N1'] = {
    plan: {
      buildings: [
        { pos: { x: 20, y: 20 }, structureType: 'spawn', priority: 100 },
        { pos: { x: 22, y: 22 }, structureType: 'extension', priority: 80 },
        { pos: { x: 23, y: 23 }, structureType: 'extension', priority: 75 }
      ],
      roads: [
        { pos: { x: 21, y: 21 }, priority: 90 },
        { pos: { x: 24, y: 24 }, priority: 60 }
      ]
    }
  };
  
  const selectedSite = findHighestPriorityConstructionSite(creep1);
  
  console.log(`Selected construction site: ${selectedSite.structureType} at (${selectedSite.pos.x}, ${selectedSite.pos.y})`);
  console.log(`Expected: spawn at (20, 20) - highest priority (100)`);
  console.log(`Result: ${selectedSite.structureType === 'spawn' && selectedSite.pos.x === 20 && selectedSite.pos.y === 20 ? 'PASS' : 'FAIL'}\n`);

  // Test 2: Distance tie-breaking for same priority
  console.log('Test 2: Distance tie-breaking for same priority');
  
  const room2 = createMockRoom('W2N2');
  const creep2 = createMockCreep('W2N2', 25, 25);
  
  const ext1 = createMockConstructionSite(26, 26, 'extension'); // Distance 2
  const ext2 = createMockConstructionSite(30, 30, 'extension'); // Distance 10
  
  room2.constructionSites = [ext1, ext2];
  
  mockMemory.rooms['W2N2'] = {
    plan: {
      buildings: [
        { pos: { x: 26, y: 26 }, structureType: 'extension', priority: 80 },
        { pos: { x: 30, y: 30 }, structureType: 'extension', priority: 80 }
      ],
      roads: []
    }
  };
  
  const selectedSite2 = findHighestPriorityConstructionSite(creep2);
  
  console.log(`Selected construction site: ${selectedSite2.structureType} at (${selectedSite2.pos.x}, ${selectedSite2.pos.y})`);
  console.log(`Expected: extension at (26, 26) - closer with same priority`);
  console.log(`Result: ${selectedSite2.pos.x === 26 && selectedSite2.pos.y === 26 ? 'PASS' : 'FAIL'}\n`);

  // Test 3: Fallback to closest when no plan exists
  console.log('Test 3: Fallback to closest when no room plan exists');
  
  const room3 = createMockRoom('W3N3');
  const creep3 = createMockCreep('W3N3', 25, 25);
  
  const site1 = createMockConstructionSite(26, 26, 'extension'); // Distance 2
  const site2 = createMockConstructionSite(30, 30, 'container'); // Distance 10
  
  room3.constructionSites = [site1, site2];
  
  // No room plan
  mockMemory.rooms['W3N3'] = {};
  
  const selectedSite3 = findHighestPriorityConstructionSite(creep3);
  
  console.log(`Selected construction site: ${selectedSite3.structureType} at (${selectedSite3.pos.x}, ${selectedSite3.pos.y})`);
  console.log(`Expected: extension at (26, 26) - closest site`);
  console.log(`Result: ${selectedSite3.pos.x === 26 && selectedSite3.pos.y === 26 ? 'PASS' : 'FAIL'}\n`);

  // Test 4: Mixed building and road priorities
  console.log('Test 4: Mixed building and road priorities');
  
  const room4 = createMockRoom('W4N4');
  const creep4 = createMockCreep('W4N4', 25, 25);
  
  const building = createMockConstructionSite(20, 20, 'extension');
  const road = createMockConstructionSite(21, 21, 'road');
  
  room4.constructionSites = [building, road];
  
  mockMemory.rooms['W4N4'] = {
    plan: {
      buildings: [
        { pos: { x: 20, y: 20 }, structureType: 'extension', priority: 70 }
      ],
      roads: [
        { pos: { x: 21, y: 21 }, priority: 100 } // Source road - highest priority
      ]
    }
  };
  
  const selectedSite4 = findHighestPriorityConstructionSite(creep4);
  
  console.log(`Selected construction site: ${selectedSite4.structureType} at (${selectedSite4.pos.x}, ${selectedSite4.pos.y})`);
  console.log(`Expected: road at (21, 21) - highest priority (100)`);
  console.log(`Result: ${selectedSite4.structureType === 'road' && selectedSite4.pos.x === 21 && selectedSite4.pos.y === 21 ? 'PASS' : 'FAIL'}\n`);

  console.log('=== Priority-Based Building System Tests Complete ===');
}

// Run the tests
runTests();
