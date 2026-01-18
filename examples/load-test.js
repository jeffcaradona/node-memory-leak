/**
 * Load Testing with Autocannon (Functional Approach)
 * 
 * Demonstrates functional patterns for async operations:
 * - Pure configuration functions
 * - Functional async composition
 * - Error handling with functional patterns
 * - Composable async operations
 */

import autocannon from 'autocannon';
import http from 'http';
import { pipe, retry, delay } from '../lib/functional-utils.js';

const SERVER_URL = 'http://localhost:3000';

// ===== PURE CONFIGURATION FUNCTIONS =====

// Pure function: Create HTTP get config
const createHttpGetConfig = url =>
  Object.freeze({
    hostname: 'localhost',
    port: 3000,
    path: url,
    method: 'GET'
  });

// Pure function: Create load test config
const createLoadTestConfig = (url, options = {}) =>
  Object.freeze({
    url,
    connections: options.connections || 10,
    duration: options.duration || 30,
    pipelining: options.pipelining || 1,
    requests: [
      { method: 'GET', path: '/' },
      { method: 'GET', path: '/health' }
    ]
  });

// ===== FUNCTIONAL HTTP UTILITIES =====

// Pure function: Parse JSON response
const parseJson = data => {
  try {
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Async function: HTTP GET request (wrapped for functional composition)
const httpGet = url => new Promise((resolve, reject) => {
  http.get(SERVER_URL + url, (res) => {
    if (res.statusCode !== 200) {
      reject(new Error(`Server returned status ${res.statusCode}`));
      return;
    }
    
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => resolve(data));
  }).on('error', reject);
});

// ===== FUNCTIONAL ERROR HANDLING =====

// Higher-order function: Wrap async operation with error handling
const withErrorHandler = (fn, errorMsg) => async (...args) => {
  try {
    return { success: true, data: await fn(...args) };
  } catch (error) {
    return { success: false, error: errorMsg, details: error.message };
  }
};

// Async function with retry: Check if server is running
const checkServer = retry(
  () => httpGet('/health').then(data => data === 'OK\n'),
  3,
  1000
);

// Async function: Get server stats
const getStats = async () => {
  const data = await httpGet('/stats');
  return parseJson(data);
};

// ===== PURE DISPLAY FUNCTIONS =====

// Pure function: Format stats for display
const formatStats = stats => ({
  requests: stats.requests,
  memory: stats.memory,
  cached: stats.cachedRequests,
  sessions: stats.activeSessions,
  connections: stats.connections
});

// Pure function: Create stats display message
const createStatsMessage = (label, stats) => `${label}: ${JSON.stringify(formatStats(stats), null, 2)}`;

// Pure function: Create load test summary
const createLoadTestSummary = result => ({
  totalRequests: result.requests.total,
  requestsPerSec: result.requests.average,
  avgLatency: result.latency.mean,
  p99Latency: result.latency.p99,
  throughput: Math.round(result.throughput.average / 1024),
  errors: result.errors
});

// Pure function: Calculate memory growth
const calculateGrowth = (initial, final) => ({
  newRequests: final.requests - initial.requests,
  leakedRequests: final.cachedRequests - initial.cachedRequests,
  leakedSessions: final.activeSessions - initial.activeSessions,
  leakedConnections: final.connections - initial.connections
});

// ===== FUNCTIONAL LOGGING (Side Effects Isolated) =====

const log = (...args) => console.log(...args);
const logError = (...args) => console.error(...args);

const logBanner = (title) => {
  log('╔════════════════════════════════════════════════════════════╗');
  log(`║  ${title.padEnd(58)}║`);
  log('╚════════════════════════════════════════════════════════════╝');
  log();
};

const logSection = title => {
  log('═══════════════════════════════════════════════════════════');
  log(title);
  log('═══════════════════════════════════════════════════════════');
};

// ===== FUNCTIONAL ASYNC PIPELINE =====

// Async function: Run autocannon with progress tracking
const runLoadTest = config => new Promise((resolve, reject) => {
  const instance = autocannon(config, (err, result) => {
    if (err) reject(err);
    else resolve(result);
  });
  
  // Side effect: Track progress
  autocannon.track(instance, { renderProgressBar: true });
});

// ===== MAIN EXECUTION (Functional Composition) =====

const runLoadTestFlow = async () => {
  logBanner('Autocannon Load Test - Functional Approach');
  
  // Step 1: Check server availability
  log('Checking if server is running...');
  const serverCheck = await withErrorHandler(checkServer, 'Server check failed')();
  
  if (!serverCheck.success) {
    logError('✗ Server is not running!');
    logError('  Start the server with: npm run server');
    logError('  Or with inspect: npm run server:inspect\n');
    process.exit(1);
  }
  
  log('✓ Server is running\n');
  
  // Step 2: Get initial stats
  log('Getting initial memory stats...');
  const initialStatsResult = await getStats();
  
  if (!initialStatsResult.success) {
    logError('Failed to get initial stats');
    process.exit(1);
  }
  
  const initialStats = initialStatsResult.data;
  log(createStatsMessage('Initial state', initialStats));
  log();
  
  // Step 3: Configure and run load test
  const config = createLoadTestConfig(SERVER_URL, {
    connections: 10,
    duration: 30,
    pipelining: 1
  });
  
  log('Load Test Configuration:');
  log(`  Connections: ${config.connections}`);
  log(`  Duration: ${config.duration} seconds`);
  log(`  Target: ${config.url}`);
  log();
  log('Starting load test...\n');
  
  // Step 4: Execute load test
  const loadTestResult = await withErrorHandler(
    () => runLoadTest(config),
    'Load test failed'
  )();
  
  if (!loadTestResult.success) {
    logError('Load test failed:', loadTestResult.details);
    process.exit(1);
  }
  
  const result = loadTestResult.data;
  
  // Step 5: Display results
  log('\n');
  logSection('Load Test Results:');
  const summary = createLoadTestSummary(result);
  log(`Total Requests: ${summary.totalRequests}`);
  log(`Requests/sec: ${summary.requestsPerSec}`);
  log(`Latency (avg): ${summary.avgLatency} ms`);
  log(`Latency (p99): ${summary.p99Latency} ms`);
  log(`Throughput: ${summary.throughput} KB/sec`);
  log(`Errors: ${summary.errors}`);
  log();
  
  // Step 6: Get final stats (with delay)
  log('Getting final memory stats...');
  await delay(2000);
  
  const finalStatsResult = await withErrorHandler(getStats, 'Failed to get final stats')();
  
  if (!finalStatsResult.success) {
    log('Could not get final stats (server may be overloaded)');
    log('This is normal for high-load scenarios.\n');
    logNextSteps();
    return;
  }
  
  const finalStats = finalStatsResult.data;
  
  // Step 7: Analyze and display growth
  logSection('Memory Leak Analysis:');
  log('Before Load Test:');
  log(`  Requests: ${initialStats.requests}`);
  log(`  Heap Used: ${initialStats.memory.heapUsed}`);
  log(`  RSS: ${initialStats.memory.rss}`);
  log(`  Cached Requests: ${initialStats.cachedRequests}`);
  log(`  Active Sessions: ${initialStats.activeSessions}`);
  log(`  Connections: ${initialStats.connections}`);
  log();
  
  log('After Load Test:');
  log(`  Requests: ${finalStats.requests}`);
  log(`  Heap Used: ${finalStats.memory.heapUsed}`);
  log(`  RSS: ${finalStats.memory.rss}`);
  log(`  Cached Requests: ${finalStats.cachedRequests}`);
  log(`  Active Sessions: ${finalStats.activeSessions}`);
  log(`  Connections: ${finalStats.connections}`);
  log();
  
  const growth = calculateGrowth(initialStats, finalStats);
  log('Memory Growth:');
  log(`  New Requests: ${growth.newRequests}`);
  log(`  Leaked Requests: ${growth.leakedRequests}`);
  log(`  Leaked Sessions: ${growth.leakedSessions}`);
  log(`  Leaked Connections: ${growth.leakedConnections}`);
  log();
  
  log('⚠️  Notice: All three leaks are growing!');
  log();
  log('Functional Programming Note:');
  log('While this code uses functional patterns (pure functions,');
  log('composition, explicit side effects), the server still leaks');
  log('because references are intentionally retained. Functional');
  log('programming makes the data flow explicit, helping identify');
  log('where leaks occur, but does not prevent them automatically.');
  log();
  
  logNextSteps();
};

const logNextSteps = () => {
  log('Next Steps for Debugging:');
  log('1. Run server with inspect: npm run server:inspect');
  log('2. Open Chrome and go to: chrome://inspect');
  log('3. Click "inspect" under your Node.js process');
  log('4. Go to Memory tab > Take Heap Snapshot (before load)');
  log('5. Run this load test again: npm run loadtest');
  log('6. Take another Heap Snapshot (after load)');
  log('7. Compare snapshots to identify what\'s growing');
  log('8. Look for: requestCache, userSessions, connections');
  log();
};

// Execute with error handling
runLoadTestFlow().catch(err => {
  logError('Load test failed:', err.message);
  process.exit(1);
});
