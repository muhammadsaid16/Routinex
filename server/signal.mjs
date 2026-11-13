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
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { WebSocketServer as WsServer } from 'ws';

// The bundled broker is from 2015 and reads socket.upgradeReq, which the
// websocket library removed in version 5. The connection event carries the
// request, so the old name is restored here.
//
// The send method is watched as well. The broker sends the ready message to
// a new peer, and the patch below sends it to a peer that takes its id back.
// A socket must never get the ready message twice, because the device then
// opens the link twice and closes the first channel again.
const originalEmit = WsServer.prototype.emit;
WsServer.prototype.emit = function (event, ...args) {
  if (event === 'connection') {
    const [socket, request] = args;
    if (socket && request && !socket.upgradeReq) {
      socket.upgradeReq = request;
    }
    if (socket && socket.readySent === undefined) {
      socket.readySent = false;
      const send = socket.send.bind(socket);
      socket.send = (data, ...rest) => {
        if (typeof data === 'string' && data.includes('"type":"OPEN"')) {
          socket.readySent = true;
        }
        return send(data, ...rest);
      };
    }
  }
  return originalEmit.call(this, event, ...args);
};

const { ExpressPeerServer } = await import('peerjs-server');

/**
 * The bundled broker only sends the ready message to a peer that is new.
 * A peer that takes its id back, which is what a page reload does, waits for
 * that message for ever and the app never opens the link. The ready message
 * is sent here when the token of the new socket matches the held peer.
 */
function patchIdTakeover(peerServer) {
  const original = peerServer._configureWS.bind(peerServer);

  peerServer._configureWS = (socket, key, id, token) => {
    const held = peerServer._clients[key]?.[id];
    const takesTheIdBack = Boolean(held) && held.token === token;

    original(socket, key, id, token);

    // The broker already sent the ready message to a new peer. Only a peer
    // that takes its id back still needs it.
    if (!takesTheIdBack || socket.readySent) return;
    try {
      socket.send(JSON.stringify({ type: 'OPEN' }));
    } catch {
      /* the socket is already gone */
    }
  };
}

/**
 * Builds the broker without starting it. The tests use this to run the
 * broker on a free port.
 */
export function createSignalServer(options = {}) {
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
    debug: options.debug ?? 1,
    allow_discovery: false,
  });

  patchIdTakeover(peerServer);
  app.use('/', peerServer);

  return {
    app,
    server,
    peerServer,
    /** Starts the broker and gives back the port it listens on. */
    listen(port = 9000) {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, () => {
          server.removeListener('error', reject);
          resolve(server.address().port);
        });
      });
    },
    /** Stops the broker and drops every socket. */
    close() {
      return new Promise((resolve) => {
        try {
          peerServer.close?.();
        } catch {
          /* ignore */
        }
        server.close(() => resolve());
        setTimeout(resolve, 1500).unref?.();
      });
    },
  };
}

/** The addresses a phone on the same network can use. */
export function localAddresses(port) {
  const addresses = [];

  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      addresses.push(`http://${entry.address}:${port}`);
    }
  }

  return addresses;
}

async function main() {
  const port = Number(process.env.PORT || 9000);
  const broker = createSignalServer();
  const actualPort = await broker.listen(port);

  console.log(`Routinix signalling broker listening on http://localhost:${actualPort}`);
  console.log(`Peer endpoint: http://localhost:${actualPort}/peerjs`);
  for (const address of localAddresses(actualPort)) {
    console.log(`Same network: ${address}`);
  }
  console.log('Point the app at this address in Device Sync & Link → Signalling server.');

  const shutdown = () => {
    void broker.close().then(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  await main();
}
