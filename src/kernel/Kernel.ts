import { Logger } from '../utils/Logger';

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
