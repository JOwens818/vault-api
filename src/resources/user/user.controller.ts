import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import UserService from '@/resources/user/user.service';
import authenticated from '@/middleware/authenticated.middleware';
import { UserResponse, UserResponseData } from '@/utils/interfaces/api-response.interface';

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
      const userRespData = await this.UserService.register(username, password, email);
      this.generateUserResponse(res, 201, userRespData);
    } catch (error) {
      next(error);
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { username, password } = req.body;
      const userRespData = await this.UserService.login(username, password);
      this.generateUserResponse(res, 200, userRespData);
    } catch (error) {
      next(error);
    }
  };

  private getUser = (req: Request, res: Response, _next: NextFunction): Response | void => {
    const userRespData: UserResponseData = { username: req.user.username, id: req.user.id, email: req.user.email };
    this.generateUserResponse(res, 200, userRespData);
  };

  private generateUserResponse = (res: Response, statusCode: number, data: UserResponseData): void => {
    const userResponse: UserResponse = {
      status: 'success',
      data: data
    };
    res.status(statusCode).json(userResponse);
  };
}

export default UserController;
