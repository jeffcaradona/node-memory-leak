/**
 * Example: Event Listener Memory Leak
 * 
 * This demonstrates how forgotten event listeners can cause memory leaks
 * by keeping objects alive that should be garbage collected.
 */

import { EventEmitter } from 'events';

class DataProcessor extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.data = new Array(100000).fill(`processor-${id}`); // ~1MB
  }
}

const globalEmitter = new EventEmitter();
const processors = [];

function createLeakyProcessor(id) {
  const processor = new DataProcessor(id);
  
  // Add event listener but never remove it
  globalEmitter.on('process', () => {
    processor.data.push('new-data');
  });
  
  // We keep a reference to processor via the listener
  return processor;
}

function logMemoryUsage(label) {
  const used = process.memoryUsage();
  console.log(`${label}:`);
  console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  console.log(`  Event Listeners: ${globalEmitter.listenerCount('process')}`);
  console.log(`  Processors: ${processors.length}\n`);
}

console.log('=== Event Listener Memory Leak Example ===\n');
logMemoryUsage('Initial state');

console.log('Creating 30 processors with event listeners...\n');
for (let i = 0; i < 30; i++) {
  const processor = createLeakyProcessor(i);
  processors.push(processor);
  
  if ((i + 1) % 10 === 0) {
    logMemoryUsage(`After ${i + 1} processors`);
  }
}

console.log('Attempting to clear processors array...');
processors.length = 0;

// Force garbage collection if available
if (global.gc) {
  global.gc();
  console.log('Forced garbage collection\n');
}

setTimeout(() => {
  logMemoryUsage('After clearing processors array');
  
  console.log('Notice: Memory is NOT freed because event listeners still reference the processors.');
  console.log('Fix: Always remove event listeners when objects are no longer needed.');
  console.log('\nExample fix:');
  console.log(`
function createNonLeakyProcessor(id) {
  const processor = new DataProcessor(id);
  
  const handler = () => {
    processor.data.push('new-data');
  };
  
  globalEmitter.on('process', handler);
  
  // Provide cleanup method
  processor.cleanup = () => {
    globalEmitter.off('process', handler);
  };
  
  return processor;
}
`);
}, 100);
