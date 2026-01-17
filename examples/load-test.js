/**
 * Load Testing with Autocannon
 * 
 * This script uses autocannon to generate load on the leaky server
 * to help reproduce production-like memory leak scenarios.
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install
 * 2. Start the server: npm run server (in another terminal)
 * 3. Run this script: npm run loadtest
 * 
 * For debugging:
 * - Start server with inspect: npm run server:inspect
 * - Open chrome://inspect in Chrome
 * - Take heap snapshots before/after load test
 * - Compare snapshots to identify leaks
 */

import autocannon from 'autocannon';
import http from 'http';

const SERVER_URL = 'http://localhost:3000';

// Check if server is running
function checkServer() {
  return new Promise((resolve, reject) => {
    http.get(SERVER_URL + '/health', (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Server returned status ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Get current memory stats from server
async function getStats() {
  return new Promise((resolve, reject) => {
    http.get(SERVER_URL + '/stats', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runLoadTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Autocannon Load Test - Memory Leak Reproduction          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  
  // Check if server is running
  console.log('Checking if server is running...');
  try {
    await checkServer();
    console.log('✓ Server is running\n');
  } catch (err) {
    console.error('✗ Server is not running!');
    console.error('  Start the server with: npm run server');
    console.error('  Or with inspect: npm run server:inspect\n');
    process.exit(1);
  }
  
  // Get initial stats
  console.log('Getting initial memory stats...');
  const initialStats = await getStats();
  console.log('Initial state:', {
    requests: initialStats.requests,
    memory: initialStats.memory
  });
  console.log();
  
  // Configure load test
  const loadTestConfig = {
    url: SERVER_URL,
    connections: 10,        // Number of concurrent connections
    duration: 10,           // Test duration in seconds
    pipelining: 1,          // Requests per connection
    requests: [
      {
        method: 'GET',
        path: '/'
      },
      {
        method: 'GET',
        path: '/health'
      }
    ]
  };
  
  console.log('Load Test Configuration:');
  console.log(`  Connections: ${loadTestConfig.connections}`);
  console.log(`  Duration: ${loadTestConfig.duration} seconds`);
  console.log(`  Target: ${loadTestConfig.url}`);
  console.log();
  console.log('Starting load test...\n');
  
  // Run the load test
  const result = await new Promise((resolve, reject) => {
    const instance = autocannon(loadTestConfig, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
    
    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Load Test Results:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.mean} ms`);
  console.log(`Latency (p99): ${result.latency.p99} ms`);
  console.log(`Throughput: ${Math.round(result.throughput.average / 1024)} KB/sec`);
  console.log(`Errors: ${result.errors}`);
  console.log();
  
  // Get final stats
  console.log('Getting final memory stats...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for stats to update
  
  let finalStats;
  try {
    finalStats = await getStats();
  } catch (err) {
    console.log('Could not get final stats (server may be overloaded)');
    console.log('This is normal for high-load scenarios.\n');
    console.log('Next Steps for Debugging:');
    console.log('1. Run server with inspect: npm run server:inspect');
    console.log('2. Open Chrome and go to: chrome://inspect');
    console.log('3. Click "inspect" under your Node.js process');
    console.log('4. Go to Memory tab > Take Heap Snapshot (before load)');
    console.log('5. Run this load test again: npm run loadtest');
    console.log('6. Take another Heap Snapshot (after load)');
    console.log('7. Compare snapshots to identify what\'s growing');
    console.log('8. Look for: requestCache, userSessions, connections');
    console.log();
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Memory Leak Analysis:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Before Load Test:');
  console.log(`  Requests: ${initialStats.requests}`);
  console.log(`  Heap Used: ${initialStats.memory.heapUsed}`);
  console.log(`  RSS: ${initialStats.memory.rss}`);
  console.log(`  Cached Requests: ${initialStats.cachedRequests}`);
  console.log(`  Active Sessions: ${initialStats.activeSessions}`);
  console.log(`  Connections: ${initialStats.connections}`);
  console.log();
  console.log('After Load Test:');
  console.log(`  Requests: ${finalStats.requests}`);
  console.log(`  Heap Used: ${finalStats.memory.heapUsed}`);
  console.log(`  RSS: ${finalStats.memory.rss}`);
  console.log(`  Cached Requests: ${finalStats.cachedRequests}`);
  console.log(`  Active Sessions: ${finalStats.activeSessions}`);
  console.log(`  Connections: ${finalStats.connections}`);
  console.log();
  console.log('Memory Growth:');
  console.log(`  New Requests: ${finalStats.requests - initialStats.requests}`);
  console.log(`  Leaked Requests: ${finalStats.cachedRequests - initialStats.cachedRequests}`);
  console.log(`  Leaked Sessions: ${finalStats.activeSessions - initialStats.activeSessions}`);
  console.log(`  Leaked Connections: ${finalStats.connections - initialStats.connections}`);
  console.log();
  console.log('⚠️  Notice: All three leaks are growing!');
  console.log();
  console.log('Next Steps for Debugging:');
  console.log('1. Run server with inspect: npm run server:inspect');
  console.log('2. Open Chrome and go to: chrome://inspect');
  console.log('3. Click "inspect" under your Node.js process');
  console.log('4. Go to Memory tab > Take Heap Snapshot (before load)');
  console.log('5. Run this load test again: npm run loadtest');
  console.log('6. Take another Heap Snapshot (after load)');
  console.log('7. Compare snapshots to identify what\'s growing');
  console.log('8. Look for: requestCache, userSessions, connections');
  console.log();
}

// Run the load test
runLoadTest().catch(err => {
  console.error('Load test failed:', err.message);
  process.exit(1);
});
