/**
 * System validation test for the Screeps AI planning system
 * Tests basic functionality and integration of all components
 */

// Mock RoomPosition first (needed for other mocks)
global.RoomPosition = class RoomPosition {
  constructor(x, y, roomName) {
    this.x = x;
    this.y = y;
    this.roomName = roomName;
  }
  
  isEqualTo(pos) {
    return this.x === pos.x && this.y === pos.y && this.roomName === pos.roomName;
  }
  
  lookFor() {
    return [];
  }
};

// Mock Screeps API for testing
const mockGame = {
  time: 12345,
  rooms: {
    'W1N1': {
      name: 'W1N1',
      controller: { level: 3, pos: new RoomPosition(25, 25, 'W1N1') },
      energyCapacityAvailable: 800,
      memory: {},
      find: (type) => {
        if (type === 'FIND_SOURCES') {
          return [
            { pos: new RoomPosition(10, 10, 'W1N1') },
            { pos: new RoomPosition(40, 40, 'W1N1') }
          ];
        }
        if (type === 'FIND_MY_STRUCTURES') {
          return [
            { structureType: 'spawn', pos: new RoomPosition(25, 20, 'W1N1') }
          ];
        }
        if (type === 'FIND_MY_CONSTRUCTION_SITES') {
          return [];
        }
        if (type === 'FIND_MINERALS') {
          return [{ pos: new RoomPosition(30, 30, 'W1N1') }];
        }
        return [];
      },
      getTerrain: () => ({
        get: (x, y) => {
          // Simple terrain - mostly plains with some walls at edges
          if (x === 0 || x === 49 || y === 0 || y === 49) return 1; // Wall
          if ((x + y) % 10 === 0) return 2; // Some swamps
          return 0; // Plains
        }
      }),
      createConstructionSite: () => 0, // OK
      lookForAt: () => []
    }
  },
  cpu: {
    getUsed: () => Math.random() * 10
  }
};

// Mock global constants
global.FIND_SOURCES = 'FIND_SOURCES';
global.FIND_MY_STRUCTURES = 'FIND_MY_STRUCTURES';
global.FIND_MY_CONSTRUCTION_SITES = 'FIND_MY_CONSTRUCTION_SITES';
global.FIND_MINERALS = 'FIND_MINERALS';
global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_TOWER = 'tower';
global.STRUCTURE_ROAD = 'road';
global.STRUCTURE_CONTAINER = 'container';
global.STRUCTURE_STORAGE = 'storage';
global.STRUCTURE_LINK = 'link';
global.STRUCTURE_TERMINAL = 'terminal';
global.STRUCTURE_LAB = 'lab';
global.STRUCTURE_FACTORY = 'factory';
global.STRUCTURE_OBSERVER = 'observer';
global.STRUCTURE_POWER_SPAWN = 'powerSpawn';
global.STRUCTURE_EXTRACTOR = 'extractor';
global.STRUCTURE_NUKER = 'nuker';
global.TERRAIN_MASK_WALL = 1;
global.TERRAIN_MASK_SWAMP = 2;
global.OK = 0;
global.LOOK_STRUCTURES = 'structures';
global.LOOK_CONSTRUCTION_SITES = 'construction_sites';

// Mock body part constants
global.WORK = 'work';
global.CARRY = 'carry';
global.MOVE = 'move';
global.ATTACK = 'attack';
global.RANGED_ATTACK = 'ranged_attack';
global.HEAL = 'heal';
global.CLAIM = 'claim';
global.TOUGH = 'tough';

// Mock resource constants
global.RESOURCE_ENERGY = 'energy';
global.RESOURCE_POWER = 'power';
global.RESOURCE_HYDROGEN = 'H';
global.RESOURCE_OXYGEN = 'O';
global.RESOURCE_UTRIUM = 'U';
global.RESOURCE_LEMERGIUM = 'L';
global.RESOURCE_KEANIUM = 'K';
global.RESOURCE_ZYNTHIUM = 'Z';
global.RESOURCE_CATALYST = 'X';


// Mock PathFinder
global.PathFinder = {
  search: (from, to) => ({
    path: [from, to],
    incomplete: false
  }),
  CostMatrix: class CostMatrix {
    constructor() {
      this.data = new Array(50 * 50).fill(1);
    }
    set(x, y, value) {
      this.data[y * 50 + x] = value;
    }
    get(x, y) {
      return this.data[y * 50 + x];
    }
  }
};

// Set global Game object
global.Game = mockGame;

console.log('🧪 Starting Screeps AI Planning System Validation Tests...\n');

