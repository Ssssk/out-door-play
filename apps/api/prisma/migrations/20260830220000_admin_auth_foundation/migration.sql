-- Expand-only migration for server-side Admin authentication and RBAC.

CREATE TABLE `admin_users` (
    `id` VARCHAR(64) NOT NULL,
    `username` VARCHAR(64) NOT NULL,
    `display_name` VARCHAR(64) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    `failed_login_count` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `password_changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `admin_users_username_key`(`username`),
    INDEX `admin_users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_roles` (
    `id` VARCHAR(64) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `admin_roles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_permissions` (
    `id` VARCHAR(64) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `admin_permissions_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_user_roles` (
    `admin_user_id` VARCHAR(64) NOT NULL,
    `role_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `admin_user_roles_role_id_idx`(`role_id`),
    PRIMARY KEY (`admin_user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_role_permissions` (
    `role_id` VARCHAR(64) NOT NULL,
    `permission_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `admin_role_permissions_permission_id_idx`(`permission_id`),
    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `admin_sessions` (
    `id` VARCHAR(64) NOT NULL,
    `admin_user_id` VARCHAR(64) NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `csrf_hash` CHAR(64) NOT NULL,
    `idle_expires_at` DATETIME(3) NOT NULL,
    `absolute_expires_at` DATETIME(3) NOT NULL,
    `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,
    `ip_hash` CHAR(64) NULL,
    `user_agent_hash` CHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `admin_sessions_token_hash_key`(`token_hash`),
    INDEX `admin_sessions_admin_user_id_revoked_at_idx`(`admin_user_id`, `revoked_at`),
    INDEX `admin_sessions_idle_expires_at_idx`(`idle_expires_at`),
    INDEX `admin_sessions_absolute_expires_at_idx`(`absolute_expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `audit_logs`
    ADD COLUMN `admin_user_id` VARCHAR(64) NULL,
    ADD COLUMN `resource_type` VARCHAR(64) NULL,
    ADD COLUMN `resource_id` VARCHAR(64) NULL,
    ADD COLUMN `reason` VARCHAR(200) NULL,
    ADD COLUMN `request_id` VARCHAR(64) NULL,
    ADD COLUMN `result` ENUM('success', 'rejected', 'failed') NOT NULL DEFAULT 'success',
    ADD INDEX `audit_logs_admin_user_id_created_at_idx`(`admin_user_id`, `created_at`),
    ADD INDEX `audit_logs_request_id_idx`(`request_id`);

ALTER TABLE `admin_user_roles` ADD CONSTRAINT `admin_user_roles_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_user_roles` ADD CONSTRAINT `admin_user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `admin_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_role_permissions` ADD CONSTRAINT `admin_role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `admin_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_role_permissions` ADD CONSTRAINT `admin_role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `admin_permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
