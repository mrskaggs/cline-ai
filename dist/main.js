"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config/settings.ts
var Settings, SettingsHelper;
var init_settings = __esm({
  "src/config/settings.ts"() {
    "use strict";
    Settings = {
      // Creep population targets
      population: {
        harvester: {
          rcl1: 4,
          // At RCL1, harvesters do everything
          rcl2Plus: 2
          // At RCL2+, specialized roles take over
        },
        upgrader: {
          rcl2: 1,
          rcl3Plus: 2
        },
        builder: {
          base: 1,
          withConstructionSites: 2,
          maxPerRcl: 3
        }
      },
      // Energy thresholds for creep body generation
      energy: {
        emergency: 200,
        // Minimum energy to spawn basic creep
        basic: 300,
        // Basic enhanced creep
        advanced: 400,
        // Advanced creep with better parts
        premium: 500
        // Premium creep for higher RCL
      },
      // Creep body templates
      bodies: {
        harvester: {
          basic: [WORK, CARRY, MOVE],
          // 200 energy
          enhanced: [WORK, WORK, CARRY, MOVE],
          // 300 energy
          advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE]
          // 400 energy
        },
        upgrader: {
          basic: [WORK, CARRY, MOVE],
          // 200 energy
          enhanced: [WORK, WORK, CARRY, MOVE],
          // 300 energy
          advanced: [WORK, WORK, CARRY, CARRY, MOVE],
          // 400 energy
          premium: [WORK, WORK, WORK, CARRY, CARRY, MOVE]
          // 500 energy
        },
        builder: {
          basic: [WORK, CARRY, MOVE],
          // 200 energy
          enhanced: [WORK, CARRY, CARRY, MOVE, MOVE],
          // 350 energy
          advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE]
          // 450 energy
        }
      },
      // Room management settings
      room: {
        memoryUpdateInterval: 10,
        // Ticks between room memory updates
        defenseRange: 5,
        // Range to look for hostiles
        repairThreshold: 0.8,
        // Repair structures below this health ratio
        roadRepairThreshold: 0.5
        // Repair roads below this health ratio
      },
      // CPU and performance settings
      cpu: {
        bucketFloor: 1e3,
        // Minimum bucket before throttling
        emergencyBucket: 500,
        // Emergency mode bucket threshold
        maxCpuPerTick: 0.9
        // Maximum CPU usage per tick (as ratio)
      },
      // Logging and debugging
      logging: {
        enabled: true,
        logLevel: "INFO",
        // DEBUG, INFO, WARN, ERROR
        logCreepActions: false,
        // Log individual creep actions
        logSpawning: true,
        // Log spawning decisions
        logRoomUpdates: false
        // Log room memory updates
      },
      // Planning system settings
      planning: {
        enabled: true,
        planningCadence: 50,
        // Ticks between planning runs
        constructionCadence: 10,
        // Ticks between construction site management
        maxConstructionSites: 5,
        // Maximum construction sites per room
        trafficAnalysisEnabled: true,
        trafficDataTTL: 1e3,
        // Ticks to keep traffic data
        layoutAnalysisTTL: 5e3,
        // Ticks to keep layout analysis
        roadPlanningEnabled: true,
        buildingPlanningEnabled: true,
        useTemplates: true,
        // Use predefined layout templates
        useDynamicPlacement: true,
        // Use dynamic building placement
        minTrafficForRoad: 5,
        // Minimum traffic count to justify a road
        roadPriorityThreshold: 10,
        // Traffic score threshold for high priority roads
        minTrafficDataPoints: 20,
        // Minimum traffic data points before road planning
        constructionSiteMaxAge: 1500
        // Maximum age for idle construction sites
      },
      // Game stance and behavior
      stance: "peace",
      // Version info
      version: "1.0.0",
      buildDate: "static-build"
    };
    SettingsHelper = {
      // Get required creep count for a role based on room conditions
      getRequiredCreepCount(role, rcl, sourceCount, constructionSites) {
        switch (role) {
          case "harvester":
            return rcl === 1 ? Math.max(Settings.population.harvester.rcl1, sourceCount * 2) : Math.max(Settings.population.harvester.rcl2Plus, sourceCount);
          case "upgrader":
            return rcl >= 3 ? Settings.population.upgrader.rcl3Plus : Settings.population.upgrader.rcl2;
          case "builder":
            const baseBuilders = constructionSites > 0 ? Settings.population.builder.withConstructionSites : Settings.population.builder.base;
            return Math.min(baseBuilders, Math.floor(rcl / 2) + 1, Settings.population.builder.maxPerRcl);
          default:
            return 0;
        }
      },
      // Get creep body based on role and available energy
      getCreepBody(role, energyAvailable) {
        const bodies = Settings.bodies[role];
        if (!bodies) {
          return Settings.bodies.harvester.basic;
        }
        if (energyAvailable >= Settings.energy.premium && "premium" in bodies) {
          return bodies.premium;
        } else if (energyAvailable >= Settings.energy.advanced && "advanced" in bodies) {
          return bodies.advanced;
        } else if (energyAvailable >= Settings.energy.basic && "enhanced" in bodies) {
          return bodies.enhanced;
        } else {
          return bodies.basic;
        }
      },
      // Check if logging is enabled for a specific level
      shouldLog(level) {
        if (!Settings.logging.enabled) return false;
        const levels = ["DEBUG", "INFO", "WARN", "ERROR"];
        const currentLevelIndex = levels.indexOf(Settings.logging.logLevel);
        const requestedLevelIndex = levels.indexOf(level);
        return requestedLevelIndex >= currentLevelIndex;
      }
    };
  }
});

// src/utils/Logger.ts
var Logger;
var init_Logger = __esm({
  "src/utils/Logger.ts"() {
    "use strict";
    init_settings();
    Logger = class {
      static log(level, message, context) {
        if (!SettingsHelper.shouldLog(level)) {
          return;
        }
        const prefix = context ? `[${context}]` : "";
        const timestamp = Game.time;
        console.log(`${timestamp} ${prefix} ${message}`);
      }
      static debug(message, context) {
        this.log("DEBUG", message, context);
      }
      static info(message, context) {
        this.log("INFO", message, context);
      }
      static warn(message, context) {
        this.log("WARN", message, context);
      }
      static error(message, context) {
        this.log("ERROR", message, context);
      }
      // Throttled logging - only log once per specified interval
      static throttledLog(key, intervalTicks, level, message, context) {
        const now = Game.time;
        const lastTime = this.lastLogTimes[key] || 0;
        if (now - lastTime >= intervalTicks) {
          this.log(level, message, context);
          this.lastLogTimes[key] = now;
        }
      }
      // Log only once per game tick for the same key
      static oncePerTick(key, level, message, context) {
        this.throttledLog(key, 1, level, message, context);
      }
      // Log spawn events with throttling
      static logSpawn(role, name, room) {
        if (Settings.logging.logSpawning) {
          this.info(`Spawning ${role}: ${name}`, `SpawnManager-${room}`);
        }
      }
      // Log creep actions with throttling (if enabled)
      static logCreepAction(creep, action) {
        if (Settings.logging.logCreepActions) {
          this.debug(`${creep.name} ${action}`, "CreepAction");
        }
      }
      // Clean up old throttled log entries
      static cleanup() {
        const cutoff = Game.time - 1e3;
        for (const key in this.lastLogTimes) {
          const lastTime = this.lastLogTimes[key];
          if (lastTime !== void 0 && lastTime < cutoff) {
            delete this.lastLogTimes[key];
          }
        }
      }
    };
    Logger.lastLogTimes = {};
  }
});

