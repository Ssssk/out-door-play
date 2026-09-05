-- Expand-only migration for mobile identities and opaque access/refresh sessions.

CREATE TABLE `user_identities` (
    `id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `provider` ENUM('wechat', 'dev') NOT NULL,
    `provider_subject_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `user_identities_provider_provider_subject_hash_key`(`provider`, `provider_subject_hash`),
    INDEX `user_identities_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mobile_sessions` (
    `id` VARCHAR(64) NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `access_token_hash` CHAR(64) NOT NULL,
    `refresh_token_hash` CHAR(64) NOT NULL,
    `access_expires_at` DATETIME(3) NOT NULL,
    `refresh_expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `mobile_sessions_access_token_hash_key`(`access_token_hash`),
    UNIQUE INDEX `mobile_sessions_refresh_token_hash_key`(`refresh_token_hash`),
    INDEX `mobile_sessions_user_id_revoked_at_idx`(`user_id`, `revoked_at`),
    INDEX `mobile_sessions_access_expires_at_idx`(`access_expires_at`),
    INDEX `mobile_sessions_refresh_expires_at_idx`(`refresh_expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_identities` ADD CONSTRAINT `user_identities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `mobile_sessions` ADD CONSTRAINT `mobile_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
