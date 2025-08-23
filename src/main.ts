import { Kernel } from './kernel/Kernel';

declare const global: NodeJS.Global & { kernel?: Kernel };

// Main game loop entry point
export function loop(): void {
  // Initialize the kernel on the global object if it doesn't exist
  if (!global.kernel) {
    global.kernel = new Kernel();
  }
  
  global.kernel.run();
}
