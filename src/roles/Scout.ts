import { Logger } from '../utils/Logger';

export interface ScoutMemory {
    role: 'scout';
    targetRoom?: string;
    homeRoom: string;
    state: 'idle' | 'moving' | 'exploring' | 'returning';
    explorationStartTick?: number;
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

            // Visual indicator
            const stateEmoji = {
                'idle': '💤',
                'moving': '➡️', 
                'exploring': '🔍',
                'returning': '🏠'
            };
            creep.say(stateEmoji[memory.state]);

            // State machine
            switch (memory.state) {
                case 'idle':
                    this.handleIdle(creep);
                    break;
                case 'moving':
                    this.handleMoving(creep);
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
        
        // Find next room to scout
        const targetRoom = this.findNextRoom(creep);
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

        // If we're in the target room, start exploring
        if (creep.room.name === memory.targetRoom) {
            memory.state = 'exploring';
            memory.explorationStartTick = Game.time;
            Logger.info(`Scout ${creep.name}: Arrived at ${memory.targetRoom}, starting exploration`);
            return;
        }

        // Move toward target room
        const exitDir = creep.room.findExitTo(memory.targetRoom);
        if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
            Logger.warn(`Scout ${creep.name}: Cannot reach ${memory.targetRoom}, marking as inaccessible`);
            this.markRoomInaccessible(memory.targetRoom);
            memory.state = 'idle';
            delete memory.targetRoom;
            return;
        }

        const exit = creep.pos.findClosestByPath(exitDir);
        if (exit) {
            creep.moveTo(exit, { visualizePathStyle: { stroke: '#00ff00' } });
        }
    }

    private static handleExploring(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        if (!memory.explorationStartTick) {
            memory.explorationStartTick = Game.time;
        }

        // Explore for 3 ticks to gather intel
        const explorationTime = Game.time - memory.explorationStartTick;
        if (explorationTime < 3) {
            // Move to center for better vision
            const center = new RoomPosition(25, 25, creep.room.name);
            if (creep.pos.getRangeTo(center) > 5) {
                creep.moveTo(center);
            }
            return;
        }

        // Exploration complete - gather intel and return home
        this.gatherIntel(creep.room);
        memory.state = 'returning';
        delete memory.explorationStartTick;
        Logger.info(`Scout ${creep.name}: Completed exploration of ${creep.room.name}`);
    }

    private static handleReturning(creep: Creep): void {
        const memory = creep.memory as ScoutMemory;
        
        // If we're home, mission complete
        if (creep.room.name === memory.homeRoom) {
            memory.state = 'idle';
            delete memory.targetRoom;
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

    private static findNextRoom(creep: Creep): string | null {
        const exits = Game.map.describeExits(creep.room.name);
        if (!exits) return null;

        const adjacentRooms = Object.values(exits);
        
        // Find rooms that need scouting
        for (const roomName of adjacentRooms) {
            const roomMemory = Memory.rooms[roomName];
            
            // Scout if no memory exists
            if (!roomMemory) {
                return roomName;
            }

            // Scout if no scout data exists
            if (!roomMemory.scoutData) {
                return roomName;
            }

            // Skip if marked as inaccessible
            if (roomMemory.scoutData.inaccessible) {
                continue;
            }

            // Scout if data is old (>1000 ticks)
            const age = Game.time - roomMemory.scoutData.lastScouted;
            if (age > 1000) {
                return roomName;
            }
        }

        return null; // No rooms need scouting
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

            // Initialize scout data with proper types
            roomMemory.scoutData = {
                lastScouted: Game.time,
                roomType: 'normal', // Will be determined by room name pattern
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
                remoteScore: this.calculateSimpleScore(sources.length, hostiles.length, hostileStructures.length > 0),
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

            // Populate sources for other systems
            for (const source of sources) {
                roomMemory.sources[source.id] = {
                    pos: source.pos,
                    energyCapacity: source.energyCapacity,
                    lastUpdated: Game.time
                };
            }

            Logger.info(`Scout: Gathered intel for ${room.name} - Sources: ${sources.length}, Controller: ${!!room.controller}, Hostiles: ${hostiles.length}`);
        } catch (error) {
            Logger.error(`Scout: Error gathering intel for ${room.name} - ${error}`);
        }
    }

    private static markRoomInaccessible(roomName: string): void {
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

    private static calculateSimpleScore(sourceCount: number, hostileCount: number, hasHostileStructures: boolean): number {
        let score = sourceCount * 30; // Base score from sources
        score -= hostileCount * 20; // Penalty for hostiles
        if (hasHostileStructures) score -= 50; // Penalty for hostile structures
        return Math.max(0, score);
    }

    public static getBodyParts(energyAvailable: number): BodyPartConstant[] {
        // Simple scout - just needs to move
        if (energyAvailable >= 50) {
            return [MOVE];
        }
        return [];
    }
}
