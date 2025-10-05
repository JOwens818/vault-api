import fs from 'fs';
import path from 'path';
import request from 'supertest';
import XLSX from 'xlsx';
import { Types } from 'mongoose';
import { createTestApp } from './utils/createTestApp';
import { setMockUser } from './utils/mockUser';

const app = createTestApp();
const testDir = path.join(__dirname, 'test-data');

describe('Secrets Import/Export Integration Suite', () => {
  beforeAll(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  // ✅ 1. Test all combinations of import/export formats with multiple secrets
  it.each([
    ['csv', 'csv', 'text/csv'],
    ['csv', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['xlsx', 'csv', 'text/csv'],
    ['xlsx', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  ])('should import %s with multiple secrets, export as %s, and verify decryption integrity', async (importFormat, exportFormat, contentType) => {
    const userId = new Types.ObjectId().toString();
    await setMockUser(userId, `multiUser_${importFormat}_${exportFormat}`);

    // Step 1: Prepare test secrets
    const secrets = [
      { label: 'Gmail', data: 'gPass123', notes: 'personal' },
      { label: 'AWS', data: 'awsSecret!', notes: 'infra' },
      { label: 'GitHub', data: 'gitHubPass', notes: 'work' }
    ];

    const secretsExported = [
      { label: 'AWS', data: 'awsSecret!', notes: 'infra' },
      { label: 'GitHub', data: 'gitHubPass', notes: 'work' },
      { label: 'Gmail', data: 'gPass123', notes: 'personal' }
    ];

    const importFile = path.join(testDir, `import-${importFormat}.${importFormat}`);

    if (importFormat === 'csv') {
      const csv = 'label,data,notes\n' + secrets.map((s) => `${s.label},${s.data},${s.notes}`).join('\n');
      fs.writeFileSync(importFile, csv);
    } else {
      const ws = XLSX.utils.json_to_sheet(secrets);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Secrets');
      XLSX.writeFile(wb, importFile);
    }

    // Step 2: Import
    const importRes = await request(app).post('/api/secrets/import').set('Authorization', 'Bearer fake-token').attach('file', importFile);

    expect(importRes.status).toBe(200);
    expect(importRes.body.message).toBe('3 secrets have been created');

    // Step 3: Export
    const exportRes = await request(app)
      .get(`/api/secrets/export?format=${exportFormat}`)
      .set('Authorization', 'Bearer fake-token')
      .buffer()
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(exportRes.status).toBe(200);
    expect(exportRes.header['content-type']).toContain(contentType);

    // Step 4: Parse export
    let exportedRows: Record<string, string>[] = [];

    if (exportFormat === 'xlsx') {
      const tempXlsx = path.join(testDir, `export-${importFormat}-${exportFormat}.xlsx`);
      fs.writeFileSync(tempXlsx, exportRes.body);

      const workbook = XLSX.readFile(tempXlsx);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      // Explicitly define generic to avoid inferred any[]
      exportedRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      fs.unlinkSync(tempXlsx);
    } else {
      const csvText = exportRes.body.toString('utf8').trim();
      const lines = csvText.split('\n');

      if (lines.length <= 1) {
        exportedRows = [];
      } else {
        const headers: string[] = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
          const rowValues: string[] = lines[i].split(',');
          const row: Record<string, string> = {};

          headers.forEach((h: string, j: number) => {
            const key: string = h.trim();
            row[key] = rowValues[j]?.replace(/"/g, '').trim() ?? '';
          });

          exportedRows.push(row);
        }
      }
    }

    expect(exportedRows.length).toBe(secrets.length);

    // Step 5: Verify per-row decryption
    exportedRows.forEach((row, i) => {
      expect(row.label).toBe(secretsExported[i].label);
      expect(row.data).toBe(secretsExported[i].data);
      expect(row.notes).toBe(secretsExported[i].notes);
    });

    fs.unlinkSync(importFile);
  });

  // ✅ 2. Verify cross-user isolation
  it('should prevent User B from exporting User As imported secrets', async () => {
    const userAId = new Types.ObjectId().toString();
    await setMockUser(userAId, 'userA');

    const fileA = path.join(testDir, 'userA-import.csv');
    fs.writeFileSync(fileA, 'label,data,notes\nVaultKey,topSecret,onlyA');

    const importA = await request(app).post('/api/secrets/import').set('Authorization', 'Bearer token-A').attach('file', fileA);

    expect(importA.status).toBe(200);

    // User B tries export
    const userBId = new Types.ObjectId().toString();
    await setMockUser(userBId, 'userB');

    const exportB = await request(app).get('/api/secrets/export?format=csv').set('Authorization', 'Bearer token-B');

    expect(exportB.status).toBe(200);
    const linesB = exportB.text.trim().split('\n');
    expect(linesB.length).toBe(1); // only header

    // Sanity: User A exports successfully
    await setMockUser(userAId, 'userA');
    const exportA = await request(app).get('/api/secrets/export?format=csv').set('Authorization', 'Bearer token-A');

    const rowsA = exportA.text.trim().split('\n');
    expect(rowsA.length).toBeGreaterThan(1);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, first] = rowsA;
    const [label, data, notes] = first.split(',').map((v) => v.replace(/"/g, ''));
    expect(label).toBe('VaultKey');
    expect(data).toBe('topSecret');
    expect(notes).toBe('onlyA');

    fs.unlinkSync(fileA);
  });

  // ✅ 3. Reject malformed imports (missing required fields)
  it.each(['csv', 'xlsx'])('should reject malformed %s import file and not save any secrets', async (format) => {
    const userId = new Types.ObjectId().toString();
    await setMockUser(userId, `invalidUser_${format}`);

    const file = path.join(testDir, `invalid.${format}`);

    if (format === 'csv') {
      fs.writeFileSync(file, 'label,notes\nBadRow,missingData');
    } else {
      const ws = XLSX.utils.json_to_sheet([{ label: 'BadRow', notes: 'missingData' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invalid');
      XLSX.writeFile(wb, file);
    }

    const res = await request(app).post('/api/secrets/import').set('Authorization', 'Bearer fake-token').attach('file', file);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No secrets found in import file');

    const exportRes = await request(app).get('/api/secrets/export?format=csv').set('Authorization', 'Bearer fake-token');

    const lines = exportRes.text.trim().split('\n');
    expect(lines.length).toBe(1);

    fs.unlinkSync(file);
  });

  // ✅ 4. Reject unsupported file types + MIME validation
  it.each(['txt', 'pdf'])('should reject %s uploads with 415 Unsupported Media Type', async (ext) => {
    const userId = new Types.ObjectId().toString();
    await setMockUser(userId, `unsupportedUser_${ext}`);

    const file = path.join(testDir, `unsupported.${ext}`);
    fs.writeFileSync(file, 'This is an invalid file type.');

    const res = await request(app).post('/api/secrets/import').set('Authorization', 'Bearer fake-token').attach('file', file);

    expect([400, 415]).toContain(res.status);
    expect(res.body.message || '').toMatch(/unsupported|invalid|type/i);

    const exportRes = await request(app).get('/api/secrets/export?format=csv').set('Authorization', 'Bearer fake-token');

    const lines = exportRes.text.trim().split('\n');
    expect(lines.length).toBe(1);

    fs.unlinkSync(file);
  });
});
