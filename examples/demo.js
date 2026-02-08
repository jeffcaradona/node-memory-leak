/**
 * Memory Leak Detection Demo (Functional Approach)
 * 
 * This demo shows how to use Node.js built-in tools with functional programming:
 * 1. Pure functions for memory measurement
 * 2. Function composition for data transformation
 * 3. Explicit side effect management
 * 4. Functional memory monitoring patterns
 */

import { 
  getMemorySnapshot, 
  formatMemorySnapshot,
  logMemorySnapshot,
  pipe,
  tap,
  createTimerCleanup
} from '../lib/functional-utils.js';
import { createMemoryMonitor } from '../lib/memory-monitor.js';

console.log('=== Node.js Memory Leak Detection Tools Demo (Functional Paradigm) ===\n');

// ===== 1. PURE FUNCTIONS FOR MEMORY MONITORING =====

console.log('1. FUNCTIONAL MEMORY MONITORING - Pure Functions\n');

// Pure function pipeline for memory display
const displayMemory = pipe(
  getMemorySnapshot,
  formatMemorySnapshot,
  tap(formatted => {
    console.log('   Current memory:', formatted);
  })
);

displayMemory();
console.log();

// ===== 2. IMMUTABLE DATA TRANSFORMATIONS =====

console.log('2. IMMUTABLE DATA OPERATIONS\n');

// Pure function: Create test data
const createTestData = size => new Array(size).fill('test');

// Pure function: Calculate data size
const calculateSize = data => data.length;

// Composed operation
const allocateAndMeasure = size => pipe(
  () => createTestData(size),
  tap(data => console.log(`   Allocated ${calculateSize(data)} items`)),
  () => getMemorySnapshot(),
  formatMemorySnapshot,
  formatted => console.log('   Memory after allocation:', formatted)
)();

allocateAndMeasure(1000000);
console.log();

// ===== 3. FUNCTIONAL GARBAGE COLLECTION =====

console.log('3. FUNCTIONAL GC TESTING\n');
console.log('   Run with: node --expose-gc examples/demo.js\n');

if (global.gc) {
  console.log('   ✓ GC available - demonstrating functional cleanup pattern\n');
  
  // Function that creates and cleans up data
  const withGarbageCollection = (fn) => {
    const before = getMemorySnapshot();
    console.log('   Before:', formatMemorySnapshot(before).heapUsed);
    
    fn(); // Execute function
    
    global.gc(); // Trigger GC
    
    const after = getMemorySnapshot();
    console.log('   After GC:', formatMemorySnapshot(after).heapUsed);
  };
  
  // Test with scoped data
  withGarbageCollection(() => {
    const tempData = createTestData(1000000);
    // Data goes out of scope after this function
  });
  
  console.log();
} else {
  console.log('   ✗ GC not available');
  console.log('   Run with: node --expose-gc examples/demo.js\n');
}

// ===== 4. CHROME DEVTOOLS INTEGRATION =====

console.log('4. CHROME DEVTOOLS - Visual Memory Profiling');
console.log('   Run with: node --inspect examples/demo.js');
console.log('   Then open Chrome and go to: chrome://inspect\n');

// ===== 5. FUNCTIONAL MEMORY MONITOR =====

console.log('5. FUNCTIONAL MEMORY MONITOR PATTERN\n');
console.log('   Creating functional monitor with composition...\n');

// Functional monitor with leak detection
const monitor = createMemoryMonitor({
  interval: 500,
  maxSnapshots: 10,
  threshold: 1.1,
  onLeak: (trend) => {
    console.log(`   ⚠️  Leak detected! Growth rate: ${trend.growthRate}%`);
  }
});

// Start monitoring (returns cleanup function)
const stopMonitoring = monitor.start();

// ===== 6. SIMULATE LEAK USING FUNCTIONAL PATTERNS =====

// Pure function: Create leak data batch
const createLeakBatch = () => new Array(100000).fill('leak');

// Impure but explicit: Accumulate data (demonstrates leak)
let accumulatedData = [];
const accumulateLeak = () => {
  accumulatedData = [...accumulatedData, createLeakBatch()];
};

// Create leak with explicit side effects
const leakTimer = setInterval(accumulateLeak, 600);
const stopLeak = createTimerCleanup(leakTimer);

// ===== 7. CLEANUP AND SUMMARY =====

setTimeout(() => {
  stopLeak(); // Stop creating leaks
  stopMonitoring(); // Stop monitoring
  
  console.log('\n6. FUNCTIONAL PROGRAMMING PRINCIPLES FOR MEMORY MANAGEMENT:\n');
  console.log('   ✓ Pure functions for measurement (no side effects)');
  console.log('   ✓ Immutable data transformations');
  console.log('   ✓ Function composition for complex operations');
  console.log('   ✓ Explicit side effect isolation');
  console.log('   ✓ Return cleanup functions (resource management)');
  console.log('   ✓ Higher-order functions for reusable patterns');
  console.log();
  
  console.log('7. FUNCTIONAL MEMORY LEAK PREVENTION:\n');
  console.log('   ❌ Avoid: Implicit state mutations');
  console.log('   ✅ Use: Pure functions with explicit return values\n');
  
  console.log('   ❌ Avoid: Hidden resource lifecycles');
  console.log('   ✅ Use: Return cleanup functions alongside resources\n');
  
  console.log('   ❌ Avoid: Accumulating data in module scope');
  console.log('   ✅ Use: Pass state explicitly through parameters\n');
  
  console.log('   ❌ Avoid: Closures capturing large objects');
  console.log('   ✅ Use: Extract minimal data before creating closures\n');
  
  console.log('8. FUNCTIONAL PATTERNS DEMONSTRATED:\n');
  console.log('   • pipe/compose - Function composition');
  console.log('   • Pure functions - Deterministic, no side effects');
  console.log('   • Immutability - Data transformations, not mutations');
  console.log('   • HOFs - Functions that return functions');
  console.log('   • Explicit cleanup - Resource management functions');
  console.log();
  
  console.log('9. NEXT STEPS:\n');
  console.log('   Run functional examples:');
  console.log('     npm run leak:global   - Functional vs imperative approaches');
  console.log('     npm run leak:closure  - Minimizing closure scope');
  console.log('     npm run leak:events   - Functional event management');
  console.log('     npm run leak:timer    - Functional timer patterns');
  console.log();
  console.log('   Advanced debugging:');
  console.log('     npm run inspect       - Chrome DevTools integration');
  console.log('     npm run heap-prof     - Generate heap profile');
  console.log();
  
  process.exit(0);
}, 5000);
