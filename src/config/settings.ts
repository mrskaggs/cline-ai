// Global configuration settings for the Screeps AI

export const Settings = {
  // Creep population targets
  population: {
    harvester: {
      rcl1: 4,  // At RCL1, harvesters do everything
      rcl2Plus: 2,  // At RCL2+, specialized roles take over
    },
    upgrader: {
      rcl2: 1,
      rcl3Plus: 2,
    },
    builder: {
      base: 1,
      withConstructionSites: 2,
      maxPerRcl: 3,
    },
  },

  // Energy thresholds for creep body generation
  energy: {
    emergency: 200,  // Minimum energy to spawn basic creep
    basic: 300,      // Basic enhanced creep
    advanced: 400,   // Advanced creep with better parts
    premium: 500,    // Premium creep for higher RCL
  },

  // Creep body templates
  bodies: {
    harvester: {
      basic: [WORK, CARRY, MOVE],                    // 200 energy
      enhanced: [WORK, WORK, CARRY, MOVE],           // 300 energy
      advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE], // 400 energy
    },
    upgrader: {
      basic: [WORK, CARRY, MOVE],                    // 200 energy
      enhanced: [WORK, WORK, CARRY, MOVE],           // 300 energy
      advanced: [WORK, WORK, CARRY, CARRY, MOVE],    // 400 energy
      premium: [WORK, WORK, WORK, CARRY, CARRY, MOVE], // 500 energy
    },
    builder: {
      basic: [WORK, CARRY, MOVE],                    // 200 energy
      enhanced: [WORK, CARRY, CARRY, MOVE, MOVE],    // 350 energy
      advanced: [WORK, WORK, CARRY, CARRY, MOVE, MOVE], // 450 energy
    },
  },

  // Room management settings
  room: {
    memoryUpdateInterval: 10,  // Ticks between room memory updates
    defenseRange: 5,           // Range to look for hostiles
    repairThreshold: 0.8,      // Repair structures below this health ratio
    roadRepairThreshold: 0.6,  // Repair roads below this health ratio (improved from 0.5)
    emergencyRepairThreshold: 0.1,  // Emergency repair threshold for critical structures
    rampartRepairThreshold: 0.8,    // Repair ramparts below this health ratio
  },

  // CPU and performance settings
  cpu: {
    bucketFloor: 1000,         // Minimum bucket before throttling
    emergencyBucket: 500,      // Emergency mode bucket threshold
    maxCpuPerTick: 0.9,        // Maximum CPU usage per tick (as ratio)
  },

  // Logging and debugging - OPTIMIZED FOR PERFORMANCE
  logging: {
    enabled: true,
    logLevel: 'WARN',          // WARN level reduces CPU overhead (was INFO)
    logCreepActions: false,    // Log individual creep actions
    logSpawning: false,        // Disabled for performance (was true)
    logRoomUpdates: false,     // Log room memory updates
  },

  // Planning system settings - OPTIMIZED FOR RCL 2-3
  planning: {
    enabled: true,
    planningCadence: 100,          // Reduced frequency for CPU savings (was 50)
    constructionCadence: 15,       // Slightly reduced frequency (was 10)
    maxConstructionSites: 4,       // Reduced for focus (was 5)
    trafficAnalysisEnabled: false, // Disabled until RCL 3+ (was true)
    trafficDataTTL: 500,          // Reduced retention (was 1000)
    layoutAnalysisTTL: 5000,      // Ticks to keep layout analysis
    roadPlanningEnabled: true,
    buildingPlanningEnabled: true,
    useTemplates: true,           // Use predefined layout templates
    useDynamicPlacement: true,    // Use dynamic building placement
    minTrafficForRoad: 5,         // Minimum traffic count to justify a road
    roadPriorityThreshold: 10,    // Traffic score threshold for high priority roads
    minTrafficDataPoints: 20,     // Minimum traffic data points before road planning
    constructionSiteMaxAge: 1200, // Reduced age for faster cleanup (was 1500)
  },

  // Game stance and behavior
  stance: 'peace' as 'peace' | 'alert' | 'war',

  // Version info
  version: '1.0.0',
  buildDate: 'static-build',
};

// Helper functions for settings
export const SettingsHelper = {
  // Get required creep count for a role based on room conditions
  getRequiredCreepCount(role: string, rcl: number, sourceCount: number, constructionSites: number): number {
    switch (role) {
      case 'harvester':
        return rcl === 1 
          ? Math.max(Settings.population.harvester.rcl1, sourceCount * 2)
          : Math.max(Settings.population.harvester.rcl2Plus, sourceCount);
      
      case 'upgrader':
        return rcl >= 3 ? Settings.population.upgrader.rcl3Plus : Settings.population.upgrader.rcl2;
      
      case 'builder':
        const baseBuilders = constructionSites > 0 
          ? Settings.population.builder.withConstructionSites 
          : Settings.population.builder.base;
        return Math.min(baseBuilders, Math.floor(rcl / 2) + 1, Settings.population.builder.maxPerRcl);
      
      default:
        return 0;
    }
  },

  // Get creep body based on role and available energy
  getCreepBody(role: string, energyAvailable: number): BodyPartConstant[] {
    const bodies = Settings.bodies[role as keyof typeof Settings.bodies];
    if (!bodies) {
      return Settings.bodies.harvester.basic;
    }

    if (energyAvailable >= Settings.energy.premium && 'premium' in bodies) {
      return (bodies as any).premium;
    } else if (energyAvailable >= Settings.energy.advanced && 'advanced' in bodies) {
      return (bodies as any).advanced;
    } else if (energyAvailable >= Settings.energy.basic && 'enhanced' in bodies) {
      return (bodies as any).enhanced;
    } else {
      return (bodies as any).basic;
    }
  },

  // Check if logging is enabled for a specific level
  shouldLog(level: string): boolean {
    if (!Settings.logging.enabled) return false;
    
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(Settings.logging.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex;
  },
};
