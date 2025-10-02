import Token from '../interfaces/token.interface';

declare global {
  namespace Express {
    export interface Request {
      user: Token;
    }
  }
}
