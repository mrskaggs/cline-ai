import { Logger } from '../utils/Logger';

/**
 * Predefined layout templates for different RCL levels
 * Provides fallback layouts when dynamic placement isn't optimal
 */
export class LayoutTemplates {
  
  /**
   * Get layout template for a specific RCL
   */
  public static getTemplate(rcl: number): LayoutTemplate | null {
    switch (rcl) {
      case 1:
        return this.getRCL1Template();
      case 2:
        return this.getRCL2Template();
      case 3:
        return this.getRCL3Template();
      case 4:
        return this.getRCL4Template();
      case 5:
        return this.getRCL5Template();
      case 6:
        return this.getRCL6Template();
      case 7:
        return this.getRCL7Template();
      case 8:
        return this.getRCL8Template();
      default:
        Logger.warn(`LayoutTemplates: No template available for RCL ${rcl}`);
        return null;
    }
  }

  /**
   * Get all buildings that should be available at a specific RCL
   */
  public static getBuildingsForRCL(rcl: number): TemplateBuilding[] {
    const template = this.getTemplate(rcl);
    if (!template) return [];

    // Include buildings from all previous RCL levels
    const allBuildings: TemplateBuilding[] = [];
    for (let level = 1; level <= rcl; level++) {
      const levelTemplate = this.getTemplate(level);
      if (levelTemplate) {
        allBuildings.push(...levelTemplate.buildings);
      }
    }

    return allBuildings;
  }

