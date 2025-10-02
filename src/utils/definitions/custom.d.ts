import Token from '@/utils/interfaces/token.interface';

declare global {
  namespace Express {
    export interface Request {
      user: Token;
    }
  }
}
