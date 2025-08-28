import { Task } from './Task';
import { Logger } from '../utils/Logger';

/**
 * Task for withdrawing resources from structures
 */
export class TaskWithdraw extends Task {
  private resourceType: ResourceConstant;
  private amount?: number;

  constructor(target: Structure, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, priority: number = 5) {
    super('withdraw', target, priority);
    this.resourceType = resourceType;
    this.data['resourceType'] = resourceType;
    if (amount !== undefined) {
      this.data['amount'] = amount;
    }
  }

  public isValidTask(): boolean {
    return true; // Withdrawing is always a valid action if target exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<Structure>();
    if (!target || !(target instanceof Structure)) {
      return false;
    }

    // Check if structure has the resource we want
    const store = (target as any).store;
    if (!store) {
      return false; // Structure doesn't have storage
    }

    return store[this.resourceType] > 0;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<Structure>();
    if (!target) {
      Logger.debug(`TaskWithdraw: Target structure no longer exists for creep ${creep.name}`, 'TaskWithdraw');
      return false; // Task complete (target gone)
    }

    // Check if creep has space for more resources
    if (creep.store.getFreeCapacity(this.resourceType) === 0) {
      Logger.debug(`TaskWithdraw: Creep ${creep.name} is full, cannot withdraw more ${this.resourceType}`, 'TaskWithdraw');
      return false; // Task complete (creep full)
    }

    // Check if target still has the resource
    const store = (target as any).store;
    if (!store || store[this.resourceType] === 0) {
      Logger.debug(`TaskWithdraw: Target has no ${this.resourceType} for creep ${creep.name}`, 'TaskWithdraw');
      return false; // Task complete (no resource)
    }

    const result = creep.withdraw(target, this.resourceType, this.amount);
    
    switch (result) {
      case OK:
        creep.say('⚡ withdraw');
        // Check if we got everything we needed
        if (creep.store.getFreeCapacity(this.resourceType) === 0) {
          return false; // Task complete (creep full)
        }
        return true; // Continue withdrawing
        
      case ERR_NOT_IN_RANGE:
        this.moveToTarget(creep, 1);
        return true; // Continue task
        
      case ERR_NOT_ENOUGH_RESOURCES:
        Logger.debug(`TaskWithdraw: Target ran out of ${this.resourceType} for creep ${creep.name}`, 'TaskWithdraw');
        return false; // Task complete (no more resources)
        
      case ERR_FULL:
        Logger.debug(`TaskWithdraw: Creep ${creep.name} is full of ${this.resourceType}`, 'TaskWithdraw');
        return false; // Task complete (creep full)
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskWithdraw: Invalid target for creep ${creep.name}`, 'TaskWithdraw');
        return false; // Task complete (invalid target)
        
      default:
        Logger.warn(`TaskWithdraw: Unexpected withdraw result ${result} for creep ${creep.name}`, 'TaskWithdraw');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#ffaa00'; // Orange for energy collection
  }

  /**
   * Create a TaskWithdraw from the best available energy source
   */
  public static createEnergyWithdraw(creep: Creep): TaskWithdraw | null {
    // Priority 1: Containers with energy
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.structureType === STRUCTURE_CONTAINER &&
          (structure as StructureContainer).store[RESOURCE_ENERGY] > 0
        );
      },
    });

    if (target) {
      return new TaskWithdraw(target, RESOURCE_ENERGY, undefined, 8);
    }

    // Priority 2: Storage with energy
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.structureType === STRUCTURE_STORAGE &&
          (structure as StructureStorage).store[RESOURCE_ENERGY] > 0
        );
      },
    });

    if (target) {
      return new TaskWithdraw(target, RESOURCE_ENERGY, undefined, 6);
    }

    // Priority 3: Links with energy (if available)
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.structureType === STRUCTURE_LINK &&
          (structure as StructureLink).store[RESOURCE_ENERGY] > 0
        );
      },
    });

    if (target) {
      return new TaskWithdraw(target, RESOURCE_ENERGY, undefined, 4);
    }

    return null; // No energy sources found
  }

  /**
   * Create a TaskWithdraw for a specific resource type from the best source
   */
  public static createResourceWithdraw(creep: Creep, resourceType: ResourceConstant): TaskWithdraw | null {
    // Look for structures with the specified resource
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        const store = (structure as any).store;
        return store && store[resourceType] > 0;
      },
    });

    if (target) {
      return new TaskWithdraw(target, resourceType, undefined, 5);
    }

    return null; // No sources found for this resource
  }
}
