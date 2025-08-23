"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutTemplates = void 0;
const Logger_1 = require("../utils/Logger");
class LayoutTemplates {
    static getTemplate(rcl) {
        switch (rcl) {
            case 1:
                return this.getRCL1Template();
            case 2:
                return this.getRCL2Template();
            case 3:
                return this.getRCL3Template();
            case 4:
                return this.getRCL4Template();
            case 5:
                return this.getRCL5Template();
            case 6:
                return this.getRCL6Template();
            case 7:
                return this.getRCL7Template();
            case 8:
                return this.getRCL8Template();
            default:
                Logger_1.Logger.warn(`LayoutTemplates: No template available for RCL ${rcl}`);
                return null;
        }
    }
    static getBuildingsForRCL(rcl) {
        const template = this.getTemplate(rcl);
        if (!template)
            return [];
        const allBuildings = [];
        for (let level = 1; level <= rcl; level++) {
            const levelTemplate = this.getTemplate(level);
            if (levelTemplate) {
                allBuildings.push(...levelTemplate.buildings);
            }
        }
        return allBuildings;
    }
    static getRCL1Template() {
        return {
            name: 'RCL1_Basic',
            rcl: 1,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_SPAWN, offset: { x: 0, y: 0 }, priority: 1 }
            ]
        };
    }
    static getRCL2Template() {
        return {
            name: 'RCL2_Extensions',
            rcl: 2,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 0 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 0 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -1 }, priority: 3 }
            ]
        };
    }
    static getRCL3Template() {
        return {
            name: 'RCL3_Tower',
            rcl: 3,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_TOWER, offset: { x: 2, y: 0 }, priority: 1 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 0 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -2 }, priority: 3 }
            ]
        };
    }
    static getRCL4Template() {
        return {
            name: 'RCL4_Storage',
            rcl: 4,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_STORAGE, offset: { x: 0, y: 2 }, priority: 1 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: 2 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: 0 }, priority: 4 }
            ]
        };
    }
    static getRCL5Template() {
        return {
            name: 'RCL5_Links',
            rcl: 5,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_TOWER, offset: { x: -2, y: 0 }, priority: 1 },
                { structureType: STRUCTURE_LINK, offset: { x: 0, y: 3 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 0 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: -1 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: 1 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: -1 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 1 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -2 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -2 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 2 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 2 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -3 }, priority: 4 }
            ]
        };
    }
    static getRCL6Template() {
        return {
            name: 'RCL6_Labs',
            rcl: 6,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_TERMINAL, offset: { x: -1, y: 3 }, priority: 1 },
                { structureType: STRUCTURE_LAB, offset: { x: 4, y: 0 }, priority: 2 },
                { structureType: STRUCTURE_LAB, offset: { x: 4, y: -1 }, priority: 2 },
                { structureType: STRUCTURE_LAB, offset: { x: 4, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: 0 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: -2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: -2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: -1 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: 1 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 3 }, priority: 4 }
            ]
        };
    }
    static getRCL7Template() {
        return {
            name: 'RCL7_Factory',
            rcl: 7,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_FACTORY, offset: { x: 5, y: 0 }, priority: 1 },
                { structureType: STRUCTURE_LAB, offset: { x: 4, y: 2 }, priority: 2 },
                { structureType: STRUCTURE_LAB, offset: { x: 5, y: -1 }, priority: 2 },
                { structureType: STRUCTURE_LAB, offset: { x: 5, y: 1 }, priority: 2 },
                { structureType: STRUCTURE_LAB, offset: { x: 3, y: -3 }, priority: 3 },
                { structureType: STRUCTURE_LAB, offset: { x: 3, y: 3 }, priority: 3 },
                { structureType: STRUCTURE_LAB, offset: { x: -4, y: -2 }, priority: 3 },
                { structureType: STRUCTURE_LAB, offset: { x: -4, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -5, y: 0 }, priority: 3 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: -3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: 3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 4, y: -3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 4, y: 3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -5, y: -1 }, priority: 5 }
            ]
        };
    }
    static getRCL8Template() {
        return {
            name: 'RCL8_Complete',
            rcl: 8,
            centerOffset: { x: 0, y: 0 },
            buildings: [
                { structureType: STRUCTURE_TOWER, offset: { x: 0, y: -4 }, priority: 1 },
                { structureType: STRUCTURE_SPAWN, offset: { x: -5, y: -2 }, priority: 1 },
                { structureType: STRUCTURE_SPAWN, offset: { x: 5, y: -2 }, priority: 1 },
                { structureType: STRUCTURE_POWER_SPAWN, offset: { x: 0, y: 4 }, priority: 2 },
                { structureType: STRUCTURE_NUKER, offset: { x: -5, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_OBSERVER, offset: { x: 5, y: 2 }, priority: 3 },
                { structureType: STRUCTURE_LINK, offset: { x: -3, y: 3 }, priority: 2 },
                { structureType: STRUCTURE_LINK, offset: { x: 3, y: -4 }, priority: 2 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -5, y: 1 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 5, y: 3 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: -4 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 4 }, priority: 4 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -4 }, priority: 5 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -4 }, priority: 5 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 4 }, priority: 5 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 4 }, priority: 5 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: -6, y: 0 }, priority: 5 },
                { structureType: STRUCTURE_EXTENSION, offset: { x: 6, y: 0 }, priority: 5 }
            ]
        };
    }
    static applyTemplate(room, template, anchor) {
        const plannedBuildings = [];
        Logger_1.Logger.info(`LayoutTemplates: Applying template ${template.name} to room ${room.name} at anchor ${anchor.x},${anchor.y}`);
        for (const building of template.buildings) {
            const targetX = anchor.x + building.offset.x;
            const targetY = anchor.y + building.offset.y;
            if (targetX < 1 || targetX > 48 || targetY < 1 || targetY > 48) {
                Logger_1.Logger.debug(`LayoutTemplates: Skipping ${building.structureType} at ${targetX},${targetY} - out of bounds`);
                continue;
            }
            const pos = new RoomPosition(targetX, targetY, room.name);
            plannedBuildings.push({
                structureType: building.structureType,
                pos: pos,
                priority: building.priority,
                rclRequired: template.rcl,
                placed: false,
                reason: `Template ${template.name} placement`
            });
        }
        Logger_1.Logger.info(`LayoutTemplates: Generated ${plannedBuildings.length} planned buildings from template ${template.name}`);
        return plannedBuildings;
    }
    static getStructureLimits(rcl) {
        const limits = {};
        limits[STRUCTURE_SPAWN] = Math.min(rcl >= 7 ? 3 : 1, rcl >= 8 ? 3 : rcl >= 7 ? 2 : 1);
        limits[STRUCTURE_EXTENSION] = Math.min(rcl * 10, 60);
        limits[STRUCTURE_TOWER] = Math.min(Math.floor(rcl / 3) + (rcl >= 3 ? 1 : 0), 6);
        limits[STRUCTURE_STORAGE] = rcl >= 4 ? 1 : 0;
        limits[STRUCTURE_LINK] = rcl >= 5 ? Math.min(Math.floor((rcl - 4) * 2), 6) : 0;
        limits[STRUCTURE_TERMINAL] = rcl >= 6 ? 1 : 0;
        limits[STRUCTURE_LAB] = rcl >= 6 ? Math.min((rcl - 5) * 3 + 3, 10) : 0;
        limits[STRUCTURE_FACTORY] = rcl >= 7 ? 1 : 0;
        limits[STRUCTURE_POWER_SPAWN] = rcl >= 8 ? 1 : 0;
        limits[STRUCTURE_NUKER] = rcl >= 8 ? 1 : 0;
        limits[STRUCTURE_OBSERVER] = rcl >= 8 ? 1 : 0;
        return limits;
    }
    static validateTemplate(template) {
        const limits = this.getStructureLimits(template.rcl);
        const counts = {};
        for (const building of template.buildings) {
            const type = building.structureType;
            counts[type] = (counts[type] || 0) + 1;
        }
        for (const [type, count] of Object.entries(counts)) {
            const limit = limits[type] || 0;
            if (count > limit) {
                Logger_1.Logger.error(`LayoutTemplates: Template ${template.name} exceeds limit for ${type}: ${count} > ${limit}`);
                return false;
            }
        }
        return true;
    }
}
exports.LayoutTemplates = LayoutTemplates;
