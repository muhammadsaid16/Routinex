# Device Sync — Implementation Context

A complete brief for building the same feature in another product. Everything
here was built, broken and fixed in a real app, then verified end to end in a
real browser with two devices.

Use it as a specification, not as code to copy. Take the decisions, take the
edge case list, ignore the file names.

---

## 1. What the feature does

Two devices (a laptop and a phone) hold the same data. They are linked once
with a short code. After that every change on one device appears on the other
within a fraction of a second, and the link survives reloads, sleeps and
network changes.

Rules that shaped every decision:

- The data is local first. The app is fully usable with no link at all.
- No habit, note or preference ever reaches a server.
- The link comes back by itself. The user never has to pair twice.

---

## 2. Architecture

```
   [Laptop] ───── WebRTC data channel (direct, encrypted) ───── [Phone]
      │                                                          │
      └──── SDP + ICE candidates ──► broker ◄────────────────────┘
                 (introduction only)
```

**Three planes, keep them apart:**

| Plane | Carries | Path |
| --- | --- | --- |
| Control | pair, handshake, session | signalling broker (WebSocket) |
| Data | every record, every change | peer to peer (WebRTC data channel) |
| Storage | the records | local IndexedDB / SQLite |

The broker is a phone book. It never sees a record. If you want zero third
parties, the only alternative is encoding the whole WebRTC handshake into a QR
code, which produces an unreadable QR, needs a second round trip for the ICE
candidates, and breaks on every reload. A broker is the right trade.

**End to end encryption is application level, not only DTLS.** The data channel
is encrypted by WebRTC, but a malicious broker can rewrite the SDP and become a
man in the middle. Every payload is therefore encrypted again on the device with
a key that only the two devices can derive (section 4).

---

## 3. Pairing code and peer identifiers

**Code:** 12 characters of a Crockford base32 alphabet (60 bits), for example
`RXT-9F5Y-KKBQ-QA8P`.

Normalise every input: upper case, drop separators, and resolve the characters
people confuse when they read a code aloud (`I` and `L` to `1`, `O` to `0`,
`U` to `V`). Drop the display prefix only when the full 15 character form was
typed, so a random code that happens to start with those letters is never
mangled.

**Peer identifiers are derived from the code, never sent:**

```
host peer id = "ledger-" + base32(SHA-256("peer|" + code))[0..16]
guest peer id = "ledger-g" + base32(SHA-256("peer-guest|" + code))[0..16]
```

The broker therefore learns the peer ids but never the code, and the two
devices can find each other without any directory service.

**The token trick (do not skip this).** Most PeerJS style brokers hold a peer
id while the old socket is still open. A reload therefore produces
`ID is taken` and the device can never come back. The fix is a stable token
per peer id, kept in local storage and handed to the broker:

```
token = random 16 bytes, stored under "sync:token:<peer id>"
```

When the browser presents the same id with the same token, the broker hands
the id back to the new socket instead of refusing it. The device takes its own
id back after any reload.

**The token must be per peer id, not global.** The guest uses a different id
than the host, so each one keeps its own token.

**Two devices, two phones, one code.** If the guest id is already taken (a
second phone joined with the same code), fall back to a random guest id. The
protocol works without a stable guest id, because the two devices call each
other (section 6).

---

## 4. The cipher

Pure JavaScript SHA-256 plus HMAC. Do not use `crypto.subtle`: it only exists
in a secure context, and a device that pairs over a plain http address has no
`crypto.subtle`. A pure JS implementation keeps the behaviour identical
everywhere.

```
key        = SHA-256("app.device-sync.v1|" + pairing code)
keystream  = SHA-256(key || nonce || counterBE32)   for counter = 0,1,2,...
ciphertext = plaintext XOR keystream
tag        = HMAC-SHA-256(key, nonce || ciphertext)[0..16]
envelope   = base64(nonce || tag || ciphertext)
```

Encrypt then MAC. Verify the tag before you decrypt, with a constant time
comparison. One random nonce per message, never reused.

**The handshake never sends the code.** A broker that watches the traffic must
not be able to recover it, so the proof of knowledge is an HMAC over a nonce
the other side chooses:

```
proof = HMAC-SHA-256(key, "app.device-sync.auth|" + nonce)
```

The broker sees a nonce and a proof it cannot use.

---

## 5. The protocol

Messages are JSON objects. Everything except the challenge is wrapped in the
encrypted envelope.

