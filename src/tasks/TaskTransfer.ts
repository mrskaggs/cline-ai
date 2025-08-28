import { Task } from './Task';
import { Logger } from '../utils/Logger';

/**
 * Task for transferring resources to structures
 */
export class TaskTransfer extends Task {
  private resourceType: ResourceConstant;
  private amount?: number;

  constructor(target: Structure, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, priority: number = 5) {
    super('transfer', target, priority);
    this.resourceType = resourceType;
    this.data['resourceType'] = resourceType;
    if (amount !== undefined) {
      this.data['amount'] = amount;
    }
  }

  public isValidTask(): boolean {
    return true; // Transferring is always a valid action if target exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<Structure>();
    if (!target || !(target instanceof Structure)) {
      return false;
    }

    // Check if structure can accept the resource we want to transfer
    const store = (target as any).store;
    if (!store) {
      return false; // Structure doesn't have storage
    }

    return store.getFreeCapacity(this.resourceType) > 0;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<Structure>();
    if (!target) {
      Logger.debug(`TaskTransfer: Target structure no longer exists for creep ${creep.name}`, 'TaskTransfer');
      return false; // Task complete (target gone)
    }

    // Check if creep has the resource to transfer
    if (creep.store[this.resourceType] === 0) {
      Logger.debug(`TaskTransfer: Creep ${creep.name} has no ${this.resourceType} to transfer`, 'TaskTransfer');
      return false; // Task complete (no resource)
    }

    // Check if target can still accept the resource
    const store = (target as any).store;
    if (!store || store.getFreeCapacity(this.resourceType) === 0) {
      Logger.debug(`TaskTransfer: Target has no capacity for ${this.resourceType} from creep ${creep.name}`, 'TaskTransfer');
      return false; // Task complete (target full)
    }

    const result = creep.transfer(target, this.resourceType, this.amount);
    
    switch (result) {
      case OK:
        creep.say('🚚 transfer');
        // Check if we transferred everything we had
        if (creep.store[this.resourceType] === 0) {
          return false; // Task complete (creep empty)
        }
        return true; // Continue transferring
        
      case ERR_NOT_IN_RANGE:
        this.moveToTarget(creep, 1);
        return true; // Continue task
        
      case ERR_NOT_ENOUGH_RESOURCES:
        Logger.debug(`TaskTransfer: Creep ${creep.name} ran out of ${this.resourceType}`, 'TaskTransfer');
        return false; // Task complete (no more resources)
        
      case ERR_FULL:
        Logger.debug(`TaskTransfer: Target is full, cannot accept more ${this.resourceType} from creep ${creep.name}`, 'TaskTransfer');
        return false; // Task complete (target full)
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskTransfer: Invalid target for creep ${creep.name}`, 'TaskTransfer');
        return false; // Task complete (invalid target)
        
      default:
        Logger.debug(`TaskTransfer: Transfer failed with result ${result} for creep ${creep.name}`, 'TaskTransfer');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#ffffff'; // White for energy delivery
  }

  /**
   * Create a TaskTransfer for energy delivery with priority-based targeting
   * Matches the existing Hauler priority system
   */
  public static createEnergyTransfer(creep: Creep): TaskTransfer | null {
    // Priority 1: Spawn (critical for creep production)
    let target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (spawn) => spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (target) {
      return new TaskTransfer(target, RESOURCE_ENERGY, undefined, 10); // Highest priority
    }

    // Priority 2: Extensions (for larger creeps)
    target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_EXTENSION &&
               structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });

    if (target) {
      return new TaskTransfer(target, RESOURCE_ENERGY, undefined, 9);
    }

    // Priority 3: Controller containers (critical for upgraders)
    if (creep.room.controller) {
      const controllerContainers = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_CONTAINER &&
                 structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
      });

      if (controllerContainers.length > 0 && controllerContainers[0]) {
        return new TaskTransfer(controllerContainers[0] as Structure, RESOURCE_ENERGY, undefined, 8);
      }
    }

    // Priority 4: Towers (for defense)
    target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_TOWER &&
               structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });

    if (target) {
      return new TaskTransfer(target, RESOURCE_ENERGY, undefined, 7);
    }

    // Priority 5: Storage (long-term storage)
    if (creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      return new TaskTransfer(creep.room.storage, RESOURCE_ENERGY, undefined, 6);
    }

    return null; // No transfer targets found
  }

  /**
   * Create a TaskTransfer for a specific resource type to the best target
   */
  public static createResourceTransfer(creep: Creep, resourceType: ResourceConstant): TaskTransfer | null {
    // Look for structures that can accept the specified resource
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        const store = (structure as any).store;
        return store && store.getFreeCapacity(resourceType) > 0;
      }
    });

    if (target) {
      return new TaskTransfer(target as Structure, resourceType, undefined, 5);
    }

    return null; // No targets found for this resource
  }

  /**
   * Create a TaskTransfer to a specific target structure
   */
  public static createSpecificTransfer(target: Structure, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, priority: number = 5): TaskTransfer {
    return new TaskTransfer(target, resourceType, amount, priority);
  }
}
