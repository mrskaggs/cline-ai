import { Kernel } from './kernel/Kernel';
import { SpawnManager } from './managers/SpawnManager';
// Import task system to ensure it's included in the build
import { Task } from './tasks/Task';
import { TaskBuild } from './tasks/TaskBuild';
import { TaskRepair } from './tasks/TaskRepair';
import { TaskWithdraw } from './tasks/TaskWithdraw';
import { TaskPickup } from './tasks/TaskPickup';
import { TaskTransfer } from './tasks/TaskTransfer';
import { TaskUpgrade } from './tasks/TaskUpgrade';
import { TaskHarvest } from './tasks/TaskHarvest';
import { TaskGoToRoom } from './tasks/TaskGoToRoom';
import { TaskManager } from './tasks/TaskManager';

declare const global: NodeJS.Global & { kernel?: Kernel };

// Ensure all task classes are available (prevents tree-shaking)
const TASK_CLASSES = {
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

// Main game loop entry point
export function loop(): void {
  // Initialize the kernel on the global object if it doesn't exist
  if (!global.kernel) {
    global.kernel = new Kernel();
  }
  
  global.kernel.run();
}

// Export task system for dynamic loading
export { TASK_CLASSES, SpawnManager };
