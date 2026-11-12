/**
 * Optional self hosted signalling broker for the Routinix device link.
 *
 * The broker only introduces two devices to each other. It never sees a
 * habit, an entry or a note, because the payload is encrypted on the device
 * with a key derived from the pairing code.
 *
 * Run it with:  npm run signal
 * Then point the app at it, either with the environment variables before a
 * build, or from the Device Sync panel in the app.
 */
import http from 'node:http';
import express from 'express';
import { WebSocketServer as WsServer } from 'ws';

// The bundled broker is from 2015 and reads socket.upgradeReq, which the
// websocket library removed in version 5. The connection event carries the
// request, so the old name is restored here.
const originalEmit = WsServer.prototype.emit;
WsServer.prototype.emit = function (event, ...args) {
  if (event === 'connection') {
    const [socket, request] = args;
    if (socket && request && !socket.upgradeReq) {
      socket.upgradeReq = request;
    }
  }
  return originalEmit.call(this, event, ...args);
};

const { ExpressPeerServer } = await import('peerjs-server');

const port = Number(process.env.PORT || 9000);

const app = express();

const server = http.createServer((req, res) => {
  // The health check stays outside the broker routes.
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'routinix-signal' }));
    return;
  }
  app(req, res);
});

const peerServer = ExpressPeerServer(server, {
  // The websocket endpoint is mounted on /peerjs by the broker itself.
  path: '/',
  debug: 1,
  allow_discovery: false,
});

app.use('/', peerServer);

server.listen(port, () => {
  console.log(`Routinix signalling broker listening on http://localhost:${port}`);
  console.log(`Peer endpoint: http://localhost:${port}/peerjs`);
});

const shutdown = () => {
  try {
    peerServer.close?.();
  } catch {
    /* ignore */
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
