import { Request, Response } from 'express';
import HttpException from '@/utils/exceptions/http.exception';

const errorMiddleware = (error: HttpException, req: Request, res: Response): void => {
  const status = error.status || 500;
  const message = error.message || 'Unknown error occurred';

  res.status(status).send({
    status: 'error',
    message: message
  });
};

export default errorMiddleware;
