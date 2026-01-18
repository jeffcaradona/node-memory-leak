/**
 * Example: Timer/Interval Memory Leak (Functional Approach)
 * 
 * Demonstrates functional patterns for timer management:
 * - Pure timer factory functions
 * - Explicit cleanup composition
 * - Functional resource lifecycle management
 */

import { createTimerCleanup, getMemorySnapshot, logMemorySnapshot } from '../lib/functional-utils.js';

// ===== LEAKY PATTERN (Class without cleanup) =====

class LeakyCache {
  constructor(id) {
    this.id = id;
    this.cache = new Array(100000).fill(`cache-${id}`); // ~1MB
    this.updateCount = 0;
  }
  
  startLeakyTimer() {
    // Timer keeps the entire object alive
    this.interval = setInterval(() => {
      this.updateCount++;
      this.cache.push(`update-${this.updateCount}`);
    }, 100);
  }
  
  // Forgot cleanup method - LEAK!
}

// ===== FUNCTIONAL PATTERN: Explicit Cleanup =====

// Pure function: Create cache data
const createCacheData = (id, size = 100000) => ({
  id,
  cache: new Array(size).fill(`cache-${id}`),
  updateCount: 0
});

// Pure function: Update cache (returns new state)
const updateCache = state => ({
  ...state,
  updateCount: state.updateCount + 1,
  cache: [...state.cache, `update-${state.updateCount + 1}`]
});

// Functional cache with explicit lifecycle
const createManagedCache = (id, interval = 100) => {
  let state = createCacheData(id);
  
  // Side effect: timer that updates internal state
  const timerId = setInterval(() => {
    state = updateCache(state);
  }, interval);
  
  // Return state accessor and cleanup function
  return {
    getState: () => ({ ...state }), // Return copy to maintain immutability
    cleanup: createTimerCleanup(timerId)
  };
};

// ===== HIGHER-ORDER FUNCTION: Generic Timer Management =====

// HOF: Create a timer with automatic cleanup
const withTimer = (fn, intervalMs) => {
  const timerId = setInterval(fn, intervalMs);
  return createTimerCleanup(timerId);
};

// HOF: Create a timeout-based auto-cleanup timer
const createSelfCleaningTimer = (fn, intervalMs, lifetimeMs) => {
  const timerId = setInterval(fn, intervalMs);
  
  setTimeout(() => {
    clearInterval(timerId);
  }, lifetimeMs);
  
  return createTimerCleanup(timerId);
};

// ===== DEMONSTRATION =====

const leakyCaches = [];
const managedCaches = [];

const logMemoryWithCounts = (label, leakyCount, managedCount) => {
  const snapshot = getMemorySnapshot();
  logMemorySnapshot(label, snapshot);
  console.log(`  Leaky Caches: ${leakyCount}`);
  console.log(`  Managed Caches: ${managedCount}\n`);
};

console.log('=== Timer/Interval Memory Leak (Functional Approach) ===\n');
console.log('Functional programming principles:');
console.log('1. Return cleanup functions alongside resources');
console.log('2. Use HOFs for reusable timer patterns');
console.log('3. Make resource lifecycle explicit\n');

logMemoryWithCounts('Initial state', 0, 0);

console.log('--- Part 1: Leaky Pattern (no cleanup) ---\n');
for (let i = 0; i < 15; i++) {
  const cache = new LeakyCache(i);
  cache.startLeakyTimer();
  leakyCaches.push(cache);
}

logMemoryWithCounts('After creating leaky caches', leakyCaches.length, 0);

console.log('Waiting 1 second for timers to run...\n');
setTimeout(() => {
  logMemoryWithCounts('After 1 second (timers running)', leakyCaches.length, 0);
  
  console.log('Attempting to clear caches array...');
  leakyCaches.length = 0;
  
  if (global.gc) {
    global.gc();
    console.log('Forced garbage collection\n');
  }
  
  setTimeout(() => {
    logMemoryWithCounts('After clearing array (timers STILL running!)', 0, 0);
    
    console.log('--- Part 2: Functional Pattern (with cleanup) ---\n');
    
    for (let i = 0; i < 10; i++) {
      const cache = createManagedCache(i + 15);
      managedCaches.push(cache);
    }
    
    logMemoryWithCounts('After creating managed caches', 0, managedCaches.length);
    
    console.log('Waiting 1 second...\n');
    setTimeout(() => {
      logMemoryWithCounts('After 1 second', 0, managedCaches.length);
      
      console.log('Calling cleanup functions...');
      managedCaches.forEach(({ cleanup }) => cleanup());
      managedCaches.length = 0;
      
      if (global.gc) {
        global.gc();
        console.log('Forced garbage collection\n');
      }
      
      setTimeout(() => {
        logMemoryWithCounts('After cleanup (timers stopped!)', 0, 0);
        
        console.log('=== Functional Programming Lessons ===\n');
        console.log('❌ BAD: Start timer without cleanup');
        console.log('   setInterval(() => doWork(), 100);');
        console.log('   // No way to stop it!\n');
        
        console.log('✅ GOOD: Return cleanup function');
        console.log('   const timerId = setInterval(() => doWork(), 100);');
        console.log('   return () => clearInterval(timerId);\n');
        
        console.log('✅ BEST: HOF for reusable patterns');
        console.log('   const withTimer = (fn, interval) => {');
        console.log('     const id = setInterval(fn, interval);');
        console.log('     return () => clearInterval(id);');
        console.log('   };\n');
        
        console.log('Functional benefit: Resource lifecycle is explicit');
        console.log('and cleanup is guaranteed through function composition.');
        
        process.exit(0);
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);
