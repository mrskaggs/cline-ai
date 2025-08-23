import { Logger } from './Logger';
import { Settings } from '../config/settings';

/**
 * Tracks creep movements and analyzes traffic patterns for road planning
 */
export class TrafficAnalyzer {
  
  /**
   * Track a creep's movement for traffic analysis
   */
  public static trackCreepMovement(creep: Creep): void {
    if (!Settings.planning.trafficAnalysisEnabled) return;
    
    const room = creep.room;
    if (!room.memory.trafficData) {
      room.memory.trafficData = {};
    }
    
    const posKey = `${creep.pos.x},${creep.pos.y}`;
    const trafficData = room.memory.trafficData;
    
    if (!trafficData[posKey]) {
      trafficData[posKey] = {
        count: 0,
        lastSeen: Game.time,
        creepTypes: []
      };
    }
    
    const data = trafficData[posKey];
    data.count++;
    data.lastSeen = Game.time;
    
    // Track creep types for analysis
    if (creep.memory.role && !data.creepTypes.includes(creep.memory.role)) {
      data.creepTypes.push(creep.memory.role);
    }
  }

  /**
   * Analyze traffic patterns in a room and return traffic scores
   */
  public static analyzeTrafficPatterns(room: Room): TrafficData {
    if (!room.memory.trafficData) {
      room.memory.trafficData = {};
    }
    
    const trafficData = room.memory.trafficData;
    const currentTime = Game.time;
    const ttl = Settings.planning.trafficDataTTL;
    
    // Clean up old traffic data
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (data && currentTime - data.lastSeen > ttl) {
        delete trafficData[posKey];
      }
    }
    
