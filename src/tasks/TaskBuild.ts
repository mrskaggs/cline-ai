import { Task } from './Task';
import { Logger } from '../utils/Logger';

/**
 * Task for building construction sites
 */
export class TaskBuild extends Task {
  constructor(target: ConstructionSite, priority: number = 5) {
    super('build', target, priority);
  }

  public isValidTask(): boolean {
    return true; // Building is always a valid action if target exists
  }

  public isValidTarget(): boolean {
    const target = this.getTarget<ConstructionSite>();
    return target !== null && target instanceof ConstructionSite;
  }

  public work(creep: Creep): boolean {
    const target = this.getTarget<ConstructionSite>();
    if (!target) {
      Logger.debug(`TaskBuild: Target construction site no longer exists for creep ${creep.name}`, 'TaskBuild');
      return false; // Task complete (target gone)
    }

    // Check if creep has energy
    if (creep.store[RESOURCE_ENERGY] === 0) {
      Logger.debug(`TaskBuild: Creep ${creep.name} has no energy for building`, 'TaskBuild');
      return false; // Task complete (no energy)
    }

    const result = creep.build(target);
    
    switch (result) {
      case OK:
        creep.say('🚧 build');
        return true; // Continue building
        
      case ERR_NOT_IN_RANGE:
        this.moveToTarget(creep, 3);
        return true; // Continue task
        
      case ERR_NOT_ENOUGH_RESOURCES:
        Logger.debug(`TaskBuild: Creep ${creep.name} ran out of energy while building`, 'TaskBuild');
        return false; // Task complete (no energy)
        
      case ERR_INVALID_TARGET:
        Logger.debug(`TaskBuild: Construction site no longer valid for creep ${creep.name}`, 'TaskBuild');
        return false; // Task complete (invalid target)
        
      default:
        Logger.warn(`TaskBuild: Unexpected build result ${result} for creep ${creep.name}`, 'TaskBuild');
        return false; // Task complete (error)
    }
  }

  protected override getPathColor(): string {
    return '#ffffff'; // White for building
  }

  /**
   * Create a TaskBuild from the highest priority construction site
   */
  public static createFromRoom(creep: Creep): TaskBuild | null {
    const room = creep.room;
    const roomMemory = Memory.rooms[room.name];
    
    // Get all construction sites in the room
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length === 0) {
      return null;
    }

    // If no room plan exists, fall back to closest site
    if (!roomMemory || !roomMemory.plan) {
      const closest = creep.pos.findClosestByPath(constructionSites);
      return closest ? new TaskBuild(closest, 5) : null;
    }

    // Create a map of construction sites with their priorities
    const sitesWithPriority: Array<{ site: ConstructionSite; priority: number; distance: number }> = [];

    for (const site of constructionSites) {
      let priority = 0;
      
      // Find priority from planned buildings
      const plannedBuilding = roomMemory.plan.buildings.find(building => 
        building.pos.x === site.pos.x && 
        building.pos.y === site.pos.y && 
        building.structureType === site.structureType
      );
      
      if (plannedBuilding) {
        priority = plannedBuilding.priority;
      } else {
        // Find priority from planned roads
        const plannedRoad = roomMemory.plan.roads.find(road => 
          road.pos.x === site.pos.x && 
          road.pos.y === site.pos.y
        );
        
        if (plannedRoad) {
          priority = plannedRoad.priority;
        }
      }

      // Calculate distance for tie-breaking
      const distance = creep.pos.getRangeTo(site.pos);
      
      sitesWithPriority.push({
        site,
        priority,
        distance
      });
    }

    // Sort by priority (highest first), then by distance (closest first)
    sitesWithPriority.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.distance - b.distance; // Closer first for same priority
    });

    // Return the highest priority site that's reachable
    for (const item of sitesWithPriority) {
      const path = creep.pos.findPathTo(item.site.pos);
      if (path.length > 0) {
        return new TaskBuild(item.site, item.priority);
      }
    }

    // If no sites are reachable, return the highest priority one anyway
    if (sitesWithPriority.length > 0 && sitesWithPriority[0]) {
      return new TaskBuild(sitesWithPriority[0].site, sitesWithPriority[0].priority);
    }
    
    return null;
  }
}
