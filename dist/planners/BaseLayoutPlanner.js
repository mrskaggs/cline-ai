"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLayoutPlanner = void 0;
const Logger_1 = require("../utils/Logger");
const PathingUtils_1 = require("../utils/PathingUtils");
const settings_1 = require("../config/settings");
const TerrainAnalyzer_1 = require("./TerrainAnalyzer");
const LayoutTemplates_1 = require("./LayoutTemplates");
class BaseLayoutPlanner {
    static planRoom(room) {
        const startCpu = Game.cpu.getUsed();
        try {
            Logger_1.Logger.info(`BaseLayoutPlanner: Planning room ${room.name} at RCL ${room.controller ? room.controller.level : 0}`);
            let plan = room.memory.plan;
            const currentRCL = room.controller ? room.controller.level : 0;
            if (!plan || plan.rcl < currentRCL || this.shouldReplan(plan)) {
                plan = this.createNewPlan(room);
            }
            this.updatePlanStatus(room, plan);
            room.memory.plan = plan;
            const cpuUsed = Game.cpu.getUsed() - startCpu;
            Logger_1.Logger.info(`BaseLayoutPlanner: Completed planning for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
            return plan;
        }
        catch (error) {
            Logger_1.Logger.error(`BaseLayoutPlanner: Error planning room ${room.name}: ${error}`);
            throw error;
        }
    }
    static createNewPlan(room) {
        const currentRCL = room.controller ? room.controller.level : 0;
        Logger_1.Logger.info(`BaseLayoutPlanner: Creating new plan for room ${room.name} at RCL ${currentRCL}`);
        let analysis = TerrainAnalyzer_1.TerrainAnalyzer.getCachedAnalysis(room);
        if (!analysis) {
            analysis = TerrainAnalyzer_1.TerrainAnalyzer.analyzeRoom(room);
        }
        const buildings = this.generateBuildingPlan(room, currentRCL);
        const plan = {
            roomName: room.name,
            rcl: currentRCL,
            lastUpdated: Game.time,
            buildings: buildings,
            roads: [],
            status: 'planning',
            priority: this.calculatePlanPriority(room)
        };
        Logger_1.Logger.info(`BaseLayoutPlanner: Created plan with ${buildings.length} buildings for room ${room.name}`);
        return plan;
    }
    static generateBuildingPlan(room, rcl) {
        const buildings = [];
        if (settings_1.Settings.planning.useTemplates) {
            const templateBuildings = this.generateTemplateBasedPlan(room, rcl);
            buildings.push(...templateBuildings);
        }
        if (settings_1.Settings.planning.useDynamicPlacement) {
            const dynamicBuildings = this.generateDynamicPlan(room, rcl, buildings);
            buildings.push(...dynamicBuildings);
        }
        return this.optimizeBuildingPlan(room, buildings);
    }
    static generateTemplateBasedPlan(room, rcl) {
        const buildings = [];
        const anchor = this.findTemplateAnchor(room);
        for (let level = 1; level <= rcl; level++) {
            const template = LayoutTemplates_1.LayoutTemplates.getTemplate(level);
            if (template && LayoutTemplates_1.LayoutTemplates.validateTemplate(template)) {
                const templateBuildings = LayoutTemplates_1.LayoutTemplates.applyTemplate(room, template, anchor);
                buildings.push(...templateBuildings);
            }
        }
        Logger_1.Logger.info(`BaseLayoutPlanner: Generated ${buildings.length} buildings from templates for room ${room.name}`);
        return buildings;
    }
    static generateDynamicPlan(room, rcl, existingBuildings) {
        const buildings = [];
        const keyPositions = TerrainAnalyzer_1.TerrainAnalyzer.identifyKeyPositions(room);
        const limits = LayoutTemplates_1.LayoutTemplates.getStructureLimits(rcl);
        const existingCounts = this.countExistingStructures(room, existingBuildings);
        for (const [structureType, limit] of Object.entries(limits)) {
            const existing = existingCounts[structureType] || 0;
            const needed = limit - existing;
            if (needed > 0) {
                const dynamicPlacements = this.planStructureDynamically(room, structureType, needed, keyPositions, existingBuildings);
                buildings.push(...dynamicPlacements);
            }
        }
        Logger_1.Logger.info(`BaseLayoutPlanner: Generated ${buildings.length} buildings from dynamic placement for room ${room.name}`);
        return buildings;
    }
    static planStructureDynamically(room, structureType, count, keyPositions, existingBuildings) {
        const buildings = [];
        const centralArea = TerrainAnalyzer_1.TerrainAnalyzer.findCentralArea(room);
        const candidates = this.findSuitablePositions(room, structureType, centralArea, keyPositions);
        const occupiedPositions = new Set(existingBuildings.map(b => `${b.pos.x},${b.pos.y}`));
        const availableCandidates = candidates.filter(pos => !occupiedPositions.has(`${pos.x},${pos.y}`));
        const selectedPositions = this.selectBestPositions(availableCandidates, structureType, count, keyPositions);
        selectedPositions.forEach((pos, index) => {
            buildings.push({
                structureType: structureType,
                pos: pos,
                priority: this.getStructurePriority(structureType, index),
                rclRequired: this.getMinRCLForStructure(structureType),
                placed: false,
                reason: `Dynamic placement for ${structureType}`
            });
        });
        return buildings;
    }
    static findSuitablePositions(room, structureType, centralArea, keyPositions) {
        const positions = [];
        const searchRadius = this.getSearchRadius(structureType);
        const searchCenter = this.getSearchCenter(structureType, centralArea, keyPositions);
        const buildableArea = TerrainAnalyzer_1.TerrainAnalyzer.calculateBuildableArea(room, searchCenter, searchRadius);
        for (const pos of buildableArea) {
            if (TerrainAnalyzer_1.TerrainAnalyzer.isSuitableForStructure(pos, structureType)) {
                positions.push(pos);
            }
        }
        return positions;
    }
    static selectBestPositions(candidates, structureType, count, keyPositions) {
        if (candidates.length <= count) {
            return candidates;
        }
        const scoredPositions = candidates.map(pos => ({
            pos: pos,
            score: this.scorePosition(pos, structureType, keyPositions)
        }));
        scoredPositions.sort((a, b) => b.score - a.score);
        return scoredPositions.slice(0, count).map(sp => sp.pos);
    }
    static scorePosition(pos, structureType, keyPositions) {
        let score = 0;
        switch (structureType) {
            case STRUCTURE_SPAWN:
                if (keyPositions.controller) {
                    score += 100 - PathingUtils_1.PathingUtils.getDistance(pos, keyPositions.controller) * 2;
                }
                keyPositions.sources.forEach(source => {
                    score += 50 - PathingUtils_1.PathingUtils.getDistance(pos, source);
                });
                break;
            case STRUCTURE_TOWER:
                const roomCenter = new RoomPosition(25, 25, pos.roomName);
                score += 100 - PathingUtils_1.PathingUtils.getDistance(pos, roomCenter) * 3;
                break;
            case STRUCTURE_STORAGE:
            case STRUCTURE_TERMINAL:
                if (keyPositions.spawn.length > 0) {
                    score += 100 - PathingUtils_1.PathingUtils.getDistance(pos, keyPositions.spawn[0]) * 2;
                }
                break;
            case STRUCTURE_EXTENSION:
                if (keyPositions.spawn.length > 0) {
                    score += 50 - PathingUtils_1.PathingUtils.getDistance(pos, keyPositions.spawn[0]);
                }
                break;
            case STRUCTURE_LAB:
                if (keyPositions.spawn.length > 0) {
                    score += 30 - PathingUtils_1.PathingUtils.getDistance(pos, keyPositions.spawn[0]);
                }
                break;
            default:
                if (keyPositions.controller) {
                    score += 50 - PathingUtils_1.PathingUtils.getDistance(pos, keyPositions.controller);
                }
                break;
        }
        return score;
    }
    static optimizeBuildingPlan(_room, buildings) {
        const uniqueBuildings = new Map();
        buildings.forEach(building => {
            const key = `${building.structureType}_${building.pos.x}_${building.pos.y}`;
            const existing = uniqueBuildings.get(key);
            if (!existing || building.priority > existing.priority) {
                uniqueBuildings.set(key, building);
            }
        });
        const optimizedBuildings = Array.from(uniqueBuildings.values());
        optimizedBuildings.sort((a, b) => b.priority - a.priority);
        Logger_1.Logger.info(`BaseLayoutPlanner: Optimized plan from ${buildings.length} to ${optimizedBuildings.length} buildings`);
        return optimizedBuildings;
    }
    static placeConstructionSites(room, plan) {
        if (!settings_1.Settings.planning.buildingPlanningEnabled)
            return;
        const currentRCL = room.controller ? room.controller.level : 0;
        const maxSites = settings_1.Settings.planning.maxConstructionSites;
        const existingSites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
        if (existingSites >= maxSites) {
            Logger_1.Logger.debug(`BaseLayoutPlanner: Room ${room.name} already has ${existingSites} construction sites`);
            return;
        }
        let sitesPlaced = 0;
        const sitesToPlace = maxSites - existingSites;
        const eligibleBuildings = plan.buildings
            .filter(building => !building.placed &&
            building.rclRequired <= currentRCL &&
            !this.hasStructureAtPosition(room, building.pos, building.structureType))
            .sort((a, b) => b.priority - a.priority);
        for (const building of eligibleBuildings) {
            if (sitesPlaced >= sitesToPlace)
                break;
            const result = room.createConstructionSite(building.pos, building.structureType);
            if (result === OK) {
                building.placed = true;
                const siteId = this.findConstructionSiteId(room, building.pos, building.structureType);
                if (siteId) {
                    building.constructionSiteId = siteId;
                }
                sitesPlaced++;
                Logger_1.Logger.info(`BaseLayoutPlanner: Placed ${building.structureType} construction site at ${building.pos.x},${building.pos.y} in room ${room.name}`);
            }
            else {
                Logger_1.Logger.warn(`BaseLayoutPlanner: Failed to place ${building.structureType} at ${building.pos.x},${building.pos.y} in room ${room.name}: ${result}`);
            }
        }
        if (sitesPlaced > 0) {
            plan.lastUpdated = Game.time;
            Logger_1.Logger.info(`BaseLayoutPlanner: Placed ${sitesPlaced} construction sites in room ${room.name}`);
        }
    }
    static shouldReplan(plan) {
        const age = Game.time - plan.lastUpdated;
        return age > settings_1.Settings.planning.layoutAnalysisTTL || plan.status === 'planning';
    }
    static updatePlanStatus(room, plan) {
        const unplacedBuildings = plan.buildings.filter(b => !b.placed).length;
        const currentRCL = room.controller ? room.controller.level : 0;
        if (unplacedBuildings === 0) {
            plan.status = 'complete';
        }
        else if (plan.buildings.some(b => b.placed)) {
            plan.status = 'building';
        }
        else {
            plan.status = 'ready';
        }
        plan.rcl = currentRCL;
    }
    static calculatePlanPriority(room) {
        const rcl = room.controller ? room.controller.level : 0;
        const energyCapacity = room.energyCapacityAvailable;
        return rcl * 10 + Math.floor(energyCapacity / 100);
    }
    static findTemplateAnchor(room) {
        const spawns = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_SPAWN
        });
        if (spawns.length > 0) {
            return spawns[0].pos;
        }
        return TerrainAnalyzer_1.TerrainAnalyzer.findCentralArea(room);
    }
    static countExistingStructures(room, plannedBuildings) {
        const counts = {};
        const structures = room.find(FIND_MY_STRUCTURES);
        structures.forEach(structure => {
            counts[structure.structureType] = (counts[structure.structureType] || 0) + 1;
        });
        plannedBuildings.forEach(building => {
            counts[building.structureType] = (counts[building.structureType] || 0) + 1;
        });
        return counts;
    }
    static getSearchRadius(structureType) {
        switch (structureType) {
            case STRUCTURE_EXTENSION: return 8;
            case STRUCTURE_TOWER: return 15;
            case STRUCTURE_SPAWN: return 10;
            case STRUCTURE_STORAGE: return 5;
            case STRUCTURE_TERMINAL: return 5;
            case STRUCTURE_LAB: return 8;
            default: return 10;
        }
    }
    static getSearchCenter(structureType, centralArea, keyPositions) {
        switch (structureType) {
            case STRUCTURE_SPAWN:
            case STRUCTURE_STORAGE:
            case STRUCTURE_TERMINAL:
                return centralArea;
            case STRUCTURE_TOWER:
                return new RoomPosition(25, 25, centralArea.roomName);
            default:
                return keyPositions.spawn.length > 0 ? keyPositions.spawn[0] : centralArea;
        }
    }
    static getStructurePriority(structureType, index) {
        const basePriority = {
            [STRUCTURE_SPAWN]: 100,
            [STRUCTURE_TOWER]: 90,
            [STRUCTURE_STORAGE]: 80,
            [STRUCTURE_EXTENSION]: 70,
            [STRUCTURE_TERMINAL]: 60,
            [STRUCTURE_LINK]: 50,
            [STRUCTURE_LAB]: 40,
            [STRUCTURE_FACTORY]: 30,
            [STRUCTURE_POWER_SPAWN]: 20,
            [STRUCTURE_NUKER]: 10,
            [STRUCTURE_OBSERVER]: 10
        };
        return (basePriority[structureType] || 50) - index;
    }
    static getMinRCLForStructure(structureType) {
        const rclRequirements = {
            [STRUCTURE_SPAWN]: 1,
            [STRUCTURE_EXTENSION]: 2,
            [STRUCTURE_TOWER]: 3,
            [STRUCTURE_STORAGE]: 4,
            [STRUCTURE_LINK]: 5,
            [STRUCTURE_TERMINAL]: 6,
            [STRUCTURE_LAB]: 6,
            [STRUCTURE_FACTORY]: 7,
            [STRUCTURE_POWER_SPAWN]: 8,
            [STRUCTURE_NUKER]: 8,
            [STRUCTURE_OBSERVER]: 8
        };
        return rclRequirements[structureType] || 1;
    }
    static hasStructureAtPosition(_room, pos, structureType) {
        const structures = pos.lookFor(LOOK_STRUCTURES);
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        return structures.some(s => s.structureType === structureType) ||
            sites.some(s => s.structureType === structureType);
    }
    static findConstructionSiteId(_room, pos, structureType) {
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const site = sites.find(s => s.structureType === structureType);
        return site ? site.id : undefined;
    }
}
exports.BaseLayoutPlanner = BaseLayoutPlanner;
