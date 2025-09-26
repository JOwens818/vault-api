import crypto from 'crypto';
const algorithm = 'aes-256-cbc';

const generateHash = (plainText: string): string => {
  return crypto.createHash('sha256').update(plainText).digest('hex');
};

const generateIv = (): string => {
  return crypto.randomBytes(16).toString('base64').slice(0, 16);
};

const encryptPlainText = (plainText: string): string => {
  const key = generateHash(process.env.ENCRYPTION_KEY!);
  const iv = generateIv();
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex');
  return Buffer.from(encrypted).toString('base64') + iv;
};

const decrypt = (encryptedText: string): string => {
  const key = generateHash(process.env.ENCRYPTION_KEY!);
  const iv = encryptedText.slice(-16);
  const encryptedSecret = encryptedText.slice(0, -16);
  const buff = Buffer.from(encryptedSecret, 'base64');
  const encryptedSecretUtf = buff.toString('utf-8');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return decipher.update(encryptedSecretUtf, 'hex', 'utf8') + decipher.final('utf8');
};

export default { generateHash, encryptPlainText, decrypt };
