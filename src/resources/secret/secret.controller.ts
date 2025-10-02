import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import authenticated from '@/middleware/authenticated.middleware';
import SecretService from '@/resources/secret/secret.service';
import { Types } from 'mongoose';
import { ImportRow } from '@/resources/secret/secret.service';
import XLSX from 'xlsx';
import fs from 'fs';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

class SecretController implements Controller {
  private SecretService = new SecretService();
  public path = '/secrets';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(`${this.path}/import`, authenticated, upload.single('file'), this.importSecrets);
    this.router.get(`${this.path}/export`, authenticated, this.exportSecrets);
    this.router.post(this.path, authenticated, this.createSecret);
    this.router.get(`${this.path}/:id`, authenticated, this.getSecret);
    this.router.put(`${this.path}/:id`, authenticated, this.updateSecret);
    this.router.delete(`${this.path}/:id`, authenticated, this.deleteSecret);
    this.router.get(this.path, authenticated, this.getAllLabelsForUser);
  }

  private createSecret = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      const { data, label, notes } = req.body;
      await this.SecretService.createSecret({ userId, data, label, notes });
      res.status(201).json({ status: 'success', message: 'Secret has been created' });
    } catch (error) {
      next(error);
    }
  };

  private getSecret = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      const secretId = this.convertStringToObjectId(req.params.id);
      const fetchedSecret = await this.SecretService.getSecret(userId, secretId);
      res.status(200).json(fetchedSecret);
    } catch (error) {
      next(error);
    }
  };

  private getAllLabelsForUser = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      const labels = await this.SecretService.getAllLabelsForUser(userId);
      res.status(200).json(labels);
    } catch (error) {
      next(error);
    }
  };

  private updateSecret = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      const secretId = this.convertStringToObjectId(req.params.id);
      const updates = req.body;
      await this.SecretService.updateSecret(userId, secretId, updates);
      res.status(200).json({ status: 'success', message: 'Secret has been updated' });
    } catch (error) {
      next(error);
    }
  };

  private deleteSecret = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      const secretId = this.convertStringToObjectId(req.params.id);
      await this.SecretService.deleteSecret(userId, secretId);
      res.status(200).json({ status: 'success', message: 'Secret has been deleted' });
    } catch (error) {
      next(error);
    }
  };

  // Import .xlsx or .csv file with columns 'label', 'data', and 'notes'
  private importSecrets = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      if (!req.file) {
        res.status(400).json({ status: 'error', message: 'Import file not found' });
      }

      const wb = XLSX.readFile(req.file!.path);
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows: ImportRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const importedNum = await this.SecretService.importSecrets(userId, rows);
      res.status(200).json({ status: 'success', message: `${importedNum} secrets have been created` });
    } catch (error) {
      next(error);
    } finally {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupErr) {
          console.warn('Failed to remove uploaded file:', cleanupErr);
        }
      }
    }
  };

  private exportSecrets = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.convertStringToObjectId(req.user.id);
      const rows = await this.SecretService.exportSecrets(userId);
      const format = this.validateExportFormat(req.query.format as string);

      if (format === 'csv') {
        res.set({
          'Content-Disposition': `attachment; filename=secrets-${req.user.id}.csv`,
          'Content-Type': 'text/csv'
        });

        res.write('label,data,notes\n');
        for (const row of rows) {
          res.write(`"${row.label}","${row.data}","${row.notes ?? ''}"\n`);
        }

        res.end();
        return;
      } else {
        // Defautlt export format .xlsx
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Secrets');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.set({
          'Content-Disposition': `attachment; filename=secrets-${req.user.id}.xlsx`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        res.end(buffer);
        return;
      }
    } catch (error) {
      if (res.headersSent) {
        console.error('Export failed after headers sent:', error);
        return res.end(); // avoid mixing JSON into Excel
      }
      next(error);
    }
  };

  private convertStringToObjectId = (id: string): Types.ObjectId => {
    return new Types.ObjectId(String(id));
  };

  private validateExportFormat = (format: string): string => {
    if (format === 'csv') {
      return 'csv';
    } else {
      return 'xlsx';
    }
  };
}

export default SecretController;
