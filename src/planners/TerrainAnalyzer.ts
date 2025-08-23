import { Logger } from '../utils/Logger';
import { PathingUtils } from '../utils/PathingUtils';
import { Settings } from '../config/settings';

/**
 * Analyzes room terrain and identifies key positions for building placement
 */
export class TerrainAnalyzer {
  
  /**
   * Perform complete room analysis and cache results
   */
  public static analyzeRoom(room: Room): TerrainAnalysis {
    const startCpu = Game.cpu.getUsed();
    
    try {
      const analysis: TerrainAnalysis = {
        openSpaces: this.findOpenSpaces(room),
        walls: this.findWalls(room),
        swamps: this.findSwamps(room),
        exits: this.findExits(room),
        centralArea: this.findCentralArea(room)
      };

      // Cache the analysis in room memory
      if (!room.memory.layoutAnalysis) {
        room.memory.layoutAnalysis = {
          terrain: analysis,
          keyPositions: this.identifyKeyPositions(room),
          lastAnalyzed: Game.time
        };
      }

      const cpuUsed = Game.cpu.getUsed() - startCpu;
      Logger.info(`TerrainAnalyzer: Analyzed room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
      
      return analysis;
    } catch (error) {
      Logger.error(`TerrainAnalyzer: Error analyzing room ${room.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Get cached terrain analysis or perform new analysis
   */
  public static getCachedAnalysis(room: Room): TerrainAnalysis | null {
    const cached = room.memory.layoutAnalysis;
    if (!cached) return null;

    const age = Game.time - cached.lastAnalyzed;
    if (age > Settings.planning.layoutAnalysisTTL) {
      Logger.debug(`TerrainAnalyzer: Cache expired for room ${room.name}, age: ${age}`);
      return null;
    }

    return cached.terrain;
  }

  /**
   * Identify key positions in the room (sources, controller, etc.)
   */
  public static identifyKeyPositions(room: Room): KeyPositions {
    const sources = room.find(FIND_SOURCES);
    const controller = room.controller;
    const mineral = room.find(FIND_MINERALS)[0];
    const exits = this.findExits(room);

    // Find existing spawn positions
    const spawns = room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_SPAWN
    });

    const keyPositions: KeyPositions = {
      spawn: spawns.map(spawn => spawn.pos),
      sources: sources.map(source => source.pos),
      controller: controller ? controller.pos : undefined,
      mineral: mineral ? mineral.pos : undefined,
      exits: exits
    };

    Logger.debug(`TerrainAnalyzer: Identified key positions for room ${room.name}:`, 
      `${keyPositions.sources.length} sources, ${keyPositions.exits.length} exits`);

    return keyPositions;
  }

  /**
   * Find all open (walkable) spaces in the room
   */
  private static findOpenSpaces(room: Room): RoomPosition[] {
    const openSpaces: RoomPosition[] = [];
    
    for (let x = 1; x < 49; x++) {
      for (let y = 1; y < 49; y++) {
        const pos = new RoomPosition(x, y, room.name);
        if (PathingUtils.isWalkable(pos)) {
          openSpaces.push(pos);
        }
      }
    }

    Logger.debug(`TerrainAnalyzer: Found ${openSpaces.length} open spaces in room ${room.name}`);
    return openSpaces;
  }

  /**
   * Find all wall positions in the room
   */
  private static findWalls(room: Room): RoomPosition[] {
    const walls: RoomPosition[] = [];
    
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const terrain = room.getTerrain().get(x, y);
        if (terrain & TERRAIN_MASK_WALL) {
          walls.push(new RoomPosition(x, y, room.name));
        }
      }
    }

    return walls;
  }

