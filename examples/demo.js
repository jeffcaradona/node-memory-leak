/**
 * Memory Leak Detection Demo
 * 
 * This demo shows how to use Node.js built-in tools to detect and analyze memory leaks:
 * 1. process.memoryUsage() - Monitor memory in real-time
 * 2. --inspect flag - Use Chrome DevTools for profiling
 * 3. --heap-prof flag - Generate heap snapshots
 * 4. --expose-gc flag - Manually trigger garbage collection for testing
 */

console.log('=== Node.js Memory Leak Detection Tools Demo ===\n');

// Tool 1: process.memoryUsage() - Built-in memory monitoring
console.log('1. PROCESS.MEMORYUSAGE() - Real-time Memory Monitoring');
console.log('   This API provides instant memory usage information:\n');

function displayMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`, // Resident Set Size
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`, // Total heap allocated
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`, // Heap actually used
    external: `${Math.round(usage.external / 1024 / 1024)} MB`, // C++ objects bound to JS
    arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)} MB` // ArrayBuffers and SharedArrayBuffers
  };
}

console.log('   Initial memory:', displayMemoryUsage());
console.log();

// Simulate some memory allocation
const data = new Array(1000000).fill('test');
console.log('   After allocating ~10MB:', displayMemoryUsage());
console.log();

// Tool 2: Manual Garbage Collection (requires --expose-gc flag)
console.log('2. MANUAL GARBAGE COLLECTION - Testing Memory Release');
console.log('   Run with: node --expose-gc examples/demo.js\n');

if (global.gc) {
  console.log('   ✓ Garbage collection is available');
  console.log('   Before GC:', displayMemoryUsage());
  
  // Clear the data reference
  data.length = 0;
  
  // Force garbage collection
  global.gc();
  
  console.log('   After GC:', displayMemoryUsage());
  console.log();
} else {
  console.log('   ✗ Garbage collection not available');
  console.log('   Run with: node --expose-gc examples/demo.js');
  console.log();
}

// Tool 3: Chrome DevTools Integration
console.log('3. CHROME DEVTOOLS - Visual Memory Profiling');
console.log('   Run with: node --inspect examples/demo.js');
console.log('   Then open Chrome and go to: chrome://inspect');
console.log();
console.log('   Features available:');
console.log('   • Take heap snapshots');
console.log('   • Compare snapshots to find leaks');
console.log('   • Record allocation timeline');
console.log('   • See memory allocation by function');
console.log();

// Tool 4: Heap Profiling
console.log('4. HEAP PROFILING - Automated Heap Snapshots');
console.log('   Run with: node --heap-prof examples/demo.js');
console.log('   This generates a .heapprofile file you can analyze in Chrome DevTools');
console.log();

// Tool 5: Memory Leak Detection Pattern
console.log('5. MEMORY LEAK DETECTION PATTERN');
console.log('   Here\'s a pattern to detect leaks in your application:\n');

class MemoryMonitor {
  constructor(interval = 1000) {
    this.interval = interval;
    this.measurements = [];
    this.timerId = null;
  }
  
  start() {
    console.log('   Starting memory monitor...');
    this.timerId = setInterval(() => {
      const usage = process.memoryUsage();
      this.measurements.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        rss: usage.rss
      });
      
      // Keep only last 10 measurements
      if (this.measurements.length > 10) {
        this.measurements.shift();
      }
      
      // Check for consistent growth (potential leak)
      if (this.measurements.length >= 5) {
        const trend = this.analyzeTrend();
        if (trend.isGrowing) {
          console.log(`   ⚠️  Potential leak detected! Heap growing: ${trend.growthRate}%`);
        }
      }
    }, this.interval);
  }
  
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      console.log('   Stopped memory monitor');
    }
  }
  
  analyzeTrend() {
    const recent = this.measurements.slice(-5);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    const growthRate = ((last - first) / first * 100).toFixed(2);
    
    return {
      isGrowing: last > first * 1.1, // 10% growth threshold
      growthRate
    };
  }
}

// Demo the memory monitor
const monitor = new MemoryMonitor(500);
monitor.start();

// Simulate a memory leak
const leakyArray = [];
const leakInterval = setInterval(() => {
  leakyArray.push(new Array(100000).fill('leak'));
}, 600);

// Stop after 5 seconds
setTimeout(() => {
  clearInterval(leakInterval);
  monitor.stop();
  
  console.log('\n6. SUMMARY - Best Practices for Memory Leak Prevention:');
  console.log('   • Always remove event listeners when done');
  console.log('   • Clear intervals and timeouts');
  console.log('   • Avoid global variables for temporary data');
  console.log('   • Be careful with closures capturing large objects');
  console.log('   • Use WeakMap/WeakSet for caches that shouldn\'t prevent GC');
  console.log('   • Monitor memory usage in production');
  console.log('   • Profile regularly during development');
  console.log('\n7. NEXT STEPS:');
  console.log('   • Run individual leak examples:');
  console.log('     npm run leak:global');
  console.log('     npm run leak:closure');
  console.log('     npm run leak:events');
  console.log('     npm run leak:timer');
  console.log('   • Profile with Chrome DevTools:');
  console.log('     npm run inspect');
  console.log('   • Generate heap profile:');
  console.log('     npm run heap-prof');
  console.log();
  
  process.exit(0);
}, 5000);
