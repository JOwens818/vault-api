import { Request, Response, NextFunction } from 'express';
import HttpException from '@/utils/exceptions/http.exception';

const errorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const message = error.message || 'Unknown error occurred';
  const statusCode = error instanceof HttpException ? error.status : 500;

  res.status(statusCode).send({
    status: 'error',
    message: message
  });
};

export default errorMiddleware;
