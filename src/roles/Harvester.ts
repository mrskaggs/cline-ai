export class Harvester {
  public static run(creep: Creep): void {
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
