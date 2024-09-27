import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

const validationMiddleware = (schema: Joi.Schema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true
    };

    try {
      const value = await schema.validateAsync(req.body, validationOptions);
      req.body = value;
      next();
    } catch (e) {
      let errors: string = '';
      if (e instanceof Joi.ValidationError) {
        e.details.forEach((error: Joi.ValidationErrorItem) => {
          errors = errors + error.message + '|';
        });
        errors = errors.slice(0, -1);
      }
      res.status(400).send({ status: 'error', message: errors });
    }
  };
};

export default validationMiddleware;
