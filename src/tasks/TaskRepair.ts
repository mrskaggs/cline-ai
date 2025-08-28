import { Task } from './Task';
import { Logger } from '../utils/Logger';
import { Settings } from '../config/settings';

/**
 * Task for repairing damaged structures
 */
export class TaskRepair extends Task {
  constructor(target: Structure, priority: number = 5) {
    super('repair', target, priority);
  }

  public isValidTask(): boolean {
    return true; // Repairing is always a valid action if target exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<Structure>();
    if (!target || !(target instanceof Structure)) {
      return false;
    }
    
    // Check if structure still needs repair
    return target.hits < target.hitsMax;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<Structure>();
    if (!target) {
      Logger.debug(`TaskRepair: Target structure no longer exists for creep ${creep.name}`, 'TaskRepair');
      return false; // Task complete (target gone)
    }

    // Check if structure still needs repair
    if (target.hits >= target.hitsMax) {
      Logger.debug(`TaskRepair: Structure fully repaired for creep ${creep.name}`, 'TaskRepair');
      return false; // Task complete (fully repaired)
    }

    // Check if creep has energy
    if (creep.store[RESOURCE_ENERGY] === 0) {
      Logger.debug(`TaskRepair: Creep ${creep.name} has no energy for repairing`, 'TaskRepair');
      return false; // Task complete (no energy)
    }

    const result = creep.repair(target);
    
    switch (result) {
      case OK:
        creep.say('🔧 repair');
        return true; // Continue repairing
        
      case ERR_NOT_IN_RANGE:
        this.moveToTarget(creep, 3);
        return true; // Continue task
        
      case ERR_NOT_ENOUGH_RESOURCES:
        Logger.debug(`TaskRepair: Creep ${creep.name} ran out of energy while repairing`, 'TaskRepair');
        return false; // Task complete (no energy)
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskRepair: Structure no longer valid for repair by creep ${creep.name}`, 'TaskRepair');
        return false; // Task complete (invalid target)
        
      default:
        Logger.warn(`TaskRepair: Unexpected repair result ${result} for creep ${creep.name}`, 'TaskRepair');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#ffff00'; // Yellow for repair
  }

  /**
   * Create a TaskRepair from the highest priority damaged structure
   */
  public static createFromRoom(creep: Creep): TaskRepair | null {
    // Priority 1: Emergency repairs (structures below 10% health)
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.hits < structure.hitsMax * Settings.room.emergencyRepairThreshold &&
          structure.structureType !== STRUCTURE_WALL
        );
      },
    });

    if (target) {
      return new TaskRepair(target, 10); // Highest priority
    }

    // Priority 2: Damaged ramparts (below rampart repair threshold)
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.structureType === STRUCTURE_RAMPART &&
          structure.hits < structure.hitsMax * Settings.room.rampartRepairThreshold
        );
      },
    });

    if (target) {
      return new TaskRepair(target, 8); // High priority
    }

    // Priority 3: Damaged critical structures (spawn, extensions, towers, storage)
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.hits < structure.hitsMax * Settings.room.repairThreshold &&
          structure.structureType !== STRUCTURE_WALL &&
          structure.structureType !== STRUCTURE_RAMPART &&
          (structure.structureType === STRUCTURE_SPAWN ||
           structure.structureType === STRUCTURE_EXTENSION ||
           structure.structureType === STRUCTURE_TOWER ||
           structure.structureType === STRUCTURE_STORAGE)
        );
      },
    });

    if (target) {
      return new TaskRepair(target, 6); // Medium-high priority
    }

    // Priority 4: Roads and containers (below road repair threshold)
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          (structure.structureType === STRUCTURE_ROAD ||
            structure.structureType === STRUCTURE_CONTAINER) &&
          structure.hits < structure.hitsMax * Settings.room.roadRepairThreshold
        );
      },
    });

    if (target) {
      return new TaskRepair(target, 4); // Medium priority
    }

    // Priority 5: Other damaged structures
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.hits < structure.hitsMax * Settings.room.repairThreshold &&
          structure.structureType !== STRUCTURE_WALL &&
          structure.structureType !== STRUCTURE_RAMPART
        );
      },
    });

    if (target) {
      return new TaskRepair(target, 2); // Lower priority
    }

    return null; // No repair targets found
  }
}
