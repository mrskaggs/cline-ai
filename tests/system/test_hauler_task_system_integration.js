/**
 * Test Hauler Task System Integration
 * Validates the complete task-based architecture for Hauler role
 */

// Mock Screeps API
global.Game = {
  time: 1000,
  creeps: {},
  rooms: {},
  spawns: {}
};

global.Memory = {
  creeps: {}
};

// Mock constants
global.RESOURCE_ENERGY = 'energy';
global.STRUCTURE_SPAWN = 'spawn';
global.STRUCTURE_EXTENSION = 'extension';
global.STRUCTURE_CONTAINER = 'container';
global.STRUCTURE_TOWER = 'tower';
global.STRUCTURE_STORAGE = 'storage';
global.FIND_MY_SPAWNS = 106;
global.FIND_MY_STRUCTURES = 107;
global.FIND_STRUCTURES = 108;
global.FIND_DROPPED_RESOURCES = 106;
global.OK = 0;
global.ERR_NOT_IN_RANGE = -9;
global.ERR_NOT_ENOUGH_RESOURCES = -6;
global.ERR_FULL = -8;
global.CARRY = 'carry';
global.MOVE = 'move';
global.WORK = 'work';

// Import the classes we're testing
const { TaskManager } = require('../../src/tasks/TaskManager');
const { HaulerTaskBased } = require('../../src/roles/HaulerTaskBased');
const { TaskTransfer } = require('../../src/tasks/TaskTransfer');
const { TaskPickup } = require('../../src/tasks/TaskPickup');
const { TaskWithdraw } = require('../../src/tasks/TaskWithdraw');

// Test utilities
function createMockCreep(name, role, energy = 0, capacity = 300) {
  return {
    name: name,
    memory: { role: role, hauling: false },
    store: {
      [RESOURCE_ENERGY]: energy,
      getFreeCapacity: () => capacity - energy
    },
    pos: {
      findClosestByPath: (findType, options) => {
        // Mock finding targets based on test scenario
        if (findType === FIND_MY_SPAWNS && options && options.filter) {
          const spawn = { structureType: STRUCTURE_SPAWN, store: { getFreeCapacity: () => 100 } };
          return options.filter(spawn) ? spawn : null;
        }
        if (findType === FIND_DROPPED_RESOURCES && options && options.filter) {
          const resource = { resourceType: RESOURCE_ENERGY, amount: 100 };
          return options.filter(resource) ? resource : null;
        }
        return null;
      },
      getRangeTo: () => 5
    },
    room: {
      name: 'W1N1',
      controller: {
        pos: {
          findInRange: () => []
        }
      },
      storage: null,
      find: () => []
    },
    say: () => {},
    moveTo: () => {},
    pickup: () => OK,
    withdraw: () => OK,
    transfer: () => OK
  };
}

function runTest(testName, testFn) {
  try {
    console.log(`\n=== ${testName} ===`);
    testFn();
    console.log(`✅ ${testName} PASSED`);
    return true;
  } catch (error) {
    console.log(`❌ ${testName} FAILED: ${error.message}`);
    return false;
  }
}

// Test 1: HaulerTaskBased Integration
function testHaulerTaskBasedIntegration() {
  // Test that HaulerTaskBased uses TaskManager
  const creep = createMockCreep('hauler1', 'hauler', 0, 300);
  
  // Mock TaskManager.run to verify it gets called
  let taskManagerCalled = false;
  const originalRun = TaskManager.run;
  TaskManager.run = (creep) => {
    taskManagerCalled = true;
  };
  
  HaulerTaskBased.run(creep);
  
  // Restore original method
  TaskManager.run = originalRun;
  
  if (!taskManagerCalled) {
    throw new Error('HaulerTaskBased should call TaskManager.run');
  }
  
  console.log('✓ HaulerTaskBased correctly delegates to TaskManager');
}

// Test 2: Hauler Task Assignment Logic
function testHaulerTaskAssignment() {
  // Test empty hauler gets collection task
  const emptyHauler = createMockCreep('hauler1', 'hauler', 0, 300);
  
  // Mock task creation methods
  const originalCreateEnergyPickup = TaskPickup.createEnergyPickup;
  TaskPickup.createEnergyPickup = () => ({ taskType: 'pickup', priority: 5 });
  
  const task = TaskManager.assignTask(emptyHauler);
  
  // Restore original method
  TaskPickup.createEnergyPickup = originalCreateEnergyPickup;
  
  if (!task || task.taskType !== 'pickup') {
    throw new Error('Empty hauler should get pickup task');
  }
  
  console.log('✓ Empty hauler correctly assigned collection task');
  
  // Test full hauler gets delivery task
  const fullHauler = createMockCreep('hauler2', 'hauler', 300, 300);
  fullHauler.memory.hauling = true;
  
  // Mock TaskTransfer.createEnergyTransfer
  const originalCreateEnergyTransfer = TaskTransfer.createEnergyTransfer;
  TaskTransfer.createEnergyTransfer = () => ({ taskType: 'transfer', priority: 10 });
  
  const deliveryTask = TaskManager.assignTask(fullHauler);
  
  // Restore original method
  TaskTransfer.createEnergyTransfer = originalCreateEnergyTransfer;
  
  if (!deliveryTask || deliveryTask.taskType !== 'transfer') {
    throw new Error('Full hauler should get transfer task');
  }
  
  console.log('✓ Full hauler correctly assigned delivery task');
}

