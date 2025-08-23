"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadPlanner = void 0;
const Logger_1 = require("../utils/Logger");
const PathingUtils_1 = require("../utils/PathingUtils");
const TrafficAnalyzer_1 = require("../utils/TrafficAnalyzer");
const TerrainAnalyzer_1 = require("./TerrainAnalyzer");
const settings_1 = require("../config/settings");
class RoadPlanner {
    static planRoadNetwork(room, _buildings) {
        if (!settings_1.Settings.planning.roadPlanningEnabled)
            return [];
        const startCpu = Game.cpu.getUsed();
        try {
            Logger_1.Logger.info(`RoadPlanner: Planning road network for room ${room.name}`);
            const keyPositions = TerrainAnalyzer_1.TerrainAnalyzer.identifyKeyPositions(room);
            const optimalPaths = this.calculateOptimalPaths(room, keyPositions);
            const trafficData = TrafficAnalyzer_1.TrafficAnalyzer.analyzeTrafficPatterns(room);
            const roads = this.optimizeRoadPlacement(optimalPaths, trafficData, room);
            const cpuUsed = Game.cpu.getUsed() - startCpu;
            Logger_1.Logger.info(`RoadPlanner: Planned ${roads.length} roads for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
            return roads;
        }
        catch (error) {
            Logger_1.Logger.error(`RoadPlanner: Error planning roads for room ${room.name}: ${error}`);
            return [];
        }
    }
    static calculateOptimalPaths(room, keyPositions) {
        const paths = [];
        keyPositions.spawn.forEach(spawnPos => {
            keyPositions.sources.forEach(sourcePos => {
                const path = PathingUtils_1.PathingUtils.findPath(spawnPos, sourcePos);
                if (!path.incomplete && path.path.length > 0) {
                    paths.push(path.path);
                }
            });
        });
        if (keyPositions.controller) {
            keyPositions.spawn.forEach(spawnPos => {
                const path = PathingUtils_1.PathingUtils.findPath(spawnPos, keyPositions.controller);
                if (!path.incomplete && path.path.length > 0) {
                    paths.push(path.path);
                }
            });
        }
        if (keyPositions.controller) {
            keyPositions.sources.forEach(sourcePos => {
                const path = PathingUtils_1.PathingUtils.findPath(sourcePos, keyPositions.controller);
                if (!path.incomplete && path.path.length > 0) {
                    paths.push(path.path);
                }
            });
        }
        if (keyPositions.mineral) {
            keyPositions.spawn.forEach(spawnPos => {
                const path = PathingUtils_1.PathingUtils.findPath(spawnPos, keyPositions.mineral);
                if (!path.incomplete && path.path.length > 0) {
                    paths.push(path.path);
                }
            });
        }
        const mainExits = this.getMainExits(keyPositions.exits);
        keyPositions.spawn.forEach(spawnPos => {
            mainExits.forEach(exitPos => {
                const path = PathingUtils_1.PathingUtils.findPath(spawnPos, exitPos);
                if (!path.incomplete && path.path.length > 0) {
                    paths.push(path.path);
                }
            });
        });
        Logger_1.Logger.debug(`RoadPlanner: Calculated ${paths.length} optimal paths for room ${room.name}`);
        return paths;
    }
    static optimizeRoadPlacement(paths, _trafficData, room) {
        const roadPositions = new Map();
        paths.forEach((path, _pathIndex) => {
            const pathType = this.determinePathType(path, room);
            path.forEach(pos => {
                const posKey = `${pos.x},${pos.y}`;
                if (this.hasRoadOrStructure(pos)) {
                    return;
                }
                const trafficScore = TrafficAnalyzer_1.TrafficAnalyzer.getTrafficScore(room, pos);
                const pathPriority = this.getPathPriority(pathType);
                const priority = pathPriority + Math.floor(trafficScore / 10);
                const existingRoad = roadPositions.get(posKey);
                if (!existingRoad || priority > existingRoad.priority) {
                    roadPositions.set(posKey, {
                        pos: pos,
                        priority: priority,
                        trafficScore: trafficScore,
                        placed: false,
                        pathType: pathType
                    });
                }
            });
        });
        const highTrafficPositions = TrafficAnalyzer_1.TrafficAnalyzer.getHighTrafficPositions(room);
        highTrafficPositions.forEach(pos => {
            const posKey = `${pos.x},${pos.y}`;
            if (!roadPositions.has(posKey) && !this.hasRoadOrStructure(pos)) {
                const trafficScore = TrafficAnalyzer_1.TrafficAnalyzer.getTrafficScore(room, pos);
                roadPositions.set(posKey, {
                    pos: pos,
                    priority: Math.floor(trafficScore / 5),
                    trafficScore: trafficScore,
                    placed: false,
                    pathType: 'internal'
                });
            }
        });
        const roads = Array.from(roadPositions.values());
        roads.sort((a, b) => b.priority - a.priority);
        Logger_1.Logger.info(`RoadPlanner: Generated ${roads.length} road positions for room ${room.name}`);
        return roads;
    }
    static placeRoadConstructionSites(room, roads) {
        if (!settings_1.Settings.planning.roadPlanningEnabled)
            return;
        const maxSites = Math.floor(settings_1.Settings.planning.maxConstructionSites / 2);
        const existingRoadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (site) => site.structureType === STRUCTURE_ROAD
        }).length;
        if (existingRoadSites >= maxSites) {
            Logger_1.Logger.debug(`RoadPlanner: Room ${room.name} already has ${existingRoadSites} road construction sites`);
            return;
        }
        let sitesPlaced = 0;
        const sitesToPlace = maxSites - existingRoadSites;
        const eligibleRoads = roads
            .filter(road => !road.placed &&
            road.trafficScore >= settings_1.Settings.planning.minTrafficForRoad &&
            !this.hasRoadOrStructure(road.pos))
            .sort((a, b) => b.priority - a.priority);
        for (const road of eligibleRoads) {
            if (sitesPlaced >= sitesToPlace)
                break;
            const result = room.createConstructionSite(road.pos, STRUCTURE_ROAD);
            if (result === OK) {
                road.placed = true;
                const siteId = this.findRoadConstructionSiteId(room, road.pos);
                if (siteId) {
                    road.constructionSiteId = siteId;
                }
                sitesPlaced++;
                Logger_1.Logger.info(`RoadPlanner: Placed road construction site at ${road.pos.x},${road.pos.y} in room ${room.name} (priority: ${road.priority})`);
            }
            else {
                Logger_1.Logger.warn(`RoadPlanner: Failed to place road at ${road.pos.x},${road.pos.y} in room ${room.name}: ${result}`);
            }
        }
        if (sitesPlaced > 0) {
            Logger_1.Logger.info(`RoadPlanner: Placed ${sitesPlaced} road construction sites in room ${room.name}`);
        }
    }
    static updateTrafficAnalysis(room) {
        if (!settings_1.Settings.planning.trafficAnalysisEnabled)
            return;
        TrafficAnalyzer_1.TrafficAnalyzer.trackRoomTraffic(room);
        if (Game.time % settings_1.Settings.planning.constructionCadence === 0) {
            TrafficAnalyzer_1.TrafficAnalyzer.analyzeTrafficPatterns(room);
        }
    }
    static getRecommendedRoadUpgrades(room) {
        const recommendations = [];
        const trafficData = TrafficAnalyzer_1.TrafficAnalyzer.analyzeTrafficPatterns(room);
        const threshold = settings_1.Settings.planning.roadPriorityThreshold;
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (!data)
                continue;
            const coords = posKey.split(',').map(Number);
            if (coords.length !== 2 || typeof coords[0] !== 'number' || typeof coords[1] !== 'number' || isNaN(coords[0]) || isNaN(coords[1]))
                continue;
            const pos = new RoomPosition(coords[0], coords[1], room.name);
            if (data.count >= threshold && !this.hasRoadOrStructure(pos)) {
                recommendations.push(pos);
            }
        }
        recommendations.sort((a, b) => {
            const scoreA = TrafficAnalyzer_1.TrafficAnalyzer.getTrafficScore(room, a);
            const scoreB = TrafficAnalyzer_1.TrafficAnalyzer.getTrafficScore(room, b);
            return scoreB - scoreA;
        });
        Logger_1.Logger.debug(`RoadPlanner: Found ${recommendations.length} road upgrade recommendations for room ${room.name}`);
        return recommendations;
    }
    static determinePathType(path, room) {
        if (path.length === 0)
            return 'internal';
        const start = path[0];
        const end = path[path.length - 1];
        if (!start || !end)
            return 'internal';
        const sources = room.find(FIND_SOURCES);
        if (sources.some(source => source.pos.isEqualTo(start) || source.pos.isEqualTo(end))) {
            return 'source';
        }
        const controller = room.controller;
        if (controller && (controller.pos.isEqualTo(start) || controller.pos.isEqualTo(end))) {
            return 'controller';
        }
        const minerals = room.find(FIND_MINERALS);
        if (minerals.some(mineral => mineral.pos.isEqualTo(start) || mineral.pos.isEqualTo(end))) {
            return 'mineral';
        }
        if (this.isExitPosition(start, room) || this.isExitPosition(end, room)) {
            return 'exit';
        }
        return 'internal';
    }
    static getPathPriority(pathType) {
        switch (pathType) {
            case 'source': return 100;
            case 'controller': return 90;
            case 'mineral': return 70;
            case 'exit': return 60;
            case 'internal': return 50;
            default: return 40;
        }
    }
    static hasRoadOrStructure(pos) {
        const structures = pos.lookFor(LOOK_STRUCTURES);
        const hasRoad = structures.some(s => s.structureType === STRUCTURE_ROAD);
        const hasBlockingStructure = structures.some(s => s.structureType !== STRUCTURE_ROAD &&
            s.structureType !== STRUCTURE_CONTAINER &&
            !(s.structureType === STRUCTURE_RAMPART && s.my));
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const hasRoadSite = sites.some(s => s.structureType === STRUCTURE_ROAD);
        return hasRoad || hasBlockingStructure || hasRoadSite;
    }
    static isExitPosition(pos, _room) {
        return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
    }
    static getMainExits(exits) {
        return exits.slice(0, 4);
    }
    static findRoadConstructionSiteId(_room, pos) {
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const roadSite = sites.find(s => s.structureType === STRUCTURE_ROAD);
        return roadSite ? roadSite.id : undefined;
    }
    static getRoadNetworkStats(room) {
        const roads = room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_ROAD
        });
        const roadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: (site) => site.structureType === STRUCTURE_ROAD
        });
        const totalHealth = roads.reduce((sum, road) => sum + road.hits, 0);
        const averageHealth = roads.length > 0 ? totalHealth / (roads.length * ROAD_HITS) : 0;
        let highTrafficRoads = 0;
        const threshold = settings_1.Settings.planning.roadPriorityThreshold;
        roads.forEach(road => {
            const trafficScore = TrafficAnalyzer_1.TrafficAnalyzer.getTrafficScore(room, road.pos);
            if (trafficScore >= threshold) {
                highTrafficRoads++;
            }
        });
        const recommendedUpgrades = this.getRecommendedRoadUpgrades(room).length;
        return {
            totalRoads: roads.length,
            roadConstructionSites: roadSites.length,
            averageRoadHealth: averageHealth,
            highTrafficRoads: highTrafficRoads,
            recommendedUpgrades: recommendedUpgrades
        };
    }
    static clearRoadPlan(roomName) {
        const room = Game.rooms[roomName];
        if (room && room.memory.plan) {
            room.memory.plan.roads = [];
            Logger_1.Logger.debug(`RoadPlanner: Cleared road plan for room ${roomName}`);
        }
    }
}
exports.RoadPlanner = RoadPlanner;
