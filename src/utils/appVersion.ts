// src/utils/appVersion.ts
import fs from 'fs';
import path from 'path';

let appVersion = 'unknown';

try {
  // ✅ Go up from `dist/src/utils` → root of project
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  appVersion = pkg.version;
} catch (err) {
  console.warn('Unable to read package.json for version:', err);
}

export const getAppVersion = (): string => appVersion;
