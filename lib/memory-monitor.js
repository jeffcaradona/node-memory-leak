/**
 * Functional Memory Monitor
 * 
 * A functional approach to memory monitoring that uses:
 * - Pure functions for state transformation
 * - Immutable data structures
 * - Function composition
 * - Explicit side effect management
 */

import { 
  getMemorySnapshot, 
  analyzeTrend, 
  keepLast,
  append,
  createTimerCleanup,
  logMemorySnapshot
} from './functional-utils.js';

/**
 * Create a memory monitor using functional composition
 * 
 * Returns an object with:
 * - start: Function to start monitoring (returns cleanup function)
 * - getSnapshots: Function to get current snapshots
 * 
 * This approach separates:
 * 1. Pure state transformations (snapshot collection, analysis)
 * 2. Side effects (timers, logging)
 * 3. Configuration (interval, max snapshots, threshold)
 */
export const createMemoryMonitor = ({
  interval = 1000,
  maxSnapshots = 10,
  threshold = 1.1,
  onLeak = null
} = {}) => {
  // State container (functional approach)
  let snapshots = [];
  
  // Pure function: Add snapshot to collection
  const addSnapshot = snapshot => {
    const updated = keepLast(maxSnapshots)(append(snapshot)(snapshots));
    snapshots = updated;
    return updated;
  };
  
  // Pure function: Get current snapshots
  const getSnapshots = () => [...snapshots];
  
  // Side effect function: Monitor and analyze
  const monitor = () => {
    const snapshot = getMemorySnapshot();
    const updated = addSnapshot(snapshot);
    
    if (updated.length >= 5) {
      const trend = analyzeTrend(updated, threshold);
      
      if (trend.isGrowing && onLeak) {
        onLeak(trend);
      }
    }
  };
  
  // Side effect function: Start monitoring
  const start = () => {
    const timerId = setInterval(monitor, interval);
    return createTimerCleanup(timerId);
  };
  
  return {
    start,
    getSnapshots
  };
};

/**
 * Create a simple memory logger (functional approach)
 * Uses function composition to create a monitoring pipeline
 */
export const createMemoryLogger = (interval = 5000, label = 'Memory') => {
  const monitor = () => {
    const snapshot = getMemorySnapshot();
    logMemorySnapshot(label, snapshot);
  };
  
  const start = () => {
    monitor(); // Log immediately
    const timerId = setInterval(monitor, interval);
    return createTimerCleanup(timerId);
  };
  
  return { start };
};

/**
 * Monitor memory for a specific duration (functional async)
 * Returns array of snapshots collected along with cleanup function
 */
export const monitorForDuration = async (durationMs, intervalMs = 1000) => {
  const snapshots = [];
  let timerId;
  
  return new Promise((resolve, reject) => {
    try {
      timerId = setInterval(() => {
        try {
          snapshots.push(getMemorySnapshot());
        } catch (error) {
          clearInterval(timerId);
          reject(error);
        }
      }, intervalMs);
      
      setTimeout(() => {
        clearInterval(timerId);
        resolve(snapshots);
      }, durationMs);
    } catch (error) {
      if (timerId) clearInterval(timerId);
      reject(error);
    }
  });
};

/**
 * Compare two memory snapshots (pure function)
 * Returns an analysis object
 */
export const compareSnapshots = (before, after) => {
  const heapDiff = after.heapUsed - before.heapUsed;
  const rssDiff = after.rss - before.rss;
  const timeDiff = after.timestamp - before.timestamp;
  
  return Object.freeze({
    heapDiff,
    rssDiff,
    timeDiff,
    heapGrowthRate: (heapDiff / before.heapUsed) * 100,
    rssGrowthRate: (rssDiff / before.rss) * 100,
    heapGrowthPerSecond: (heapDiff / timeDiff) * 1000
  });
};
