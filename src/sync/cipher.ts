import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  hmacSha256,
  randomBytes,
  sha256,
  timingSafeEqual,
  utf8Bytes,
  utf8String,
} from './sha256';

/**
 * Application layer encryption for the device link.
 *
 * The WebRTC data channel is already protected by DTLS, but the signalling
 * broker that introduces the two devices is not trusted. A malicious broker
 * could rewrite the SDP and become a man in the middle, so every payload is
 * encrypted with a key that only the two paired devices can derive.
 *
 * Construction: SHA-256 keystream cipher (CTR style) with encrypt-then-MAC.
 *   key      = SHA-256('routinix.device-sync.v1|' + pairing code)
 *   keystream block i = SHA-256(key || nonce || i)
 *   ciphertext = plaintext XOR keystream
 *   tag = HMAC-SHA-256(key, nonce || ciphertext)[0..16]
 *   envelope = base64(nonce || tag || ciphertext)
 */

const NONCE_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_CONTEXT = 'routinix.device-sync.v1|';
const AUTH_CONTEXT = 'routinix.device-sync.auth|';

export function deriveSyncKey(code: string): Uint8Array {
  return sha256(concatBytes(utf8Bytes(KEY_CONTEXT), utf8Bytes(code)));
}

function keystream(key: Uint8Array, nonce: Uint8Array, length: number): Uint8Array {
  const out = new Uint8Array(length);
  const counter = new Uint8Array(4);
  const view = new DataView(counter.buffer);
  let offset = 0;
  let block = 0;

  while (offset < length) {
    view.setUint32(0, block);
    const material = sha256(concatBytes(key, nonce, counter));
    const take = Math.min(material.length, length - offset);
    out.set(material.subarray(0, take), offset);
    offset += take;
    block++;
  }

  return out;
}

function xor(bytes: Uint8Array, mask: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ mask[i];
  }
  return out;
}

export function encryptPayload(key: Uint8Array, payload: unknown): string {
  const nonce = randomBytes(NONCE_LENGTH);
  const plaintext = utf8Bytes(JSON.stringify(payload));
  const ciphertext = xor(plaintext, keystream(key, nonce, plaintext.length));
  const tag = hmacSha256(key, concatBytes(nonce, ciphertext)).subarray(0, TAG_LENGTH);
  return bytesToBase64(concatBytes(nonce, tag, ciphertext));
}

export function decryptPayload<T = any>(key: Uint8Array, encoded: string): T {
  const raw = base64ToBytes(encoded);
  if (raw.length < NONCE_LENGTH + TAG_LENGTH) {
    throw new Error('Malformed sync payload');
  }

  const nonce = raw.subarray(0, NONCE_LENGTH);
  const tag = raw.subarray(NONCE_LENGTH, NONCE_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(NONCE_LENGTH + TAG_LENGTH);

  const expected = hmacSha256(key, concatBytes(nonce, ciphertext)).subarray(0, TAG_LENGTH);
  if (!timingSafeEqual(expected, tag)) {
    throw new Error('Sync payload authentication failed');
  }

  const plaintext = xor(ciphertext, keystream(key, nonce, ciphertext.length));
  return JSON.parse(utf8String(plaintext)) as T;
}

/**
 * Proof of knowledge of the pairing code, used for the handshake.
 * It never exposes the code itself, so a broker cannot recover it.
 */
export function authProof(key: Uint8Array, nonce: string): string {
  return bytesToBase64(hmacSha256(key, utf8Bytes(AUTH_CONTEXT + nonce)));
}
