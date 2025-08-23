export class Upgrader {
  public static run(creep: Creep): void {
    // State machine: working means we're upgrading, not working means we're collecting energy
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄 collect');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('⚡ upgrade');
    }

    if (creep.memory.working) {
      // Upgrade controller
      this.upgradeController(creep);
    } else {
      // Collect energy
      this.collectEnergy(creep);
    }
  }

  private static collectEnergy(creep: Creep): void {
    // Try to get energy from containers first, then sources
    let target: Structure | Source | null = null;

    // First priority: containers with energy
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          structure.structureType === STRUCTURE_CONTAINER &&
          structure.store[RESOURCE_ENERGY] > 0
        );
      },
    });

    // Second priority: storage with energy
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
          return (
            structure.structureType === STRUCTURE_STORAGE &&
            structure.store[RESOURCE_ENERGY] > 0
          );
        },
      });
    }

    // Third priority: links with energy
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
          return (
            structure.structureType === STRUCTURE_LINK &&
            structure.store[RESOURCE_ENERGY] > 0
          );
        },
      });
    }

    // Fourth priority: dropped energy
    if (!target) {
      const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: (resource) => resource.resourceType === RESOURCE_ENERGY,
      });
      if (droppedEnergy) {
        if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
          creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return;
      }
    }

    // Last resort: harvest from source
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_SOURCES);
    }

    if (target) {
      let result: ScreepsReturnCode;
      
      if (target instanceof Source) {
        result = creep.harvest(target);
      } else {
        result = creep.withdraw(target as Structure, RESOURCE_ENERGY);
      }

      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }

  private static upgradeController(creep: Creep): void {
    if (creep.room.controller) {
      const result = creep.upgradeController(creep.room.controller);
      
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      } else if (result === ERR_NOT_ENOUGH_RESOURCES) {
        // This shouldn't happen if our state machine is working correctly
        creep.memory.working = false;
      }
    }
  }
}
