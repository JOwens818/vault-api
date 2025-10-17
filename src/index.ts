import 'dotenv/config';
import 'module-alias/register';
import validateEnv from '@/utils/validateEnv';
import App from './server';
import UserController from '@/resources/user/user.controller';
import SecretController from '@/resources/secret/secret.controller';
import StatusController from '@/resources/status/status.controller';

validateEnv();
const app = new App([new UserController(), new SecretController(), new StatusController()], Number(process.env.PORT));
app.listen();

let shuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  try {
    await app.close();
  } catch (err) {
    console.error('Error during shutdown:', err);
  } finally {
    console.log('Process exiting...');
    process.exit(0);
  }
};

if (process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
