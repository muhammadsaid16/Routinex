# Device Sync & Link

Ledger syncs your life between your PC and your phone the same way T3 Code
syncs a project between a laptop and a phone:

- The data lives on the device first (Dexie / IndexedDB).
- Two devices meet through a short pairing code.
- The devices talk to each other directly over a WebRTC data channel.
- No habit, entry or note ever reaches a server.

## How to pair two devices

1. Open **Account & Preferences** on the device that holds most of your data.
2. In **Device Sync & Link** choose **This device hosts**.
3. The screen shows a pairing code, for example `RXT-9F5Y-KKBQ-QA8P`, and a QR code.
4. On the second device open Ledger and choose **Join with a code**.
5. Type the code, or scan the QR code with the camera of the second device, or
   scan the QR code with the camera app of the phone. The camera app opens
   Ledger with the code in the link, and the app pairs itself.

After the link is up, every change on either device shows up on the other one
within a fraction of a second.

## The camera scanner

The panel has a **Scan the QR code with the camera** button. It reads the code
with the rear camera of the device and joins on its own.

Browsers only open the camera on a secure address. The scanner therefore needs
one of these:

- the deployed app on `https://routinex-one.vercel.app`
- the Android app, which loads the same https address
- `http://localhost` during development

On a plain `http` address the scanner explains this and the code can still be
typed by hand.

## Reloads and lost links

The pairing code and the peer token stay on the device. A page reload, a lost
network or a closed laptop therefore does not end the pairing:

- the host takes its peer id back with the same token
- the guest reconnects to that peer id
- both devices exchange a fresh snapshot when the link is back

The link comes back by itself within a few seconds. Two devices call each
other, so a device that sleeps with a frozen timer is still reached. Browsers
freeze timers in a background tab, so the app also repairs the link as soon as
it comes back to the front.

## The signalling broker

The broker only introduces two devices to each other. The public PeerJS broker
limits how many devices may pair from one address, so a private broker can be
used instead:

```bash
npm run signal          # listens on http://localhost:9000
```

Point the app at it from **Device Sync & Link → Signalling server**, or with the
environment variables before a build:

```bash
VITE_PEER_HOST=localhost VITE_PEER_PORT=9000 VITE_PEER_SECURE=false npm run build
```

| Variable | Meaning | Default |
| --- | --- | --- |
| `VITE_PEER_HOST` | broker host | `0.peerjs.com` |
| `VITE_PEER_PORT` | broker port | `443` |
| `VITE_PEER_PATH` | broker path prefix | `/` |
| `VITE_PEER_SECURE` | `false` for a plain http broker | `true` |

A page on `https` cannot call a plain `http` broker. For the deployed app the
broker therefore needs a certificate, for example through a tunnel.

## What travels over the link

| Data | Table | Notes |
| --- | --- | --- |
| Habits | `habits` | title, schedule, target, archived flag |
| Habit entries | `entries` | completion, value, note |
| Preferences | `settings` | user name, theme, UI scale |

## How the merge works

Every record carries two stamps:

- `updatedAt`: the time of the last write, in epoch milliseconds.
- `updatedBy`: the id of the device that wrote it.

When both devices changed the same record, the newer `updatedAt` wins. When the
time is the same, the device id breaks the tie. A delete always wins over an
older write, so a record cannot come back after it was removed.

## Encryption

The signalling broker only introduces the two devices. It never sees the
payload, because every message is encrypted on the device:

```
key        = SHA-256('routinix.device-sync.v1|' + pairing code)
keystream  = SHA-256(key || nonce || counter)
ciphertext = plaintext XOR keystream
tag        = HMAC-SHA-256(key, nonce || ciphertext)[0..16]
envelope   = base64(nonce || tag || ciphertext)
```

The pairing code never leaves the devices in plain text. The handshake sends
`HMAC-SHA-256(key, 'routinix.device-sync.auth|' + nonce)` instead, so a broker
that watches the traffic cannot recover the code.

The peer id that the devices register with the broker is
`SHA-256('routinix.device-sync.peer|' + code)`. The broker sees the peer id but
not the code.

## Files

| File | Purpose |
| --- | --- |
| `src/sync/sha256.ts` | pure JavaScript SHA-256 and HMAC |
| `src/sync/cipher.ts` | message encryption and the pairing proof |
| `src/sync/code.ts` | pairing codes and peer id derivation |
| `src/sync/syncManager.ts` | peer link, snapshot, merge, tombstones, reconnect |
| `src/sync/types.ts` | message and record shapes |
| `src/components/DeviceSyncPanel.tsx` | the panel in Account & Preferences |
| `src/components/QrScanner.tsx` | camera scanner for the pairing code |
| `server/signal.mjs` | optional self hosted broker |
