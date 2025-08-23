"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficAnalyzer = void 0;
const Logger_1 = require("./Logger");
const settings_1 = require("../config/settings");
class TrafficAnalyzer {
    static trackCreepMovement(creep) {
        if (!settings_1.Settings.planning.trafficAnalysisEnabled)
            return;
        const room = creep.room;
        if (!room.memory.trafficData) {
            room.memory.trafficData = {};
        }
        const posKey = `${creep.pos.x},${creep.pos.y}`;
        const trafficData = room.memory.trafficData;
        if (!trafficData[posKey]) {
            trafficData[posKey] = {
                count: 0,
                lastSeen: Game.time,
                creepTypes: []
            };
        }
        const data = trafficData[posKey];
        data.count++;
        data.lastSeen = Game.time;
        if (creep.memory.role && !data.creepTypes.includes(creep.memory.role)) {
            data.creepTypes.push(creep.memory.role);
        }
    }
    static analyzeTrafficPatterns(room) {
        if (!room.memory.trafficData) {
            room.memory.trafficData = {};
        }
        const trafficData = room.memory.trafficData;
        const currentTime = Game.time;
        const ttl = settings_1.Settings.planning.trafficDataTTL;
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (data && currentTime - data.lastSeen > ttl) {
                delete trafficData[posKey];
            }
        }
        Logger_1.Logger.debug(`TrafficAnalyzer: Analyzed traffic for room ${room.name}, ${Object.keys(trafficData).length} positions tracked`);
        return trafficData;
    }
    static getTrafficScore(room, pos) {
        if (!room.memory.trafficData)
            return 0;
        const posKey = `${pos.x},${pos.y}`;
        const data = room.memory.trafficData[posKey];
        if (!data)
            return 0;
        const age = Game.time - data.lastSeen;
        const ageFactor = Math.max(0, 1 - (age / settings_1.Settings.planning.trafficDataTTL));
        return data.count * ageFactor;
    }
    static getHighTrafficPositions(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const highTrafficPositions = [];
        const minTraffic = settings_1.Settings.planning.minTrafficForRoad;
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (!data)
                continue;
            const coords = posKey.split(',').map(Number);
            if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const pos = new RoomPosition(coords[0], coords[1], room.name);
                if (data.count >= minTraffic) {
                    highTrafficPositions.push(pos);
                }
            }
        }
        Logger_1.Logger.debug(`TrafficAnalyzer: Found ${highTrafficPositions.length} high traffic positions in room ${room.name}`);
        return highTrafficPositions;
    }
    static getTrafficDensityMap(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const densityMap = {};
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (!data)
                continue;
            const score = this.getTrafficScore(room, this.parsePositionKey(posKey, room.name));
            densityMap[posKey] = score;
        }
        return densityMap;
    }
    static analyzeTrafficBetweenPositions(room, from, to) {
        this.analyzeTrafficPatterns(room);
        const positions = this.getPositionsBetween(from, to);
        let totalTraffic = 0;
        const hotspots = [];
        const threshold = settings_1.Settings.planning.roadPriorityThreshold;
        for (const pos of positions) {
            const score = this.getTrafficScore(room, pos);
            totalTraffic += score;
            if (score >= threshold) {
                hotspots.push(pos);
            }
        }
        const averageTraffic = positions.length > 0 ? totalTraffic / positions.length : 0;
        return {
            averageTraffic: averageTraffic,
            hotspots: hotspots
        };
    }
    static getPositionsBetween(from, to) {
        if (from.roomName !== to.roomName)
            return [];
        const positions = [];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (distance === 0)
            return [from];
        for (let i = 0; i <= distance; i++) {
            const rawX = from.x + (dx * i) / distance;
            const rawY = from.y + (dy * i) / distance;
            const x = Math.round(rawX);
            const y = Math.round(rawY);
            const safeX = isNaN(x) ? 0 : x;
            const safeY = isNaN(y) ? 0 : y;
            const clampedX = Math.max(0, Math.min(49, safeX));
            const clampedY = Math.max(0, Math.min(49, safeY));
            positions.push(new RoomPosition(clampedX, clampedY, from.roomName));
        }
        return positions;
    }
    static parsePositionKey(posKey, roomName) {
        const coords = posKey.split(',').map(Number);
        if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
            return new RoomPosition(coords[0], coords[1], roomName);
        }
        return new RoomPosition(0, 0, roomName);
    }
    static getTrafficStatistics(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const positions = Object.keys(trafficData);
        let totalTraffic = 0;
        let highTrafficCount = 0;
        const creepTypeCounts = {};
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (!data)
                continue;
            totalTraffic += data.count;
            if (data.count >= settings_1.Settings.planning.minTrafficForRoad) {
                highTrafficCount++;
            }
            data.creepTypes.forEach(type => {
                creepTypeCounts[type] = (creepTypeCounts[type] || 0) + data.count;
            });
        }
        const topCreepTypes = Object.entries(creepTypeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type]) => type);
        return {
            totalPositions: positions.length,
            totalTraffic: totalTraffic,
            averageTraffic: positions.length > 0 ? totalTraffic / positions.length : 0,
            highTrafficPositions: highTrafficCount,
            topCreepTypes: topCreepTypes
        };
    }
    static clearTrafficData(roomName) {
        const room = Game.rooms[roomName];
        if (room && room.memory.trafficData) {
            delete room.memory.trafficData;
            Logger_1.Logger.debug(`TrafficAnalyzer: Cleared traffic data for room ${roomName}`);
        }
    }
    static optimizeTrafficData(room) {
        if (!room.memory.trafficData)
            return;
        const trafficData = room.memory.trafficData;
        const minTraffic = Math.max(1, settings_1.Settings.planning.minTrafficForRoad / 4);
        let removedCount = 0;
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (data && data.count < minTraffic) {
                delete trafficData[posKey];
                removedCount++;
            }
        }
        if (removedCount > 0) {
            Logger_1.Logger.debug(`TrafficAnalyzer: Optimized traffic data for room ${room.name}, removed ${removedCount} low-traffic positions`);
        }
    }
    static getRecommendedRoadPositions(room) {
        const highTrafficPositions = this.getHighTrafficPositions(room);
        const recommendedPositions = [];
        for (const pos of highTrafficPositions) {
            const structures = pos.lookFor(LOOK_STRUCTURES);
            const hasRoad = structures.some(s => s.structureType === STRUCTURE_ROAD);
            const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            const hasRoadSite = sites.some(s => s.structureType === STRUCTURE_ROAD);
            if (!hasRoad && !hasRoadSite) {
                recommendedPositions.push(pos);
            }
        }
        Logger_1.Logger.debug(`TrafficAnalyzer: Recommended ${recommendedPositions.length} road positions for room ${room.name}`);
        return recommendedPositions;
    }
    static trackRoomTraffic(room) {
        if (!settings_1.Settings.planning.trafficAnalysisEnabled)
            return;
        const creeps = room.find(FIND_MY_CREEPS);
        for (const creep of creeps) {
            this.trackCreepMovement(creep);
        }
        if (Game.time % 100 === 0) {
            this.optimizeTrafficData(room);
        }
    }
    static getTrafficHeatmap(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const heatmapData = [];
        let maxTraffic = 0;
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (data) {
                maxTraffic = Math.max(maxTraffic, data.count);
            }
        }
        if (maxTraffic === 0)
            return heatmapData;
        for (const posKey in trafficData) {
            const data = trafficData[posKey];
            if (!data)
                continue;
            const coords = posKey.split(',').map(Number);
            if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const x = coords[0];
                const y = coords[1];
                const intensity = data.count / maxTraffic;
                heatmapData.push({ x, y, intensity });
            }
        }
        return heatmapData;
    }
}
exports.TrafficAnalyzer = TrafficAnalyzer;