| Type | Direction | Meaning |
| --- | --- | --- |
| `challenge` | receiver to dialer | nonce, proves the receiver is alive |
| `auth` | dialer to receiver | proof of the code |
| `welcome` | receiver to dialer | proof plus the device name |
| `snapshot` | both | the full state, sent once the link is up |
| `upsert` | both | one changed record |
| `remove` | both | one deleted record plus the time of the delete |
| `ping` / `pong` | both | keepalive and dead link detection |

**The handshake is symmetric.** Whoever accepted the connection sends the
challenge, whoever dialled waits for it. Do not tie the roles to "host" and
"guest", because both sides need to be able to call each other (section 6).

**The first snapshot carries the full state.** Both sides send one after the
handshake, then only deltas travel. The snapshot includes the tombstones, so a
device that was away learns about the deletions that happened while it was
gone.

---

## 6. Connection lifecycle

**Both devices can dial.** The host waits for incoming connections and also
calls the guest after it re-registers. The guest calls the host. This matters
because browsers freeze timers in a background tab, so a device that is
asleep cannot call back. A device that only waits will never wake the other
one.

```
host refreshed  → host re-registers (same id, same token) → host calls the guest → link back
guest asleep    → guest cannot call → host calls it → link back
guest refreshed → guest re-registers → guest calls the host → link back
```

**Only one channel may be active.** When both sides dial at the same moment,
two channels exist. Keep a set of connections, and when one authenticates,
close all the others and mark it as the active channel. Data always goes over
the active channel, otherwise the two sides write to different channels and
the changes seem to vanish.

**The reconnect ladder** (each step is a signal that the link is broken):

| Signal | Reaction |
| --- | --- |
| the data channel closes | mark the link dead, schedule a reconnect |
| the ICE state turns to `failed` | mark the link dead at once, the route is gone |
| the broker socket drops | re-register the peer and call the other side |
| the other device stops answering for 45 s | mark the link dead, the other side is not there any more |
| the app comes back to the front | check the link, rebuild it when it is stale |

**Guards against a reconnect storm.** The page load fires `focus`,
`pageshow` and `visibilitychange` at the same time. Every one of them may
trigger a reconnect, and a reconnect destroys the peer that is on its way.
Use one flag that is set before the teardown and cleared when the peer opens,
and ignore the wake signals while it is set. Without this the device tears
down its own connection in a loop and the link never comes back.

**The retry uses a fresh peer id.** If a call does not come through within a
few seconds, give it up, register under a different id and try again. A
stale channel that the broker still holds cannot survive a new id.

**The backoff** is short at first and then settles: `min(5 s, 0.6 s * 1.4^n)`.
Reset the counter after every successful handshake, so the next failure is
fast again.

---

## 7. The merge

Every synced record carries two stamps:

```
updatedAt  : epoch milliseconds of the write
updatedBy  : the device id of the writer
```

**Last write wins**, and the device id breaks a tie when two devices wrote in
the same millisecond. The device id has to be compared as a string, and it
has to be stable per device, so it lives in local storage.

**Deletions need a tombstone.** A delete has to survive the other device being
offline, so it is written as a record of its own:

```
tombstone = { id: "<table>:<key>", table, key, updatedAt, updatedBy }
```

The tombstone travels with the snapshot. Cap the tombstone table (a few
hundred entries, oldest first) or it grows forever.

**A delete wins over an older write, and a new write wins over an older
delete.** Compare the write time with the tombstone time:

```
write is newer than the tombstone → the write survives, the tombstone is dropped
tombstone is newer than the write   → the delete wins, the record stays gone
```

The subtle part: **a record that was just created on this device has no
stamp yet.** Treat a missing stamp as "now", otherwise the first write after
a delete is thrown away and the record never appears.

**The rule that decides a deletion: only what the app showed can be
deleted.** The app hands the sync layer its current array. The sync layer
knows which records the app showed last time. A record that is missing from
the array but was never shown is not a deletion, it is a record that just
arrived from the other device and the app has not rendered it yet. Without
this check, a save that happens in the same moment as an incoming change
deletes the incoming record and sends the deletion back.

Keep the "shown by the app" set in the sync layer and refresh it on every
save, and refresh it again when the app confirms a reload of its state.

**The write path, in order:**

1. Wait until the baseline (the state loaded from the database) is ready.
2. Diff the new array against the baseline, record by record, ignoring the
   stamps when comparing the content.
3. Stamp the changed records with the current time and the device id.
4. Write the stamped records back to the database.
5. Delete the records that disappeared, unless they were never shown.
6. Write a tombstone for every deletion and send it.
7. Send one `upsert` per changed record.

