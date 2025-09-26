import { Request, Response } from 'express';
import { pool } from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
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

  const client = await pool.connect();
  try {
    const result = await client.query(`SELECT id, password_hash FROM users WHERE email = $1`, [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET!, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  } finally {
    client.release();
  }

}

