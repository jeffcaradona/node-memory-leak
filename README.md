# Node.js Memory Leak Detection Demo

A comprehensive Node.js 24 demo that teaches developers how to identify and fix memory leaks using built-in Node.js tools with minimal external dependencies.

## Features

- ✅ **ES Modules** - Uses `"type": "module"` for modern JavaScript
- ✅ **Node.js 24+** - Requires Node.js 24 or higher
- ✅ **Zero Dependencies** - Uses only Node.js built-in APIs
- ✅ **Practical Examples** - Real-world memory leak scenarios
- ✅ **Built-in Tools** - Demonstrates native Node.js profiling tools

## Prerequisites

- Node.js 24.0.0 or higher

```bash
node --version  # Should be >= 24.0.0
```

## Installation

```bash
git clone <repository-url>
cd node-memory-leak
npm install  # No dependencies, but sets up the project
```

## Quick Start

Run the main demo to see all memory leak detection tools:

```bash
npm run demo
```

## Memory Leak Examples

This demo includes four common types of memory leaks:

### 1. Global Variable Leaks

**Problem**: Data stored in global variables never gets garbage collected.

```bash
npm run leak:global
```

**What it demonstrates**:
- How global variables prevent garbage collection
- How to monitor memory growth with `process.memoryUsage()`
- The impact of accumulating data in global scope

**Fix**: Use local variables, clear arrays when done, or use proper data structures with cleanup methods.

### 2. Closure Leaks

**Problem**: Closures inadvertently capture large objects in their scope.

```bash
npm run leak:closure
```

**What it demonstrates**:
- How closures retain references to all variables in their scope
- Memory impact when many closures capture the same large data
- The hidden cost of captured variables

**Fix**: Only capture what you need in closures, extract specific values before creating the closure.

### 3. Event Listener Leaks

**Problem**: Forgotten event listeners keep objects alive that should be garbage collected.

```bash
npm run leak:events
```

**What it demonstrates**:
- How event listeners prevent garbage collection
- The importance of removing listeners
- Memory retention even after clearing object references

**Fix**: Always remove event listeners with `.off()` or `.removeListener()` when objects are no longer needed.

### 4. Timer/Interval Leaks

**Problem**: Forgotten timers and intervals keep callbacks and their closures alive indefinitely.

```bash
npm run leak:timer
```

**What it demonstrates**:
- How intervals prevent garbage collection
- Memory growth from running timers
- Why clearing object references isn't enough

**Fix**: Always clear timers with `clearTimeout()` and `clearInterval()` when objects are no longer needed.

## Node.js Built-in Tools for Memory Leak Detection

### 1. process.memoryUsage()

Monitor memory in real-time using the built-in `process.memoryUsage()` API:

```javascript
const usage = process.memoryUsage();
console.log({
  rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
  heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
  heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
  external: Math.round(usage.external / 1024 / 1024) + ' MB'
});
```

**When to use**: Continuous monitoring in production, automated leak detection.

### 2. Chrome DevTools Integration (--inspect)

Use Chrome DevTools for visual memory profiling:

```bash
npm run inspect
```

Then:
1. Open Chrome and navigate to `chrome://inspect`
2. Click "inspect" under your Node.js process
3. Go to the "Memory" tab
4. Take heap snapshots and compare them

**What you can do**:
- Take heap snapshots at different points in time
- Compare snapshots to see what's growing
- See allocation timeline
- Identify which functions/objects are consuming memory

**When to use**: Deep investigation of memory issues, understanding object retention.

### 3. Heap Profiling (--heap-prof)

Generate heap profiles automatically:

```bash
npm run heap-prof
```

This creates a `.heapprofile` file that you can load in Chrome DevTools:
1. Open Chrome DevTools (F12)
2. Go to "Memory" tab
3. Click "Load" button
4. Select the generated `.heapprofile` file

**When to use**: Automated profiling, CI/CD integration, post-mortem analysis.

### 4. Manual Garbage Collection (--expose-gc)

Test if objects are properly released:

```bash
node --expose-gc examples/demo.js
```

```javascript
// In your code
if (global.gc) {
  global.gc();  // Force garbage collection
  // Check memory after GC
}
```

**When to use**: Testing cleanup logic, verifying object references are released.

## Memory Leak Detection Pattern

Here's a pattern you can use in your applications to detect memory leaks:

```javascript
class MemoryMonitor {
  constructor(interval = 5000) {
    this.measurements = [];
    this.interval = interval;
  }
  
  start() {
    this.timerId = setInterval(() => {
      const usage = process.memoryUsage();
      this.measurements.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed
      });
      
      if (this.measurements.length > 10) {
        this.measurements.shift();
      }
      
      if (this.measurements.length >= 5) {
        const first = this.measurements[0].heapUsed;
        const last = this.measurements[this.measurements.length - 1].heapUsed;
        const growthRate = ((last - first) / first * 100).toFixed(2);
        
        if (last > first * 1.2) {  // 20% growth
          console.warn(`⚠️  Potential memory leak: ${growthRate}% growth`);
        }
      }
    }, this.interval);
  }
  
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
```

## Best Practices

1. **Always Clean Up**
   - Remove event listeners when done
   - Clear timers and intervals
   - Close connections and streams
   - Clean up callbacks

2. **Avoid Common Pitfalls**
   - Don't store temporary data in global variables
   - Be careful with closures capturing large objects
   - Don't forget to remove event listeners
   - Always clear timers/intervals

3. **Use Appropriate Data Structures**
   - Use `WeakMap` for object caches that shouldn't prevent GC
   - Use `WeakSet` for object collections that shouldn't prevent GC
   - Clear arrays and maps when done with them

4. **Monitor in Production**
   - Log memory usage periodically
   - Set up alerts for unusual growth
   - Use APM tools for detailed insights

5. **Profile During Development**
   - Take heap snapshots before and after operations
   - Compare snapshots to identify leaks early
   - Test cleanup logic with `--expose-gc`

## Troubleshooting Guide

### My application's memory keeps growing

1. Run with memory monitoring:
   ```bash
   node --expose-gc your-app.js
   ```

2. Take heap snapshots at different intervals using `--inspect`

3. Compare snapshots to identify growing objects

4. Check for:
   - Event listeners not being removed
   - Timers/intervals not being cleared
   - Global variables accumulating data
   - Closures capturing large objects

### How do I know if I have a memory leak?

Signs of a memory leak:
- Memory usage grows consistently over time
- Memory doesn't decrease after garbage collection
- Application slows down over time
- Out of memory errors in production

### What's the difference between RSS and Heap?

- **RSS (Resident Set Size)**: Total memory allocated to the process (includes heap, stack, code, etc.)
- **Heap Total**: Total size of allocated heap
- **Heap Used**: Actual memory used in the heap
- **External**: Memory used by C++ objects bound to JavaScript objects

## Additional Resources

- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [V8 Garbage Collection](https://v8.dev/blog/trash-talk)

## License

ISC
