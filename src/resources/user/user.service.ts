import UserModel from '@/resources/user/user.model';
import User from '@/resources/user/user.interface';

class UserService {
  private user = UserModel;

  /**
   * Create new user
   */
  public async create(username: string, password: string, email: string): Promise<User> {
    try {
      const newUser = await this.user.create({ username, password, email });
      return newUser;
    } catch (error: any) {
      throw new Error(`Unable to create new user: ${error.message}`);
    }
  }
}

export default UserService;
