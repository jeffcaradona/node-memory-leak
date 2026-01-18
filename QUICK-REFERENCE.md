# Quick Reference Guide - Memory Leak Detection (Functional Programming)

## Quick Commands

```bash
# Run main demo with functional patterns
npm run demo

# Run individual leak examples (functional approach)
npm run leak:global    # Global vs functional state management
npm run leak:closure   # Closure scope minimization
npm run leak:events    # Explicit cleanup functions
npm run leak:timer     # Higher-order function patterns

# Debug with Chrome DevTools
npm run inspect        # Then open chrome://inspect

# Generate heap profile
npm run heap-prof      # Creates .heapprofile file

# Reproduce production issues (functional server)
npm run server         # Start server with functional middleware
npm run server:inspect # Start server with inspect flag
npm run loadtest       # Run load test with functional async
```

## Functional Memory Monitoring

```javascript
import { getMemorySnapshot, formatMemorySnapshot } from './lib/functional-utils.js';

// Pure function - get snapshot
const snapshot = getMemorySnapshot();

// Pure function - format snapshot
const formatted = formatMemorySnapshot(snapshot);
console.log(formatted);
```

## Common Memory Leak Patterns (Functional vs Imperative)

### ❌ BAD: Global mutable state
```javascript
const cache = [];
function addToCache(data) {
  cache.push(data); // Mutation + global scope
}
```

### ✅ GOOD: Explicit state management
```javascript
const addToCache = (cache, data) => [...cache, data];

// Or use function composition
const createCache = () => {
  let state = [];
  const add = (data) => { state = [...state, data]; };
  const get = () => [...state];
  const clear = () => { state = []; };
  return { add, get, clear };
};
```

### ❌ BAD: Forgotten event listener
```javascript
const emitter = new EventEmitter();
function setup() {
  emitter.on('data', handleData); // No cleanup!
}
```

### ✅ GOOD: Return cleanup function
```javascript
const setup = (emitter) => {
  const handler = handleData;
  emitter.on('data', handler);
  return () => emitter.off('data', handler); // Cleanup
};

// Usage
const cleanup = setup(emitter);
// Later:
cleanup();
```

### ❌ BAD: Forgotten timer
```javascript
function startProcess() {
  setInterval(() => {
    heavyOperation(); // Runs forever!
  }, 1000);
}
```

### ✅ GOOD: Higher-order function with cleanup
```javascript
const withTimer = (fn, interval) => {
  const id = setInterval(fn, interval);
  return () => clearInterval(id);
};

// Usage
const stopTimer = withTimer(heavyOperation, 1000);
// Later:
stopTimer();
```

### ❌ BAD: Closure captures everything
```javascript
function createHandler() {
  const hugeData = new Array(1000000);
  return () => hugeData.length; // Keeps entire array
}
```

### ✅ GOOD: Extract minimal data with pipe
```javascript
import { pipe } from './lib/functional-utils.js';

const createHandler = pipe(
  () => new Array(1000000),     // Create data
  (data) => data.length,        // Extract what we need
  (length) => () => length      // Closure only captures number
);
```

## Functional Programming Patterns

### Function Composition

```javascript
import { pipe, compose } from './lib/functional-utils.js';

// Pipe - left to right
const process = pipe(
  fetchData,
  filterData,
  transformData,
  saveData
);

// Compose - right to left (mathematical)
const process2 = compose(
  saveData,
  transformData,
  filterData,
  fetchData
);

process(input); // Easier to read data flow
```

### Pure Functions

```javascript
// ✅ Pure - same input = same output, no side effects
const formatMB = (bytes) => `${Math.round(bytes / 1024 / 1024)} MB`;

// ❌ Impure - depends on external state
let multiplier = 1024;
const formatMBBad = (bytes) => `${Math.round(bytes / multiplier / 1024)} MB`;
```

### Immutable Operations

```javascript
// ✅ Immutable array operations
const append = (item) => (arr) => [...arr, item];
const remove = (index) => (arr) => [
  ...arr.slice(0, index),
  ...arr.slice(index + 1)
];

// ✅ Immutable object operations
const updateProp = (key, value) => (obj) => ({
  ...obj,
  [key]: value
});
```

### Resource Management Pattern

```javascript
// Pattern: Return resource + cleanup
const createResource = () => {
  const resource = acquireResource();
  const cleanup = () => releaseResource(resource);
  return { resource, cleanup };
};

// Pattern: Higher-order function for auto-cleanup
const withResource = (fn) => {
  const { resource, cleanup } = createResource();
  try {
    return fn(resource);
  } finally {
    cleanup();
  }
};
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
