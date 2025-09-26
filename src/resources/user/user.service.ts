import UserModel from '@/resources/user/user.model';
import HttpException from '@/utils/exceptions/http.exception';
import token from '@/utils/token';
import { UserResponseData } from '@/utils/interfaces/api-response.interface';
import User from './user.interface';

class UserService {
  private user = UserModel;

  public register = async (username: string, password: string, email: string): Promise<UserResponseData> => {
    try {
      const newUser = await this.user.create({ username, password, email });
      const accessToken = token.createToken(newUser);
      return this.createUserRespData(accessToken, newUser);
    } catch (err) {
      const error = err as unknown;
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new HttpException(400, 'Username already exists');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(400, message);
    }
  };

  public login = async (username: string, password: string): Promise<UserResponseData> => {
    try {
      const foundUser = await this.user.findOne({ username: username });
      if (!foundUser) {
        throw new Error('Invalid username or password');
      }

      const isValidPassword = await foundUser.isValidPassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      const accessToken = token.createToken(foundUser);
      return this.createUserRespData(accessToken, foundUser);
    } catch (err) {
      const error = err as unknown;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(400, message);
    }
  };

  private createUserRespData = (token: string, user: User): UserResponseData => {
    const userRespData = {
      token: token,
      username: user.username,
      email: user.email
    };
    return userRespData;
  };
}

export default UserService;
