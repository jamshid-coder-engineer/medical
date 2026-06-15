import 'dotenv/config';

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`"${key}" environment variable topilmadi!`);
  }
  return value;
}

export const env = {
  PORT: parseInt(getEnv('PORT', '3000')),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  IS_PROD: process.env.NODE_ENV === 'production',

  DATABASE_URL: getEnv('DATABASE_URL'),

  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),

  REDIS_URL: getEnv('REDIS_URL'),

  MINIO_ENDPOINT: getEnv('MINIO_ENDPOINT', 'localhost'),
  MINIO_PORT: parseInt(getEnv('MINIO_PORT', '9000')),
  MINIO_ACCESS_KEY: getEnv('MINIO_ACCESS_KEY', 'minioadmin'),
  MINIO_SECRET_KEY: getEnv('MINIO_SECRET_KEY', 'minioadmin123'),
  MINIO_BUCKET: getEnv('MINIO_BUCKET', 'medical-files'),
} as const;