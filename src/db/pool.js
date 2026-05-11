import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set — Postgres queries will fail.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

export function query(text, params) {
  return pool.query(text, params);
}