  /**
   * RCL 1 Template - Basic spawn setup
   */
  private static getRCL1Template(): LayoutTemplate {
    return {
      name: 'RCL1_Basic',
      rcl: 1,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Spawn is the center reference point
        { structureType: STRUCTURE_SPAWN, offset: { x: 0, y: 0 }, priority: 1 }
      ]
    };
  }

  /**
   * RCL 2 Template - Add extensions around spawn
   */
  private static getRCL2Template(): LayoutTemplate {
    return {
      name: 'RCL2_Extensions',
      rcl: 2,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // 5 extensions in a cross pattern around spawn
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 0 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 0 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: 1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -1 }, priority: 3 }
      ]
    };
  }

  /**
   * RCL 3 Template - Add tower and more extensions
   */
  private static getRCL3Template(): LayoutTemplate {
    return {
      name: 'RCL3_Tower',
      rcl: 3,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Tower for defense
        { structureType: STRUCTURE_TOWER, offset: { x: 2, y: 0 }, priority: 1 },
        // Additional extensions (5 more for total of 10)
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 0 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -2 }, priority: 3 }
      ]
    };
  }

  /**
   * RCL 4 Template - Add storage and more extensions
   */
  private static getRCL4Template(): LayoutTemplate {
    return {
      name: 'RCL4_Storage',
      rcl: 4,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Storage for energy management
        { structureType: STRUCTURE_STORAGE, offset: { x: 0, y: 2 }, priority: 1 },
        // Additional extensions (10 more for total of 20)
        { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: 2 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 1 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: 0 }, priority: 4 }
      ]
    };
  }

  /**
   * RCL 5 Template - Add second tower and links
   */
  private static getRCL5Template(): LayoutTemplate {
    return {
      name: 'RCL5_Links',
      rcl: 5,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Second tower
        { structureType: STRUCTURE_TOWER, offset: { x: -2, y: 0 }, priority: 1 },
        // Links for energy transport
        { structureType: STRUCTURE_LINK, offset: { x: 0, y: 3 }, priority: 2 },
        // Additional extensions (10 more for total of 30)
        { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 0 }, priority: 2 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: -1 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: 1 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: -1 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 1 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -2 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -2 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 2 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 2 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 0, y: -3 }, priority: 4 }
      ]
    };
  }

  /**
   * RCL 6 Template - Add labs and terminal
   */
  private static getRCL6Template(): LayoutTemplate {
    return {
      name: 'RCL6_Labs',
      rcl: 6,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Terminal for market access
        { structureType: STRUCTURE_TERMINAL, offset: { x: -1, y: 3 }, priority: 1 },
        // Labs for mineral processing
        { structureType: STRUCTURE_LAB, offset: { x: 4, y: 0 }, priority: 2 },
        { structureType: STRUCTURE_LAB, offset: { x: 4, y: -1 }, priority: 2 },
        { structureType: STRUCTURE_LAB, offset: { x: 4, y: 1 }, priority: 2 },
        // Additional extensions (10 more for total of 40)
        { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: 0 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: -2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: 2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: -2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 2 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: -1 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: 1 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 3 }, priority: 4 }
      ]
    };
  }

  /**
   * RCL 7 Template - Add more labs and factory
   */
  private static getRCL7Template(): LayoutTemplate {
    return {
      name: 'RCL7_Factory',
      rcl: 7,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Factory for commodity production
        { structureType: STRUCTURE_FACTORY, offset: { x: 5, y: 0 }, priority: 1 },
        // Additional labs (7 more for total of 10)
        { structureType: STRUCTURE_LAB, offset: { x: 4, y: 2 }, priority: 2 },
        { structureType: STRUCTURE_LAB, offset: { x: 5, y: -1 }, priority: 2 },
        { structureType: STRUCTURE_LAB, offset: { x: 5, y: 1 }, priority: 2 },
        { structureType: STRUCTURE_LAB, offset: { x: 3, y: -3 }, priority: 3 },
        { structureType: STRUCTURE_LAB, offset: { x: 3, y: 3 }, priority: 3 },
        { structureType: STRUCTURE_LAB, offset: { x: -4, y: -2 }, priority: 3 },
        { structureType: STRUCTURE_LAB, offset: { x: -4, y: 2 }, priority: 3 },
        // Additional extensions (10 more for total of 50)
        { structureType: STRUCTURE_EXTENSION, offset: { x: -5, y: 0 }, priority: 3 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: -3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -4, y: 3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 4, y: -3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 4, y: 3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: -3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: -3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -2, y: 3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 2, y: 3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -5, y: -1 }, priority: 5 }
      ]
    };
  }

  /**
   * RCL 8 Template - Add remaining structures
   */
  private static getRCL8Template(): LayoutTemplate {
    return {
      name: 'RCL8_Complete',
      rcl: 8,
      centerOffset: { x: 0, y: 0 },
      buildings: [
        // Third tower
        { structureType: STRUCTURE_TOWER, offset: { x: 0, y: -4 }, priority: 1 },
        // Additional spawns
        { structureType: STRUCTURE_SPAWN, offset: { x: -5, y: -2 }, priority: 1 },
        { structureType: STRUCTURE_SPAWN, offset: { x: 5, y: -2 }, priority: 1 },
        // Power spawn
        { structureType: STRUCTURE_POWER_SPAWN, offset: { x: 0, y: 4 }, priority: 2 },
        // Nuker
        { structureType: STRUCTURE_NUKER, offset: { x: -5, y: 2 }, priority: 3 },
        // Observer
        { structureType: STRUCTURE_OBSERVER, offset: { x: 5, y: 2 }, priority: 3 },
        // Additional links
        { structureType: STRUCTURE_LINK, offset: { x: -3, y: 3 }, priority: 2 },
        { structureType: STRUCTURE_LINK, offset: { x: 3, y: -4 }, priority: 2 },
        // Final extensions (10 more for total of 60)
        { structureType: STRUCTURE_EXTENSION, offset: { x: -5, y: 1 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 5, y: 3 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -3, y: -4 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 3, y: 4 }, priority: 4 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: -4 }, priority: 5 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: -4 }, priority: 5 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -1, y: 4 }, priority: 5 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 1, y: 4 }, priority: 5 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: -6, y: 0 }, priority: 5 },
        { structureType: STRUCTURE_EXTENSION, offset: { x: 6, y: 0 }, priority: 5 }
      ]
    };
  }

  /**
   * Apply template to a room at a specific anchor position
   */
  public static applyTemplate(
    room: Room, 
    template: LayoutTemplate, 
    anchor: RoomPosition
  ): PlannedBuilding[] {
    const plannedBuildings: PlannedBuilding[] = [];
    
    Logger.info(`LayoutTemplates: Applying template ${template.name} to room ${room.name} at anchor ${anchor.x},${anchor.y}`);

    for (const building of template.buildings) {
      const targetX = anchor.x + building.offset.x;
      const targetY = anchor.y + building.offset.y;
      
      // Ensure position is within room bounds
      if (targetX < 1 || targetX > 48 || targetY < 1 || targetY > 48) {
        Logger.debug(`LayoutTemplates: Skipping ${building.structureType} at ${targetX},${targetY} - out of bounds`);
        continue;
      }

      const pos = new RoomPosition(targetX, targetY, room.name);
      
      plannedBuildings.push({
        structureType: building.structureType,
        pos: pos,
        priority: building.priority,
        rclRequired: template.rcl,
        placed: false,
        reason: `Template ${template.name} placement`
      });
    }

    Logger.info(`LayoutTemplates: Generated ${plannedBuildings.length} planned buildings from template ${template.name}`);
    return plannedBuildings;
  }

  /**
   * Get structure limits for a specific RCL
   */
  public static getStructureLimits(rcl: number): { [key: string]: number } {
    const limits: { [key: string]: number } = {};
    
    // Base limits that apply to all RCLs
    limits[STRUCTURE_SPAWN] = Math.min(rcl >= 7 ? 3 : 1, rcl >= 8 ? 3 : rcl >= 7 ? 2 : 1);
    limits[STRUCTURE_EXTENSION] = Math.min(rcl * 10, 60);
    limits[STRUCTURE_TOWER] = Math.min(Math.floor(rcl / 3) + (rcl >= 3 ? 1 : 0), 6);
    limits[STRUCTURE_STORAGE] = rcl >= 4 ? 1 : 0;
    limits[STRUCTURE_LINK] = rcl >= 5 ? Math.min(Math.floor((rcl - 4) * 2), 6) : 0;
    limits[STRUCTURE_TERMINAL] = rcl >= 6 ? 1 : 0;
    limits[STRUCTURE_LAB] = rcl >= 6 ? Math.min((rcl - 5) * 3 + 3, 10) : 0;
    limits[STRUCTURE_FACTORY] = rcl >= 7 ? 1 : 0;
    limits[STRUCTURE_POWER_SPAWN] = rcl >= 8 ? 1 : 0;
    limits[STRUCTURE_NUKER] = rcl >= 8 ? 1 : 0;
    limits[STRUCTURE_OBSERVER] = rcl >= 8 ? 1 : 0;

    return limits;
  }

  /**
   * Validate that a template doesn't exceed structure limits
   */
  public static validateTemplate(template: LayoutTemplate): boolean {
    const limits = this.getStructureLimits(template.rcl);
    const counts: { [key: string]: number } = {};

    // Count structures in template
    for (const building of template.buildings) {
      const type = building.structureType;
      counts[type] = (counts[type] || 0) + 1;
    }

    // Check against limits
    for (const [type, count] of Object.entries(counts)) {
      const limit = limits[type] || 0;
      if (count > limit) {
        Logger.error(`LayoutTemplates: Template ${template.name} exceeds limit for ${type}: ${count} > ${limit}`);
        return false;
      }
    }

    return true;
  }
}
