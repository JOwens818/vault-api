import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import { verifyToken } from '@/utils/token';

// 1. Load .env.test
dotenv.config({ path: '.env.test' });

// 2. Setup in-memory Mongo
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
