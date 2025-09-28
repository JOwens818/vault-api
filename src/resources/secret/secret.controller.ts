import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import authenticated from '@/middleware/authenticated.middleware';
import SecretService from '@/resources/secret/secret.service';
import { Types } from 'mongoose';

class SecretController implements Controller {
  private SecretService = new SecretService();
  public path = '/secrets';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.path, authenticated, this.createSecret);
    this.router.get(`${this.path}/:id`, authenticated, this.getSecret);
    this.router.get(this.path, authenticated, this.getAllLabelsForUser);
    this.router.put(`${this.path}/:id`, authenticated, this.updateSecret);
    this.router.delete(`${this.path}/:id`, authenticated, this.deleteSecret);
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

  private convertStringToObjectId = (id: string): Types.ObjectId => {
    return new Types.ObjectId(String(id));
  };
}

export default SecretController;
