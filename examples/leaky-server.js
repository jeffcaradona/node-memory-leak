/**
 * Leaky HTTP Server Example
 * 
 * This demonstrates how to reproduce production memory leaks locally
 * using a simple HTTP server with intentional leaks.
 * 
 * Usage:
 * 1. Start server: npm run server
 * 2. In another terminal, run load test: npm run loadtest
 * 3. For debugging with Chrome DevTools: npm run server:inspect
 *    Then open chrome://inspect and watch memory grow
 */

import http from 'http';

// Global cache that grows indefinitely (memory leak!)
const requestCache = [];
const userSessions = new Map();
let requestCount = 0;

// Simulate a database connection pool that leaks
class ConnectionPool {
  constructor() {
    this.connections = [];
  }
  
  getConnection() {
    // Leak: creating new connections without cleanup
    const connection = {
      id: this.connections.length,
      data: new Array(10000).fill('connection-data'), // ~100KB per connection
      createdAt: new Date()
    };
    this.connections.push(connection);
    return connection;
  }
  
  // This cleanup method is never called! (Intentional leak)
  cleanup() {
    this.connections = [];
  }
}

const pool = new ConnectionPool();

const server = http.createServer((req, res) => {
  requestCount++;
  
  // Leak 1: Caching every request in memory
  requestCache.push({
    url: req.url,
    method: req.method,
    timestamp: new Date(),
    headers: req.headers,
    data: new Array(1000).fill('request-data') // ~10KB per request
  });
  
  // Leak 2: Creating session objects that never expire
  const sessionId = `session-${requestCount}`;
  userSessions.set(sessionId, {
    id: sessionId,
    data: new Array(5000).fill('session-data'), // ~50KB per session
    createdAt: new Date()
  });
  
  // Leak 3: Getting connections without returning them to pool
  const conn = pool.getConnection();
  
  // Handle different routes
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Memory Leak Demo Server\n');
  } else if (req.url === '/stats') {
    const usage = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      requests: requestCount,
      cachedRequests: requestCache.length,
      activeSessions: userSessions.size,
      connections: pool.connections.length,
      memory: {
        rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB'
      }
    }, null, 2));
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK\n');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n');
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Leaky HTTP Server Started                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log();
  console.log('Endpoints:');
  console.log('  GET /        - Hello message');
  console.log('  GET /stats   - Memory statistics');
  console.log('  GET /health  - Health check');
  console.log();
  console.log('Memory Leaks (intentional):');
  console.log('  1. Request cache grows indefinitely');
  console.log('  2. User sessions never expire');
  console.log('  3. Database connections never returned to pool');
  console.log();
  console.log('To reproduce production issues:');
  console.log('  1. Run load test: npm run loadtest');
  console.log('  2. Watch /stats endpoint for growing memory');
  console.log('  3. Debug with: npm run server:inspect');
  console.log('     Then open chrome://inspect in Chrome');
  console.log();
  console.log('Memory monitoring:');
  
  // Log memory usage every 5 seconds
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log(`[${new Date().toISOString()}] Requests: ${requestCount} | ` +
                `Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB | ` +
                `RSS: ${Math.round(usage.rss / 1024 / 1024)}MB | ` +
                `Cache: ${requestCache.length} | ` +
                `Sessions: ${userSessions.size} | ` +
                `Connections: ${pool.connections.length}`);
  }, 5000);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
