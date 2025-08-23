"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Builder = void 0;
class Builder {
    static run(creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            creep.say('🔄 collect');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
        }
        if (creep.memory.working) {
            this.buildOrRepair(creep);
        }
        else {
            this.collectEnergy(creep);
        }
    }
    static collectEnergy(creep) {
        let target = null;
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER &&
                    structure.store[RESOURCE_ENERGY] > 0);
            },
        });
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_STORAGE &&
                        structure.store[RESOURCE_ENERGY] > 0);
                },
            });
        }
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
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_SOURCES);
        }
        if (target) {
            let result;
            if (target instanceof Source) {
                result = creep.harvest(target);
            }
            else {
                result = creep.withdraw(target, RESOURCE_ENERGY);
            }
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
    static buildOrRepair(creep) {
        let target = null;
        target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < structure.hitsMax * 0.8 &&
                        structure.structureType !== STRUCTURE_WALL &&
                        structure.structureType !== STRUCTURE_RAMPART);
                },
            });
        }
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType === STRUCTURE_ROAD ||
                        structure.structureType === STRUCTURE_CONTAINER) &&
                        structure.hits < structure.hitsMax * 0.5);
                },
            });
        }
        if (target) {
            let result;
            if (target instanceof ConstructionSite) {
                result = creep.build(target);
            }
            else {
                result = creep.repair(target);
            }
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
        else {
            if (creep.room.controller) {
                if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
}
exports.Builder = Builder;
