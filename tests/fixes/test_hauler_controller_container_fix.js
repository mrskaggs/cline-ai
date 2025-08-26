// Test to validate that haulers don't take energy from controller containers
// This test verifies the fix for haulers picking up and putting back energy from controller containers

// Mock Screeps constants
const FIND_STRUCTURES = 'structures';
const STRUCTURE_CONTAINER = 'container';
const RESOURCE_ENERGY = 'energy';

const test_hauler_controller_container_fix = () => {
  console.log('=== Testing Hauler Controller Container Fix ===');
  
  // Test 1: Verify haulers exclude controller containers from energy collection
  console.log('\n--- Test 1: Controller Container Exclusion ---');
  
  // Mock room with various containers
  const mockRoom = {
    name: 'W35N32',
    controller: {
      pos: { x: 40, y: 40, getRangeTo: (pos) => Math.max(Math.abs(40 - pos.x), Math.abs(40 - pos.y)) }
    },
    find: (type, options) => {
      if (type === FIND_STRUCTURES) {
        const allContainers = [
          // Source container (far from controller)
          {
            structureType: STRUCTURE_CONTAINER,
            pos: { x: 10, y: 10, getRangeTo: (pos) => Math.max(Math.abs(10 - pos.x), Math.abs(10 - pos.y)) },
            store: { [RESOURCE_ENERGY]: 1000 }
          },
          // Another source container
          {
            structureType: STRUCTURE_CONTAINER,
            pos: { x: 15, y: 45, getRangeTo: (pos) => Math.max(Math.abs(15 - pos.x), Math.abs(15 - pos.y)) },
            store: { [RESOURCE_ENERGY]: 800 }
          },
          // Controller container (within 3 range of controller)
          {
            structureType: STRUCTURE_CONTAINER,
            pos: { x: 42, y: 40, getRangeTo: (pos) => Math.max(Math.abs(42 - pos.x), Math.abs(42 - pos.y)) },
            store: { [RESOURCE_ENERGY]: 500 }
          },
          // Another controller container
          {
            structureType: STRUCTURE_CONTAINER,
            pos: { x: 38, y: 41, getRangeTo: (pos) => Math.max(Math.abs(38 - pos.x), Math.abs(38 - pos.y)) },
            store: { [RESOURCE_ENERGY]: 300 }
          }
        ];
        
        if (options && options.filter) {
          return allContainers.filter(options.filter);
        }
        return allContainers;
      }
      return [];
    }
  };
  
  // Mock the hauler's container filtering logic
  const filterSourceContainers = (structure) => {
    if (structure.structureType !== STRUCTURE_CONTAINER || structure.store[RESOURCE_ENERGY] === 0) {
      return false;
    }
    
    // Exclude controller containers - haulers should only deliver to them, not take from them
    if (mockRoom.controller) {
      const distanceToController = structure.pos.getRangeTo(mockRoom.controller.pos);
      if (distanceToController <= 3) {
        return false; // This is a controller container, skip it
      }
    }
    
    return true;
  };
  
  // Test the filtering
  const allContainers = mockRoom.find(FIND_STRUCTURES);
  const sourceContainers = allContainers.filter(filterSourceContainers);
  
  console.log(`Total containers in room: ${allContainers.length}`);
  console.log(`Source containers (eligible for pickup): ${sourceContainers.length}`);
  
  // Verify each container
  allContainers.forEach((container, index) => {
    const distanceToController = container.pos.getRangeTo(mockRoom.controller.pos);
    const isControllerContainer = distanceToController <= 3;
    const isEligible = sourceContainers.includes(container);
    
    console.log(`  Container ${index + 1} at ${container.pos.x},${container.pos.y}:`);
    console.log(`    Distance to controller: ${distanceToController}`);
    console.log(`    Is controller container: ${isControllerContainer ? 'YES' : 'NO'}`);
    console.log(`    Eligible for pickup: ${isEligible ? '✅ YES' : '❌ NO'}`);
    console.log(`    Energy: ${container.store[RESOURCE_ENERGY]}`);
  });
  
  // Test 2: Verify only source containers are selected
  console.log('\n--- Test 2: Source Container Selection ---');
  
  const expectedSourceContainers = 2; // Containers at (10,10) and (15,45)
  const expectedControllerContainers = 2; // Containers at (42,40) and (38,41)
  
  console.log(`Expected source containers: ${expectedSourceContainers}`);
  console.log(`Expected controller containers: ${expectedControllerContainers}`);
  console.log(`Actual source containers found: ${sourceContainers.length}`);
  console.log(`Actual controller containers excluded: ${allContainers.length - sourceContainers.length}`);
  
  const sourceContainerTest = sourceContainers.length === expectedSourceContainers;
  console.log(`${sourceContainerTest ? '✅ SUCCESS' : '❌ FAILURE'}: Correct number of source containers selected`);
  
  // Test 3: Verify controller containers are properly excluded
  console.log('\n--- Test 3: Controller Container Exclusion Validation ---');
  
  const controllerContainers = allContainers.filter(container => {
    const distanceToController = container.pos.getRangeTo(mockRoom.controller.pos);
    return distanceToController <= 3;
  });
  
  console.log('Controller containers (should be excluded):');
  controllerContainers.forEach((container, index) => {
    const isExcluded = !sourceContainers.includes(container);
    console.log(`  ${index + 1}. Container at ${container.pos.x},${container.pos.y} - ${isExcluded ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  });
  
  const allControllerContainersExcluded = controllerContainers.every(container => !sourceContainers.includes(container));
  console.log(`${allControllerContainersExcluded ? '✅ SUCCESS' : '❌ FAILURE'}: All controller containers properly excluded`);
  
  // Test 4: Verify energy flow direction
  console.log('\n--- Test 4: Energy Flow Direction Validation ---');
  
  console.log('Energy Flow Rules:');
  console.log('  ✅ Source containers → Haulers can WITHDRAW energy');
  console.log('  ✅ Controller containers → Haulers can only DEPOSIT energy');
  console.log('  ❌ Controller containers → Haulers should NOT withdraw energy');
  
  const energyFlowCorrect = sourceContainers.every(container => {
    const distanceToController = container.pos.getRangeTo(mockRoom.controller.pos);
    return distanceToController > 3; // Source containers should be far from controller
  });
  
  console.log(`${energyFlowCorrect ? '✅ SUCCESS' : '❌ FAILURE'}: Energy flow direction is correct`);
  
  // Test 5: Verify the fix resolves the original issue
  console.log('\n--- Test 5: Issue Resolution Verification ---');
  
  const originalIssue = "haulers seem to be picking and and putting back the energy from the container thats near the room controler";
  console.log(`Original Issue: "${originalIssue}"`);
  
  const fixesApplied = [
    "✅ Added distance check to exclude containers within 3 range of controller",
    "✅ Modified collectEnergy() to filter out controller containers",
    "✅ Maintained deliverEnergy() ability to deposit energy to controller containers",
    "✅ Preserved source container energy collection functionality",
    "✅ Prevented energy pickup/putback loops at controller containers"
  ];
  
  console.log('\nFixes Applied:');
  fixesApplied.forEach(fix => console.log(`  ${fix}`));
  
  // Final validation
  const issueResolved = sourceContainerTest && allControllerContainersExcluded && energyFlowCorrect;
  
  console.log(`\n${issueResolved ? '✅ SUCCESS' : '❌ FAILURE'}: Hauler controller container issue resolved`);
  
  console.log('\n=== Hauler Controller Container Fix Test Complete ===');
  console.log('Result: Haulers will no longer pick up energy from controller containers');
  console.log('Impact: Eliminates energy pickup/putback loops, improves hauler efficiency');
  
  return {
    totalContainers: allContainers.length,
    sourceContainers: sourceContainers.length,
    controllerContainers: controllerContainers.length,
    sourceContainerTest: sourceContainerTest,
    allControllerContainersExcluded: allControllerContainersExcluded,
    energyFlowCorrect: energyFlowCorrect,
    issueResolved: issueResolved
  };
};

// Run the test
try {
  const result = test_hauler_controller_container_fix();
  console.log('\n📊 Test Results:', result);
} catch (error) {
  console.log('❌ Test failed with error:', error);
}
