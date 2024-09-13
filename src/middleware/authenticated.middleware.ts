import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/token';
import UserModel from '@/resources/user/user.model';
import HttpException from '@/utils/exceptions/http.exception';

const authenticated = async (req: Request, _res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const bearer = req.headers.authorization;
    if (!bearer || !bearer.startsWith('Bearer ')) {
      throw new HttpException(401, 'Bearer token not provided or in an incorrect format');
    }

    const accessToken = bearer.split('Bearer ')[1].trim();
    const payload = await verifyToken(accessToken);
    const user = await UserModel.findOne({ username: payload.un }).select('-password').exec();
    if (!user) {
      throw new HttpException(401, 'Username does not exist');
    }

    req.user = user;
    return next();
  } catch (error) {
    next(error);
  }
};

export default authenticated;
