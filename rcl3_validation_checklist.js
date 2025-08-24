// RCL3 Validation Checklist - Run this in Screeps console to verify all systems
// Usage: Copy and paste this entire script into the Screeps console

console.log("=== RCL3 SYSTEM VALIDATION ===");

// Get your room (replace 'W35N32' with your actual room name)
const roomName = Object.keys(Game.rooms)[0]; // Auto-detect first owned room
const room = Game.rooms[roomName];

if (!room || !room.controller || !room.controller.my) {
    console.log("❌ ERROR: No owned room found");
} else {
    console.log(`🏠 Validating room: ${roomName} (RCL ${room.controller.level})`);
    
    // 1. RCL3 Structure Validation
    console.log("\n1. STRUCTURE VALIDATION:");
    const structures = room.find(FIND_STRUCTURES);
    const extensions = structures.filter(s => s.structureType === STRUCTURE_EXTENSION);
    const towers = structures.filter(s => s.structureType === STRUCTURE_TOWER);
    const containers = structures.filter(s => s.structureType === STRUCTURE_CONTAINER);
    
    console.log(`   Extensions: ${extensions.length}/10 (should be 10 at RCL3)`);
    console.log(`   Towers: ${towers.length}/1 (should be 1 at RCL3)`);
    console.log(`   Containers: ${containers.length} (should have 2-3 for sources/controller)`);
    
    if (extensions.length === 10) console.log("   ✅ Extensions correct");
    else console.log(`   ⚠️  Extensions: Expected 10, found ${extensions.length}`);
    
    if (towers.length >= 1) console.log("   ✅ Tower present");
    else console.log("   ❌ No tower found - critical for RCL3 defense");
    
    // 2. Tower Defense System
    console.log("\n2. TOWER DEFENSE SYSTEM:");
    if (towers.length > 0) {
        const tower = towers[0];
        console.log(`   Tower energy: ${tower.store.energy}/${tower.store.getCapacity(RESOURCE_ENERGY)}`);
        console.log(`   Tower position: ${tower.pos.x},${tower.pos.y}`);
        console.log("   ✅ Tower defense system ready");
    } else {
        console.log("   ❌ No towers for defense");
    }
    
    // 3. Hauler System Validation
    console.log("\n3. HAULER SYSTEM:");
    const haulers = Object.values(Game.creeps).filter(c => c.memory.role === 'hauler' && c.room.name === roomName);
    console.log(`   Active haulers: ${haulers.length}`);
    
    if (containers.length > 0 && haulers.length > 0) {
        console.log("   ✅ Hauler system active with containers");
        haulers.forEach((hauler, i) => {
            const state = hauler.memory.hauling ? 'delivering' : 'collecting';
            console.log(`   Hauler ${i+1}: ${state} (energy: ${hauler.store.energy}/${hauler.store.getCapacity()})`);
        });
    } else if (containers.length > 0) {
        console.log("   ⚠️  Containers present but no haulers - should spawn soon");
    } else {
        console.log("   ⚠️  No containers yet - haulers will spawn when containers are built");
    }
    
    // 4. Energy Flow Validation
    console.log("\n4. ENERGY FLOW:");
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
        console.log(`   Spawn energy: ${spawn.store.energy}/${spawn.store.getCapacity(RESOURCE_ENERGY)}`);
        
        const totalExtensionEnergy = extensions.reduce((sum, ext) => sum + ext.store.energy, 0);
        const totalExtensionCapacity = extensions.reduce((sum, ext) => sum + ext.store.getCapacity(RESOURCE_ENERGY), 0);
        console.log(`   Extension energy: ${totalExtensionEnergy}/${totalExtensionCapacity}`);
        
        const energyPercent = totalExtensionCapacity > 0 ? Math.round((totalExtensionEnergy / totalExtensionCapacity) * 100) : 0;
        if (energyPercent > 80) console.log("   ✅ Energy levels excellent");
        else if (energyPercent > 50) console.log("   ✅ Energy levels good");
        else console.log(`   ⚠️  Energy levels low (${energyPercent}%)`);
    }
    
    // 5. Construction Progress
    console.log("\n5. CONSTRUCTION PROGRESS:");
    const sites = room.find(FIND_CONSTRUCTION_SITES);
    console.log(`   Active construction sites: ${sites.length}`);
    
    if (sites.length > 0) {
        const siteTypes = {};
        sites.forEach(site => {
            siteTypes[site.structureType] = (siteTypes[site.structureType] || 0) + 1;
        });
        Object.entries(siteTypes).forEach(([type, count]) => {
            console.log(`   - ${type}: ${count} sites`);
        });
        console.log("   ✅ Construction in progress");
    } else {
        console.log("   ✅ No pending construction - base complete");
    }
    
    // 6. Creep Population
    console.log("\n6. CREEP POPULATION:");
    const creeps = Object.values(Game.creeps).filter(c => c.room.name === roomName);
    const roleCount = {};
    creeps.forEach(creep => {
        const role = creep.memory.role || 'unknown';
        roleCount[role] = (roleCount[role] || 0) + 1;
    });
    
    Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
    });
    
    const sources = room.find(FIND_SOURCES);
    const expectedHarvesters = sources.length;
    const actualHarvesters = roleCount.harvester || 0;
    
    if (actualHarvesters >= expectedHarvesters) {
        console.log("   ✅ Harvester population adequate");
    } else {
        console.log(`   ⚠️  Need more harvesters: ${actualHarvesters}/${expectedHarvesters}`);
    }
    
    // 7. Road Network
    console.log("\n7. ROAD NETWORK:");
    const roads = structures.filter(s => s.structureType === STRUCTURE_ROAD);
    console.log(`   Roads built: ${roads.length}`);
    
    if (roads.length > 10) console.log("   ✅ Road network developing");
    else console.log("   ⚠️  Road network still building");
    
    // 8. Overall RCL3 Readiness Score
    console.log("\n8. RCL3 READINESS SCORE:");
    let score = 0;
    let maxScore = 0;
    
    // Extensions (20 points)
    maxScore += 20;
    if (extensions.length >= 10) score += 20;
    else score += Math.round((extensions.length / 10) * 20);
    
    // Tower (20 points)
    maxScore += 20;
    if (towers.length >= 1) score += 20;
    
    // Energy levels (15 points)
    maxScore += 15;
    score += Math.round((energyPercent / 100) * 15);
    
    // Hauler system (15 points)
    maxScore += 15;
    if (containers.length > 0 && haulers.length > 0) score += 15;
    else if (containers.length > 0) score += 10;
    
    // Creep population (15 points)
    maxScore += 15;
    if (actualHarvesters >= expectedHarvesters) score += 15;
    else score += Math.round((actualHarvesters / expectedHarvesters) * 15);
    
    // Construction progress (10 points)
    maxScore += 10;
    if (sites.length === 0) score += 10;
    else if (sites.length < 5) score += 7;
    else score += 5;
    
    // Roads (5 points)
    maxScore += 5;
    if (roads.length > 10) score += 5;
    else score += Math.round((roads.length / 10) * 5);
    
    const percentage = Math.round((score / maxScore) * 100);
    console.log(`   Overall Score: ${score}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 90) console.log("   🎉 EXCELLENT - RCL3 systems fully operational!");
    else if (percentage >= 75) console.log("   ✅ GOOD - RCL3 systems mostly ready");
    else if (percentage >= 60) console.log("   ⚠️  FAIR - RCL3 systems developing");
    else console.log("   ❌ POOR - RCL3 systems need attention");
    
    // 9. Next Steps Recommendations
    console.log("\n9. RECOMMENDATIONS:");
    
    if (extensions.length < 10) {
        console.log("   🔧 Priority: Build remaining extensions for energy capacity");
    }
    
    if (towers.length === 0) {
        console.log("   🔧 CRITICAL: Build tower for defense");
    }
    
    if (containers.length === 0) {
        console.log("   🔧 Priority: Build containers near sources for efficient harvesting");
    }
    
    if (containers.length > 0 && haulers.length === 0) {
        console.log("   🔧 Wait: Haulers should spawn automatically when containers are ready");
    }
    
    if (energyPercent < 50) {
        console.log("   🔧 Focus: Improve energy production/transport efficiency");
    }
    
    if (actualHarvesters < expectedHarvesters) {
        console.log("   🔧 Spawn: Need more harvesters for energy production");
    }
    
    if (sites.length > 10) {
        console.log("   🔧 Focus: Too many construction sites - prioritize completion");
    }
    
    console.log("\n=== VALIDATION COMPLETE ===");
}
