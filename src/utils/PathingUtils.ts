import { Logger } from './Logger';

/**
 * Pathfinding utilities for the planning system
 * Provides cost matrix management and pathfinding helpers
 */
export class PathingUtils {
  private static costMatrixCache: { [roomName: string]: { matrix: CostMatrix; lastModified: number } } = {};
  private static readonly CACHE_TTL = 1000; // Cache for 1000 ticks

  /**
   * Get or create a cost matrix for a room
   */
  public static getCostMatrix(roomName: string): CostMatrix {
    const room = Game.rooms[roomName];
    if (!room) {
      return new PathFinder.CostMatrix();
    }

    const cached = this.costMatrixCache[roomName];
    const currentTick = Game.time;

    // Check if we have a valid cached matrix
    if (cached && (currentTick - cached.lastModified) < this.CACHE_TTL) {
      return cached.matrix;
    }

    // Create new cost matrix
    const matrix = this.createCostMatrix(room);
    this.costMatrixCache[roomName] = {
      matrix: matrix,
      lastModified: currentTick
    };

    return matrix;
  }

  /**
   * Create a cost matrix for a room based on terrain and structures
   */
  private static createCostMatrix(room: Room): CostMatrix {
    const matrix = new PathFinder.CostMatrix();

    // Set terrain costs
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const terrain = room.getTerrain().get(x, y);
        
        if (terrain & TERRAIN_MASK_WALL) {
          matrix.set(x, y, 255); // Unwalkable
        } else if (terrain & TERRAIN_MASK_SWAMP) {
          matrix.set(x, y, 5); // Higher cost for swamps
        } else {
          matrix.set(x, y, 1); // Normal plains cost
        }
      }
    }

    // Set structure costs
    room.find(FIND_STRUCTURES).forEach(structure => {
      if (structure.structureType === STRUCTURE_ROAD) {
        matrix.set(structure.pos.x, structure.pos.y, 1); // Roads are efficient
      } else if (structure.structureType === STRUCTURE_CONTAINER) {
        matrix.set(structure.pos.x, structure.pos.y, 1); // Can walk on containers
      } else if (structure.structureType === STRUCTURE_RAMPART && (structure as StructureRampart).my) {
        matrix.set(structure.pos.x, structure.pos.y, 1); // Can walk on own ramparts
      } else {
        matrix.set(structure.pos.x, structure.pos.y, 255); // Block other structures
      }
    });

    // Set construction site costs
    room.find(FIND_CONSTRUCTION_SITES).forEach(site => {
      if (site.structureType === STRUCTURE_ROAD) {
        matrix.set(site.pos.x, site.pos.y, 1); // Future roads
      } else if (site.structureType === STRUCTURE_CONTAINER) {
        matrix.set(site.pos.x, site.pos.y, 1); // Future containers
      } else if (site.structureType === STRUCTURE_RAMPART) {
        matrix.set(site.pos.x, site.pos.y, 1); // Future ramparts
      } else {
        matrix.set(site.pos.x, site.pos.y, 255); // Block future structures
      }
    });

    return matrix;
  }

  /**
   * Find path between two positions using cached cost matrix
   */
  public static findPath(from: RoomPosition, to: RoomPosition, options: PathFinderOpts = {}): PathFinderPath {
    const defaultOptions: PathFinderOpts = {
      roomCallback: (roomName: string) => {
        return this.getCostMatrix(roomName);
      },
      maxOps: 2000,
      maxRooms: 1,
      ...options
    };

    return PathFinder.search(from, to, defaultOptions);
  }

  /**
   * Find multiple paths from one origin to multiple targets
   */
  public static findMultiplePaths(
    from: RoomPosition, 
    targets: RoomPosition[], 
    options: PathFinderOpts = {}
  ): PathFinderPath[] {
    return targets.map(target => this.findPath(from, target, options));
  }

  /**
   * Calculate the distance between two positions
   */
  public static getDistance(pos1: RoomPosition, pos2: RoomPosition): number {
    if (pos1.roomName !== pos2.roomName) {
      return Infinity; // Different rooms
    }
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }

  /**
   * Check if a position is walkable (not a wall or blocked structure)
   */
  public static isWalkable(pos: RoomPosition): boolean {
    const room = Game.rooms[pos.roomName];
    if (!room) return false;

    // Check terrain
    const terrain = room.getTerrain().get(pos.x, pos.y);
    if (terrain & TERRAIN_MASK_WALL) {
      return false;
    }

    // Check for blocking structures
    const structures = pos.lookFor(LOOK_STRUCTURES);
    for (const structure of structures) {
      if (structure.structureType !== STRUCTURE_ROAD && 
          structure.structureType !== STRUCTURE_CONTAINER &&
          !(structure.structureType === STRUCTURE_RAMPART && (structure as StructureRampart).my)) {
        return false;
      }
    }

    // Check for blocking construction sites
    const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    for (const site of sites) {
      if (site.structureType !== STRUCTURE_ROAD && 
          site.structureType !== STRUCTURE_CONTAINER &&
          site.structureType !== STRUCTURE_RAMPART) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all positions within a certain range of a target
   */
  public static getPositionsInRange(center: RoomPosition, range: number): RoomPosition[] {
    const positions: RoomPosition[] = [];
    
    for (let x = Math.max(0, center.x - range); x <= Math.min(49, center.x + range); x++) {
      for (let y = Math.max(0, center.y - range); y <= Math.min(49, center.y + range); y++) {
        if (this.getDistance(center, new RoomPosition(x, y, center.roomName)) <= range) {
          positions.push(new RoomPosition(x, y, center.roomName));
        }
      }
    }
    
    return positions;
  }

  /**
   * Clear cost matrix cache for a room (useful when room layout changes)
   */
  public static clearCache(roomName?: string): void {
    if (roomName) {
      delete this.costMatrixCache[roomName];
      Logger.debug(`PathingUtils: Cleared cache for room ${roomName}`);
    } else {
      this.costMatrixCache = {};
      Logger.debug('PathingUtils: Cleared all cost matrix cache');
    }
  }

  /**
   * Serialize a path for storage in memory
   */
  public static serializePath(path: RoomPosition[]): string {
    return path.map(pos => `${pos.x},${pos.y}`).join('|');
  }

  /**
   * Deserialize a path from memory storage
   */
  public static deserializePath(serialized: string, roomName: string): RoomPosition[] {
    if (!serialized) return [];
    
    return serialized.split('|').map(posStr => {
      const [x, y] = posStr.split(',').map(Number);
      if (typeof x === 'number' && typeof y === 'number') {
        return new RoomPosition(x, y, roomName);
      }
      return undefined;
    }).filter((pos): pos is RoomPosition => pos !== undefined);
  }
}
