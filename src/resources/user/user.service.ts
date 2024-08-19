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
  public create = async (username: string, password: string, email: string): Promise<User> => {
    const userExists = await this.checkIfUserExists(username);
    if (userExists) {
      throw new HttpException(400, 'Username already exists');
    }
    const newUser = await this.user.create({ username, password, email });
    return newUser;
  };

  /**
   * Get all users
   */
  public find = async (): Promise<User[]> => {
    const users = await this.user.find();
    return users;
  };

  public delete = async (username: string): Promise<string> => {
    const deletedUser = await this.user.findOne({ username });
    if (deletedUser == null || deletedUser == undefined) {
      throw new HttpException(400, 'Username does not exist');
    }
    this.user.findByIdAndDelete(deletedUser.id);
    return 'User has been deleted';
  };
}

export default UserService;
