import { Logger } from '../utils/Logger';
import { Hauler } from '../roles/Hauler';
import { Scout } from '../roles/Scout';

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
      
      // Builders: Dynamic based on construction phase, repair workload, and RCL
      const repairWorkload = this.calculateRepairWorkload(room);
      const totalWorkload = constructionSites.length + repairWorkload;
      
      if (rcl >= 3) {
        // RCL3+: Scale builders based on total workload (construction + repairs)
        if (totalWorkload > 15) {
          requiredCreeps['builder'] = 4; // Heavy workload (construction + many repairs)
        } else if (totalWorkload > 10) {
          requiredCreeps['builder'] = 3; // Heavy construction or moderate repairs
        } else if (totalWorkload > 5) {
          requiredCreeps['builder'] = 2; // Moderate workload
        } else {
          requiredCreeps['builder'] = 1; // Light workload or maintenance
        }
      } else {
        // RCL2: Include repair workload in builder calculation
        if (totalWorkload > 8) {
          requiredCreeps['builder'] = 3; // Heavy workload
        } else if (totalWorkload > 3) {
          requiredCreeps['builder'] = 2; // Moderate workload
        } else {
          requiredCreeps['builder'] = totalWorkload > 0 ? 1 : 0; // Light workload or none
        }
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
      
      // Scouts: Intelligence gathering for future expansion
      // Start scouting at RCL 2+ when basic infrastructure is stable
      if (rcl >= 2) {
        // Only spawn scouts if we have stable economy (enough harvesters and upgraders)
        const currentHarvesters = Object.values(Game.creeps).filter(
          creep => creep.memory.homeRoom === room.name && creep.memory.role === 'harvester'
        ).length;
        const currentUpgraders = Object.values(Game.creeps).filter(
          creep => creep.memory.homeRoom === room.name && creep.memory.role === 'upgrader'
        ).length;
        
        // Only spawn scout if we have stable core economy
        if (currentHarvesters >= sourceCount && currentUpgraders >= 1) {
          requiredCreeps['scout'] = 1; // One scout per room is sufficient
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
    const roles = ['harvester', 'hauler', 'upgrader', 'builder', 'scout'];
    
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
        return this.getHarvesterBody(energyAvailable, room);
      case 'hauler':
        return Hauler.getBody(energyAvailable);
      case 'upgrader':
        return this.getUpgraderBody(energyAvailable, room);
      case 'builder':
        return this.getBuilderBody(energyAvailable, room);
      case 'scout':
        return Scout.getBodyParts(energyAvailable);
      default:
        Logger.warn(`Unknown role for body generation: ${role}`, 'SpawnManager');
        return [];
    }
  }

  private getHarvesterBody(energyAvailable: number, room: Room): BodyPartConstant[] {
    const rcl = room.controller ? room.controller.level : 1;
    const energyCapacity = room.energyCapacityAvailable;
    
    // Use full energy capacity when available, otherwise use what we have
    const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;
    
    // Check if we have containers (indicates stationary mining at RCL 3+)
    const hasContainers = rcl >= 3 && room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
    }).length > 0;

    if (hasContainers) {
      // RCL 3+ Stationary Mining: Optimize for maximum WORK parts, minimal CARRY/MOVE
      if (targetEnergy >= 1300) {
        // RCL 4: Perfect utilization - 12 WORK = 24 energy/tick
        return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
      } else if (targetEnergy >= 800) {
        // RCL 3: Perfect utilization - 7 WORK = 14 energy/tick
        return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
      } else if (targetEnergy >= 600) {
        // High efficiency: 5 WORK = 10 energy/tick (matches source regen)
        return [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
      } else if (targetEnergy >= 500) {
        // Good efficiency: 4 WORK = 8 energy/tick
        return [WORK, WORK, WORK, WORK, CARRY, MOVE];
      } else if (targetEnergy >= 350) {
        // Decent efficiency: 3 WORK = 6 energy/tick, no movement needed
        return [WORK, WORK, WORK, CARRY];
      } else if (targetEnergy >= 300) {
        // Minimum viable stationary: 3 WORK with movement capability
        return [WORK, WORK, WORK, CARRY, MOVE];
      } else {
        // Fallback to mobile harvester body
        return [WORK, CARRY, MOVE];
      }
    } else {
      // RCL 1-2 Mobile Harvesting: Optimized for perfect energy utilization
      if (targetEnergy >= 550) {
        // RCL 2: Perfect utilization - 5 WORK = 10 energy/tick
        return [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
      } else if (targetEnergy >= 400) {
        return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
      } else if (targetEnergy >= 300) {
        // RCL 1: Perfect utilization - 2 WORK = 4 energy/tick
        return [WORK, WORK, CARRY, MOVE];
      } else if (targetEnergy >= 200) {
        return [WORK, CARRY, MOVE];
      } else {
        // Emergency case - spawn the cheapest possible creep
        return [WORK, CARRY, MOVE];
      }
    }
  }

  private getUpgraderBody(energyAvailable: number, room: Room): BodyPartConstant[] {
    const energyCapacity = room.energyCapacityAvailable;
    
    // Use full energy capacity when available, otherwise use what we have
    const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;

    // Perfect energy utilization for each RCL
    if (targetEnergy >= 1300) {
      // RCL 4: Perfect utilization - 10 WORK = 10 energy/tick upgrade
      return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE];
    } else if (targetEnergy >= 800) {
      // RCL 3: Perfect utilization - 6 WORK = 6 energy/tick upgrade
      return [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
    } else if (targetEnergy >= 550) {
      // RCL 2: Perfect utilization - 4 WORK = 4 energy/tick upgrade
      return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
    } else if (targetEnergy >= 500) {
      return [WORK, WORK, WORK, CARRY, CARRY, MOVE];
    } else if (targetEnergy >= 400) {
      return [WORK, WORK, CARRY, CARRY, MOVE];
    } else if (targetEnergy >= 300) {
      // RCL 1: Perfect utilization - 2 WORK = 2 energy/tick upgrade
      return [WORK, WORK, CARRY, MOVE];
    } else if (targetEnergy >= 200) {
      return [WORK, CARRY, MOVE];
    } else {
      return [WORK, CARRY, MOVE];
    }
  }

  private getBuilderBody(energyAvailable: number, room: Room): BodyPartConstant[] {
    const energyCapacity = room.energyCapacityAvailable;
    
    // Use full energy capacity when available, otherwise use what we have
    const targetEnergy = energyAvailable >= energyCapacity ? energyCapacity : energyAvailable;

    // Perfect energy utilization for each RCL
    if (targetEnergy >= 1300) {
      // RCL 4: Perfect utilization - 6 WORK, 6 CARRY = extremely fast building with massive carry capacity
      return [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (targetEnergy >= 800) {
      // RCL 3: Perfect utilization - 4 WORK, 4 CARRY = maximum building speed with excellent carry capacity
      return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
    } else if (targetEnergy >= 550) {
      // RCL 2: Perfect utilization - 3 WORK, 3 CARRY = fast building with good carry capacity
      return [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
    } else if (targetEnergy >= 450) {
      return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (targetEnergy >= 350) {
      return [WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (targetEnergy >= 300) {
      // RCL 1: Perfect utilization - 2 WORK, 2 CARRY = balanced build/carry
      return [WORK, WORK, CARRY, CARRY, MOVE];
    } else if (targetEnergy >= 250) {
      return [WORK, CARRY, MOVE, MOVE];
    } else if (targetEnergy >= 200) {
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
    const potentialBody = this.getOptimalCreepBody(role, room.energyCapacityAvailable, room);
    const potentialBodyCost = this.calculateBodyCost(potentialBody);
    const currentBodyCost = this.calculateBodyCost(currentBody);

    // Only wait if:
    // 1. The potential body is significantly better (more parts)
    // 2. We have enough capacity to build the better body
    // 3. We're not at full capacity yet (if at full capacity, spawn what we can afford)
    // 4. The current body cost is less than what we can afford (room for improvement)
    const isSignificantlyBetter = potentialBody.length > currentBody.length;
    const canAffordBetter = potentialBodyCost <= room.energyCapacityAvailable;
    const notAtFullCapacity = room.energyAvailable < room.energyCapacityAvailable;
    const canAffordCurrentBody = currentBodyCost <= room.energyAvailable;

    // If we're at full capacity or the current body is the best we can afford, don't wait
    if (!notAtFullCapacity || !canAffordCurrentBody) {
      return false;
    }

    // Only wait if we can build something significantly better and we're not at capacity
    return isSignificantlyBetter && canAffordBetter && notAtFullCapacity;
  }

  private getOptimalCreepBody(role: string, energyCapacity: number, room: Room): BodyPartConstant[] {
    // Get the best possible body for this role given the energy capacity
    // Allow full RCL 4 energy capacity for perfect utilization
    const maxEnergy = Math.min(energyCapacity, 1300); // Allow RCL 4 energy capacity

    switch (role) {
      case 'harvester':
        return this.getHarvesterBody(maxEnergy, room);
      case 'hauler':
        return Hauler.getBody(maxEnergy);
      case 'upgrader':
        return this.getUpgraderBody(maxEnergy, room);
      case 'builder':
        return this.getBuilderBody(maxEnergy, room);
      case 'scout':
        return Scout.getBodyParts(maxEnergy);
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

  private calculateRepairWorkload(room: Room): number {
    // Calculate repair workload based on damaged structures
    const structures = room.find(FIND_STRUCTURES);
    let repairWorkload = 0;

    for (const structure of structures) {
      const healthPercent = structure.hits / structure.hitsMax;
      
      // Emergency repairs (structures < 10% health) - highest priority
      if (healthPercent < 0.1 && structure.structureType !== STRUCTURE_WALL) {
        repairWorkload += 5; // Emergency repairs count as 5 units of work
      }
      // Ramparts needing repair (< 80% health) - high priority
      else if (structure.structureType === STRUCTURE_RAMPART && healthPercent < 0.8) {
        repairWorkload += 3; // Rampart repairs count as 3 units of work
      }
      // Critical structures needing repair (< 80% health)
      else if (healthPercent < 0.8 && 
               (structure.structureType === STRUCTURE_SPAWN ||
                structure.structureType === STRUCTURE_EXTENSION ||
                structure.structureType === STRUCTURE_TOWER ||
                structure.structureType === STRUCTURE_STORAGE)) {
        repairWorkload += 2; // Critical structure repairs count as 2 units of work
      }
      // Roads and containers needing repair (< 60% health)
      else if (healthPercent < 0.6 && 
               (structure.structureType === STRUCTURE_ROAD ||
                structure.structureType === STRUCTURE_CONTAINER)) {
        repairWorkload += 1; // Infrastructure repairs count as 1 unit of work
      }
      // Other structures needing repair (< 80% health)
      else if (healthPercent < 0.8 && 
               structure.structureType !== STRUCTURE_WALL &&
               structure.structureType !== STRUCTURE_RAMPART) {
        repairWorkload += 1; // General repairs count as 1 unit of work
      }
    }

    return repairWorkload;
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
