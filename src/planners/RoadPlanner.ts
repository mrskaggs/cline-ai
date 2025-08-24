import { Logger } from '../utils/Logger';
import { PathingUtils } from '../utils/PathingUtils';
import { TrafficAnalyzer } from '../utils/TrafficAnalyzer';
import { TerrainAnalyzer } from './TerrainAnalyzer';
import { Settings } from '../config/settings';

/**
 * Plans road networks based on optimal paths and traffic analysis
 * Integrates with traffic data to create efficient road systems
 */
export class RoadPlanner {
  
  /**
   * Plan complete road network for a room
   */
  public static planRoadNetwork(room: Room, _buildings: PlannedBuilding[]): PlannedRoad[] {
    if (!Settings.planning.roadPlanningEnabled) return [];
    
    const startCpu = Game.cpu.getUsed();
    
    try {
      Logger.debug(`RoadPlanner: Planning road network for room ${room.name}`);
      
      // Get key positions for road planning
      const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
      
      // Calculate optimal paths between key positions
      const optimalPaths = this.calculateOptimalPaths(room, keyPositions);
      
      // Analyze traffic patterns
      const trafficData = TrafficAnalyzer.analyzeTrafficPatterns(room);
      
      // Generate road plan based on paths and traffic
      const roads = this.optimizeRoadPlacement(optimalPaths, trafficData, room);
      
      const cpuUsed = Game.cpu.getUsed() - startCpu;
      Logger.debug(`RoadPlanner: Planned ${roads.length} roads for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
      
      return roads;
    } catch (error) {
      Logger.error(`RoadPlanner: Error planning roads for room ${room.name}: ${error}`);
      return [];
    }
  }

  /**
   * Calculate optimal paths between key positions
   */
  public static calculateOptimalPaths(room: Room, keyPositions: KeyPositions): RoomPosition[][] {
    const paths: RoomPosition[][] = [];
    
    // Paths from spawns to sources
    keyPositions.spawn.forEach(spawnPos => {
      keyPositions.sources.forEach(sourcePos => {
        const path = PathingUtils.findPath(spawnPos, sourcePos);
        if (!path.incomplete && path.path.length > 0) {
          paths.push(path.path);
        }
      });
    });
    
    // Paths from spawns to controller
    if (keyPositions.controller) {
      keyPositions.spawn.forEach(spawnPos => {
        const path = PathingUtils.findPath(spawnPos, keyPositions.controller!);
        if (!path.incomplete && path.path.length > 0) {
          paths.push(path.path);
        }
      });
    }
    
    // Paths from sources to controller
    if (keyPositions.controller) {
      keyPositions.sources.forEach(sourcePos => {
        const path = PathingUtils.findPath(sourcePos, keyPositions.controller!);
        if (!path.incomplete && path.path.length > 0) {
          paths.push(path.path);
        }
      });
    }
    
    // Paths from spawns to mineral
    if (keyPositions.mineral) {
      keyPositions.spawn.forEach(spawnPos => {
        const path = PathingUtils.findPath(spawnPos, keyPositions.mineral!);
        if (!path.incomplete && path.path.length > 0) {
          paths.push(path.path);
        }
      });
    }
    
    // Paths to exits (for future expansion)
    const mainExits = this.getMainExits(keyPositions.exits);
    keyPositions.spawn.forEach(spawnPos => {
      mainExits.forEach(exitPos => {
        const path = PathingUtils.findPath(spawnPos, exitPos);
        if (!path.incomplete && path.path.length > 0) {
          paths.push(path.path);
        }
      });
    });
    
    Logger.debug(`RoadPlanner: Calculated ${paths.length} optimal paths for room ${room.name}`);
    return paths;
  }

  /**
   * Optimize road placement based on paths and traffic data
   */
  public static optimizeRoadPlacement(
    paths: RoomPosition[][], 
    _trafficData: TrafficData, 
    room: Room
  ): PlannedRoad[] {
    const roadPositions = new Map<string, PlannedRoad>();
    
    // Process each path
    paths.forEach((path, _pathIndex) => {
      const pathType = this.determinePathType(path, room);
      
      path.forEach(pos => {
        const posKey = `${pos.x},${pos.y}`;
        
        // Skip if position already has a road or structure
        if (this.hasRoadOrStructure(pos)) {
          return;
        }
        
        // Get traffic score for this position
        const trafficScore = TrafficAnalyzer.getTrafficScore(room, pos);
        
        // Calculate priority based on path importance and traffic
        const pathPriority = this.getPathPriority(pathType);
        const priority = pathPriority + Math.floor(trafficScore / 10);
        
        // Create or update road plan
        const existingRoad = roadPositions.get(posKey);
        if (!existingRoad || priority > existingRoad.priority) {
          roadPositions.set(posKey, {
            pos: pos,
            priority: priority,
            trafficScore: trafficScore,
            placed: false,
            pathType: pathType
          });
        }
      });
    });
    
    // Add high-traffic positions that aren't on optimal paths
    const highTrafficPositions = TrafficAnalyzer.getHighTrafficPositions(room);
    highTrafficPositions.forEach(pos => {
      const posKey = `${pos.x},${pos.y}`;
      
      if (!roadPositions.has(posKey) && !this.hasRoadOrStructure(pos)) {
        const trafficScore = TrafficAnalyzer.getTrafficScore(room, pos);
        
        roadPositions.set(posKey, {
          pos: pos,
          priority: Math.floor(trafficScore / 5), // Lower priority than optimal paths
          trafficScore: trafficScore,
          placed: false,
          pathType: 'internal'
        });
      }
    });
    
    // Convert to array and sort by priority
    const roads = Array.from(roadPositions.values());
    roads.sort((a, b) => b.priority - a.priority);
    
    Logger.info(`RoadPlanner: Generated ${roads.length} road positions for room ${room.name}`);
    return roads;
  }

  /**
   * Place road construction sites based on the road plan
   */
  public static placeRoadConstructionSites(room: Room, roads: PlannedRoad[]): void {
    if (!Settings.planning.roadPlanningEnabled) return;
    
    const maxSites = Math.floor(Settings.planning.maxConstructionSites / 2); // Reserve half for roads
    const existingRoadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: (site) => site.structureType === STRUCTURE_ROAD
    }).length;
    
    if (existingRoadSites >= maxSites) {
      Logger.debug(`RoadPlanner: Room ${room.name} already has ${existingRoadSites} road construction sites`);
      return;
    }
    
    let sitesPlaced = 0;
    const sitesToPlace = maxSites - existingRoadSites;
    
    // Sort roads by priority and place highest priority first
    // Allow high-priority roads (like source/controller paths) even without traffic data
    const eligibleRoads = roads
      .filter(road => 
        !road.placed && 
        (road.trafficScore >= Settings.planning.minTrafficForRoad || road.priority >= 80) &&
        !this.hasRoadOrStructure(road.pos)
      )
      .sort((a, b) => b.priority - a.priority);
    
    for (const road of eligibleRoads) {
      if (sitesPlaced >= sitesToPlace) break;
      
      const result = room.createConstructionSite(road.pos, STRUCTURE_ROAD);
      
      if (result === OK) {
        road.placed = true;
        const siteId = this.findRoadConstructionSiteId(room, road.pos);
        if (siteId) {
          road.constructionSiteId = siteId;
        }
        sitesPlaced++;
        
        Logger.info(`RoadPlanner: Placed road construction site at ${road.pos.x},${road.pos.y} in room ${room.name} (priority: ${road.priority})`);
      } else {
        Logger.warn(`RoadPlanner: Failed to place road at ${road.pos.x},${road.pos.y} in room ${room.name}: ${result}`);
      }
    }
    
    if (sitesPlaced > 0) {
      Logger.info(`RoadPlanner: Placed ${sitesPlaced} road construction sites in room ${room.name}`);
    }
  }

  /**
   * Update traffic analysis for road planning
   */
  public static updateTrafficAnalysis(room: Room): void {
    if (!Settings.planning.trafficAnalysisEnabled) return;
    
    // Track traffic for all creeps in the room
    TrafficAnalyzer.trackRoomTraffic(room);
    
    // Periodically analyze and optimize traffic data
    if (Game.time % Settings.planning.constructionCadence === 0) {
      TrafficAnalyzer.analyzeTrafficPatterns(room);
    }
  }

  /**
   * Get recommended road upgrades based on traffic analysis
   */
  public static getRecommendedRoadUpgrades(room: Room): RoomPosition[] {
    const recommendations: RoomPosition[] = [];
    const trafficData = TrafficAnalyzer.analyzeTrafficPatterns(room);
    const threshold = Settings.planning.roadPriorityThreshold;
    
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (!data) continue;
      
      const coords = posKey.split(',').map(Number);
      if (coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || isNaN(coords[0]) || isNaN(coords[1])) continue;
      const pos = new RoomPosition(coords[0], coords[1], room.name);
      
      // Check if position has high traffic but no road
      if (data.count >= threshold && !this.hasRoadOrStructure(pos)) {
        recommendations.push(pos);
      }
    }
    
    // Sort by traffic score
    recommendations.sort((a, b) => {
      const scoreA = TrafficAnalyzer.getTrafficScore(room, a);
      const scoreB = TrafficAnalyzer.getTrafficScore(room, b);
      return scoreB - scoreA;
    });
    
    Logger.debug(`RoadPlanner: Found ${recommendations.length} road upgrade recommendations for room ${room.name}`);
    return recommendations;
  }

  // Helper methods
  
  /**
   * Determine the type of path based on endpoints
   */
  private static determinePathType(path: RoomPosition[], room: Room): 'source' | 'controller' | 'mineral' | 'exit' | 'internal' {
    if (path.length === 0) return 'internal';
    
    const start = path[0];
    const end = path[path.length - 1];
    
    if (!start || !end) return 'internal';
    
    // Check if path connects to sources
    const sources = room.find(FIND_SOURCES);
    if (sources.some(source => source.pos.isEqualTo(start) || source.pos.isEqualTo(end))) {
      return 'source';
    }
    
    // Check if path connects to controller
    const controller = room.controller;
    if (controller && (controller.pos.isEqualTo(start) || controller.pos.isEqualTo(end))) {
      return 'controller';
    }
    
    // Check if path connects to mineral
    const minerals = room.find(FIND_MINERALS);
    if (minerals.some(mineral => mineral.pos.isEqualTo(start) || mineral.pos.isEqualTo(end))) {
      return 'mineral';
    }
    
    // Check if path connects to exits
    if (this.isExitPosition(start, room) || this.isExitPosition(end, room)) {
      return 'exit';
    }
    
    return 'internal';
  }

  /**
   * Get priority for different path types
   */
  private static getPathPriority(pathType: 'source' | 'controller' | 'mineral' | 'exit' | 'internal'): number {
    switch (pathType) {
      case 'source': return 100;
      case 'controller': return 90;
      case 'mineral': return 70;
      case 'exit': return 60;
      case 'internal': return 50;
      default: return 40;
    }
  }

  /**
   * Check if position already has a road or blocking structure
   */
  private static hasRoadOrStructure(pos: RoomPosition): boolean {
    // Ensure pos is a proper RoomPosition object (in case it came from memory)
    const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
    
    const structures = roomPos.lookFor(LOOK_STRUCTURES);
    const hasRoad = structures.some(s => s.structureType === STRUCTURE_ROAD);
    const hasBlockingStructure = structures.some(s => 
      s.structureType !== STRUCTURE_ROAD && 
      s.structureType !== STRUCTURE_CONTAINER &&
      !(s.structureType === STRUCTURE_RAMPART && (s as StructureRampart).my)
    );
    
    const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
    const hasRoadSite = sites.some(s => s.structureType === STRUCTURE_ROAD);
    
    return hasRoad || hasBlockingStructure || hasRoadSite;
  }

  /**
   * Check if position is an exit position
   */
  private static isExitPosition(pos: RoomPosition, _room: Room): boolean {
    return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
  }

  /**
   * Get main exits (filter out less important ones)
   */
  private static getMainExits(exits: RoomPosition[]): RoomPosition[] {
    // For now, return all exits. Could be enhanced to filter based on importance
    return exits.slice(0, 4); // Limit to 4 main exits to avoid too many paths
  }

  /**
   * Find construction site ID for a road at a specific position
   */
  private static findRoadConstructionSiteId(_room: Room, pos: RoomPosition): Id<ConstructionSite> | undefined {
    // Ensure pos is a proper RoomPosition object (in case it came from memory)
    const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
    
    const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
    const roadSite = sites.find(s => s.structureType === STRUCTURE_ROAD);
    return roadSite ? roadSite.id : undefined;
  }

  /**
   * Get road network statistics for a room
   */
  public static getRoadNetworkStats(room: Room): {
    totalRoads: number;
    roadConstructionSites: number;
    averageRoadHealth: number;
    highTrafficRoads: number;
    recommendedUpgrades: number;
  } {
    const roads = room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_ROAD
    }) as StructureRoad[];
    
    const roadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: (site) => site.structureType === STRUCTURE_ROAD
    });
    
    const totalHealth = roads.reduce((sum, road) => sum + road.hits, 0);
    const averageHealth = roads.length > 0 ? totalHealth / (roads.length * ROAD_HITS) : 0;
    
    let highTrafficRoads = 0;
    const threshold = Settings.planning.roadPriorityThreshold;
    
    roads.forEach(road => {
      const trafficScore = TrafficAnalyzer.getTrafficScore(room, road.pos);
      if (trafficScore >= threshold) {
        highTrafficRoads++;
      }
    });
    
    const recommendedUpgrades = this.getRecommendedRoadUpgrades(room).length;
    
    return {
      totalRoads: roads.length,
      roadConstructionSites: roadSites.length,
      averageRoadHealth: averageHealth,
      highTrafficRoads: highTrafficRoads,
      recommendedUpgrades: recommendedUpgrades
    };
  }

  /**
   * Clear road planning data for a room
   */
  public static clearRoadPlan(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room && room.memory.plan) {
      room.memory.plan.roads = [];
      Logger.debug(`RoadPlanner: Cleared road plan for room ${roomName}`);
    }
  }
}