    Logger.debug(`TrafficAnalyzer: Analyzed traffic for room ${room.name}, ${Object.keys(trafficData).length} positions tracked`);
    return trafficData;
  }

  /**
   * Get traffic score for a specific position
   */
  public static getTrafficScore(room: Room, pos: RoomPosition): number {
    if (!room.memory.trafficData) return 0;
    
    const posKey = `${pos.x},${pos.y}`;
    const data = room.memory.trafficData[posKey];
    
    if (!data) return 0;
    
    // Calculate score based on traffic count and recency
    const age = Game.time - data.lastSeen;
    const ageFactor = Math.max(0, 1 - (age / Settings.planning.trafficDataTTL));
    
    return data.count * ageFactor;
  }

  /**
   * Get high traffic positions that justify road placement
   */
  public static getHighTrafficPositions(room: Room): RoomPosition[] {
    const trafficData = this.analyzeTrafficPatterns(room);
    const highTrafficPositions: RoomPosition[] = [];
    const minTraffic = Settings.planning.minTrafficForRoad;
    
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (!data) continue;
      
      const coords = posKey.split(',').map(Number);
      if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const pos = new RoomPosition(coords[0], coords[1], room.name);
        
        if (data.count >= minTraffic) {
          highTrafficPositions.push(pos);
        }
      }
    }
    
    Logger.debug(`TrafficAnalyzer: Found ${highTrafficPositions.length} high traffic positions in room ${room.name}`);
    return highTrafficPositions;
  }

  /**
   * Get traffic density map for visualization or analysis
   */
  public static getTrafficDensityMap(room: Room): { [key: string]: number } {
    const trafficData = this.analyzeTrafficPatterns(room);
    const densityMap: { [key: string]: number } = {};
    
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (!data) continue;
      
      const score = this.getTrafficScore(room, this.parsePositionKey(posKey, room.name));
      densityMap[posKey] = score;
    }
    
    return densityMap;
  }

  /**
   * Analyze traffic patterns between key positions
   */
  public static analyzeTrafficBetweenPositions(
    room: Room, 
    from: RoomPosition, 
    to: RoomPosition
  ): { averageTraffic: number; hotspots: RoomPosition[] } {
    // Ensure traffic data is up to date
    this.analyzeTrafficPatterns(room);
    
    // Simple analysis - check positions in a line between from and to
    const positions = this.getPositionsBetween(from, to);
    let totalTraffic = 0;
    const hotspots: RoomPosition[] = [];
    const threshold = Settings.planning.roadPriorityThreshold;
    
    for (const pos of positions) {
      const score = this.getTrafficScore(room, pos);
      totalTraffic += score;
      
      if (score >= threshold) {
        hotspots.push(pos);
      }
    }
    
    const averageTraffic = positions.length > 0 ? totalTraffic / positions.length : 0;
    
    return {
      averageTraffic: averageTraffic,
      hotspots: hotspots
    };
  }

  /**
   * Get positions along a line between two points
   */
  private static getPositionsBetween(from: RoomPosition, to: RoomPosition): RoomPosition[] {
    if (from.roomName !== to.roomName) return [];
    
    const positions: RoomPosition[] = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    
    if (distance === 0) return [from];
    
    for (let i = 0; i <= distance; i++) {
      const rawX = from.x + (dx * i) / distance;
      const rawY = from.y + (dy * i) / distance;
      const x = Math.round(rawX);
      const y = Math.round(rawY);
      // Ensure coordinates are within valid range and are numbers
      const safeX = isNaN(x) ? 0 : x;
      const safeY = isNaN(y) ? 0 : y;
      const clampedX = Math.max(0, Math.min(49, safeX as number));
      const clampedY = Math.max(0, Math.min(49, safeY as number));
      positions.push(new RoomPosition(clampedX, clampedY, from.roomName));
    }
    
    return positions;
  }

  /**
   * Parse position key back to RoomPosition
   */
  private static parsePositionKey(posKey: string, roomName: string): RoomPosition {
    const coords = posKey.split(',').map(Number);
    if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return new RoomPosition(coords[0], coords[1], roomName);
    }
    // Fallback to 0,0 if parsing fails
    return new RoomPosition(0, 0, roomName);
  }

  /**
   * Get traffic statistics for a room
   */
  public static getTrafficStatistics(room: Room): {
    totalPositions: number;
    totalTraffic: number;
    averageTraffic: number;
    highTrafficPositions: number;
    topCreepTypes: string[];
  } {
    const trafficData = this.analyzeTrafficPatterns(room);
    const positions = Object.keys(trafficData);
    let totalTraffic = 0;
    let highTrafficCount = 0;
    const creepTypeCounts: { [key: string]: number } = {};
    
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (!data) continue;
      
      totalTraffic += data.count;
      
      if (data.count >= Settings.planning.minTrafficForRoad) {
        highTrafficCount++;
      }
      
      // Count creep types
      data.creepTypes.forEach(type => {
        creepTypeCounts[type] = (creepTypeCounts[type] || 0) + data.count;
      });
    }
    
    // Get top creep types by traffic
    const topCreepTypes = Object.entries(creepTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);
    
    return {
      totalPositions: positions.length,
      totalTraffic: totalTraffic,
      averageTraffic: positions.length > 0 ? totalTraffic / positions.length : 0,
      highTrafficPositions: highTrafficCount,
      topCreepTypes: topCreepTypes
    };
  }

  /**
   * Clear traffic data for a room
   */
  public static clearTrafficData(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room && room.memory.trafficData) {
      delete room.memory.trafficData;
      Logger.debug(`TrafficAnalyzer: Cleared traffic data for room ${roomName}`);
    }
  }

  /**
   * Optimize traffic data by removing low-traffic positions
   */
  public static optimizeTrafficData(room: Room): void {
    if (!room.memory.trafficData) return;
    
    const trafficData = room.memory.trafficData;
    const minTraffic = Math.max(1, Settings.planning.minTrafficForRoad / 4); // Keep positions with at least 25% of min traffic
    let removedCount = 0;
    
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (data && data.count < minTraffic) {
        delete trafficData[posKey];
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      Logger.debug(`TrafficAnalyzer: Optimized traffic data for room ${room.name}, removed ${removedCount} low-traffic positions`);
    }
  }

  /**
   * Get recommended road positions based on traffic analysis
   */
  public static getRecommendedRoadPositions(room: Room): RoomPosition[] {
    const highTrafficPositions = this.getHighTrafficPositions(room);
    const recommendedPositions: RoomPosition[] = [];
    
    // Filter positions that don't already have roads
    for (const pos of highTrafficPositions) {
      const structures = pos.lookFor(LOOK_STRUCTURES);
      const hasRoad = structures.some(s => s.structureType === STRUCTURE_ROAD);
      
      const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
      const hasRoadSite = sites.some(s => s.structureType === STRUCTURE_ROAD);
      
      if (!hasRoad && !hasRoadSite) {
        recommendedPositions.push(pos);
      }
    }
    
    Logger.debug(`TrafficAnalyzer: Recommended ${recommendedPositions.length} road positions for room ${room.name}`);
    return recommendedPositions;
  }

  /**
   * Track all creeps in a room for traffic analysis
   */
  public static trackRoomTraffic(room: Room): void {
    if (!Settings.planning.trafficAnalysisEnabled) return;
    
    const creeps = room.find(FIND_MY_CREEPS);
    
    for (const creep of creeps) {
      this.trackCreepMovement(creep);
    }
    
    // Periodically optimize traffic data to prevent memory bloat
    if (Game.time % 100 === 0) {
      this.optimizeTrafficData(room);
    }
  }

  /**
   * Get traffic heatmap data for visualization
   */
  public static getTrafficHeatmap(room: Room): Array<{ x: number; y: number; intensity: number }> {
    const trafficData = this.analyzeTrafficPatterns(room);
    const heatmapData: Array<{ x: number; y: number; intensity: number }> = [];
    
    // Find max traffic for normalization
    let maxTraffic = 0;
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (data) {
        maxTraffic = Math.max(maxTraffic, data.count);
      }
    }
    
    if (maxTraffic === 0) return heatmapData;
    
    // Create normalized heatmap data
    for (const posKey in trafficData) {
      const data = trafficData[posKey];
      if (!data) continue;
      
      const coords = posKey.split(',').map(Number);
      if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const x = coords[0];
        const y = coords[1];
        const intensity = data.count / maxTraffic; // Normalize to 0-1
        
        heatmapData.push({ x, y, intensity });
      }
    }
    
    return heatmapData;
  }
}
