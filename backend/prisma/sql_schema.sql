-- KodBank Database Schema
-- Reference SQL for Aiven MySQL
-- Run this once in your Aiven Query Editor before starting the server.

CREATE TABLE `kod_users` (
  `id`        VARCHAR(36)    NOT NULL,
  `uid`       VARCHAR(50)    NOT NULL,
  `username`  VARCHAR(50)    NOT NULL,
  `email`     VARCHAR(255)   NOT NULL,
  `password`  VARCHAR(255)   NOT NULL,
  `phone`     VARCHAR(20)    NOT NULL,
  `role`      VARCHAR(20)    NOT NULL DEFAULT 'Customer',
  `balance`   DECIMAL(15,2)  NOT NULL DEFAULT 100000.00,
  `createdAt` DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)    NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kod_users_uid_key` (`uid`),
  UNIQUE KEY `kod_users_username_key` (`username`),
  UNIQUE KEY `kod_users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_tokens` (
  `id`        VARCHAR(36) NOT NULL,
  `userId`    VARCHAR(36) NOT NULL,
  `token`     TEXT        NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `user_tokens_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `kod_users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
