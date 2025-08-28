import { Task } from './Task';
import { Logger } from '../utils/Logger';

/**
 * Task for upgrading the room controller
 */
export class TaskUpgrade extends Task {
  constructor(target: StructureController | null = null, priority: number = 5) {
    super('upgrade', target, priority);
  }

  public isValidTask(): boolean {
    return true; // Upgrading is always a valid action if controller exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<StructureController>();
    if (!target || !(target instanceof StructureController)) {
      return false;
    }

    // Check if controller belongs to us
    return target.my === true;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<StructureController>();
    if (!target) {
      Logger.debug(`TaskUpgrade: Controller no longer exists for creep ${creep.name}`, 'TaskUpgrade');
      return false; // Task complete (target gone)
    }

    // Check if creep has energy to upgrade
    if (creep.store[RESOURCE_ENERGY] === 0) {
      Logger.debug(`TaskUpgrade: Creep ${creep.name} has no energy to upgrade`, 'TaskUpgrade');
      return false; // Task complete (no energy)
    }

    const result = creep.upgradeController(target);
    
    switch (result) {
      case OK:
        creep.say('⚡ upgrade');
        // Continue upgrading until out of energy
        return true;
        
      case ERR_NOT_IN_RANGE:
        this.moveToTarget(creep, 3); // Controllers can be upgraded from range 3
        return true; // Continue task
        
      case ERR_NOT_ENOUGH_RESOURCES:
        Logger.debug(`TaskUpgrade: Creep ${creep.name} ran out of energy`, 'TaskUpgrade');
        return false; // Task complete (no more energy)
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskUpgrade: Invalid controller target for creep ${creep.name}`, 'TaskUpgrade');
        return false; // Task complete (invalid target)
        
      default:
        Logger.debug(`TaskUpgrade: Upgrade failed with result ${result} for creep ${creep.name}`, 'TaskUpgrade');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#ffffff'; // White for upgrading
  }

  /**
   * Create a TaskUpgrade for the room's controller
   */
  public static createFromRoom(creep: Creep): TaskUpgrade | null {
    if (!creep.room.controller || !creep.room.controller.my) {
      return null; // No controller or not owned by us
    }

    return new TaskUpgrade(creep.room.controller, 5);
  }
}
