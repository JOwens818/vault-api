import UserModel from '@/resources/user/user.model';
import HttpException from '@/utils/exceptions/http.exception';
import token from '@/utils/token';
import { UserResponseData } from '@/utils/interfaces/api-response.interface';
import User from './user.interface';

class UserService {
  private user = UserModel;

  public register = async (username: string, password: string, email: string): Promise<UserResponseData | Error | void> => {
    let accessToken!: string;
    try {
      const newUser = await this.user.create({ username, password, email });
      accessToken = token.createToken(newUser);
      return this.createUserRespData(accessToken, newUser);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          throw new HttpException(400, 'Username already exists');
        } else {
          throw new HttpException(400, error.message);
        }
      }
    }
  };

  public login = async (username: string, password: string): Promise<UserResponseData | Error | void> => {
    try {
      let accessToken!: string;
      const foundUser = await this.user.findOne({ username: username });
      if (!foundUser) {
        throw new Error('Invalid username or password');
      }

      const isValidPassword = await foundUser.isValidPassword(password);
      if (isValidPassword) {
        accessToken = token.createToken(foundUser);
      } else {
        throw new Error('Invalid username or password');
      }
      return this.createUserRespData(accessToken, foundUser);
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(400, error.message);
      }
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
