import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();


const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set in env');

export const pool = new Pool({
  connectionString,
});

