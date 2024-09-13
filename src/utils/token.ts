import jwt from 'jsonwebtoken';
import User from '@/resources/user/user.interface';
import Token from '@/utils/interfaces/token.interface';
import HttpException from './exceptions/http.exception';

const jwtExpireTime = 30 * 60;

export const createToken = (user: User): string => {
  const privateKey = process.env.JWT_PRIVATE!.replace(/\\n/gm, '\n') as jwt.Secret;
  const payload = { un: user.username };
  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    expiresIn: jwtExpireTime
  });
};

export const verifyToken = async (token: string): Promise<Token> => {
  return new Promise((resolve, reject) => {
    const publicKey = process.env.JWT_PUBLIC!.replace(/\\n/gm, '\n') as jwt.Secret;
    jwt.verify(token, publicKey, (err, payload) => {
      if (err) return reject(new HttpException(401, err.message));
      resolve(payload as Token);
    });
  });
};

export default { createToken, verifyToken };
