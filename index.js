/**
 * Node.js Memory Leak Detection Demo (Functional Programming Approach)
 * Main entry point
 * 
 * This demo has been refactored to demonstrate functional programming paradigms
 * in Node.js while teaching memory leak detection and prevention.
 */

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║   Node.js Memory Leak Detection Demo (Functional Approach)   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log();
console.log('This demo teaches memory leak detection using functional programming:');
console.log('• Pure functions for memory measurement');
console.log('• Function composition for complex operations');
console.log('• Explicit side effect management');
console.log('• Immutable data transformations');
console.log('• Higher-order functions for reusable patterns');
console.log();
console.log('Core Principles:');
console.log('  1. Pure Functions - Deterministic, no side effects');
console.log('  2. Immutability - Transform data, don\'t mutate it');
console.log('  3. Composition - Build complex behavior from simple functions');
console.log('  4. Explicit Cleanup - Return cleanup functions with resources');
console.log();
console.log('Available commands:');
console.log('  npm run demo          - Run the main functional demo');
console.log('  npm run leak:global   - Global variable leaks (functional vs imperative)');
console.log('  npm run leak:closure  - Closure leaks (minimizing scope)');
console.log('  npm run leak:events   - Event listener leaks (explicit cleanup)');
console.log('  npm run leak:timer    - Timer/interval leaks (HOF patterns)');
console.log('  npm run inspect       - Run with Chrome DevTools');
console.log('  npm run heap-prof     - Generate heap profile');
console.log();
console.log('Production issue reproduction:');
console.log('  npm run server        - Start HTTP server (functional middleware)');
console.log('  npm run server:inspect - Start server with --inspect flag');
console.log('  npm run loadtest      - Run autocannon load test (functional async)');
console.log();
console.log('Key Insight:');
console.log('Functional programming does NOT prevent memory leaks automatically,');
console.log('but it makes data flow explicit, helping you identify leak sources.');
console.log();
console.log('For more information, see README.md');
console.log();
