import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

interface KodUserRow {
  id: string;
  uid: string;
  username: string;
  email: string;
  password: string;
  role: string;
  isFirstLogin: number;
}

export async function registerUser(input: RegisterInput) {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT uid, username, email FROM kod_users WHERE email=? OR username=? OR uid=? LIMIT 1',
    [input.email, input.username, input.uid],
  );

  const existing = rows[0] as Pick<KodUserRow, 'uid' | 'username' | 'email'> | undefined;

  if (existing) {
    if (existing.email === input.email) throw new AppError('Email already registered', 409);
    if (existing.username === input.username) throw new AppError('Username already taken', 409);
    if (existing.uid === input.uid) throw new AppError('UID already taken', 409);
  }

  const hashedPassword = await hashPassword(input.password);
  const id = uuidv4();

  await pool.execute(
    'INSERT INTO kod_users (id,uid,username,email,password,phone,role,balance,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())',
    [id, input.uid, input.username, input.email, hashedPassword, input.phone, 'Customer', 100000.00],
  );

  return { id, uid: input.uid, username: input.username, email: input.email, role: 'Customer' };
}

export async function loginUser(input: LoginInput) {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id,uid,username,email,password,role,isFirstLogin FROM kod_users WHERE email=? LIMIT 1',
    [input.email],
  );

  const user = rows[0] as KodUserRow | undefined;
  if (!user) throw new AppError('Invalid email or password', 401);

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) throw new AppError('Invalid email or password', 401);

  if (user.isFirstLogin === 1) {
    await pool.execute('UPDATE kod_users SET isFirstLogin=0, updatedAt=NOW() WHERE id=?', [user.id]);
  }

  const token = signToken({
    uid: user.uid,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const tokenId = uuidv4();

  await pool.execute(
    'INSERT INTO user_tokens (id,userId,token,createdAt,expiresAt) VALUES (?,?,?,NOW(),?)',
    [tokenId, user.id, token, expiresAt],
  );

  return {
    token,
    user: {
      uid: user.uid, username: user.username,
      email: user.email, role: user.role,
      isFirstLogin: user.isFirstLogin === 1,
    },
  };
}

export async function logoutUser(token: string, userId: string) {
  await pool.execute('DELETE FROM user_tokens WHERE token=? AND userId=?', [token, userId]);
}
