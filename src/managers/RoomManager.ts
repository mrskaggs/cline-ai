import { Logger } from '../utils/Logger';
import { Settings } from '../config/settings';
import { TerrainAnalyzer } from '../planners/TerrainAnalyzer';
import { BaseLayoutPlanner } from '../planners/BaseLayoutPlanner';
import { RoadPlanner } from '../planners/RoadPlanner';
import { TrafficAnalyzer } from '../utils/TrafficAnalyzer';

export class RoomManager {
  public run(): void {
    // Process all owned rooms
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (room && room.controller && room.controller.my) {
        this.processRoom(room);
      }
    }
  }

  private processRoom(room: Room): void {
    try {
      // Initialize room memory if needed
      this.initializeRoomMemory(room);

      // Update room information
      this.updateRoomMemory(room);

      // Run planning systems
      this.runPlanning(room);

      // Update traffic analysis
      this.updateTrafficAnalysis(room);

      // Manage construction sites
      this.manageConstructionSites(room);

      // Run basic defense (towers)
      this.runDefense(room);

    } catch (error) {
      Logger.error(`Error processing room ${room.name}: ${error}`, 'RoomManager');
    }
  }

  private initializeRoomMemory(room: Room): void {
    if (!Memory.rooms[room.name]) {
      Memory.rooms[room.name] = {
        sources: {},
        spawnIds: [],
        lastUpdated: Game.time,
        rcl: room.controller ? room.controller.level : 0,
      };

      if (room.controller) {
        Memory.rooms[room.name]!.controllerId = room.controller.id;
      }
    }
  }

  private updateRoomMemory(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;
    
    // Update RCL
    roomMemory.rcl = room.controller ? room.controller.level : 0;
    
    // Update last updated timestamp
    roomMemory.lastUpdated = Game.time;

    // Update sources information
    this.updateSourcesMemory(room);

    // Update spawns
    this.updateSpawnsMemory(room);
  }

  private updateSourcesMemory(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;
    
    const sources = room.find(FIND_SOURCES);

    for (const source of sources) {
      if (!roomMemory.sources[source.id]) {
        roomMemory.sources[source.id] = {};
      }

      // Check for containers near the source
      const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
      }) as StructureContainer[];

        if (containers.length > 0 && roomMemory.sources[source.id] && containers[0]) {
          roomMemory.sources[source.id]!.containerId = containers[0].id;
        }

      // Check for links near the source
      const links = source.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (structure) => structure.structureType === STRUCTURE_LINK,
      }) as StructureLink[];

        if (links.length > 0 && roomMemory.sources[source.id] && links[0]) {
          roomMemory.sources[source.id]!.linkId = links[0].id;
        }
    }
  }

  private updateSpawnsMemory(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;
    
    const spawns = room.find(FIND_MY_SPAWNS);
    roomMemory.spawnIds = spawns.map(spawn => spawn.id);
  }

  private runPlanning(room: Room): void {
    if (!Settings.planning.buildingPlanningEnabled) return;

    // Run planning on cadence to avoid CPU overuse
    if (Game.time % Settings.planning.planningCadence !== 0) return;

    try {
      // Initialize room plan if needed
      this.initializeRoomPlan(room);

      // Check if RCL has changed and we need to replan
      const roomMemory = Memory.rooms[room.name];
      if (roomMemory && roomMemory.plan && roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) {
        Logger.info(`RoomManager: RCL changed for room ${room.name}, replanning...`);
        this.replanRoom(room);
      }

      // Update building plans if needed
      if (this.shouldUpdateBuildingPlan(room)) {
        this.updateBuildingPlan(room);
      }

      // Update road plans if needed
      if (this.shouldUpdateRoadPlan(room)) {
        this.updateRoadPlan(room);
      }

    } catch (error) {
      Logger.error(`RoomManager: Error in planning for room ${room.name}: ${error}`);
    }
  }

  private updateTrafficAnalysis(room: Room): void {
    if (!Settings.planning.trafficAnalysisEnabled) return;

    try {
      // Update traffic analysis
      RoadPlanner.updateTrafficAnalysis(room);

      // Track creep movements for traffic analysis
      TrafficAnalyzer.trackRoomTraffic(room);

    } catch (error) {
      Logger.error(`RoomManager: Error updating traffic analysis for room ${room.name}: ${error}`);
    }
  }

  private manageConstructionSites(room: Room): void {
    try {
      // Run construction management on cadence
      if (Game.time % Settings.planning.constructionCadence !== 0) return;

      // Place building construction sites
      this.placeBuildingConstructionSites(room);

      // Place road construction sites
      this.placeRoadConstructionSites(room);

      // Clean up old construction sites
      this.cleanupConstructionSites(room);

    } catch (error) {
      Logger.error(`RoomManager: Error managing construction sites for room ${room.name}: ${error}`);
    }
  }

  private initializeRoomPlan(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;

    if (!roomMemory.plan) {
      roomMemory.plan = {
        roomName: room.name,
        buildings: [],
        roads: [],
        rcl: room.controller ? room.controller.level : 0,
        lastUpdated: Game.time,
        status: 'planning',
        priority: 1
      };

      Logger.info(`RoomManager: Initialized room plan for ${room.name}`);
    }

    if (!roomMemory.trafficData) {
      roomMemory.trafficData = {};
    }

    if (!roomMemory.layoutAnalysis) {
      // Perform initial terrain analysis
      const terrainAnalysis = TerrainAnalyzer.analyzeRoom(room);
      const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
      
      roomMemory.layoutAnalysis = {
        terrain: terrainAnalysis,
        keyPositions: keyPositions,
        lastAnalyzed: Game.time
      };
      Logger.info(`RoomManager: Completed terrain analysis for ${room.name}`);
    }
  }

  private replanRoom(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return;

    Logger.info(`RoomManager: Replanning room ${room.name} for RCL ${room.controller ? room.controller.level : 0}`);

    // Clear existing plans
    roomMemory.plan.buildings = [];
    roomMemory.plan.roads = [];
    roomMemory.plan.rcl = room.controller ? room.controller.level : 0;
    roomMemory.plan.lastUpdated = Game.time;

    // Force replanning
    this.updateBuildingPlan(room);
    this.updateRoadPlan(room);
  }

  private shouldUpdateBuildingPlan(room: Room): boolean {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return true;

    // Update if no buildings planned
    if (roomMemory.plan.buildings.length === 0) return true;

    // Update if RCL has changed
    if (roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) return true;

    // Update periodically
    const timeSinceUpdate = Game.time - roomMemory.plan.lastUpdated;
    return timeSinceUpdate > Settings.planning.planningCadence * 10;
  }

  private shouldUpdateRoadPlan(room: Room): boolean {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return true;

    // Update if no roads planned
    if (roomMemory.plan.roads.length === 0) return true;

    // Update if we have enough traffic data
    const trafficPositions = Object.keys(roomMemory.trafficData || {}).length;
    return trafficPositions > Settings.planning.minTrafficDataPoints;
  }

  private updateBuildingPlan(room: Room): void {
    try {
      const plan = BaseLayoutPlanner.planRoom(room);
      
      const roomMemory = Memory.rooms[room.name];
      if (roomMemory) {
        roomMemory.plan = plan;
        
        Logger.info(`RoomManager: Updated building plan for ${room.name} with ${plan.buildings.length} buildings`);
      }
    } catch (error) {
      Logger.error(`RoomManager: Error updating building plan for room ${room.name}: ${error}`);
    }
  }

  private updateRoadPlan(room: Room): void {
    try {
      const roomMemory = Memory.rooms[room.name];
      if (!roomMemory || !roomMemory.plan) return;

      const roads = RoadPlanner.planRoadNetwork(room, roomMemory.plan.buildings);
      roomMemory.plan.roads = roads;
      roomMemory.plan.lastUpdated = Game.time;
      
      Logger.info(`RoomManager: Updated road plan for ${room.name} with ${roads.length} roads`);
    } catch (error) {
      Logger.error(`RoomManager: Error updating road plan for room ${room.name}: ${error}`);
    }
  }

  private placeBuildingConstructionSites(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return;

    try {
      BaseLayoutPlanner.placeConstructionSites(room, roomMemory.plan);
    } catch (error) {
      Logger.error(`RoomManager: Error placing building construction sites for room ${room.name}: ${error}`);
    }
  }

  private placeRoadConstructionSites(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory || !roomMemory.plan) return;

    try {
      RoadPlanner.placeRoadConstructionSites(room, roomMemory.plan.roads);
    } catch (error) {
      Logger.error(`RoomManager: Error placing road construction sites for room ${room.name}: ${error}`);
    }
  }

  private cleanupConstructionSites(room: Room): void {
    // Remove construction sites that have been idle for too long
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    const maxAge = Settings.planning.constructionSiteMaxAge;

    sites.forEach(site => {
      // Check if site is old and has no progress
      if (Game.time - (site as any).createdTime > maxAge && site.progress === 0) {
        site.remove();
        Logger.debug(`RoomManager: Removed idle construction site at ${site.pos.x},${site.pos.y} in room ${room.name}`);
      }
    });
  }

  private runDefense(room: Room): void {
    // Find all hostile creeps in the room
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    
    if (hostiles.length === 0) {
      return;
    }

    // Find all towers in the room
    const towers = room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_TOWER,
    }) as StructureTower[];

    if (towers.length === 0) {
      return;
    }

    // Target the closest hostile
    const target = room.find(FIND_HOSTILE_CREEPS)[0];
    if (target) {
      for (const tower of towers) {
        if (tower.store[RESOURCE_ENERGY] > 0) {
          tower.attack(target);
        }
      }
    }
  }
}
