"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathingUtils = void 0;
const Logger_1 = require("./Logger");
class PathingUtils {
    static getCostMatrix(roomName) {
        const room = Game.rooms[roomName];
        if (!room) {
            return new PathFinder.CostMatrix();
        }
        const cached = this.costMatrixCache[roomName];
        const currentTick = Game.time;
        if (cached && (currentTick - cached.lastModified) < this.CACHE_TTL) {
            return cached.matrix;
        }
        const matrix = this.createCostMatrix(room);
        this.costMatrixCache[roomName] = {
            matrix: matrix,
            lastModified: currentTick
        };
        return matrix;
    }
    static createCostMatrix(room) {
        const matrix = new PathFinder.CostMatrix();
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                const terrain = room.getTerrain().get(x, y);
                if (terrain & TERRAIN_MASK_WALL) {
                    matrix.set(x, y, 255);
                }
                else if (terrain & TERRAIN_MASK_SWAMP) {
                    matrix.set(x, y, 5);
                }
                else {
                    matrix.set(x, y, 1);
                }
            }
        }
        room.find(FIND_STRUCTURES).forEach(structure => {
            if (structure.structureType === STRUCTURE_ROAD) {
                matrix.set(structure.pos.x, structure.pos.y, 1);
            }
            else if (structure.structureType === STRUCTURE_CONTAINER) {
                matrix.set(structure.pos.x, structure.pos.y, 1);
            }
            else if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
                matrix.set(structure.pos.x, structure.pos.y, 1);
            }
            else {
                matrix.set(structure.pos.x, structure.pos.y, 255);
            }
        });
        room.find(FIND_CONSTRUCTION_SITES).forEach(site => {
            if (site.structureType === STRUCTURE_ROAD) {
                matrix.set(site.pos.x, site.pos.y, 1);
            }
            else if (site.structureType === STRUCTURE_CONTAINER) {
                matrix.set(site.pos.x, site.pos.y, 1);
            }
            else if (site.structureType === STRUCTURE_RAMPART) {
                matrix.set(site.pos.x, site.pos.y, 1);
            }
            else {
                matrix.set(site.pos.x, site.pos.y, 255);
            }
        });
        return matrix;
    }
    static findPath(from, to, options = {}) {
        const defaultOptions = {
            roomCallback: (roomName) => {
                return this.getCostMatrix(roomName);
            },
            maxOps: 2000,
            maxRooms: 1,
            ...options
        };
        return PathFinder.search(from, to, defaultOptions);
    }
    static findMultiplePaths(from, targets, options = {}) {
        return targets.map(target => this.findPath(from, target, options));
    }
    static getDistance(pos1, pos2) {
        if (pos1.roomName !== pos2.roomName) {
            return Infinity;
        }
        return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
    }
    static isWalkable(pos) {
        const room = Game.rooms[pos.roomName];
        if (!room)
            return false;
        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain & TERRAIN_MASK_WALL) {
            return false;
        }
        const structures = pos.lookFor(LOOK_STRUCTURES);
        for (const structure of structures) {
            if (structure.structureType !== STRUCTURE_ROAD &&
                structure.structureType !== STRUCTURE_CONTAINER &&
                !(structure.structureType === STRUCTURE_RAMPART && structure.my)) {
                return false;
            }
        }
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        for (const site of sites) {
            if (site.structureType !== STRUCTURE_ROAD &&
                site.structureType !== STRUCTURE_CONTAINER &&
                site.structureType !== STRUCTURE_RAMPART) {
                return false;
            }
        }
        return true;
    }
    static getPositionsInRange(center, range) {
        const positions = [];
        for (let x = Math.max(0, center.x - range); x <= Math.min(49, center.x + range); x++) {
            for (let y = Math.max(0, center.y - range); y <= Math.min(49, center.y + range); y++) {
                if (this.getDistance(center, new RoomPosition(x, y, center.roomName)) <= range) {
                    positions.push(new RoomPosition(x, y, center.roomName));
                }
            }
        }
        return positions;
    }
    static clearCache(roomName) {
        if (roomName) {
            delete this.costMatrixCache[roomName];
            Logger_1.Logger.debug(`PathingUtils: Cleared cache for room ${roomName}`);
        }
        else {
            this.costMatrixCache = {};
            Logger_1.Logger.debug('PathingUtils: Cleared all cost matrix cache');
        }
    }
    static serializePath(path) {
        return path.map(pos => `${pos.x},${pos.y}`).join('|');
    }
    static deserializePath(serialized, roomName) {
        if (!serialized)
            return [];
        return serialized.split('|').map(posStr => {
            const [x, y] = posStr.split(',').map(Number);
            if (typeof x === 'number' && typeof y === 'number') {
                return new RoomPosition(x, y, roomName);
            }
            return undefined;
        }).filter((pos) => pos !== undefined);
    }
}
exports.PathingUtils = PathingUtils;
PathingUtils.costMatrixCache = {};
PathingUtils.CACHE_TTL = 1000;
