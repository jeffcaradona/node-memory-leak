/**
 * Leaky HTTP Server Example (Functional Approach)
 * 
 * Demonstrates functional patterns for HTTP server with intentional leaks:
 * - Pure request handlers
 * - Functional middleware composition
 * - Explicit state management
 * - Composable route handlers
 * 
 * This shows both leaky and functional patterns side by side.
 */

import http from 'http';
import { getMemorySnapshot, formatMemorySnapshot, pipe, curry2 } from '../lib/functional-utils.js';

// ===== FUNCTIONAL STATE MANAGEMENT =====

/**
 * IMPORTANT: This mutable state is INTENTIONALLY problematic!
 * 
 * This breaks functional programming principles to demonstrate memory leaks.
 * In production functional code, you should:
 * 1. Pass state explicitly through function parameters
 * 2. Return new state instead of mutating
 * 3. Use immutable data structures
 * 4. Implement proper cleanup/disposal patterns
 * 
 * This server demonstrates that even with functional patterns,
 * leaks occur if you hold references to data in module scope.
 */

// Pure function: Create initial server state
const createInitialState = () => Object.freeze({
  requestCache: [],
  userSessions: new Map(),
  connections: [],
  requestCount: 0
});

// Mutable state (for leak demonstration - NOT a functional pattern!)
let serverState = createInitialState();

// ===== PURE REQUEST DATA TRANSFORMATIONS =====

// Pure function: Create request record
const createRequestRecord = (url, method, headers) => 
  Object.freeze({
    url,
    method,
    timestamp: new Date(),
    headers: { ...headers },
    data: new Array(1000).fill('request-data') // ~10KB per request
  });

// Pure function: Create session record
const createSessionRecord = sessionId =>
  Object.freeze({
    id: sessionId,
    data: new Array(5000).fill('session-data'), // ~50KB per session
    createdAt: new Date()
  });

// Pure function: Create connection record
const createConnectionRecord = id =>
  Object.freeze({
    id,
    data: new Array(10000).fill('connection-data'), // ~100KB per connection
    createdAt: new Date()
  });

// ===== LEAKY OPERATIONS (Demonstrating Problems) =====

// Impure: Adds to cache (leak demonstration)
const addToCache = record => {
  serverState.requestCache.push(record);
  return record;
};

// Impure: Adds session (leak demonstration)
const addSession = sessionId => {
  const session = createSessionRecord(sessionId);
  serverState.userSessions.set(sessionId, session);
  return session;
};

// Impure: Adds connection (leak demonstration)
const addConnection = () => {
  const connection = createConnectionRecord(serverState.connections.length);
  serverState.connections.push(connection);
  return connection;
};

// Impure: Increment request count
const incrementRequestCount = () => {
  serverState.requestCount++;
  return serverState.requestCount;
};

// ===== FUNCTIONAL HTTP UTILITIES =====

// Pure function: Create JSON response
const createJsonResponse = data =>
  JSON.stringify(data, null, 2);

// Pure function: Create stats object
const createStats = () => {
  const usage = process.memoryUsage();
  const formatted = formatMemorySnapshot(getMemorySnapshot());
  
  return {
    requests: serverState.requestCount,
    cachedRequests: serverState.requestCache.length,
    activeSessions: serverState.userSessions.size,
    connections: serverState.connections.length,
    memory: {
      rss: formatted.rss,
      heapUsed: formatted.heapUsed,
      heapTotal: formatted.heapTotal
    }
  };
};

// ===== FUNCTIONAL MIDDLEWARE PATTERN =====

// Higher-order function: Create middleware
const createMiddleware = fn => (req, res, next) => {
  fn(req, res);
  if (next) next(req, res);
};

// Middleware: Log request (side effect isolated)
const logRequest = createMiddleware((req) => {
  const count = incrementRequestCount();
  console.log(`[Request #${count}] ${req.method} ${req.url}`);
});

// Middleware: Cache request (leak demonstration)
const cacheRequest = createMiddleware((req) => {
  const record = createRequestRecord(req.url, req.method, req.headers);
  addToCache(record);
});

// Middleware: Create session (leak demonstration)
const createSession = createMiddleware((req) => {
  const sessionId = `session-${serverState.requestCount}`;
  addSession(sessionId);
});

// Middleware: Get connection (leak demonstration)
const getConnection = createMiddleware(() => {
  addConnection();
});

