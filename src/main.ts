import { Kernel } from './kernel/Kernel';
// Import all roles to ensure they're included in the build
import { Scout } from './roles/Scout';
import { Hauler } from './roles/Hauler';
import { Builder } from './roles/Builder';
import { Upgrader } from './roles/Upgrader';
import { Harvester } from './roles/Harvester';

declare const global: NodeJS.Global & { kernel?: Kernel };

// Ensure all role classes are available (prevents tree-shaking)
const ROLE_CLASSES = {
  Scout,
  Hauler,
  Builder,
  Upgrader,
  Harvester
};

// Main game loop entry point
export function loop(): void {
  // Initialize the kernel on the global object if it doesn't exist
  if (!global.kernel) {
    global.kernel = new Kernel();
  }
  
  global.kernel.run();
}

// Export role classes for dynamic loading
export { ROLE_CLASSES };
