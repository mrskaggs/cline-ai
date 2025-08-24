import { Logger } from '../utils/Logger';
import { Settings } from '../config/settings';

export class Kernel implements IKernel {
  private managers: Array<{ name: string; run: () => void }> = [];
  private initialized: boolean = false;
  private roomManager: any;
  private spawnManager: any;

  constructor() {
    this.load();
  }

  public run(): void {
    try {
      // Initialize memory if needed
      this.initializeMemory();

      // Clean up dead creeps from memory
      this.cleanupMemory();

      // Periodic logger cleanup (every 100 ticks)
      if (Game.time % 100 === 0) {
        Logger.cleanup();
      }

      // Periodic planning system cleanup (every 500 ticks)
      if (Game.time % 500 === 0) {
        this.cleanupPlanningData();
      }

      // Run all registered managers
      for (const manager of this.managers) {
        this.safelyExecute(() => manager.run(), manager.name);
      }

      // Run creep roles
      this.runCreeps();

    } catch (error) {
      Logger.error(`Critical error in main loop: ${error}`, 'Kernel');
    }
  }

  private load(): void {
    // Only initialize once per global reset
    if (!this.initialized) {
      Logger.info('Loading kernel...', 'Kernel');
      
      // Register managers
      const { RoomManager } = require('../managers/RoomManager');
      const { SpawnManager } = require('../managers/SpawnManager');
      
      this.roomManager = new RoomManager();
      this.spawnManager = new SpawnManager();
      
      this.registerManager('RoomManager', () => this.roomManager.run());
      this.registerManager('SpawnManager', () => this.spawnManager.run());
      
      this.initialized = true;
    }
  }

  private initializeMemory(): void {
    if (!Memory.uuid) {
      Memory.uuid = Math.floor(Math.random() * 1000000);
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

  private cleanupMemory(): void {
    // Clean up dead creeps
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }

    // Clean up dead spawns
    for (const name in Memory.spawns) {
      if (!(name in Game.spawns)) {
        delete Memory.spawns[name];
      }
    }

    // Clean up dead flags
    for (const name in Memory.flags) {
      if (!(name in Game.flags)) {
        delete Memory.flags[name];
      }
    }
  }

  private cleanupPlanningData(): void {
    if (!Settings.planning.enabled) return;

    try {
      // Clean up old traffic data and layout analysis for all rooms
      for (const roomName in Memory.rooms) {
        const roomMemory = Memory.rooms[roomName];
        if (!roomMemory) continue;

        // Clean up old traffic data
        if (roomMemory.trafficData) {
          const trafficTTL = Settings.planning.trafficDataTTL;
          for (const posKey in roomMemory.trafficData) {
            const data = roomMemory.trafficData[posKey];
            if (data && Game.time - data.lastSeen > trafficTTL) {
              delete roomMemory.trafficData[posKey];
            }
          }
        }

        // Clean up old layout analysis
        if (roomMemory.layoutAnalysis) {
          const layoutTTL = Settings.planning.layoutAnalysisTTL;
          if (Game.time - roomMemory.layoutAnalysis.lastAnalyzed > layoutTTL) {
            delete roomMemory.layoutAnalysis;
            Logger.debug(`Kernel: Cleaned up old layout analysis for room ${roomName}`);
          }
        }

        // Clean up completed construction sites from plans
        if (roomMemory.plan) {
          const room = Game.rooms[roomName];
          if (room) {
            // Update building placement status
            roomMemory.plan.buildings.forEach(building => {
              if (building.placed && building.constructionSiteId) {
                const site = Game.getObjectById(building.constructionSiteId);
                if (!site) {
                  // Construction site no longer exists, check if structure was built
                  const structures = building.pos.lookFor(LOOK_STRUCTURES);
                  const hasStructure = structures.some(s => s.structureType === building.structureType);
                  if (hasStructure) {
                    // Structure was successfully built
                    delete building.constructionSiteId;
                  } else {
                    // Construction site was removed, mark as not placed
                    building.placed = false;
                    delete building.constructionSiteId;
                  }
                }
              }
            });

            // Update road placement status
            roomMemory.plan.roads.forEach(road => {
              if (road.placed && road.constructionSiteId) {
                const site = Game.getObjectById(road.constructionSiteId);
                if (!site) {
                  // Construction site no longer exists, check if road was built
                  const structures = road.pos.lookFor(LOOK_STRUCTURES);
                  const hasRoad = structures.some(s => s.structureType === STRUCTURE_ROAD);
                  if (hasRoad) {
                    // Road was successfully built
                    delete road.constructionSiteId;
                  } else {
                    // Construction site was removed, mark as not placed
                    road.placed = false;
                    delete road.constructionSiteId;
                  }
                }
              }
            });
          }
        }
      }

      Logger.debug('Kernel: Completed planning data cleanup');
    } catch (error) {
      Logger.error(`Kernel: Error during planning data cleanup: ${error}`);
    }
  }

  private runCreeps(): void {
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      if (creep) {
        this.safelyExecute(() => this.runCreepRole(creep), `Creep-${name}`);
      }
    }
  }

  private runCreepRole(creep: Creep): void {
    if (!creep.memory.role) {
      Logger.warn(`Creep ${creep.name} has no role assigned`, 'Kernel');
      return;
    }

    // Import roles dynamically to avoid circular dependencies
    switch (creep.memory.role) {
      case 'harvester':
        const { Harvester } = require('../roles/Harvester');
        Harvester.run(creep);
        break;
      case 'hauler':
        const { Hauler } = require('../roles/Hauler');
        Hauler.run(creep);
        break;
      case 'builder':
        const { Builder } = require('../roles/Builder');
        Builder.run(creep);
        break;
      case 'upgrader':
        const { Upgrader } = require('../roles/Upgrader');
        Upgrader.run(creep);
        break;
      default:
        Logger.warn(`Unknown role: ${creep.memory.role}`, 'Kernel');
    }
  }

  private safelyExecute(callback: () => void, context: string = 'Unknown'): void {
    try {
      callback();
    } catch (error) {
      Logger.error(`Error in ${context}: ${error}`, 'Kernel');
    }
  }

  public registerManager(name: string, runFunction: () => void): void {
    this.managers.push({ name, run: runFunction });
  }
}
