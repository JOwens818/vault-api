import express, { Application } from 'express';
import mongoose, { Error } from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import Controller from '@/utils/interfaces/controller.interface';
import ErrorMiddleware from '@/middleware/error.middleware';
import { setMongoStatus } from '@/utils/dbStatus';
import { Server } from 'http';
import { getAppVersion } from '@/utils/appVersion';

class App {
  public express: Application;
  public port: number;
  private reconnectDelay = 60000;
  private reconnectTimer?: NodeJS.Timeout;
  private mongoUri = '';
  private server?: Server;
  private closing = false;

  constructor(controllers: Controller[], port: number) {
    this.express = express();
    this.port = port;

    this.initializeDatabaseConnection();
    this.initializeMiddleware();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.express.use(helmet());
    this.express.use(cors());
    this.express.use(morgan('dev'));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(compression());
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.express.use('/api', controller.router);
    });
  }

  private initializeErrorHandling(): void {
    this.express.use(ErrorMiddleware);
  }

  private async initializeDatabaseConnection(): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;
    const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_DATABASE, MONGODB_HOST, MONGODB_PORT } = process.env;
    const path = `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
    this.mongoUri = `mongodb://${path}?authSource=admin`;
    this.registerMongooseEvents();
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    if (this.closing || process.env.NODE_ENV === 'test') return;
    try {
      await mongoose.connect(this.mongoUri);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error connecting to mongodb: ${error.message}`);
        console.log(`Retrying in ${this.reconnectDelay / 1000}s...`);
      }
      this.reconnectTimer = setTimeout(() => this.connectWithRetry(), this.reconnectDelay);
    }
  }

  private registerMongooseEvents(): void {
    const conn = mongoose.connection;
    const { MONGODB_DATABASE, MONGODB_HOST, MONGODB_PORT } = process.env;

    conn.on('connected', () => {
      setMongoStatus('connected');
      console.log(`Connected to mongodb at ${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`);
    });

    conn.on('disconnected', () => {
      setMongoStatus('disconnected');
      console.warn('MongoDB disconnected');
      if (!this.closing && process.env.NODE_ENV !== 'test') {
        this.reconnectTimer = setTimeout(() => this.connectWithRetry(), this.reconnectDelay);
      }
    });

    conn.on('reconnected', () => {
      setMongoStatus('reconnected');
      console.log(`MongoDB reconnected at ${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`);
    });

    conn.on('error', (err) => {
      setMongoStatus('error');
      console.error('MongoDB connection error:', err);
    });
  }

  public listen(): void {
    this.server = this.express.listen(this.port, () => {
      console.log(`Vault-API: Version ${getAppVersion()}`);
      console.log(`App listening on port ${this.port}`);
    });
  }

  public async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;
    console.log('Closing App resources...');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server?.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('HTTP server closed');
    }

    // Disconnect MongoDB
    if (mongoose.connection.readyState !== 0) {
      console.log('Closing MongoDB connection...');
      await mongoose.disconnect();
      console.log('MongoDB disconnected cleanly.');
    } else {
      console.log('No active MongoDB connection — skipping disconnect.');
    }
  }
}

export default App;
