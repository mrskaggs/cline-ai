import { Task } from './Task';
import { TaskBuild } from './TaskBuild';
import { TaskRepair } from './TaskRepair';
import { TaskWithdraw } from './TaskWithdraw';
import { TaskPickup } from './TaskPickup';
import { TaskTransfer } from './TaskTransfer';
import { TaskUpgrade } from './TaskUpgrade';
import { TaskHarvest } from './TaskHarvest';
import { TaskGoToRoom } from './TaskGoToRoom';
import { Logger } from '../utils/Logger';

/**
 * Manages task assignment and execution for creeps
 */
export class TaskManager {
  /**
   * Get or assign a task to a creep
   */
  public static run(creep: Creep): void {
    try {
      // Get current task from memory
      let task = this.getTask(creep);

      // Validate current task
      task = Task.validateTaskChain(task);

      // If no valid task, assign a new one
      if (!task) {
        task = this.assignTask(creep);
      }

      // Execute the task
      if (task) {
        const shouldContinue = task.work(creep);
        
        if (!shouldContinue) {
          // Task completed, clean up and try to get next task
          task.finish();
          this.clearTask(creep);
          
          // Try to assign a new task immediately
          const nextTask = this.assignTask(creep);
          if (nextTask) {
            nextTask.work(creep);
            this.setTask(creep, nextTask);
          }
        } else {
          // Task continues, save state
          this.setTask(creep, task);
        }
      } else {
        // No task available, creep idles
        creep.say('💤 idle');
      }
    } catch (error) {
      Logger.error(`TaskManager: Error running task for creep ${creep.name}: ${error}`, 'TaskManager');
      this.clearTask(creep);
    }
  }

  /**
   * Assign a new task to a creep based on role and priorities
   */
  public static assignTask(creep: Creep): Task | null {
    const role = creep.memory.role;
    
    switch (role) {
      case 'builder':
        return this.assignBuilderTask(creep);
      case 'hauler':
        return this.assignHaulerTask(creep);
      case 'upgrader':
        return this.assignUpgraderTask(creep);
      case 'harvester':
        return this.assignHarvesterTask(creep);
      case 'scout':
        return this.assignScoutTask(creep);
      default:
        Logger.warn(`TaskManager: No task assignment logic for role ${role}`, 'TaskManager');
        return null;
    }
  }

  /**
   * Assign tasks for builder role
   */
  private static assignBuilderTask(creep: Creep): Task | null {
    // If creep has no energy, it needs to collect energy first
    if (creep.store[RESOURCE_ENERGY] === 0) {
      return this.assignEnergyCollectionTask(creep);
    }

    // Priority 1: Emergency repairs (highest priority)
    const emergencyRepair = TaskRepair.createFromRoom(creep);
    if (emergencyRepair && emergencyRepair.priority >= 10) {
      Logger.debug(`TaskManager: Assigned emergency repair task to ${creep.name}`, 'TaskManager');
      return emergencyRepair;
    }

    // Priority 2: Construction sites
    const buildTask = TaskBuild.createFromRoom(creep);
    if (buildTask) {
      Logger.debug(`TaskManager: Assigned build task to ${creep.name} (priority ${buildTask.priority})`, 'TaskManager');
      return buildTask;
    }

    // Priority 3: Regular repairs
    const repairTask = TaskRepair.createFromRoom(creep);
    if (repairTask) {
      Logger.debug(`TaskManager: Assigned repair task to ${creep.name} (priority ${repairTask.priority})`, 'TaskManager');
      return repairTask;
    }

    // No tasks available
    return null;
  }

  /**
   * Assign tasks for hauler role
   * Implements the same priority system as the original Hauler role
   */
  private static assignHaulerTask(creep: Creep): Task | null {
    // State management: determine if hauler should collect or deliver
    const shouldCollect = creep.store[RESOURCE_ENERGY] === 0 || 
                         (!creep.memory.hauling && creep.store.getFreeCapacity() > 0);
    const shouldDeliver = creep.store.getFreeCapacity() === 0 || 
                         (creep.memory.hauling && creep.store[RESOURCE_ENERGY] > 0);

    if (shouldCollect) {
      // Collection phase - same priority as original Hauler role
      creep.memory.hauling = false;
      return this.assignEnergyCollectionTask(creep);
    } else if (shouldDeliver) {
      // Delivery phase - use TaskTransfer with proper priorities
      creep.memory.hauling = true;
      return this.assignEnergyDeliveryTask(creep);
    }

    // No clear state - default to collection
    creep.memory.hauling = false;
    return this.assignEnergyCollectionTask(creep);
  }

