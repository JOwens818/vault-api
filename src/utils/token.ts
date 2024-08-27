import jwt from 'jsonwebtoken';
import User from '@/resources/user/user.interface';
import Token from '@/utils/interfaces/token.interface';

const jwtExpireTime = 30 * 60 * 1000;

export const createToken = (user: User): string => {
  const privateKey = process.env.JWT_PRIVATE!.replace(/\\n/gm, '\n') as jwt.Secret;
  const payload = { un: user.username };
  return jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    expiresIn: jwtExpireTime
  });
};

export const verifyToken = async (token: string): Promise<jwt.VerifyErrors | Token> => {
  return new Promise((resolve, reject) => {
    const publicKey = process.env.JWT_PUBLIC!.replace(/\\n/gm, '\n') as jwt.Secret;
    jwt.verify(token, publicKey, (err, payload) => {
      if (err) return reject(err);
      resolve(payload as Token);
    });
  });
};

export default { createToken, verifyToken };
