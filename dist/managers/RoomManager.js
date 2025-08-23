"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const Logger_1 = require("../utils/Logger");
const settings_1 = require("../config/settings");
const TerrainAnalyzer_1 = require("../planners/TerrainAnalyzer");
const BaseLayoutPlanner_1 = require("../planners/BaseLayoutPlanner");
const RoadPlanner_1 = require("../planners/RoadPlanner");
const TrafficAnalyzer_1 = require("../utils/TrafficAnalyzer");
class RoomManager {
    run() {
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (room && room.controller && room.controller.my) {
                this.processRoom(room);
            }
        }
    }
    processRoom(room) {
        try {
            this.initializeRoomMemory(room);
            this.updateRoomMemory(room);
            this.runPlanning(room);
            this.updateTrafficAnalysis(room);
            this.manageConstructionSites(room);
            this.runDefense(room);
        }
        catch (error) {
            Logger_1.Logger.error(`Error processing room ${room.name}: ${error}`, 'RoomManager');
        }
    }
    initializeRoomMemory(room) {
        if (!Memory.rooms[room.name]) {
            Memory.rooms[room.name] = {
                sources: {},
                spawnIds: [],
                lastUpdated: Game.time,
                rcl: room.controller ? room.controller.level : 0,
            };
            if (room.controller) {
                Memory.rooms[room.name].controllerId = room.controller.id;
            }
        }
    }
    updateRoomMemory(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory)
            return;
        roomMemory.rcl = room.controller ? room.controller.level : 0;
        roomMemory.lastUpdated = Game.time;
        this.updateSourcesMemory(room);
        this.updateSpawnsMemory(room);
    }
    updateSourcesMemory(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory)
            return;
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            if (!roomMemory.sources[source.id]) {
                roomMemory.sources[source.id] = {};
            }
            const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
            });
            if (containers.length > 0 && roomMemory.sources[source.id] && containers[0]) {
                roomMemory.sources[source.id].containerId = containers[0].id;
            }
            const links = source.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: (structure) => structure.structureType === STRUCTURE_LINK,
            });
            if (links.length > 0 && roomMemory.sources[source.id] && links[0]) {
                roomMemory.sources[source.id].linkId = links[0].id;
            }
        }
    }
    updateSpawnsMemory(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory)
            return;
        const spawns = room.find(FIND_MY_SPAWNS);
        roomMemory.spawnIds = spawns.map(spawn => spawn.id);
    }
    runPlanning(room) {
        if (!settings_1.Settings.planning.buildingPlanningEnabled)
            return;
        if (Game.time % settings_1.Settings.planning.planningCadence !== 0)
            return;
        try {
            this.initializeRoomPlan(room);
            const roomMemory = Memory.rooms[room.name];
            if (roomMemory && roomMemory.plan && roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) {
                Logger_1.Logger.info(`RoomManager: RCL changed for room ${room.name}, replanning...`);
                this.replanRoom(room);
            }
            if (this.shouldUpdateBuildingPlan(room)) {
                this.updateBuildingPlan(room);
            }
            if (this.shouldUpdateRoadPlan(room)) {
                this.updateRoadPlan(room);
            }
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error in planning for room ${room.name}: ${error}`);
        }
    }
    updateTrafficAnalysis(room) {
        if (!settings_1.Settings.planning.trafficAnalysisEnabled)
            return;
        try {
            RoadPlanner_1.RoadPlanner.updateTrafficAnalysis(room);
            TrafficAnalyzer_1.TrafficAnalyzer.trackRoomTraffic(room);
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error updating traffic analysis for room ${room.name}: ${error}`);
        }
    }
    manageConstructionSites(room) {
        try {
            if (Game.time % settings_1.Settings.planning.constructionCadence !== 0)
                return;
            this.placeBuildingConstructionSites(room);
            this.placeRoadConstructionSites(room);
            this.cleanupConstructionSites(room);
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error managing construction sites for room ${room.name}: ${error}`);
        }
    }
    initializeRoomPlan(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory)
            return;
        if (!roomMemory.plan) {
            roomMemory.plan = {
                roomName: room.name,
                buildings: [],
                roads: [],
                rcl: room.controller ? room.controller.level : 0,
                lastUpdated: Game.time,
                status: 'planning',
                priority: 1
            };
            Logger_1.Logger.info(`RoomManager: Initialized room plan for ${room.name}`);
        }
        if (!roomMemory.trafficData) {
            roomMemory.trafficData = {};
        }
        if (!roomMemory.layoutAnalysis) {
            const terrainAnalysis = TerrainAnalyzer_1.TerrainAnalyzer.analyzeRoom(room);
            const keyPositions = TerrainAnalyzer_1.TerrainAnalyzer.identifyKeyPositions(room);
            roomMemory.layoutAnalysis = {
                terrain: terrainAnalysis,
                keyPositions: keyPositions,
                lastAnalyzed: Game.time
            };
            Logger_1.Logger.info(`RoomManager: Completed terrain analysis for ${room.name}`);
        }
    }
    replanRoom(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan)
            return;
        Logger_1.Logger.info(`RoomManager: Replanning room ${room.name} for RCL ${room.controller ? room.controller.level : 0}`);
        roomMemory.plan.buildings = [];
        roomMemory.plan.roads = [];
        roomMemory.plan.rcl = room.controller ? room.controller.level : 0;
        roomMemory.plan.lastUpdated = Game.time;
        this.updateBuildingPlan(room);
        this.updateRoadPlan(room);
    }
    shouldUpdateBuildingPlan(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan)
            return true;
        if (roomMemory.plan.buildings.length === 0)
            return true;
        if (roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0))
            return true;
        const timeSinceUpdate = Game.time - roomMemory.plan.lastUpdated;
        return timeSinceUpdate > settings_1.Settings.planning.planningCadence * 10;
    }
    shouldUpdateRoadPlan(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan)
            return true;
        if (roomMemory.plan.roads.length === 0)
            return true;
        const trafficPositions = Object.keys(roomMemory.trafficData || {}).length;
        return trafficPositions > settings_1.Settings.planning.minTrafficDataPoints;
    }
    updateBuildingPlan(room) {
        try {
            const plan = BaseLayoutPlanner_1.BaseLayoutPlanner.planRoom(room);
            const roomMemory = Memory.rooms[room.name];
            if (roomMemory) {
                roomMemory.plan = plan;
                Logger_1.Logger.info(`RoomManager: Updated building plan for ${room.name} with ${plan.buildings.length} buildings`);
            }
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error updating building plan for room ${room.name}: ${error}`);
        }
    }
    updateRoadPlan(room) {
        try {
            const roomMemory = Memory.rooms[room.name];
            if (!roomMemory || !roomMemory.plan)
                return;
            const roads = RoadPlanner_1.RoadPlanner.planRoadNetwork(room, roomMemory.plan.buildings);
            roomMemory.plan.roads = roads;
            roomMemory.plan.lastUpdated = Game.time;
            Logger_1.Logger.info(`RoomManager: Updated road plan for ${room.name} with ${roads.length} roads`);
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error updating road plan for room ${room.name}: ${error}`);
        }
    }
    placeBuildingConstructionSites(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan)
            return;
        try {
            BaseLayoutPlanner_1.BaseLayoutPlanner.placeConstructionSites(room, roomMemory.plan);
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error placing building construction sites for room ${room.name}: ${error}`);
        }
    }
    placeRoadConstructionSites(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan)
            return;
        try {
            RoadPlanner_1.RoadPlanner.placeRoadConstructionSites(room, roomMemory.plan.roads);
        }
        catch (error) {
            Logger_1.Logger.error(`RoomManager: Error placing road construction sites for room ${room.name}: ${error}`);
        }
    }
    cleanupConstructionSites(room) {
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        const maxAge = settings_1.Settings.planning.constructionSiteMaxAge;
        sites.forEach(site => {
            if (Game.time - site.createdTime > maxAge && site.progress === 0) {
                site.remove();
                Logger_1.Logger.debug(`RoomManager: Removed idle construction site at ${site.pos.x},${site.pos.y} in room ${room.name}`);
            }
        });
    }
    runDefense(room) {
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length === 0) {
            return;
        }
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_TOWER,
        });
        if (towers.length === 0) {
            return;
        }
        const target = room.find(FIND_HOSTILE_CREEPS)[0];
        if (target) {
            for (const tower of towers) {
                if (tower.store[RESOURCE_ENERGY] > 0) {
                    tower.attack(target);
                }
            }
        }
    }
}
exports.RoomManager = RoomManager;
