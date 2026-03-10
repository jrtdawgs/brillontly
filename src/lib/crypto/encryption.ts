// AES-256-GCM Encryption Library
// All sensitive financial data is encrypted before storage
// Encryption key comes from BRILLONTLY_ENCRYPTION_KEY environment variable

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
  const key = process.env.BRILLONTLY_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'BRILLONTLY_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error(
      'BRILLONTLY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return keyBuffer;
}

// Encrypt a string with AES-256-GCM
// Returns base64(iv + authTag + ciphertext)
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Concatenate: IV (12 bytes) + Auth Tag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

// Decrypt a base64(iv + authTag + ciphertext) string
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// Encrypt a JavaScript object (serialized as JSON)
export function encryptObject(data: unknown): string {
  return encrypt(JSON.stringify(data));
}

// Decrypt back to a JavaScript object
export function decryptObject<T>(encryptedBase64: string): T {
  const json = decrypt(encryptedBase64);
  return JSON.parse(json) as T;
}

// Generate a new encryption key (utility for setup)
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
