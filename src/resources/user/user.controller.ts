import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import UserService from '@/resources/user/user.service';
import authenticated from '@/middleware/authenticated.middleware';

class UserController implements Controller {
  private UserService = new UserService();
  public path = '/users';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(`${this.path}/register`, validationMiddleware(validate.register), this.register);
    this.router.post(`${this.path}/login`, validationMiddleware(validate.login), this.login);
    this.router.get(`${this.path}/user-info`, authenticated, this.getUser);
  }

  private register = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { username, password, email } = req.body;
      const token = await this.UserService.register(username, password, email);
      res.status(201).json({ status: 'success', data: token });
    } catch (error) {
      next(error);
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { username, password } = req.body;
      const token = await this.UserService.login(username, password);
      res.status(200).json({ status: 'success', data: token });
    } catch (error) {
      next(error);
    }
  };

  private getUser = (req: Request, res: Response, _next: NextFunction): Response | void => {
    res.status(200).json({ status: 'success', data: req.user });
  };
}

export default UserController;
