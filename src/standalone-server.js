// Standalone HTTP server that starts IMMEDIATELY
// NestJS bootstraps in background after server is listening
const http = require('http');
const PORT = Number(process.env.PORT) || 8080;

let nestReady = false;
let nestError = null;

// Minimal HTTP server - responds instantly
const server = http.createServer((req, res) => {
  const isCORS = req.method === 'OPTIONS';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (isCORS) {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check - always fast
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: nestReady ? 'ok' : 'starting',
      nest: nestReady ? 'ready' : (nestError ? 'error' : 'initializing'),
      error: nestError ? nestError.message : undefined,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // All other requests return 503 until NestJS is ready
  if (!nestReady) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'initializing',
      message: 'Server is starting, please wait...',
    }));
    return;
  }

  // Forward to NestJS (won't reach here until NestJS is ready)
  res.writeHead(503, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'error',
    message: 'NestJS app not properly initialized',
  }));
});

// Start server IMMEDIATELY
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[${new Date().toISOString()}] ✅ HTTP server listening on 0.0.0.0:${PORT}`);
  console.log(`[${new Date().toISOString()}] ⏳ Bootstrapping NestJS in background...`);
  
  // Import and bootstrap NestJS AFTER server is listening
  try {
    const bootstrap = require('./bootstrap');
    await bootstrap(server);
    nestReady = true;
    console.log(`[${new Date().toISOString()}] ✅ NestJS application fully initialized`);
  } catch (error) {
    nestError = error;
    console.error(`[${new Date().toISOString()}] ❌ NestJS bootstrap failed:`, error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.close(() => process.exit(0));
});
