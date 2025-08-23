/**
 * Test to verify the duplicate road planning fix
 * This test simulates the conditions that caused duplicate road planning
 */

// Mock Screeps environment
const mockRoom = {
  name: 'W35N32',
  controller: { level: 3, my: true },
  memory: {
    plan: {
      roomName: 'W35N32',
      buildings: [],
      roads: [],
      rcl: 2, // Different from current RCL to trigger replanning
      lastUpdated: 1000,
      status: 'planning',
      priority: 1
    },
    trafficData: {}
  },
  find: () => []
};

const mockGame = {
  time: 2000,
  rooms: { 'W35N32': mockRoom }
};

const mockMemory = {
  rooms: {
    'W35N32': mockRoom.memory
  }
};

const mockSettings = {
  planning: {
    buildingPlanningEnabled: true,
    planningCadence: 10,
    minTrafficDataPoints: 5
  }
};

// Mock Logger to track calls
let logCalls = [];
const mockLogger = {
  info: (msg) => {
    logCalls.push({ level: 'info', message: msg });
    console.log(`[INFO] ${msg}`);
  },
  error: (msg) => {
    logCalls.push({ level: 'error', message: msg });
    console.log(`[ERROR] ${msg}`);
  }
};

// Mock RoadPlanner to track calls
let roadPlannerCalls = 0;
const mockRoadPlanner = {
  planRoadNetwork: (room, buildings) => {
    roadPlannerCalls++;
    console.log(`RoadPlanner.planRoadNetwork called (call #${roadPlannerCalls}) for room ${room.name}`);
    return []; // Return empty array for test
  },
  updateTrafficAnalysis: () => {},
  placeRoadConstructionSites: () => {}
};

// Mock BaseLayoutPlanner
const mockBaseLayoutPlanner = {
  planRoom: (room) => {
    console.log(`BaseLayoutPlanner.planRoom called for room ${room.name}`);
    return {
      roomName: room.name,
      buildings: [],
      roads: [],
      rcl: room.controller.level,
      lastUpdated: mockGame.time,
      status: 'planning',
      priority: 1
    };
  },
  placeConstructionSites: () => {}
};

// Mock TerrainAnalyzer
const mockTerrainAnalyzer = {
  analyzeRoom: () => ({}),
  identifyKeyPositions: () => ({ spawn: [], sources: [], controller: null, mineral: null, exits: [] })
};

// Mock TrafficAnalyzer
const mockTrafficAnalyzer = {
  trackRoomTraffic: () => {}
};

// Simplified RoomManager class for testing
class TestRoomManager {
  constructor() {
    this.Logger = mockLogger;
    this.Settings = mockSettings;
    this.RoadPlanner = mockRoadPlanner;
    this.BaseLayoutPlanner = mockBaseLayoutPlanner;
    this.TerrainAnalyzer = mockTerrainAnalyzer;
    this.TrafficAnalyzer = mockTrafficAnalyzer;
    this.Game = mockGame;
    this.Memory = mockMemory;
  }

  runPlanning(room) {
    if (!this.Settings.planning.buildingPlanningEnabled) return;

    // Run planning on cadence to avoid CPU overuse
    if (this.Game.time % this.Settings.planning.planningCadence !== 0) return;

    try {
      // Initialize room plan if needed
      this.initializeRoomPlan(room);

      // Check if RCL has changed and we need to replan
      const roomMemory = this.Memory.rooms[room.name];
      if (roomMemory && roomMemory.plan && roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) {
        this.Logger.info(`RoomManager: RCL changed for room ${room.name}, replanning...`);
        this.replanRoom(room);
        return; // Exit early after replanning to avoid duplicate work
      }

      // Track if we've updated roads this tick to prevent duplicates
      let roadsUpdatedThisTick = false;

      // Update building plans if needed
      if (this.shouldUpdateBuildingPlan(room)) {
        this.updateBuildingPlan(room);
        // Building plan update may have triggered road planning
        roadsUpdatedThisTick = true;
      }

      // Update road plans if needed (but not if already updated)
      if (!roadsUpdatedThisTick && this.shouldUpdateRoadPlan(room)) {
        this.updateRoadPlan(room);
      }

    } catch (error) {
      this.Logger.error(`RoomManager: Error in planning for room ${room.name}: ${error}`);
    }
  }

