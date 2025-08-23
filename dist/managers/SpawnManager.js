"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpawnManager = void 0;
const Logger_1 = require("../utils/Logger");
class SpawnManager {
    run() {
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            if (spawn && !spawn.spawning) {
                this.processSpawn(spawn);
            }
        }
    }
    processSpawn(spawn) {
        try {
            const room = spawn.room;
            if (!room.controller || !room.controller.my) {
                return;
            }
            const roomMemory = Memory.rooms[room.name];
            if (!roomMemory) {
                return;
            }
            const requiredCreeps = this.calculateRequiredCreeps(room);
            const creepToSpawn = this.getNextCreepToSpawn(room, requiredCreeps);
            if (creepToSpawn) {
                this.spawnCreep(spawn, creepToSpawn.role, creepToSpawn.body, room.name);
            }
        }
        catch (error) {
            Logger_1.Logger.error(`Error processing spawn ${spawn.name}: ${error}`, 'SpawnManager');
        }
    }
    calculateRequiredCreeps(room) {
        const rcl = room.controller ? room.controller.level : 0;
        const sources = room.find(FIND_SOURCES);
        const sourceCount = sources.length;
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        let requiredCreeps = {};
        if (rcl === 1) {
            requiredCreeps['harvester'] = Math.max(2, sourceCount * 2);
        }
        else {
            requiredCreeps['harvester'] = Math.max(1, sourceCount);
            requiredCreeps['upgrader'] = rcl >= 3 ? 2 : 1;
            const baseBuilders = constructionSites.length > 0 ? 2 : 1;
            requiredCreeps['builder'] = Math.min(baseBuilders, Math.floor(rcl / 2) + 1);
        }
        return requiredCreeps;
    }
    getNextCreepToSpawn(room, required) {
        const creepCounts = {};
        for (const creepName in Game.creeps) {
            const creep = Game.creeps[creepName];
            if (creep && creep.memory.homeRoom === room.name) {
                const role = creep.memory.role;
                creepCounts[role] = (creepCounts[role] || 0) + 1;
            }
        }
        const roles = ['harvester', 'upgrader', 'builder'];
        for (const role of roles) {
            const current = creepCounts[role] || 0;
            const needed = required[role] || 0;
            if (current < needed) {
                const body = this.getCreepBody(role, room);
                if (body.length > 0) {
                    return { role, body };
                }
            }
        }
        return null;
    }
    getCreepBody(role, room) {
        const energyAvailable = room.energyAvailable;
        switch (role) {
            case 'harvester':
                return this.getHarvesterBody(energyAvailable);
            case 'upgrader':
                return this.getUpgraderBody(energyAvailable);
            case 'builder':
                return this.getBuilderBody(energyAvailable);
            default:
                Logger_1.Logger.warn(`Unknown role for body generation: ${role}`, 'SpawnManager');
                return [];
        }
    }
    getHarvesterBody(energyAvailable) {
        if (energyAvailable >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        else if (energyAvailable >= 300) {
            return [WORK, WORK, CARRY, MOVE];
        }
        else if (energyAvailable >= 200) {
            return [WORK, CARRY, MOVE];
        }
        else {
            return [WORK, CARRY, MOVE];
        }
    }
    getUpgraderBody(energyAvailable) {
        if (energyAvailable >= 500) {
            return [WORK, WORK, WORK, CARRY, CARRY, MOVE];
        }
        else if (energyAvailable >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE];
        }
        else if (energyAvailable >= 300) {
            return [WORK, WORK, CARRY, MOVE];
        }
        else if (energyAvailable >= 200) {
            return [WORK, CARRY, MOVE];
        }
        else {
            return [WORK, CARRY, MOVE];
        }
    }
    getBuilderBody(energyAvailable) {
        if (energyAvailable >= 450) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        else if (energyAvailable >= 350) {
            return [WORK, CARRY, CARRY, MOVE, MOVE];
        }
        else if (energyAvailable >= 250) {
            return [WORK, CARRY, MOVE, MOVE];
        }
        else if (energyAvailable >= 200) {
            return [WORK, CARRY, MOVE];
        }
        else {
            return [WORK, CARRY, MOVE];
        }
    }
    spawnCreep(spawn, role, body, homeRoom) {
        const name = `${role}_${Game.time}`;
        const result = spawn.spawnCreep(body, name, {
            memory: {
                role: role,
                homeRoom: homeRoom,
                working: false,
            },
        });
        if (result === OK) {
            Logger_1.Logger.logSpawn(role, name, homeRoom);
        }
        else if (result === ERR_NOT_ENOUGH_ENERGY) {
        }
        else {
            Logger_1.Logger.warn(`Failed to spawn ${role}: ${result}`, 'SpawnManager');
        }
    }
}
exports.SpawnManager = SpawnManager;
