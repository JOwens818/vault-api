import 'dotenv/config';
import 'module-alias/register';
import mongoose from 'mongoose';
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
    if (mongoose.connection.readyState !== 0) {
      console.log('Closing MongoDB connection...');
      await mongoose.disconnect();
      console.log('MongoDB disconnected cleanly.');
    } else {
      console.log('No active MongoDB connection — skipping disconnect.');
    }
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
  } finally {
    console.log('Shutting down server process...');
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
