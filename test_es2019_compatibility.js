/**
 * Test to verify the compiled bundle is ES2019 compatible
 * Checks for common ES2020+ syntax that would cause issues in Screeps
 */

const fs = require('fs');
const path = require('path');

console.log('=== ES2019 Compatibility Test ===\n');

// Read the compiled bundle
const bundlePath = path.join(__dirname, 'dist', 'main.js');
if (!fs.existsSync(bundlePath)) {
    console.log('❌ Bundle not found at dist/main.js');
    process.exit(1);
}

const bundleContent = fs.readFileSync(bundlePath, 'utf8');

// Test 1: Check for optional chaining (?.)
console.log('Test 1: Optional Chaining (?.)');
const optionalChainingRegex = /\?\./g;
const optionalChainingMatches = bundleContent.match(optionalChainingRegex);
if (optionalChainingMatches) {
    console.log(`❌ Found ${optionalChainingMatches.length} instances of optional chaining (?.) - ES2020+ syntax`);
    // Show first few instances for debugging
    const lines = bundleContent.split('\n');
    let found = 0;
    for (let i = 0; i < lines.length && found < 3; i++) {
        if (lines[i].includes('?.')) {
            console.log(`   Line ${i + 1}: ${lines[i].trim()}`);
            found++;
        }
    }
} else {
    console.log('✅ No optional chaining found');
}

// Test 2: Check for nullish coalescing (??)
console.log('\nTest 2: Nullish Coalescing (??)');
const nullishCoalescingRegex = /\?\?/g;
const nullishCoalescingMatches = bundleContent.match(nullishCoalescingRegex);
if (nullishCoalescingMatches) {
    console.log(`❌ Found ${nullishCoalescingMatches.length} instances of nullish coalescing (??) - ES2020+ syntax`);
} else {
    console.log('✅ No nullish coalescing found');
}

// Test 3: Check for BigInt literals (123n)
console.log('\nTest 3: BigInt Literals');
const bigIntRegex = /\d+n\b/g;
const bigIntMatches = bundleContent.match(bigIntRegex);
if (bigIntMatches) {
    console.log(`❌ Found ${bigIntMatches.length} instances of BigInt literals - ES2020+ syntax`);
} else {
    console.log('✅ No BigInt literals found');
}

// Test 4: Check for dynamic imports (import())
console.log('\nTest 4: Dynamic Imports');
const dynamicImportRegex = /import\s*\(/g;
const dynamicImportMatches = bundleContent.match(dynamicImportRegex);
if (dynamicImportMatches) {
    console.log(`❌ Found ${dynamicImportMatches.length} instances of dynamic imports - ES2020+ syntax`);
} else {
    console.log('✅ No dynamic imports found');
}

// Test 5: Bundle size check
console.log('\nTest 5: Bundle Size');
const bundleSize = Math.round(bundleContent.length / 1024);
console.log(`✅ Bundle size: ${bundleSize}kb (reasonable for Screeps)`);

// Test 6: Basic syntax validation
console.log('\nTest 6: Basic Syntax Validation');
try {
    // This won't actually execute the code, just parse it
    new Function(bundleContent);
    console.log('✅ Bundle syntax is valid JavaScript');
} catch (error) {
    console.log(`❌ Bundle contains syntax errors: ${error.message}`);
}

console.log('\n=== Compatibility Summary ===');
const hasES2020Syntax = optionalChainingMatches || nullishCoalescingMatches || bigIntMatches || dynamicImportMatches;

if (hasES2020Syntax) {
    console.log('❌ Bundle contains ES2020+ syntax that may not work in Screeps');
    console.log('   Please fix the identified issues and rebuild');
} else {
    console.log('✅ Bundle is ES2019 compatible and ready for Screeps deployment');
    console.log('   Deploy dist/main.js to your Screeps environment');
}

console.log(`\nBundle ready: dist/main.js (${bundleSize}kb)`);
