import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET!, 'static-salt', 32);

const generateHash = (plainText: string): string => {
  return crypto.createHash('sha256').update(plainText).digest('hex');
};

// Helpers for url-safe base64 (optional)
const b64e = (b: Buffer) => b.toString('base64url');
const b64d = (s: string) => Buffer.from(s, 'base64url');

/** Encrypt UTF-8 plaintext to a compact string "iv.cipher.tag" (base64url). */
export function encryptPlainText(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return iv.cipher.tag as base64url segments
  return `${b64e(iv)}.${b64e(ciphertext)}.${b64e(tag)}`;
}

/** Decrypt string produced by encryptPlainText. Throws if auth fails. */
export function decryptToPlainText(encryptedText: string): string {
  const parts = encryptedText.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid payload format');
  }
  const iv = b64d(parts[0]);
  const ciphertext = b64d(parts[1]);
  const tag = b64d(parts[2]);

  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

export default { generateHash, encryptPlainText, decryptToPlainText };
