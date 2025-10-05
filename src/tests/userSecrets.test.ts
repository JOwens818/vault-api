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
    const userId2 = new Types.ObjectId().toString();

    // create secret for user
    await setMockUser(userId, 'user');
    const createResp = await request(app).post('/api/secrets').set('Authorization', 'Bearer fakeToken').send({
      data: 'abc',
      label: 'Email',
      notes: 'my notes'
    });
    expect(createResp.status).toBe(201);

    // create sercret for a second user
    await setMockUser(userId2, 'user2');
    const createResp2 = await request(app).post('/api/secrets').set('Authorization', 'Bearer fakeToken').send({
      data: 'zxy',
      label: 'Bank',
      notes: 'some more notes'
    });
    expect(createResp2.status).toBe(201);

    // retrieve secret labels for user 1; confirm only retrieves user 1's secrets
    await setMockUser(userId, 'user');
    const res = await request(app).get('/api/secrets').set('Authorization', 'Bearer fakeToken');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].label).toBe('Email');
  });
});