// src/utils/PathingUtils.ts
var PathingUtils;
var init_PathingUtils = __esm({
  "src/utils/PathingUtils.ts"() {
    "use strict";
    init_Logger();
    PathingUtils = class {
      // Cache for 1000 ticks
      /**
       * Get or create a cost matrix for a room
       */
      static getCostMatrix(roomName) {
        const room = Game.rooms[roomName];
        if (!room) {
          return new PathFinder.CostMatrix();
        }
        const cached = this.costMatrixCache[roomName];
        const currentTick = Game.time;
        if (cached && currentTick - cached.lastModified < this.CACHE_TTL) {
          return cached.matrix;
        }
        const matrix = this.createCostMatrix(room);
        this.costMatrixCache[roomName] = {
          matrix,
          lastModified: currentTick
        };
        return matrix;
      }
      /**
       * Create a cost matrix for a room based on terrain and structures
       */
      static createCostMatrix(room) {
        const matrix = new PathFinder.CostMatrix();
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            const terrain = room.getTerrain().get(x, y);
            if (terrain & TERRAIN_MASK_WALL) {
              matrix.set(x, y, 255);
            } else if (terrain & TERRAIN_MASK_SWAMP) {
              matrix.set(x, y, 5);
            } else {
              matrix.set(x, y, 1);
            }
          }
        }
        room.find(FIND_STRUCTURES).forEach((structure) => {
          if (structure.structureType === STRUCTURE_ROAD) {
            matrix.set(structure.pos.x, structure.pos.y, 1);
          } else if (structure.structureType === STRUCTURE_CONTAINER) {
            matrix.set(structure.pos.x, structure.pos.y, 1);
          } else if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
            matrix.set(structure.pos.x, structure.pos.y, 1);
          } else {
            matrix.set(structure.pos.x, structure.pos.y, 255);
          }
        });
        room.find(FIND_CONSTRUCTION_SITES).forEach((site) => {
          if (site.structureType === STRUCTURE_ROAD) {
            matrix.set(site.pos.x, site.pos.y, 1);
          } else if (site.structureType === STRUCTURE_CONTAINER) {
            matrix.set(site.pos.x, site.pos.y, 1);
          } else if (site.structureType === STRUCTURE_RAMPART) {
            matrix.set(site.pos.x, site.pos.y, 1);
          } else {
            matrix.set(site.pos.x, site.pos.y, 255);
          }
        });
        return matrix;
      }
      /**
       * Find path between two positions using cached cost matrix
       */
      static findPath(from, to, options = {}) {
        const defaultOptions = {
          roomCallback: (roomName) => {
            return this.getCostMatrix(roomName);
          },
          maxOps: 2e3,
          maxRooms: 1,
          ...options
        };
        return PathFinder.search(from, to, defaultOptions);
      }
      /**
       * Find multiple paths from one origin to multiple targets
       */
      static findMultiplePaths(from, targets, options = {}) {
        return targets.map((target) => this.findPath(from, target, options));
      }
      /**
       * Calculate the distance between two positions
       */
      static getDistance(pos1, pos2) {
        if (pos1.roomName !== pos2.roomName) {
          return Infinity;
        }
        return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
      }
      /**
       * Check if a position is walkable (not a wall or blocked structure)
       */
      static isWalkable(pos) {
        const room = Game.rooms[pos.roomName];
        if (!room) return false;
        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain & TERRAIN_MASK_WALL) {
          return false;
        }
        const structures = pos.lookFor(LOOK_STRUCTURES);
        for (const structure of structures) {
          if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER && !(structure.structureType === STRUCTURE_RAMPART && structure.my)) {
            return false;
          }
        }
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        for (const site of sites) {
          if (site.structureType !== STRUCTURE_ROAD && site.structureType !== STRUCTURE_CONTAINER && site.structureType !== STRUCTURE_RAMPART) {
            return false;
          }
        }
        return true;
      }
      /**
       * Get all positions within a certain range of a target
       */
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
      /**
       * Clear cost matrix cache for a room (useful when room layout changes)
       */
      static clearCache(roomName) {
        if (roomName) {
          delete this.costMatrixCache[roomName];
          Logger.debug(`PathingUtils: Cleared cache for room ${roomName}`);
        } else {
          this.costMatrixCache = {};
          Logger.debug("PathingUtils: Cleared all cost matrix cache");
        }
      }
      /**
       * Serialize a path for storage in memory
       */
      static serializePath(path) {
        return path.map((pos) => `${pos.x},${pos.y}`).join("|");
      }
      /**
       * Deserialize a path from memory storage
       */
      static deserializePath(serialized, roomName) {
        if (!serialized) return [];
        return serialized.split("|").map((posStr) => {
          const [x, y] = posStr.split(",").map(Number);
          if (typeof x === "number" && typeof y === "number") {
            return new RoomPosition(x, y, roomName);
          }
          return void 0;
        }).filter((pos) => pos !== void 0);
      }
    };
    PathingUtils.costMatrixCache = {};
    PathingUtils.CACHE_TTL = 1e3;
  }
});

