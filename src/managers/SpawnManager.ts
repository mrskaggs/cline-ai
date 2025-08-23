import { Logger } from '../utils/Logger';

export class SpawnManager {
  public run(): void {
    // Process all spawns
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      if (spawn && !spawn.spawning) {
        this.processSpawn(spawn);
      }
    }
  }

  private processSpawn(spawn: StructureSpawn): void {
    try {
      const room = spawn.room;
      if (!room.controller || !room.controller.my) {
        return;
      }

      // Get room memory
      const roomMemory = Memory.rooms[room.name];
      if (!roomMemory) {
        return;
      }

      // Calculate required creeps based on RCL
      const requiredCreeps = this.calculateRequiredCreeps(room);
      
      // Check what we need to spawn
      const creepToSpawn = this.getNextCreepToSpawn(room, requiredCreeps);
      
      if (creepToSpawn) {
        this.spawnCreep(spawn, creepToSpawn.role, creepToSpawn.body, room.name);
      }

    } catch (error) {
      Logger.error(`Error processing spawn ${spawn.name}: ${error}`, 'SpawnManager');
    }
  }

  private calculateRequiredCreeps(room: Room): { [role: string]: number } {
    const rcl = room.controller ? room.controller.level : 0;
    const sources = room.find(FIND_SOURCES);
    const sourceCount = sources.length;
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

    let requiredCreeps: { [role: string]: number } = {};

    if (rcl === 1) {
      // RCL1: Only harvesters (they do everything)
      requiredCreeps['harvester'] = Math.max(2, sourceCount * 2);
    } else {
      // RCL2+: Specialized roles
      // Harvesters: 1-2 per source
      requiredCreeps['harvester'] = Math.max(1, sourceCount);
      
      // Upgraders: 1-2 dedicated upgraders
      requiredCreeps['upgrader'] = rcl >= 3 ? 2 : 1;
      
      // Builders: Based on construction sites and room level
      const baseBuilders = constructionSites.length > 0 ? 2 : 1;
      requiredCreeps['builder'] = Math.min(baseBuilders, Math.floor(rcl / 2) + 1);
    }

    return requiredCreeps;
  }

  private getNextCreepToSpawn(room: Room, required: { [role: string]: number }): { role: string; body: BodyPartConstant[] } | null {
    // Count existing creeps by role
    const creepCounts: { [role: string]: number } = {};
    
    for (const creepName in Game.creeps) {
      const creep = Game.creeps[creepName];
      if (creep && creep.memory.homeRoom === room.name) {
        const role = creep.memory.role;
        creepCounts[role] = (creepCounts[role] || 0) + 1;
      }
    }

    // Check what we need to spawn (priority order)
    const roles = ['harvester', 'upgrader', 'builder'];
    
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

  private getCreepBody(role: string, room: Room): BodyPartConstant[] {
    const energyAvailable = room.energyAvailable;

    switch (role) {
      case 'harvester':
        return this.getHarvesterBody(energyAvailable);
      case 'upgrader':
        return this.getUpgraderBody(energyAvailable);
      case 'builder':
        return this.getBuilderBody(energyAvailable);
      default:
        Logger.warn(`Unknown role for body generation: ${role}`, 'SpawnManager');
        return [];
    }
  }

  private getHarvesterBody(energyAvailable: number): BodyPartConstant[] {
    // Basic harvester: [WORK, CARRY, MOVE] = 200 energy
    // Enhanced: [WORK, WORK, CARRY, MOVE] = 300 energy
    // Advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] = 400 energy

    if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 300) {
      return [WORK, WORK, CARRY, MOVE];
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE];
    } else {
      // Emergency case - spawn the cheapest possible creep
      return [WORK, CARRY, MOVE];
    }
  }

  private getUpgraderBody(energyAvailable: number): BodyPartConstant[] {
    // Upgrader focuses on WORK and CARRY for upgrading efficiency
    // Basic: [WORK, CARRY, MOVE] = 200 energy
    // Enhanced: [WORK, WORK, CARRY, MOVE] = 300 energy
    // Advanced: [WORK, WORK, WORK, CARRY, CARRY, MOVE] = 500 energy

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

  private getBuilderBody(energyAvailable: number): BodyPartConstant[] {
    // Builder needs balanced WORK, CARRY, and MOVE for construction and repair
    // Basic: [WORK, CARRY, MOVE] = 200 energy
    // Enhanced: [WORK, CARRY, CARRY, MOVE, MOVE] = 350 energy
    // Advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] = 450 energy

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

  private spawnCreep(spawn: StructureSpawn, role: string, body: BodyPartConstant[], homeRoom: string): void {
    const name = `${role}_${Game.time}`;
    
    const result = spawn.spawnCreep(body, name, {
      memory: {
        role: role,
        homeRoom: homeRoom,
        working: false,
      },
    });

    if (result === OK) {
      Logger.logSpawn(role, name, homeRoom);
    } else if (result === ERR_NOT_ENOUGH_ENERGY) {
      // This is normal, just wait for more energy - no logging needed
    } else {
      Logger.warn(`Failed to spawn ${role}: ${result}`, 'SpawnManager');
    }
  }
}
