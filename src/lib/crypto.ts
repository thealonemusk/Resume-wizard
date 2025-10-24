// Minimal Web Crypto-based symmetric encryption helpers for client-side storage.
// Uses PBKDF2 to derive an AES-GCM key from a passphrase.

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string) {
  const str = atob(b64);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr.buffer;
}

export async function deriveKey(password: string, salt: Uint8Array | ArrayBuffer) {
  const pwKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  // Cast salt to BufferSource to satisfy TypeScript's lib.dom types
  const saltBuf = salt as unknown as BufferSource;
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: 200_000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(plain: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return JSON.stringify({
    v: 1,
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    data: toBase64(cipher)
  });
}

export async function decryptText(encrypted: string, password: string) {
  const parsed = JSON.parse(encrypted);
  if (!parsed || !parsed.salt || !parsed.iv || !parsed.data) throw new Error('Invalid encrypted payload');
  const salt = new Uint8Array(fromBase64(parsed.salt));
  const iv = new Uint8Array(fromBase64(parsed.iv));
  const data = fromBase64(parsed.data);
  const key = await deriveKey(password, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(plainBuf);
}
