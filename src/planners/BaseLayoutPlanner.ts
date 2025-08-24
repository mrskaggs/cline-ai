import { Logger } from '../utils/Logger';
import { PathingUtils } from '../utils/PathingUtils';
import { Settings } from '../config/settings';
import { TerrainAnalyzer } from './TerrainAnalyzer';
import { LayoutTemplates } from './LayoutTemplates';

/**
 * Main building placement and layout planning system
 * Combines template-based and dynamic placement strategies
 */
export class BaseLayoutPlanner {
  
  /**
   * Main planning entry point - creates or updates room plan
   */
  public static planRoom(room: Room): RoomPlan {
    const startCpu = Game.cpu.getUsed();
    
    try {
      Logger.info(`BaseLayoutPlanner: Planning room ${room.name} at RCL ${room.controller ? room.controller.level : 0}`);
      
      // Get or create room plan
      let plan = room.memory.plan;
      const currentRCL = room.controller ? room.controller.level : 0;
      
      if (!plan || plan.rcl < currentRCL || this.shouldReplan(plan)) {
        // Log the reason for replanning
        if (!plan) {
          Logger.info(`BaseLayoutPlanner: Creating initial plan for room ${room.name}`);
        } else if (plan.rcl < currentRCL) {
          Logger.info(`BaseLayoutPlanner: Replanning room ${room.name} - RCL upgraded from ${plan.rcl} to ${currentRCL}`);
        } else if (this.hasInvalidStructureCounts(plan)) {
          Logger.warn(`BaseLayoutPlanner: Replanning room ${room.name} - Invalid structure counts detected (likely due to corrected structure limits)`);
        } else {
          Logger.info(`BaseLayoutPlanner: Replanning room ${room.name} - Plan expired or status requires replanning`);
        }
        
        plan = this.createNewPlan(room);
      }
      
      // Update plan status and priority
      this.updatePlanStatus(room, plan);
      
      // Save plan to memory
      room.memory.plan = plan;
      
      const cpuUsed = Game.cpu.getUsed() - startCpu;
      Logger.info(`BaseLayoutPlanner: Completed planning for room ${room.name} in ${cpuUsed.toFixed(2)} CPU`);
      
      return plan;
    } catch (error) {
      Logger.error(`BaseLayoutPlanner: Error planning room ${room.name}: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new room plan from scratch
   */
  private static createNewPlan(room: Room): RoomPlan {
    const currentRCL = room.controller ? room.controller.level : 0;
    
    Logger.info(`BaseLayoutPlanner: Creating new plan for room ${room.name} at RCL ${currentRCL}`);
    
    // Analyze room layout if not cached
    let analysis = TerrainAnalyzer.getCachedAnalysis(room);
    if (!analysis) {
      analysis = TerrainAnalyzer.analyzeRoom(room);
    }
    
    // Generate building plan
    const buildings = this.generateBuildingPlan(room, currentRCL);
    
    const plan: RoomPlan = {
      roomName: room.name,
      rcl: currentRCL,
      lastUpdated: Game.time,
      buildings: buildings,
      roads: [], // Roads will be planned separately by RoadPlanner
      status: 'planning',
      priority: this.calculatePlanPriority(room)
    };
    
    Logger.info(`BaseLayoutPlanner: Created plan with ${buildings.length} buildings for room ${room.name}`);
    return plan;
  }

  /**
   * Generate building placement plan using hybrid approach
   */
  private static generateBuildingPlan(room: Room, rcl: number): PlannedBuilding[] {
    const buildings: PlannedBuilding[] = [];
    
    if (Settings.planning.useTemplates) {
      // Try template-based approach first
      const templateBuildings = this.generateTemplateBasedPlan(room, rcl);
      buildings.push(...templateBuildings);
    }
    
    if (Settings.planning.useDynamicPlacement) {
      // Add dynamic placement for structures not covered by templates
      const dynamicBuildings = this.generateDynamicPlan(room, rcl, buildings);
      buildings.push(...dynamicBuildings);
    }
    
    // Optimize and validate the final plan
    return this.optimizeBuildingPlan(room, buildings);
  }

  /**
   * Generate building plan using layout templates
   */
  private static generateTemplateBasedPlan(room: Room, rcl: number): PlannedBuilding[] {
    const buildings: PlannedBuilding[] = [];
    
    // Find anchor point for template (existing spawn or central area)
    const anchor = this.findTemplateAnchor(room);
    
    // Apply templates for all RCL levels up to current
    for (let level = 1; level <= rcl; level++) {
      const template = LayoutTemplates.getTemplate(level);
      if (template && LayoutTemplates.validateTemplate(template)) {
        const templateBuildings = LayoutTemplates.applyTemplate(room, template, anchor);
        buildings.push(...templateBuildings);
      }
    }
    
    Logger.info(`BaseLayoutPlanner: Generated ${buildings.length} buildings from templates for room ${room.name}`);
    return buildings;
  }

  /**
   * Generate building plan using dynamic placement
   */
  private static generateDynamicPlan(room: Room, rcl: number, existingBuildings: PlannedBuilding[]): PlannedBuilding[] {
    const buildings: PlannedBuilding[] = [];
    const keyPositions = TerrainAnalyzer.identifyKeyPositions(room);
    
    // Get structure limits for current RCL
    const limits = LayoutTemplates.getStructureLimits(rcl);
    const existingCounts = this.countExistingStructures(room, existingBuildings);
    
    // Plan structures that need dynamic placement
    for (const [structureType, limit] of Object.entries(limits)) {
      const existing = existingCounts[structureType] || 0;
      const needed = limit - existing;
      
      if (needed > 0) {
        const dynamicPlacements = this.planStructureDynamically(
          room, 
          structureType as BuildableStructureConstant, 
          needed, 
          keyPositions,
          existingBuildings
        );
        buildings.push(...dynamicPlacements);
      }
    }
    
    Logger.info(`BaseLayoutPlanner: Generated ${buildings.length} buildings from dynamic placement for room ${room.name}`);
    return buildings;
  }

  /**
   * Plan a specific structure type dynamically
   */
  private static planStructureDynamically(
    room: Room,
    structureType: BuildableStructureConstant,
    count: number,
    keyPositions: KeyPositions,
    existingBuildings: PlannedBuilding[]
  ): PlannedBuilding[] {
    const buildings: PlannedBuilding[] = [];
    const centralArea = TerrainAnalyzer.findCentralArea(room);
    
    // Get suitable positions based on structure type
    const candidates = this.findSuitablePositions(room, structureType, centralArea, keyPositions);
    
    // Filter out positions already occupied by existing buildings
    const occupiedPositions = new Set(
      existingBuildings.map(b => `${b.pos.x},${b.pos.y}`)
    );
    
    const availableCandidates = candidates.filter(pos => 
      !occupiedPositions.has(`${pos.x},${pos.y}`)
    );
    
    // Select best positions based on structure type priorities
    const selectedPositions = this.selectBestPositions(
      availableCandidates, 
      structureType, 
      count, 
      keyPositions
    );
    
    // Create planned buildings
    selectedPositions.forEach((pos, index) => {
      buildings.push({
        structureType: structureType,
        pos: pos,
        priority: this.getStructurePriority(structureType, index),
        rclRequired: this.getMinRCLForStructure(structureType),
        placed: false,
        reason: `Dynamic placement for ${structureType}`
      });
    });
    
    return buildings;
  }

  /**
   * Find suitable positions for a structure type
   */
  private static findSuitablePositions(
    room: Room,
    structureType: BuildableStructureConstant,
    centralArea: RoomPosition,
    keyPositions: KeyPositions
  ): RoomPosition[] {
    const positions: RoomPosition[] = [];
    
    // Define search radius based on structure type
    const searchRadius = this.getSearchRadius(structureType);
    const searchCenter = this.getSearchCenter(structureType, centralArea, keyPositions);
    
    // Find all buildable positions in search area
    const buildableArea = TerrainAnalyzer.calculateBuildableArea(room, searchCenter, searchRadius);
    
    // Filter positions suitable for this structure type
    for (const pos of buildableArea) {
      if (TerrainAnalyzer.isSuitableForStructure(pos, structureType)) {
        positions.push(pos);
      }
    }
    
    return positions;
  }

  /**
   * Select best positions from candidates based on structure type
   */
  private static selectBestPositions(
    candidates: RoomPosition[],
    structureType: BuildableStructureConstant,
    count: number,
    keyPositions: KeyPositions
  ): RoomPosition[] {
    if (candidates.length <= count) {
      return candidates;
    }
    
    // Score positions based on structure type requirements
    const scoredPositions = candidates.map(pos => ({
      pos: pos,
      score: this.scorePosition(pos, structureType, keyPositions)
    }));
    
    // Sort by score (higher is better) and take top positions
    scoredPositions.sort((a, b) => b.score - a.score);
    
    return scoredPositions.slice(0, count).map(sp => sp.pos);
  }

  /**
   * Score a position for a specific structure type
   */
  private static scorePosition(
    pos: RoomPosition,
    structureType: BuildableStructureConstant,
    keyPositions: KeyPositions
  ): number {
    let score = 0;
    
    switch (structureType) {
      case STRUCTURE_SPAWN:
        // Spawns prefer central locations with good access to sources
        if (keyPositions.controller) {
          score += 100 - PathingUtils.getDistance(pos, keyPositions.controller) * 2;
        }
        keyPositions.sources.forEach(source => {
          score += 50 - PathingUtils.getDistance(pos, source);
        });
        break;
        
      case STRUCTURE_TOWER:
        // Towers prefer central locations for maximum coverage
        const roomCenter = new RoomPosition(25, 25, pos.roomName);
        score += 100 - PathingUtils.getDistance(pos, roomCenter) * 3;
        break;
        
      case STRUCTURE_STORAGE:
      case STRUCTURE_TERMINAL:
        // Storage prefers central location near spawn
        if (keyPositions.spawn.length > 0) {
          score += 100 - PathingUtils.getDistance(pos, keyPositions.spawn[0]!) * 2;
        }
        break;
        
      case STRUCTURE_EXTENSION:
        // Extensions prefer to be near spawn but can be more distributed
        if (keyPositions.spawn.length > 0) {
          score += 50 - PathingUtils.getDistance(pos, keyPositions.spawn[0]!);
        }
        break;
        
      case STRUCTURE_LAB:
        // Labs prefer to be clustered together near storage
        if (keyPositions.spawn.length > 0) {
          score += 30 - PathingUtils.getDistance(pos, keyPositions.spawn[0]!);
        }
        break;
        
      default:
        // Default scoring based on centrality
        if (keyPositions.controller) {
          score += 50 - PathingUtils.getDistance(pos, keyPositions.controller);
        }
        break;
    }
    
    return score;
  }

  /**
   * Optimize and validate the building plan
   */
  private static optimizeBuildingPlan(_room: Room, buildings: PlannedBuilding[]): PlannedBuilding[] {
    // Remove duplicates (same structure type at same position)
    const uniqueBuildings = new Map<string, PlannedBuilding>();
    
    buildings.forEach(building => {
      const key = `${building.structureType}_${building.pos.x}_${building.pos.y}`;
      const existing = uniqueBuildings.get(key);
      
      if (!existing || building.priority > existing.priority) {
        uniqueBuildings.set(key, building);
      }
    });
    
    const optimizedBuildings = Array.from(uniqueBuildings.values());
    
    // Sort by priority (higher priority first)
    optimizedBuildings.sort((a, b) => b.priority - a.priority);
    
    Logger.info(`BaseLayoutPlanner: Optimized plan from ${buildings.length} to ${optimizedBuildings.length} buildings`);
    return optimizedBuildings;
  }

  /**
   * Place construction sites based on the room plan
   */
  public static placeConstructionSites(room: Room, plan: RoomPlan): void {
    if (!Settings.planning.buildingPlanningEnabled) return;
    
    const currentRCL = room.controller ? room.controller.level : 0;
    const maxSites = Settings.planning.maxConstructionSites;
    const existingSites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
    
    if (existingSites >= maxSites) {
      Logger.debug(`BaseLayoutPlanner: Room ${room.name} already has ${existingSites} construction sites`);
      return;
    }
    
    let sitesPlaced = 0;
    const sitesToPlace = maxSites - existingSites;
    
    // Debug logging to understand the RCL mismatch issue
    Logger.debug(`BaseLayoutPlanner: Room ${room.name} - Current RCL: ${currentRCL}, Plan RCL: ${plan.rcl}`);
    
    // Sort buildings by priority and RCL requirements
    const eligibleBuildings = plan.buildings
      .filter(building => 
        !building.placed && 
        building.rclRequired <= currentRCL &&
        !this.hasStructureAtPosition(room, building.pos, building.structureType)
      )
      .sort((a, b) => b.priority - a.priority);
    
    Logger.debug(`BaseLayoutPlanner: Room ${room.name} - Total buildings: ${plan.buildings.length}, Eligible: ${eligibleBuildings.length}`);
    
    for (const building of eligibleBuildings) {
      if (sitesPlaced >= sitesToPlace) break;
      
      // Debug logging for each building attempt
      Logger.debug(`BaseLayoutPlanner: Attempting to place ${building.structureType} at ${building.pos.x},${building.pos.y} - RCL required: ${building.rclRequired}, Current RCL: ${currentRCL}`);
      
      // Additional validation before attempting to place construction site
      if (!this.isValidConstructionPosition(room, building.pos, building.structureType)) {
        Logger.debug(`BaseLayoutPlanner: Skipping invalid position for ${building.structureType} at ${building.pos.x},${building.pos.y} in room ${room.name}`);
        continue;
      }
      
      // Double-check RCL requirement right before placement
      if (building.rclRequired > currentRCL) {
        Logger.warn(`BaseLayoutPlanner: Skipping ${building.structureType} at ${building.pos.x},${building.pos.y} - RCL ${building.rclRequired} required but room is RCL ${currentRCL}`);
        continue;
      }
      
      // Ensure pos is a proper RoomPosition object for createConstructionSite
      const roomPos = new RoomPosition(building.pos.x, building.pos.y, building.pos.roomName);
      const result = room.createConstructionSite(roomPos, building.structureType);
      
      if (result === OK) {
        building.placed = true;
        const siteId = this.findConstructionSiteId(room, building.pos, building.structureType);
        if (siteId) {
          building.constructionSiteId = siteId;
        }
        sitesPlaced++;
        
        Logger.info(`BaseLayoutPlanner: Placed ${building.structureType} construction site at ${building.pos.x},${building.pos.y} in room ${room.name}`);
      } else {
        Logger.warn(`BaseLayoutPlanner: Failed to place ${building.structureType} at ${building.pos.x},${building.pos.y} in room ${room.name}: ${this.getErrorDescription(result)}`);
      }
    }
    
    if (sitesPlaced > 0) {
      plan.lastUpdated = Game.time;
      Logger.info(`BaseLayoutPlanner: Placed ${sitesPlaced} construction sites in room ${room.name}`);
    }
  }

  // Helper methods
  
  private static shouldReplan(plan: RoomPlan): boolean {
    const age = Game.time - plan.lastUpdated;
    return age > Settings.planning.layoutAnalysisTTL || 
           plan.status === 'planning' ||
           this.hasInvalidStructureCounts(plan);
  }

  /**
   * Check if the plan has invalid structure counts that exceed current RCL limits
   * This handles cases where structure limits were corrected after the plan was created
   */
  private static hasInvalidStructureCounts(plan: RoomPlan): boolean {
    const currentLimits = LayoutTemplates.getStructureLimits(plan.rcl);
    const structureCounts: { [key: string]: number } = {};
    
    // Count structures in the plan
    plan.buildings.forEach(building => {
      const type = building.structureType;
      structureCounts[type] = (structureCounts[type] || 0) + 1;
    });
    
    // Check if any structure type exceeds the current limits
    for (const [structureType, count] of Object.entries(structureCounts)) {
      const limit = currentLimits[structureType] || 0;
      if (count > limit) {
        Logger.warn(`BaseLayoutPlanner: Plan has invalid structure count - ${structureType}: ${count} > ${limit} (RCL ${plan.rcl})`);
        return true;
      }
    }
    
    return false;
  }

  private static updatePlanStatus(room: Room, plan: RoomPlan): void {
    const unplacedBuildings = plan.buildings.filter(b => !b.placed).length;
    const currentRCL = room.controller ? room.controller.level : 0;
    
    if (unplacedBuildings === 0) {
      plan.status = 'complete';
    } else if (plan.buildings.some(b => b.placed)) {
      plan.status = 'building';
    } else {
      plan.status = 'ready';
    }
    
    plan.rcl = currentRCL;
  }

  private static calculatePlanPriority(room: Room): number {
    const rcl = room.controller ? room.controller.level : 0;
    const energyCapacity = room.energyCapacityAvailable;
    
    // Higher priority for higher RCL and energy capacity
    return rcl * 10 + Math.floor(energyCapacity / 100);
  }

  private static findTemplateAnchor(room: Room): RoomPosition {
    // Try to use existing spawn as anchor
    const spawns = room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => structure.structureType === STRUCTURE_SPAWN
    });
    
    if (spawns.length > 0) {
      return spawns[0]!.pos;
    }
    
    // Use central area as anchor
    return TerrainAnalyzer.findCentralArea(room);
  }

  private static countExistingStructures(room: Room, plannedBuildings: PlannedBuilding[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    
    // Count existing structures
    const structures = room.find(FIND_MY_STRUCTURES);
    structures.forEach(structure => {
      counts[structure.structureType] = (counts[structure.structureType] || 0) + 1;
    });
    
    // Count planned buildings
    plannedBuildings.forEach(building => {
      counts[building.structureType] = (counts[building.structureType] || 0) + 1;
    });
    
    return counts;
  }

  private static getSearchRadius(structureType: BuildableStructureConstant): number {
    switch (structureType) {
      case STRUCTURE_EXTENSION: return 8;
      case STRUCTURE_TOWER: return 15;
      case STRUCTURE_SPAWN: return 10;
      case STRUCTURE_STORAGE: return 5;
      case STRUCTURE_TERMINAL: return 5;
      case STRUCTURE_LAB: return 8;
      default: return 10;
    }
  }

  private static getSearchCenter(
    structureType: BuildableStructureConstant,
    centralArea: RoomPosition,
    keyPositions: KeyPositions
  ): RoomPosition {
    switch (structureType) {
      case STRUCTURE_SPAWN:
      case STRUCTURE_STORAGE:
      case STRUCTURE_TERMINAL:
        return centralArea;
      case STRUCTURE_TOWER:
        return new RoomPosition(25, 25, centralArea.roomName);
      default:
        return keyPositions.spawn.length > 0 ? keyPositions.spawn[0]! : centralArea;
    }
  }

  private static getStructurePriority(structureType: BuildableStructureConstant, index: number): number {
    const basePriority: { [key: string]: number } = {
      [STRUCTURE_SPAWN]: 100,
      [STRUCTURE_TOWER]: 90,
      [STRUCTURE_STORAGE]: 80,
      [STRUCTURE_EXTENSION]: 70,
      [STRUCTURE_TERMINAL]: 60,
      [STRUCTURE_LINK]: 50,
      [STRUCTURE_LAB]: 40,
      [STRUCTURE_FACTORY]: 30,
      [STRUCTURE_POWER_SPAWN]: 20,
      [STRUCTURE_NUKER]: 10,
      [STRUCTURE_OBSERVER]: 10
    };
    
    return (basePriority[structureType] || 50) - index;
  }

  private static getMinRCLForStructure(structureType: BuildableStructureConstant): number {
    const rclRequirements: { [key: string]: number } = {
      [STRUCTURE_SPAWN]: 1,
      [STRUCTURE_EXTENSION]: 2,  // Extensions are available starting at RCL 2
      [STRUCTURE_TOWER]: 3,
      [STRUCTURE_STORAGE]: 4,
      [STRUCTURE_LINK]: 5,
      [STRUCTURE_TERMINAL]: 6,
      [STRUCTURE_LAB]: 6,
      [STRUCTURE_FACTORY]: 7,
      [STRUCTURE_POWER_SPAWN]: 8,
      [STRUCTURE_NUKER]: 8,
      [STRUCTURE_OBSERVER]: 8
    };
    
    return rclRequirements[structureType] || 1;
  }

  private static hasStructureAtPosition(_room: Room, pos: RoomPosition, structureType: BuildableStructureConstant): boolean {
    // Ensure pos is a proper RoomPosition object (in case it came from memory)
    const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
    
    const structures = roomPos.lookFor(LOOK_STRUCTURES);
    const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
    
    return structures.some(s => s.structureType === structureType) ||
           sites.some(s => s.structureType === structureType);
  }

  private static findConstructionSiteId(_room: Room, pos: RoomPosition, structureType: BuildableStructureConstant): Id<ConstructionSite> | undefined {
    // Ensure pos is a proper RoomPosition object (in case it came from memory)
    const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
    
    const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
    const site = sites.find(s => s.structureType === structureType);
    return site ? site.id : undefined;
  }

  /**
   * Validate if a position is suitable for construction site placement
   */
  private static isValidConstructionPosition(room: Room, pos: RoomPosition, _structureType: BuildableStructureConstant): boolean {
    // Ensure pos is a proper RoomPosition object (in case it came from memory)
    const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
    
    // Check if position is within room bounds
    if (roomPos.x < 1 || roomPos.x > 48 || roomPos.y < 1 || roomPos.y > 48) {
      return false;
    }
    
    // Check terrain - can't build on walls
    const terrain = room.getTerrain().get(roomPos.x, roomPos.y);
    if (terrain & TERRAIN_MASK_WALL) {
      return false;
    }
    
    // Check for existing structures that would block construction
    const structures = roomPos.lookFor(LOOK_STRUCTURES);
    if (structures.length > 0) {
      // Some structures can coexist (roads, containers)
      const blockingStructures = structures.filter(s => 
        s.structureType !== STRUCTURE_ROAD && 
        s.structureType !== STRUCTURE_CONTAINER
      );
      if (blockingStructures.length > 0) {
        return false;
      }
    }
    
    // Check for existing construction sites
    const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (sites.length > 0) {
      return false;
    }
    
    // Check for creeps (they would block construction)
    const creeps = roomPos.lookFor(LOOK_CREEPS);
    if (creeps.length > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get human-readable error description for construction site placement errors
   */
  private static getErrorDescription(errorCode: number): string {
    switch (errorCode) {
      case ERR_INVALID_TARGET: return 'ERR_INVALID_TARGET (-10): Invalid position or structure type';
      case ERR_FULL: return 'ERR_FULL (-8): Too many construction sites';
      case ERR_INVALID_ARGS: return 'ERR_INVALID_ARGS (-10): Invalid arguments';
      case ERR_RCL_NOT_ENOUGH: return 'ERR_RCL_NOT_ENOUGH (-14): RCL too low for this structure';
      case ERR_NOT_OWNER: return 'ERR_NOT_OWNER (-1): Not room owner';
      default: return `Unknown error (${errorCode})`;
    }
  }
}
