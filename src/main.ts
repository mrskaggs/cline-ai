import { Kernel } from './kernel/Kernel';

declare const global: NodeJS.Global;

// Initialize the kernel on the global object
if (!global.kernel) {
  global.kernel = new Kernel();
}

// Main game loop entry point
export function loop(): void {
  global.kernel.run();
}
