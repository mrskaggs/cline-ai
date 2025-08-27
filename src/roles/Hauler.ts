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
   * PRIORITY 1: Dropped energy (prevents decay)
   * Uses StorageManager for optimal source selection based on room strategy
   */
  private static collectEnergy(creep: Creep): void {
    // Priority 1: Dropped energy (immediate pickup to prevent decay)
    const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (resource) => resource.resourceType === RESOURCE_ENERGY && resource.amount > 50
    });

    if (droppedEnergy) {
      if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#00ff00' } });
      }
      return;
    }

    // Priority 2: Try StorageManager for RCL 4+ rooms with storage
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
            // Check if it's a dropped resource (shouldn't happen here since we check dropped energy first)
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

    // Priority 3: Source containers (fallback for RCL 3 or when StorageManager fails)
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

    // No energy sources found - move to center and wait
    creep.moveTo(25, 25);
  }

  /**
   * Deliver energy to spawn, extensions, towers, controller containers, then storage
   * FIXED: Controller containers now prioritized BEFORE storage to ensure upgraders get energy
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

    // Priority 3: Controller containers (MOVED UP - critical for upgraders)
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

    // Priority 4: Towers (for defense)
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

    // Priority 5: Storage (long-term storage - now AFTER controller containers)
    const storage = creep.room.storage;
    if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    // No targets found - move to center and wait
    creep.moveTo(25, 25);
  }

  /**
   * Get optimal body configuration for hauler based on available energy
   * Optimized for perfect energy utilization at each RCL
   */
  public static getBody(energyAvailable: number): BodyPartConstant[] {
    // Perfect energy utilization for each RCL
    if (energyAvailable >= 1300) {
      // RCL 4: Perfect utilization - 22 CARRY = 1100 capacity
      return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (energyAvailable >= 800) {
      // RCL 3: Perfect utilization - 12 CARRY = 600 capacity
      return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    } else if (energyAvailable >= 550) {
      // RCL 2: Perfect utilization - 8 CARRY = 400 capacity
      return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (energyAvailable >= 500) {
      // High efficiency: 7 CARRY = 350 capacity
      return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (energyAvailable >= 400) {
      // Good efficiency: 6 CARRY = 300 capacity
      return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 300) {
      // RCL 1: Reasonable efficiency - 4 CARRY = 200 capacity
      return [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 200) {
      // Basic efficiency: 2 CARRY = 100 capacity
      return [CARRY, CARRY, MOVE];
    } else {
      // Emergency fallback
      return [CARRY, CARRY, MOVE];
    }
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
