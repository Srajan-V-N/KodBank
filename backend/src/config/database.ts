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

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`ai_conversations\` (
        \`id\`        VARCHAR(36)  NOT NULL,
        \`userId\`    VARCHAR(36)  NOT NULL,
        \`title\`     VARCHAR(255) NOT NULL DEFAULT 'New Chat',
        \`createdAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`ai_conversations_userId_idx\` (\`userId\`),
        CONSTRAINT \`ai_conversations_userId_fkey\`
          FOREIGN KEY (\`userId\`) REFERENCES \`kod_users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`ai_projects\` (
        \`id\`        VARCHAR(36)  NOT NULL,
        \`userId\`    VARCHAR(36)  NOT NULL,
        \`name\`      VARCHAR(100) NOT NULL,
        \`icon\`      VARCHAR(50)  NOT NULL DEFAULT 'Folder',
        \`color\`     VARCHAR(20)  NOT NULL DEFAULT '#feba01',
        \`createdAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`ai_projects_userId_fkey\`
          FOREIGN KEY (\`userId\`) REFERENCES \`kod_users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add projectId column to ai_conversations if it doesn't exist yet
    const [colRows] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = 'ai_conversations'
        AND COLUMN_NAME  = 'projectId'
    `);
    if ((colRows as mysql.RowDataPacket[])[0].cnt === 0) {
      await conn.execute(`
        ALTER TABLE \`ai_conversations\`
          ADD COLUMN \`projectId\` VARCHAR(36) NULL
      `);
    }

    // Add FK for projectId only if it doesn't already exist
    const [fkRows] = await conn.execute<mysql.RowDataPacket[]>(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ai_conversations'
        AND CONSTRAINT_NAME = 'ai_conversations_projectId_fkey'
    `);
    if ((fkRows as mysql.RowDataPacket[])[0].cnt === 0) {
      await conn.execute(`
        ALTER TABLE \`ai_conversations\`
          ADD CONSTRAINT \`ai_conversations_projectId_fkey\`
            FOREIGN KEY (\`projectId\`) REFERENCES \`ai_projects\` (\`id\`)
            ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`ai_messages\` (
        \`id\`             VARCHAR(36)                        NOT NULL,
        \`conversationId\` VARCHAR(36)                        NOT NULL,
        \`role\`           ENUM('user','assistant','system')  NOT NULL,
        \`content\`        LONGTEXT                           NOT NULL,
        \`fileUrl\`        VARCHAR(500)                       NULL,
        \`createdAt\`      DATETIME(3)                        NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`ai_messages_conversationId_idx\` (\`conversationId\`),
        CONSTRAINT \`ai_messages_conversationId_fkey\`
          FOREIGN KEY (\`conversationId\`) REFERENCES \`ai_conversations\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables ready');
  } finally {
    conn.release();
  }
}
