/**
 * Example: Closure Memory Leak
 * 
 * This demonstrates how closures can inadvertently hold references
 * to large objects, preventing garbage collection.
 */

function createLeakyClosure() {
  const largeData = new Array(1000000).fill('*'); // ~1MB
  
  // This closure captures largeData in its scope
  return function smallFunction() {
    return largeData.length;
  };
}

const leakyClosures = [];

function logMemoryUsage(label) {
  const used = process.memoryUsage();
  console.log(`${label}:`);
  console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  console.log(`  Closures Stored: ${leakyClosures.length}\n`);
}

console.log('=== Closure Memory Leak Example ===\n');
logMemoryUsage('Initial state');

console.log('Creating 50 closures, each capturing ~1MB of data...\n');
for (let i = 0; i < 50; i++) {
  leakyClosures.push(createLeakyClosure());
  
  if ((i + 1) % 10 === 0) {
    logMemoryUsage(`After ${i + 1} closures`);
  }
}

console.log('Notice: Each closure keeps the large array in memory even though we only need its length.');
console.log('Fix: Only capture what you need in closures, or explicitly null out references.');
console.log('\nExample fix:');
console.log(`
function createNonLeakyClosure() {
  const largeData = new Array(1000000).fill('*');
  const length = largeData.length; // Extract only what we need
  
  return function smallFunction() {
    return length; // Only captures 'length', not 'largeData'
  };
}
`);
