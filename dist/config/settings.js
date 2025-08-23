"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsHelper = exports.Settings = void 0;
exports.Settings = {
    population: {
        harvester: {
            rcl1: 4,
            rcl2Plus: 2,
        },
        upgrader: {
            rcl2: 1,
            rcl3Plus: 2,
        },
        builder: {
            base: 1,
            withConstructionSites: 2,
            maxPerRcl: 3,
        },
    },
    energy: {
        emergency: 200,
        basic: 300,
        advanced: 400,
        premium: 500,
    },
    bodies: {
        harvester: {
            basic: [WORK, CARRY, MOVE],
            enhanced: [WORK, WORK, CARRY, MOVE],
            advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
        },
        upgrader: {
            basic: [WORK, CARRY, MOVE],
            enhanced: [WORK, WORK, CARRY, MOVE],
            advanced: [WORK, WORK, CARRY, CARRY, MOVE],
            premium: [WORK, WORK, WORK, CARRY, CARRY, MOVE],
        },
        builder: {
            basic: [WORK, CARRY, MOVE],
            enhanced: [WORK, CARRY, CARRY, MOVE, MOVE],
            advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
        },
    },
    room: {
        memoryUpdateInterval: 10,
        defenseRange: 5,
        repairThreshold: 0.8,
        roadRepairThreshold: 0.5,
    },
    cpu: {
        bucketFloor: 1000,
        emergencyBucket: 500,
        maxCpuPerTick: 0.9,
    },
    logging: {
        enabled: true,
        logLevel: 'INFO',
        logCreepActions: false,
        logSpawning: true,
        logRoomUpdates: false,
    },
    planning: {
        enabled: true,
        planningCadence: 50,
        constructionCadence: 10,
        maxConstructionSites: 5,
        trafficAnalysisEnabled: true,
        trafficDataTTL: 1000,
        layoutAnalysisTTL: 5000,
        roadPlanningEnabled: true,
        buildingPlanningEnabled: true,
        useTemplates: true,
        useDynamicPlacement: true,
        minTrafficForRoad: 5,
        roadPriorityThreshold: 10,
        minTrafficDataPoints: 20,
        constructionSiteMaxAge: 1500,
    },
    stance: 'peace',
    version: '1.0.0',
    buildDate: 'static-build',
};
exports.SettingsHelper = {
    getRequiredCreepCount(role, rcl, sourceCount, constructionSites) {
        switch (role) {
            case 'harvester':
                return rcl === 1
                    ? Math.max(exports.Settings.population.harvester.rcl1, sourceCount * 2)
                    : Math.max(exports.Settings.population.harvester.rcl2Plus, sourceCount);
            case 'upgrader':
                return rcl >= 3 ? exports.Settings.population.upgrader.rcl3Plus : exports.Settings.population.upgrader.rcl2;
            case 'builder':
                const baseBuilders = constructionSites > 0
                    ? exports.Settings.population.builder.withConstructionSites
                    : exports.Settings.population.builder.base;
                return Math.min(baseBuilders, Math.floor(rcl / 2) + 1, exports.Settings.population.builder.maxPerRcl);
            default:
                return 0;
        }
    },
    getCreepBody(role, energyAvailable) {
        const bodies = exports.Settings.bodies[role];
        if (!bodies) {
            return exports.Settings.bodies.harvester.basic;
        }
        if (energyAvailable >= exports.Settings.energy.premium && 'premium' in bodies) {
            return bodies.premium;
        }
        else if (energyAvailable >= exports.Settings.energy.advanced && 'advanced' in bodies) {
            return bodies.advanced;
        }
        else if (energyAvailable >= exports.Settings.energy.basic && 'enhanced' in bodies) {
            return bodies.enhanced;
        }
        else {
            return bodies.basic;
        }
    },
    shouldLog(level) {
        if (!exports.Settings.logging.enabled)
            return false;
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const currentLevelIndex = levels.indexOf(exports.Settings.logging.logLevel);
        const requestedLevelIndex = levels.indexOf(level);
        return requestedLevelIndex >= currentLevelIndex;
    },
};
