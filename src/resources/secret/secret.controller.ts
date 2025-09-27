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
    this.router.post(`${this.path}`, authenticated, this.createSecret);
  }

  private createSecret = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = this.getUserId(req.user.id);
      const { data, label, notes } = req.body;
      await this.SecretService.createSecret({ userId, data, label, notes });
      res.status(201).json({ status: 'success', message: 'Secret has been saved' });
    } catch (error) {
      next(error);
    }
  };

  private getUserId = (id: string): Types.ObjectId => {
    return new Types.ObjectId(String(id));
  };
}

export default SecretController;
