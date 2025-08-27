import { Logger } from '../utils/Logger';

/**
 * StorageManager handles centralized energy storage operations for RCL 4+ rooms
 * Integrates with existing Hauler role to optimize energy distribution
 */
export class StorageManager {
    /**
     * Main storage management execution for a room
     */
    public static run(room: Room): void {
        try {
            if (room.controller && room.controller.level >= 4) {
                this.manageStorage(room);
                this.optimizeEnergyFlow(room);
            }
        } catch (error) {
            Logger.error(`StorageManager: Error in room ${room.name}: ${error}`);
        }
    }

    /**
     * Manages storage operations and maintenance
     */
    private static manageStorage(room: Room): void {
        const storage = room.storage;
        if (!storage) {
            Logger.debug(`StorageManager: No storage found in room ${room.name}`);
            return;
        }

        // Update room memory with storage info
        if (!room.memory.storage) {
            room.memory.storage = {
                id: storage.id,
                lastUpdated: Game.time,
                energyLevel: storage.store.energy,
                capacity: storage.store.getCapacity(RESOURCE_ENERGY)
            };
            Logger.info(`StorageManager: Storage registered in room ${room.name}`);
        }

        // Update storage metrics
        room.memory.storage.energyLevel = storage.store.energy;
        room.memory.storage.lastUpdated = Game.time;

        // Log storage status periodically
        if (Game.time % 100 === 0) {
            const fillPercent = Math.round((storage.store.energy / storage.store.getCapacity(RESOURCE_ENERGY)) * 100);
            Logger.info(`StorageManager: Room ${room.name} storage at ${fillPercent}% (${storage.store.energy}/${storage.store.getCapacity(RESOURCE_ENERGY)})`);
        }
    }

    /**
     * Optimizes energy flow between storage and other structures
     */
    private static optimizeEnergyFlow(room: Room): void {
        const storage = room.storage;
        if (!storage) return;

        // Determine if we should prioritize filling or emptying storage
        const energyLevel = storage.store.energy;
        const capacity = storage.store.getCapacity(RESOURCE_ENERGY);
        const fillPercent = energyLevel / capacity;

        // Update room memory with energy flow strategy
        if (!room.memory.energyStrategy) {
            room.memory.energyStrategy = {
                mode: 'balanced',
                lastUpdated: Game.time
            };
        }

        // Determine energy strategy based on storage level
        let newMode: 'collect' | 'distribute' | 'balanced' = 'balanced';
        if (fillPercent > 0.8) {
            newMode = 'distribute'; // Focus on using energy from storage
        } else if (fillPercent < 0.2) {
            newMode = 'collect'; // Focus on filling storage
        }

        // Update strategy if changed
        if (room.memory.energyStrategy.mode !== newMode) {
            room.memory.energyStrategy.mode = newMode;
            room.memory.energyStrategy.lastUpdated = Game.time;
            Logger.info(`StorageManager: Room ${room.name} energy strategy changed to ${newMode} (${Math.round(fillPercent * 100)}% full)`);
        }
    }

    /**
     * Gets the current energy strategy for a room
     */
    public static getEnergyStrategy(room: Room): 'collect' | 'distribute' | 'balanced' {
        return (room.memory.energyStrategy && room.memory.energyStrategy.mode) || 'balanced';
    }

    /**
     * Determines if storage should be prioritized for energy collection
     */
    public static shouldPrioritizeStorage(room: Room): boolean {
        const strategy = this.getEnergyStrategy(room);
        return strategy === 'distribute';
    }

    /**
     * Determines if containers should be prioritized over storage
     */
    public static shouldPrioritizeContainers(room: Room): boolean {
        const strategy = this.getEnergyStrategy(room);
        return strategy === 'collect';
    }

    /**
     * Gets optimal energy targets for haulers based on current strategy
     */
    public static getOptimalEnergyTargets(room: Room): Structure[] {
        const strategy = this.getEnergyStrategy(room);
        const targets: Structure[] = [];

        // Always include spawn and extensions as high priority
        const spawns = room.find(FIND_MY_SPAWNS);
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_EXTENSION
        });

        targets.push(...spawns, ...extensions);

        // Add towers
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_TOWER
        });
        targets.push(...towers);

        // Add storage based on strategy
        if (room.storage && strategy !== 'collect') {
            targets.push(room.storage);
        }

        return targets.filter(target => {
            // Check if structure has energy capacity (spawn, extension, tower, storage)
            try {
                const structureWithStore = target as StructureSpawn | StructureExtension | StructureTower | StructureStorage;
                return structureWithStore.store && structureWithStore.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            } catch {
                return false;
            }
        });
    }

    /**
     * Gets optimal energy sources for haulers based on current strategy
     * FIXED: Excludes controller containers - haulers should only deliver to them, not collect from them
     */
    public static getOptimalEnergySources(room: Room): Structure[] {
        const strategy = this.getEnergyStrategy(room);
        const sources: Structure[] = [];

        // Source containers only (exclude controller containers)
        const containers = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                if (structure.structureType !== STRUCTURE_CONTAINER || structure.store.energy === 0) {
                    return false;
                }
                
                // Exclude controller containers - haulers should only deliver to them, not take from them
                if (room.controller) {
                    const distanceToController = structure.pos.getRangeTo(room.controller);
                    if (distanceToController <= 3) {
                        return false; // This is a controller container, skip it
                    }
                }
                
                return true;
            }
        });
        sources.push(...containers);

        // Add storage based on strategy
        if (room.storage && strategy !== 'collect' && room.storage.store.energy > 0) {
            sources.push(room.storage);
        }

        // Add dropped energy
        const droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
            filter: (resource) => resource.resourceType === RESOURCE_ENERGY
        });
        sources.push(...droppedEnergy as any);

        return sources;
    }

    /**
     * Calculates storage efficiency metrics
     */
    public static getStorageMetrics(room: Room): StorageMetrics | null {
        const storage = room.storage;
        if (!storage) return null;

        const energyLevel = storage.store.energy;
        const capacity = storage.store.getCapacity(RESOURCE_ENERGY);
        const fillPercent = energyLevel / capacity;

        return {
            energyLevel,
            capacity,
            fillPercent,
            strategy: this.getEnergyStrategy(room),
            lastUpdated: (room.memory.storage && room.memory.storage.lastUpdated) || Game.time
        };
    }
}

/**
 * Storage metrics interface
 */
interface StorageMetrics {
    energyLevel: number;
    capacity: number;
    fillPercent: number;
    strategy: 'collect' | 'distribute' | 'balanced';
    lastUpdated: number;
}
