"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const settings_1 = require("../config/settings");
class Logger {
    static log(level, message, context) {
        if (!settings_1.SettingsHelper.shouldLog(level)) {
            return;
        }
        const prefix = context ? `[${context}]` : '';
        const timestamp = Game.time;
        console.log(`${timestamp} ${prefix} ${message}`);
    }
    static debug(message, context) {
        this.log('DEBUG', message, context);
    }
    static info(message, context) {
        this.log('INFO', message, context);
    }
    static warn(message, context) {
        this.log('WARN', message, context);
    }
    static error(message, context) {
        this.log('ERROR', message, context);
    }
    static throttledLog(key, intervalTicks, level, message, context) {
        const now = Game.time;
        const lastTime = this.lastLogTimes[key] || 0;
        if (now - lastTime >= intervalTicks) {
            this.log(level, message, context);
            this.lastLogTimes[key] = now;
        }
    }
    static oncePerTick(key, level, message, context) {
        this.throttledLog(key, 1, level, message, context);
    }
    static logSpawn(role, name, room) {
        if (settings_1.Settings.logging.logSpawning) {
            this.info(`Spawning ${role}: ${name}`, `SpawnManager-${room}`);
        }
    }
    static logCreepAction(creep, action) {
        if (settings_1.Settings.logging.logCreepActions) {
            this.debug(`${creep.name} ${action}`, 'CreepAction');
        }
    }
    static cleanup() {
        const cutoff = Game.time - 1000;
        for (const key in this.lastLogTimes) {
            const lastTime = this.lastLogTimes[key];
            if (lastTime !== undefined && lastTime < cutoff) {
                delete this.lastLogTimes[key];
            }
        }
    }
}
exports.Logger = Logger;
Logger.lastLogTimes = {};
