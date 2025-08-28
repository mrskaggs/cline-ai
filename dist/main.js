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
        roadRepairThreshold: 0.6,
        // Repair roads below this health ratio (improved from 0.5)
        emergencyRepairThreshold: 0.1,
        // Emergency repair threshold for critical structures
        rampartRepairThreshold: 0.8
        // Repair ramparts below this health ratio
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
      // Logging and debugging - OPTIMIZED FOR PERFORMANCE
      logging: {
        enabled: true,
        logLevel: "WARN",
        // WARN level reduces CPU overhead (was INFO)
        logCreepActions: false,
        // Log individual creep actions
        logSpawning: false,
        // Disabled for performance (was true)
        logRoomUpdates: false
        // Log room memory updates
      },
      // Planning system settings - OPTIMIZED FOR RCL 2-3
      planning: {
        enabled: true,
        planningCadence: 100,
        // Reduced frequency for CPU savings (was 50)
        constructionCadence: 15,
        // Slightly reduced frequency (was 10)
        maxConstructionSites: 4,
        // Reduced for focus (was 5)
        trafficAnalysisEnabled: false,
        // Disabled until RCL 3+ (was true)
        trafficDataTTL: 500,
        // Reduced retention (was 1000)
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
        constructionSiteMaxAge: 1200
        // Reduced age for faster cleanup (was 1500)
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
        const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        const structures = roomPos.lookFor(LOOK_STRUCTURES);
        if (structures.length > 0) {
          const hasBlockingStructure = structures.some(
            (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER
          );
          if (hasBlockingStructure) return false;
        }
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
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
       * RCL 2 Template - Add extensions around spawn (L-shaped pattern for spawn accessibility)
       */
      static getRCL2Template() {
        return {
          name: "RCL2_Extensions_SpawnSafe",
          rcl: 2,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // 5 extensions in L-shaped pattern - maintains spawn accessibility
            // Only blocks 2 of 8 spawn positions, leaves 6 free for excellent spawn efficiency
            { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 0 }, priority: 2 },
            // West 2 tiles
            { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -1 }, priority: 2 },
            // Northwest (blocks spawn)
            { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -2 }, priority: 2 },
            // North 2 tiles
            { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -1 }, priority: 3 },
            // Northeast (blocks spawn)
            { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 0 }, priority: 3 }
            // East 2 tiles
          ]
        };
      }
      /**
       * RCL 3 Template - Add tower and more extensions (spawn-safe placement)
       */
      static getRCL3Template() {
        return {
          name: "RCL3_Tower_Extensions_SpawnSafe",
          rcl: 3,
          centerOffset: { x: 0, y: 0 },
          buildings: [
            // Tower for defense - positioned away from spawn
            { structureType: STRUCTURE_TOWER, offset: { x: 0, y: 2 }, priority: 1 },
            // Additional extensions (5 more for total of 10) - avoid spawn positions
            { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 1 }, priority: 2 },
            // Southwest (blocks spawn)
            { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 1 }, priority: 2 },
            // Southeast (blocks spawn)
            { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -1 }, priority: 3 },
            // West-northwest
            { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -1 }, priority: 3 },
            // East-northeast
            { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: 3 }, priority: 3 }
            // South 3 tiles
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
        limits[STRUCTURE_SPAWN] = rcl >= 8 ? 3 : rcl >= 7 ? 2 : 1;
        if (rcl >= 8) limits[STRUCTURE_EXTENSION] = 60;
        else if (rcl >= 7) limits[STRUCTURE_EXTENSION] = 50;
        else if (rcl >= 6) limits[STRUCTURE_EXTENSION] = 40;
        else if (rcl >= 5) limits[STRUCTURE_EXTENSION] = 30;
        else if (rcl >= 4) limits[STRUCTURE_EXTENSION] = 20;
        else if (rcl >= 3) limits[STRUCTURE_EXTENSION] = 10;
        else if (rcl >= 2) limits[STRUCTURE_EXTENSION] = 5;
        else limits[STRUCTURE_EXTENSION] = 0;
        if (rcl >= 8) limits[STRUCTURE_TOWER] = 6;
        else if (rcl >= 7) limits[STRUCTURE_TOWER] = 3;
        else if (rcl >= 5) limits[STRUCTURE_TOWER] = 2;
        else if (rcl >= 3) limits[STRUCTURE_TOWER] = 1;
        else limits[STRUCTURE_TOWER] = 0;
        limits[STRUCTURE_CONTAINER] = 5;
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
            if (!plan) {
              Logger.info(`BaseLayoutPlanner: Creating initial plan for room ${room.name}`);
            } else if (plan.rcl < currentRCL) {
              Logger.info(`BaseLayoutPlanner: Replanning room ${room.name} - RCL upgraded from ${plan.rcl} to ${currentRCL}`);
            } else if (this.hasInvalidStructureCounts(plan)) {
              Logger.warn(`BaseLayoutPlanner: Replanning room ${room.name} - Invalid structure counts detected (likely due to corrected structure limits)`);
            } else {
              Logger.info(`BaseLayoutPlanner: Replanning room ${room.name} - Plan expired or status requires replanning`);
            }
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
        if (structureType === STRUCTURE_CONTAINER) {
          return this.planSourceOptimizedContainers(room, count, keyPositions, existingBuildings);
        }
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
       * Plan containers optimized for source positions
       */
      static planSourceOptimizedContainers(room, maxContainers, keyPositions, existingBuildings) {
        const buildings = [];
        const occupiedPositions = new Set(
          existingBuildings.map((b) => `${b.pos.x},${b.pos.y}`)
        );
        Logger.info(`BaseLayoutPlanner: Planning source-optimized containers for room ${room.name}`);
        let containersPlaced = 0;
        for (const source of keyPositions.sources) {
          if (containersPlaced >= maxContainers) break;
          const containerPos = this.findOptimalContainerPosition(room, source, occupiedPositions);
          if (containerPos) {
            buildings.push({
              structureType: STRUCTURE_CONTAINER,
              pos: containerPos,
              priority: 90,
              // High priority for source containers
              rclRequired: 3,
              placed: false,
              reason: `Source container for energy source at ${source.x},${source.y}`
            });
            occupiedPositions.add(`${containerPos.x},${containerPos.y}`);
            containersPlaced++;
            Logger.info(`BaseLayoutPlanner: Planned source container at ${containerPos.x},${containerPos.y} for source at ${source.x},${source.y}`);
          }
        }
        if (containersPlaced < maxContainers && keyPositions.controller) {
          const controllerContainerPos = this.findOptimalContainerPosition(room, keyPositions.controller, occupiedPositions);
          if (controllerContainerPos) {
            buildings.push({
              structureType: STRUCTURE_CONTAINER,
              pos: controllerContainerPos,
              priority: 80,
              // High priority for controller container
              rclRequired: 3,
              placed: false,
              reason: `Controller container for upgrader efficiency`
            });
            occupiedPositions.add(`${controllerContainerPos.x},${controllerContainerPos.y}`);
            containersPlaced++;
            Logger.info(`BaseLayoutPlanner: Planned controller container at ${controllerContainerPos.x},${controllerContainerPos.y}`);
          }
        }
        if (containersPlaced < maxContainers && keyPositions.mineral && room.controller && room.controller.level >= 6) {
          const mineralContainerPos = this.findOptimalContainerPosition(room, keyPositions.mineral, occupiedPositions);
          if (mineralContainerPos) {
            buildings.push({
              structureType: STRUCTURE_CONTAINER,
              pos: mineralContainerPos,
              priority: 60,
              // Lower priority for mineral container
              rclRequired: 6,
              placed: false,
              reason: `Mineral container for mineral harvesting`
            });
            containersPlaced++;
            Logger.info(`BaseLayoutPlanner: Planned mineral container at ${mineralContainerPos.x},${mineralContainerPos.y}`);
          }
        }
        Logger.info(`BaseLayoutPlanner: Planned ${containersPlaced} source-optimized containers for room ${room.name}`);
        return buildings;
      }
      /**
       * Find optimal container position adjacent to a source/controller/mineral
       */
      static findOptimalContainerPosition(room, target, occupiedPositions) {
        const adjacentPositions = [
          { x: target.x - 1, y: target.y - 1 },
          { x: target.x, y: target.y - 1 },
          { x: target.x + 1, y: target.y - 1 },
          { x: target.x - 1, y: target.y },
          { x: target.x + 1, y: target.y },
          { x: target.x - 1, y: target.y + 1 },
          { x: target.x, y: target.y + 1 },
          { x: target.x + 1, y: target.y + 1 }
        ];
        const candidates = [];
        for (const offset of adjacentPositions) {
          if (offset.x < 1 || offset.x > 48 || offset.y < 1 || offset.y > 48) continue;
          const pos = new RoomPosition(offset.x, offset.y, room.name);
          const posKey = `${pos.x},${pos.y}`;
          if (occupiedPositions.has(posKey)) continue;
          if (!this.isValidContainerPosition(room, pos)) continue;
          const score = this.scoreContainerPosition(room, pos, target);
          candidates.push({ pos, score });
        }
        if (candidates.length === 0) {
          Logger.warn(`BaseLayoutPlanner: No valid container positions found adjacent to ${target.x},${target.y} in room ${room.name}`);
          return null;
        }
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].pos;
      }
      /**
       * Check if a position is valid for container placement
       */
      static isValidContainerPosition(room, pos) {
        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain & TERRAIN_MASK_WALL) return false;
        const structures = pos.lookFor(LOOK_STRUCTURES);
        const blockingStructures = structures.filter(
          (s) => s.structureType !== STRUCTURE_ROAD
          // Roads can coexist with containers
        );
        if (blockingStructures.length > 0) return false;
        const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (sites.length > 0) return false;
        return true;
      }
      /**
       * Score a container position based on accessibility and terrain
       */
      static scoreContainerPosition(room, pos, _target) {
        let score = 100;
        const terrain = room.getTerrain().get(pos.x, pos.y);
        if (terrain & TERRAIN_MASK_SWAMP) {
          score -= 20;
        }
        let openSpaces = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const checkX = pos.x + dx;
            const checkY = pos.y + dy;
            if (checkX < 1 || checkX > 48 || checkY < 1 || checkY > 48) continue;
            const checkTerrain = room.getTerrain().get(checkX, checkY);
            if (!(checkTerrain & TERRAIN_MASK_WALL)) {
              openSpaces++;
            }
          }
        }
        score += openSpaces * 5;
        const roomCenter = new RoomPosition(25, 25, room.name);
        const distanceToCenter = PathingUtils.getDistance(pos, roomCenter);
        score += Math.max(0, 25 - distanceToCenter);
        return score;
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
        Logger.debug(`BaseLayoutPlanner: Room ${room.name} - Current RCL: ${currentRCL}, Plan RCL: ${plan.rcl}`);
        const eligibleBuildings = plan.buildings.filter(
          (building) => !building.placed && building.rclRequired <= currentRCL && !this.hasStructureAtPosition(room, building.pos, building.structureType)
        ).sort((a, b) => b.priority - a.priority);
        Logger.debug(`BaseLayoutPlanner: Room ${room.name} - Total buildings: ${plan.buildings.length}, Eligible: ${eligibleBuildings.length}`);
        for (const building of eligibleBuildings) {
          if (sitesPlaced >= sitesToPlace) break;
          Logger.debug(`BaseLayoutPlanner: Attempting to place ${building.structureType} at ${building.pos.x},${building.pos.y} - RCL required: ${building.rclRequired}, Current RCL: ${currentRCL}`);
          if (!this.isValidConstructionPosition(room, building.pos, building.structureType)) {
            Logger.debug(`BaseLayoutPlanner: Skipping invalid position for ${building.structureType} at ${building.pos.x},${building.pos.y} in room ${room.name}`);
            continue;
          }
          if (building.rclRequired > currentRCL) {
            Logger.warn(`BaseLayoutPlanner: Skipping ${building.structureType} at ${building.pos.x},${building.pos.y} - RCL ${building.rclRequired} required but room is RCL ${currentRCL}`);
            continue;
          }
          const roomPos = new RoomPosition(building.pos.x, building.pos.y, building.pos.roomName);
          const result = room.createConstructionSite(roomPos, building.structureType);
          if (result === OK) {
            building.placed = true;
            const siteId = this.findConstructionSiteId(room, building.pos, building.structureType);
            if (siteId) {
              building.constructionSiteId = siteId;
            }
            sitesPlaced++;
            Logger.info(`BaseLayoutPlanner: Placed ${building.structureType} construction site at ${building.pos.x},${building.pos.y} in room ${room.name}`);
          } else {
            Logger.warn(`BaseLayoutPlanner: Failed to place ${building.structureType} at ${building.pos.x},${building.pos.y} in room ${room.name}: ${this.getErrorDescription(result)}`);
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
        return age > Settings.planning.layoutAnalysisTTL || plan.status === "planning" || this.hasInvalidStructureCounts(plan);
      }
      /**
       * Check if the plan has invalid structure counts that exceed current RCL limits
       * This handles cases where structure limits were corrected after the plan was created
       */
      static hasInvalidStructureCounts(plan) {
        const currentLimits = LayoutTemplates.getStructureLimits(plan.rcl);
        const structureCounts = {};
        plan.buildings.forEach((building) => {
          const type = building.structureType;
          structureCounts[type] = (structureCounts[type] || 0) + 1;
        });
        for (const [structureType, count] of Object.entries(structureCounts)) {
          const limit = currentLimits[structureType] || 0;
          if (count > limit) {
            Logger.warn(`BaseLayoutPlanner: Plan has invalid structure count - ${structureType}: ${count} > ${limit} (RCL ${plan.rcl})`);
            return true;
          }
        }
        return false;
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
          // Extensions are available starting at RCL 2
          [STRUCTURE_TOWER]: 3,
          [STRUCTURE_CONTAINER]: 3,
          // Containers are available starting at RCL 3
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
        const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        const structures = roomPos.lookFor(LOOK_STRUCTURES);
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
        return structures.some((s) => s.structureType === structureType) || sites.some((s) => s.structureType === structureType);
      }
      static findConstructionSiteId(_room, pos, structureType) {
        const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
        const site = sites.find((s) => s.structureType === structureType);
        return site ? site.id : void 0;
      }
      /**
       * Validate if a position is suitable for construction site placement
       */
      static isValidConstructionPosition(room, pos, _structureType) {
        const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        if (roomPos.x < 1 || roomPos.x > 48 || roomPos.y < 1 || roomPos.y > 48) {
          return false;
        }
        const terrain = room.getTerrain().get(roomPos.x, roomPos.y);
        if (terrain & TERRAIN_MASK_WALL) {
          return false;
        }
        const structures = roomPos.lookFor(LOOK_STRUCTURES);
        if (structures.length > 0) {
          const blockingStructures = structures.filter(
            (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER
          );
          if (blockingStructures.length > 0) {
            return false;
          }
        }
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (sites.length > 0) {
          return false;
        }
        const creeps = roomPos.lookFor(LOOK_CREEPS);
        if (creeps.length > 0) {
          return false;
        }
        return true;
      }
      /**
       * Get human-readable error description for construction site placement errors
       */
      static getErrorDescription(errorCode) {
        switch (errorCode) {
          case ERR_INVALID_TARGET:
            return "ERR_INVALID_TARGET (-10): Invalid position or structure type";
          case ERR_FULL:
            return "ERR_FULL (-8): Too many construction sites";
          case ERR_INVALID_ARGS:
            return "ERR_INVALID_ARGS (-10): Invalid arguments";
          case ERR_RCL_NOT_ENOUGH:
            return "ERR_RCL_NOT_ENOUGH (-14): RCL too low for this structure";
          case ERR_NOT_OWNER:
            return "ERR_NOT_OWNER (-1): Not room owner";
          default:
            return `Unknown error (${errorCode})`;
        }
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
          Logger.debug(`RoadPlanner: Planning road network for room ${room.name}`);
          const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
          const optimalPaths = this.calculateOptimalPaths(room, keyPositions);
          const trafficData = TrafficAnalyzer.analyzeTrafficPatterns(room);
          const roads = this.optimizeRoadPlacement(optimalPaths, trafficData, room);
          const cpuUsed = Game.cpu.getUsed() - startCpu;
          Logger.debug(`RoadPlanner: Planned ${roads.length} roads for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
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
          (road) => !road.placed && (road.trafficScore >= Settings.planning.minTrafficForRoad || road.priority >= 80 || this.wasRoadPreviouslyPlaced(road)) && !this.hasRoadOrStructure(road.pos)
        ).sort((a, b) => {
          const aWasPreviouslyPlaced = this.wasRoadPreviouslyPlaced(a);
          const bWasPreviouslyPlaced = this.wasRoadPreviouslyPlaced(b);
          if (aWasPreviouslyPlaced && !bWasPreviouslyPlaced) return -1;
          if (!aWasPreviouslyPlaced && bWasPreviouslyPlaced) return 1;
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          const spawns = room.find(FIND_MY_SPAWNS);
          if (spawns.length > 0) {
            const spawn = spawns[0];
            if (spawn) {
              const aDistanceToSpawn = spawn.pos.getRangeTo(a.pos.x, a.pos.y);
              const bDistanceToSpawn = spawn.pos.getRangeTo(b.pos.x, b.pos.y);
              return aDistanceToSpawn - bDistanceToSpawn;
            }
          }
          return b.priority - a.priority;
        });
        for (const road of eligibleRoads) {
          if (sitesPlaced >= sitesToPlace) break;
          const roomPos = new RoomPosition(road.pos.x, road.pos.y, road.pos.roomName);
          const result = room.createConstructionSite(roomPos, STRUCTURE_ROAD);
          if (result === OK) {
            road.placed = true;
            const siteId = this.findRoadConstructionSiteId(room, roomPos);
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
        const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        const structures = roomPos.lookFor(LOOK_STRUCTURES);
        const hasRoad = structures.some((s) => s.structureType === STRUCTURE_ROAD);
        const hasBlockingStructure = structures.some(
          (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER && !(s.structureType === STRUCTURE_RAMPART && s.my)
        );
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
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
        const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
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
       * Check if a road was previously placed but has now decayed (marked for rebuilding)
       * This helps prioritize rebuilding roads that were built before over new road planning
       */
      static wasRoadPreviouslyPlaced(road) {
        if (!road.placed && road.constructionSiteId) {
          return true;
        }
        if (!road.placed && road.priority >= 90) {
          return true;
        }
        if (!road.placed && road.priority >= 60 && road.pathType !== "internal") {
          return true;
        }
        if (!road.placed && road.priority >= 50 && (road.pathType === "source" || road.pathType === "controller" || road.pathType === "mineral" || road.pathType === "exit")) {
          return true;
        }
        return false;
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
          requiredCreeps["harvester"] = sourceCount;
          if (rcl === 2) {
            requiredCreeps["upgrader"] = constructionSites.length > 5 ? 2 : 3;
          } else {
            requiredCreeps["upgrader"] = rcl >= 3 ? 2 : 1;
          }
          const repairWorkload = this.calculateRepairWorkload(room);
          const totalWorkload = constructionSites.length + repairWorkload;
          if (rcl >= 3) {
            if (totalWorkload > 15) {
              requiredCreeps["builder"] = 4;
            } else if (totalWorkload > 10) {
              requiredCreeps["builder"] = 3;
            } else if (totalWorkload > 5) {
              requiredCreeps["builder"] = 2;
            } else {
              requiredCreeps["builder"] = 1;
            }
          } else {
            if (totalWorkload > 8) {
              requiredCreeps["builder"] = 3;
            } else if (totalWorkload > 3) {
              requiredCreeps["builder"] = 2;
            } else {
              requiredCreeps["builder"] = totalWorkload > 0 ? 1 : 0;
            }
          }
          if (rcl >= 3) {
            const containers = room.find(FIND_STRUCTURES, {
              filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
            });
            if (containers.length > 0) {
              requiredCreeps["hauler"] = Math.max(1, Math.floor(sourceCount * 1.5));
            }
          }
          if (rcl >= 2) {
            const currentHarvesters = Object.values(Game.creeps).filter(
              (creep) => creep.memory.homeRoom === room.name && creep.memory.role === "harvester"
            ).length;
            const currentUpgraders = Object.values(Game.creeps).filter(
              (creep) => creep.memory.homeRoom === room.name && creep.memory.role === "upgrader"
            ).length;
            if (currentHarvesters >= 1 && currentUpgraders >= 1) {
              requiredCreeps["scout"] = 1;
            }
          }
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
        const roles = ["harvester", "hauler", "upgrader", "builder", "scout"];
        for (const role of roles) {
          const current = creepCounts[role] || 0;
          const needed = required[role] || 0;
          if (current < needed) {
            const body = this.getCreepBody(role, room);
            if (body.length > 0) {
              if (this.shouldWaitForBetterCreep(room, role, body)) {
                Logger.debug(`Waiting for more energy to spawn better ${role} (current: ${room.energyAvailable}/${room.energyCapacityAvailable})`, "SpawnManager");
                continue;
              }
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
            return this.getHarvesterBody(energyAvailable, room);
          case "hauler":
            return this.getHaulerBody(energyAvailable, room);
          case "upgrader":
            return this.getUpgraderBody(energyAvailable, room);
          case "builder":
            return this.getBuilderBody(energyAvailable, room);
          case "scout":
            return this.getScoutBody(energyAvailable);
          default:
            Logger.warn(`Unknown role for body generation: ${role}`, "SpawnManager");
            return [];
        }
      }
      getHarvesterBody(energyAvailable, room) {
        const rcl = room.controller ? room.controller.level : 1;
        const energyCapacity = room.energyCapacityAvailable;
        const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;
        const hasContainers = rcl >= 3 && room.find(FIND_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
        }).length > 0;
        if (hasContainers) {
          if (targetEnergy >= 1300) {
            return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
          } else if (targetEnergy >= 800) {
            return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
          } else if (targetEnergy >= 600) {
            return [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
          } else if (targetEnergy >= 500) {
            return [WORK, WORK, WORK, WORK, CARRY, MOVE];
          } else if (targetEnergy >= 350) {
            return [WORK, WORK, WORK, CARRY];
          } else if (targetEnergy >= 300) {
            return [WORK, WORK, WORK, CARRY, MOVE];
          } else {
            return [WORK, CARRY, MOVE];
          }
        } else {
          if (targetEnergy >= 550) {
            return [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
          } else if (targetEnergy >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
          } else if (targetEnergy >= 300) {
            return [WORK, WORK, CARRY, MOVE];
          } else if (targetEnergy >= 200) {
            return [WORK, CARRY, MOVE];
          } else {
            return [WORK, CARRY, MOVE];
          }
        }
      }
      getUpgraderBody(energyAvailable, room) {
        const energyCapacity = room.energyCapacityAvailable;
        const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;
        if (targetEnergy >= 1300) {
          return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE];
        } else if (targetEnergy >= 800) {
          return [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
        } else if (targetEnergy >= 550) {
          return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
        } else if (targetEnergy >= 500) {
          return [WORK, WORK, WORK, CARRY, CARRY, MOVE];
        } else if (targetEnergy >= 400) {
          return [WORK, WORK, CARRY, CARRY, MOVE];
        } else if (targetEnergy >= 300) {
          return [WORK, WORK, CARRY, MOVE];
        } else if (targetEnergy >= 200) {
          return [WORK, CARRY, MOVE];
        } else {
          return [WORK, CARRY, MOVE];
        }
      }
      getBuilderBody(energyAvailable, room) {
        const energyCapacity = room.energyCapacityAvailable;
        const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;
        if (targetEnergy >= 1300) {
          return [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (targetEnergy >= 800) {
          return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 550) {
          return [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 450) {
          return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 350) {
          return [WORK, CARRY, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 300) {
          return [WORK, WORK, CARRY, CARRY, MOVE];
        } else if (targetEnergy >= 250) {
          return [WORK, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 200) {
          return [WORK, CARRY, MOVE];
        } else {
          return [WORK, CARRY, MOVE];
        }
      }
      getHaulerBody(energyAvailable, room) {
        const energyCapacity = room.energyCapacityAvailable;
        const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;
        if (targetEnergy >= 1300) {
          return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        } else if (targetEnergy >= 800) {
          return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
        } else if (targetEnergy >= 550) {
          return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        } else if (targetEnergy >= 400) {
          return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 300) {
          return [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
        } else if (targetEnergy >= 200) {
          return [CARRY, CARRY, MOVE, MOVE];
        } else {
          return [CARRY, MOVE];
        }
      }
      getScoutBody(energyAvailable) {
        if (energyAvailable >= 100) {
          return [MOVE, MOVE];
        } else if (energyAvailable >= 50) {
          return [MOVE];
        } else {
          return [];
        }
      }
      shouldWaitForBetterCreep(room, role, currentBody) {
        const currentBodyCost = this.calculateBodyCost(currentBody);
        if (role === "scout") {
          return false;
        }
        const isEmergencyBody = currentBodyCost <= 250;
        if (isEmergencyBody) {
          const isEmergency = this.isEmergencySpawning(room, role);
          if (!isEmergency) {
            Logger.debug(`Refusing to spawn cheap ${role} (${currentBodyCost} energy) - not an emergency. Waiting for extensions to fill.`, "SpawnManager");
            return true;
          }
        }
        const existingCreeps = Object.values(Game.creeps).filter(
          (creep) => creep.memory.homeRoom === room.name && creep.memory.role === role
        );
        if (existingCreeps.length === 0) {
          return false;
        }
        const potentialBody = this.getOptimalCreepBody(role, room.energyCapacityAvailable, room);
        const potentialBodyCost = this.calculateBodyCost(potentialBody);
        const isSignificantlyBetter = potentialBody.length > currentBody.length;
        const canAffordBetter = potentialBodyCost <= room.energyCapacityAvailable;
        const notAtFullCapacity = room.energyAvailable < room.energyCapacityAvailable;
        const substantialImprovement = potentialBodyCost - currentBodyCost >= 100;
        if (!notAtFullCapacity) {
          return false;
        }
        return isSignificantlyBetter && canAffordBetter && substantialImprovement;
      }
      isEmergencySpawning(room, role) {
        const existingCreeps = Object.values(Game.creeps).filter(
          (creep) => creep.memory.homeRoom === room.name && creep.memory.role === role
        );
        switch (role) {
          case "harvester":
            const healthyHarvesters = existingCreeps.filter(
              (creep) => !creep.ticksToLive || creep.ticksToLive > 50
            );
            return healthyHarvesters.length === 0;
          case "upgrader":
            if (existingCreeps.length === 0 && room.controller) {
              const ticksToDowngrade = room.controller.ticksToDowngrade || 0;
              return ticksToDowngrade < 5e3;
            }
            return false;
          case "builder":
            if (existingCreeps.length === 0) {
              const criticalStructures = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                  const healthPercent = structure.hits / structure.hitsMax;
                  return healthPercent < 0.1 && structure.structureType !== STRUCTURE_WALL && (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_TOWER);
                }
              });
              return criticalStructures.length > 0;
            }
            return false;
          case "hauler":
            if (existingCreeps.length === 0) {
              const containers = room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) < 100
              });
              const emptySpawnStructures = room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
              });
              return containers.length > 0 && emptySpawnStructures.length > 0;
            }
            return false;
          case "scout":
            return false;
          default:
            return false;
        }
      }
      getOptimalCreepBody(role, energyCapacity, room) {
        const maxEnergy = Math.min(energyCapacity, 1300);
        switch (role) {
          case "harvester":
            return this.getHarvesterBody(maxEnergy, room);
          case "hauler":
            return this.getHaulerBody(maxEnergy, room);
          case "upgrader":
            return this.getUpgraderBody(maxEnergy, room);
          case "builder":
            return this.getBuilderBody(maxEnergy, room);
          case "scout":
            return this.getScoutBody(maxEnergy);
          default:
            return [];
        }
      }
      calculateBodyCost(body) {
        return body.reduce((cost, part) => {
          switch (part) {
            case WORK:
              return cost + 100;
            case CARRY:
              return cost + 50;
            case MOVE:
              return cost + 50;
            case ATTACK:
              return cost + 80;
            case RANGED_ATTACK:
              return cost + 150;
            case HEAL:
              return cost + 250;
            case CLAIM:
              return cost + 600;
            case TOUGH:
              return cost + 10;
            default:
              return cost;
          }
        }, 0);
      }
      calculateRepairWorkload(room) {
        const structures = room.find(FIND_STRUCTURES);
        let repairWorkload = 0;
        for (const structure of structures) {
          const healthPercent = structure.hits / structure.hitsMax;
          if (healthPercent < 0.1 && structure.structureType !== STRUCTURE_WALL) {
            repairWorkload += 5;
          } else if (structure.structureType === STRUCTURE_RAMPART && healthPercent < 0.8) {
            repairWorkload += 3;
          } else if (healthPercent < 0.8 && (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_TOWER || structure.structureType === STRUCTURE_STORAGE)) {
            repairWorkload += 2;
          } else if (healthPercent < 0.6 && (structure.structureType === STRUCTURE_ROAD || structure.structureType === STRUCTURE_CONTAINER)) {
            repairWorkload += 1;
          } else if (healthPercent < 0.8 && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART) {
            repairWorkload += 1;
          }
        }
        return repairWorkload;
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

// src/managers/StorageManager.ts
var StorageManager_exports = {};
__export(StorageManager_exports, {
  StorageManager: () => StorageManager
});
var StorageManager;
var init_StorageManager = __esm({
  "src/managers/StorageManager.ts"() {
    "use strict";
    init_Logger();
    StorageManager = class {
      /**
       * Main storage management execution for a room
       */
      static run(room) {
        try {
          if (room.controller && room.controller.level >= 4) {
            this.manageStorage(room);
            this.optimizeEnergyFlow(room);
          }
        } catch (error) {
          Logger.error(`StorageManager: Error in room ${room.name}: ${error}`);
        }
      }
      /**
       * Manages storage operations and maintenance
       */
      static manageStorage(room) {
        const storage = room.storage;
        if (!storage) {
          Logger.debug(`StorageManager: No storage found in room ${room.name}`);
          return;
        }
        if (!room.memory.storage) {
          room.memory.storage = {
            id: storage.id,
            lastUpdated: Game.time,
            energyLevel: storage.store.energy,
            capacity: storage.store.getCapacity(RESOURCE_ENERGY)
          };
          Logger.info(`StorageManager: Storage registered in room ${room.name}`);
        }
        room.memory.storage.energyLevel = storage.store.energy;
        room.memory.storage.lastUpdated = Game.time;
        if (Game.time % 100 === 0) {
          const fillPercent = Math.round(storage.store.energy / storage.store.getCapacity(RESOURCE_ENERGY) * 100);
          Logger.info(`StorageManager: Room ${room.name} storage at ${fillPercent}% (${storage.store.energy}/${storage.store.getCapacity(RESOURCE_ENERGY)})`);
        }
      }
      /**
       * Optimizes energy flow between storage and other structures
       */
      static optimizeEnergyFlow(room) {
        const storage = room.storage;
        if (!storage) return;
        const energyLevel = storage.store.energy;
        const capacity = storage.store.getCapacity(RESOURCE_ENERGY);
        const fillPercent = energyLevel / capacity;
        if (!room.memory.energyStrategy) {
          room.memory.energyStrategy = {
            mode: "balanced",
            lastUpdated: Game.time
          };
        }
        let newMode = "balanced";
        if (fillPercent > 0.8) {
          newMode = "distribute";
        } else if (fillPercent < 0.2) {
          newMode = "collect";
        }
        if (room.memory.energyStrategy.mode !== newMode) {
          room.memory.energyStrategy.mode = newMode;
          room.memory.energyStrategy.lastUpdated = Game.time;
          Logger.info(`StorageManager: Room ${room.name} energy strategy changed to ${newMode} (${Math.round(fillPercent * 100)}% full)`);
        }
      }
      /**
       * Gets the current energy strategy for a room
       */
      static getEnergyStrategy(room) {
        return room.memory.energyStrategy && room.memory.energyStrategy.mode || "balanced";
      }
      /**
       * Determines if storage should be prioritized for energy collection
       */
      static shouldPrioritizeStorage(room) {
        const strategy = this.getEnergyStrategy(room);
        return strategy === "distribute";
      }
      /**
       * Determines if containers should be prioritized over storage
       */
      static shouldPrioritizeContainers(room) {
        const strategy = this.getEnergyStrategy(room);
        return strategy === "collect";
      }
      /**
       * Gets optimal energy targets for haulers based on current strategy
       */
      static getOptimalEnergyTargets(room) {
        const strategy = this.getEnergyStrategy(room);
        const targets = [];
        const spawns = room.find(FIND_MY_SPAWNS);
        const extensions = room.find(FIND_MY_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_EXTENSION
        });
        targets.push(...spawns, ...extensions);
        const towers = room.find(FIND_MY_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_TOWER
        });
        targets.push(...towers);
        if (room.storage && strategy !== "collect") {
          targets.push(room.storage);
        }
        return targets.filter((target) => {
          try {
            const structureWithStore = target;
            return structureWithStore.store && structureWithStore.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          } catch {
            return false;
          }
        });
      }
      /**
       * Gets optimal energy sources for haulers based on current strategy
       * FIXED: Excludes controller containers - haulers should only deliver to them, not collect from them
       */
      static getOptimalEnergySources(room) {
        const strategy = this.getEnergyStrategy(room);
        const sources = [];
        const containers = room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            if (structure.structureType !== STRUCTURE_CONTAINER || structure.store.energy === 0) {
              return false;
            }
            if (room.controller) {
              const distanceToController = structure.pos.getRangeTo(room.controller);
              if (distanceToController <= 3) {
                return false;
              }
            }
            return true;
          }
        });
        sources.push(...containers);
        if (room.storage && strategy !== "collect" && room.storage.store.energy > 0) {
          sources.push(room.storage);
        }
        const droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
          filter: (resource) => resource.resourceType === RESOURCE_ENERGY
        });
        sources.push(...droppedEnergy);
        return sources;
      }
      /**
       * Calculates storage efficiency metrics
       */
      static getStorageMetrics(room) {
        const storage = room.storage;
        if (!storage) return null;
        const energyLevel = storage.store.energy;
        const capacity = storage.store.getCapacity(RESOURCE_ENERGY);
        const fillPercent = energyLevel / capacity;
        return {
          energyLevel,
          capacity,
          fillPercent,
          strategy: this.getEnergyStrategy(room),
          lastUpdated: room.memory.storage && room.memory.storage.lastUpdated || Game.time
        };
      }
    };
  }
});

// src/managers/StructureReplacementManager.ts
var StructureReplacementManager_exports = {};
__export(StructureReplacementManager_exports, {
  StructureReplacementManager: () => StructureReplacementManager
});
var StructureReplacementManager;
var init_StructureReplacementManager = __esm({
  "src/managers/StructureReplacementManager.ts"() {
    "use strict";
    init_Logger();
    StructureReplacementManager = class {
      /**
       * Check for missing structures that should be rebuilt and add them to the room plan
       */
      static checkAndReplaceDecayedStructures(room) {
        try {
          const roomMemory = Memory.rooms[room.name];
          if (!roomMemory || !roomMemory.plan) {
            return;
          }
          const plan = roomMemory.plan;
          const missingStructures = this.findMissingStructures(room, plan);
          if (missingStructures.length > 0) {
            Logger.warn(`Found ${missingStructures.length} missing structures in room ${room.name}`, "StructureReplacement");
            for (const missing of missingStructures) {
              const existingPlan = plan.buildings.find(
                (building) => building.pos.x === missing.pos.x && building.pos.y === missing.pos.y && building.structureType === missing.structureType
              );
              if (existingPlan) {
                if (existingPlan.placed) {
                  existingPlan.placed = false;
                  Logger.info(`Marked ${missing.structureType} at ${missing.pos.x},${missing.pos.y} for rebuilding`, "StructureReplacement");
                }
              } else {
                plan.buildings.push({
                  structureType: missing.structureType,
                  pos: missing.pos,
                  priority: this.getStructurePriority(missing.structureType),
                  rclRequired: this.getMinRCLForStructure(missing.structureType),
                  placed: false,
                  reason: "Structure decayed and needs rebuilding"
                });
                Logger.info(`Added missing ${missing.structureType} at ${missing.pos.x},${missing.pos.y} to rebuild plan`, "StructureReplacement");
              }
            }
            plan.lastUpdated = Game.time;
          }
          this.checkAndReplaceMissingRoads(room, plan);
        } catch (error) {
          Logger.error(`Error checking for decayed structures in room ${room.name}: ${error}`, "StructureReplacement");
        }
      }
      static findMissingStructures(room, plan) {
        const missingStructures = [];
        const rcl = room.controller ? room.controller.level : 0;
        const existingStructures = room.find(FIND_STRUCTURES);
        const existingStructureMap = /* @__PURE__ */ new Map();
        for (const structure of existingStructures) {
          const key = `${structure.pos.x},${structure.pos.y},${structure.structureType}`;
          existingStructureMap.set(key, structure);
        }
        for (const building of plan.buildings) {
          if (building.rclRequired <= rcl && building.placed) {
            const key = `${building.pos.x},${building.pos.y},${building.structureType}`;
            if (!existingStructureMap.has(key)) {
              missingStructures.push({
                structureType: building.structureType,
                pos: new RoomPosition(building.pos.x, building.pos.y, room.name)
              });
            }
          }
        }
        return missingStructures;
      }
      static checkAndReplaceMissingRoads(room, plan) {
        if (!plan.roads) {
          return;
        }
        const existingRoads = room.find(FIND_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_ROAD
        });
        const existingRoadMap = /* @__PURE__ */ new Map();
        for (const road of existingRoads) {
          const key = `${road.pos.x},${road.pos.y}`;
          existingRoadMap.set(key, road);
        }
        let missingRoadCount = 0;
        for (const road of plan.roads) {
          if (road.placed) {
            const key = `${road.pos.x},${road.pos.y}`;
            if (!existingRoadMap.has(key)) {
              road.placed = false;
              missingRoadCount++;
            }
          }
        }
        if (missingRoadCount > 0) {
          Logger.warn(`Found ${missingRoadCount} missing roads in room ${room.name} - marked for rebuilding`, "StructureReplacement");
          plan.lastUpdated = Game.time;
        }
      }
      static getStructurePriority(structureType) {
        switch (structureType) {
          case STRUCTURE_SPAWN:
            return 100;
          case STRUCTURE_EXTENSION:
            return 80;
          case STRUCTURE_TOWER:
            return 85;
          case STRUCTURE_STORAGE:
            return 70;
          case STRUCTURE_CONTAINER:
            return 60;
          case STRUCTURE_LINK:
            return 65;
          case STRUCTURE_EXTRACTOR:
            return 50;
          case STRUCTURE_LAB:
            return 55;
          case STRUCTURE_TERMINAL:
            return 75;
          case STRUCTURE_FACTORY:
            return 45;
          case STRUCTURE_NUKER:
            return 40;
          case STRUCTURE_OBSERVER:
            return 35;
          case STRUCTURE_POWER_SPAWN:
            return 30;
          default:
            return 25;
        }
      }
      static getMinRCLForStructure(structureType) {
        switch (structureType) {
          case STRUCTURE_SPAWN:
            return 1;
          case STRUCTURE_EXTENSION:
            return 2;
          case STRUCTURE_RAMPART:
            return 2;
          case STRUCTURE_WALL:
            return 2;
          case STRUCTURE_ROAD:
            return 3;
          case STRUCTURE_TOWER:
            return 3;
          case STRUCTURE_CONTAINER:
            return 3;
          case STRUCTURE_STORAGE:
            return 4;
          case STRUCTURE_LINK:
            return 5;
          case STRUCTURE_EXTRACTOR:
            return 6;
          case STRUCTURE_LAB:
            return 6;
          case STRUCTURE_TERMINAL:
            return 6;
          case STRUCTURE_FACTORY:
            return 7;
          case STRUCTURE_NUKER:
            return 8;
          case STRUCTURE_OBSERVER:
            return 8;
          case STRUCTURE_POWER_SPAWN:
            return 8;
          default:
            return 1;
        }
      }
    };
  }
});

// src/tasks/TaskBuild.ts
var TaskBuild_exports = {};
__export(TaskBuild_exports, {
  TaskBuild: () => TaskBuild
});
var TaskBuild;
var init_TaskBuild = __esm({
  "src/tasks/TaskBuild.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskBuild = class _TaskBuild extends Task {
      constructor(target, priority = 5) {
        super("build", target, priority);
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        return target !== null && target instanceof ConstructionSite;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskBuild: Target construction site no longer exists for creep ${creep.name}`, "TaskBuild");
          return false;
        }
        if (creep.store[RESOURCE_ENERGY] === 0) {
          Logger.debug(`TaskBuild: Creep ${creep.name} has no energy for building`, "TaskBuild");
          return false;
        }
        const result = creep.build(target);
        switch (result) {
          case OK:
            creep.say("\u{1F6A7} build");
            return true;
          // Continue building
          case ERR_NOT_IN_RANGE:
            this.moveToTarget(creep, 3);
            return true;
          // Continue task
          case ERR_NOT_ENOUGH_RESOURCES:
            Logger.debug(`TaskBuild: Creep ${creep.name} ran out of energy while building`, "TaskBuild");
            return false;
          // Task complete (no energy)
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskBuild: Construction site no longer valid for creep ${creep.name}`, "TaskBuild");
            return false;
          // Task complete (invalid target)
          default:
            Logger.warn(`TaskBuild: Unexpected build result ${result} for creep ${creep.name}`, "TaskBuild");
            return false;
        }
      }
      getPathColor() {
        return "#ffffff";
      }
      /**
       * Create a TaskBuild from the highest priority construction site
       */
      static createFromRoom(creep) {
        const room = creep.room;
        const roomMemory = Memory.rooms[room.name];
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length === 0) {
          return null;
        }
        if (!roomMemory || !roomMemory.plan) {
          const closest = creep.pos.findClosestByPath(constructionSites);
          return closest ? new _TaskBuild(closest, 5) : null;
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
            return new _TaskBuild(item.site, item.priority);
          }
        }
        if (sitesWithPriority.length > 0 && sitesWithPriority[0]) {
          return new _TaskBuild(sitesWithPriority[0].site, sitesWithPriority[0].priority);
        }
        return null;
      }
    };
  }
});

// src/tasks/TaskRepair.ts
var TaskRepair_exports = {};
__export(TaskRepair_exports, {
  TaskRepair: () => TaskRepair
});
var TaskRepair;
var init_TaskRepair = __esm({
  "src/tasks/TaskRepair.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    init_settings();
    TaskRepair = class _TaskRepair extends Task {
      constructor(target, priority = 5) {
        super("repair", target, priority);
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        if (!target || !(target instanceof Structure)) {
          return false;
        }
        return target.hits < target.hitsMax;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskRepair: Target structure no longer exists for creep ${creep.name}`, "TaskRepair");
          return false;
        }
        if (target.hits >= target.hitsMax) {
          Logger.debug(`TaskRepair: Structure fully repaired for creep ${creep.name}`, "TaskRepair");
          return false;
        }
        if (creep.store[RESOURCE_ENERGY] === 0) {
          Logger.debug(`TaskRepair: Creep ${creep.name} has no energy for repairing`, "TaskRepair");
          return false;
        }
        const result = creep.repair(target);
        switch (result) {
          case OK:
            creep.say("\u{1F527} repair");
            return true;
          // Continue repairing
          case ERR_NOT_IN_RANGE:
            this.moveToTarget(creep, 3);
            return true;
          // Continue task
          case ERR_NOT_ENOUGH_RESOURCES:
            Logger.debug(`TaskRepair: Creep ${creep.name} ran out of energy while repairing`, "TaskRepair");
            return false;
          // Task complete (no energy)
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskRepair: Structure no longer valid for repair by creep ${creep.name}`, "TaskRepair");
            return false;
          // Task complete (invalid target)
          default:
            Logger.warn(`TaskRepair: Unexpected repair result ${result} for creep ${creep.name}`, "TaskRepair");
            return false;
        }
      }
      getPathColor() {
        return "#ffff00";
      }
      /**
       * Create a TaskRepair from the highest priority damaged structure
       */
      static createFromRoom(creep) {
        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.hits < structure.hitsMax * Settings.room.emergencyRepairThreshold && structure.structureType !== STRUCTURE_WALL;
          }
        });
        if (target) {
          return new _TaskRepair(target, 10);
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_RAMPART && structure.hits < structure.hitsMax * Settings.room.rampartRepairThreshold;
          }
        });
        if (target) {
          return new _TaskRepair(target, 8);
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.hits < structure.hitsMax * Settings.room.repairThreshold && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART && (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_TOWER || structure.structureType === STRUCTURE_STORAGE);
          }
        });
        if (target) {
          return new _TaskRepair(target, 6);
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType === STRUCTURE_ROAD || structure.structureType === STRUCTURE_CONTAINER) && structure.hits < structure.hitsMax * Settings.room.roadRepairThreshold;
          }
        });
        if (target) {
          return new _TaskRepair(target, 4);
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.hits < structure.hitsMax * Settings.room.repairThreshold && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART;
          }
        });
        if (target) {
          return new _TaskRepair(target, 2);
        }
        return null;
      }
    };
  }
});

// src/tasks/TaskWithdraw.ts
var TaskWithdraw_exports = {};
__export(TaskWithdraw_exports, {
  TaskWithdraw: () => TaskWithdraw
});
var TaskWithdraw;
var init_TaskWithdraw = __esm({
  "src/tasks/TaskWithdraw.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskWithdraw = class _TaskWithdraw extends Task {
      constructor(target, resourceType = RESOURCE_ENERGY, amount, priority = 5) {
        super("withdraw", target, priority);
        this.resourceType = resourceType;
        this.data["resourceType"] = resourceType;
        if (amount !== void 0) {
          this.data["amount"] = amount;
        }
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        if (!target || !(target instanceof Structure)) {
          return false;
        }
        const store = target.store;
        if (!store) {
          return false;
        }
        return store[this.resourceType] > 0;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskWithdraw: Target structure no longer exists for creep ${creep.name}`, "TaskWithdraw");
          return false;
        }
        if (creep.store.getFreeCapacity(this.resourceType) === 0) {
          Logger.debug(`TaskWithdraw: Creep ${creep.name} is full, cannot withdraw more ${this.resourceType}`, "TaskWithdraw");
          return false;
        }
        const store = target.store;
        if (!store || store[this.resourceType] === 0) {
          Logger.debug(`TaskWithdraw: Target has no ${this.resourceType} for creep ${creep.name}`, "TaskWithdraw");
          return false;
        }
        const result = creep.withdraw(target, this.resourceType, this.amount);
        switch (result) {
          case OK:
            creep.say("\u26A1 withdraw");
            if (creep.store.getFreeCapacity(this.resourceType) === 0) {
              return false;
            }
            return true;
          // Continue withdrawing
          case ERR_NOT_IN_RANGE:
            this.moveToTarget(creep, 1);
            return true;
          // Continue task
          case ERR_NOT_ENOUGH_RESOURCES:
            Logger.debug(`TaskWithdraw: Target ran out of ${this.resourceType} for creep ${creep.name}`, "TaskWithdraw");
            return false;
          // Task complete (no more resources)
          case ERR_FULL:
            Logger.debug(`TaskWithdraw: Creep ${creep.name} is full of ${this.resourceType}`, "TaskWithdraw");
            return false;
          // Task complete (creep full)
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskWithdraw: Invalid target for creep ${creep.name}`, "TaskWithdraw");
            return false;
          // Task complete (invalid target)
          default:
            Logger.warn(`TaskWithdraw: Unexpected withdraw result ${result} for creep ${creep.name}`, "TaskWithdraw");
            return false;
        }
      }
      getPathColor() {
        return "#ffaa00";
      }
      /**
       * Create a TaskWithdraw from the best available energy source
       */
      static createEnergyWithdraw(creep) {
        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
          }
        });
        if (target) {
          return new _TaskWithdraw(target, RESOURCE_ENERGY, void 0, 8);
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0;
          }
        });
        if (target) {
          return new _TaskWithdraw(target, RESOURCE_ENERGY, void 0, 6);
        }
        target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_LINK && structure.store[RESOURCE_ENERGY] > 0;
          }
        });
        if (target) {
          return new _TaskWithdraw(target, RESOURCE_ENERGY, void 0, 4);
        }
        return null;
      }
      /**
       * Create a TaskWithdraw for a specific resource type from the best source
       */
      static createResourceWithdraw(creep, resourceType) {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: (structure) => {
            const store = structure.store;
            return store && store[resourceType] > 0;
          }
        });
        if (target) {
          return new _TaskWithdraw(target, resourceType, void 0, 5);
        }
        return null;
      }
    };
  }
});

// src/tasks/TaskPickup.ts
var TaskPickup_exports = {};
__export(TaskPickup_exports, {
  TaskPickup: () => TaskPickup
});
var TaskPickup;
var init_TaskPickup = __esm({
  "src/tasks/TaskPickup.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskPickup = class _TaskPickup extends Task {
      constructor(target, resourceType = RESOURCE_ENERGY, amount, priority = 9) {
        super("pickup", target, priority);
        this.resourceType = resourceType;
        this.data["resourceType"] = resourceType;
        if (amount !== void 0) {
          this.data["amount"] = amount;
        }
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        if (!target || !(target instanceof Resource)) {
          return false;
        }
        return target.resourceType === this.resourceType && target.amount > 0;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskPickup: Target resource no longer exists for creep ${creep.name}`, "TaskPickup");
          return false;
        }
        if (creep.store.getFreeCapacity(this.resourceType) === 0) {
          Logger.debug(`TaskPickup: Creep ${creep.name} is full, cannot pickup more ${this.resourceType}`, "TaskPickup");
          return false;
        }
        if (target.amount === 0 || target.resourceType !== this.resourceType) {
          Logger.debug(`TaskPickup: Target no longer has ${this.resourceType} for creep ${creep.name}`, "TaskPickup");
          return false;
        }
        const result = creep.pickup(target);
        switch (result) {
          case OK:
            creep.say("\u{1F50B} pickup");
            return false;
          // Task complete (pickup successful)
          case ERR_NOT_IN_RANGE:
            this.moveToTarget(creep, 1);
            return true;
          // Continue task
          case ERR_FULL:
            Logger.debug(`TaskPickup: Creep ${creep.name} is full of ${this.resourceType}`, "TaskPickup");
            return false;
          // Task complete (creep full)
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskPickup: Invalid target for creep ${creep.name}`, "TaskPickup");
            return false;
          // Task complete (invalid target)
          default:
            Logger.debug(`TaskPickup: Pickup failed with result ${result} for creep ${creep.name}`, "TaskPickup");
            return false;
        }
      }
      getPathColor() {
        return "#00ff00";
      }
      /**
       * Create a TaskPickup from the best available dropped energy
       */
      static createEnergyPickup(creep) {
        const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: (resource) => {
            return resource.resourceType === RESOURCE_ENERGY && resource.amount >= 50;
          }
        });
        if (target) {
          return new _TaskPickup(target, RESOURCE_ENERGY, void 0, 9);
        }
        return null;
      }
      /**
       * Create a TaskPickup for a specific resource type
       */
      static createResourcePickup(creep, resourceType, minAmount = 10) {
        const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: (resource) => {
            return resource.resourceType === resourceType && resource.amount >= minAmount;
          }
        });
        if (target) {
          return new _TaskPickup(target, resourceType, void 0, 7);
        }
        return null;
      }
      /**
       * Create a TaskPickup for any dropped resource (useful for general cleanup)
       */
      static createAnyResourcePickup(creep, minAmount = 10) {
        const target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
          filter: (resource) => resource.amount >= minAmount
        });
        if (target) {
          return new _TaskPickup(target, target.resourceType, void 0, 6);
        }
        return null;
      }
    };
  }
});

// src/tasks/TaskTransfer.ts
var TaskTransfer_exports = {};
__export(TaskTransfer_exports, {
  TaskTransfer: () => TaskTransfer
});
var TaskTransfer;
var init_TaskTransfer = __esm({
  "src/tasks/TaskTransfer.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskTransfer = class _TaskTransfer extends Task {
      constructor(target, resourceType = RESOURCE_ENERGY, amount, priority = 5) {
        super("transfer", target, priority);
        this.resourceType = resourceType;
        this.data["resourceType"] = resourceType;
        if (amount !== void 0) {
          this.data["amount"] = amount;
        }
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        if (!target || !(target instanceof Structure)) {
          return false;
        }
        const store = target.store;
        if (!store) {
          return false;
        }
        return store.getFreeCapacity(this.resourceType) > 0;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskTransfer: Target structure no longer exists for creep ${creep.name}`, "TaskTransfer");
          return false;
        }
        if (creep.store[this.resourceType] === 0) {
          Logger.debug(`TaskTransfer: Creep ${creep.name} has no ${this.resourceType} to transfer`, "TaskTransfer");
          return false;
        }
        const store = target.store;
        if (!store || store.getFreeCapacity(this.resourceType) === 0) {
          Logger.debug(`TaskTransfer: Target has no capacity for ${this.resourceType} from creep ${creep.name}`, "TaskTransfer");
          return false;
        }
        const result = creep.transfer(target, this.resourceType, this.amount);
        switch (result) {
          case OK:
            creep.say("\u{1F69A} transfer");
            if (creep.store[this.resourceType] === 0) {
              return false;
            }
            return true;
          // Continue transferring
          case ERR_NOT_IN_RANGE:
            this.moveToTarget(creep, 1);
            return true;
          // Continue task
          case ERR_NOT_ENOUGH_RESOURCES:
            Logger.debug(`TaskTransfer: Creep ${creep.name} ran out of ${this.resourceType}`, "TaskTransfer");
            return false;
          // Task complete (no more resources)
          case ERR_FULL:
            Logger.debug(`TaskTransfer: Target is full, cannot accept more ${this.resourceType} from creep ${creep.name}`, "TaskTransfer");
            return false;
          // Task complete (target full)
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskTransfer: Invalid target for creep ${creep.name}`, "TaskTransfer");
            return false;
          // Task complete (invalid target)
          default:
            Logger.debug(`TaskTransfer: Transfer failed with result ${result} for creep ${creep.name}`, "TaskTransfer");
            return false;
        }
      }
      getPathColor() {
        return "#ffffff";
      }
      /**
       * Create a TaskTransfer for energy delivery with priority-based targeting
       * Matches the existing Hauler priority system
       */
      static createEnergyTransfer(creep) {
        let target = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
          filter: (spawn) => spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (target) {
          return new _TaskTransfer(target, RESOURCE_ENERGY, void 0, 10);
        }
        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        if (target) {
          return new _TaskTransfer(target, RESOURCE_ENERGY, void 0, 9);
        }
        if (creep.room.controller) {
          const controllerContainers = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
          });
          if (controllerContainers.length > 0 && controllerContainers[0]) {
            return new _TaskTransfer(controllerContainers[0], RESOURCE_ENERGY, void 0, 8);
          }
        }
        target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        if (target) {
          return new _TaskTransfer(target, RESOURCE_ENERGY, void 0, 7);
        }
        if (creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          return new _TaskTransfer(creep.room.storage, RESOURCE_ENERGY, void 0, 6);
        }
        return null;
      }
      /**
       * Create a TaskTransfer for a specific resource type to the best target
       */
      static createResourceTransfer(creep, resourceType) {
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
          filter: (structure) => {
            const store = structure.store;
            return store && store.getFreeCapacity(resourceType) > 0;
          }
        });
        if (target) {
          return new _TaskTransfer(target, resourceType, void 0, 5);
        }
        return null;
      }
      /**
       * Create a TaskTransfer to a specific target structure
       */
      static createSpecificTransfer(target, resourceType = RESOURCE_ENERGY, amount, priority = 5) {
        return new _TaskTransfer(target, resourceType, amount, priority);
      }
    };
  }
});

// src/tasks/TaskHarvest.ts
var TaskHarvest_exports = {};
__export(TaskHarvest_exports, {
  TaskHarvest: () => TaskHarvest
});
var TaskHarvest;
var init_TaskHarvest = __esm({
  "src/tasks/TaskHarvest.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskHarvest = class _TaskHarvest extends Task {
      constructor(target = null, priority = 5) {
        super("harvest", target, priority);
        if (target) {
          this.data["sourceId"] = target.id;
        }
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        if (!target || !(target instanceof Source)) {
          return false;
        }
        return target.energy > 0;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskHarvest: Source no longer exists for creep ${creep.name}`, "TaskHarvest");
          return false;
        }
        if (target.energy === 0) {
          creep.say("\u23F3 wait");
          return true;
        }
        if (creep.store.getFreeCapacity() === 0) {
          Logger.debug(`TaskHarvest: Creep ${creep.name} is full`, "TaskHarvest");
          return false;
        }
        const result = creep.harvest(target);
        switch (result) {
          case OK:
            creep.say("\u26CF\uFE0F mine");
            const rcl = creep.room.controller ? creep.room.controller.level : 1;
            if (rcl >= 3 && creep.store[RESOURCE_ENERGY] > 0) {
              this.handleStationaryMinerOutput(creep);
            }
            return true;
          case ERR_NOT_IN_RANGE:
            this.moveToHarvestPosition(creep, target);
            return true;
          // Continue task
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.say("\u23F3 wait");
            return true;
          // Continue task
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskHarvest: Invalid source target for creep ${creep.name}`, "TaskHarvest");
            return false;
          // Task complete (invalid target)
          default:
            Logger.debug(`TaskHarvest: Harvest failed with result ${result} for creep ${creep.name}`, "TaskHarvest");
            return false;
        }
      }
      getPathColor() {
        return "#ffaa00";
      }
      /**
       * Handle output for stationary miners (RCL 3+)
       * Fill nearby containers or drop energy for haulers
       */
      handleStationaryMinerOutput(creep) {
        const nearbyContainer = creep.pos.findInRange(FIND_STRUCTURES, 2, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        })[0];
        if (nearbyContainer) {
          const transferResult = creep.transfer(nearbyContainer, RESOURCE_ENERGY);
          if (transferResult === OK) {
            creep.say("\u{1F4E6} fill");
          }
        } else {
          if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.8) {
            creep.drop(RESOURCE_ENERGY);
            creep.say("\u{1F48E} drop");
          }
        }
      }
      /**
       * Move to optimal harvest position
       * For RCL 3+, find best adjacent position for stationary mining
       */
      moveToHarvestPosition(creep, source) {
        const rcl = creep.room.controller ? creep.room.controller.level : 1;
        if (rcl >= 3) {
          const bestPosition = this.findBestAdjacentPosition(creep, source);
          if (bestPosition) {
            creep.moveTo(bestPosition, {
              visualizePathStyle: { stroke: "#ffaa00" },
              ignoreCreeps: false,
              reusePath: 5
            });
          } else {
            creep.moveTo(source, {
              visualizePathStyle: { stroke: "#ff0000" },
              ignoreCreeps: true,
              reusePath: 1
            });
            creep.say("\u{1F6AB} blocked");
          }
        } else {
          creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
        }
      }
      /**
       * Find the best adjacent position to a source for stationary mining
       */
      findBestAdjacentPosition(creep, source) {
        const adjacentPositions = this.getAdjacentPositions(source.pos);
        let bestPosition = null;
        let shortestDistance = Infinity;
        for (const pos of adjacentPositions) {
          const terrain = Game.map.getRoomTerrain(pos.roomName);
          if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
            continue;
          }
          const structures = pos.lookFor(LOOK_STRUCTURES);
          const isBlocked = structures.some(
            (structure) => structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER
          );
          if (isBlocked) {
            continue;
          }
          const creeps = pos.lookFor(LOOK_CREEPS);
          if (creeps.length > 0 && creeps[0] && creeps[0].id !== creep.id) {
            continue;
          }
          const distance = creep.pos.getRangeTo(pos);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            bestPosition = pos;
          }
        }
        return bestPosition;
      }
      /**
       * Get all adjacent positions around a given position
       */
      getAdjacentPositions(pos) {
        const positions = [];
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const x = pos.x + dx;
            const y = pos.y + dy;
            if (x >= 0 && x <= 49 && y >= 0 && y <= 49) {
              positions.push(new RoomPosition(x, y, pos.roomName));
            }
          }
        }
        return positions;
      }
      /**
       * Create a TaskHarvest for the best available source
       */
      static createFromRoom(creep) {
        if (creep.memory.assignedSource) {
          const assignedSource = Game.getObjectById(creep.memory.assignedSource);
          if (assignedSource && assignedSource.energy > 0) {
            return new _TaskHarvest(assignedSource, 5);
          } else {
            delete creep.memory.assignedSource;
          }
        }
        const sources = creep.room.find(FIND_SOURCES, {
          filter: (source) => source.energy > 0
        });
        if (sources.length === 0) {
          return null;
        }
        const rcl = creep.room.controller ? creep.room.controller.level : 1;
        if (rcl >= 3 && creep.memory.role === "harvester") {
          const bestSource = this.assignSourceToHarvester(creep, sources);
          if (bestSource) {
            creep.memory.assignedSource = bestSource.id;
            return new _TaskHarvest(bestSource, 5);
          }
        }
        const closestSource = creep.pos.findClosestByPath(sources);
        if (closestSource) {
          return new _TaskHarvest(closestSource, 5);
        }
        return null;
      }
      /**
       * Assign a source to a harvester for stationary mining
       */
      static assignSourceToHarvester(creep, sources) {
        let bestSource = null;
        let minHarvesters = Infinity;
        for (const source of sources) {
          const assignedHarvesters = Object.values(Game.creeps).filter(
            (c) => c.memory.role === "harvester" && c.memory.homeRoom === creep.room.name && c.memory.assignedSource === source.id
          ).length;
          if (assignedHarvesters < minHarvesters) {
            minHarvesters = assignedHarvesters;
            bestSource = source;
          }
        }
        return bestSource;
      }
    };
  }
});

// src/tasks/TaskUpgrade.ts
var TaskUpgrade_exports = {};
__export(TaskUpgrade_exports, {
  TaskUpgrade: () => TaskUpgrade
});
var TaskUpgrade;
var init_TaskUpgrade = __esm({
  "src/tasks/TaskUpgrade.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskUpgrade = class _TaskUpgrade extends Task {
      constructor(target = null, priority = 5) {
        super("upgrade", target, priority);
      }
      isValidTask() {
        return true;
      }
      isValidTarget() {
        const target = this.getTarget();
        if (!target || !(target instanceof StructureController)) {
          return false;
        }
        return target.my === true;
      }
      work(creep) {
        const target = this.getTarget();
        if (!target) {
          Logger.debug(`TaskUpgrade: Controller no longer exists for creep ${creep.name}`, "TaskUpgrade");
          return false;
        }
        if (creep.store[RESOURCE_ENERGY] === 0) {
          Logger.debug(`TaskUpgrade: Creep ${creep.name} has no energy to upgrade`, "TaskUpgrade");
          return false;
        }
        const result = creep.upgradeController(target);
        switch (result) {
          case OK:
            creep.say("\u26A1 upgrade");
            return true;
          case ERR_NOT_IN_RANGE:
            this.moveToTarget(creep, 3);
            return true;
          // Continue task
          case ERR_NOT_ENOUGH_RESOURCES:
            Logger.debug(`TaskUpgrade: Creep ${creep.name} ran out of energy`, "TaskUpgrade");
            return false;
          // Task complete (no more energy)
          case ERR_INVALID_TARGET:
            Logger.debug(`TaskUpgrade: Invalid controller target for creep ${creep.name}`, "TaskUpgrade");
            return false;
          // Task complete (invalid target)
          default:
            Logger.debug(`TaskUpgrade: Upgrade failed with result ${result} for creep ${creep.name}`, "TaskUpgrade");
            return false;
        }
      }
      getPathColor() {
        return "#ffffff";
      }
      /**
       * Create a TaskUpgrade for the room's controller
       */
      static createFromRoom(creep) {
        if (!creep.room.controller || !creep.room.controller.my) {
          return null;
        }
        return new _TaskUpgrade(creep.room.controller, 5);
      }
    };
  }
});

// src/tasks/TaskGoToRoom.ts
var TaskGoToRoom_exports = {};
__export(TaskGoToRoom_exports, {
  TaskGoToRoom: () => TaskGoToRoom
});
var TaskGoToRoom;
var init_TaskGoToRoom = __esm({
  "src/tasks/TaskGoToRoom.ts"() {
    "use strict";
    init_Task();
    init_Logger();
    TaskGoToRoom = class _TaskGoToRoom extends Task {
      constructor(targetRoomName, priority = 3) {
        super("goToRoom", null, priority);
        this.targetRoomName = targetRoomName;
        this.data["targetRoomName"] = targetRoomName;
      }
      isValidTask() {
        const roomStatus = Game.map.getRoomStatus(this.targetRoomName);
        return roomStatus.status === "normal";
      }
      isValidTarget() {
        return true;
      }
      work(creep) {
        if (creep.room.name === this.targetRoomName) {
          return false;
        }
        const exitDir = creep.room.findExitTo(this.targetRoomName);
        if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
          Logger.warn(`TaskGoToRoom: No path from ${creep.room.name} to ${this.targetRoomName}`);
          return false;
        }
        const exit = creep.pos.findClosestByPath(exitDir);
        if (exit) {
          creep.moveTo(exit, { visualizePathStyle: { stroke: "#00ff00" } });
          return true;
        }
        return false;
      }
      finish() {
        Logger.info(`TaskGoToRoom: Reached ${this.targetRoomName}`);
      }
      // Static factory method
      static create(targetRoomName, priority = 3) {
        return new _TaskGoToRoom(targetRoomName, priority);
      }
    };
  }
});

// src/tasks/Task.ts
var Task;
var init_Task = __esm({
  "src/tasks/Task.ts"() {
    "use strict";
    init_Logger();
    Task = class _Task {
      constructor(taskType, target, priority = 5) {
        this.parent = null;
        this.fork = null;
        this.data = {};
        this.taskType = taskType;
        this.target = target ? target.id : null;
        this.targetPos = target ? target.pos : null;
        this.priority = priority;
      }
      /**
       * Called when the task is completed or cancelled
       */
      finish() {
      }
      /**
       * Get the target object from its ID
       */
      getTarget() {
        if (!this.target) return null;
        return Game.getObjectById(this.target);
      }
      /**
       * Move creep to target position
       */
      moveToTarget(creep, range = 1) {
        const target = this.getTarget();
        if (target) {
          return creep.moveTo(target, {
            visualizePathStyle: { stroke: this.getPathColor() },
            range
          });
        } else if (this.targetPos) {
          return creep.moveTo(this.targetPos, {
            visualizePathStyle: { stroke: this.getPathColor() },
            range
          });
        }
        return ERR_INVALID_TARGET;
      }
      /**
       * Get the color for path visualization
       */
      getPathColor() {
        return "#ffffff";
      }
      /**
       * Chain another task to execute after this one
       */
      then(nextTask) {
        this.parent = nextTask;
        return nextTask;
      }
      /**
       * Fork a task to execute in parallel
       */
      forkTask(forkTask) {
        this.fork = forkTask;
        return this;
      }
      /**
       * Serialize task for memory storage
       */
      serialize() {
        return {
          taskType: this.taskType,
          target: this.target,
          targetPos: this.targetPos ? {
            x: this.targetPos.x,
            y: this.targetPos.y,
            roomName: this.targetPos.roomName
          } : null,
          priority: this.priority,
          data: this.data,
          parent: this.parent ? this.parent.serialize() : null,
          fork: this.fork ? this.fork.serialize() : null
        };
      }
      /**
       * Deserialize task from memory
       */
      static deserialize(memory) {
        var _a, _b;
        try {
          const TaskClass = this.getTaskClass(memory.taskType);
          if (!TaskClass) {
            Logger.warn(`Unknown task type: ${memory.taskType}`, "Task");
            return null;
          }
          const target = memory.target ? Game.getObjectById(memory.target) : null;
          let task;
          if (memory.taskType === "goToRoom") {
            const targetRoomName = ((_a = memory.data) == null ? void 0 : _a["targetRoomName"]) || "W1N1";
            task = new TaskClass(targetRoomName, memory.priority);
          } else {
            task = new TaskClass(target, memory.priority);
          }
          task.taskType = memory.taskType;
          task.target = memory.target;
          task.targetPos = memory.targetPos ? new RoomPosition(memory.targetPos.x, memory.targetPos.y, memory.targetPos.roomName) : null;
          task.priority = memory.priority;
          task.data = memory.data || {};
          if (memory.taskType === "goToRoom" && ((_b = memory.data) == null ? void 0 : _b["targetRoomName"])) {
            task.targetRoomName = memory.data["targetRoomName"];
          }
          if (memory.parent) {
            task.parent = _Task.deserialize(memory.parent);
          }
          if (memory.fork) {
            task.fork = _Task.deserialize(memory.fork);
          }
          return task;
        } catch (error) {
          Logger.error(`Error deserializing task: ${error}`, "Task");
          return null;
        }
      }
      /**
       * Get task class by type name
       */
      static getTaskClass(taskType) {
        switch (taskType) {
          case "build":
            const { TaskBuild: TaskBuild2 } = (init_TaskBuild(), __toCommonJS(TaskBuild_exports));
            return TaskBuild2;
          case "repair":
            const { TaskRepair: TaskRepair2 } = (init_TaskRepair(), __toCommonJS(TaskRepair_exports));
            return TaskRepair2;
          case "withdraw":
            const { TaskWithdraw: TaskWithdraw2 } = (init_TaskWithdraw(), __toCommonJS(TaskWithdraw_exports));
            return TaskWithdraw2;
          case "pickup":
            const { TaskPickup: TaskPickup2 } = (init_TaskPickup(), __toCommonJS(TaskPickup_exports));
            return TaskPickup2;
          case "transfer":
            const { TaskTransfer: TaskTransfer2 } = (init_TaskTransfer(), __toCommonJS(TaskTransfer_exports));
            return TaskTransfer2;
          case "harvest":
            const { TaskHarvest: TaskHarvest2 } = (init_TaskHarvest(), __toCommonJS(TaskHarvest_exports));
            return TaskHarvest2;
          case "upgrade":
            const { TaskUpgrade: TaskUpgrade2 } = (init_TaskUpgrade(), __toCommonJS(TaskUpgrade_exports));
            return TaskUpgrade2;
          case "goToRoom":
            const { TaskGoToRoom: TaskGoToRoom2 } = (init_TaskGoToRoom(), __toCommonJS(TaskGoToRoom_exports));
            return TaskGoToRoom2;
          default:
            return null;
        }
      }
      /**
       * Create a task from memory data
       */
      static fromMemory(memory) {
        return this.deserialize(memory);
      }
      /**
       * Validate that a task chain is still executable
       */
      static validateTaskChain(task) {
        if (!task) return null;
        if (!task.isValidTask() || !task.isValidTarget()) {
          if (task.parent) {
            return this.validateTaskChain(task.parent);
          }
          return null;
        }
        return task;
      }
    };
  }
});

// src/tasks/TaskManager.ts
var TaskManager_exports = {};
__export(TaskManager_exports, {
  TaskManager: () => TaskManager
});
var TaskManager;
var init_TaskManager = __esm({
  "src/tasks/TaskManager.ts"() {
    "use strict";
    init_Task();
    init_TaskBuild();
    init_TaskRepair();
    init_TaskWithdraw();
    init_TaskPickup();
    init_TaskTransfer();
    init_TaskUpgrade();
    init_TaskHarvest();
    init_TaskGoToRoom();
    init_Logger();
    TaskManager = class {
      /**
       * Get or assign a task to a creep
       */
      static run(creep) {
        try {
          let task = this.getTask(creep);
          task = Task.validateTaskChain(task);
          if (!task) {
            task = this.assignTask(creep);
          }
          if (task) {
            const shouldContinue = task.work(creep);
            if (!shouldContinue) {
              task.finish();
              this.clearTask(creep);
              const nextTask = this.assignTask(creep);
              if (nextTask) {
                nextTask.work(creep);
                this.setTask(creep, nextTask);
              }
            } else {
              this.setTask(creep, task);
            }
          } else {
            creep.say("\u{1F4A4} idle");
          }
        } catch (error) {
          Logger.error(`TaskManager: Error running task for creep ${creep.name}: ${error}`, "TaskManager");
          this.clearTask(creep);
        }
      }
      /**
       * Assign a new task to a creep based on role and priorities
       */
      static assignTask(creep) {
        const role = creep.memory.role;
        switch (role) {
          case "builder":
            return this.assignBuilderTask(creep);
          case "hauler":
            return this.assignHaulerTask(creep);
          case "upgrader":
            return this.assignUpgraderTask(creep);
          case "harvester":
            return this.assignHarvesterTask(creep);
          case "scout":
            return this.assignScoutTask(creep);
          default:
            Logger.warn(`TaskManager: No task assignment logic for role ${role}`, "TaskManager");
            return null;
        }
      }
      /**
       * Assign tasks for builder role
       */
      static assignBuilderTask(creep) {
        if (creep.store[RESOURCE_ENERGY] === 0) {
          return this.assignEnergyCollectionTask(creep);
        }
        const emergencyRepair = TaskRepair.createFromRoom(creep);
        if (emergencyRepair && emergencyRepair.priority >= 10) {
          Logger.debug(`TaskManager: Assigned emergency repair task to ${creep.name}`, "TaskManager");
          return emergencyRepair;
        }
        const buildTask = TaskBuild.createFromRoom(creep);
        if (buildTask) {
          Logger.debug(`TaskManager: Assigned build task to ${creep.name} (priority ${buildTask.priority})`, "TaskManager");
          return buildTask;
        }
        const repairTask = TaskRepair.createFromRoom(creep);
        if (repairTask) {
          Logger.debug(`TaskManager: Assigned repair task to ${creep.name} (priority ${repairTask.priority})`, "TaskManager");
          return repairTask;
        }
        return null;
      }
      /**
       * Assign tasks for hauler role
       * Implements the same priority system as the original Hauler role
       */
      static assignHaulerTask(creep) {
        const shouldCollect = creep.store[RESOURCE_ENERGY] === 0 || !creep.memory.hauling && creep.store.getFreeCapacity() > 0;
        const shouldDeliver = creep.store.getFreeCapacity() === 0 || creep.memory.hauling && creep.store[RESOURCE_ENERGY] > 0;
        if (shouldCollect) {
          creep.memory.hauling = false;
          return this.assignEnergyCollectionTask(creep);
        } else if (shouldDeliver) {
          creep.memory.hauling = true;
          return this.assignEnergyDeliveryTask(creep);
        }
        creep.memory.hauling = false;
        return this.assignEnergyCollectionTask(creep);
      }
      /**
       * Assign energy delivery task with hauler priorities
       * Uses the existing TaskTransfer.createEnergyTransfer method which handles all priorities
       */
      static assignEnergyDeliveryTask(creep) {
        const transferTask = TaskTransfer.createEnergyTransfer(creep);
        if (transferTask) {
          Logger.debug(`TaskManager: Assigned energy transfer task to ${creep.name} (priority ${transferTask.priority})`, "TaskManager");
          return transferTask;
        }
        Logger.debug(`TaskManager: No energy delivery tasks available for ${creep.name}`, "TaskManager");
        return null;
      }
      /**
       * Assign tasks for upgrader role
       * Implements the same priority system as the original Upgrader role
       */
      static assignUpgraderTask(creep) {
        const shouldCollect = creep.store[RESOURCE_ENERGY] === 0 || !creep.memory.working && creep.store.getFreeCapacity() > 0;
        const shouldUpgrade = creep.store.getFreeCapacity() === 0 || creep.memory.working && creep.store[RESOURCE_ENERGY] > 0;
        if (shouldCollect) {
          creep.memory.working = false;
          return this.assignEnergyCollectionTask(creep);
        } else if (shouldUpgrade) {
          creep.memory.working = true;
          const upgradeTask = TaskUpgrade.createFromRoom(creep);
          if (upgradeTask) {
            Logger.debug(`TaskManager: Assigned upgrade task to ${creep.name}`, "TaskManager");
            return upgradeTask;
          }
        }
        creep.memory.working = false;
        return this.assignEnergyCollectionTask(creep);
      }
      /**
       * Get current task from creep memory
       */
      static getTask(creep) {
        if (!creep.memory.task) {
          return null;
        }
        try {
          return Task.deserialize(creep.memory.task);
        } catch (error) {
          Logger.warn(`TaskManager: Failed to deserialize task for creep ${creep.name}: ${error}`, "TaskManager");
          this.clearTask(creep);
          return null;
        }
      }
      /**
       * Save task to creep memory
       */
      static setTask(creep, task) {
        try {
          creep.memory.task = task.serialize();
        } catch (error) {
          Logger.error(`TaskManager: Failed to serialize task for creep ${creep.name}: ${error}`, "TaskManager");
          this.clearTask(creep);
        }
      }
      /**
       * Clear task from creep memory
       */
      static clearTask(creep) {
        delete creep.memory.task;
      }
      /**
       * Check if creep has a specific type of task
       */
      static hasTaskType(creep, taskType) {
        const task = this.getTask(creep);
        return task !== null && task.taskType === taskType;
      }
      /**
       * Force assign a specific task to a creep
       */
      static assignSpecificTask(creep, task) {
        this.setTask(creep, task);
        Logger.debug(`TaskManager: Force assigned ${task.taskType} task to ${creep.name}`, "TaskManager");
      }
      /**
       * Assign tasks for harvester role
       * Implements both stationary mining (RCL 3+) and mobile harvesting (RCL 1-2)
       */
      static assignHarvesterTask(creep) {
        const rcl = creep.room.controller ? creep.room.controller.level : 1;
        if (rcl >= 3) {
          const harvestTask = TaskHarvest.createFromRoom(creep);
          if (harvestTask) {
            Logger.debug(`TaskManager: Assigned harvest task to ${creep.name} (stationary mining)`, "TaskManager");
            return harvestTask;
          }
        } else {
          const shouldCollect = creep.store[RESOURCE_ENERGY] === 0 || !creep.memory.working && creep.store.getFreeCapacity() > 0;
          const shouldDeliver = creep.store.getFreeCapacity() === 0 || creep.memory.working && creep.store[RESOURCE_ENERGY] > 0;
          if (shouldCollect) {
            creep.memory.working = false;
            const harvestTask2 = TaskHarvest.createFromRoom(creep);
            if (harvestTask2) {
              Logger.debug(`TaskManager: Assigned harvest task to ${creep.name} (mobile harvesting)`, "TaskManager");
              return harvestTask2;
            }
          } else if (shouldDeliver) {
            creep.memory.working = true;
            return this.assignHarvesterDeliveryTask(creep);
          }
          creep.memory.working = false;
          const harvestTask = TaskHarvest.createFromRoom(creep);
          if (harvestTask) {
            Logger.debug(`TaskManager: Assigned harvest task to ${creep.name} (fallback)`, "TaskManager");
            return harvestTask;
          }
        }
        Logger.debug(`TaskManager: No harvest tasks available for ${creep.name}`, "TaskManager");
        return null;
      }
      /**
       * Assign energy delivery task for mobile harvesters (RCL 1-2)
       * Priority: Spawn/Extensions → Towers → Controller (upgrade)
       */
      static assignHarvesterDeliveryTask(creep) {
        const spawnExtensionTask = TaskTransfer.createEnergyTransfer(creep);
        if (spawnExtensionTask && spawnExtensionTask.priority >= 9) {
          Logger.debug(`TaskManager: Assigned spawn/extension delivery task to ${creep.name}`, "TaskManager");
          return spawnExtensionTask;
        }
        const towerTask = TaskTransfer.createEnergyTransfer(creep);
        if (towerTask && towerTask.priority === 7) {
          Logger.debug(`TaskManager: Assigned tower delivery task to ${creep.name}`, "TaskManager");
          return towerTask;
        }
        const upgradeTask = TaskUpgrade.createFromRoom(creep);
        if (upgradeTask) {
          Logger.debug(`TaskManager: Assigned upgrade task to ${creep.name} (harvester delivery)`, "TaskManager");
          return upgradeTask;
        }
        Logger.debug(`TaskManager: No harvester delivery tasks available for ${creep.name}`, "TaskManager");
        return null;
      }
      /**
       * Assign energy collection task with priority order
       */
      static assignEnergyCollectionTask(creep) {
        const pickupTask = TaskPickup.createEnergyPickup(creep);
        if (pickupTask) {
          Logger.debug(`TaskManager: Assigned energy pickup task to ${creep.name}`, "TaskManager");
          return pickupTask;
        }
        const withdrawTask = TaskWithdraw.createEnergyWithdraw(creep);
        if (withdrawTask) {
          Logger.debug(`TaskManager: Assigned energy withdraw task to ${creep.name}`, "TaskManager");
          return withdrawTask;
        }
        Logger.debug(`TaskManager: No energy collection tasks available for ${creep.name}`, "TaskManager");
        return null;
      }
      /**
       * Assign tasks for scout role
       * Implements simplified Overmind-inspired scouting
       */
      static assignScoutTask(creep) {
        if (!creep.memory.homeRoom) {
          creep.memory.homeRoom = creep.room.name;
        }
        if (creep.room.name !== creep.memory.homeRoom) {
          this.gatherIntel(creep.room);
          const enemyConstructionSites = creep.room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
          if (enemyConstructionSites.length > 0) {
            const target = enemyConstructionSites[0];
            if (target) {
              Logger.debug(`TaskManager: Scout ${creep.name} stomping enemy construction site`, "TaskManager");
              return TaskGoToRoom.create(target.pos.roomName, 2);
            }
          }
          const indestructibleWalls = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_WALL && structure.hits === void 0
          });
          if (indestructibleWalls.length > 0) {
            Logger.debug(`TaskManager: Scout ${creep.name} found newbie zone, returning home`, "TaskManager");
            return TaskGoToRoom.create(creep.memory.homeRoom, 3);
          }
          if (!creep.memory.scoutTimer) {
            creep.memory.scoutTimer = Game.time;
          }
          if (Game.time - creep.memory.scoutTimer < 10) {
            creep.say("\u{1F50D} scout");
            return null;
          }
          delete creep.memory.scoutTimer;
        }
        const targetRoom = this.findNextRoomToScout(creep);
        if (targetRoom) {
          Logger.debug(`TaskManager: Scout ${creep.name} going to ${targetRoom}`, "TaskManager");
          return TaskGoToRoom.create(targetRoom, 3);
        }
        creep.say("\u{1F4A4} idle");
        return null;
      }
      /**
       * Find next room to scout (simplified Overmind approach)
       */
      static findNextRoomToScout(creep) {
        const exits = Game.map.describeExits(creep.room.name);
        if (!exits) return null;
        const adjacentRooms = Object.values(exits);
        for (const roomName of adjacentRooms) {
          const roomMemory = Memory.rooms[roomName];
          if (!roomMemory) {
            return roomName;
          }
        }
        for (const roomName of adjacentRooms) {
          const roomMemory = Memory.rooms[roomName];
          if (!roomMemory || !roomMemory.scoutData) {
            return roomName;
          }
          if (roomMemory.scoutData.inaccessible) {
            continue;
          }
          if (!roomMemory.scoutData.explorationComplete) {
            return roomName;
          }
        }
        for (const roomName of adjacentRooms) {
          const roomMemory = Memory.rooms[roomName];
          if (!roomMemory || !roomMemory.scoutData) continue;
          if (roomMemory.scoutData.inaccessible) continue;
          const age = Game.time - roomMemory.scoutData.lastScouted;
          if (age > 500) {
            roomMemory.scoutData.explorationComplete = false;
            return roomName;
          }
        }
        return null;
      }
      /**
       * Gather intel from current room (simplified version)
       */
      static gatherIntel(room) {
        try {
          if (!Memory.rooms[room.name]) {
            Memory.rooms[room.name] = {
              sources: {},
              spawnIds: [],
              lastUpdated: Game.time,
              rcl: 0
            };
          }
          const roomMemory = Memory.rooms[room.name];
          const sources = room.find(FIND_SOURCES);
          const hostiles = room.find(FIND_HOSTILE_CREEPS);
          const hostileStructures = room.find(FIND_HOSTILE_STRUCTURES);
          const structures = room.find(FIND_STRUCTURES);
          const spawns = structures.filter((s) => s.structureType === STRUCTURE_SPAWN);
          const towers = structures.filter((s) => s.structureType === STRUCTURE_TOWER);
          if (roomMemory) {
            roomMemory.scoutData = {
              lastScouted: Game.time,
              explorationComplete: true,
              // Mark as complete after gathering intel
              roomType: "normal",
              // Simplified - could be enhanced
              sources: sources.map((source) => ({
                id: source.id,
                pos: source.pos,
                energyCapacity: source.energyCapacity
              })),
              hostileCount: hostiles.length,
              hasHostileStructures: hostileStructures.length > 0,
              structureCount: structures.length,
              hasSpawn: spawns.length > 0,
              hasTower: towers.length > 0,
              remoteScore: sources.length * 40 - hostiles.length * 25 - (hostileStructures.length > 0 ? 60 : 0),
              inaccessible: false
            };
            if (room.controller) {
              roomMemory.scoutData.controller = {
                id: room.controller.id,
                pos: room.controller.pos,
                level: room.controller.level
              };
              if (room.controller.owner) {
                roomMemory.scoutData.controller.owner = room.controller.owner.username;
              }
              if (room.controller.reservation) {
                roomMemory.scoutData.controller.reservation = {
                  username: room.controller.reservation.username,
                  ticksToEnd: room.controller.reservation.ticksToEnd
                };
              }
            }
            for (const source of sources) {
              roomMemory.sources[source.id] = {
                pos: source.pos,
                energyCapacity: source.energyCapacity,
                lastUpdated: Game.time
              };
            }
          }
          Logger.debug(`Scout: Gathered intel for ${room.name} - Sources: ${sources.length}, Hostiles: ${hostiles.length}`, "TaskManager");
        } catch (error) {
          Logger.error(`Scout: Error gathering intel for ${room.name} - ${error}`, "TaskManager");
        }
      }
      /**
       * Get task statistics for debugging
       */
      static getTaskStats(room) {
        const stats = {};
        for (const creepName in Game.creeps) {
          const creep = Game.creeps[creepName];
          if (creep && creep.room.name === room.name) {
            const task = this.getTask(creep);
            if (task) {
              stats[task.taskType] = (stats[task.taskType] || 0) + 1;
            } else {
              stats["idle"] = (stats["idle"] || 0) + 1;
            }
          }
        }
        return stats;
      }
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  SpawnManager: () => SpawnManager,
  TASK_CLASSES: () => TASK_CLASSES,
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
      const { StorageManager: StorageManager2 } = (init_StorageManager(), __toCommonJS(StorageManager_exports));
      const { StructureReplacementManager: StructureReplacementManager2 } = (init_StructureReplacementManager(), __toCommonJS(StructureReplacementManager_exports));
      this.roomManager = new RoomManager2();
      this.spawnManager = new SpawnManager2();
      this.registerManager("RoomManager", () => this.roomManager.run());
      this.registerManager("SpawnManager", () => this.spawnManager.run());
      this.registerManager("StorageManager", () => {
        for (const roomName in Game.rooms) {
          const room = Game.rooms[roomName];
          if (room && room.controller && room.controller.my) {
            StorageManager2.run(room);
          }
        }
      });
      this.registerManager("StructureReplacementManager", () => {
        for (const roomName in Game.rooms) {
          const room = Game.rooms[roomName];
          if (room && room.controller && room.controller.my) {
            StructureReplacementManager2.checkAndReplaceDecayedStructures(room);
          }
        }
      });
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
    const { TaskManager: TaskManager2 } = (init_TaskManager(), __toCommonJS(TaskManager_exports));
    TaskManager2.run(creep);
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
init_SpawnManager();
init_Task();
init_TaskBuild();
init_TaskRepair();
init_TaskWithdraw();
init_TaskPickup();
init_TaskTransfer();
init_TaskUpgrade();
init_TaskHarvest();
init_TaskGoToRoom();
init_TaskManager();
var TASK_CLASSES = {
  Task,
  TaskBuild,
  TaskRepair,
  TaskWithdraw,
  TaskPickup,
  TaskTransfer,
  TaskUpgrade,
  TaskHarvest,
  TaskGoToRoom,
  TaskManager
};
function loop() {
  if (!global.kernel) {
    global.kernel = new Kernel();
  }
  global.kernel.run();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SpawnManager,
  TASK_CLASSES,
  loop
});
