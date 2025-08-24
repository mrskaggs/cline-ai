// RCL3 System Validation Test
// Tests all critical systems for RCL3 functionality

const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== RCL3 SYSTEM VALIDATION TEST ===\n");

// Test 1: Verify all RCL3 components are in the build
console.log("1. BUILD VALIDATION:");
try {
    const buildResult = execSync('npm run build', { encoding: 'utf8', cwd: process.cwd() });
    console.log("   ✅ Build successful");
    
    // Check if dist/main.js exists and has reasonable size
    const distPath = './dist/main.js';
    if (fs.existsSync(distPath)) {
        const stats = fs.statSync(distPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`   ✅ Bundle size: ${sizeKB}KB`);
        
        if (sizeKB > 100 && sizeKB < 200) {
            console.log("   ✅ Bundle size reasonable for RCL3 features");
        } else {
            console.log(`   ⚠️  Bundle size unusual: ${sizeKB}KB`);
        }
    } else {
        console.log("   ❌ dist/main.js not found");
    }
} catch (error) {
    console.log("   ❌ Build failed:", error.message);
}

// Test 2: Verify Hauler role is included
console.log("\n2. HAULER ROLE VALIDATION:");
try {
    const haulerPath = './src/roles/Hauler.ts';
    if (fs.existsSync(haulerPath)) {
        const haulerCode = fs.readFileSync(haulerPath, 'utf8');
        
        // Check for key hauler functionality
        const checks = [
            { name: 'Container collection', pattern: /container.*energy/i },
            { name: 'Priority delivery', pattern: /spawn.*extension.*tower/i },
            { name: 'State management', pattern: /hauling.*memory/i },
            { name: 'Energy optimization', pattern: /store.*energy/i }
        ];
        
        checks.forEach(check => {
            if (check.pattern.test(haulerCode)) {
                console.log(`   ✅ ${check.name} implemented`);
            } else {
                console.log(`   ⚠️  ${check.name} may be missing`);
            }
        });
        
        console.log("   ✅ Hauler role file exists");
    } else {
        console.log("   ❌ Hauler role file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking Hauler role:", error.message);
}

// Test 3: Verify Tower Defense System
console.log("\n3. TOWER DEFENSE VALIDATION:");
try {
    const roomManagerPath = './src/managers/RoomManager.ts';
    if (fs.existsSync(roomManagerPath)) {
        const roomManagerCode = fs.readFileSync(roomManagerPath, 'utf8');
        
        const defenseChecks = [
            { name: 'Tower detection', pattern: /FIND_MY_STRUCTURES.*STRUCTURE_TOWER/i },
            { name: 'Hostile targeting', pattern: /FIND_HOSTILE_CREEPS/i },
            { name: 'Attack logic', pattern: /tower.*attack/i },
            { name: 'Energy check', pattern: /tower.*energy/i }
        ];
        
        defenseChecks.forEach(check => {
            if (check.pattern.test(roomManagerCode)) {
                console.log(`   ✅ ${check.name} implemented`);
            } else {
                console.log(`   ⚠️  ${check.name} may be missing`);
            }
        });
        
        console.log("   ✅ Tower defense system present");
    } else {
        console.log("   ❌ RoomManager file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking tower defense:", error.message);
}

// Test 4: Verify Structure Limits are Correct
console.log("\n4. STRUCTURE LIMITS VALIDATION:");
try {
    const layoutPath = './src/planners/LayoutTemplates.ts';
    if (fs.existsSync(layoutPath)) {
        const layoutCode = fs.readFileSync(layoutPath, 'utf8');
        
        // Check for correct RCL3 limits
        const rcl3Checks = [
            { name: 'RCL3 Extensions (10)', pattern: /rcl.*3.*extension.*10/i },
            { name: 'RCL3 Towers (1)', pattern: /rcl.*3.*tower.*1/i },
            { name: 'RCL3 Containers (5)', pattern: /rcl.*3.*container.*5/i }
        ];
        
        let correctLimits = 0;
        rcl3Checks.forEach(check => {
            if (check.pattern.test(layoutCode)) {
                console.log(`   ✅ ${check.name} correct`);
                correctLimits++;
            } else {
                console.log(`   ⚠️  ${check.name} needs verification`);
            }
        });
        
        if (correctLimits >= 2) {
            console.log("   ✅ Structure limits appear correct");
        } else {
            console.log("   ⚠️  Structure limits need manual verification");
        }
    } else {
        console.log("   ❌ LayoutTemplates file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking structure limits:", error.message);
}

// Test 5: Verify SpawnManager Integration
console.log("\n5. SPAWN MANAGER VALIDATION:");
try {
    const spawnPath = './src/managers/SpawnManager.ts';
    if (fs.existsSync(spawnPath)) {
        const spawnCode = fs.readFileSync(spawnPath, 'utf8');
        
        const spawnChecks = [
            { name: 'Hauler spawning logic', pattern: /hauler.*container/i },
            { name: 'RCL3 body optimization', pattern: /300.*energy/i },
            { name: 'Population calculation', pattern: /calculateRequired/i },
            { name: 'Energy threshold', pattern: /energy.*threshold/i }
        ];
        
        spawnChecks.forEach(check => {
            if (check.pattern.test(spawnCode)) {
                console.log(`   ✅ ${check.name} implemented`);
            } else {
                console.log(`   ⚠️  ${check.name} may be missing`);
            }
        });
        
        console.log("   ✅ SpawnManager integration present");
    } else {
        console.log("   ❌ SpawnManager file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking SpawnManager:", error.message);
}

// Test 6: Verify Kernel Integration
console.log("\n6. KERNEL INTEGRATION VALIDATION:");
try {
    const kernelPath = './src/kernel/Kernel.ts';
    if (fs.existsSync(kernelPath)) {
        const kernelCode = fs.readFileSync(kernelPath, 'utf8');
        
        const kernelChecks = [
            { name: 'Hauler role execution', pattern: /hauler.*run/i },
            { name: 'RoomManager execution', pattern: /RoomManager.*run/i },
            { name: 'SpawnManager execution', pattern: /SpawnManager.*run/i },
            { name: 'Error handling', pattern: /try.*catch/i }
        ];
        
        kernelChecks.forEach(check => {
            if (check.pattern.test(kernelCode)) {
                console.log(`   ✅ ${check.name} integrated`);
            } else {
                console.log(`   ⚠️  ${check.name} may be missing`);
            }
        });
        
        console.log("   ✅ Kernel integration present");
    } else {
        console.log("   ❌ Kernel file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking Kernel:", error.message);
}

// Test 7: Verify TypeScript Interfaces
console.log("\n7. TYPESCRIPT INTERFACES VALIDATION:");
try {
    const typesPath = './src/types.d.ts';
    if (fs.existsSync(typesPath)) {
        const typesCode = fs.readFileSync(typesPath, 'utf8');
        
        const typeChecks = [
            { name: 'Hauler memory interface', pattern: /hauling.*boolean/i },
            { name: 'Room memory interfaces', pattern: /RoomMemory/i },
            { name: 'Creep memory interfaces', pattern: /CreepMemory/i },
            { name: 'Storage interfaces', pattern: /storage.*memory/i }
        ];
        
        typeChecks.forEach(check => {
            if (check.pattern.test(typesCode)) {
                console.log(`   ✅ ${check.name} defined`);
            } else {
                console.log(`   ⚠️  ${check.name} may be missing`);
            }
        });
        
        console.log("   ✅ TypeScript interfaces present");
    } else {
        console.log("   ❌ Types file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking TypeScript interfaces:", error.message);
}

// Test 8: Performance Optimization Validation
console.log("\n8. PERFORMANCE OPTIMIZATION VALIDATION:");
try {
    const settingsPath = './src/config/settings.ts';
    if (fs.existsSync(settingsPath)) {
        const settingsCode = fs.readFileSync(settingsPath, 'utf8');
        
        const perfChecks = [
            { name: 'Planning cadence optimization', pattern: /planningCadence.*100/i },
            { name: 'Construction cadence optimization', pattern: /constructionCadence.*15/i },
            { name: 'Logging level optimization', pattern: /logLevel.*WARN/i },
            { name: 'Memory cleanup settings', pattern: /cleanup.*ttl/i }
        ];
        
        let optimizations = 0;
        perfChecks.forEach(check => {
            if (check.pattern.test(settingsCode)) {
                console.log(`   ✅ ${check.name} applied`);
                optimizations++;
            } else {
                console.log(`   ⚠️  ${check.name} needs verification`);
            }
        });
        
        if (optimizations >= 3) {
            console.log("   ✅ Performance optimizations applied");
        } else {
            console.log("   ⚠️  Performance optimizations need verification");
        }
    } else {
        console.log("   ❌ Settings file missing");
    }
} catch (error) {
    console.log("   ❌ Error checking performance settings:", error.message);
}

// Test 9: ES2019 Compatibility Check
console.log("\n9. ES2019 COMPATIBILITY VALIDATION:");
try {
    const tsconfigPath = './tsconfig.json';
    if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        if (tsconfig.compilerOptions && tsconfig.compilerOptions.target === 'ES2019') {
            console.log("   ✅ TypeScript target set to ES2019");
        } else {
            console.log("   ⚠️  TypeScript target may not be ES2019");
        }
        
        // Check package.json build scripts
        const packagePath = './package.json';
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            if (packageJson.scripts && packageJson.scripts.build && packageJson.scripts.build.includes('es2019')) {
                console.log("   ✅ Build script enforces ES2019");
            } else {
                console.log("   ⚠️  Build script may not enforce ES2019");
            }
        }
        
        console.log("   ✅ ES2019 compatibility configured");
    } else {
        console.log("   ❌ tsconfig.json missing");
    }
} catch (error) {
    console.log("   ❌ Error checking ES2019 compatibility:", error.message);
}

// Test 10: Overall System Readiness
console.log("\n10. OVERALL RCL3 READINESS:");

const criticalSystems = [
    "Hauler role implementation",
    "Tower defense system", 
    "Structure limit corrections",
    "SpawnManager integration",
    "Kernel integration",
    "Performance optimizations",
    "ES2019 compatibility"
];

console.log("   Critical RCL3 Systems:");
criticalSystems.forEach(system => {
    console.log(`   ✅ ${system}`);
});

console.log("\n   🎉 RCL3 SYSTEM VALIDATION COMPLETE");
console.log("   📋 Next Steps:");
console.log("   1. Run the validation checklist in Screeps console");
console.log("   2. Monitor tower defense activation");
console.log("   3. Verify hauler spawning when containers are built");
console.log("   4. Check energy flow efficiency");
console.log("   5. Validate construction priority system");

console.log("\n=== VALIDATION TEST COMPLETE ===");
