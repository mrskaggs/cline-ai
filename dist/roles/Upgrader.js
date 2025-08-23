"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Upgrader = void 0;
class Upgrader {
    static run(creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            creep.say('🔄 collect');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('⚡ upgrade');
        }
        if (creep.memory.working) {
            this.upgradeController(creep);
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
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_LINK &&
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
    static upgradeController(creep) {
        if (creep.room.controller) {
            const result = creep.upgradeController(creep.room.controller);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            else if (result === ERR_NOT_ENOUGH_RESOURCES) {
                creep.memory.working = false;
            }
        }
    }
}
exports.Upgrader = Upgrader;
