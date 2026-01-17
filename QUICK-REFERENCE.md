# Quick Reference Guide - Memory Leak Detection

## Quick Commands

```bash
# Run main demo with all tools
npm run demo

# Run individual leak examples
npm run leak:global    # Global variable leaks
npm run leak:closure   # Closure leaks
npm run leak:events    # Event listener leaks
npm run leak:timer     # Timer/interval leaks

# Debug with Chrome DevTools
npm run inspect        # Then open chrome://inspect

# Generate heap profile
npm run heap-prof      # Creates .heapprofile file

# Reproduce production issues locally
npm run server         # Start leaky HTTP server
npm run server:inspect # Start server with inspect flag
npm run loadtest       # Run autocannon load test
```

## Memory Monitoring Code Snippet

```javascript
// Monitor memory in your application
const usage = process.memoryUsage();
console.log({
  rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
  heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB'
});
```

## Common Memory Leak Patterns

### ❌ BAD: Global variable leak
```javascript
const cache = [];
function addToCache(data) {
  cache.push(data); // Never cleaned up!
}
```

### ✅ GOOD: Local with cleanup
```javascript
class Cache {
  constructor() { this.data = []; }
  add(item) { this.data.push(item); }
  clear() { this.data.length = 0; }
}
```

### ❌ BAD: Forgotten event listener
```javascript
const emitter = new EventEmitter();
function setup() {
  emitter.on('data', handleData); // Never removed!
}
```

### ✅ GOOD: Remove listener
```javascript
function setup() {
  emitter.on('data', handleData);
  return () => emitter.off('data', handleData);
}
```

### ❌ BAD: Forgotten timer
```javascript
function startProcess() {
  setInterval(() => {
    heavyOperation(); // Runs forever!
  }, 1000);
}
```

### ✅ GOOD: Clear timer
```javascript
function startProcess() {
  const timer = setInterval(() => {
    heavyOperation();
  }, 1000);
  return () => clearInterval(timer);
}
```

### ❌ BAD: Closure captures everything
```javascript
function createHandler() {
  const hugeData = new Array(1000000);
  return () => hugeData.length; // Keeps entire array
}
```

### ✅ GOOD: Extract what you need
```javascript
function createHandler() {
  const hugeData = new Array(1000000);
  const length = hugeData.length; // Extract value
  return () => length; // Only captures number
}
```

## Debugging Workflow

### Standard Workflow
1. **Identify** - Notice memory growing over time
2. **Measure** - Use `process.memoryUsage()` to confirm
3. **Profile** - Take heap snapshots with `--inspect`
4. **Compare** - Look at snapshot differences
5. **Locate** - Find retaining objects
6. **Fix** - Remove references, add cleanup
7. **Verify** - Test with `--expose-gc`

### Production Issue Reproduction Workflow
1. **Start Server with Inspect** - `npm run server:inspect`
2. **Connect DevTools** - Open `chrome://inspect` in Chrome
3. **Take Baseline Snapshot** - Memory tab > Heap Snapshot
4. **Generate Load** - `npm run loadtest` in another terminal
5. **Take Second Snapshot** - After load test completes
6. **Compare Snapshots** - Use "Comparison" view in DevTools
7. **Identify Leaks** - Look for `requestCache`, `userSessions`, etc.
8. **Fix Code** - Remove references, add cleanup
9. **Verify Fix** - Run load test again and compare snapshots

## Node.js Flags

- `--expose-gc` - Enable manual garbage collection
- `--inspect` - Enable Chrome DevTools debugging
- `--inspect-brk` - Like --inspect but breaks before code
- `--heap-prof` - Generate heap profile on exit
- `--max-old-space-size=4096` - Increase heap limit (MB)

## Chrome DevTools Steps

1. Run: `node --inspect your-app.js`
2. Open Chrome: `chrome://inspect`
3. Click "inspect" on your process
4. Go to "Memory" tab
5. Take "Heap snapshot"
6. Do operations that might leak
7. Take another snapshot
8. Compare snapshots
9. Look for growing objects

## WeakMap/WeakSet for Caches

Use WeakMap/WeakSet when you don't want to prevent garbage collection:

```javascript
// ✅ Objects can be GC'd even if in cache
const cache = new WeakMap();
function cacheResult(obj, result) {
  cache.set(obj, result);
}

// ❌ Objects can't be GC'd while in cache
const cache = new Map();
function cacheResult(obj, result) {
  cache.set(obj, result);
}
```

## Production Monitoring

```javascript
// Log memory every 5 minutes
setInterval(() => {
  const { heapUsed, rss } = process.memoryUsage();
  console.log({
    time: new Date().toISOString(),
    heapUsed: Math.round(heapUsed / 1024 / 1024),
    rss: Math.round(rss / 1024 / 1024)
  });
}, 5 * 60 * 1000);
```

## Emergency Memory Relief

```javascript
// If running out of memory in production
if (global.gc) {
  console.warn('Forcing garbage collection');
  global.gc();
}
```

⚠️ Don't rely on manual GC in production - fix the leak!
