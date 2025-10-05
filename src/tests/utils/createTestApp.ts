import App from '../../server';
import UserController from '@/resources/user/user.controller';
import SecretController from '@/resources/secret/secret.controller';

export function createTestApp() {
  const appInstance = new App([new UserController(), new SecretController()], 0);
  return appInstance.express;
}
