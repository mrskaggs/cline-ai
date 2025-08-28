import { Task } from './Task';
import { Logger } from '../utils/Logger';

/**
 * Task for picking up dropped resources
 */
export class TaskPickup extends Task {
  private resourceType: ResourceConstant;
  constructor(target: Resource, resourceType: ResourceConstant = RESOURCE_ENERGY, amount?: number, priority: number = 9) {
    super('pickup', target, priority);
    this.resourceType = resourceType;
    this.data['resourceType'] = resourceType;
    if (amount !== undefined) {
      this.data['amount'] = amount;
    }
  }

  public isValidTask(): boolean {
    return true; // Picking up is always a valid action if target exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<Resource>();
    if (!target || !(target instanceof Resource)) {
      return false;
    }

    // Check if resource is the type we want and has amount > 0
    return target.resourceType === this.resourceType && target.amount > 0;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<Resource>();
    if (!target) {
      Logger.debug(`TaskPickup: Target resource no longer exists for creep ${creep.name}`, 'TaskPickup');
      return false; // Task complete (target gone)
    }

    // Check if creep has space for more resources
    if (creep.store.getFreeCapacity(this.resourceType) === 0) {
      Logger.debug(`TaskPickup: Creep ${creep.name} is full, cannot pickup more ${this.resourceType}`, 'TaskPickup');
      return false; // Task complete (creep full)
    }

    // Check if target still exists and has the resource
    if (target.amount === 0 || target.resourceType !== this.resourceType) {
      Logger.debug(`TaskPickup: Target no longer has ${this.resourceType} for creep ${creep.name}`, 'TaskPickup');
      return false; // Task complete (no resource)
    }

    const result = creep.pickup(target);
    
    switch (result) {
      case OK:
        creep.say('🔋 pickup');
        // Resource is automatically removed when picked up completely
        return false; // Task complete (pickup successful)
        
      case ERR_NOT_IN_RANGE:
        this.moveToTarget(creep, 1);
        return true; // Continue task
        
      case ERR_FULL:
        Logger.debug(`TaskPickup: Creep ${creep.name} is full of ${this.resourceType}`, 'TaskPickup');
        return false; // Task complete (creep full)
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskPickup: Invalid target for creep ${creep.name}`, 'TaskPickup');
        return false; // Task complete (invalid target)
        
      default:
        Logger.debug(`TaskPickup: Pickup failed with result ${result} for creep ${creep.name}`, 'TaskPickup');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#00ff00'; // Green for dropped energy pickup (highest priority)
  }

  /**
   * Create a TaskPickup from the best available dropped energy
   */
  public static createEnergyPickup(creep: Creep): TaskPickup | null {
    // Find dropped energy with minimum threshold to avoid inefficient tiny pickups
    const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (resource) => {
        return (
          resource.resourceType === RESOURCE_ENERGY &&
          resource.amount >= 50 // Minimum threshold for efficiency
        );
      },
    });

    if (target) {
      return new TaskPickup(target, RESOURCE_ENERGY, undefined, 9); // High priority to prevent decay
    }

    return null; // No dropped energy found
  }

  /**
   * Create a TaskPickup for a specific resource type
   */
  public static createResourcePickup(creep: Creep, resourceType: ResourceConstant, minAmount: number = 10): TaskPickup | null {
    const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (resource) => {
        return (
          resource.resourceType === resourceType &&
          resource.amount >= minAmount
        );
      },
    });

    if (target) {
      return new TaskPickup(target, resourceType, undefined, 7);
    }

    return null; // No dropped resources found for this type
  }

  /**
   * Create a TaskPickup for any dropped resource (useful for general cleanup)
   */
  public static createAnyResourcePickup(creep: Creep, minAmount: number = 10): TaskPickup | null {
    const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (resource) => resource.amount >= minAmount,
    });

    if (target) {
      return new TaskPickup(target, target.resourceType, undefined, 6);
    }

    return null; // No dropped resources found
  }
}
