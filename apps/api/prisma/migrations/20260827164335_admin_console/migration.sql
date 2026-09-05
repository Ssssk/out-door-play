-- AlterTable
ALTER TABLE `cities` ADD COLUMN `enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `scenes` JSON NULL;

-- AlterTable
ALTER TABLE `discoveries` ADD COLUMN `clicks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `impressions` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `rank_weight` INTEGER NOT NULL DEFAULT 50,
    ADD COLUMN `status` ENUM('online', 'pending', 'offline') NOT NULL DEFAULT 'online';

-- AlterTable
ALTER TABLE `fuel_stations` ADD COLUMN `enabled` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `city_code` VARCHAR(6) NULL,
    ADD COLUMN `last_active_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `phone` VARCHAR(32) NULL,
    ADD COLUMN `status` ENUM('normal', 'banned') NOT NULL DEFAULT 'normal';

-- CreateTable
CREATE TABLE `rankings` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `scene` ENUM('drive', 'fish') NOT NULL,
    `city_code` VARCHAR(6) NULL,
    `coverage_count` INTEGER NOT NULL,
    `weight` INTEGER NOT NULL,
    `status` ENUM('online', 'pending', 'offline') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rankings_status_weight_idx`(`status`, `weight`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feeds` (
    `id` VARCHAR(64) NOT NULL,
    `author_id` VARCHAR(64) NOT NULL,
    `discovery_id` VARCHAR(64) NULL,
    `type` ENUM('text', 'video') NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `report_count` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'published', 'offline') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `feeds_status_created_at_idx`(`status`, `created_at`),
    INDEX `feeds_author_id_idx`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_tasks` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `type` ENUM('route', 'user', 'fuel', 'ugc') NOT NULL,
    `date_range` VARCHAR(64) NOT NULL,
    `dimension` VARCHAR(32) NOT NULL,
    `creator` VARCHAR(64) NOT NULL,
    `status` ENUM('done', 'processing', 'failed') NOT NULL DEFAULT 'processing',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `report_tasks_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `action_id` VARCHAR(64) NOT NULL,
    `discovery_id` VARCHAR(64) NULL,
    `operator` VARCHAR(64) NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `before_value` JSON NULL,
    `after_value` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_discovery_id_created_at_idx`(`discovery_id`, `created_at`),
    PRIMARY KEY (`action_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_city_code_fkey` FOREIGN KEY (`city_code`) REFERENCES `cities`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rankings` ADD CONSTRAINT `rankings_city_code_fkey` FOREIGN KEY (`city_code`) REFERENCES `cities`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feeds` ADD CONSTRAINT `feeds_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feeds` ADD CONSTRAINT `feeds_discovery_id_fkey` FOREIGN KEY (`discovery_id`) REFERENCES `discoveries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_discovery_id_fkey` FOREIGN KEY (`discovery_id`) REFERENCES `discoveries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
