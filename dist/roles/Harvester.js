"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Harvester = void 0;
class Harvester {
    static run(creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚛 deliver');
        }
        if (creep.memory.working) {
            this.deliverEnergy(creep);
        }
        else {
            this.harvestEnergy(creep);
        }
    }
    static harvestEnergy(creep) {
        const source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
    static deliverEnergy(creep) {
        let target = null;
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            },
        });
        if (!target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_TOWER &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                },
            });
        }
        if (!target && creep.room.controller) {
            target = creep.room.controller;
        }
        if (target) {
            let result;
            if (target.structureType === STRUCTURE_CONTROLLER) {
                result = creep.upgradeController(target);
            }
            else {
                result = creep.transfer(target, RESOURCE_ENERGY);
            }
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
}
exports.Harvester = Harvester;
