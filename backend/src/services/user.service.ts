import mysql from 'mysql2/promise';
import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function getBalance(userId: string): Promise<number> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT balance FROM kod_users WHERE id=? LIMIT 1',
    [userId],
  );

  const user = rows[0] as { balance: string } | undefined;
  if (!user) throw new AppError('User not found', 404);

  return parseFloat(user.balance);
}
