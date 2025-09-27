import { Request, Response } from 'express';
import { pool } from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {appId, authDuration, httpRequestDuration} from "../metrics";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
if (!JWT_SECRET) throw new Error('JWT_SECRET not set');

export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });


  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await client.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, hash]
    );
    const user = result.rows[0];
    res.status(201).json({ user });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already in use' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'internal error' });
    }
  } finally {
    await client.release();
  }
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'email and password required' });

  try {
/*    console.log("Auth db request", {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });*/
    const start = process.hrtime.bigint()
    const result = await pool.query(`SELECT id, password_hash FROM users WHERE email = $1`, [username]);
    const end = process.hrtime.bigint()
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const start2 = process.hrtime.bigint()
    const match = await bcrypt.compare(password, user.password_hash);
    const end2 = process.hrtime.bigint()
    if (!match) return res.status(401).json({ error: 'invalid credentials' });
//    console.log("Query time", Number(end-start)/1e9, "Bcrypt Time", Number(end2-start2)/1e9)

    authDuration.observe(
      {
        app: appId,
      },
      Number(end2-start2)/1e9
    );
    const token = jwt.sign({ userId: user.id }, JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error("Auth Error", err);
    res.status(500).json({ error: 'internal error' });
  }

}