  /**
   * Assign energy delivery task with hauler priorities
   * Uses the existing TaskTransfer.createEnergyTransfer method which handles all priorities
   */
  private static assignEnergyDeliveryTask(creep: Creep): Task | null {
    // Use the existing TaskTransfer.createEnergyTransfer method which already implements
    // the correct priority system: Spawn → Extensions → Controller containers → Towers → Storage
    const transferTask = TaskTransfer.createEnergyTransfer(creep);
    if (transferTask) {
      Logger.debug(`TaskManager: Assigned energy transfer task to ${creep.name} (priority ${transferTask.priority})`, 'TaskManager');
      return transferTask;
    }

    // No delivery targets available
    Logger.debug(`TaskManager: No energy delivery tasks available for ${creep.name}`, 'TaskManager');
    return null;
  }

  /**
   * Assign tasks for upgrader role
   * Implements the same priority system as the original Upgrader role
   */
  private static assignUpgraderTask(creep: Creep): Task | null {
    // State management: determine if upgrader should collect energy or upgrade
    const shouldCollect = creep.store[RESOURCE_ENERGY] === 0 || 
                         (!creep.memory.working && creep.store.getFreeCapacity() > 0);
    const shouldUpgrade = creep.store.getFreeCapacity() === 0 || 
                         (creep.memory.working && creep.store[RESOURCE_ENERGY] > 0);

    if (shouldCollect) {
      // Collection phase - same priority as original Upgrader role
      creep.memory.working = false;
      return this.assignEnergyCollectionTask(creep);
    } else if (shouldUpgrade) {
      // Upgrade phase - use TaskUpgrade
      creep.memory.working = true;
      const upgradeTask = TaskUpgrade.createFromRoom(creep);
      if (upgradeTask) {
        Logger.debug(`TaskManager: Assigned upgrade task to ${creep.name}`, 'TaskManager');
        return upgradeTask;
      }
    }

    // No clear state - default to collection
    creep.memory.working = false;
    return this.assignEnergyCollectionTask(creep);
  }

  /**
   * Get current task from creep memory
   */
  private static getTask(creep: Creep): Task | null {
    if (!creep.memory.task) {
      return null;
    }

    try {
      return Task.deserialize(creep.memory.task);
    } catch (error) {
      Logger.warn(`TaskManager: Failed to deserialize task for creep ${creep.name}: ${error}`, 'TaskManager');
      this.clearTask(creep);
      return null;
    }
  }

  /**
   * Save task to creep memory
   */
  private static setTask(creep: Creep, task: Task): void {
    try {
      creep.memory.task = task.serialize();
    } catch (error) {
      Logger.error(`TaskManager: Failed to serialize task for creep ${creep.name}: ${error}`, 'TaskManager');
      this.clearTask(creep);
    }
  }

  /**
   * Clear task from creep memory
   */
  private static clearTask(creep: Creep): void {
    delete creep.memory.task;
  }

  /**
   * Check if creep has a specific type of task
   */
  public static hasTaskType(creep: Creep, taskType: string): boolean {
    const task = this.getTask(creep);
    return task !== null && task.taskType === taskType;
  }

  /**
   * Force assign a specific task to a creep
   */
  public static assignSpecificTask(creep: Creep, task: Task): void {
    this.setTask(creep, task);
    Logger.debug(`TaskManager: Force assigned ${task.taskType} task to ${creep.name}`, 'TaskManager');
  }

  /**
   * Assign tasks for harvester role
   * Implements both stationary mining (RCL 3+) and mobile harvesting (RCL 1-2)
   */
  private static assignHarvesterTask(creep: Creep): Task | null {
    const rcl = creep.room.controller ? creep.room.controller.level : 1;
    
    if (rcl >= 3) {
      // RCL 3+: Stationary mining - always harvest from assigned source
      const harvestTask = TaskHarvest.createFromRoom(creep);
      if (harvestTask) {
        Logger.debug(`TaskManager: Assigned harvest task to ${creep.name} (stationary mining)`, 'TaskManager');
        return harvestTask;
      }
    } else {
      // RCL 1-2: Mobile harvesting with state management
      const shouldCollect = creep.store[RESOURCE_ENERGY] === 0 || 
                           (!creep.memory.working && creep.store.getFreeCapacity() > 0);
      const shouldDeliver = creep.store.getFreeCapacity() === 0 || 
                           (creep.memory.working && creep.store[RESOURCE_ENERGY] > 0);

      if (shouldCollect) {
        // Collection phase - harvest from sources
        creep.memory.working = false;
        const harvestTask = TaskHarvest.createFromRoom(creep);
        if (harvestTask) {
          Logger.debug(`TaskManager: Assigned harvest task to ${creep.name} (mobile harvesting)`, 'TaskManager');
          return harvestTask;
        }
      } else if (shouldDeliver) {
        // Delivery phase - deliver energy to structures
        creep.memory.working = true;
        return this.assignHarvesterDeliveryTask(creep);
      }

      // No clear state - default to collection
      creep.memory.working = false;
      const harvestTask = TaskHarvest.createFromRoom(creep);
      if (harvestTask) {
        Logger.debug(`TaskManager: Assigned harvest task to ${creep.name} (fallback)`, 'TaskManager');
        return harvestTask;
      }
    }

    // No harvest tasks available
    Logger.debug(`TaskManager: No harvest tasks available for ${creep.name}`, 'TaskManager');
    return null;
  }