  /**
   * Find all swamp positions in the room
   */
  private static findSwamps(room: Room): RoomPosition[] {
    const swamps: RoomPosition[] = [];
    
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const terrain = room.getTerrain().get(x, y);
        if (terrain & TERRAIN_MASK_SWAMP) {
          swamps.push(new RoomPosition(x, y, room.name));
        }
      }
    }

    return swamps;
  }

  /**
   * Find all exit positions in the room
   */
  private static findExits(room: Room): RoomPosition[] {
    const exits: RoomPosition[] = [];
    
    // Top and bottom edges
    for (let x = 0; x < 50; x++) {
      if (!(room.getTerrain().get(x, 0) & TERRAIN_MASK_WALL)) {
        exits.push(new RoomPosition(x, 0, room.name));
      }
      if (!(room.getTerrain().get(x, 49) & TERRAIN_MASK_WALL)) {
        exits.push(new RoomPosition(x, 49, room.name));
      }
    }
    
    // Left and right edges
    for (let y = 0; y < 50; y++) {
      if (!(room.getTerrain().get(0, y) & TERRAIN_MASK_WALL)) {
        exits.push(new RoomPosition(0, y, room.name));
      }
      if (!(room.getTerrain().get(49, y) & TERRAIN_MASK_WALL)) {
        exits.push(new RoomPosition(49, y, room.name));
      }
    }

    return exits;
  }

  /**
   * Find the optimal central area for building placement
   */
  public static findCentralArea(room: Room): RoomPosition {
    const sources = room.find(FIND_SOURCES);
    const controller = room.controller;
    
    if (!controller) {
      return new RoomPosition(25, 25, room.name);
    }

    // Calculate weighted center based on sources and controller
    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;

    // Controller has higher weight
    totalX += controller.pos.x * 2;
    totalY += controller.pos.y * 2;
    totalWeight += 2;

    // Add sources
    sources.forEach(source => {
      totalX += source.pos.x;
      totalY += source.pos.y;
      totalWeight += 1;
    });

    const centerX = Math.round(totalX / totalWeight);
    const centerY = Math.round(totalY / totalWeight);

    // Find the nearest walkable position to the calculated center
    const idealCenter = new RoomPosition(centerX, centerY, room.name);
    
    if (PathingUtils.isWalkable(idealCenter)) {
      return idealCenter;
    }

    // If ideal center is not walkable, find nearest walkable position
    for (let range = 1; range <= 10; range++) {
      const positions = PathingUtils.getPositionsInRange(idealCenter, range);
      for (const pos of positions) {
        if (PathingUtils.isWalkable(pos)) {
          Logger.debug(`TerrainAnalyzer: Central area for room ${room.name} at ${pos.x},${pos.y} (range ${range} from ideal)`);
          return pos;
        }
      }
    }

    // Fallback to room center
    Logger.warn(`TerrainAnalyzer: Could not find suitable central area for room ${room.name}, using room center`);
    return new RoomPosition(25, 25, room.name);
  }

  /**
   * Calculate buildable area around a position
   */
  public static calculateBuildableArea(room: Room, center: RoomPosition, radius: number = 10): RoomPosition[] {
    const buildablePositions: RoomPosition[] = [];
    
    for (let x = Math.max(1, center.x - radius); x <= Math.min(48, center.x + radius); x++) {
      for (let y = Math.max(1, center.y - radius); y <= Math.min(48, center.y + radius); y++) {
        const pos = new RoomPosition(x, y, room.name);
        const distance = PathingUtils.getDistance(center, pos);
        
        if (distance <= radius && PathingUtils.isWalkable(pos)) {
          buildablePositions.push(pos);
        }
      }
    }

    Logger.debug(`TerrainAnalyzer: Found ${buildablePositions.length} buildable positions within ${radius} of ${center.x},${center.y}`);
    return buildablePositions;
  }

  /**
   * Check if a position is suitable for a specific structure type
   */
  public static isSuitableForStructure(pos: RoomPosition, structureType: BuildableStructureConstant): boolean {
    if (!PathingUtils.isWalkable(pos)) {
      return false;
    }

    const room = Game.rooms[pos.roomName];
    if (!room) return false;

    // Check for existing structures
    const structures = pos.lookFor(LOOK_STRUCTURES);
    if (structures.length > 0) {
      // Only roads and containers can coexist with some structures
      const hasBlockingStructure = structures.some(s => 
        s.structureType !== STRUCTURE_ROAD && 
        s.structureType !== STRUCTURE_CONTAINER
      );
      if (hasBlockingStructure) return false;
    }

    // Check for construction sites
    const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (sites.length > 0) return false;

    // Structure-specific checks
    switch (structureType) {
      case STRUCTURE_SPAWN:
        // Spawns need clear area around them
        return this.hasMinimumClearance(pos, 1);
      
      case STRUCTURE_EXTENSION:
        // Extensions can be placed more densely
        return true;
      
      case STRUCTURE_TOWER:
        // Towers need good coverage, prefer central locations
        return this.hasMinimumClearance(pos, 1);
      
      case STRUCTURE_STORAGE:
      case STRUCTURE_TERMINAL:
        // Storage needs access from multiple directions
        return this.hasMinimumClearance(pos, 1);
      
      default:
        return true;
    }
  }

  /**
   * Check if a position has minimum clearance around it
   */
  private static hasMinimumClearance(pos: RoomPosition, minClearance: number): boolean {
    const positions = PathingUtils.getPositionsInRange(pos, minClearance);
    const walkableCount = positions.filter(p => PathingUtils.isWalkable(p)).length;
    const totalPositions = positions.length;
    
    // Require at least 60% of surrounding positions to be walkable
    return (walkableCount / totalPositions) >= 0.6;
  }

  /**
   * Clear cached analysis for a room
   */
  public static clearCache(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room && room.memory.layoutAnalysis) {
      delete room.memory.layoutAnalysis;
      Logger.debug(`TerrainAnalyzer: Cleared cache for room ${roomName}`);
    }
  }
}
