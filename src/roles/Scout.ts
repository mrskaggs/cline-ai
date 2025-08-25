import { Logger } from '../utils/Logger';

export interface ScoutMemory {
    role: 'scout';
    targetRoom?: string;
    homeRoom: string;
    scoutingPhase: 'moving' | 'exploring' | 'returning';
    lastExplored?: number;
    arrivalTick?: number;
}

export class Scout {
    public static run(creep: Creep): void {
        try {
            const memory = creep.memory as ScoutMemory;
            
            // CRITICAL: Cache room name at start of tick to detect race conditions
            const currentRoomName = creep.room.name;
            const currentTick = Game.time;
            
            // Initialize scout memory if needed
            if (!memory.scoutingPhase) {
                memory.scoutingPhase = 'moving';
                memory.homeRoom = currentRoomName;
                console.log(`Scout ${creep.name}: Initialized - Home: ${memory.homeRoom}, Phase: ${memory.scoutingPhase}`);
            }

            // Visual indicator with phase
            const phaseEmoji = memory.scoutingPhase === 'moving' ? '➡️' : 
                              memory.scoutingPhase === 'exploring' ? '🔍' : '🏠';
            creep.say(phaseEmoji);

            // Debug logging every 10 ticks with race condition detection
            if (currentTick % 10 === 0) {
                const roomNameCheck = creep.room.name;
                if (roomNameCheck !== currentRoomName) {
                    console.log(`Scout ${creep.name}: RACE CONDITION DETECTED! Room name changed within tick: ${currentRoomName} -> ${roomNameCheck}`);
                }
                console.log(`Scout ${creep.name}: Phase=${memory.scoutingPhase}, Room=${currentRoomName}, Target=${memory.targetRoom || 'none'}, Home=${memory.homeRoom}`);
            }

            // Pass cached room name to methods to prevent race conditions
            switch (memory.scoutingPhase) {
                case 'moving':
                    this.moveToTarget(creep, currentRoomName);
                    break;
                case 'exploring':
                    this.exploreRoom(creep, currentRoomName);
                    break;
                case 'returning':
                    this.returnHome(creep, currentRoomName);
                    break;
            }
        } catch (error) {
            console.log(`Scout ${creep.name}: ERROR in run - ${error}`);
            Logger.error(`Scout ${creep.name}: Error in run - ${error}`);
        }
    }

