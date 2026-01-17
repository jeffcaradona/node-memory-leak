/**
 * Example: Timer/Interval Memory Leak
 * 
 * This demonstrates how forgotten timers and intervals can cause memory leaks
 * by keeping callbacks and their closures alive indefinitely.
 */

class DataCache {
  constructor(id) {
    this.id = id;
    this.cache = new Array(100000).fill(`cache-${id}`); // ~1MB
    this.updateCount = 0;
  }
  
  startLeakyTimer() {
    // Timer keeps the entire object alive even if we're done with it
    this.interval = setInterval(() => {
      this.updateCount++;
      this.cache.push(`update-${this.updateCount}`);
    }, 100);
  }
  
  // Forgot to add cleanup method!
}

const caches = [];

function logMemoryUsage(label) {
  const used = process.memoryUsage();
  console.log(`${label}:`);
  console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  console.log(`  Active Caches: ${caches.length}\n`);
}

console.log('=== Timer/Interval Memory Leak Example ===\n');
logMemoryUsage('Initial state');

console.log('Creating 20 caches with intervals...\n');
for (let i = 0; i < 20; i++) {
  const cache = new DataCache(i);
  cache.startLeakyTimer();
  caches.push(cache);
}

logMemoryUsage('After creating caches');

console.log('Waiting 2 seconds for timers to run...\n');
setTimeout(() => {
  logMemoryUsage('After 2 seconds');
  
  console.log('Attempting to clear caches array...');
  caches.length = 0;
  
  if (global.gc) {
    global.gc();
    console.log('Forced garbage collection\n');
  }
  
  setTimeout(() => {
    logMemoryUsage('After clearing caches array');
    
    console.log('Notice: Memory continues to grow! Intervals keep running and prevent garbage collection.');
    console.log('Fix: Always clear timers/intervals when objects are no longer needed.');
    console.log('\nExample fix:');
    console.log(`
class DataCache {
  startTimer() {
    this.interval = setInterval(() => {
      this.updateCount++;
    }, 100);
  }
  
  cleanup() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

// Usage:
const cache = new DataCache(1);
cache.startTimer();
// When done:
cache.cleanup();
`);
    
    // Clean up for demo purposes
    process.exit(0);
  }, 1000);
}, 2000);
