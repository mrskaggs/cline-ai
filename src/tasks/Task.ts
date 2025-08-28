import { Logger } from '../utils/Logger';

/**
 * Abstract base class for all creep tasks
 * Provides standardized lifecycle management and serialization
 */
export abstract class Task {
  public taskType: string;
  public target: Id<any> | null;
  public targetPos: RoomPosition | null;
  public priority: number;
  public parent: Task | null = null;
  public fork: Task | null = null;
  public data: { [key: string]: any } = {};

  constructor(taskType: string, target?: RoomObject | null, priority: number = 5) {
    this.taskType = taskType;
    this.target = target ? (target as any).id : null;
    this.targetPos = target ? target.pos : null;
    this.priority = priority;
  }

  /**
   * Check if the task is still valid and can be executed
   */
  abstract isValidTask(): boolean;

  /**
   * Check if the target still exists and is accessible
   */
  abstract isValidTarget(): boolean;

  /**
   * Execute the task for one tick
   * @param creep The creep executing the task
   * @returns true if task should continue, false if complete
   */
  abstract work(creep: Creep): boolean;

  /**
   * Called when the task is completed or cancelled
   */
  finish(): void {
    // Override in subclasses if cleanup is needed
  }

  /**
   * Get the target object from its ID
   */
  protected getTarget<T extends RoomObject>(): T | null {
    if (!this.target) return null;
    return Game.getObjectById(this.target) as T | null;
  }

  /**
   * Move creep to target position
   */
  protected moveToTarget(creep: Creep, range: number = 1): ScreepsReturnCode {
    const target = this.getTarget();
    if (target) {
      return creep.moveTo(target, { 
        visualizePathStyle: { stroke: this.getPathColor() },
        range: range
      });
    } else if (this.targetPos) {
      return creep.moveTo(this.targetPos, { 
        visualizePathStyle: { stroke: this.getPathColor() },
        range: range
      });
    }
    return ERR_INVALID_TARGET;
  }

  /**
   * Get the color for path visualization
   */
  protected getPathColor(): string {
    return '#ffffff';
  }

  /**
   * Chain another task to execute after this one
   */
  public then(nextTask: Task): Task {
    this.parent = nextTask;
    return nextTask;
  }

  /**
   * Fork a task to execute in parallel
   */
  public forkTask(forkTask: Task): Task {
    this.fork = forkTask;
    return this;
  }

  /**
   * Serialize task for memory storage
   */
  public serialize(): TaskMemory {
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
  public static deserialize(memory: TaskMemory): Task | null {
    try {
      const TaskClass = this.getTaskClass(memory.taskType);
      if (!TaskClass) {
        Logger.warn(`Unknown task type: ${memory.taskType}`, 'Task');
        return null;
      }

      // Get target object if it exists
      const target = memory.target ? Game.getObjectById(memory.target) : null;
      
      // Create task instance with proper constructor parameters
      let task: Task;
      
      if (memory.taskType === 'goToRoom') {
        // Special case for TaskGoToRoom which needs targetRoomName parameter
        const targetRoomName = memory.data?.['targetRoomName'] || 'W1N1'; // fallback room
        task = new (TaskClass as any)(targetRoomName, memory.priority);
      } else {
        // Standard case with target object
        task = new (TaskClass as any)(target, memory.priority);
      }
      
      // Override properties from memory (in case constructor logic differs)
      task.taskType = memory.taskType;
      task.target = memory.target;
      task.targetPos = memory.targetPos ? 
        new RoomPosition(memory.targetPos.x, memory.targetPos.y, memory.targetPos.roomName) : null;
      task.priority = memory.priority;
      task.data = memory.data || {};
      
      // Special handling for TaskGoToRoom properties
      if (memory.taskType === 'goToRoom' && memory.data?.['targetRoomName']) {
        (task as any).targetRoomName = memory.data['targetRoomName'];
      }

      // Deserialize parent and fork tasks
      if (memory.parent) {
        task.parent = Task.deserialize(memory.parent);
      }
      if (memory.fork) {
        task.fork = Task.deserialize(memory.fork);
      }

      return task;
    } catch (error) {
      Logger.error(`Error deserializing task: ${error}`, 'Task');
      return null;
    }
  }

  /**
   * Get task class by type name
   */
  private static getTaskClass(taskType: string): typeof Task | null {
    // Import task classes dynamically to avoid circular dependencies
    switch (taskType) {
      case 'build':
        const { TaskBuild } = require('./TaskBuild');
        return TaskBuild;
      case 'repair':
        const { TaskRepair } = require('./TaskRepair');
        return TaskRepair;
      case 'withdraw':
        const { TaskWithdraw } = require('./TaskWithdraw');
        return TaskWithdraw;
      case 'pickup':
        const { TaskPickup } = require('./TaskPickup');
        return TaskPickup;
      case 'transfer':
        const { TaskTransfer } = require('./TaskTransfer');
        return TaskTransfer;
      case 'harvest':
        const { TaskHarvest } = require('./TaskHarvest');
        return TaskHarvest;
      case 'upgrade':
        const { TaskUpgrade } = require('./TaskUpgrade');
        return TaskUpgrade;
      case 'goToRoom':
        const { TaskGoToRoom } = require('./TaskGoToRoom');
        return TaskGoToRoom;
      default:
        return null;
    }
  }

  /**
   * Create a task from memory data
   */
  public static fromMemory(memory: TaskMemory): Task | null {
    return this.deserialize(memory);
  }

  /**
   * Validate that a task chain is still executable
   */
  public static validateTaskChain(task: Task | null): Task | null {
    if (!task) return null;

    // Check if current task is valid
    if (!task.isValidTask() || !task.isValidTarget()) {
      // Task is invalid, try to use parent task
      if (task.parent) {
        return this.validateTaskChain(task.parent);
      }
      return null;
    }

    return task;
  }
}

/**
 * Task memory interface for serialization
 */
export interface TaskMemory {
  taskType: string;
  target: Id<any> | null;
  targetPos: { x: number; y: number; roomName: string } | null;
  priority: number;
  data: { [key: string]: any };
  parent: TaskMemory | null;
  fork: TaskMemory | null;
}
