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
