import 'dotenv/config';
import 'module-alias/register';
import validateEnv from '@/utils/validateEnv';
import App from './server';
import UserController from '@/resources/user/user.controller';

validateEnv();
const app = new App([new UserController()], Number(process.env.PORT));
app.listen();