    private static moveToTarget(creep: Creep, _currentRoomName: string): void {
        const memory = creep.memory as ScoutMemory;
        
        if (!memory.targetRoom) {
            console.log(`Scout ${creep.name}: No target room, finding next room to scout...`);
            // Find next room to scout
            const nextRoom = this.findNextRoomToScout(creep);
            if (!nextRoom) {
                console.log(`Scout ${creep.name}: No rooms available to scout, returning home`);
                Logger.warn(`Scout ${creep.name}: No rooms to scout, returning home`);
                memory.scoutingPhase = 'returning';
                return;
            }
            memory.targetRoom = nextRoom;
            console.log(`Scout ${creep.name}: Selected target room: ${nextRoom}`);
        }

        // Move to target room
        if (creep.room.name !== memory.targetRoom) {
            console.log(`Scout ${creep.name}: Moving from ${creep.room.name} to ${memory.targetRoom}`);
            const exitDir = creep.room.findExitTo(memory.targetRoom);
            if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
                console.log(`Scout ${creep.name}: Cannot find path to ${memory.targetRoom} (error: ${exitDir}), marking as inaccessible`);
                Logger.warn(`Scout ${creep.name}: Cannot find path to ${memory.targetRoom}, marking as inaccessible`);
                // Mark room as inaccessible so we don't keep trying
                this.markRoomAsInaccessible(memory.targetRoom);
                delete memory.targetRoom;
                return;
            }

            const exit = creep.pos.findClosestByPath(exitDir);
            if (exit) {
                const distanceToExit = creep.pos.getRangeTo(exit);
                const moveResult = creep.moveTo(exit, { visualizePathStyle: { stroke: '#00ff00' } });
                if (moveResult !== OK) {
                    console.log(`Scout ${creep.name}: Move failed with result: ${moveResult}, distance to exit: ${distanceToExit}`);
                } else {
                    console.log(`Scout ${creep.name}: Moving towards exit at ${exit.x},${exit.y} to reach ${memory.targetRoom}, distance: ${distanceToExit}`);
                    
                    // Check if we're stuck at the exit
                    if (distanceToExit <= 1) {
                        console.log(`Scout ${creep.name}: At exit but still in ${creep.room.name}, checking for obstacles`);
                        const terrain = creep.room.getTerrain();
                        const exitTerrain = terrain.get(exit.x, exit.y);
                        console.log(`Scout ${creep.name}: Exit terrain at ${exit.x},${exit.y}: ${exitTerrain === TERRAIN_MASK_WALL ? 'WALL' : exitTerrain === TERRAIN_MASK_SWAMP ? 'SWAMP' : 'PLAIN'}`);
                        
                        // Check for blocking creeps
                        const blockingCreeps = creep.room.lookForAt(LOOK_CREEPS, exit.x, exit.y);
                        if (blockingCreeps.length > 0 && blockingCreeps[0]) {
                            console.log(`Scout ${creep.name}: Exit blocked by creep: ${blockingCreeps[0].name}`);
                        }
                        
                        // Check for blocking structures
                        const blockingStructures = creep.room.lookForAt(LOOK_STRUCTURES, exit.x, exit.y);
                        if (blockingStructures.length > 0 && blockingStructures[0]) {
                            console.log(`Scout ${creep.name}: Exit blocked by structure: ${blockingStructures[0].structureType}`);
                        }
                    }
                }
            } else {
                console.log(`Scout ${creep.name}: Could not find exit to ${memory.targetRoom}`);
            }
            // Don't switch to exploring until we're actually in the target room
        } else {
            // Room name matches target - add delay before switching to exploration
            console.log(`Scout ${creep.name}: Arrived at target room ${memory.targetRoom}, waiting to ensure stable position`);
            
            // Add a small delay to ensure the creep is fully in the room
            if (!memory.arrivalTick) {
                memory.arrivalTick = Game.time;
                console.log(`Scout ${creep.name}: Recording arrival at tick ${Game.time}`);
                return;
            }
            
            // Wait at least 2 ticks to ensure stable room transition
            const ticksInRoom = Game.time - memory.arrivalTick;
            if (ticksInRoom < 2) {
                console.log(`Scout ${creep.name}: Waiting for stable position (${ticksInRoom}/2 ticks)`);
                return;
            }
            
            // Final verification before switching to exploration
            if (creep.room.name === memory.targetRoom) {
                console.log(`Scout ${creep.name}: Confirmed stable arrival at ${memory.targetRoom} after ${ticksInRoom} ticks, switching to exploration`);
                memory.scoutingPhase = 'exploring';
                delete memory.lastExplored; // Reset exploration timer for new room
                delete memory.arrivalTick; // Clean up arrival tracking
                Logger.info(`Scout ${creep.name}: Arrived at ${memory.targetRoom}, beginning exploration`);
            } else {
                console.log(`Scout ${creep.name}: Room mismatch after ${ticksInRoom} ticks - Current: ${creep.room.name}, Target: ${memory.targetRoom}`);
                console.log(`Scout ${creep.name}: Resetting arrival tracking and continuing movement`);
                delete memory.arrivalTick;
                return;
            }
        }
    }

    private static exploreRoom(creep: Creep, _currentRoomName: string): void {
        const memory = creep.memory as ScoutMemory;
        const room = creep.room;

        // CRITICAL: Verify we're in the target room before exploring
        if (memory.targetRoom && room.name !== memory.targetRoom) {
            console.log(`Scout ${creep.name}: ERROR - In exploration phase but in wrong room! Current: ${room.name}, Target: ${memory.targetRoom}`);
            console.log(`Scout ${creep.name}: Switching back to moving phase to reach target room`);
            memory.scoutingPhase = 'moving';
            delete memory.lastExplored; // Reset exploration timer
            return;
        }

        // Initialize exploration start time if not set
        if (!memory.lastExplored) {
            memory.lastExplored = Game.time;
            console.log(`Scout ${creep.name}: Starting exploration of ${room.name} at tick ${Game.time} (Target: ${memory.targetRoom})`);
            // Gather room intelligence only once at start of exploration
            this.gatherRoomIntelligence(room, false); // Don't update lastScouted yet
        }

        // Move to center of room to maximize vision
        const centerPos = new RoomPosition(25, 25, room.name);
        const distanceToCenter = creep.pos.getRangeTo(centerPos);
        
        if (distanceToCenter > 3) {
            // Still moving to center
            console.log(`Scout ${creep.name}: Moving to center of ${room.name}, distance: ${distanceToCenter}`);
            creep.moveTo(centerPos, { visualizePathStyle: { stroke: '#00ff00' } });
        } else {
            // At center, wait a few ticks to ensure full room visibility
            const explorationTime = Game.time - memory.lastExplored;
            console.log(`Scout ${creep.name}: At center of ${room.name}, exploration time: ${explorationTime}/5 ticks`);
            
            if (explorationTime >= 5) {
                // Exploration complete - NOW mark room as fully scouted
                console.log(`Scout ${creep.name}: Exploration complete for ${room.name}, gathering final intelligence and returning home`);
                this.gatherRoomIntelligence(room, true); // Update lastScouted timestamp
                memory.scoutingPhase = 'returning';
                Logger.info(`Scout ${creep.name}: Completed exploration of ${room.name}`);
            }
            // Stay put while exploring
        }
    }

    private static returnHome(creep: Creep, _currentRoomName: string): void {
        const memory = creep.memory as ScoutMemory;
        
        if (creep.room.name !== memory.homeRoom) {
            console.log(`Scout ${creep.name}: Returning home from ${creep.room.name} to ${memory.homeRoom}`);
            const exitDir = creep.room.findExitTo(memory.homeRoom);
            if (exitDir === ERR_NO_PATH || exitDir === ERR_INVALID_ARGS) {
                console.log(`Scout ${creep.name}: ERROR - Cannot find path home to ${memory.homeRoom} (error: ${exitDir})`);
                Logger.error(`Scout ${creep.name}: Cannot find path home to ${memory.homeRoom}`);
                return;
            }

            const exit = creep.pos.findClosestByPath(exitDir);
            if (exit) {
                const moveResult = creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffff00' } });
                if (moveResult !== OK) {
                    console.log(`Scout ${creep.name}: Move home failed with result: ${moveResult}`);
                } else {
                    console.log(`Scout ${creep.name}: Moving towards home exit at ${exit.x},${exit.y}`);
                }
            } else {
                console.log(`Scout ${creep.name}: Could not find exit towards home room ${memory.homeRoom}`);
            }
        } else {
            // Back home, find next target
            console.log(`Scout ${creep.name}: Successfully returned home to ${memory.homeRoom}, resetting for next mission`);
            delete memory.targetRoom;
            memory.scoutingPhase = 'moving';
            Logger.info(`Scout ${creep.name}: Returned home, ready for next mission`);
        }
    }

    private static findNextRoomToScout(creep: Creep): string | undefined {
        const homeRoom = creep.room;
        const exits = Game.map.describeExits(homeRoom.name);
        
        if (!exits) return undefined;

        // Find unscounted or stale rooms
        const roomsToCheck = Object.values(exits);
        
        Logger.info(`Scout ${creep.name}: Checking rooms for scouting: ${roomsToCheck.join(', ')}`);
        
        for (const roomName of roomsToCheck) {
            const roomMemory = Memory.rooms[roomName];
            
            if (!roomMemory) {
                Logger.info(`Scout ${creep.name}: Selected ${roomName} - no memory exists`);
                return roomName;
            }
            
            if (!roomMemory.scoutData) {
                Logger.info(`Scout ${creep.name}: Selected ${roomName} - no scout data exists`);
                return roomName;
            }
            
            // NEW: Check if exploration is actually complete
            if (!roomMemory.scoutData.explorationComplete) {
                Logger.info(`Scout ${creep.name}: Selected ${roomName} - exploration not complete`);
                return roomName;
            }
            
            const age = Game.time - roomMemory.scoutData.lastScouted;
            if (age >= 1000) {
                Logger.info(`Scout ${creep.name}: Selected ${roomName} - last scouted ${age} ticks ago`);
                return roomName;
            }
            
            // Skip if known to be inaccessible
            if (roomMemory.scoutData.inaccessible) {
                Logger.info(`Scout ${creep.name}: Skipping ${roomName} - marked as inaccessible`);
                continue;
            }
            
            Logger.info(`Scout ${creep.name}: Skipping ${roomName} - recently scouted and complete (${age} ticks ago)`);
        }

        Logger.warn(`Scout ${creep.name}: No rooms available for scouting`);
        return undefined;
    }

    private static gatherRoomIntelligence(room: Room, updateLastScouted: boolean = true): void {
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
            
            if (!roomMemory.scoutData) {
                roomMemory.scoutData = {
                    lastScouted: Game.time,
                    roomType: 'unknown',
                    hostileCount: 0,
                    hasHostileStructures: false,
                    structureCount: 0,
                    hasSpawn: false,
                    hasTower: false,
                    remoteScore: 0,
                    explorationComplete: false
                };
            }

            const scoutData = roomMemory.scoutData;
            if (!scoutData) return;

            // Only update lastScouted timestamp and mark complete when exploration is finished
            if (updateLastScouted) {
                scoutData.lastScouted = Game.time;
                scoutData.explorationComplete = true;
            }

            // Basic room info
            scoutData.roomType = this.determineRoomType(room.name);
            
            // Sources - populate both scout data and main room sources
            const sources = room.find(FIND_SOURCES);
            scoutData.sources = sources.map(source => ({
                id: source.id,
                pos: source.pos,
                energyCapacity: source.energyCapacity
            }));
            
            // Also populate main room sources structure for other systems
            for (const source of sources) {
                roomMemory.sources[source.id] = {
                    pos: source.pos,
                    energyCapacity: source.energyCapacity,
                    lastUpdated: Game.time
                };
            }

            // Minerals
            const minerals = room.find(FIND_MINERALS);
            if (minerals.length > 0 && minerals[0]) {
                scoutData.mineral = {
                    id: minerals[0].id,
                    pos: minerals[0].pos,
                    mineralType: minerals[0].mineralType,
                    density: minerals[0].density
                };
            }

            // Controller info
            if (room.controller) {
                const controllerData: any = {
                    id: room.controller.id,
                    pos: room.controller.pos,
                    level: room.controller.level
                };
                
                if (room.controller.owner) {
                    controllerData.owner = room.controller.owner.username;
                }
                
                if (room.controller.reservation) {
                    controllerData.reservation = {
                        username: room.controller.reservation.username,
                        ticksToEnd: room.controller.reservation.ticksToEnd
                    };
                }
                
                scoutData.controller = controllerData;
            }

            // Hostiles
            const hostiles = room.find(FIND_HOSTILE_CREEPS);
            scoutData.hostileCount = hostiles.length;
            scoutData.hasHostileStructures = room.find(FIND_HOSTILE_STRUCTURES).length > 0;

            // Structures of interest
            const structures = room.find(FIND_STRUCTURES);
            scoutData.structureCount = structures.length;
            scoutData.hasSpawn = structures.some(s => s.structureType === STRUCTURE_SPAWN);
            scoutData.hasTower = structures.some(s => s.structureType === STRUCTURE_TOWER);

            // Calculate room score for remote mining potential
            scoutData.remoteScore = this.calculateRemoteScore(scoutData);

            Logger.info(`Scout: Gathered intelligence for ${room.name} - Sources: ${sources.length}, Score: ${scoutData.remoteScore}`);
        } catch (error) {
            Logger.error(`Scout: Error gathering intelligence for ${room.name} - ${error}`);
        }
    }

    private static determineRoomType(roomName: string): string {
        const parsed = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(roomName);
        if (!parsed || parsed.length < 5 || !parsed[2] || !parsed[4]) return 'unknown';

        const x = parseInt(parsed[2], 10);
        const y = parseInt(parsed[4], 10);

        if (x % 10 === 0 || y % 10 === 0) {
            return 'highway';
        } else if (x % 10 === 5 && y % 10 === 5) {
            return 'center';
        } else if ((x % 10 === 4 || x % 10 === 6) && (y % 10 === 4 || y % 10 === 6)) {
            return 'sourceKeeper';
        } else {
            return 'normal';
        }
    }

    private static calculateRemoteScore(scoutData: any): number {
        let score = 0;

        // Base score from sources
        score += (scoutData.sources?.length || 0) * 30;

        // Penalty for hostiles
        score -= (scoutData.hostileCount || 0) * 20;
        if (scoutData.hasHostileStructures) score -= 50;

        // Penalty for owned rooms
        if (scoutData.controller?.owner) score -= 100;

        // Bonus for reserved by us (if we implement reserving)
        if (scoutData.controller?.reservation && 
            scoutData.controller.reservation.username === 'YourUsername') {
            score += 20;
        }

        // Penalty for source keeper rooms
        if (scoutData.roomType === 'sourceKeeper') score -= 30;

        // Bonus for mineral
        if (scoutData.mineral) score += 10;

        return Math.max(0, score);
    }

    private static markRoomAsInaccessible(roomName: string): void {
        try {
            // Initialize room memory if needed
            if (!Memory.rooms[roomName]) {
                Memory.rooms[roomName] = {
                    sources: {},
                    spawnIds: [],
                    lastUpdated: Game.time,
                    rcl: 0
                };
            }

            const roomMemory = Memory.rooms[roomName];
            if (!roomMemory) return;
            
            if (!roomMemory.scoutData) {
                roomMemory.scoutData = {
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
            } else {
                roomMemory.scoutData.inaccessible = true;
                roomMemory.scoutData.lastScouted = Game.time;
            }

            Logger.warn(`Scout: Marked room ${roomName} as inaccessible`);
        } catch (error) {
            Logger.error(`Scout: Error marking room ${roomName} as inaccessible - ${error}`);
        }
    }

    public static getBodyParts(energyAvailable: number): BodyPartConstant[] {
        // Scout needs minimal body - just movement
        if (energyAvailable >= 100) {
            return [MOVE, MOVE]; // Fast scout
        } else if (energyAvailable >= 50) {
            return [MOVE]; // Basic scout
        }
        
        return []; // Not enough energy
    }
}