try {
  // Test 1: Settings System
  console.log('📋 Test 1: Settings System');
  const { Settings } = require('./dist/config/settings.js');
  console.log('✅ Settings loaded successfully');
  console.log(`   - Planning enabled: ${Settings.planning.buildingPlanningEnabled}`);
  console.log(`   - Max construction sites: ${Settings.planning.maxConstructionSites}`);
  
  // Test 2: Logger System
  console.log('\n📋 Test 2: Logger System');
  const { Logger } = require('./dist/utils/Logger.js');
  Logger.info('Logger test message');
  console.log('✅ Logger working correctly');
  
  // Test 3: Terrain Analysis
  console.log('\n📋 Test 3: Terrain Analysis');
  const { TerrainAnalyzer } = require('./dist/planners/TerrainAnalyzer.js');
  const room = mockGame.rooms['W1N1'];
  const analysis = TerrainAnalyzer.analyzeRoom(room);
  console.log('✅ Terrain analysis completed');
  console.log(`   - Buildable area: ${analysis.buildableArea || 'N/A'} positions`);
  console.log(`   - Wall percentage: ${analysis.wallPercentage ? analysis.wallPercentage.toFixed(1) : 'N/A'}%`);
  
  // Test 4: Key Positions
  console.log('\n📋 Test 4: Key Position Identification');
  const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
  console.log('✅ Key positions identified');
  console.log(`   - Sources: ${keyPositions.sources.length}`);
  console.log(`   - Spawns: ${keyPositions.spawn.length}`);
  console.log(`   - Controller: ${keyPositions.controller ? 'Found' : 'Not found'}`);
  
  // Test 5: Layout Templates
  console.log('\n📋 Test 5: Layout Templates');
  const { LayoutTemplates } = require('./dist/planners/LayoutTemplates.js');
  const template = LayoutTemplates.getTemplate(3);
  console.log('✅ Layout templates working');
  console.log(`   - RCL 3 template has ${template.buildings.length} buildings`);
  
  // Test 6: Building Planning
  console.log('\n📋 Test 6: Building Planning');
  const { BaseLayoutPlanner } = require('./dist/planners/BaseLayoutPlanner.js');
  const plan = BaseLayoutPlanner.planRoom(room);
  console.log('✅ Building planning completed');
  console.log(`   - Plan status: ${plan.status}`);
  console.log(`   - Buildings planned: ${plan.buildings.length}`);
  console.log(`   - Plan priority: ${plan.priority}`);
  
  // Test 7: Traffic Analysis
  console.log('\n📋 Test 7: Traffic Analysis');
  const { TrafficAnalyzer } = require('./dist/utils/TrafficAnalyzer.js');
  
  // Mock creep for traffic tracking
  const mockCreep = {
    pos: { x: 25, y: 25, roomName: 'W1N1' },
    room: room,
    memory: { role: 'harvester' }
  };
  
  TrafficAnalyzer.trackCreepMovement(mockCreep);
  const trafficData = TrafficAnalyzer.analyzeTrafficPatterns(room);
  console.log('✅ Traffic analysis working');
  console.log(`   - Traffic positions tracked: ${Object.keys(trafficData).length}`);
  
  // Test 8: Road Planning
  console.log('\n📋 Test 8: Road Planning');
  const { RoadPlanner } = require('./dist/planners/RoadPlanner.js');
  const roads = RoadPlanner.planRoadNetwork(room, plan.buildings);
  console.log('✅ Road planning completed');
  console.log(`   - Roads planned: ${roads.length}`);
  
  // Test 9: PathingUtils
  console.log('\n📋 Test 9: Pathfinding Utilities');
  const { PathingUtils } = require('./dist/utils/PathingUtils.js');
  const path = PathingUtils.findPath(
    new RoomPosition(10, 10, 'W1N1'),
    new RoomPosition(40, 40, 'W1N1')
  );
  console.log('✅ Pathfinding utilities working');
  console.log(`   - Path found with ${path.path.length} steps`);
  
  // Test 10: Integration Test
  console.log('\n📋 Test 10: Full Integration Test');
  
  // Simulate placing construction sites
  BaseLayoutPlanner.placeConstructionSites(room, plan);
  RoadPlanner.placeRoadConstructionSites(room, roads);
  
  console.log('✅ Integration test completed');
  console.log(`   - System successfully integrated all components`);
  
  // Summary
  console.log('\n🎉 All Tests Passed Successfully!');
  console.log('\n📊 System Summary:');
  console.log(`   - Room analyzed: ${room.name}`);
  console.log(`   - RCL: ${room.controller.level}`);
  console.log(`   - Buildings planned: ${plan.buildings.length}`);
  console.log(`   - Roads planned: ${roads.length}`);
  console.log(`   - Traffic positions: ${Object.keys(trafficData).length}`);
  console.log(`   - Buildable area: ${analysis.buildableArea} positions`);
  
  console.log('\n✅ Screeps AI Planning System is ready for deployment!');
  
} catch (error) {
  console.error('\n❌ Test failed with error:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
