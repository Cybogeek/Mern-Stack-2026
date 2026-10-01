// server.js - entry point: creates the HTTP server and wires everything together.
import http from 'node:http';
import { PORT, HOST } from './src/config.js';
import { handleRequest } from './src/router.js';
import { renderView, sendHtml } from './src/render.js';

const server = http.createServer(async (req, res) => {
  const started = Date.now();

  // Log every request once the response has been sent.
  res.on('finish', () => {
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - started}ms)`);
  });

  try {
    await handleRequest(req, res);
  } catch (err) {
    // Last-resort error handler: any uncaught error in a route becomes a 500 page.
    console.error('Unhandled error:', err);
    if (res.headersSent) return res.end();
    try {
      sendHtml(res, 500, await renderView('500', { title: 'Server Error' }));
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 - Internal Server Error');
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`FreshFold server running at http://${HOST}:${PORT}`);
  console.log(`Try: /home /about /contact /services /pricing /health`);
});

// Graceful shutdown on Ctrl+C / kill.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  });
}
