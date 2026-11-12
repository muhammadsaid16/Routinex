import { sha256, utf8Bytes } from './sha256';

/**
 * Pairing codes and peer identifiers.
 *
 * A pairing code is 12 characters of a Crockford base32 alphabet (60 bits).
 * The peer id the devices register with the signalling broker is derived from
 * the code with SHA-256, so the broker learns the peer id but never the code.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 12;

export function generatePairingCode(length: number = CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/**
 * Normalizes user input: upper case, drop separators, and resolve the
 * characters that people confuse when they read a code out loud.
 */
export function normalizePairingCode(input: string): string {
  const cleaned = (input || '').toUpperCase().replace(/[^0-9A-Z]/g, '');

  // Drop the display prefix only when the full 15 character form was typed.
  // A random 12 character code that starts with R is never touched.
  const body = cleaned.length === 15 && cleaned.startsWith('RXT') ? cleaned.slice(3) : cleaned;

  let result = '';
  for (const char of body) {
    if (char === 'I' || char === 'L') result += '1';
    else if (char === 'O') result += '0';
    else if (char === 'U') result += 'V';
    else if (ALPHABET.includes(char)) result += char;
  }
  return result;
}

export function formatPairingCode(code: string): string {
  const normalized = normalizePairingCode(code);
  const groups = normalized.match(/.{1,4}/g) || [];
  return ['RXT', ...groups].join('-');
}

function base32Encode(bytes: Uint8Array, length: number): string {
  let out = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length && out.length < length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
      if (out.length >= length) break;
    }
  }

  return out;
}

/**
 * Derives the signalling peer id from the pairing code.
 * The broker can brute force this id, but not the code behind it.
 */
export async function derivePeerId(code: string): Promise<string> {
  const normalized = normalizePairingCode(code);
  const digest = sha256(utf8Bytes('routinix.device-sync.peer|' + normalized));
  return 'routinix-' + base32Encode(digest, 16).toLowerCase();
}

export function buildPairingUrl(code: string, origin: string): string {
  const normalized = normalizePairingCode(code);
  const base = origin.replace(/\/+$/, '');
  return `${base}/?pair=${normalized}`;
}
