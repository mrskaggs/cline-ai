import { Settings, SettingsHelper } from '../config/settings';

export class Logger {
  private static lastLogTimes: { [key: string]: number } = {};

  public static log(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, context?: string): void {
    if (!SettingsHelper.shouldLog(level)) {
      return;
    }

    const prefix = context ? `[${context}]` : '';
    const timestamp = Game.time;
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  public static debug(message: string, context?: string): void {
    this.log('DEBUG', message, context);
  }

  public static info(message: string, context?: string): void {
    this.log('INFO', message, context);
  }

  public static warn(message: string, context?: string): void {
    this.log('WARN', message, context);
  }

  public static error(message: string, context?: string): void {
    this.log('ERROR', message, context);
  }

  // Throttled logging - only log once per specified interval
  public static throttledLog(
    key: string, 
    intervalTicks: number, 
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', 
    message: string, 
    context?: string
  ): void {
    const now = Game.time;
    const lastTime = this.lastLogTimes[key] || 0;
    
    if (now - lastTime >= intervalTicks) {
      this.log(level, message, context);
      this.lastLogTimes[key] = now;
    }
  }

  // Log only once per game tick for the same key
  public static oncePerTick(key: string, level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, context?: string): void {
    this.throttledLog(key, 1, level, message, context);
  }

  // Log spawn events with throttling
  public static logSpawn(role: string, name: string, room: string): void {
    if (Settings.logging.logSpawning) {
      this.info(`Spawning ${role}: ${name}`, `SpawnManager-${room}`);
    }
  }

  // Log creep actions with throttling (if enabled)
  public static logCreepAction(creep: Creep, action: string): void {
    if (Settings.logging.logCreepActions) {
      this.debug(`${creep.name} ${action}`, 'CreepAction');
    }
  }

  // Clean up old throttled log entries
  public static cleanup(): void {
    const cutoff = Game.time - 1000; // Keep entries for 1000 ticks
    for (const key in this.lastLogTimes) {
      const lastTime = this.lastLogTimes[key];
      if (lastTime !== undefined && lastTime < cutoff) {
        delete this.lastLogTimes[key];
      }
    }
  }
}
