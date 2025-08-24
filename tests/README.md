# Test Organization

This directory contains all tests for the Screeps AI project, organized into logical categories for easy navigation and maintenance.

## Directory Structure

### `/unit/` - Unit Tests
Tests that focus on individual components or functions in isolation.

- `test_priority_building_system.js` - Tests Builder role's priority-based construction site selection

### `/integration/` - Integration Tests
Tests that verify how multiple components work together.

- `test_hauler_rcl3_integration.js` - Complete Hauler role integration for RCL 3
- `test_rcl2_rcl3_readiness.js` - RCL 2→3 transition readiness validation
- `test_rcl2_rcl3_validation.js` - RCL 2→3 system validation
- `test_storage_management_system.js` - Storage management system integration
- `test_storage_system_validation.js` - Storage system validation

### `/system/` - System Tests
End-to-end tests that validate entire system behaviors.

- `test_improved_spawning_system.js` - Enhanced spawning system validation
- `test_planning_system.js` - Room planning system validation
- `test_spawning_energy_issue.js` - Energy threshold spawning tests
- `test_system_validation.js` - Overall system validation

### `/fixes/` - Bug Fix Tests
Tests that validate specific bug fixes and prevent regressions.

- `test_complete_extension_fix.js` - Complete extension placement fix validation
- `test_construction_validation.js` - Construction site validation tests
- `test_createconstructionsite_fix.js` - createConstructionSite API fix tests
- `test_duplicate_road_planning_fix.js` - Duplicate road planning prevention
- `test_existing_invalid_extensions_memory.js` - Invalid extension memory handling
- `test_existing_structure_detection.js` - Existing structure detection logic
- `test_immediate_road_placement.js` - Immediate road placement timing fix
- `test_position_fix_simple.js` - Simple position handling fix
- `test_position_lookfor_fix.js` - RoomPosition.lookFor() memory serialization fix
- `test_rcl_structure_limits_fix.js` - RCL structure limits correction
- `test_road_placement_fix.js` - Road placement priority filtering fix
- `test_roommanager_construction_fix.js` - RoomManager construction site placement

### `/tools/` - Diagnostic and Utility Tools
Scripts for debugging, diagnostics, and manual fixes.

- `diagnose_extension_positions.js` - Diagnose plan vs reality position mismatches
- `fix_existing_structure_marking.js` - Mark existing structures as placed in plans
- `fix_plan_to_match_reality.js` - Align room plans with actual structure positions
- `force_replan_command.js` - Force room replanning by clearing memory
- `test_debug_current_issue.js` - General debugging and issue investigation

### `/compatibility/` - Compatibility Tests
Tests that ensure compatibility with different environments and standards.

- `test_es2019_compatibility.js` - ES2019 compatibility validation for Screeps

## Running Tests

Most tests are standalone JavaScript files that can be run with Node.js:

```bash
# Run a specific test
node tests/unit/test_priority_building_system.js

# Run integration tests
node tests/integration/test_hauler_rcl3_integration.js

# Run diagnostic tools
node tests/tools/diagnose_extension_positions.js
```

## Test Categories Explained

### Unit Tests
- Focus on single components
- Mock external dependencies
- Fast execution
- High isolation

### Integration Tests
- Test component interactions
- Validate feature completeness
- Test realistic scenarios
- Moderate complexity

### System Tests
- End-to-end validation
- Full system behavior
- Performance validation
- High complexity

### Fix Tests
- Prevent regression bugs
- Validate specific fixes
- Document historical issues
- Targeted validation

### Tools
- Manual debugging aids
- Diagnostic utilities
- One-time fix scripts
- Development helpers

### Compatibility
- Environment validation
- Standards compliance
- Cross-platform testing
- Version compatibility

## Best Practices

1. **Naming Convention**: Use descriptive names that clearly indicate what is being tested
2. **Organization**: Place tests in the most appropriate category based on their primary purpose
3. **Documentation**: Include clear descriptions of what each test validates
4. **Isolation**: Keep tests independent and avoid dependencies between test files
5. **Maintenance**: Update tests when corresponding code changes
6. **Coverage**: Ensure critical functionality has appropriate test coverage

## Historical Context

This test organization was created to clean up the previously scattered test files that were mixed with source code in the root directory. The categorization reflects the evolution of the Screeps AI project, with many tests created to validate specific bug fixes and system improvements during development.
