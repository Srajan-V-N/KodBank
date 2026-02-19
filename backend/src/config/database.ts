import mysql from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
});

export async function initDb(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`kod_users\` (
        \`id\`        VARCHAR(36)    NOT NULL,
        \`uid\`       VARCHAR(50)    NOT NULL,
        \`username\`  VARCHAR(50)    NOT NULL,
        \`email\`     VARCHAR(255)   NOT NULL,
        \`password\`  VARCHAR(255)   NOT NULL,
        \`phone\`     VARCHAR(20)    NOT NULL,
        \`role\`      VARCHAR(20)    NOT NULL DEFAULT 'Customer',
        \`balance\`   DECIMAL(15,2)  NOT NULL DEFAULT 100000.00,
        \`createdAt\` DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3)    NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`kod_users_uid_key\` (\`uid\`),
        UNIQUE KEY \`kod_users_username_key\` (\`username\`),
        UNIQUE KEY \`kod_users_email_key\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`user_tokens\` (
        \`id\`        VARCHAR(36) NOT NULL,
        \`userId\`    VARCHAR(36) NOT NULL,
        \`token\`     TEXT        NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`expiresAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`user_tokens_userId_fkey\`
          FOREIGN KEY (\`userId\`) REFERENCES \`kod_users\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables ready');
  } finally {
    conn.release();
  }
}
