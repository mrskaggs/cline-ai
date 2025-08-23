export class Builder {
  public static run(creep: Creep): void {
    // State machine: working means we're building, not working means we're collecting energy
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄 collect');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('🚧 build');
    }

    if (creep.memory.working) {
      // Build or repair structures
      this.buildOrRepair(creep);
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

    // Third priority: dropped energy
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

  private static buildOrRepair(creep: Creep): void {
    // Priority: construction sites, then repair damaged structures
    let target: ConstructionSite | Structure | null = null;

    // First priority: construction sites
    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

    // Second priority: damaged structures (below 80% health)
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
          return (
            structure.hits < structure.hitsMax * 0.8 &&
            structure.structureType !== STRUCTURE_WALL &&
            structure.structureType !== STRUCTURE_RAMPART
          );
        },
      });
    }

    // Third priority: roads and containers that need repair (below 50% health)
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
          return (
            (structure.structureType === STRUCTURE_ROAD ||
              structure.structureType === STRUCTURE_CONTAINER) &&
            structure.hits < structure.hitsMax * 0.5
          );
        },
      });
    }

    if (target) {
      let result: ScreepsReturnCode;
      
      if (target instanceof ConstructionSite) {
        result = creep.build(target);
      } else {
        result = creep.repair(target);
      }

      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      // No construction or repair needed, help upgrade controller
      if (creep.room.controller) {
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }
  }
}
