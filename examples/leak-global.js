/**
 * Example: Global Variable Memory Leak (Functional Approach)
 * 
 * This demonstrates memory leaks using BOTH imperative and functional paradigms:
 * 1. Imperative approach with mutation (causes leak)
 * 2. Functional approach with immutability (also shows how leaks can occur)
 * 
 * Key Insight: Functional programming doesn't prevent memory leaks automatically,
 * but it makes them more visible through explicit data flow.
 */

import { getMemorySnapshot, logMemorySnapshot, pipe } from '../lib/functional-utils.js';

// ===== LEAKY APPROACH (Imperative with Global State) =====
const leakyData = [];

// Impure function - mutates global state
const createLeakImperative = () => {
  // Adding data to a global variable prevents garbage collection
  for (let i = 0; i < 1000; i++) {
    leakyData.push({
      data: new Array(10000).fill('*'),
      timestamp: new Date(),
      id: i
    });
  }
};

// ===== FUNCTIONAL APPROACH (Still leaks if we hold references!) =====

// Pure function - creates data without mutations
const createDataBatch = (startId, count = 1000) => 
  Array.from({ length: count }, (_, i) => ({
    data: new Array(10000).fill('*'),
    timestamp: new Date(),
    id: startId + i
  }));

// Pure function - merges arrays immutably
const mergeData = (existing, newData) => [...existing, ...newData];

// Demonstration: Even functional code can leak if references are retained
let functionalData = [];

const createLeakFunctional = (iteration) => {
  const newBatch = createDataBatch(iteration * 1000);
  functionalData = mergeData(functionalData, newBatch);
  return functionalData.length;
};

// ===== LOGGING (Side Effects Isolated) =====

const logMemoryWithArraySize = (label, arraySize) => {
  const snapshot = getMemorySnapshot();
  logMemorySnapshot(label, snapshot);
  console.log(`  Array Size: ${arraySize} items\n`);
};

// ===== EXECUTION =====

console.log('=== Global Variable Memory Leak Example (Functional vs Imperative) ===\n');
console.log('This example demonstrates that memory leaks can occur in both paradigms.');
console.log('The key difference: functional code makes data flow explicit.\n');

console.log('--- Part 1: Imperative Approach (mutations) ---\n');
logMemoryWithArraySize('Initial state', leakyData.length);

console.log('Creating leak with imperative mutations (5 iterations)...\n');
for (let iteration = 0; iteration < 5; iteration++) {
  createLeakImperative();
  logMemoryWithArraySize(`After iteration ${iteration + 1}`, leakyData.length);
}

console.log('--- Part 2: Functional Approach (immutability) ---\n');
console.log('Creating leak with immutable operations (2 more iterations)...\n');

for (let iteration = 0; iteration < 2; iteration++) {
  const size = createLeakFunctional(iteration + 5);
  logMemoryWithArraySize(`After functional iteration ${iteration + 1}`, size);
}

console.log('=== Key Insights ===\n');
console.log('❌ BAD (Imperative): Global mutable state');
console.log('   - Data mutated in place');
console.log('   - Hard to track where references are held\n');

console.log('❌ ALSO BAD (Functional but still leaking): Global immutable accumulation');
console.log('   - Data flow is explicit');
console.log('   - But still accumulating in module scope\n');

console.log('✅ FUNCTIONAL FIX: Explicit state management');
console.log('   - Pass state explicitly through function parameters');
console.log('   - Return new state instead of accumulating');
console.log('   - Use proper cleanup/disposal patterns\n');

console.log('Example functional fix:');
console.log(`
// Pure function - no retained references
const processDataBatch = (batchId) => {
  const batch = createDataBatch(batchId);
  const result = analyzeBatch(batch); // Process
  // batch goes out of scope and can be GC'd
  return result;
};

// Use reduce for controlled accumulation
const results = Array.from({ length: 5 }, (_, i) => 
  processDataBatch(i)
);
`);