  /**
   * Assign energy delivery task for mobile harvesters (RCL 1-2)
   * Priority: Spawn/Extensions → Towers → Controller (upgrade)
   */
  private static assignHarvesterDeliveryTask(creep: Creep): Task | null {
    // Priority 1: Spawn and extensions
    const spawnExtensionTask = TaskTransfer.createEnergyTransfer(creep);
    if (spawnExtensionTask && spawnExtensionTask.priority >= 9) {
      Logger.debug(`TaskManager: Assigned spawn/extension delivery task to ${creep.name}`, 'TaskManager');
      return spawnExtensionTask;
    }

    // Priority 2: Towers
    const towerTask = TaskTransfer.createEnergyTransfer(creep);
    if (towerTask && towerTask.priority === 7) {
      Logger.debug(`TaskManager: Assigned tower delivery task to ${creep.name}`, 'TaskManager');
      return towerTask;
    }

    // Priority 3: Controller (upgrade)
    const upgradeTask = TaskUpgrade.createFromRoom(creep);
    if (upgradeTask) {
      Logger.debug(`TaskManager: Assigned upgrade task to ${creep.name} (harvester delivery)`, 'TaskManager');
      return upgradeTask;
    }

    // No delivery targets available
    Logger.debug(`TaskManager: No harvester delivery tasks available for ${creep.name}`, 'TaskManager');
    return null;
  }

  /**
   * Assign energy collection task with priority order
   */
  private static assignEnergyCollectionTask(creep: Creep): Task | null {
    // Priority 1: Dropped energy (prevents decay)
    const pickupTask = TaskPickup.createEnergyPickup(creep);
    if (pickupTask) {
      Logger.debug(`TaskManager: Assigned energy pickup task to ${creep.name}`, 'TaskManager');
      return pickupTask;
    }

    // Priority 2: Withdraw from structures (containers, storage, links)
    const withdrawTask = TaskWithdraw.createEnergyWithdraw(creep);
    if (withdrawTask) {
      Logger.debug(`TaskManager: Assigned energy withdraw task to ${creep.name}`, 'TaskManager');
      return withdrawTask;
    }

    // No energy sources available - creep will need to wait or use existing role logic
    Logger.debug(`TaskManager: No energy collection tasks available for ${creep.name}`, 'TaskManager');
    return null;
  }

  /**
   * Assign tasks for scout role
   * Implements simplified Overmind-inspired scouting
   */
  private static assignScoutTask(creep: Creep): Task | null {
    // Initialize scout memory if needed
    if (!(creep.memory as any).homeRoom) {
      (creep.memory as any).homeRoom = creep.room.name;
    }

    // If we're not in home room, check if we should return home
    if (creep.room.name !== (creep.memory as any).homeRoom) {
      // Gather intel while we're here
      this.gatherIntel(creep.room);
      
      // Check for enemy construction sites to stomp
      const enemyConstructionSites = creep.room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
      if (enemyConstructionSites.length > 0) {
        const target = enemyConstructionSites[0];
        if (target) {
          Logger.debug(`TaskManager: Scout ${creep.name} stomping enemy construction site`, 'TaskManager');
          return TaskGoToRoom.create(target.pos.roomName, 2);
        }
      }

      // Check if room might be connected to newbie/respawn zone
      const indestructibleWalls = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_WALL && structure.hits === undefined
      });
      
      if (indestructibleWalls.length > 0) {
        // Return home if we find a room near newbie zone
        Logger.debug(`TaskManager: Scout ${creep.name} found newbie zone, returning home`, 'TaskManager');
        return TaskGoToRoom.create((creep.memory as any).homeRoom, 3);
      }

      // Stay in current room for a bit to gather intel, then move on
      if (!(creep.memory as any).scoutTimer) {
        (creep.memory as any).scoutTimer = Game.time;
      }

