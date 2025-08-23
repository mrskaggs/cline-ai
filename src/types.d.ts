// -- Memory Structures -- //

interface CreepMemory {
  role: string;
  task?: string;
  sourceId?: Id<Source>;
  targetId?: Id<Structure> | Id<ConstructionSite> | Id<Creep>;
  working?: boolean;
  homeRoom: string;
}

interface RoomMemory {
  sources: { [id: Id<Source>]: SourceMemory };
  controllerId?: Id<StructureController>;
  spawnIds: Id<StructureSpawn>[];
  lastUpdated: number;
  rcl: number;
  plan?: RoomPlan;
  trafficData?: TrafficData;
  layoutAnalysis?: {
    terrain: TerrainAnalysis;
    keyPositions: KeyPositions;
    lastAnalyzed: number;
  };
}

interface SourceMemory {
  minerId?: Id<Creep>;
  containerId?: Id<StructureContainer>;
  linkId?: Id<StructureLink>;
  path?: RoomPosition[];
}

interface Memory {
  uuid: number;
  log: any;
  creeps: { [name: string]: CreepMemory };
  rooms: { [name: string]: RoomMemory };
  spawns: { [name: string]: SpawnMemory };
  flags: { [name: string]: FlagMemory };
  empire: any;
}

// -- Global & Kernel -- //

declare namespace NodeJS {
  interface Global {
    kernel: IKernel;
  }
}

interface IKernel {
  run(): void;
  // Add more kernel methods as needed
}

// -- Planning System Types -- //

interface RoomPlan {
  roomName: string;
  rcl: number;
  lastUpdated: number;
  buildings: PlannedBuilding[];
  roads: PlannedRoad[];
  status: 'planning' | 'ready' | 'building' | 'complete';
  priority: number;
}

interface PlannedBuilding {
  structureType: BuildableStructureConstant;
  pos: RoomPosition;
  priority: number;
  rclRequired: number;
  placed: boolean;
  constructionSiteId?: Id<ConstructionSite>;
  reason: string; // Why this position was chosen
}

interface PlannedRoad {
  pos: RoomPosition;
  priority: number;
  trafficScore: number;
  placed: boolean;
  constructionSiteId?: Id<ConstructionSite>;
  pathType: 'source' | 'controller' | 'mineral' | 'exit' | 'internal';
}

interface TrafficData {
  [key: string]: { // position key "x,y"
    count: number;
    lastSeen: number;
    creepTypes: string[];
  };
}

interface LayoutTemplate {
  name: string;
  rcl: number;
  buildings: TemplateBuilding[];
  centerOffset: { x: number; y: number };
}

interface TemplateBuilding {
  structureType: BuildableStructureConstant;
  offset: { x: number; y: number };
  priority: number;
}

interface TerrainAnalysis {
  openSpaces: RoomPosition[];
  walls: RoomPosition[];
  swamps: RoomPosition[];
  exits: RoomPosition[];
  centralArea: RoomPosition;
}

interface KeyPositions {
  spawn: RoomPosition[];
  sources: RoomPosition[];
  controller: RoomPosition | undefined;
  mineral: RoomPosition | undefined;
  exits: RoomPosition[];
}
