import { verifyToken } from '@/utils/token';
import UserModel from '@/resources/user/user.model';

/**
 * Mocks a user AND ensures they exist in the DB
 */
export const setMockUser = async (id: string, username = 'testuser') => {
  // ensure verifyToken always returns this user
  (verifyToken as jest.Mock).mockReturnValue({
    id,
    un: username,
    expiresIn: 3600
  });

  // ensure user exists in DB
  const existing = await UserModel.findById(id).exec();
  if (!existing) {
    await UserModel.create({
      _id: id,
      username,
      password: 'hash-pass', // dummy value
      email: `${username}@gmail.com`
    });
  }
};
