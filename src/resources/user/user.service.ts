import UserModel from '@/resources/user/user.model';
import User from '@/resources/user/user.interface';
import HttpException from '@/utils/exceptions/http.exception';
import token from '@/utils/token';

class UserService {
  private user = UserModel;

  public register = async (username: string, password: string, email: string): Promise<string | Error> => {
    let accessToken!: string;
    try {
      const newUser = await this.user.create({ username, password, email });
      accessToken = token.createToken(newUser);
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(400, `Unable to create user: ${error.message}`);
      }
    }
    return accessToken;
  };

  public login = async (username: string, password: string): Promise<string | Error> => {
    let accessToken!: string;
    try {
      const foundUser = await this.user.findOne({ username: username });
      if (!foundUser) {
        throw new Error('Username does not exist');
      }

      const isValidPassword = await foundUser.isValidPassword(password);
      if (isValidPassword) {
        accessToken = token.createToken(foundUser);
      } else {
        throw new Error('Incorrect password given');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(400, `Unable to login: ${error.message}`);
      }
    }
    return accessToken;
  };

  /**
   * @param username: string
   * @returns True if user exists in users collection; False if not
   */
  private checkIfUserExists = async (username: string): Promise<boolean> => {
    const foundUser = await this.user.findOne({ username: username });
    return foundUser ? true : false;
  };

  /**
   * @param username: string
   * @param password: string
   * @param email: string
   * @returns New User object that was created
   */
  public create = async (username: string, password: string, email: string): Promise<User> => {
    const userExists = await this.checkIfUserExists(username);
    if (userExists) {
      throw new HttpException(400, 'Username already exists');
    }
    const newUser = await this.user.create({ username, password, email });
    return newUser;
  };

  /**
   * @returns List of users in users collection
   */
  public find = async (): Promise<User[]> => {
    const users = await this.user.find();
    return users;
  };

  /**
   * @param username: string
   * @returns User object requested by username
   */
  public findByUsername = async (username: string): Promise<User> => {
    const findUser = await this.user.findOne({ username: username });
    if (!findUser) {
      throw new HttpException(400, 'Username does not exist');
    }
    return findUser;
  };

  /**
   * @param username: string
   * @returns Successful deletion notification; else HTTPException
   */
  public deleteByUsername = async (username: string): Promise<string> => {
    const userExists = await this.checkIfUserExists(username);
    if (!userExists) {
      throw new HttpException(400, 'Username does not exist');
    }
    await this.user.deleteOne({ username: username });
    return `User ${username} has been deleted`;
  };
}

export default UserService;
