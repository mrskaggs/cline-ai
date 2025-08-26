import { Logger } from '../utils/Logger';

export class StructureReplacementManager {
  /**
   * Check for missing structures that should be rebuilt and add them to the room plan
   */
  public static checkAndReplaceDecayedStructures(room: Room): void {
    try {
      const roomMemory = Memory.rooms[room.name];
      if (!roomMemory || !roomMemory.plan) {
        return;
      }

      const plan = roomMemory.plan;
      
      // Find structures that should exist but are missing
      const missingStructures = this.findMissingStructures(room, plan);
      
      if (missingStructures.length > 0) {
        Logger.warn(`Found ${missingStructures.length} missing structures in room ${room.name}`, 'StructureReplacement');
        
        // Add missing structures back to the plan
        for (const missing of missingStructures) {
          // Check if structure is already in plan but not placed
          const existingPlan = plan.buildings.find(building => 
            building.pos.x === missing.pos.x && 
            building.pos.y === missing.pos.y && 
            building.structureType === missing.structureType
          );
          
          if (existingPlan) {
            // Structure is in plan but marked as placed - mark as not placed
            if (existingPlan.placed) {
              existingPlan.placed = false;
              Logger.info(`Marked ${missing.structureType} at ${missing.pos.x},${missing.pos.y} for rebuilding`, 'StructureReplacement');
            }
          } else {
            // Structure not in plan - add it
            plan.buildings.push({
              structureType: missing.structureType as BuildableStructureConstant,
              pos: missing.pos,
              priority: this.getStructurePriority(missing.structureType),
              rclRequired: this.getMinRCLForStructure(missing.structureType),
              placed: false,
              reason: 'Structure decayed and needs rebuilding'
            });
            Logger.info(`Added missing ${missing.structureType} at ${missing.pos.x},${missing.pos.y} to rebuild plan`, 'StructureReplacement');
          }
        }
        
        // Update plan timestamp
        plan.lastUpdated = Game.time;
      }
      
      // Check for missing roads
      this.checkAndReplaceMissingRoads(room, plan);
      
    } catch (error) {
      Logger.error(`Error checking for decayed structures in room ${room.name}: ${error}`, 'StructureReplacement');
    }
  }

  private static findMissingStructures(room: Room, plan: any): Array<{structureType: string, pos: RoomPosition}> {
    const missingStructures: Array<{structureType: string, pos: RoomPosition}> = [];
    const rcl = room.controller ? room.controller.level : 0;
    
    // Get all existing structures in the room
    const existingStructures = room.find(FIND_STRUCTURES);
    const existingStructureMap = new Map<string, Structure>();
    
    for (const structure of existingStructures) {
      const key = `${structure.pos.x},${structure.pos.y},${structure.structureType}`;
      existingStructureMap.set(key, structure);
    }
    
    // Check planned buildings that should exist
    for (const building of plan.buildings) {
      if (building.rclRequired <= rcl && building.placed) {
        const key = `${building.pos.x},${building.pos.y},${building.structureType}`;
        
        if (!existingStructureMap.has(key)) {
          // Structure should exist but doesn't - it decayed
          missingStructures.push({
            structureType: building.structureType,
            pos: new RoomPosition(building.pos.x, building.pos.y, room.name)
          });
        }
      }
    }
    
    return missingStructures;
  }

  private static checkAndReplaceMissingRoads(room: Room, plan: any): void {
    if (!plan.roads) {
      return;
    }
    
    // Get all existing roads in the room
    const existingRoads = room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_ROAD
    });
    
    const existingRoadMap = new Map<string, Structure>();
    for (const road of existingRoads) {
      const key = `${road.pos.x},${road.pos.y}`;
      existingRoadMap.set(key, road);
    }
    
    let missingRoadCount = 0;
    
    // Check planned roads that should exist
    for (const road of plan.roads) {
      if (road.placed) {
        const key = `${road.pos.x},${road.pos.y}`;
        
        if (!existingRoadMap.has(key)) {
          // Road should exist but doesn't - mark for rebuilding
          road.placed = false;
          missingRoadCount++;
        }
      }
    }
    
    if (missingRoadCount > 0) {
      Logger.warn(`Found ${missingRoadCount} missing roads in room ${room.name} - marked for rebuilding`, 'StructureReplacement');
      plan.lastUpdated = Game.time;
    }
  }

  private static getStructurePriority(structureType: string): number {
    // Priority values for structure replacement (higher = more important)
    switch (structureType) {
      case STRUCTURE_SPAWN: return 100;
      case STRUCTURE_EXTENSION: return 80;
      case STRUCTURE_TOWER: return 85;
      case STRUCTURE_STORAGE: return 70;
      case STRUCTURE_CONTAINER: return 60;
      case STRUCTURE_LINK: return 65;
      case STRUCTURE_EXTRACTOR: return 50;
      case STRUCTURE_LAB: return 55;
      case STRUCTURE_TERMINAL: return 75;
      case STRUCTURE_FACTORY: return 45;
      case STRUCTURE_NUKER: return 40;
      case STRUCTURE_OBSERVER: return 35;
      case STRUCTURE_POWER_SPAWN: return 30;
      default: return 25;
    }
  }

  private static getMinRCLForStructure(structureType: string): number {
    // RCL requirements for structures
    switch (structureType) {
      case STRUCTURE_SPAWN: return 1;
      case STRUCTURE_EXTENSION: return 2;
      case STRUCTURE_RAMPART: return 2;
      case STRUCTURE_WALL: return 2;
      case STRUCTURE_ROAD: return 3;
      case STRUCTURE_TOWER: return 3;
      case STRUCTURE_CONTAINER: return 3;
      case STRUCTURE_STORAGE: return 4;
      case STRUCTURE_LINK: return 5;
      case STRUCTURE_EXTRACTOR: return 6;
      case STRUCTURE_LAB: return 6;
      case STRUCTURE_TERMINAL: return 6;
      case STRUCTURE_FACTORY: return 7;
      case STRUCTURE_NUKER: return 8;
      case STRUCTURE_OBSERVER: return 8;
      case STRUCTURE_POWER_SPAWN: return 8;
      default: return 1;
    }
  }
}
