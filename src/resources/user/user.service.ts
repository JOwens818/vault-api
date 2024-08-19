import UserModel from '@/resources/user/user.model';
import User from '@/resources/user/user.interface';
import HttpException from '@/utils/exceptions/http.exception';

class UserService {
  private user = UserModel;

  /**
   * Check if user is already in the collection by username
   */
  private checkIfUserExists = async (username: string): Promise<boolean> => {
    const foundUser = await this.user.findOne({ username });
    return foundUser ? true : false;
  };

  /**
   * Create new user
   */
  public async create(username: string, password: string, email: string): Promise<User> {
    const userExists = await this.checkIfUserExists(username);
    if (userExists) {
      throw new HttpException(400, 'Username already exists');
    }
    const newUser = await this.user.create({ username, password, email });
    return newUser;
  }
}

export default UserService;
