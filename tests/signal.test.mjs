import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createSignalServer } from '../server/signal.mjs';

/** Opens a peer socket on the broker and collects its messages. */
function openPeer(port, id, token) {
  const url = `ws://localhost:${port}/peerjs?key=peerjs&id=${id}&token=${token}&version=1.5.5`;
  const ws = new WebSocket(url);
  const messages = [];
  const waiters = [];

  ws.on('message', (raw) => {
    const data = JSON.parse(raw.toString());
    messages.push(data);
    for (const waiter of [...waiters]) {
      if (waiter.type !== data.type) continue;
      waiters.splice(waiters.indexOf(waiter), 1);
      waiter.resolve(data);
    }
  });

  const waitFor = (type, timeoutMs = 5000) =>
    new Promise((resolve, reject) => {
      const found = messages.find((message) => message.type === type);
      if (found) {
        resolve(found);
        return;
      }
      waiters.push({ type, resolve });
      setTimeout(() => reject(new Error(`the broker sent no ${type} message`)), timeoutMs).unref?.();
    });

  return { ws, messages, waitFor };
}

async function withBroker(run) {
  const broker = createSignalServer({ debug: 0 });
  const port = await broker.listen(0);
  try {
    await run(port);
  } finally {
    await broker.close();
  }
}

test('the broker makes a new peer ready', async () => {
  await withBroker(async (port) => {
    const peer = openPeer(port, 'peer-one', 'token-one');
    const ready = await peer.waitFor('OPEN');
    assert.equal(ready.type, 'OPEN');
    peer.ws.close();
  });
});

test('the broker sends the ready message only once', async () => {
  await withBroker(async (port) => {
    const peer = openPeer(port, 'peer-once', 'token-once');
    await peer.waitFor('OPEN');
    // A second ready message makes the device open the link twice. The
    // second channel then replaces the first one and the link never settles.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const readyMessages = peer.messages.filter((message) => message.type === 'OPEN');
    assert.equal(readyMessages.length, 1);
    peer.ws.close();
  });
});

test('the broker passes an offer to the other peer', async () => {
  await withBroker(async (port) => {
    const host = openPeer(port, 'peer-host', 'token-host');
    const guest = openPeer(port, 'peer-guest', 'token-guest');
    await host.waitFor('OPEN');
    await guest.waitFor('OPEN');

    const offer = guest.waitFor('OFFER');
    host.ws.send(
      JSON.stringify({
        type: 'OFFER',
        dst: 'peer-guest',
        payload: { connectionId: 'c1', sdp: 'v=0 test' },
      })
    );

    const received = await offer;
    assert.equal(received.src, 'peer-host');
    assert.equal(received.dst, 'peer-guest');
    assert.equal(received.payload.sdp, 'v=0 test');

    host.ws.close();
    guest.ws.close();
  });
});

test('a peer takes its id back with the same token', async () => {
  await withBroker(async (port) => {
    const first = openPeer(port, 'peer-reload', 'stable-token');
    await first.waitFor('OPEN');

    // The page reloads. The old socket is still open for a moment, so the
    // broker holds the id. The new socket presents the same token.
    const second = openPeer(port, 'peer-reload', 'stable-token');
    const ready = await second.waitFor('OPEN');
    assert.equal(ready.type, 'OPEN');

    first.ws.close();
    second.ws.close();
  });
});

test('a peer with another token does not take a held id', async () => {
  await withBroker(async (port) => {
    const holder = openPeer(port, 'peer-held', 'right-token');
    await holder.waitFor('OPEN');

    const other = openPeer(port, 'peer-held', 'wrong-token');
    const refused = await other.waitFor('ID-TAKEN');
    assert.equal(refused.type, 'ID-TAKEN');

    holder.ws.close();
    other.ws.close();
  });
});