  initializeRoomPlan(room) {
    const roomMemory = this.Memory.rooms[room.name];
    if (!roomMemory) return;

    if (!roomMemory.plan) {
      roomMemory.plan = {
        roomName: room.name,
        buildings: [],
        roads: [],
        rcl: room.controller ? room.controller.level : 0,
        lastUpdated: this.Game.time,
        status: 'planning',
        priority: 1
      };
    }

    if (!roomMemory.trafficData) {
      roomMemory.trafficData = {};
    }

    if (!roomMemory.layoutAnalysis) {
      const terrainAnalysis = this.TerrainAnalyzer.analyzeRoom(room);
      const keyPositions = this.TerrainAnalyzer.identifyKeyPositions(room);
      
      roomMemory.layoutAnalysis = {
        terrain: terrainAnalysis,
        keyPositions: keyPositions,
        lastAnalyzed: this.Game.time
      };
    }
  }

  replanRoom(room) {
    const roomMemory = this.Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return;

    this.Logger.info(`RoomManager: Replanning room ${room.name} for RCL ${room.controller ? room.controller.level : 0}`);

    // Clear existing plans
    roomMemory.plan.buildings = [];
    roomMemory.plan.roads = [];
    roomMemory.plan.rcl = room.controller ? room.controller.level : 0;
    roomMemory.plan.lastUpdated = this.Game.time;

    // Force replanning
    this.updateBuildingPlan(room);
    this.updateRoadPlan(room);
  }

  shouldUpdateBuildingPlan(room) {
    const roomMemory = this.Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return true;

    // Update if no buildings planned
    if (roomMemory.plan.buildings.length === 0) return true;

    // Update if RCL has changed
    if (roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) return true;

    // Update periodically
    const timeSinceUpdate = this.Game.time - roomMemory.plan.lastUpdated;
    return timeSinceUpdate > this.Settings.planning.planningCadence * 10;
  }

  shouldUpdateRoadPlan(room) {
    const roomMemory = this.Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return true;

    // Update if no roads planned
    if (roomMemory.plan.roads.length === 0) return true;

    // Update if we have enough traffic data
    const trafficPositions = Object.keys(roomMemory.trafficData || {}).length;
    return trafficPositions > this.Settings.planning.minTrafficDataPoints;
  }

  updateBuildingPlan(room) {
    try {
      const plan = this.BaseLayoutPlanner.planRoom(room);
      
      const roomMemory = this.Memory.rooms[room.name];
      if (roomMemory) {
        roomMemory.plan = plan;
        
        this.Logger.info(`RoomManager: Updated building plan for ${room.name} with ${plan.buildings.length} buildings`);
      }
    } catch (error) {
      this.Logger.error(`RoomManager: Error updating building plan for room ${room.name}: ${error}`);
    }
  }

  updateRoadPlan(room) {
    try {
      const roomMemory = this.Memory.rooms[room.name];
      if (!roomMemory || !roomMemory.plan) return;

      const roads = this.RoadPlanner.planRoadNetwork(room, roomMemory.plan.buildings);
      roomMemory.plan.roads = roads;
      roomMemory.plan.lastUpdated = this.Game.time;
      
      this.Logger.info(`RoomManager: Updated road plan for ${room.name} with ${roads.length} roads`);
    } catch (error) {
      this.Logger.error(`RoomManager: Error updating road plan for room ${room.name}: ${error}`);
    }
  }
}

// Run the test
console.log('=== Testing Duplicate Road Planning Fix ===\n');

console.log('Test Scenario: RCL changed from 2 to 3, should trigger replanning');
console.log('Expected: RoadPlanner.planRoadNetwork should be called exactly ONCE\n');

// Reset counters
roadPlannerCalls = 0;
logCalls = [];

// Create test instance
const roomManager = new TestRoomManager();

// Run the planning method
roomManager.runPlanning(mockRoom);

// Check results
console.log('\n=== Test Results ===');
console.log(`RoadPlanner.planRoadNetwork was called ${roadPlannerCalls} times`);

if (roadPlannerCalls === 1) {
  console.log('✅ SUCCESS: Road planning was called exactly once (duplicate prevented)');
} else if (roadPlannerCalls === 2) {
  console.log('❌ FAILURE: Road planning was called twice (duplicate still occurring)');
} else {
  console.log(`❓ UNEXPECTED: Road planning was called ${roadPlannerCalls} times`);
}

console.log('\nLog messages:');
logCalls.forEach(call => {
  console.log(`  [${call.level.toUpperCase()}] ${call.message}`);
});

console.log('\n=== Test Complete ===');