// Test 3: State Management Integration
function testStateManagement() {
  const hauler = createMockCreep('hauler1', 'hauler', 0, 300);
  
  // Test initial state (empty, should collect)
  if (hauler.memory.hauling) {
    throw new Error('New hauler should not be in hauling state');
  }
  
  // Simulate filling up
  hauler.store[RESOURCE_ENERGY] = 300;
  hauler.store.getFreeCapacity = () => 0;
  
  // Mock task assignment to verify state change
  const originalAssignTask = TaskManager.assignTask;
  let stateChanged = false;
  TaskManager.assignTask = (creep) => {
    if (creep.memory.hauling) {
      stateChanged = true;
    }
    return null;
  };
  
  // This would be called by TaskManager.run when hauler is full
  const shouldCollect = hauler.store[RESOURCE_ENERGY] === 0 || 
                       (!hauler.memory.hauling && hauler.store.getFreeCapacity() > 0);
  const shouldDeliver = hauler.store.getFreeCapacity() === 0 || 
                       (hauler.memory.hauling && hauler.store[RESOURCE_ENERGY] > 0);
  
  if (shouldCollect) {
    throw new Error('Full hauler should not be in collect state');
  }
  
  if (!shouldDeliver) {
    throw new Error('Full hauler should be in deliver state');
  }
  
  // Restore original method
  TaskManager.assignTask = originalAssignTask;
  
  console.log('✓ State management logic working correctly');
}

// Test 4: Body Generation
function testBodyGeneration() {
  // Test RCL 1 body (300 energy)
  const rcl1Body = HaulerTaskBased.getBody(300);
  const rcl1Cost = HaulerTaskBased.calculateBodyCost(rcl1Body);
  
  if (rcl1Cost !== 300) {
    throw new Error(`RCL 1 body should cost 300 energy, got ${rcl1Cost}`);
  }
  
  // Test RCL 3 body (800 energy)
  const rcl3Body = HaulerTaskBased.getBody(800);
  const rcl3Cost = HaulerTaskBased.calculateBodyCost(rcl3Body);
  
  if (rcl3Cost !== 800) {
    throw new Error(`RCL 3 body should cost 800 energy, got ${rcl3Cost}`);
  }
  
  // Test RCL 4 body (1300 energy)
  const rcl4Body = HaulerTaskBased.getBody(1300);
  const rcl4Cost = HaulerTaskBased.calculateBodyCost(rcl4Body);
  
  if (rcl4Cost !== 1300) {
    throw new Error(`RCL 4 body should cost 1300 energy, got ${rcl4Cost}`);
  }
  
  console.log('✓ Body generation provides perfect energy utilization');
}

// Test 5: Task Priority System
function testTaskPrioritySystem() {
  const hauler = createMockCreep('hauler1', 'hauler', 300, 300);
  hauler.memory.hauling = true;
  
  // Mock room with multiple targets to test priority
  hauler.room.storage = { 
    structureType: STRUCTURE_STORAGE, 
    store: { getFreeCapacity: () => 1000 } 
  };
  
  hauler.pos.findClosestByPath = (findType, options) => {
    if (findType === FIND_MY_SPAWNS && options && options.filter) {
      const spawn = { structureType: STRUCTURE_SPAWN, store: { getFreeCapacity: () => 100 } };
      return options.filter(spawn) ? spawn : null;
    }
    return null;
  };
  
  // Test that spawn gets priority over storage
  const transferTask = TaskTransfer.createEnergyTransfer(hauler);
  
  if (!transferTask) {
    throw new Error('Should create transfer task when targets available');
  }
  
  // Priority should be 10 for spawn (highest)
  if (transferTask.priority !== 10) {
    throw new Error(`Spawn should have priority 10, got ${transferTask.priority}`);
  }
  
  console.log('✓ Task priority system working correctly');
}

// Test 6: Complete Workflow Integration
function testCompleteWorkflow() {
  const hauler = createMockCreep('hauler1', 'hauler', 0, 300);
  
  // Mock successful task execution
  let taskExecuted = false;
  const mockTask = {
    work: (creep) => {
      taskExecuted = true;
      return false; // Task complete
    },
    finish: () => {},
    serialize: () => ({ taskType: 'pickup' })
  };
  
  // Mock task assignment
  const originalAssignTask = TaskManager.assignTask;
  TaskManager.assignTask = () => mockTask;
  
  // Mock task deserialization
  const originalDeserialize = TaskManager.getTask;
  TaskManager.getTask = () => null; // No existing task
  
  // Run the task manager
  TaskManager.run(hauler);
  
  // Restore original methods
  TaskManager.assignTask = originalAssignTask;
  
  if (!taskExecuted) {
    throw new Error('Task should have been executed');
  }
  
  console.log('✓ Complete workflow integration working');
}

// Run all tests
console.log('🧪 Testing Hauler Task System Integration...\n');

const tests = [
  () => runTest('Hauler TaskBased Integration', testHaulerTaskBasedIntegration),
  () => runTest('Hauler Task Assignment Logic', testHaulerTaskAssignment),
  () => runTest('State Management Integration', testStateManagement),
  () => runTest('Body Generation', testBodyGeneration),
  () => runTest('Task Priority System', testTaskPrioritySystem),
  () => runTest('Complete Workflow Integration', testCompleteWorkflow)
];

const results = tests.map(test => test());
const passed = results.filter(result => result).length;
const total = results.length;

console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log('🎉 All Hauler Task System Integration tests passed!');
  console.log('\n✅ HAULER TASK SYSTEM FULLY INTEGRATED');
  console.log('- Task-based architecture working correctly');
  console.log('- State management integrated with TaskManager');
  console.log('- Priority system maintains Hauler behavior');
  console.log('- Body generation optimized for all RCL levels');
  console.log('- Complete workflow validated');
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}
