import { Logger } from '../utils/Logger';

export interface ScoutMemory {
    role: 'scout';
    targetRoom?: string;
    homeRoom: string;
    state: 'idle' | 'moving' | 'positioning' | 'exploring' | 'returning';
    positioningStartTick?: number;
    explorationStartTick?: number;
    arrivalTick?: number;
}

export class Scout {
    public static run(creep: Creep): void {
        try {
            const memory = creep.memory as ScoutMemory;
            
            // Initialize memory if needed
            if (!memory.state) {
                memory.state = 'idle';
                memory.homeRoom = creep.room.name;
                Logger.info(`Scout ${creep.name}: Initialized in ${memory.homeRoom}`);
            }

            // Visual indicator with enhanced states
            const stateEmoji = {
                'idle': '💤',
                'moving': '➡️', 
                'positioning': '📍',  // NEW: Positioning at room center
                'exploring': '🔍',
                'returning': '🏠'
            };
            creep.say(stateEmoji[memory.state]);

            // Enhanced 5-state machine
            switch (memory.state) {
                case 'idle':
                    this.handleIdle(creep);
                    break;
                case 'moving':
                    this.handleMoving(creep);
                    break;
                case 'positioning':  // NEW: Critical positioning phase
                    this.handlePositioning(creep);
                    break;
                case 'exploring':
                    this.handleExploring(creep);
                    break;
                case 'returning':
                    this.handleReturning(creep);
                    break;
            }
        } catch (error) {
            Logger.error(`Scout ${creep.name}: Error - ${error}`);
        }
    }

    private static handleIdle(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        // Find next room to scout with enhanced selection logic
        const targetRoom = this.findNextRoomToScout(creep);
        if (!targetRoom) {
            // No rooms to scout, stay idle
            return;
        }

        memory.targetRoom = targetRoom;
        memory.state = 'moving';
        Logger.info(`Scout ${creep.name}: Starting mission to ${targetRoom}`);
    }

    private static handleMoving(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        if (!memory.targetRoom) {
            memory.state = 'idle';
            return;
        }

        // If we're in the target room, start positioning phase
        if (creep.room.name === memory.targetRoom) {
            memory.state = 'positioning';  // NEW: Go to positioning, not exploring
            memory.arrivalTick = Game.time;
            Logger.info(`Scout ${creep.name}: Arrived at ${memory.targetRoom}, starting positioning phase`);
            return;
        }

        // Move toward target room
        const exitDir = creep.room.findExitTo(memory.targetRoom);
        if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
            Logger.warn(`Scout ${creep.name}: Cannot reach ${memory.targetRoom}, marking as inaccessible`);
            this.markRoomAsInaccessible(memory.targetRoom);
            memory.state = 'idle';
            delete memory.targetRoom;
            return;
        }

