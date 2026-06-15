import Redis from 'ioredis';
import { env } from '../../config/env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => (times > 3 ? null : 500),
  lazyConnect: true,
});

redis.on('connect', () => console.log('✅ Redis ga ulandi'));
redis.on('error', (err) => {
  if (!err.message.includes('NOAUTH')) {
    console.error('Redis xatosi:', err.message);
  }
});
