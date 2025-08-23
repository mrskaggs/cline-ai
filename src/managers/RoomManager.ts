import { Logger } from '../utils/Logger';

export class RoomManager {
  public run(): void {
    // Process all owned rooms
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (room && room.controller && room.controller.my) {
        this.processRoom(room);
      }
    }
  }

  private processRoom(room: Room): void {
    try {
      // Initialize room memory if needed
      this.initializeRoomMemory(room);

      // Update room information
      this.updateRoomMemory(room);

      // Run basic defense (towers)
      this.runDefense(room);

    } catch (error) {
      Logger.error(`Error processing room ${room.name}: ${error}`, 'RoomManager');
    }
  }

  private initializeRoomMemory(room: Room): void {
    if (!Memory.rooms[room.name]) {
      Memory.rooms[room.name] = {
        sources: {},
        spawnIds: [],
        lastUpdated: Game.time,
        rcl: room.controller ? room.controller.level : 0,
      };

      if (room.controller) {
        Memory.rooms[room.name]!.controllerId = room.controller.id;
      }
    }
  }

  private updateRoomMemory(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;
    
    // Update RCL
    roomMemory.rcl = room.controller ? room.controller.level : 0;
    
    // Update last updated timestamp
    roomMemory.lastUpdated = Game.time;

    // Update sources information
    this.updateSourcesMemory(room);

    // Update spawns
    this.updateSpawnsMemory(room);
  }

  private updateSourcesMemory(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;
    
    const sources = room.find(FIND_SOURCES);

    for (const source of sources) {
      if (!roomMemory.sources[source.id]) {
        roomMemory.sources[source.id] = {};
      }

      // Check for containers near the source
      const containers = source.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER,
      }) as StructureContainer[];

        if (containers.length > 0 && roomMemory.sources[source.id] && containers[0]) {
          roomMemory.sources[source.id]!.containerId = containers[0].id;
        }

      // Check for links near the source
      const links = source.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: (structure) => structure.structureType === STRUCTURE_LINK,
      }) as StructureLink[];

        if (links.length > 0 && roomMemory.sources[source.id] && links[0]) {
          roomMemory.sources[source.id]!.linkId = links[0].id;
        }
    }
  }

  private updateSpawnsMemory(room: Room): void {
    const roomMemory = Memory.rooms[room.name];
    if (!roomMemory) return;
    
    const spawns = room.find(FIND_MY_SPAWNS);
    roomMemory.spawnIds = spawns.map(spawn => spawn.id);
  }

  private runDefense(room: Room): void {
    // Find all hostile creeps in the room
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    
    if (hostiles.length === 0) {
      return;
    }

    // Find all towers in the room
    const towers = room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_TOWER,
    }) as StructureTower[];

    if (towers.length === 0) {
      return;
    }

    // Target the closest hostile
    const target = room.find(FIND_HOSTILE_CREEPS)[0];
    if (target) {
      for (const tower of towers) {
        if (tower.store[RESOURCE_ENERGY] > 0) {
          tower.attack(target);
        }
      }
    }
  }
}
