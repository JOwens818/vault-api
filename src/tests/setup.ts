import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { verifyToken } from '@/utils/token';
import App from '../server';
import UserController from '@/resources/user/user.controller';
import SecretController from '@/resources/secret/secret.controller';

let app: App;

// 1. Load .env.test

// 2. Setup in-memory Mongo
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = new App([new UserController(), new SecretController()], 0);
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await app.close();
});

beforeEach(() => {
  (verifyToken as jest.Mock).mockReset();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// 3. Globally mock verifyToken
jest.mock('@/utils/token', () => {
  const actual = jest.requireActual('@/utils/token');
  return {
    ...actual,
    verifyToken: jest.fn()
  };
});

export { app };
