/**
 * Example: Closure Memory Leak (Functional Approach)
 * 
 * Demonstrates how closures can cause memory leaks and how functional
 * programming principles (minimizing closure scope, pure functions) help prevent them.
 * 
 * Key Functional Concepts:
 * - Minimize captured variables in closures
 * - Extract only what's needed (data transformation)
 * - Use higher-order functions properly
 */

import { getMemorySnapshot, logMemorySnapshot, pipe, curry2 } from '../lib/functional-utils.js';

// ===== LEAKY CLOSURE (Bad Practice) =====

// This closure captures entire large data structure
const createLeakyClosure = () => {
  const largeData = new Array(1000000).fill('*'); // ~1MB
  
  // Closure captures entire largeData unnecessarily
  return () => largeData.length;
};

// ===== FUNCTIONAL FIX: Extract Data Before Creating Closure =====

// Pure function: Extract only needed data
const extractLength = data => data.length;

// Pure function: Create metadata object
const createMetadata = length => ({ length, captured: 'number_only' });

// Functional composition: Extract then create closure
const createNonLeakyClosure = pipe(
  () => new Array(1000000).fill('*'),  // Create data
  extractLength,                        // Extract what we need
  length => () => length                // Closure only captures number
);

// ===== ALTERNATIVE: Using Currying for Controlled Scope =====

// Curried function that doesn't capture large data
const createCalculator = curry2((factor, value) => factor * value);

// Create specialized function without capturing large arrays
const createOptimizedClosure = () => {
  const largeData = new Array(1000000).fill('*');
  const length = largeData.length; // Extract immediately
  
  // Now largeData can be GC'd, we only keep the number
  return createCalculator(2)(length);
};

// ===== DEMONSTRATION =====

const leakyClosures = [];
const fixedClosures = [];

const logWithClosureCount = (label, count) => {
  const snapshot = getMemorySnapshot();
  logMemorySnapshot(label, snapshot);
  console.log(`  Closures Stored: ${count}\n`);
};

console.log('=== Closure Memory Leak Example (Functional Approach) ===\n');
console.log('Functional programming emphasizes:');
console.log('1. Minimize closure scope - capture only what you need');
console.log('2. Transform data before creating closures');
console.log('3. Use pure functions to make data flow explicit\n');

logWithClosureCount('Initial state', 0);

console.log('--- Part 1: Leaky Closures (capturing large data) ---\n');
for (let i = 0; i < 30; i++) {
  leakyClosures.push(createLeakyClosure());
  
  if ((i + 1) % 10 === 0) {
    logWithClosureCount(`After ${i + 1} leaky closures`, leakyClosures.length);
  }
}

console.log('--- Part 2: Optimized Closures (minimal capture) ---\n');
for (let i = 0; i < 20; i++) {
  fixedClosures.push(createNonLeakyClosure());
  
  if ((i + 1) % 10 === 0) {
    logWithClosureCount(`After ${i + 1} optimized closures`, fixedClosures.length);
  }
}

console.log('=== Functional Programming Lessons ===\n');
console.log('❌ BAD: Closure captures entire scope');
console.log('   const createBad = () => {');
console.log('     const huge = new Array(1000000);');
console.log('     return () => huge.length; // Captures entire array');
console.log('   };\n');

console.log('✅ GOOD: Extract data, then create closure');
console.log('   const createGood = () => {');
console.log('     const huge = new Array(1000000);');
console.log('     const length = huge.length; // Extract first');
console.log('     return () => length; // Only captures number');
console.log('   };\n');

console.log('✅ BEST: Use functional composition');
console.log('   const createBest = pipe(');
console.log('     createData,          // Create data');
console.log('     extractNeeded,       // Transform to minimal form');
console.log('     createClosure        // Closure only captures result');
console.log('   );\n');

console.log('Functional paradigm benefit: Makes data transformations explicit,');
console.log('making it clearer what each closure captures.');