// ===== FUNCTIONAL ROUTE HANDLERS =====

// Pure function: Create route matcher
const matchRoute = curry2((pattern, url) => url === pattern);

// Higher-order function: Create route handler
const createRouteHandler = (pattern, handler) => (req, res) => {
  if (matchRoute(pattern)(req.url)) {
    handler(req, res);
    return true;
  }
  return false;
};

// Route handlers (functional composition)
const handleRoot = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Memory Leak Demo Server (Functional Approach)\n');
};

const handleStats = (req, res) => {
  const stats = createStats();
  const json = createJsonResponse(stats);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(json);
};

const handleHealth = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK\n');
};

const handleNotFound = (req, res) => {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found\n');
};

// ===== FUNCTIONAL REQUEST ROUTER =====

// Compose route handlers
const routes = [
  createRouteHandler('/', handleRoot),
  createRouteHandler('/stats', handleStats),
  createRouteHandler('/health', handleHealth)
];

// Pure function: Route request through handlers
const routeRequest = (req, res) => {
  const handled = routes.some(handler => handler(req, res));
  if (!handled) {
    handleNotFound(req, res);
  }
};

// ===== FUNCTIONAL MIDDLEWARE COMPOSITION =====

/**
 * Compose middleware pipeline
 * 
 * This creates a chain where each middleware can call the next one.
 * The execution flows from first to last middleware, then to the handler.
 * 
 * Example flow:
 *   applyMiddleware(m1, m2, m3)(req, res, handler)
 *   -> m1 executes -> m2 executes -> m3 executes -> handler executes
 */
const applyMiddleware = (...middlewares) => (req, res, handler) => {
  middlewares.reduce(
    (next, middleware) => () => middleware(req, res, next),
    () => handler(req, res)
  )();
};

// ===== SERVER CREATION (Functional Approach) =====

const requestHandler = (req, res) => {
  // Apply middleware pipeline with leaky operations (for demonstration)
  applyMiddleware(
    logRequest,
    cacheRequest,
    createSession,
    getConnection
  )(req, res, routeRequest);
};

const server = http.createServer(requestHandler);

const PORT = process.env.PORT || 3000;

// ===== FUNCTIONAL MONITORING =====

// Pure function: Create log message
const createLogMessage = () => {
  const snapshot = getMemorySnapshot();
  const formatted = formatMemorySnapshot(snapshot);
  return `[${new Date().toISOString()}] ` +
         `Requests: ${serverState.requestCount} | ` +
         `Heap: ${formatted.heapUsed} | ` +
         `RSS: ${formatted.rss} | ` +
         `Cache: ${serverState.requestCache.length} | ` +
         `Sessions: ${serverState.userSessions.size} | ` +
         `Connections: ${serverState.connections.length}`;
};

// Start monitoring
const startMonitoring = () => {
  setInterval(() => {
    console.log(createLogMessage());
  }, 5000);
};

// ===== SERVER LIFECYCLE =====

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Leaky HTTP Server (Functional Approach)                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log();
  console.log('Functional Programming Features:');
  console.log('  • Pure functions for data transformation');
  console.log('  • Functional middleware composition');
  console.log('  • Immutable request/response records');
  console.log('  • Higher-order route handlers');
  console.log();
  console.log('Endpoints:');
  console.log('  GET /        - Hello message');
  console.log('  GET /stats   - Memory statistics');
  console.log('  GET /health  - Health check');
  console.log();
  console.log('Memory Leaks (intentional for demonstration):');
  console.log('  1. Request cache grows indefinitely');
  console.log('  2. User sessions never expire');
  console.log('  3. Database connections never returned to pool');
  console.log();
  console.log('Note: These leaks demonstrate that functional programming');
  console.log('does NOT prevent memory leaks automatically. However, it');
  console.log('makes data flow explicit, helping identify leak sources.');
  console.log();
  console.log('To reproduce production issues:');
  console.log('  1. Run load test: npm run loadtest');
  console.log('  2. Watch /stats endpoint for growing memory');
  console.log('  3. Debug with: npm run server:inspect');
  console.log('     Then open chrome://inspect in Chrome');
  console.log();
  console.log('Memory monitoring:');
  
  startMonitoring();
});

// ===== FUNCTIONAL CLEANUP =====

// Pure function: Create cleanup handler
const createCleanupHandler = (server) => (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

const handleShutdown = createCleanupHandler(server);

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
