import request from 'supertest';
import { createTestApp } from './utils/createTestApp';
import { setMockUser } from './utils/mockUser';
import { Types } from 'mongoose';

const app = createTestApp();

describe('User + Secret Integration', () => {
  it('should create a secret for a valid user', async () => {
    const userId = new Types.ObjectId().toString();
    await setMockUser(userId, 'user');
    const res = await request(app).post('/api/secrets').set('Authorization', 'Bearer fakeToken').send({
      data: 'secret',
      label: 'myBank',
      notes: 'some notes here'
    });

    expect(res.status).toBe(201);
  });

  it('shouuld not allow secrets without auth token', async () => {
    const res = await request(app).post('/api/secrets').send({
      data: 'nope',
      label: 'sorry'
    });

    expect(res.status).toBe(401);
  });

  it('should fetch secrets only for the authenticated user', async () => {
    const userId = new Types.ObjectId().toString();
    await setMockUser(userId, 'user');

    // create secret for user
    const createResp = await request(app).post('/api/secrets').set('Authorization', 'Bearer fakeToken').send({
      data: 'abc',
      label: 'Email',
      notes: 'my notes'
    });
    expect(createResp.status).toBe(201);

    // retrieve secret labels
    const res = await request(app).get('/api/secrets').set('Authorization', 'Bearer fakeToken');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].label).toBe('Email');
  });
});