**Never clear the table on a save.** Write the records with an upsert and
delete only the records that really disappeared. A full clear followed by a
re-insert wipes a record that arrived a moment earlier.

---

## 8. Edge cases

Each of these happened in the real app. Each one is a trap.

| Edge case | What happens | The fix |
| --- | --- | --- |
| The waiting device is reloaded | The link dies and never returns | A stable token per peer id, so the device takes its id back |
| The other device sleeps with a frozen timer | It never calls back | Both sides call each other |
| The page load fires three wake events | The device tears down its own call | One in flight flag, set before the teardown |
| Both sides dial at the same time | Two channels, data goes into the void | One active channel, the other is closed |
| A call does not come through | The device waits forever | Give up after a few seconds, retry under a fresh peer id |
| The other device stops answering | The app shows a link that is dead | Keepalive, and a dead link timer |
| The route to the other device is gone | The link hangs on a dead path | Watch the ICE state, end the link when it fails |
| A record is deleted and created again | The new record is thrown away | A record without a stamp counts as brand new |
| A change arrives while the app saves | The arriving record is deleted | Only what the app showed can be deleted |
| The user deletes something, then the app reloads | The deleted record comes back | Deletions live in the database, the write path deletes them |
| The public broker limits the connections | The device cannot pair | A configurable broker, and a self hosted one |
| The page is served over plain http | The camera does not open | The scanner explains that it needs a secure address |
| The page is https and the broker is http | The browser blocks the connection | The broker needs a certificate for the deployed app |
| The broker library is ancient | The handshake breaks on a modern Node | Pin the websocket library to a version the broker supports |
| Two phones join with the same code | The second one is refused | Fall back to a random peer id |

---

## 9. The broker

A PeerJS compatible broker is the least work. Two traps:

- The bundled broker package is from 2015 and reads `socket.upgradeReq`, which
  the modern websocket library removed. Either pin the library to a version
  that still has it, or patch the event that carries the request.
- The public broker limits how many devices may pair from one address. Make
  the broker address a setting the user can change, and ship a broker that
  runs anywhere.

The broker only ever sees: peer ids, SDP, ICE candidates and the ciphertext.

---

## 10. The camera scanner

Scanning the pairing code with the phone camera is much nicer than typing it.

- The camera only opens in a secure context. On a plain http address the
  scanner must say so and point at the secure address, not fail silently.
- Draw the video frame into a canvas and run a QR decoder over the pixels.
  Do not try to decode the camera stream directly.
- The QR should carry a link with the code in it, so the camera app of the
  phone opens the app and pairs itself. That path needs no camera permission
  at all and works on every phone.
- Put the QR on a light card. A QR on a dark screen is hard to read.
- In a native wrapper the app needs the camera permission in the manifest, so
  the permission has to be declared in the web manifest and the wrapper has to
  be rebuilt.

---

## 11. Verification plan

Test with two separate browser instances, never two tabs in one browser. Two
tabs share a network stack and produce ICE results that no real device
reproduces.

```
1. pair with the code                      → linked in under a second
2. join through the QR link                → linked
3. the QR is read by the camera            → linked
4. a record created on one side            → arrives on the other
5. a record deleted on one side            → arrives on the other
6. the deletion survives a reload          → still gone
7. the waiting device is reloaded          → linked again within seconds
8. the other device is asleep              → linked again when it wakes
9. the other device stops answering        → detected, then the link rebuilds
10. the network drops and returns          → the data flows again
```

Every step needs a verdict, not a screenshot: assert the state on both sides,
and assert that the data actually moved.

---

## 12. Checklist

- [ ] The app works with no link at all
- [ ] The code is normalised on input and validated before use
- [ ] The peer id is derived, the token is stored, the token is per peer id
- [ ] The payload is encrypted on the device, the handshake proves the code
- [ ] The handshake works in both directions
- [ ] Only one channel is active, the others are closed
- [ ] A reconnect storm cannot happen
- [ ] A dead link is detected and rebuilt
- [ ] Both sides can call each other
- [ ] Writes are stamped, the merge is last write wins
- [ ] Deletions use tombstones and win over older writes
- [ ] A new write wins over an older delete
- [ ] Only what the app showed can be deleted
- [ ] A save never clears the table
- [ ] The broker address is a setting
- [ ] The camera path explains the secure address rule
- [ ] The whole matrix above is verified in a real browser
