import { Logger } from '../utils/Logger';

export class Harvester {
  public static run(creep: Creep): void {
    try {
      const rcl = creep.room.controller ? creep.room.controller.level : 1;
      
      // RCL 3+: Stationary mining with container filling
      if (rcl >= 3) {
        this.runStatinaryMiner(creep);
      } else {
        // RCL 1-2: Mobile harvester (old behavior)
        this.runMobileHarvester(creep);
      }
    } catch (error) {
      Logger.error(`Harvester ${creep.name}: Error in run: ${error}`, 'Harvester');
    }
  }

  /**
   * RCL 3+ behavior: Stationary mining with container filling
   */
  private static runStatinaryMiner(creep: Creep): void {
    // Find assigned source or assign one
    if (!creep.memory.assignedSource) {
      this.assignSourceToHarvester(creep);
    }

    if (!creep.memory.assignedSource) {
      // Still no assigned source, wait
      return;
    }

    const source = Game.getObjectById(creep.memory.assignedSource) as Source | null;
    if (!source) {
      // Source no longer exists, reassign
      delete creep.memory.assignedSource;
      return;
    }

    // Check if we can harvest from current position
    if (creep.pos.isNearTo(source)) {
      // We're adjacent to source, try to harvest
      const harvestResult = creep.harvest(source);
      if (harvestResult === OK) {
        creep.say('⛏️ mine');
      } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES) {
        creep.say('⏳ wait');
      }

      // If we have energy, try to fill nearby container
      if (creep.store[RESOURCE_ENERGY] > 0) {
        this.fillNearbyContainer(creep);
      }
      return;
    }

    // Not adjacent to source, need to move there
    // Find the best adjacent position to the source
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

    if (bestPosition) {
      // Move to the best adjacent position
      const moveResult = creep.moveTo(bestPosition, { 
        visualizePathStyle: { stroke: '#ffaa00' },
        ignoreCreeps: false,
        reusePath: 5
      });
      
      if (moveResult === ERR_NO_PATH) {
        creep.say('🚫 blocked');
        Logger.warn(`Harvester ${creep.name}: No path to source ${source.id}`, 'Harvester');
      }
    } else {
      // No valid adjacent positions found
      creep.say('🚫 no space');
      Logger.warn(`Harvester ${creep.name}: No valid positions near source ${source.id}`, 'Harvester');
      
      // Try to move closer anyway, maybe something will change
      creep.moveTo(source, { 
        visualizePathStyle: { stroke: '#ff0000' },
        ignoreCreeps: true,
        reusePath: 1
      });
    }
  }

  /**
   * RCL 1-2 behavior: Mobile harvester (original logic)
   */
  private static runMobileHarvester(creep: Creep): void {
    // State machine: working means we're delivering energy, not working means we're harvesting
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('🚛 deliver');
    }

    if (creep.memory.working) {
      // Deliver energy to structures that need it
      this.deliverEnergy(creep);
    } else {
      // Harvest energy from sources
      this.harvestEnergy(creep);
    }
  }

  /**
   * Assign a source to a harvester for stationary mining
   */
  private static assignSourceToHarvester(creep: Creep): void {
    const sources = creep.room.find(FIND_SOURCES);
    
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

    if (bestSource) {
      creep.memory.assignedSource = bestSource.id;
      Logger.debug(`Harvester ${creep.name}: Assigned to source ${bestSource.id}`, 'Harvester');
    }
  }

  /**
   * Get all adjacent positions around a given position
   */
  private static getAdjacentPositions(pos: RoomPosition): RoomPosition[] {
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
   * Fill nearby container with harvested energy
   */
  private static fillNearbyContainer(creep: Creep): void {
    // Look for container within range 2
    const nearbyContainer = creep.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER &&
               structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    })[0] as StructureContainer;

    if (nearbyContainer) {
      const transferResult = creep.transfer(nearbyContainer, RESOURCE_ENERGY);
      if (transferResult === OK) {
        creep.say('📦 fill');
      } else if (transferResult === ERR_NOT_IN_RANGE) {
        // This shouldn't happen since we're looking within range 2
        creep.moveTo(nearbyContainer);
      }
    } else {
      // No container nearby, drop energy for haulers to pick up
      if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.8) {
        creep.drop(RESOURCE_ENERGY);
        creep.say('💎 drop');
      }
    }
  }

  private static harvestEnergy(creep: Creep): void {
    // Find the closest source
    const source = creep.pos.findClosestByPath(FIND_SOURCES);
    if (source) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }

  private static deliverEnergy(creep: Creep): void {
    // Priority order: spawns, extensions, then controller
    let target: Structure | null = null;

    // First priority: spawns and extensions that need energy
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          (structure.structureType === STRUCTURE_EXTENSION ||
            structure.structureType === STRUCTURE_SPAWN) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        );
      },
    });

    // Second priority: towers that need energy
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
          return (
            structure.structureType === STRUCTURE_TOWER &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        },
      });
    }

    // Third priority: controller (upgrade)
    if (!target && creep.room.controller) {
      target = creep.room.controller;
    }

    if (target) {
      let result: ScreepsReturnCode;
      
      if (target.structureType === STRUCTURE_CONTROLLER) {
        result = creep.upgradeController(target as StructureController);
      } else {
        result = creep.transfer(target as Structure, RESOURCE_ENERGY);
      }

      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
}