        const exit = creep.pos.findClosestByPath(exitDir);
        if (exit) {
            creep.moveTo(exit, { visualizePathStyle: { stroke: '#00ff00' } });
        }
    }

    // NEW: Critical positioning phase - move to center and wait for memory stabilization
    private static handlePositioning(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        // Initialize positioning timer
        if (!memory.positioningStartTick) {
            memory.positioningStartTick = Game.time;
        }

        // Move to room center (25,25) for optimal visibility
        const center = new RoomPosition(25, 25, creep.room.name);
        const distanceToCenter = creep.pos.getRangeTo(center);

        // If not at center, move there
        if (distanceToCenter > 2) {
            creep.moveTo(center, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // Wait at center for memory systems to stabilize (5-10 ticks)
        const positioningTime = Game.time - memory.positioningStartTick;
        const requiredWaitTime = 7; // 7 ticks for memory stabilization

        if (positioningTime < requiredWaitTime) {
            // Still positioning, wait for memory systems to update
            Logger.debug(`Scout ${creep.name}: Positioning at center, waiting ${requiredWaitTime - positioningTime} more ticks`);
            return;
        }

        // Positioning complete, start exploration
        memory.state = 'exploring';
        memory.explorationStartTick = Game.time;
        delete memory.positioningStartTick;
        Logger.info(`Scout ${creep.name}: Positioning complete, starting exploration of ${creep.room.name}`);
    }

    private static handleExploring(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        if (!memory.explorationStartTick) {
            memory.explorationStartTick = Game.time;
        }

        // Enhanced exploration time (10-15 ticks vs old 3 ticks)
        const explorationTime = Game.time - memory.explorationStartTick;
        const requiredExplorationTime = 12; // 12 ticks for thorough intelligence gathering

        if (explorationTime < requiredExplorationTime) {
            // Continue exploring - stay near center for good visibility
            const center = new RoomPosition(25, 25, creep.room.name);
            if (creep.pos.getRangeTo(center) > 3) {
                creep.moveTo(center);
            }
            return;
        }

        // Exploration complete - gather intel and mark as complete
        this.gatherIntel(creep.room);
        this.markExplorationComplete(creep.room.name);  // NEW: Critical for preventing cycling
        
        memory.state = 'returning';
        delete memory.explorationStartTick;
        Logger.info(`Scout ${creep.name}: Completed exploration of ${creep.room.name}, marked as complete`);
    }

    private static handleReturning(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        // If we're home, mission complete
        if (creep.room.name === memory.homeRoom) {
            memory.state = 'idle';
            delete memory.targetRoom;
            delete memory.arrivalTick;
            Logger.info(`Scout ${creep.name}: Returned home, mission complete`);
            return;
        }

        // Move toward home
        const exitDir = creep.room.findExitTo(memory.homeRoom);
        if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
            Logger.error(`Scout ${creep.name}: Cannot find path home to ${memory.homeRoom}`);
            return;
        }

        const exit = creep.pos.findClosestByPath(exitDir);
        if (exit) {
            creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffff00' } });
        }
    }

    // Enhanced room selection with explorationComplete logic
    private static findNextRoomToScout(creep: Creep): string | null {
        const exits = Game.map.describeExits(creep.room.name);
        if (!exits) return null;

        const adjacentRooms = Object.values(exits);
        
        // Priority 1: Rooms with no memory (highest priority)
        for (const roomName of adjacentRooms) {
            const roomMemory = Memory.rooms[roomName];
            if (!roomMemory) {
                Logger.debug(`Scout ${creep.name}: Selected ${roomName} (no memory)`);
                return roomName;
            }
        }

        // Priority 2: Rooms with incomplete exploration
        for (const roomName of adjacentRooms) {
            const roomMemory = Memory.rooms[roomName];
            if (!roomMemory || !roomMemory.scoutData) {
                Logger.debug(`Scout ${creep.name}: Selected ${roomName} (no scout data)`);
                return roomName;
            }

            // Skip if marked as inaccessible
            if (roomMemory.scoutData.inaccessible) {
                continue;
            }

            // NEW: Check explorationComplete flag
            if (!roomMemory.scoutData.explorationComplete) {
                Logger.debug(`Scout ${creep.name}: Selected ${roomName} (incomplete exploration)`);
                return roomName;
            }
        }

        // Priority 3: Rooms with stale data (>1000 ticks)
        for (const roomName of adjacentRooms) {
            const roomMemory = Memory.rooms[roomName];
            if (!roomMemory || !roomMemory.scoutData) continue;

            if (roomMemory.scoutData.inaccessible) continue;

            const age = Game.time - roomMemory.scoutData.lastScouted;
            if (age > 1000) {
                Logger.debug(`Scout ${creep.name}: Selected ${roomName} (stale data, age: ${age})`);
                return roomName;
            }
        }

        Logger.debug(`Scout ${creep.name}: No rooms need scouting`);
        return null; // No rooms need scouting
    }

    // NEW: Mark room exploration as complete to prevent cycling
    private static markExplorationComplete(roomName: string): void {
        if (!Memory.rooms[roomName]) {
            Logger.error(`Scout: Cannot mark exploration complete - no memory for ${roomName}`);
            return;
        }

        if (!Memory.rooms[roomName].scoutData) {
            Logger.error(`Scout: Cannot mark exploration complete - no scout data for ${roomName}`);
            return;
        }

        Memory.rooms[roomName].scoutData!.explorationComplete = true;
        Logger.info(`Scout: Marked ${roomName} exploration as complete`);
    }

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
            if (!roomMemory) return;
            
            // Find sources
            const sources = room.find(FIND_SOURCES);
            
            // Find minerals
            const minerals = room.find(FIND_MINERALS);
            
            // Find hostiles
            const hostiles = room.find(FIND_HOSTILE_CREEPS);
            const hostileStructures = room.find(FIND_HOSTILE_STRUCTURES);
            
            // Find structures
            const structures = room.find(FIND_STRUCTURES);
            const spawns = structures.filter(s => s.structureType === STRUCTURE_SPAWN);
            const towers = structures.filter(s => s.structureType === STRUCTURE_TOWER);

            // Determine room type based on room name pattern
            const roomType = this.determineRoomType(room.name);

            // Initialize scout data with enhanced intelligence
            roomMemory.scoutData = {
                lastScouted: Game.time,
                explorationComplete: false, // Will be set to true after complete exploration
                roomType: roomType,
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
                remoteScore: this.calculateEnhancedScore(sources.length, hostiles.length, hostileStructures.length > 0, roomType),
                inaccessible: false
            };

            // Add mineral data if present
            if (minerals.length > 0 && minerals[0]) {
                roomMemory.scoutData.mineral = {
                    id: minerals[0].id,
                    pos: minerals[0].pos,
                    mineralType: minerals[0].mineralType,
                    density: minerals[0].density
                };
            }

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

            Logger.info(`Scout: Gathered intel for ${room.name} - Type: ${roomType}, Sources: ${sources.length}, Controller: ${!!room.controller}, Hostiles: ${hostiles.length}, Score: ${roomMemory.scoutData.remoteScore}`);
        } catch (error) {
            Logger.error(`Scout: Error gathering intel for ${room.name} - ${error}`);
        }
    }

    private static markRoomAsInaccessible(roomName: string): void {
        if (!Memory.rooms[roomName]) {
            Memory.rooms[roomName] = {
                sources: {},
                spawnIds: [],
                lastUpdated: Game.time,
                rcl: 0
            };
        }

        Memory.rooms[roomName].scoutData = {
            lastScouted: Game.time,
            explorationComplete: true, // Mark as complete to prevent revisiting
            roomType: 'unknown',
            hostileCount: 0,
            hasHostileStructures: false,
            structureCount: 0,
            hasSpawn: false,
            hasTower: false,
            remoteScore: 0,
            inaccessible: true
        };

        Logger.warn(`Scout: Marked ${roomName} as inaccessible`);
    }

    // Enhanced room type determination
    private static determineRoomType(roomName: string): 'normal' | 'highway' | 'center' | 'sourcekeeper' | 'unknown' {
        const match = roomName.match(/^([WE])(\d+)([NS])(\d+)$/);
        if (!match || !match[2] || !match[4]) return 'unknown';

        const x = parseInt(match[2]);
        const y = parseInt(match[4]);

        // Highway rooms (every 10th coordinate)
        if (x % 10 === 0 || y % 10 === 0) {
            return 'highway';
        }

        // Center rooms (5,5 in each sector)
        if (x % 10 === 5 && y % 10 === 5) {
            return 'center';
        }

        // Source keeper rooms (around center rooms)
        const distFromCenter = Math.max(Math.abs((x % 10) - 5), Math.abs((y % 10) - 5));
        if (distFromCenter <= 2 && distFromCenter >= 1) {
            return 'sourcekeeper';
        }

        return 'normal';
    }

    // Enhanced scoring system
    private static calculateEnhancedScore(sourceCount: number, hostileCount: number, hasHostileStructures: boolean, roomType: string): number {
        let score = sourceCount * 40; // Base score from sources (increased from 30)
        
        // Room type modifiers
        switch (roomType) {
            case 'normal':
                score += 20; // Bonus for normal rooms (safest)
                break;
            case 'highway':
                score -= 30; // Penalty for highway rooms (dangerous)
                break;
            case 'center':
                score -= 50; // Penalty for center rooms (very dangerous)
                break;
            case 'sourcekeeper':
                score -= 40; // Penalty for SK rooms (dangerous)
                break;
        }
        
        // Threat penalties
        score -= hostileCount * 25; // Penalty for hostiles (increased from 20)
        if (hasHostileStructures) score -= 60; // Penalty for hostile structures (increased from 50)
        
        return Math.max(0, score);
    }

    public static getBodyParts(energyAvailable: number): BodyPartConstant[] {
        // Enhanced scout body - still minimal but with better movement
        if (energyAvailable >= 100) {
            return [MOVE, MOVE]; // Faster movement for better efficiency
        } else if (energyAvailable >= 50) {
            return [MOVE];
        }
        return [];
    }
}