// src/planners/TerrainAnalyzer.ts
var TerrainAnalyzer;
var init_TerrainAnalyzer = __esm({
  "src/planners/TerrainAnalyzer.ts"() {
    "use strict";
    init_Logger();
    init_PathingUtils();
    init_settings();
    TerrainAnalyzer = class {
      /**
       * Perform complete room analysis and cache results
       */
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
          Logger.info(`TerrainAnalyzer: Analyzed room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
          return analysis;
        } catch (error) {
          Logger.error(`TerrainAnalyzer: Error analyzing room ${room.name}: ${error}`);
          throw error;
        }
      }
      /**
       * Get cached terrain analysis or perform new analysis
       */
      static getCachedAnalysis(room) {
        const cached = room.memory.layoutAnalysis;
        if (!cached) return null;
        const age = Game.time - cached.lastAnalyzed;
        if (age > Settings.planning.layoutAnalysisTTL) {
          Logger.debug(`TerrainAnalyzer: Cache expired for room ${room.name}, age: ${age}`);
          return null;
        }
        return cached.terrain;
      }
      /**
       * Identify key positions in the room (sources, controller, etc.)
       */
      static identifyKeyPositions(room) {
        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;
        const mineral = room.find(FIND_MINERALS)[0];
        const exits = this.findExits(room);
        const spawns = room.find(FIND_MY_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_SPAWN
        });
        const keyPositions = {
          spawn: spawns.map((spawn) => spawn.pos),
          sources: sources.map((source) => source.pos),
          controller: controller ? controller.pos : void 0,
          mineral: mineral ? mineral.pos : void 0,
          exits
        };
        Logger.debug(
          `TerrainAnalyzer: Identified key positions for room ${room.name}:`,
          `${keyPositions.sources.length} sources, ${keyPositions.exits.length} exits`
        );
        return keyPositions;
      }
      /**
       * Find all open (walkable) spaces in the room
       */
      static findOpenSpaces(room) {
        const openSpaces = [];
        for (let x = 1; x < 49; x++) {
          for (let y = 1; y < 49; y++) {
            const pos = new RoomPosition(x, y, room.name);
            if (PathingUtils.isWalkable(pos)) {
              openSpaces.push(pos);
            }
          }
        }
        Logger.debug(`TerrainAnalyzer: Found ${openSpaces.length} open spaces in room ${room.name}`);
        return openSpaces;
      }
      /**
       * Find all wall positions in the room
       */
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
      /**
       * Find all swamp positions in the room
       */
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
      /**
       * Find all exit positions in the room
       */
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
      /**
       * Find the optimal central area for building placement
       */
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
        sources.forEach((source) => {
          totalX += source.pos.x;
          totalY += source.pos.y;
          totalWeight += 1;
        });
        const centerX = Math.round(totalX / totalWeight);
        const centerY = Math.round(totalY / totalWeight);
        const idealCenter = new RoomPosition(centerX, centerY, room.name);
        if (PathingUtils.isWalkable(idealCenter)) {
          return idealCenter;
        }
        for (let range = 1; range <= 10; range++) {
          const positions = PathingUtils.getPositionsInRange(idealCenter, range);
          for (const pos of positions) {
            if (PathingUtils.isWalkable(pos)) {
              Logger.debug(`TerrainAnalyzer: Central area for room ${room.name} at ${pos.x},${pos.y} (range ${range} from ideal)`);
              return pos;
            }
          }
        }
        Logger.warn(`TerrainAnalyzer: Could not find suitable central area for room ${room.name}, using room center`);
        return new RoomPosition(25, 25, room.name);
      }
      /**
       * Calculate buildable area around a position
       */
      static calculateBuildableArea(room, center, radius = 10) {
        const buildablePositions = [];
        for (let x = Math.max(1, center.x - radius); x <= Math.min(48, center.x + radius); x++) {
          for (let y = Math.max(1, center.y - radius); y <= Math.min(48, center.y + radius); y++) {
            const pos = new RoomPosition(x, y, room.name);
            const distance = PathingUtils.getDistance(center, pos);
            if (distance <= radius && PathingUtils.isWalkable(pos)) {
              buildablePositions.push(pos);
            }
          }
        }
        Logger.debug(`TerrainAnalyzer: Found ${buildablePositions.length} buildable positions within ${radius} of ${center.x},${center.y}`);
        return buildablePositions;
      }
      /**
       * Check if a position is suitable for a specific structure type
       */
      static isSuitableForStructure(pos, structureType) {
        if (!PathingUtils.isWalkable(pos)) {
          return false;
        }
        const room = Game.rooms[pos.roomName];
        if (!room) return false;
        const structures = pos.lookFor(LOOK_STRUCTURES);
        if (structures.length > 0) {
          const hasBlockingStructure = structures.some(
            (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER
          );
          if (hasBlockingStructure) return false;
        }
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (sites.length > 0) return false;
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
      /**
       * Check if a position has minimum clearance around it
       */
      static hasMinimumClearance(pos, minClearance) {
        const positions = PathingUtils.getPositionsInRange(pos, minClearance);
        const walkableCount = positions.filter((p) => PathingUtils.isWalkable(p)).length;
        const totalPositions = positions.length;
        return walkableCount / totalPositions >= 0.6;
      }
      /**
       * Clear cached analysis for a room
       */
      static clearCache(roomName) {
        const room = Game.rooms[roomName];
        if (room && room.memory.layoutAnalysis) {
          delete room.memory.layoutAnalysis;
          Logger.debug(`TerrainAnalyzer: Cleared cache for room ${roomName}`);
        }
      }
    };
  }
});

// src/planners/LayoutTemplates.ts
var LayoutTemplates;
var init_LayoutTemplates = __esm({
  "src/planners/LayoutTemplates.ts"() {
    "use strict";
    init_Logger();
    LayoutTemplates = class {
      /**
       * Get layout template for a specific RCL
       */
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
            Logger.warn(`LayoutTemplates: No template available for RCL ${rcl}`);
            return null;
        }
      }
      /**
       * Get all buildings that should be available at a specific RCL
       */
      static getBuildingsForRCL(rcl) {
        const template = this.getTemplate(rcl);
        if (!template) return [];
        const allBuildings = [];
        for (let level = 1; level <= rcl; level++) {
          const levelTemplate = this.getTemplate(level);
          if (levelTemplate) {
            allBuildings.push(...levelTemplate.buildings);
          }
        }
        return allBuildings;
      }
      /**
       * RCL 1 Template - Basic spawn setup
       */
      static getRCL1Template() {
        return {
          name: "RCL1_Basic",
          rcl: 1,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Spawn is the center reference point
            { structureType: STRUCTURE_SPAWN, offset: { x: 0, y: 0 }, priority: 1 }
          ]
        };
      }
      /**
       * RCL 2 Template - Add extensions around spawn
       */
      static getRCL2Template() {
        return {
          name: "RCL2_Extensions",
          rcl: 2,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // 5 extensions in a cross pattern around spawn
            { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 0 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 0 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -1 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: 1 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -1 }, priority: 3 }
          ]
        };
      }
      /**
       * RCL 3 Template - Add tower and more extensions
       */
      static getRCL3Template() {
        return {
          name: "RCL3_Tower",
          rcl: 3,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Tower for defense
            { structureType: STRUCTURE_TOWER, offset: { x: 2, y: 0 }, priority: 1 },
            // Additional extensions (5 more for total of 10)
            { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -1 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 1 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 1 }, priority: 2 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 0 }, priority: 3 },
            { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -2 }, priority: 3 }
          ]
        };
      }
      /**
       * RCL 4 Template - Add storage and more extensions
       */
      static getRCL4Template() {
        return {
          name: "RCL4_Storage",
          rcl: 4,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Storage for energy management
            { structureType: STRUCTURE_STORAGE, offset: { x: 0, y: 2 }, priority: 1 },
            // Additional extensions (10 more for total of 20)
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
      /**
       * RCL 5 Template - Add second tower and links
       */
      static getRCL5Template() {
        return {
          name: "RCL5_Links",
          rcl: 5,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Second tower
            { structureType: STRUCTURE_TOWER, offset: { x: -2, y: 0 }, priority: 1 },
            // Links for energy transport
            { structureType: STRUCTURE_LINK, offset: { x: 0, y: 3 }, priority: 2 },
            // Additional extensions (10 more for total of 30)
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
      /**
       * RCL 6 Template - Add labs and terminal
       */
      static getRCL6Template() {
        return {
          name: "RCL6_Labs",
          rcl: 6,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Terminal for market access
            { structureType: STRUCTURE_TERMINAL, offset: { x: -1, y: 3 }, priority: 1 },
            // Labs for mineral processing
            { structureType: STRUCTURE_LAB, offset: { x: 4, y: 0 }, priority: 2 },
            { structureType: STRUCTURE_LAB, offset: { x: 4, y: -1 }, priority: 2 },
            { structureType: STRUCTURE_LAB, offset: { x: 4, y: 1 }, priority: 2 },
            // Additional extensions (10 more for total of 40)
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
      /**
       * RCL 7 Template - Add more labs and factory
       */
      static getRCL7Template() {
        return {
          name: "RCL7_Factory",
          rcl: 7,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Factory for commodity production
            { structureType: STRUCTURE_FACTORY, offset: { x: 5, y: 0 }, priority: 1 },
            // Additional labs (7 more for total of 10)
            { structureType: STRUCTURE_LAB, offset: { x: 4, y: 2 }, priority: 2 },
            { structureType: STRUCTURE_LAB, offset: { x: 5, y: -1 }, priority: 2 },
            { structureType: STRUCTURE_LAB, offset: { x: 5, y: 1 }, priority: 2 },
            { structureType: STRUCTURE_LAB, offset: { x: 3, y: -3 }, priority: 3 },
            { structureType: STRUCTURE_LAB, offset: { x: 3, y: 3 }, priority: 3 },
            { structureType: STRUCTURE_LAB, offset: { x: -4, y: -2 }, priority: 3 },
            { structureType: STRUCTURE_LAB, offset: { x: -4, y: 2 }, priority: 3 },
            // Additional extensions (10 more for total of 50)
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
      /**
       * RCL 8 Template - Add remaining structures
       */
      static getRCL8Template() {
        return {
          name: "RCL8_Complete",
          rcl: 8,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Third tower
            { structureType: STRUCTURE_TOWER, offset: { x: 0, y: -4 }, priority: 1 },
            // Additional spawns
            { structureType: STRUCTURE_SPAWN, offset: { x: -5, y: -2 }, priority: 1 },
            { structureType: STRUCTURE_SPAWN, offset: { x: 5, y: -2 }, priority: 1 },
            // Power spawn
            { structureType: STRUCTURE_POWER_SPAWN, offset: { x: 0, y: 4 }, priority: 2 },
            // Nuker
            { structureType: STRUCTURE_NUKER, offset: { x: -5, y: 2 }, priority: 3 },
            // Observer
            { structureType: STRUCTURE_OBSERVER, offset: { x: 5, y: 2 }, priority: 3 },
            // Additional links
            { structureType: STRUCTURE_LINK, offset: { x: -3, y: 3 }, priority: 2 },
            { structureType: STRUCTURE_LINK, offset: { x: 3, y: -4 }, priority: 2 },
            // Final extensions (10 more for total of 60)
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
      /**
       * Apply template to a room at a specific anchor position
       */
      static applyTemplate(room, template, anchor) {
        const plannedBuildings = [];
        Logger.info(`LayoutTemplates: Applying template ${template.name} to room ${room.name} at anchor ${anchor.x},${anchor.y}`);
        for (const building of template.buildings) {
          const targetX = anchor.x + building.offset.x;
          const targetY = anchor.y + building.offset.y;
          if (targetX < 1 || targetX > 48 || targetY < 1 || targetY > 48) {
            Logger.debug(`LayoutTemplates: Skipping ${building.structureType} at ${targetX},${targetY} - out of bounds`);
            continue;
          }
          const pos = new RoomPosition(targetX, targetY, room.name);
          plannedBuildings.push({
            structureType: building.structureType,
            pos,
            priority: building.priority,
            rclRequired: template.rcl,
            placed: false,
            reason: `Template ${template.name} placement`
          });
        }
        Logger.info(`LayoutTemplates: Generated ${plannedBuildings.length} planned buildings from template ${template.name}`);
        return plannedBuildings;
      }
      /**
       * Get structure limits for a specific RCL
       */
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
      /**
       * Validate that a template doesn't exceed structure limits
       */
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
            Logger.error(`LayoutTemplates: Template ${template.name} exceeds limit for ${type}: ${count} > ${limit}`);
            return false;
          }
        }
        return true;
      }
    };
  }
});

// src/planners/BaseLayoutPlanner.ts
var BaseLayoutPlanner;
var init_BaseLayoutPlanner = __esm({
  "src/planners/BaseLayoutPlanner.ts"() {
    "use strict";
    init_Logger();
    init_PathingUtils();
    init_settings();
    init_TerrainAnalyzer();
    init_LayoutTemplates();
    BaseLayoutPlanner = class {
      /**
       * Main planning entry point - creates or updates room plan
       */
      static planRoom(room) {
        const startCpu = Game.cpu.getUsed();
        try {
          Logger.info(`BaseLayoutPlanner: Planning room ${room.name} at RCL ${room.controller ? room.controller.level : 0}`);
          let plan = room.memory.plan;
          const currentRCL = room.controller ? room.controller.level : 0;
          if (!plan || plan.rcl < currentRCL || this.shouldReplan(plan)) {
            plan = this.createNewPlan(room);
          }
          this.updatePlanStatus(room, plan);
          room.memory.plan = plan;
          const cpuUsed = Game.cpu.getUsed() - startCpu;
          Logger.info(`BaseLayoutPlanner: Completed planning for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
          return plan;
        } catch (error) {
          Logger.error(`BaseLayoutPlanner: Error planning room ${room.name}: ${error}`);
          throw error;
        }
      }
      /**
       * Create a new room plan from scratch
       */
      static createNewPlan(room) {
        const currentRCL = room.controller ? room.controller.level : 0;
        Logger.info(`BaseLayoutPlanner: Creating new plan for room ${room.name} at RCL ${currentRCL}`);
        let analysis = TerrainAnalyzer.getCachedAnalysis(room);
        if (!analysis) {
          analysis = TerrainAnalyzer.analyzeRoom(room);
        }
        const buildings = this.generateBuildingPlan(room, currentRCL);
        const plan = {
          roomName: room.name,
          rcl: currentRCL,
          lastUpdated: Game.time,
          buildings,
          roads: [],
          // Roads will be planned separately by RoadPlanner
          status: "planning",
          priority: this.calculatePlanPriority(room)
        };
        Logger.info(`BaseLayoutPlanner: Created plan with ${buildings.length} buildings for room ${room.name}`);
        return plan;
      }
      /**
       * Generate building placement plan using hybrid approach
       */
      static generateBuildingPlan(room, rcl) {
        const buildings = [];
        if (Settings.planning.useTemplates) {
          const templateBuildings = this.generateTemplateBasedPlan(room, rcl);
          buildings.push(...templateBuildings);
        }
        if (Settings.planning.useDynamicPlacement) {
          const dynamicBuildings = this.generateDynamicPlan(room, rcl, buildings);
          buildings.push(...dynamicBuildings);
        }
        return this.optimizeBuildingPlan(room, buildings);
      }
      /**
       * Generate building plan using layout templates
       */
      static generateTemplateBasedPlan(room, rcl) {
        const buildings = [];
        const anchor = this.findTemplateAnchor(room);
        for (let level = 1; level <= rcl; level++) {
          const template = LayoutTemplates.getTemplate(level);
          if (template && LayoutTemplates.validateTemplate(template)) {
            const templateBuildings = LayoutTemplates.applyTemplate(room, template, anchor);
            buildings.push(...templateBuildings);
          }
        }
        Logger.info(`BaseLayoutPlanner: Generated ${buildings.length} buildings from templates for room ${room.name}`);
        return buildings;
      }
      /**
       * Generate building plan using dynamic placement
       */
      static generateDynamicPlan(room, rcl, existingBuildings) {
        const buildings = [];
        const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
        const limits = LayoutTemplates.getStructureLimits(rcl);
        const existingCounts = this.countExistingStructures(room, existingBuildings);
        for (const [structureType, limit] of Object.entries(limits)) {
          const existing = existingCounts[structureType] || 0;
          const needed = limit - existing;
          if (needed > 0) {
            const dynamicPlacements = this.planStructureDynamically(
              room,
              structureType,
              needed,
              keyPositions,
              existingBuildings
            );
            buildings.push(...dynamicPlacements);
          }
        }
        Logger.info(`BaseLayoutPlanner: Generated ${buildings.length} buildings from dynamic placement for room ${room.name}`);
        return buildings;
      }
      /**
       * Plan a specific structure type dynamically
       */
      static planStructureDynamically(room, structureType, count, keyPositions, existingBuildings) {
        const buildings = [];
        const centralArea = TerrainAnalyzer.findCentralArea(room);
        const candidates = this.findSuitablePositions(room, structureType, centralArea, keyPositions);
        const occupiedPositions = new Set(
          existingBuildings.map((b) => `${b.pos.x},${b.pos.y}`)
        );
        const availableCandidates = candidates.filter(
          (pos) => !occupiedPositions.has(`${pos.x},${pos.y}`)
        );
        const selectedPositions = this.selectBestPositions(
          availableCandidates,
          structureType,
          count,
          keyPositions
        );
        selectedPositions.forEach((pos, index) => {
          buildings.push({
            structureType,
            pos,
            priority: this.getStructurePriority(structureType, index),
            rclRequired: this.getMinRCLForStructure(structureType),
            placed: false,
            reason: `Dynamic placement for ${structureType}`
          });
        });
        return buildings;
      }
      /**
       * Find suitable positions for a structure type
       */
      static findSuitablePositions(room, structureType, centralArea, keyPositions) {
        const positions = [];
        const searchRadius = this.getSearchRadius(structureType);
        const searchCenter = this.getSearchCenter(structureType, centralArea, keyPositions);
        const buildableArea = TerrainAnalyzer.calculateBuildableArea(room, searchCenter, searchRadius);
        for (const pos of buildableArea) {
          if (TerrainAnalyzer.isSuitableForStructure(pos, structureType)) {
            positions.push(pos);
          }
        }
        return positions;
      }
      /**
       * Select best positions from candidates based on structure type
       */
      static selectBestPositions(candidates, structureType, count, keyPositions) {
        if (candidates.length <= count) {
          return candidates;
        }
        const scoredPositions = candidates.map((pos) => ({
          pos,
          score: this.scorePosition(pos, structureType, keyPositions)
        }));
        scoredPositions.sort((a, b) => b.score - a.score);
        return scoredPositions.slice(0, count).map((sp) => sp.pos);
      }
      /**
       * Score a position for a specific structure type
       */
      static scorePosition(pos, structureType, keyPositions) {
        let score = 0;
        switch (structureType) {
          case STRUCTURE_SPAWN:
            if (keyPositions.controller) {
              score += 100 - PathingUtils.getDistance(pos, keyPositions.controller) * 2;
            }
            keyPositions.sources.forEach((source) => {
              score += 50 - PathingUtils.getDistance(pos, source);
            });
            break;
          case STRUCTURE_TOWER:
            const roomCenter = new RoomPosition(25, 25, pos.roomName);
            score += 100 - PathingUtils.getDistance(pos, roomCenter) * 3;
            break;
          case STRUCTURE_STORAGE:
          case STRUCTURE_TERMINAL:
            if (keyPositions.spawn.length > 0) {
              score += 100 - PathingUtils.getDistance(pos, keyPositions.spawn[0]) * 2;
            }
            break;
          case STRUCTURE_EXTENSION:
            if (keyPositions.spawn.length > 0) {
              score += 50 - PathingUtils.getDistance(pos, keyPositions.spawn[0]);
            }
            break;
          case STRUCTURE_LAB:
            if (keyPositions.spawn.length > 0) {
              score += 30 - PathingUtils.getDistance(pos, keyPositions.spawn[0]);
            }
            break;
          default:
            if (keyPositions.controller) {
              score += 50 - PathingUtils.getDistance(pos, keyPositions.controller);
            }
            break;
        }
        return score;
      }
      /**
       * Optimize and validate the building plan
       */
      static optimizeBuildingPlan(_room, buildings) {
        const uniqueBuildings = /* @__PURE__ */ new Map();
        buildings.forEach((building) => {
          const key = `${building.structureType}_${building.pos.x}_${building.pos.y}`;
          const existing = uniqueBuildings.get(key);
          if (!existing || building.priority > existing.priority) {
            uniqueBuildings.set(key, building);
          }
        });
        const optimizedBuildings = Array.from(uniqueBuildings.values());
        optimizedBuildings.sort((a, b) => b.priority - a.priority);
        Logger.info(`BaseLayoutPlanner: Optimized plan from ${buildings.length} to ${optimizedBuildings.length} buildings`);
        return optimizedBuildings;
      }
      /**
       * Place construction sites based on the room plan
       */
      static placeConstructionSites(room, plan) {
        if (!Settings.planning.buildingPlanningEnabled) return;
        const currentRCL = room.controller ? room.controller.level : 0;
        const maxSites = Settings.planning.maxConstructionSites;
        const existingSites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
        if (existingSites >= maxSites) {
          Logger.debug(`BaseLayoutPlanner: Room ${room.name} already has ${existingSites} construction sites`);
          return;
        }
        let sitesPlaced = 0;
        const sitesToPlace = maxSites - existingSites;
        const eligibleBuildings = plan.buildings.filter(
          (building) => !building.placed && building.rclRequired <= currentRCL && !this.hasStructureAtPosition(room, building.pos, building.structureType)
        ).sort((a, b) => b.priority - a.priority);
        for (const building of eligibleBuildings) {
          if (sitesPlaced >= sitesToPlace) break;
          const result = room.createConstructionSite(building.pos, building.structureType);
          if (result === OK) {
            building.placed = true;
            const siteId = this.findConstructionSiteId(room, building.pos, building.structureType);
            if (siteId) {
              building.constructionSiteId = siteId;
            }
            sitesPlaced++;
            Logger.info(`BaseLayoutPlanner: Placed ${building.structureType} construction site at ${building.pos.x},${building.pos.y} in room ${room.name}`);
          } else {
            Logger.warn(`BaseLayoutPlanner: Failed to place ${building.structureType} at ${building.pos.x},${building.pos.y} in room ${room.name}: ${result}`);
          }
        }
        if (sitesPlaced > 0) {
          plan.lastUpdated = Game.time;
          Logger.info(`BaseLayoutPlanner: Placed ${sitesPlaced} construction sites in room ${room.name}`);
        }
      }
      // Helper methods
      static shouldReplan(plan) {
        const age = Game.time - plan.lastUpdated;
        return age > Settings.planning.layoutAnalysisTTL || plan.status === "planning";
      }
      static updatePlanStatus(room, plan) {
        const unplacedBuildings = plan.buildings.filter((b) => !b.placed).length;
        const currentRCL = room.controller ? room.controller.level : 0;
        if (unplacedBuildings === 0) {
          plan.status = "complete";
        } else if (plan.buildings.some((b) => b.placed)) {
          plan.status = "building";
        } else {
          plan.status = "ready";
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
        return TerrainAnalyzer.findCentralArea(room);
      }
      static countExistingStructures(room, plannedBuildings) {
        const counts = {};
        const structures = room.find(FIND_MY_STRUCTURES);
        structures.forEach((structure) => {
          counts[structure.structureType] = (counts[structure.structureType] || 0) + 1;
        });
        plannedBuildings.forEach((building) => {
          counts[building.structureType] = (counts[building.structureType] || 0) + 1;
        });
        return counts;
      }
      static getSearchRadius(structureType) {
        switch (structureType) {
          case STRUCTURE_EXTENSION:
            return 8;
          case STRUCTURE_TOWER:
            return 15;
          case STRUCTURE_SPAWN:
            return 10;
          case STRUCTURE_STORAGE:
            return 5;
          case STRUCTURE_TERMINAL:
            return 5;
          case STRUCTURE_LAB:
            return 8;
          default:
            return 10;
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
        return structures.some((s) => s.structureType === structureType) || sites.some((s) => s.structureType === structureType);
      }
      static findConstructionSiteId(_room, pos, structureType) {
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const site = sites.find((s) => s.structureType === structureType);
        return site ? site.id : void 0;
      }
    };
  }
});

// src/utils/TrafficAnalyzer.ts
var TrafficAnalyzer;
var init_TrafficAnalyzer = __esm({
  "src/utils/TrafficAnalyzer.ts"() {
    "use strict";
    init_Logger();
    init_settings();
    TrafficAnalyzer = class {
      /**
       * Track a creep's movement for traffic analysis
       */
      static trackCreepMovement(creep) {
        if (!Settings.planning.trafficAnalysisEnabled) return;
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
      /**
       * Analyze traffic patterns in a room and return traffic scores
       */
      static analyzeTrafficPatterns(room) {
        if (!room.memory.trafficData) {
          room.memory.trafficData = {};
        }
        const trafficData = room.memory.trafficData;
        const currentTime = Game.time;
        const ttl = Settings.planning.trafficDataTTL;
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (data && currentTime - data.lastSeen > ttl) {
            delete trafficData[posKey];
          }
        }
        Logger.debug(`TrafficAnalyzer: Analyzed traffic for room ${room.name}, ${Object.keys(trafficData).length} positions tracked`);
        return trafficData;
      }
      /**
       * Get traffic score for a specific position
       */
      static getTrafficScore(room, pos) {
        if (!room.memory.trafficData) return 0;
        const posKey = `${pos.x},${pos.y}`;
        const data = room.memory.trafficData[posKey];
        if (!data) return 0;
        const age = Game.time - data.lastSeen;
        const ageFactor = Math.max(0, 1 - age / Settings.planning.trafficDataTTL);
        return data.count * ageFactor;
      }
      /**
       * Get high traffic positions that justify road placement
       */
      static getHighTrafficPositions(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const highTrafficPositions = [];
        const minTraffic = Settings.planning.minTrafficForRoad;
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (!data) continue;
          const coords = posKey.split(",").map(Number);
          if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number" && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const pos = new RoomPosition(coords[0], coords[1], room.name);
            if (data.count >= minTraffic) {
              highTrafficPositions.push(pos);
            }
          }
        }
        Logger.debug(`TrafficAnalyzer: Found ${highTrafficPositions.length} high traffic positions in room ${room.name}`);
        return highTrafficPositions;
      }
      /**
       * Get traffic density map for visualization or analysis
       */
      static getTrafficDensityMap(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const densityMap = {};
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (!data) continue;
          const score = this.getTrafficScore(room, this.parsePositionKey(posKey, room.name));
          densityMap[posKey] = score;
        }
        return densityMap;
      }
      /**
       * Analyze traffic patterns between key positions
       */
      static analyzeTrafficBetweenPositions(room, from, to) {
        this.analyzeTrafficPatterns(room);
        const positions = this.getPositionsBetween(from, to);
        let totalTraffic = 0;
        const hotspots = [];
        const threshold = Settings.planning.roadPriorityThreshold;
        for (const pos of positions) {
          const score = this.getTrafficScore(room, pos);
          totalTraffic += score;
          if (score >= threshold) {
            hotspots.push(pos);
          }
        }
        const averageTraffic = positions.length > 0 ? totalTraffic / positions.length : 0;
        return {
          averageTraffic,
          hotspots
        };
      }
      /**
       * Get positions along a line between two points
       */
      static getPositionsBetween(from, to) {
        if (from.roomName !== to.roomName) return [];
        const positions = [];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (distance === 0) return [from];
        for (let i = 0; i <= distance; i++) {
          const rawX = from.x + dx * i / distance;
          const rawY = from.y + dy * i / distance;
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
      /**
       * Parse position key back to RoomPosition
       */
      static parsePositionKey(posKey, roomName) {
        const coords = posKey.split(",").map(Number);
        if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number" && !isNaN(coords[0]) && !isNaN(coords[1])) {
          return new RoomPosition(coords[0], coords[1], roomName);
        }
        return new RoomPosition(0, 0, roomName);
      }
      /**
       * Get traffic statistics for a room
       */
      static getTrafficStatistics(room) {
        const trafficData = this.analyzeTrafficPatterns(room);
        const positions = Object.keys(trafficData);
        let totalTraffic = 0;
        let highTrafficCount = 0;
        const creepTypeCounts = {};
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (!data) continue;
          totalTraffic += data.count;
          if (data.count >= Settings.planning.minTrafficForRoad) {
            highTrafficCount++;
          }
          data.creepTypes.forEach((type) => {
            creepTypeCounts[type] = (creepTypeCounts[type] || 0) + data.count;
          });
        }
        const topCreepTypes = Object.entries(creepTypeCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([type]) => type);
        return {
          totalPositions: positions.length,
          totalTraffic,
          averageTraffic: positions.length > 0 ? totalTraffic / positions.length : 0,
          highTrafficPositions: highTrafficCount,
          topCreepTypes
        };
      }
      /**
       * Clear traffic data for a room
       */
      static clearTrafficData(roomName) {
        const room = Game.rooms[roomName];
        if (room && room.memory.trafficData) {
          delete room.memory.trafficData;
          Logger.debug(`TrafficAnalyzer: Cleared traffic data for room ${roomName}`);
        }
      }
      /**
       * Optimize traffic data by removing low-traffic positions
       */
      static optimizeTrafficData(room) {
        if (!room.memory.trafficData) return;
        const trafficData = room.memory.trafficData;
        const minTraffic = Math.max(1, Settings.planning.minTrafficForRoad / 4);
        let removedCount = 0;
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (data && data.count < minTraffic) {
            delete trafficData[posKey];
            removedCount++;
          }
        }
        if (removedCount > 0) {
          Logger.debug(`TrafficAnalyzer: Optimized traffic data for room ${room.name}, removed ${removedCount} low-traffic positions`);
        }
      }
      /**
       * Get recommended road positions based on traffic analysis
       */
      static getRecommendedRoadPositions(room) {
        const highTrafficPositions = this.getHighTrafficPositions(room);
        const recommendedPositions = [];
        for (const pos of highTrafficPositions) {
          const structures = pos.lookFor(LOOK_STRUCTURES);
          const hasRoad = structures.some((s) => s.structureType === STRUCTURE_ROAD);
          const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
          const hasRoadSite = sites.some((s) => s.structureType === STRUCTURE_ROAD);
          if (!hasRoad && !hasRoadSite) {
            recommendedPositions.push(pos);
          }
        }
        Logger.debug(`TrafficAnalyzer: Recommended ${recommendedPositions.length} road positions for room ${room.name}`);
        return recommendedPositions;
      }
      /**
       * Track all creeps in a room for traffic analysis
       */
      static trackRoomTraffic(room) {
        if (!Settings.planning.trafficAnalysisEnabled) return;
        const creeps = room.find(FIND_MY_CREEPS);
        for (const creep of creeps) {
          this.trackCreepMovement(creep);
        }
        if (Game.time % 100 === 0) {
          this.optimizeTrafficData(room);
        }
      }
      /**
       * Get traffic heatmap data for visualization
       */
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
        if (maxTraffic === 0) return heatmapData;
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (!data) continue;
          const coords = posKey.split(",").map(Number);
          if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number" && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const x = coords[0];
            const y = coords[1];
            const intensity = data.count / maxTraffic;
            heatmapData.push({ x, y, intensity });
          }
        }
        return heatmapData;
      }
    };
  }
});

