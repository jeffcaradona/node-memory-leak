/**
 * Example: Global Variable Memory Leak
 * 
 * This demonstrates how global variables can cause memory leaks
 * by accumulating data that never gets garbage collected.
 */

const leakyData = [];

function createLeak() {
  // Adding data to a global variable prevents garbage collection
  for (let i = 0; i < 1000; i++) {
    leakyData.push({
      data: new Array(10000).fill('*'),
      timestamp: new Date(),
      id: i
    });
  }
}

function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log('Memory Usage:');
  console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`);
  console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`);
  console.log(`  External: ${Math.round(used.external / 1024 / 1024)} MB`);
  console.log(`  Array Size: ${leakyData.length} items\n`);
}

console.log('=== Global Variable Memory Leak Example ===\n');
console.log('Initial state:');
logMemoryUsage();

console.log('Creating leak (5 iterations)...\n');
for (let iteration = 0; iteration < 5; iteration++) {
  createLeak();
  console.log(`After iteration ${iteration + 1}:`);
  logMemoryUsage();
}

console.log('Notice: Memory usage keeps growing because data is stored in a global variable.');
console.log('Fix: Use local variables, clear arrays when done, or use proper data structures with cleanup.');
