require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 3000),
  mongoUri: required('MONGO_URI'),
  mongoDb: process.env.MONGO_DB || 'uel_space',
  sessionSecret: required('SESSION_SECRET'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  adminEmails: (process.env.ADMIN_EMAILS || 'admin@uel.edu.vn,quantri@uel.edu.vn,system@uel.edu.vn')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  enableJobs: process.env.ENABLE_JOBS !== 'false',
  noShowIntervalMs: Number(process.env.NO_SHOW_INTERVAL_MS || 5 * 60 * 1000),
  occupancySnapshotIntervalMs: Number(process.env.OCCUPANCY_SNAPSHOT_INTERVAL_MS || 15 * 60 * 1000),
  geminiApiKey: process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LtjyFvXMcPH1wjFsFSlpE4bM3TvGLYZNQYvaGCActkcw',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
};

module.exports = { env };