// src/planners/RoadPlanner.ts
var RoadPlanner;
var init_RoadPlanner = __esm({
  "src/planners/RoadPlanner.ts"() {
    "use strict";
    init_Logger();
    init_PathingUtils();
    init_TrafficAnalyzer();
    init_TerrainAnalyzer();
    init_settings();
    RoadPlanner = class {
      /**
       * Plan complete road network for a room
       */
      static planRoadNetwork(room, _buildings) {
        if (!Settings.planning.roadPlanningEnabled) return [];
        const startCpu = Game.cpu.getUsed();
        try {
          Logger.info(`RoadPlanner: Planning road network for room ${room.name}`);
          const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
          const optimalPaths = this.calculateOptimalPaths(room, keyPositions);
          const trafficData = TrafficAnalyzer.analyzeTrafficPatterns(room);
          const roads = this.optimizeRoadPlacement(optimalPaths, trafficData, room);
          const cpuUsed = Game.cpu.getUsed() - startCpu;
          Logger.info(`RoadPlanner: Planned ${roads.length} roads for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
          return roads;
        } catch (error) {
          Logger.error(`RoadPlanner: Error planning roads for room ${room.name}: ${error}`);
          return [];
        }
      }
      /**
       * Calculate optimal paths between key positions
       */
      static calculateOptimalPaths(room, keyPositions) {
        const paths = [];
        keyPositions.spawn.forEach((spawnPos) => {
          keyPositions.sources.forEach((sourcePos) => {
            const path = PathingUtils.findPath(spawnPos, sourcePos);
            if (!path.incomplete && path.path.length > 0) {
              paths.push(path.path);
            }
          });
        });
        if (keyPositions.controller) {
          keyPositions.spawn.forEach((spawnPos) => {
            const path = PathingUtils.findPath(spawnPos, keyPositions.controller);
            if (!path.incomplete && path.path.length > 0) {
              paths.push(path.path);
            }
          });
        }
        if (keyPositions.controller) {
          keyPositions.sources.forEach((sourcePos) => {
            const path = PathingUtils.findPath(sourcePos, keyPositions.controller);
            if (!path.incomplete && path.path.length > 0) {
              paths.push(path.path);
            }
          });
        }
        if (keyPositions.mineral) {
          keyPositions.spawn.forEach((spawnPos) => {
            const path = PathingUtils.findPath(spawnPos, keyPositions.mineral);
            if (!path.incomplete && path.path.length > 0) {
              paths.push(path.path);
            }
          });
        }
        const mainExits = this.getMainExits(keyPositions.exits);
        keyPositions.spawn.forEach((spawnPos) => {
          mainExits.forEach((exitPos) => {
            const path = PathingUtils.findPath(spawnPos, exitPos);
            if (!path.incomplete && path.path.length > 0) {
              paths.push(path.path);
            }
          });
        });
        Logger.debug(`RoadPlanner: Calculated ${paths.length} optimal paths for room ${room.name}`);
        return paths;
      }
      /**
       * Optimize road placement based on paths and traffic data
       */
      static optimizeRoadPlacement(paths, _trafficData, room) {
        const roadPositions = /* @__PURE__ */ new Map();
        paths.forEach((path, _pathIndex) => {
          const pathType = this.determinePathType(path, room);
          path.forEach((pos) => {
            const posKey = `${pos.x},${pos.y}`;
            if (this.hasRoadOrStructure(pos)) {
              return;
            }
            const trafficScore = TrafficAnalyzer.getTrafficScore(room, pos);
            const pathPriority = this.getPathPriority(pathType);
            const priority = pathPriority + Math.floor(trafficScore / 10);
            const existingRoad = roadPositions.get(posKey);
            if (!existingRoad || priority > existingRoad.priority) {
              roadPositions.set(posKey, {
                pos,
                priority,
                trafficScore,
                placed: false,
                pathType
              });
            }
          });
        });
        const highTrafficPositions = TrafficAnalyzer.getHighTrafficPositions(room);
        highTrafficPositions.forEach((pos) => {
          const posKey = `${pos.x},${pos.y}`;
          if (!roadPositions.has(posKey) && !this.hasRoadOrStructure(pos)) {
            const trafficScore = TrafficAnalyzer.getTrafficScore(room, pos);
            roadPositions.set(posKey, {
              pos,
              priority: Math.floor(trafficScore / 5),
              // Lower priority than optimal paths
              trafficScore,
              placed: false,
              pathType: "internal"
            });
          }
        });
        const roads = Array.from(roadPositions.values());
        roads.sort((a, b) => b.priority - a.priority);
        Logger.info(`RoadPlanner: Generated ${roads.length} road positions for room ${room.name}`);
        return roads;
      }
      /**
       * Place road construction sites based on the road plan
       */
      static placeRoadConstructionSites(room, roads) {
        if (!Settings.planning.roadPlanningEnabled) return;
        const maxSites = Math.floor(Settings.planning.maxConstructionSites / 2);
        const existingRoadSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
          filter: (site) => site.structureType === STRUCTURE_ROAD
        }).length;
        if (existingRoadSites >= maxSites) {
          Logger.debug(`RoadPlanner: Room ${room.name} already has ${existingRoadSites} road construction sites`);
          return;
        }
        let sitesPlaced = 0;
        const sitesToPlace = maxSites - existingRoadSites;
        const eligibleRoads = roads.filter(
          (road) => !road.placed && (road.trafficScore >= Settings.planning.minTrafficForRoad || road.priority >= 80) && !this.hasRoadOrStructure(road.pos)
        ).sort((a, b) => b.priority - a.priority);
        for (const road of eligibleRoads) {
          if (sitesPlaced >= sitesToPlace) break;
          const result = room.createConstructionSite(road.pos, STRUCTURE_ROAD);
          if (result === OK) {
            road.placed = true;
            const siteId = this.findRoadConstructionSiteId(room, road.pos);
            if (siteId) {
              road.constructionSiteId = siteId;
            }
            sitesPlaced++;
            Logger.info(`RoadPlanner: Placed road construction site at ${road.pos.x},${road.pos.y} in room ${room.name} (priority: ${road.priority})`);
          } else {
            Logger.warn(`RoadPlanner: Failed to place road at ${road.pos.x},${road.pos.y} in room ${room.name}: ${result}`);
          }
        }
        if (sitesPlaced > 0) {
          Logger.info(`RoadPlanner: Placed ${sitesPlaced} road construction sites in room ${room.name}`);
        }
      }
      /**
       * Update traffic analysis for road planning
       */
      static updateTrafficAnalysis(room) {
        if (!Settings.planning.trafficAnalysisEnabled) return;
        TrafficAnalyzer.trackRoomTraffic(room);
        if (Game.time % Settings.planning.constructionCadence === 0) {
          TrafficAnalyzer.analyzeTrafficPatterns(room);
        }
      }
      /**
       * Get recommended road upgrades based on traffic analysis
       */
      static getRecommendedRoadUpgrades(room) {
        const recommendations = [];
        const trafficData = TrafficAnalyzer.analyzeTrafficPatterns(room);
        const threshold = Settings.planning.roadPriorityThreshold;
        for (const posKey in trafficData) {
          const data = trafficData[posKey];
          if (!data) continue;
          const coords = posKey.split(",").map(Number);
          if (coords.length !== 2 || typeof coords[0] !== "number" || typeof coords[1] !== "number" || isNaN(coords[0]) || isNaN(coords[1])) continue;
          const pos = new RoomPosition(coords[0], coords[1], room.name);
          if (data.count >= threshold && !this.hasRoadOrStructure(pos)) {
            recommendations.push(pos);
          }
        }
        recommendations.sort((a, b) => {
          const scoreA = TrafficAnalyzer.getTrafficScore(room, a);
          const scoreB = TrafficAnalyzer.getTrafficScore(room, b);
          return scoreB - scoreA;
        });
        Logger.debug(`RoadPlanner: Found ${recommendations.length} road upgrade recommendations for room ${room.name}`);
        return recommendations;
      }
      // Helper methods
      /**
       * Determine the type of path based on endpoints
       */
      static determinePathType(path, room) {
        if (path.length === 0) return "internal";
        const start = path[0];
        const end = path[path.length - 1];
        if (!start || !end) return "internal";
        const sources = room.find(FIND_SOURCES);
        if (sources.some((source) => source.pos.isEqualTo(start) || source.pos.isEqualTo(end))) {
          return "source";
        }
        const controller = room.controller;
        if (controller && (controller.pos.isEqualTo(start) || controller.pos.isEqualTo(end))) {
          return "controller";
        }
        const minerals = room.find(FIND_MINERALS);
        if (minerals.some((mineral) => mineral.pos.isEqualTo(start) || mineral.pos.isEqualTo(end))) {
          return "mineral";
        }
        if (this.isExitPosition(start, room) || this.isExitPosition(end, room)) {
          return "exit";
        }
        return "internal";
      }
      /**
       * Get priority for different path types
       */
      static getPathPriority(pathType) {
        switch (pathType) {
          case "source":
            return 100;
          case "controller":
            return 90;
          case "mineral":
            return 70;
          case "exit":
            return 60;
          case "internal":
            return 50;
          default:
            return 40;
        }
      }
      /**
       * Check if position already has a road or blocking structure
       */
      static hasRoadOrStructure(pos) {
        const structures = pos.lookFor(LOOK_STRUCTURES);
        const hasRoad = structures.some((s) => s.structureType === STRUCTURE_ROAD);
        const hasBlockingStructure = structures.some(
          (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER && !(s.structureType === STRUCTURE_RAMPART && s.my)
        );
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const hasRoadSite = sites.some((s) => s.structureType === STRUCTURE_ROAD);
        return hasRoad || hasBlockingStructure || hasRoadSite;
      }
      /**
       * Check if position is an exit position
       */
      static isExitPosition(pos, _room) {
        return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
      }
      /**
       * Get main exits (filter out less important ones)
       */
      static getMainExits(exits) {
        return exits.slice(0, 4);
      }
      /**
       * Find construction site ID for a road at a specific position
       */
      static findRoadConstructionSiteId(_room, pos) {
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        const roadSite = sites.find((s) => s.structureType === STRUCTURE_ROAD);
        return roadSite ? roadSite.id : void 0;
      }
      /**
       * Get road network statistics for a room
       */
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
        const threshold = Settings.planning.roadPriorityThreshold;
        roads.forEach((road) => {
          const trafficScore = TrafficAnalyzer.getTrafficScore(room, road.pos);
          if (trafficScore >= threshold) {
            highTrafficRoads++;
          }
        });
        const recommendedUpgrades = this.getRecommendedRoadUpgrades(room).length;
        return {
          totalRoads: roads.length,
          roadConstructionSites: roadSites.length,
          averageRoadHealth: averageHealth,
          highTrafficRoads,
          recommendedUpgrades
        };
      }
      /**
       * Clear road planning data for a room
       */
      static clearRoadPlan(roomName) {
        const room = Game.rooms[roomName];
        if (room && room.memory.plan) {
          room.memory.plan.roads = [];
          Logger.debug(`RoadPlanner: Cleared road plan for room ${roomName}`);
        }
      }
    };
  }
});

// src/managers/RoomManager.ts
var RoomManager_exports = {};
__export(RoomManager_exports, {
  RoomManager: () => RoomManager
});
var RoomManager;
var init_RoomManager = __esm({
  "src/managers/RoomManager.ts"() {
    "use strict";
    init_Logger();
    init_settings();
    init_TerrainAnalyzer();
    init_BaseLayoutPlanner();
    init_RoadPlanner();
    init_TrafficAnalyzer();
    RoomManager = class {
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
        } catch (error) {
          Logger.error(`Error processing room ${room.name}: ${error}`, "RoomManager");
        }
      }
      initializeRoomMemory(room) {
        if (!Memory.rooms[room.name]) {
          Memory.rooms[room.name] = {
            sources: {},
            spawnIds: [],
            lastUpdated: Game.time,
            rcl: room.controller ? room.controller.level : 0
          };
          if (room.controller) {
            Memory.rooms[room.name].controllerId = room.controller.id;
          }
        }
      }
      updateRoomMemory(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory) return;
        roomMemory.rcl = room.controller ? room.controller.level : 0;
        roomMemory.lastUpdated = Game.time;
        this.updateSourcesMemory(room);
        this.updateSpawnsMemory(room);
      }
      updateSourcesMemory(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory) return;
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
          if (!roomMemory.sources[source.id]) {
            roomMemory.sources[source.id] = {};
          }
          const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
            filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
          });
          if (containers.length > 0 && roomMemory.sources[source.id] && containers[0]) {
            roomMemory.sources[source.id].containerId = containers[0].id;
          }
          const links = source.pos.findInRange(FIND_STRUCTURES, 2, {
            filter: (structure) => structure.structureType === STRUCTURE_LINK
          });
          if (links.length > 0 && roomMemory.sources[source.id] && links[0]) {
            roomMemory.sources[source.id].linkId = links[0].id;
          }
        }
      }
      updateSpawnsMemory(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory) return;
        const spawns = room.find(FIND_MY_SPAWNS);
        roomMemory.spawnIds = spawns.map((spawn) => spawn.id);
      }
      runPlanning(room) {
        if (!Settings.planning.buildingPlanningEnabled) return;
        if (Game.time % Settings.planning.planningCadence !== 0) return;
        try {
          this.initializeRoomPlan(room);
          const roomMemory = Memory.rooms[room.name];
          if (roomMemory && roomMemory.plan && roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) {
            Logger.info(`RoomManager: RCL changed for room ${room.name}, replanning...`);
            this.replanRoom(room);
            return;
          }
          let roadsUpdatedThisTick = false;
          if (this.shouldUpdateBuildingPlan(room)) {
            this.updateBuildingPlan(room);
            roadsUpdatedThisTick = true;
          }
          if (!roadsUpdatedThisTick && this.shouldUpdateRoadPlan(room)) {
            this.updateRoadPlan(room);
          }
        } catch (error) {
          Logger.error(`RoomManager: Error in planning for room ${room.name}: ${error}`);
        }
      }
      updateTrafficAnalysis(room) {
        if (!Settings.planning.trafficAnalysisEnabled) return;
        try {
          RoadPlanner.updateTrafficAnalysis(room);
          TrafficAnalyzer.trackRoomTraffic(room);
        } catch (error) {
          Logger.error(`RoomManager: Error updating traffic analysis for room ${room.name}: ${error}`);
        }
      }
      manageConstructionSites(room) {
        try {
          if (Game.time % Settings.planning.constructionCadence !== 0) return;
          this.placeBuildingConstructionSites(room);
          this.placeRoadConstructionSites(room);
          this.cleanupConstructionSites(room);
        } catch (error) {
          Logger.error(`RoomManager: Error managing construction sites for room ${room.name}: ${error}`);
        }
      }
      initializeRoomPlan(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory) return;
        if (!roomMemory.plan) {
          roomMemory.plan = {
            roomName: room.name,
            buildings: [],
            roads: [],
            rcl: room.controller ? room.controller.level : 0,
            lastUpdated: Game.time,
            status: "planning",
            priority: 1
          };
          Logger.info(`RoomManager: Initialized room plan for ${room.name}`);
        }
        if (!roomMemory.trafficData) {
          roomMemory.trafficData = {};
        }
        if (!roomMemory.layoutAnalysis) {
          const terrainAnalysis = TerrainAnalyzer.analyzeRoom(room);
          const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
          roomMemory.layoutAnalysis = {
            terrain: terrainAnalysis,
            keyPositions,
            lastAnalyzed: Game.time
          };
          Logger.info(`RoomManager: Completed terrain analysis for ${room.name}`);
        }
      }
      replanRoom(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan) return;
        Logger.info(`RoomManager: Replanning room ${room.name} for RCL ${room.controller ? room.controller.level : 0}`);
        roomMemory.plan.buildings = [];
        roomMemory.plan.roads = [];
        roomMemory.plan.rcl = room.controller ? room.controller.level : 0;
        roomMemory.plan.lastUpdated = Game.time;
        this.updateBuildingPlan(room);
        this.updateRoadPlan(room);
      }
      shouldUpdateBuildingPlan(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan) return true;
        if (roomMemory.plan.buildings.length === 0) return true;
        if (roomMemory.plan.rcl !== (room.controller ? room.controller.level : 0)) return true;
        const timeSinceUpdate = Game.time - roomMemory.plan.lastUpdated;
        return timeSinceUpdate > Settings.planning.planningCadence * 10;
      }
      shouldUpdateRoadPlan(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan) return true;
        if (roomMemory.plan.roads.length === 0) return true;
        const trafficPositions = Object.keys(roomMemory.trafficData || {}).length;
        return trafficPositions > Settings.planning.minTrafficDataPoints;
      }
      updateBuildingPlan(room) {
        try {
          const plan = BaseLayoutPlanner.planRoom(room);
          const roomMemory = Memory.rooms[room.name];
          if (roomMemory) {
            roomMemory.plan = plan;
            Logger.info(`RoomManager: Updated building plan for ${room.name} with ${plan.buildings.length} buildings`);
          }
        } catch (error) {
          Logger.error(`RoomManager: Error updating building plan for room ${room.name}: ${error}`);
        }
      }
      updateRoadPlan(room) {
        try {
          const roomMemory = Memory.rooms[room.name];
          if (!roomMemory || !roomMemory.plan) return;
          const roads = RoadPlanner.planRoadNetwork(room, roomMemory.plan.buildings);
          roomMemory.plan.roads = roads;
          roomMemory.plan.lastUpdated = Game.time;
          Logger.info(`RoomManager: Updated road plan for ${room.name} with ${roads.length} roads`);
          if (roads.length > 0) {
            try {
              RoadPlanner.placeRoadConstructionSites(room, roads);
            } catch (error) {
              Logger.error(`RoomManager: Error placing road construction sites immediately after planning for room ${room.name}: ${error}`);
            }
          }
        } catch (error) {
          Logger.error(`RoomManager: Error updating road plan for room ${room.name}: ${error}`);
        }
      }
      placeBuildingConstructionSites(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan) return;
        try {
          BaseLayoutPlanner.placeConstructionSites(room, roomMemory.plan);
        } catch (error) {
          Logger.error(`RoomManager: Error placing building construction sites for room ${room.name}: ${error}`);
        }
      }
      placeRoadConstructionSites(room) {
        const roomMemory = Memory.rooms[room.name];
        if (!roomMemory || !roomMemory.plan) return;
        try {
          RoadPlanner.placeRoadConstructionSites(room, roomMemory.plan.roads);
        } catch (error) {
          Logger.error(`RoomManager: Error placing road construction sites for room ${room.name}: ${error}`);
        }
      }
      cleanupConstructionSites(room) {
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        const maxAge = Settings.planning.constructionSiteMaxAge;
        sites.forEach((site) => {
          if (Game.time - site.createdTime > maxAge && site.progress === 0) {
            site.remove();
            Logger.debug(`RoomManager: Removed idle construction site at ${site.pos.x},${site.pos.y} in room ${room.name}`);
          }
        });
      }
      runDefense(room) {
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length === 0) {
          return;
        }
        const towers = room.find(FIND_MY_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_TOWER
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
    };
  }
});

// src/managers/SpawnManager.ts
var SpawnManager_exports = {};
__export(SpawnManager_exports, {
  SpawnManager: () => SpawnManager
});
var SpawnManager;
var init_SpawnManager = __esm({
  "src/managers/SpawnManager.ts"() {
    "use strict";
    init_Logger();
    SpawnManager = class {
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
        } catch (error) {
          Logger.error(`Error processing spawn ${spawn.name}: ${error}`, "SpawnManager");
        }
      }
      calculateRequiredCreeps(room) {
        const rcl = room.controller ? room.controller.level : 0;
        const sources = room.find(FIND_SOURCES);
        const sourceCount = sources.length;
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        let requiredCreeps = {};
        if (rcl === 1) {
          requiredCreeps["harvester"] = Math.max(2, sourceCount * 2);
        } else {
          requiredCreeps["harvester"] = Math.max(1, sourceCount);
          requiredCreeps["upgrader"] = rcl >= 3 ? 2 : 1;
          const baseBuilders = constructionSites.length > 0 ? 2 : 1;
          requiredCreeps["builder"] = Math.min(baseBuilders, Math.floor(rcl / 2) + 1);
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
        const roles = ["harvester", "upgrader", "builder"];
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
          case "harvester":
            return this.getHarvesterBody(energyAvailable);
          case "upgrader":
            return this.getUpgraderBody(energyAvailable);
          case "builder":
            return this.getBuilderBody(energyAvailable);
          default:
            Logger.warn(`Unknown role for body generation: ${role}`, "SpawnManager");
            return [];
        }
      }
      getHarvesterBody(energyAvailable) {
        if (energyAvailable >= 400) {
          return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 300) {
          return [WORK, WORK, CARRY, MOVE];
        } else if (energyAvailable >= 200) {
          return [WORK, CARRY, MOVE];
        } else {
          return [WORK, CARRY, MOVE];
        }
      }
      getUpgraderBody(energyAvailable) {
        if (energyAvailable >= 500) {
          return [WORK, WORK, WORK, CARRY, CARRY, MOVE];
        } else if (energyAvailable >= 400) {
          return [WORK, WORK, CARRY, CARRY, MOVE];
        } else if (energyAvailable >= 300) {
          return [WORK, WORK, CARRY, MOVE];
        } else if (energyAvailable >= 200) {
          return [WORK, CARRY, MOVE];
        } else {
          return [WORK, CARRY, MOVE];
        }
      }
      getBuilderBody(energyAvailable) {
        if (energyAvailable >= 450) {
          return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 350) {
          return [WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 250) {
          return [WORK, CARRY, MOVE, MOVE];
        } else if (energyAvailable >= 200) {
          return [WORK, CARRY, MOVE];
        } else {
          return [WORK, CARRY, MOVE];
        }
      }
      spawnCreep(spawn, role, body, homeRoom) {
        const name = `${role}_${Game.time}`;
        const result = spawn.spawnCreep(body, name, {
          memory: {
            role,
            homeRoom,
            working: false
          }
        });
        if (result === OK) {
          Logger.logSpawn(role, name, homeRoom);
        } else if (result === ERR_NOT_ENOUGH_ENERGY) {
        } else {
          Logger.warn(`Failed to spawn ${role}: ${result}`, "SpawnManager");
        }
      }
    };
  }
});

// src/roles/Harvester.ts
var Harvester_exports = {};
__export(Harvester_exports, {
  Harvester: () => Harvester
});
var Harvester;
var init_Harvester = __esm({
  "src/roles/Harvester.ts"() {
    "use strict";
    Harvester = class {
      static run(creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
          creep.memory.working = false;
          creep.say("\u{1F504} harvest");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
          creep.memory.working = true;
          creep.say("\u{1F69B} deliver");
        }
        if (creep.memory.working) {
          this.deliverEnergy(creep);
        } else {
          this.harvestEnergy(creep);
        }
      }
      static harvestEnergy(creep) {
        const source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source) {
          if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
          }
        }
      }
      static deliverEnergy(creep) {
        let target = null;
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
          });
        }
        if (!target && creep.room.controller) {
          target = creep.room.controller;
        }
        if (target) {
          let result;
          if (target.structureType === STRUCTURE_CONTROLLER) {
            result = creep.upgradeController(target);
          } else {
            result = creep.transfer(target, RESOURCE_ENERGY);
          }
          if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
          }
        }
      }
    };
  }
});

// src/roles/Builder.ts
var Builder_exports = {};
__export(Builder_exports, {
  Builder: () => Builder
});
var Builder;
var init_Builder = __esm({
  "src/roles/Builder.ts"() {
    "use strict";
    Builder = class {
      static run(creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
          creep.memory.working = false;
          creep.say("\u{1F504} collect");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
          creep.memory.working = true;
          creep.say("\u{1F6A7} build");
        }
        if (creep.memory.working) {
          this.buildOrRepair(creep);
        } else {
          this.collectEnergy(creep);
        }
      }
      static collectEnergy(creep) {
        let target = null;
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
          }
        });
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0;
            }
          });
        }
        if (!target) {
          const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (resource) => resource.resourceType === RESOURCE_ENERGY
          });
          if (droppedEnergy) {
            if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
              creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            return;
          }
        }
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_SOURCES);
        }
        if (target) {
          let result;
          if (target instanceof Source) {
            result = creep.harvest(target);
          } else {
            result = creep.withdraw(target, RESOURCE_ENERGY);
          }
          if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
          }
        }
      }
      static buildOrRepair(creep) {
        let target = null;
        target = this.findHighestPriorityConstructionSite(creep);
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.hits < structure.hitsMax * 0.8 && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART;
            }
          });
        }
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
              return (structure.structureType === STRUCTURE_ROAD || structure.structureType === STRUCTURE_CONTAINER) && structure.hits < structure.hitsMax * 0.5;
            }
          });
        }
        if (target) {
          let result;
          if (target instanceof ConstructionSite) {
            result = creep.build(target);
          } else {
            result = creep.repair(target);
          }
          if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
          }
        } else {
          if (creep.room.controller) {
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
            }
          }
        }
      }
      static findHighestPriorityConstructionSite(creep) {
        const room = creep.room;
        const roomMemory = Memory.rooms[room.name];
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length === 0) {
          return null;
        }
        if (!roomMemory || !roomMemory.plan) {
          return creep.pos.findClosestByPath(constructionSites) || null;
        }
        const sitesWithPriority = [];
        for (const site of constructionSites) {
          let priority = 0;
          const plannedBuilding = roomMemory.plan.buildings.find(
            (building) => building.pos.x === site.pos.x && building.pos.y === site.pos.y && building.structureType === site.structureType
          );
          if (plannedBuilding) {
            priority = plannedBuilding.priority;
          } else {
            const plannedRoad = roomMemory.plan.roads.find(
              (road) => road.pos.x === site.pos.x && road.pos.y === site.pos.y
            );
            if (plannedRoad) {
              priority = plannedRoad.priority;
            }
          }
          const distance = creep.pos.getRangeTo(site.pos);
          sitesWithPriority.push({
            site,
            priority,
            distance
          });
        }
        sitesWithPriority.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.distance - b.distance;
        });
        for (const item of sitesWithPriority) {
          const path = creep.pos.findPathTo(item.site.pos);
          if (path.length > 0) {
            return item.site;
          }
        }
        return sitesWithPriority.length > 0 ? sitesWithPriority[0].site : null;
      }
    };
  }
});

// src/roles/Upgrader.ts
var Upgrader_exports = {};
__export(Upgrader_exports, {
  Upgrader: () => Upgrader
});
var Upgrader;
var init_Upgrader = __esm({
  "src/roles/Upgrader.ts"() {
    "use strict";
    Upgrader = class {
      static run(creep) {
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
          creep.memory.working = false;
          creep.say("\u{1F504} collect");
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
          creep.memory.working = true;
          creep.say("\u26A1 upgrade");
        }
        if (creep.memory.working) {
          this.upgradeController(creep);
        } else {
          this.collectEnergy(creep);
        }
      }
      static collectEnergy(creep) {
        let target = null;
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
          }
        });
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0;
            }
          });
        }
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_LINK && structure.store[RESOURCE_ENERGY] > 0;
            }
          });
        }
        if (!target) {
          const droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: (resource) => resource.resourceType === RESOURCE_ENERGY
          });
          if (droppedEnergy) {
            if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
              creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            return;
          }
        }
        if (!target) {
          target = creep.pos.findClosestByPath(FIND_SOURCES);
        }
        if (target) {
          let result;
          if (target instanceof Source) {
            result = creep.harvest(target);
          } else {
            result = creep.withdraw(target, RESOURCE_ENERGY);
          }
          if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: "#ffaa00" } });
          }
        }
      }
      static upgradeController(creep) {
        if (creep.room.controller) {
          const result = creep.upgradeController(creep.room.controller);
          if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
          } else if (result === ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.working = false;
          }
        }
      }
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  loop: () => loop
});
module.exports = __toCommonJS(main_exports);

// src/kernel/Kernel.ts
init_Logger();
init_settings();
var Kernel = class {
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
        Logger.cleanup();
      }
      if (Game.time % 500 === 0) {
        this.cleanupPlanningData();
      }
      for (const manager of this.managers) {
        this.safelyExecute(() => manager.run(), manager.name);
      }
      this.runCreeps();
    } catch (error) {
      Logger.error(`Critical error in main loop: ${error}`, "Kernel");
    }
  }
  load() {
    if (!this.initialized) {
      Logger.info("Loading kernel...", "Kernel");
      const { RoomManager: RoomManager2 } = (init_RoomManager(), __toCommonJS(RoomManager_exports));
      const { SpawnManager: SpawnManager2 } = (init_SpawnManager(), __toCommonJS(SpawnManager_exports));
      this.roomManager = new RoomManager2();
      this.spawnManager = new SpawnManager2();
      this.registerManager("RoomManager", () => this.roomManager.run());
      this.registerManager("SpawnManager", () => this.spawnManager.run());
      this.initialized = true;
    }
  }
  initializeMemory() {
    if (!Memory.uuid) {
      Memory.uuid = Math.floor(Math.random() * 1e6);
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
    if (!Settings.planning.enabled) return;
    try {
      for (const roomName in Memory.rooms) {
        const roomMemory = Memory.rooms[roomName];
        if (!roomMemory) continue;
        if (roomMemory.trafficData) {
          const trafficTTL = Settings.planning.trafficDataTTL;
          for (const posKey in roomMemory.trafficData) {
            const data = roomMemory.trafficData[posKey];
            if (data && Game.time - data.lastSeen > trafficTTL) {
              delete roomMemory.trafficData[posKey];
            }
          }
        }
        if (roomMemory.layoutAnalysis) {
          const layoutTTL = Settings.planning.layoutAnalysisTTL;
          if (Game.time - roomMemory.layoutAnalysis.lastAnalyzed > layoutTTL) {
            delete roomMemory.layoutAnalysis;
            Logger.debug(`Kernel: Cleaned up old layout analysis for room ${roomName}`);
          }
        }
        if (roomMemory.plan) {
          const room = Game.rooms[roomName];
          if (room) {
            roomMemory.plan.buildings.forEach((building) => {
              if (building.placed && building.constructionSiteId) {
                const site = Game.getObjectById(building.constructionSiteId);
                if (!site) {
                  const structures = building.pos.lookFor(LOOK_STRUCTURES);
                  const hasStructure = structures.some((s) => s.structureType === building.structureType);
                  if (hasStructure) {
                    delete building.constructionSiteId;
                  } else {
                    building.placed = false;
                    delete building.constructionSiteId;
                  }
                }
              }
            });
            roomMemory.plan.roads.forEach((road) => {
              if (road.placed && road.constructionSiteId) {
                const site = Game.getObjectById(road.constructionSiteId);
                if (!site) {
                  const structures = road.pos.lookFor(LOOK_STRUCTURES);
                  const hasRoad = structures.some((s) => s.structureType === STRUCTURE_ROAD);
                  if (hasRoad) {
                    delete road.constructionSiteId;
                  } else {
                    road.placed = false;
                    delete road.constructionSiteId;
                  }
                }
              }
            });
          }
        }
      }
      Logger.debug("Kernel: Completed planning data cleanup");
    } catch (error) {
      Logger.error(`Kernel: Error during planning data cleanup: ${error}`);
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
      Logger.warn(`Creep ${creep.name} has no role assigned`, "Kernel");
      return;
    }
    switch (creep.memory.role) {
      case "harvester":
        const { Harvester: Harvester2 } = (init_Harvester(), __toCommonJS(Harvester_exports));
        Harvester2.run(creep);
        break;
      case "builder":
        const { Builder: Builder2 } = (init_Builder(), __toCommonJS(Builder_exports));
        Builder2.run(creep);
        break;
      case "upgrader":
        const { Upgrader: Upgrader2 } = (init_Upgrader(), __toCommonJS(Upgrader_exports));
        Upgrader2.run(creep);
        break;
      default:
        Logger.warn(`Unknown role: ${creep.memory.role}`, "Kernel");
    }
  }
  safelyExecute(callback, context = "Unknown") {
    try {
      callback();
    } catch (error) {
      Logger.error(`Error in ${context}: ${error}`, "Kernel");
    }
  }
  registerManager(name, runFunction) {
    this.managers.push({ name, run: runFunction });
  }
};

// src/main.ts
function loop() {
  if (!global.kernel) {
    global.kernel = new Kernel();
  }
  global.kernel.run();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loop
});
