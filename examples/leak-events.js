/**
 * Example: Event Listener Memory Leak (Functional Approach)
 * 
 * Demonstrates functional patterns for event handling that prevent memory leaks:
 * - Explicit cleanup functions
 * - Pure event handler factories
 * - Functional resource management
 */

import { EventEmitter } from 'events';
import { getMemorySnapshot, logMemorySnapshot, createEventCleanup } from '../lib/functional-utils.js';

// ===== DATA PROCESSOR (Functional Approach) =====

// Pure function: Create processor data
const createProcessorData = (id, size = 100000) => 
  Object.freeze({
    id,
    data: new Array(size).fill(`processor-${id}`)
  });

// ===== LEAKY PATTERN (Imperative Class) =====

class LeakyProcessor extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.data = new Array(100000).fill(`processor-${id}`); // ~1MB
  }
}

const createLeakyProcessor = (globalEmitter, id) => {
  const processor = new LeakyProcessor(id);
  
  // Event listener added but never removed - LEAK!
  globalEmitter.on('process', () => {
    processor.data.push('new-data');
  });
  
  return processor;
};

// ===== FUNCTIONAL PATTERN: Explicit Cleanup =====

// Pure function: Create event handler
const createProcessHandler = processor => () => {
  // In real scenario, this would do something with processor
  return processor.data.length;
};

// Function that returns both processor and cleanup function
const createManagedProcessor = (globalEmitter, id) => {
  const processor = {
    id,
    data: createProcessorData(id)
  };
  
  const handler = createProcessHandler(processor);
  globalEmitter.on('process', handler);
  
  // Return processor and cleanup function (functional resource management)
  const cleanup = createEventCleanup(globalEmitter, 'process', handler);
  
  return { processor, cleanup };
};

// ===== HIGHER-ORDER FUNCTION: Auto-cleanup Pattern =====

// Higher-order function that ensures cleanup
const withEventCleanup = (emitter, event, handler) => {
  emitter.on(event, handler);
  return () => emitter.removeListener(event, handler);
};

// ===== DEMONSTRATION =====

const globalEmitter = new EventEmitter();
const leakyProcessors = [];
const managedResources = [];

const logMemoryWithCounts = (label, leakyCount, cleanups) => {
  const snapshot = getMemorySnapshot();
  logMemorySnapshot(label, snapshot);
  console.log(`  Event Listeners: ${globalEmitter.listenerCount('process')}`);
  console.log(`  Leaky Processors: ${leakyCount}`);
  console.log(`  Cleanup Functions Available: ${cleanups}\n`);
};

console.log('=== Event Listener Memory Leak (Functional Approach) ===\n');
console.log('Functional programming emphasizes:');
console.log('1. Explicit resource management');
console.log('2. Cleanup functions returned alongside resources');
console.log('3. Higher-order functions for reusable patterns\n');

logMemoryWithCounts('Initial state', 0, 0);

console.log('--- Part 1: Leaky Pattern (no cleanup) ---\n');
for (let i = 0; i < 20; i++) {
  const processor = createLeakyProcessor(globalEmitter, i);
  leakyProcessors.push(processor);
  
  if ((i + 1) % 10 === 0) {
    logMemoryWithCounts(`After ${i + 1} leaky processors`, leakyProcessors.length, 0);
  }
}

console.log('Attempting to clear processors array...');
leakyProcessors.length = 0;

if (global.gc) {
  global.gc();
  console.log('Forced garbage collection\n');
}

setTimeout(() => {
  logMemoryWithCounts('After clearing array (NO cleanup called)', 0, 0);
  
  console.log('--- Part 2: Functional Pattern (with cleanup) ---\n');
  
  for (let i = 0; i < 10; i++) {
    const resource = createManagedProcessor(globalEmitter, i + 20);
    managedResources.push(resource);
  }
  
  logMemoryWithCounts('After creating managed resources', 0, managedResources.length);
  
  console.log('Calling cleanup functions...');
  managedResources.forEach(({ cleanup }) => cleanup());
  managedResources.length = 0;
  
  if (global.gc) {
    global.gc();
    console.log('Forced garbage collection\n');
  }
  
  setTimeout(() => {
    logMemoryWithCounts('After cleanup called', 0, 0);
    
    console.log('=== Functional Programming Lessons ===\n');
    console.log('❌ BAD: Add listener without cleanup');
    console.log('   emitter.on("event", handler);');
    console.log('   // No way to cleanup!\n');
    
    console.log('✅ GOOD: Return cleanup function');
    console.log('   const cleanup = () => emitter.off("event", handler);');
    console.log('   return { resource, cleanup };\n');
    
    console.log('✅ BEST: Higher-order function pattern');
    console.log('   const withCleanup = (emitter, event, handler) => {');
    console.log('     emitter.on(event, handler);');
    console.log('     return () => emitter.off(event, handler);');
    console.log('   };\n');
    
    console.log('Functional benefit: Cleanup is explicit and composable,');
    console.log('making resource management a first-class concept.');
    
    process.exit(0);
  }, 100);
}, 100);
