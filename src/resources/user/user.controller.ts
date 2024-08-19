import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import UserService from '@/resources/user/user.service';

class UserController implements Controller {
  private UserService = new UserService();
  public path = '/users';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(`${this.path}`, validationMiddleware(validate.create), this.create);
    this.router.get(`${this.path}`, this.find);
    this.router.delete(`${this.path}`, this.delete);
  }

  private create = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { username, password, email } = req.body;
      const user = await this.UserService.create(username, password, email);
      res.status(201).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  private find = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const users = await this.UserService.find();
      res.status(200).json({ status: 'success', data: users });
    } catch (error) {
      next(error);
    }
  };

  private delete = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { username } = req.body;
      const deletedUser = await this.UserService.delete(username);
      res.status(200).json({ status: 'success', message: deletedUser });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
