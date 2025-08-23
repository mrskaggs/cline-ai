"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainAnalyzer = void 0;
const Logger_1 = require("../utils/Logger");
const PathingUtils_1 = require("../utils/PathingUtils");
const settings_1 = require("../config/settings");
class TerrainAnalyzer {
    static analyzeRoom(room) {
        const startCpu = Game.cpu.getUsed();
        try {
            const analysis = {
                openSpaces: this.findOpenSpaces(room),
                walls: this.findWalls(room),
                swamps: this.findSwamps(room),
                exits: this.findExits(room),
                centralArea: this.findCentralArea(room)
            };
            if (!room.memory.layoutAnalysis) {
                room.memory.layoutAnalysis = {
                    terrain: analysis,
                    keyPositions: this.identifyKeyPositions(room),
                    lastAnalyzed: Game.time
                };
            }
            const cpuUsed = Game.cpu.getUsed() - startCpu;
            Logger_1.Logger.info(`TerrainAnalyzer: Analyzed room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
            return analysis;
        }
        catch (error) {
            Logger_1.Logger.error(`TerrainAnalyzer: Error analyzing room ${room.name}: ${error}`);
            throw error;
        }
    }
    static getCachedAnalysis(room) {
        const cached = room.memory.layoutAnalysis;
        if (!cached)
            return null;
        const age = Game.time - cached.lastAnalyzed;
        if (age > settings_1.Settings.planning.layoutAnalysisTTL) {
            Logger_1.Logger.debug(`TerrainAnalyzer: Cache expired for room ${room.name}, age: ${age}`);
            return null;
        }
        return cached.terrain;
    }
    static identifyKeyPositions(room) {
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        const mineral = room.find(FIND_MINERALS)[0];
        const exits = this.findExits(room);
        const spawns = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_SPAWN
        });
        const keyPositions = {
            spawn: spawns.map(spawn => spawn.pos),
            sources: sources.map(source => source.pos),
            controller: controller ? controller.pos : undefined,
            mineral: mineral ? mineral.pos : undefined,
            exits: exits
        };
        Logger_1.Logger.debug(`TerrainAnalyzer: Identified key positions for room ${room.name}:`, `${keyPositions.sources.length} sources, ${keyPositions.exits.length} exits`);
        return keyPositions;
    }
    static findOpenSpaces(room) {
        const openSpaces = [];
        for (let x = 1; x < 49; x++) {
            for (let y = 1; y < 49; y++) {
                const pos = new RoomPosition(x, y, room.name);
                if (PathingUtils_1.PathingUtils.isWalkable(pos)) {
                    openSpaces.push(pos);
                }
            }
        }
        Logger_1.Logger.debug(`TerrainAnalyzer: Found ${openSpaces.length} open spaces in room ${room.name}`);
        return openSpaces;
    }
    static findWalls(room) {
        const walls = [];
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const terrain = room.getTerrain().get(x, y);
                if (terrain & TERRAIN_MASK_WALL) {
                    walls.push(new RoomPosition(x, y, room.name));
                }
            }
        }
        return walls;
    }
    static findSwamps(room) {
        const swamps = [];
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const terrain = room.getTerrain().get(x, y);
                if (terrain & TERRAIN_MASK_SWAMP) {
                    swamps.push(new RoomPosition(x, y, room.name));
                }
            }
        }
        return swamps;
    }
    static findExits(room) {
        const exits = [];
        for (let x = 0; x < 50; x++) {
            if (!(room.getTerrain().get(x, 0) & TERRAIN_MASK_WALL)) {
                exits.push(new RoomPosition(x, 0, room.name));
            }
            if (!(room.getTerrain().get(x, 49) & TERRAIN_MASK_WALL)) {
                exits.push(new RoomPosition(x, 49, room.name));
            }
        }
        for (let y = 0; y < 50; y++) {
            if (!(room.getTerrain().get(0, y) & TERRAIN_MASK_WALL)) {
                exits.push(new RoomPosition(0, y, room.name));
            }
            if (!(room.getTerrain().get(49, y) & TERRAIN_MASK_WALL)) {
                exits.push(new RoomPosition(49, y, room.name));
            }
        }
        return exits;
    }
    static findCentralArea(room) {
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        if (!controller) {
            return new RoomPosition(25, 25, room.name);
        }
        let totalX = 0;
        let totalY = 0;
        let totalWeight = 0;
        totalX += controller.pos.x * 2;
        totalY += controller.pos.y * 2;
        totalWeight += 2;
        sources.forEach(source => {
            totalX += source.pos.x;
            totalY += source.pos.y;
            totalWeight += 1;
        });
        const centerX = Math.round(totalX / totalWeight);
        const centerY = Math.round(totalY / totalWeight);
        const idealCenter = new RoomPosition(centerX, centerY, room.name);
        if (PathingUtils_1.PathingUtils.isWalkable(idealCenter)) {
            return idealCenter;
        }
        for (let range = 1; range <= 10; range++) {
            const positions = PathingUtils_1.PathingUtils.getPositionsInRange(idealCenter, range);
            for (const pos of positions) {
                if (PathingUtils_1.PathingUtils.isWalkable(pos)) {
                    Logger_1.Logger.debug(`TerrainAnalyzer: Central area for room ${room.name} at ${pos.x},${pos.y} (range ${range} from ideal)`);
                    return pos;
                }
            }
        }
        Logger_1.Logger.warn(`TerrainAnalyzer: Could not find suitable central area for room ${room.name}, using room center`);
        return new RoomPosition(25, 25, room.name);
    }
    static calculateBuildableArea(room, center, radius = 10) {
        const buildablePositions = [];
        for (let x = Math.max(1, center.x - radius); x <= Math.min(48, center.x + radius); x++) {
            for (let y = Math.max(1, center.y - radius); y <= Math.min(48, center.y + radius); y++) {
                const pos = new RoomPosition(x, y, room.name);
                const distance = PathingUtils_1.PathingUtils.getDistance(center, pos);
                if (distance <= radius && PathingUtils_1.PathingUtils.isWalkable(pos)) {
                    buildablePositions.push(pos);
                }
            }
        }
        Logger_1.Logger.debug(`TerrainAnalyzer: Found ${buildablePositions.length} buildable positions within ${radius} of ${center.x},${center.y}`);
        return buildablePositions;
    }
    static isSuitableForStructure(pos, structureType) {
        if (!PathingUtils_1.PathingUtils.isWalkable(pos)) {
            return false;
        }
        const room = Game.rooms[pos.roomName];
        if (!room)
            return false;
        const structures = pos.lookFor(LOOK_STRUCTURES);
        if (structures.length > 0) {
            const hasBlockingStructure = structures.some(s => s.structureType !== STRUCTURE_ROAD &&
                s.structureType !== STRUCTURE_CONTAINER);
            if (hasBlockingStructure)
                return false;
        }
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (sites.length > 0)
            return false;
        switch (structureType) {
            case STRUCTURE_SPAWN:
                return this.hasMinimumClearance(pos, 1);
            case STRUCTURE_EXTENSION:
                return true;
            case STRUCTURE_TOWER:
                return this.hasMinimumClearance(pos, 1);
            case STRUCTURE_STORAGE:
            case STRUCTURE_TERMINAL:
                return this.hasMinimumClearance(pos, 1);
            default:
                return true;
        }
    }
    static hasMinimumClearance(pos, minClearance) {
        const positions = PathingUtils_1.PathingUtils.getPositionsInRange(pos, minClearance);
        const walkableCount = positions.filter(p => PathingUtils_1.PathingUtils.isWalkable(p)).length;
        const totalPositions = positions.length;
        return (walkableCount / totalPositions) >= 0.6;
    }
    static clearCache(roomName) {
        const room = Game.rooms[roomName];
        if (room && room.memory.layoutAnalysis) {
            delete room.memory.layoutAnalysis;
            Logger_1.Logger.debug(`TerrainAnalyzer: Cleared cache for room ${roomName}`);
        }
    }
}
exports.TerrainAnalyzer = TerrainAnalyzer;
