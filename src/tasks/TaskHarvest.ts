import { Task } from './Task';
import { Logger } from '../utils/Logger';

/**
 * Task for harvesting energy from sources
 * Supports both stationary mining (RCL 3+) and mobile harvesting (RCL 1-2)
 */
export class TaskHarvest extends Task {
  constructor(target: Source | null = null, priority: number = 5) {
    super('harvest', target, priority);
    if (target) {
      this.data['sourceId'] = target.id;
    }
  }

  public isValidTask(): boolean {
    return true; // Harvesting is always a valid action if source exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<Source>();
    if (!target || !(target instanceof Source)) {
      return false;
    }

    // Check if source has energy to harvest
    return target.energy > 0;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<Source>();
    if (!target) {
      Logger.debug(`TaskHarvest: Source no longer exists for creep ${creep.name}`, 'TaskHarvest');
      return false; // Task complete (target gone)
    }

    // Check if source has energy
    if (target.energy === 0) {
      // Source is empty, wait for regeneration
      creep.say('⏳ wait');
      return true; // Continue task (source will regenerate)
    }

    // Check if creep is full
    if (creep.store.getFreeCapacity() === 0) {
      Logger.debug(`TaskHarvest: Creep ${creep.name} is full`, 'TaskHarvest');
      return false; // Task complete (creep full)
    }

    const result = creep.harvest(target);
    
    switch (result) {
      case OK:
        creep.say('⛏️ mine');
        
        // For stationary miners (RCL 3+), handle container filling and energy dropping
        const rcl = creep.room.controller ? creep.room.controller.level : 1;
        if (rcl >= 3 && creep.store[RESOURCE_ENERGY] > 0) {
          this.handleStationaryMinerOutput(creep);
        }
        
        // Continue harvesting until full or source empty
        return true;
        
      case ERR_NOT_IN_RANGE:
        this.moveToHarvestPosition(creep, target);
        return true; // Continue task
        
      case ERR_NOT_ENOUGH_RESOURCES:
        // Source is empty, wait for regeneration
        creep.say('⏳ wait');
        return true; // Continue task
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskHarvest: Invalid source target for creep ${creep.name}`, 'TaskHarvest');
        return false; // Task complete (invalid target)
        
      default:
        Logger.debug(`TaskHarvest: Harvest failed with result ${result} for creep ${creep.name}`, 'TaskHarvest');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#ffaa00'; // Orange for harvesting
  }

  /**
   * Handle output for stationary miners (RCL 3+)
   * Fill nearby containers or drop energy for haulers
   */
  private handleStationaryMinerOutput(creep: Creep): void {
    // Look for container within range 2
    const nearbyContainer = creep.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER &&
               (structure as StructureContainer).store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    })[0] as StructureContainer;

    if (nearbyContainer) {
      const transferResult = creep.transfer(nearbyContainer, RESOURCE_ENERGY);
      if (transferResult === OK) {
        creep.say('📦 fill');
      }
    } else {
      // No container nearby, drop energy for haulers to pick up
      if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.8) {
        creep.drop(RESOURCE_ENERGY);
        creep.say('💎 drop');
      }
    }
  }

  /**
   * Move to optimal harvest position
   * For RCL 3+, find best adjacent position for stationary mining
   */
  private moveToHarvestPosition(creep: Creep, source: Source): void {
    const rcl = creep.room.controller ? creep.room.controller.level : 1;
    
    if (rcl >= 3) {
      // Stationary mining: find best adjacent position
      const bestPosition = this.findBestAdjacentPosition(creep, source);
      if (bestPosition) {
        creep.moveTo(bestPosition, { 
          visualizePathStyle: { stroke: '#ffaa00' },
          ignoreCreeps: false,
          reusePath: 5
        });
      } else {
        // No valid adjacent positions, try to get closer
        creep.moveTo(source, { 
          visualizePathStyle: { stroke: '#ff0000' },
          ignoreCreeps: true,
          reusePath: 1
        });
        creep.say('🚫 blocked');
      }
    } else {
      // Mobile harvesting: simple move to source
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }

  /**
   * Find the best adjacent position to a source for stationary mining
   */
  private findBestAdjacentPosition(creep: Creep, source: Source): RoomPosition | null {
    const adjacentPositions = this.getAdjacentPositions(source.pos);
    let bestPosition: RoomPosition | null = null;
    let shortestDistance = Infinity;

    for (const pos of adjacentPositions) {
      // Check if position is walkable (not wall, not blocked by structure)
      const terrain = Game.map.getRoomTerrain(pos.roomName);
      if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
        continue; // Skip walls
      }

      // Check if position is blocked by structures (except roads and containers)
      const structures = pos.lookFor(LOOK_STRUCTURES);
      const isBlocked = structures.some((structure: Structure) => 
        structure.structureType !== STRUCTURE_ROAD && 
        structure.structureType !== STRUCTURE_CONTAINER
      );
      
      if (isBlocked) {
        continue; // Skip blocked positions
      }

      // Check if there's already a creep there
      const creeps = pos.lookFor(LOOK_CREEPS);
      if (creeps.length > 0 && creeps[0] && creeps[0].id !== creep.id) {
        continue; // Skip occupied positions
      }

      // Calculate distance to this position
      const distance = creep.pos.getRangeTo(pos);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestPosition = pos;
      }
    }

    return bestPosition;
  }

  /**
   * Get all adjacent positions around a given position
   */
  private getAdjacentPositions(pos: RoomPosition): RoomPosition[] {
    const positions: RoomPosition[] = [];
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Skip the center position
        
        const x = pos.x + dx;
        const y = pos.y + dy;
        
        // Check room boundaries
        if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
          positions.push(new RoomPosition(x, y, pos.roomName));
        }
      }
    }
    
    return positions;
  }

  /**
   * Create a TaskHarvest for the best available source
   */
  public static createFromRoom(creep: Creep): TaskHarvest | null {
    // If harvester has assigned source (RCL 3+), use that
    if (creep.memory.assignedSource) {
      const assignedSource = Game.getObjectById(creep.memory.assignedSource) as Source | null;
      if (assignedSource && assignedSource.energy > 0) {
        return new TaskHarvest(assignedSource, 5);
      } else {
        // Assigned source is gone or empty, clear assignment
        delete creep.memory.assignedSource;
      }
    }

    // Find best available source
    const sources = creep.room.find(FIND_SOURCES, {
      filter: (source) => source.energy > 0
    });

    if (sources.length === 0) {
      return null; // No sources with energy
    }

    // For RCL 3+, assign source for stationary mining
    const rcl = creep.room.controller ? creep.room.controller.level : 1;
    if (rcl >= 3 && creep.memory.role === 'harvester') {
      const bestSource = this.assignSourceToHarvester(creep, sources);
      if (bestSource) {
        creep.memory.assignedSource = bestSource.id;
        return new TaskHarvest(bestSource, 5);
      }
    }

    // For mobile harvesting or fallback, use closest source
    const closestSource = creep.pos.findClosestByPath(sources);
    if (closestSource) {
      return new TaskHarvest(closestSource, 5);
    }

    return null;
  }

  /**
   * Assign a source to a harvester for stationary mining
   */
  private static assignSourceToHarvester(creep: Creep, sources: Source[]): Source | null {
    // Find source with fewest assigned harvesters
    let bestSource: Source | null = null;
    let minHarvesters = Infinity;

    for (const source of sources) {
      const assignedHarvesters = Object.values(Game.creeps).filter(
        c => c.memory.role === 'harvester' && 
            c.memory.homeRoom === creep.room.name && 
            c.memory.assignedSource === source.id
      ).length;

      if (assignedHarvesters < minHarvesters) {
        minHarvesters = assignedHarvesters;
        bestSource = source;
      }
    }

    return bestSource;
  }
}