      // Stay for 10 ticks to gather intel
      if (Game.time - (creep.memory as any).scoutTimer < 10) {
        creep.say('🔍 scout');
        return null; // Stay put
      }

      // Reset timer and pick a new room
      delete (creep.memory as any).scoutTimer;
    }

    // Pick a new room to scout
    const targetRoom = this.findNextRoomToScout(creep);
    if (targetRoom) {
      Logger.debug(`TaskManager: Scout ${creep.name} going to ${targetRoom}`, 'TaskManager');
      return TaskGoToRoom.create(targetRoom, 3);
    }

    // No rooms to scout, stay idle
    creep.say('💤 idle');
    return null;
  }

  /**
   * Find next room to scout (simplified Overmind approach)
   */
  private static findNextRoomToScout(creep: Creep): string | null {
    const exits = Game.map.describeExits(creep.room.name);
    if (!exits) return null;

    const adjacentRooms = Object.values(exits);
    
    // Priority 1: Rooms with no memory (highest priority)
    for (const roomName of adjacentRooms) {
      const roomMemory = Memory.rooms[roomName];
      if (!roomMemory) {
        return roomName;
      }
    }

    // Priority 2: Rooms with incomplete exploration
    for (const roomName of adjacentRooms) {
      const roomMemory = Memory.rooms[roomName];
      if (!roomMemory || !roomMemory.scoutData) {
        return roomName;
      }

      // Skip if marked as inaccessible
      if (roomMemory.scoutData.inaccessible) {
        continue;
      }

      // Check if exploration is incomplete
      if (!roomMemory.scoutData.explorationComplete) {
        return roomName;
      }
    }

    // Priority 3: Rooms with stale data (>500 ticks)
    for (const roomName of adjacentRooms) {
      const roomMemory = Memory.rooms[roomName];
      if (!roomMemory || !roomMemory.scoutData) continue;

      if (roomMemory.scoutData.inaccessible) continue;

      const age = Game.time - roomMemory.scoutData.lastScouted;
      if (age > 500) {
        // Reset exploration complete flag to allow re-exploration
        roomMemory.scoutData.explorationComplete = false;
        return roomName;
      }
    }

    // No rooms need scouting
    return null;
  }

  /**
   * Gather intel from current room (simplified version)
   */
  private static gatherIntel(room: Room): void {
    try {
      // Initialize room memory if needed
      if (!Memory.rooms[room.name]) {
        Memory.rooms[room.name] = {
          sources: {},
          spawnIds: [],
          lastUpdated: Game.time,
          rcl: 0
        };
      }

      const roomMemory = Memory.rooms[room.name];
      
      // Find sources
      const sources = room.find(FIND_SOURCES);
      
      // Find hostiles
      const hostiles = room.find(FIND_HOSTILE_CREEPS);
      const hostileStructures = room.find(FIND_HOSTILE_STRUCTURES);
      
      // Find structures
      const structures = room.find(FIND_STRUCTURES);
      const spawns = structures.filter(s => s.structureType === STRUCTURE_SPAWN);
      const towers = structures.filter(s => s.structureType === STRUCTURE_TOWER);

      // Initialize scout data
      if (roomMemory) {
        roomMemory.scoutData = {
          lastScouted: Game.time,
          explorationComplete: true, // Mark as complete after gathering intel
          roomType: 'normal', // Simplified - could be enhanced
          sources: sources.map(source => ({
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

        // Add controller data if present
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

        // Populate sources for system compatibility
        for (const source of sources) {
          roomMemory.sources[source.id] = {
            pos: source.pos,
            energyCapacity: source.energyCapacity,
            lastUpdated: Game.time
          };
        }
      }

      Logger.debug(`Scout: Gathered intel for ${room.name} - Sources: ${sources.length}, Hostiles: ${hostiles.length}`, 'TaskManager');
    } catch (error) {
      Logger.error(`Scout: Error gathering intel for ${room.name} - ${error}`, 'TaskManager');
    }
  }

  /**
   * Get task statistics for debugging
   */
  public static getTaskStats(room: Room): { [taskType: string]: number } {
    const stats: { [taskType: string]: number } = {};
    
    for (const creepName in Game.creeps) {
      const creep = Game.creeps[creepName];
      if (creep && creep.room.name === room.name) {
        const task = this.getTask(creep);
        if (task) {
          stats[task.taskType] = (stats[task.taskType] || 0) + 1;
        } else {
          stats['idle'] = (stats['idle'] || 0) + 1;
        }
      }
    }
    
    return stats;
  }
}
