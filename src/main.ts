import { Kernel } from './kernel/Kernel';
// Import all roles to ensure they're included in the build
import { Scout } from './roles/Scout';
import { Hauler } from './roles/Hauler';
import { Builder } from './roles/Builder';
import { Upgrader } from './roles/Upgrader';
import { Harvester } from './roles/Harvester';

declare const global: NodeJS.Global & { kernel?: Kernel };

// Main game loop entry point
export function loop(): void {
  // Initialize the kernel on the global object if it doesn't exist
  if (!global.kernel) {
    global.kernel = new Kernel();
  }
  
  global.kernel.run();
}
