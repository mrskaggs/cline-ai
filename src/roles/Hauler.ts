import { Logger } from '../utils/Logger';
import { StorageManager } from '../managers/StorageManager';

/**
 * Hauler role - Transports energy from containers/storage to spawn/extensions/towers
 * Critical for RCL 3+ when harvesters become stationary miners
 * Integrates with StorageManager for optimal energy flow strategies
 */
export class Hauler {
  public static run(creep: Creep): void {
    try {
      // State management
      if (creep.memory.hauling && creep.store[RESOURCE_ENERGY] === 0) {
        creep.memory.hauling = false;
        creep.say('🔄 pickup');
      }
      if (!creep.memory.hauling && creep.store.getFreeCapacity() === 0) {
        creep.memory.hauling = true;
        creep.say('🚚 deliver');
      }

      if (creep.memory.hauling) {
        this.deliverEnergy(creep);
      } else {
        this.collectEnergy(creep);
      }
    } catch (error) {
      Logger.error(`Hauler ${creep.name}: Error in run: ${error}`, 'Hauler');
    }
  }

  /**
   * Collect energy from containers, storage, or dropped resources
   * Uses StorageManager for optimal source selection based on room strategy
   */
  private static collectEnergy(creep: Creep): void {
    // Try StorageManager first for RCL 4+ rooms with storage
    if (creep.room.controller && creep.room.controller.level >= 4) {
      try {
        const optimalSources = StorageManager.getOptimalEnergySources(creep.room);
        
        if (optimalSources.length > 0) {
          // Find the best source (closest with most energy)
          let bestSource: Structure | Resource | null = null;
          let bestScore = 0;

          for (const source of optimalSources) {
            let energyAmount = 0;
            let distance = 0;

            // Check if it's a structure with store
            if ('structureType' in source && 'store' in source) {
              const structure = source as StructureContainer | StructureStorage;
              energyAmount = structure.store[RESOURCE_ENERGY] || 0;
              distance = creep.pos.getRangeTo(structure);
            } 
            // Check if it's a dropped resource
            else if ('resourceType' in source && 'amount' in source) {
              const resource = source as unknown as Resource;
              energyAmount = resource.amount;
              distance = creep.pos.getRangeTo(resource);
            }

            // Score based on energy amount and proximity (higher is better)
            const score = energyAmount - (distance * 10);
            if (score > bestScore) {
              bestScore = score;
              bestSource = source;
            }
          }

          if (bestSource) {
            let result: ScreepsReturnCode;
            
            // Check if it's a structure
            if ('structureType' in bestSource) {
              result = creep.withdraw(bestSource as Structure, RESOURCE_ENERGY);
            } 
            // Otherwise it's a dropped resource
            else {
              result = creep.pickup(bestSource as Resource);
            }

            if (result === ERR_NOT_IN_RANGE) {
              creep.moveTo(bestSource, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else if (result !== OK) {
              Logger.debug(`Hauler ${creep.name}: Failed to collect from optimal source: ${result}`, 'Hauler');
            }
            return;
          }
        }
      } catch (error) {
        Logger.warn(`Hauler ${creep.name}: StorageManager error, falling back to basic collection: ${error}`, 'Hauler');
      }
    }

    // Fallback: Look for source containers only (exclude controller containers)
    // Priority 1: Containers near sources (primary energy collection)
    const sourceContainers = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        if (structure.structureType !== STRUCTURE_CONTAINER || structure.store[RESOURCE_ENERGY] === 0) {
          return false;
        }
        
        // Exclude controller containers - haulers should only deliver to them, not take from them
        if (creep.room.controller) {
          const distanceToController = structure.pos.getRangeTo(creep.room.controller);
          if (distanceToController <= 3) {
            return false; // This is a controller container, skip it
          }
        }
        
        return true;
      }
    }) as StructureContainer[];

    if (sourceContainers.length > 0) {
      const targetContainer = creep.pos.findClosestByPath(sourceContainers);
      if (targetContainer) {
        if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targetContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return;
      }
    }

    // Priority 2: Dropped energy
    const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 50
    });

    if (droppedEnergy) {
      if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return;
    }

    // No energy sources found - move to center and wait
    creep.moveTo(25, 25);
  }

  /**
   * Deliver energy to spawn, extensions, towers, or storage
   */
  private static deliverEnergy(creep: Creep): void {
    // Priority 1: Spawn (critical for creep production)
    const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (spawn) => spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (spawn) {
      if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    // Priority 2: Extensions (for larger creeps)
    const extensions = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_EXTENSION &&
               structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });

    if (extensions.length > 0) {
      const targetExtension = creep.pos.findClosestByPath(extensions);
      if (targetExtension) {
        if (creep.transfer(targetExtension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targetExtension, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
    }

    // Priority 3: Towers (for defense)
    const towers = creep.room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_TOWER &&
               structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    }) as StructureTower[];

    if (towers.length > 0) {
      const targetTower = creep.pos.findClosestByPath(towers);
      if (targetTower) {
        if (creep.transfer(targetTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targetTower, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
    }

    // Priority 4: Storage (long-term storage)
    const storage = creep.room.storage;
    if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    // Priority 5: Controller (if upgraders need energy nearby)
    if (creep.room.controller) {
      // Look for containers near controller
      const controllerContainers = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_CONTAINER &&
                 structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
      }) as StructureContainer[];

      if (controllerContainers.length > 0) {
        const targetContainer = controllerContainers[0];
        if (targetContainer) {
          if (creep.transfer(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetContainer, { visualizePathStyle: { stroke: '#ffffff' } });
          }
          return;
        }
      }
    }

    // No targets found - move to center and wait
    creep.moveTo(25, 25);
  }

  /**
   * Get optimal body configuration for hauler based on available energy
   */
  public static getBody(energyAvailable: number): BodyPartConstant[] {
    const bodies = [
      { energy: 200, body: [CARRY, CARRY, MOVE] },                    // 2 carry, 1 move (100 capacity)
      { energy: 300, body: [CARRY, CARRY, CARRY, MOVE, MOVE] },       // 3 carry, 2 move (150 capacity)
      { energy: 400, body: [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE] }, // 4 carry, 2 move (200 capacity)
      { energy: 500, body: [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] }, // 5 carry, 3 move (250 capacity)
      { energy: 600, body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE] }, // 6 carry, 3 move (300 capacity)
      { energy: 800, body: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE] } // 8 carry, 4 move (400 capacity)
    ];

    // Find the best body we can afford
    for (let i = bodies.length - 1; i >= 0; i--) {
      const bodyConfig = bodies[i];
      if (bodyConfig && energyAvailable >= bodyConfig.energy) {
        return bodyConfig.body;
      }
    }

    // Fallback to basic body
    return [CARRY, CARRY, MOVE];
  }

  /**
   * Calculate energy cost for a body configuration
   */
  public static calculateBodyCost(body: BodyPartConstant[]): number {
    const costs: { [key: string]: number } = {
      [MOVE]: 50,
      [WORK]: 100,
      [CARRY]: 50,
      [ATTACK]: 80,
      [RANGED_ATTACK]: 150,
      [HEAL]: 250,
      [CLAIM]: 600,
      [TOUGH]: 10
    };

    return body.reduce((total, part) => total + (costs[part] || 0), 0);
  }
}
