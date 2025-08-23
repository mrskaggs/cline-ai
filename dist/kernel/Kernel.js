"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kernel = void 0;
const Logger_1 = require("../utils/Logger");
const settings_1 = require("../config/settings");
class Kernel {
    constructor() {
        this.managers = [];
        this.initialized = false;
        this.load();
    }
    run() {
        try {
            this.initializeMemory();
            this.cleanupMemory();
            if (Game.time % 100 === 0) {
                Logger_1.Logger.cleanup();
            }
            if (Game.time % 500 === 0) {
                this.cleanupPlanningData();
            }
            for (const manager of this.managers) {
                this.safelyExecute(() => manager.run(), manager.name);
            }
            this.runCreeps();
        }
        catch (error) {
            Logger_1.Logger.error(`Critical error in main loop: ${error}`, 'Kernel');
        }
    }
    load() {
        if (!this.initialized) {
            Logger_1.Logger.info('Loading kernel...', 'Kernel');
            const { RoomManager } = require('../managers/RoomManager');
            const { SpawnManager } = require('../managers/SpawnManager');
            this.roomManager = new RoomManager();
            this.spawnManager = new SpawnManager();
            this.registerManager('RoomManager', () => this.roomManager.run());
            this.registerManager('SpawnManager', () => this.spawnManager.run());
            this.initialized = true;
        }
    }
    initializeMemory() {
        if (!Memory.uuid) {
            Memory.uuid = Math.floor(Math.random() * 1000000);
        }
        if (!Memory.creeps) {
            Memory.creeps = {};
        }
        if (!Memory.rooms) {
            Memory.rooms = {};
        }
        if (!Memory.spawns) {
            Memory.spawns = {};
        }
        if (!Memory.flags) {
            Memory.flags = {};
        }
        if (!Memory.empire) {
            Memory.empire = {};
        }
    }
    cleanupMemory() {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name];
            }
        }
        for (const name in Memory.spawns) {
            if (!(name in Game.spawns)) {
                delete Memory.spawns[name];
            }
        }
        for (const name in Memory.flags) {
            if (!(name in Game.flags)) {
                delete Memory.flags[name];
            }
        }
    }
    cleanupPlanningData() {
        if (!settings_1.Settings.planning.enabled)
            return;
        try {
            for (const roomName in Memory.rooms) {
                const roomMemory = Memory.rooms[roomName];
                if (!roomMemory)
                    continue;
                if (roomMemory.trafficData) {
                    const trafficTTL = settings_1.Settings.planning.trafficDataTTL;
                    for (const posKey in roomMemory.trafficData) {
                        const data = roomMemory.trafficData[posKey];
                        if (data && Game.time - data.lastSeen > trafficTTL) {
                            delete roomMemory.trafficData[posKey];
                        }
                    }
                }
                if (roomMemory.layoutAnalysis) {
                    const layoutTTL = settings_1.Settings.planning.layoutAnalysisTTL;
                    if (Game.time - roomMemory.layoutAnalysis.lastAnalyzed > layoutTTL) {
                        delete roomMemory.layoutAnalysis;
                        Logger_1.Logger.debug(`Kernel: Cleaned up old layout analysis for room ${roomName}`);
                    }
                }
                if (roomMemory.plan) {
                    const room = Game.rooms[roomName];
                    if (room) {
                        roomMemory.plan.buildings.forEach(building => {
                            if (building.placed && building.constructionSiteId) {
                                const site = Game.getObjectById(building.constructionSiteId);
                                if (!site) {
                                    const structures = building.pos.lookFor(LOOK_STRUCTURES);
                                    const hasStructure = structures.some(s => s.structureType === building.structureType);
                                    if (hasStructure) {
                                        delete building.constructionSiteId;
                                    }
                                    else {
                                        building.placed = false;
                                        delete building.constructionSiteId;
                                    }
                                }
                            }
                        });
                        roomMemory.plan.roads.forEach(road => {
                            if (road.placed && road.constructionSiteId) {
                                const site = Game.getObjectById(road.constructionSiteId);
                                if (!site) {
                                    const structures = road.pos.lookFor(LOOK_STRUCTURES);
                                    const hasRoad = structures.some(s => s.structureType === STRUCTURE_ROAD);
                                    if (hasRoad) {
                                        delete road.constructionSiteId;
                                    }
                                    else {
                                        road.placed = false;
                                        delete road.constructionSiteId;
                                    }
                                }
                            }
                        });
                    }
                }
            }
            Logger_1.Logger.debug('Kernel: Completed planning data cleanup');
        }
        catch (error) {
            Logger_1.Logger.error(`Kernel: Error during planning data cleanup: ${error}`);
        }
    }
    runCreeps() {
        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (creep) {
                this.safelyExecute(() => this.runCreepRole(creep), `Creep-${name}`);
            }
        }
    }
    runCreepRole(creep) {
        if (!creep.memory.role) {
            Logger_1.Logger.warn(`Creep ${creep.name} has no role assigned`, 'Kernel');
            return;
        }
        switch (creep.memory.role) {
            case 'harvester':
                const { Harvester } = require('../roles/Harvester');
                Harvester.run(creep);
                break;
            case 'builder':
                const { Builder } = require('../roles/Builder');
                Builder.run(creep);
                break;
            case 'upgrader':
                const { Upgrader } = require('../roles/Upgrader');
                Upgrader.run(creep);
                break;
            default:
                Logger_1.Logger.warn(`Unknown role: ${creep.memory.role}`, 'Kernel');
        }
    }
    safelyExecute(callback, context = 'Unknown') {
        try {
            callback();
        }
        catch (error) {
            Logger_1.Logger.error(`Error in ${context}: ${error}`, 'Kernel');
        }
    }
    registerManager(name, runFunction) {
        this.managers.push({ name, run: runFunction });
    }
}
exports.Kernel = Kernel;
