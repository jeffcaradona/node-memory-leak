# Node.js Memory Leak Detection Demo

A comprehensive Node.js 24 demo that teaches developers how to identify and fix memory leaks using built-in Node.js tools with minimal external dependencies.

## Features

- ✅ **ES Modules** - Uses `"type": "module"` for modern JavaScript
- ✅ **Node.js 24+** - Requires Node.js 24 or higher
- ✅ **Minimal Dependencies** - Uses only Node.js built-in APIs (autocannon for load testing)
- ✅ **Practical Examples** - Real-world memory leak scenarios
- ✅ **Built-in Tools** - Demonstrates native Node.js profiling tools
- ✅ **Production Reproduction** - Load testing with autocannon to simulate production issues

## Prerequisites

- Node.js 24.0.0 or higher

```bash
node --version  # Should be >= 24.0.0
```

## Installation

```bash
git clone <repository-url>
cd node-memory-leak
npm install  # Installs autocannon for load testing
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

## Reproducing Production Issues Locally

### Load Testing with Autocannon and --inspect

One of the best ways to identify memory leaks is to reproduce production conditions locally. This demo includes a leaky HTTP server and load testing tools to simulate production traffic.

#### Step 1: Start the Leaky Server

```bash
# Start server with Chrome DevTools integration
npm run server:inspect
```

This starts an HTTP server with intentional memory leaks:
- Request cache that grows indefinitely
- User sessions that never expire
- Database connections that are never released

#### Step 2: Connect Chrome DevTools

1. Open Chrome and navigate to `chrome://inspect`
2. Click "inspect" under your Node.js process
3. Go to the "Memory" tab
4. Take a **Heap Snapshot** (this is your baseline)

#### Step 3: Run Load Test

In a separate terminal, run the load test:

```bash
npm run loadtest
```

This uses **autocannon** to generate realistic HTTP load:
- 10 concurrent connections
- 30 second duration
- Multiple endpoints tested
- Real-time progress tracking

#### Step 4: Analyze Memory Growth

After the load test completes:
1. Take another **Heap Snapshot** in Chrome DevTools
2. Select "Comparison" view
3. Look for objects that grew significantly
4. Identify: `requestCache`, `userSessions`, `connections`

#### Step 5: Identify Root Causes

In the comparison view, you'll see:
- **Shallow Size**: Memory used by the object itself
- **Retained Size**: Total memory kept alive by the object
- **Retainers**: What's preventing garbage collection

Look for patterns like:
- Arrays growing with each request
- Maps/Sets that never clear
- Event listeners not being removed
- Timers still running

### Example Output

```bash
═══════════════════════════════════════════════════════════
Memory Leak Analysis:
═══════════════════════════════════════════════════════════
Before Load Test:
  Heap Used: 4 MB
  Cached Requests: 0
  Active Sessions: 0
  Connections: 0

After Load Test:
  Heap Used: 156 MB
  Cached Requests: 5000
  Active Sessions: 5000
  Connections: 5000

Memory Growth:
  Leaked Requests: 5000
  Leaked Sessions: 5000
  Leaked Connections: 5000
```

### Why This Approach Works

1. **Realistic Load**: Autocannon simulates real production traffic patterns
2. **Visual Debugging**: Chrome DevTools makes it easy to see what's growing
3. **Reproducible**: You can run the test multiple times to confirm fixes
4. **Measurable**: Concrete numbers show memory growth over time

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
