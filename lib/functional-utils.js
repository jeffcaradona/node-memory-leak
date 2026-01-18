/**
 * Functional Programming Utilities
 * 
 * This module provides pure functional utilities for memory monitoring
 * and data transformation, demonstrating functional paradigms in Node.js.
 */

// ===== Composition & Pipeline =====

/**
 * Compose functions from right to left (mathematical composition)
 * compose(f, g, h)(x) = f(g(h(x)))
 */
export const compose = (...fns) => x => 
  fns.reduceRight((acc, fn) => fn(acc), x);

/**
 * Pipe functions from left to right (more intuitive for data flow)
 * pipe(f, g, h)(x) = h(g(f(x)))
 */
export const pipe = (...fns) => x => 
  fns.reduce((acc, fn) => fn(acc), x);

// ===== Memory Measurement (Pure Functions) =====

/**
 * Get current memory usage as immutable object
 * Pure function - no side effects
 */
export const getMemorySnapshot = () => {
  const usage = process.memoryUsage();
  return Object.freeze({
    timestamp: Date.now(),
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers || 0
  });
};

/**
 * Format memory value in MB
 * Pure function
 */
export const formatMB = bytes => 
  `${Math.round(bytes / 1024 / 1024)} MB`;

/**
 * Format memory snapshot for display
 * Pure function - transforms data without mutations
 */
export const formatMemorySnapshot = snapshot => ({
  timestamp: new Date(snapshot.timestamp).toISOString(),
  rss: formatMB(snapshot.rss),
  heapTotal: formatMB(snapshot.heapTotal),
  heapUsed: formatMB(snapshot.heapUsed),
  external: formatMB(snapshot.external),
  arrayBuffers: formatMB(snapshot.arrayBuffers)
});

// ===== Array Operations (Immutable) =====

/**
 * Add element to array immutably
 */
export const append = item => arr => [...arr, item];

/**
 * Remove first element from array immutably
 */
export const shift = arr => arr.slice(1);

/**
 * Take last N elements from array
 */
export const takeLast = n => arr => arr.slice(-n);

/**
 * Keep array at max size by removing oldest elements
 */
export const keepLast = maxSize => arr => 
  arr.length > maxSize ? arr.slice(-maxSize) : arr;

// ===== Memory Trend Analysis (Pure Functions) =====

/**
 * Calculate growth rate between two snapshots
 * Pure function - deterministic output
 */
export const calculateGrowthRate = (first, last) => {
  if (!first || !last) return 0;
  const growth = ((last.heapUsed - first.heapUsed) / first.heapUsed) * 100;
  return Number(growth.toFixed(2));
};

/**
 * Analyze memory trend from array of snapshots
 * Pure function - no side effects
 */
export const analyzeTrend = (snapshots, threshold = 1.1) => {
  if (snapshots.length < 2) {
    return { isGrowing: false, growthRate: 0, confidence: 'insufficient_data' };
  }
  
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const growthRate = calculateGrowthRate(first, last);
  const isGrowing = last.heapUsed > first.heapUsed * threshold;
  
  return Object.freeze({
    isGrowing,
    growthRate,
    confidence: snapshots.length >= 5 ? 'high' : 'low',
    firstSnapshot: first,
    lastSnapshot: last
  });
};

// ===== Functional Event Handling =====

/**
 * Create a cleanup function for event listeners
 * Returns a pure cleanup function
 */
export const createEventCleanup = (emitter, event, handler) => 
  () => emitter.removeListener(event, handler);

/**
 * Create a cleanup function for timers
 * Returns a pure cleanup function
 */
export const createTimerCleanup = timerId => 
  () => clearInterval(timerId);

// ===== Higher-Order Functions =====

/**
 * Create a function that logs and returns its input (tap)
 * Useful for debugging pipelines
 */
export const tap = fn => x => {
  fn(x);
  return x;
};

/**
 * Create a memoized version of a function
 * Caches results based on first argument
 */
export const memoize = fn => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args[0]);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Curry a binary function
 */
export const curry2 = fn => a => b => fn(a, b);

/**
 * Curry a ternary function
 */
export const curry3 = fn => a => b => c => fn(a, b, c);

// ===== Async Utilities =====

/**
 * Create a delay promise (for async composition)
 */
export const delay = ms => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry an async function with exponential backoff
 */
export const retry = (fn, retries = 3, delayMs = 1000) => 
  fn().catch(err => {
    if (retries <= 0) throw err;
    return delay(delayMs).then(() => 
      retry(fn, retries - 1, delayMs * 2)
    );
  });

// ===== State Management (Functional) =====

/**
 * Create a functional state container
 * Returns [getState, setState] tuple
 * State is immutable - setState returns new state
 */
export const createState = initialState => {
  let state = initialState;
  
  const getState = () => state;
  const setState = newState => {
    state = typeof newState === 'function' 
      ? newState(state) 
      : newState;
    return state;
  };
  
  return [getState, setState];
};

// ===== Logging Utilities (Side Effects Isolated) =====

/**
 * Create a logger function (isolates console side effects)
 */
export const createLogger = prefix => message => 
  console.log(`${prefix}: ${message}`);

/**
 * Log formatted memory snapshot
 */
export const logMemorySnapshot = (label, snapshot) => {
  const formatted = formatMemorySnapshot(snapshot);
  console.log(`\n${label}:`);
  console.log(`  RSS: ${formatted.rss}`);
  console.log(`  Heap Used: ${formatted.heapUsed}`);
  console.log(`  Heap Total: ${formatted.heapTotal}`);
  console.log(`  External: ${formatted.external}`);
};
