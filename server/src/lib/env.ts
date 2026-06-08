import 'dotenv/config';

function get(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  port: Number(get('PORT', '4000')),
  nodeEnv: get('NODE_ENV', 'development'),
  isProd: get('NODE_ENV', 'development') === 'production',
  clientUrl: get('CLIENT_URL', 'http://localhost:5173'),
  serverUrl: get('SERVER_URL', 'http://localhost:4000'),
  jwtSecret: get('JWT_SECRET', 'dev-insecure-secret-change-me'),
  jwtExpiresIn: get('JWT_EXPIRES_IN', '7d'),
  cookieName: get('COOKIE_NAME', 'fitness_token'),
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: get('EMAIL_FROM', 'PulseFit <noreply@pulsefit.test>'),
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
  cronSecret: process.env.CRON_SECRET || '',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
  },
};

export const socialEnabled = {
  google: !!(env.google.clientId && env.google.clientSecret),
  facebook: !!(env.facebook.clientId && env.facebook.clientSecret),
  instagram: !!(env.instagram.clientId && env.instagram.clientSecret),
};
