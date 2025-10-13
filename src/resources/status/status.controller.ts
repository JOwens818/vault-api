import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import { getMongoStatus } from '@/utils/dbStatus';

class StatusController implements Controller {
  public path = '/status';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, this.getStatus);
  }

  private getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const response = {
        version: '1.0',
        dbConnection: getMongoStatus()
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

export default StatusController;
