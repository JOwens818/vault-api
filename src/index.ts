import 'dotenv/config';
import 'module-alias/register';
import validateEnv from '@/utils/validateEnv';
import App from './server';
import UserController from '@/resources/user/user.controller';
import SecretController from '@/resources/secret/secret.controller';

validateEnv();
const app = new App([new UserController(), new SecretController()], Number(process.env.PORT));
app.listen();
