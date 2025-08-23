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
        target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
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
