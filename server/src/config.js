import 'dotenv/config';

const required = (name) => {
  const v = process.env[name];
  if (!v || !v.trim()) {
    console.error(`Missing ${name}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
  return v.trim();
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  /** Comma-separated list of origins allowed to call the API from another domain. `*` = any origin. Empty = same origin only. */
  clientOrigins: (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  admin: {
    email: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
    name: (process.env.ADMIN_NAME || 'Admin').trim(),
  },
  isProd: process.env.NODE_ENV === 'production',
};
