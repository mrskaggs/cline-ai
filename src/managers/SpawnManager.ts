import { Logger } from '../utils/Logger';
import { Hauler } from '../roles/Hauler';

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
      // RCL2+: Specialized roles with performance optimization
      // Harvesters: Exactly 1 per source (with 3 WORK parts at 300 energy)
      requiredCreeps['harvester'] = sourceCount;
      
      // Upgraders: Optimized for faster RCL progression
      if (rcl === 2) {
        // RCL 2: 2-3 upgraders for maximum upgrade speed (25-40% faster progression)
        requiredCreeps['upgrader'] = constructionSites.length > 5 ? 2 : 3;
      } else {
        requiredCreeps['upgrader'] = rcl >= 3 ? 2 : 1;
      }
      
      // Builders: Dynamic based on construction phase
      if (constructionSites.length > 0) {
        // Active construction: 1-2 builders based on workload
        requiredCreeps['builder'] = constructionSites.length > 3 ? 2 : 1;
      } else {
        // No construction: Minimal builders for maintenance
        requiredCreeps['builder'] = rcl >= 3 ? 1 : 0;
      }
      
      // Haulers: Critical for RCL 3+ when harvesters become stationary
      if (rcl >= 3) {
        // Check if we have containers (indicates transition to stationary mining)
        const containers = room.find(FIND_STRUCTURES, {
          filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
        });
        
        if (containers.length > 0) {
          // Need haulers for logistics when containers exist
          requiredCreeps['hauler'] = Math.max(1, Math.floor(sourceCount * 1.5));
        }
      }
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
    const roles = ['harvester', 'hauler', 'upgrader', 'builder'];
    
    for (const role of roles) {
      const current = creepCounts[role] || 0;
      const needed = required[role] || 0;
      
      if (current < needed) {
        const body = this.getCreepBody(role, room);
        if (body.length > 0) {
          // Check if we should wait for more energy to build a better creep
          if (this.shouldWaitForBetterCreep(room, role, body)) {
            Logger.debug(`Waiting for more energy to spawn better ${role} (current: ${room.energyAvailable}/${room.energyCapacityAvailable})`, 'SpawnManager');
            continue; // Skip this role for now
          }
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
      case 'hauler':
        return Hauler.getBody(energyAvailable);
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
    // RCL 2 Optimized: [WORK, WORK, WORK, CARRY, MOVE] = 300 energy (max harvest efficiency)
    // Basic harvester: [WORK, CARRY, MOVE] = 200 energy
    // Advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] = 400 energy

    if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 300) {
      // RCL 2 optimization: 3 WORK parts for maximum harvest efficiency
      return [WORK, WORK, WORK, CARRY, MOVE];
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE];
    } else {
      // Emergency case - spawn the cheapest possible creep
      return [WORK, CARRY, MOVE];
    }
  }

  private getUpgraderBody(energyAvailable: number): BodyPartConstant[] {
    // RCL 2 Optimized: [WORK, WORK, WORK, CARRY, MOVE] = 300 energy (max upgrade speed)
    // Basic: [WORK, CARRY, MOVE] = 200 energy
    // Advanced: [WORK, WORK, WORK, CARRY, CARRY, MOVE] = 500 energy

    if (energyAvailable >= 500) {
      return [WORK, WORK, WORK, CARRY, CARRY, MOVE];
    } else if (energyAvailable >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE];
    } else if (energyAvailable >= 300) {
      // RCL 2 optimization: 3 WORK parts for maximum upgrade speed
      return [WORK, WORK, WORK, CARRY, MOVE];
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE];
    } else {
      return [WORK, CARRY, MOVE];
    }
  }

  private getBuilderBody(energyAvailable: number): BodyPartConstant[] {
    // RCL 2 Optimized: [WORK, WORK, CARRY, CARRY, MOVE] = 300 energy (balanced build/carry)
    // Basic: [WORK, CARRY, MOVE] = 200 energy
    // Advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE] = 450 energy

    if (energyAvailable >= 450) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 350) {
      return [WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 300) {
      // RCL 2 optimization: 2 WORK, 2 CARRY for balanced build/carry efficiency
      return [WORK, WORK, CARRY, CARRY, MOVE];
    } else if (energyAvailable >= 250) {
      return [WORK, CARRY, MOVE, MOVE];
    } else if (energyAvailable >= 200) {
      return [WORK, CARRY, MOVE];
    } else {
      return [WORK, CARRY, MOVE];
    }
  }

  private shouldWaitForBetterCreep(room: Room, role: string, currentBody: BodyPartConstant[]): boolean {
    // Don't wait if we have no creeps of this role (emergency spawning)
    const existingCreeps = Object.values(Game.creeps).filter(
      creep => creep.memory.homeRoom === room.name && creep.memory.role === role
    );
    
    if (existingCreeps.length === 0) {
      // Emergency case: spawn immediately if we have no creeps of this role
      return false;
    }

    // Calculate what body we could build with full energy capacity
    const potentialBody = this.getOptimalCreepBody(role, room.energyCapacityAvailable);
    const potentialBodyCost = this.calculateBodyCost(potentialBody);

    // Only wait if:
    // 1. The potential body is significantly better (more parts)
    // 2. We have enough capacity to build the better body
    // 3. We're not too far from having enough energy (within 50% of capacity)
    const isSignificantlyBetter = potentialBody.length > currentBody.length;
    const canAffordBetter = potentialBodyCost <= room.energyCapacityAvailable;
    const closeToCapacity = room.energyAvailable >= (room.energyCapacityAvailable * 0.5);

    return isSignificantlyBetter && canAffordBetter && closeToCapacity;
  }

  private getOptimalCreepBody(role: string, energyCapacity: number): BodyPartConstant[] {
    // Get the best possible body for this role given the energy capacity
    // Cap at reasonable limits to avoid overly expensive creeps
    const maxEnergy = Math.min(energyCapacity, 800); // Reasonable cap for early game

    switch (role) {
      case 'harvester':
        return this.getHarvesterBody(maxEnergy);
      case 'hauler':
        return Hauler.getBody(maxEnergy);
      case 'upgrader':
        return this.getUpgraderBody(maxEnergy);
      case 'builder':
        return this.getBuilderBody(maxEnergy);
      default:
        return [];
    }
  }

  private calculateBodyCost(body: BodyPartConstant[]): number {
    return body.reduce((cost, part) => {
      switch (part) {
        case WORK: return cost + 100;
        case CARRY: return cost + 50;
        case MOVE: return cost + 50;
        case ATTACK: return cost + 80;
        case RANGED_ATTACK: return cost + 150;
        case HEAL: return cost + 250;
        case CLAIM: return cost + 600;
        case TOUGH: return cost + 10;
        default: return cost;
      }
    }, 0);
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
