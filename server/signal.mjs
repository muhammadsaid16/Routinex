/**
 * Optional self hosted signalling broker for the Routinix device link.
 *
 * The broker only introduces two devices to each other. It never sees a
 * habit, an entry or a note, because the payload is encrypted on the device
 * with a key derived from the pairing code.
 *
 * Run it with:  npm run signal
 * Then point the app at it with:
 *   VITE_PEER_HOST=localhost VITE_PEER_PORT=9000 VITE_PEER_SECURE=false
 */
import http from 'node:http';
import { PeerServer } from 'peerjs-server';

const port = Number(process.env.PORT || 9000);
const mountPath = process.env.PEER_PATH || '/';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'routinix-signal' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Routinix signalling broker. WebSocket endpoint: ' + mountPath + 'peerjs\n');
});

const peerServer = new PeerServer(server, {
  path: mountPath,
  debug: 1,
  allow_discovery: false,
});

server.listen(port, () => {
  console.log(`Routinix signalling broker listening on http://localhost:${port}`);
  console.log(`Peer id endpoint: http://localhost:${port}${mountPath}peerjs/id`);
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
