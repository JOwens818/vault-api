import express, { Application } from 'express';
import mongoose, { Error } from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import Controller from '@/utils/interfaces/controller.interface';
import ErrorMiddleware from '@/middleware/error.middleware';

class App {
  public express: Application;
  public port: number;

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
    const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_DATABASE, MONGODB_HOST, MONGODB_PORT } = process.env;
    const path = `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`;
    try {
      await mongoose.connect(`mongodb://${path}?authSource=admin`);
      console.log(`Connected to mongodb at ${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error connecting to mongodb: ${error.message}`);
      }
    }
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      console.log(`App listening on port ${this.port}`);
    });
  }
}

export default App;
