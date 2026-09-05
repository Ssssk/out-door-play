-- CreateTable
CREATE TABLE `cities` (
    `code` VARCHAR(6) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discoveries` (
    `id` VARCHAR(64) NOT NULL,
    `city_code` VARCHAR(6) NOT NULL,
    `scene` ENUM('drive', 'fish') NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `rank` INTEGER NOT NULL,
    `rank_tag` VARCHAR(64) NOT NULL,
    `distance_km` DOUBLE NOT NULL,
    `length_km` DOUBLE NOT NULL,
    `elevation_m` INTEGER NOT NULL,
    `difficulty` VARCHAR(32) NOT NULL,
    `cover_image_url` VARCHAR(255) NOT NULL,
    `duration_label` VARCHAR(32) NOT NULL,
    `best_time` VARCHAR(64) NOT NULL,
    `car_type` VARCHAR(64) NULL,
    `start_point` VARCHAR(128) NULL,
    `end_point` VARCHAR(128) NULL,
    `entry_point` VARCHAR(128) NULL,
    `main_area` VARCHAR(128) NULL,
    `gear` VARCHAR(128) NULL,
    `shore_km` DOUBLE NULL,
    `depth_m` DOUBLE NULL,
    `description` TEXT NOT NULL,
    `tags` JSON NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `elevation_points` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `discoveries_city_code_scene_idx`(`city_code`, `scene`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_prices` (
    `id` VARCHAR(64) NOT NULL,
    `city_code` VARCHAR(6) NOT NULL,
    `grade` VARCHAR(32) NOT NULL,
    `price` DOUBLE NOT NULL,
    `change` DOUBLE NOT NULL,
    `published_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `fuel_prices_city_code_published_at_idx`(`city_code`, `published_at`),
    UNIQUE INDEX `fuel_prices_city_code_grade_key`(`city_code`, `grade`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_stations` (
    `id` VARCHAR(64) NOT NULL,
    `city_code` VARCHAR(6) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `brand` VARCHAR(32) NOT NULL,
    `distance_km` DOUBLE NOT NULL,
    `opening_hours` VARCHAR(32) NOT NULL,
    `price_92` DOUBLE NOT NULL,
    `price_95` DOUBLE NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `fuel_stations_city_code_idx`(`city_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(64) NOT NULL,
    `avatar_url` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(32) NOT NULL,
    `mileage` INTEGER NOT NULL DEFAULT 0,
    `checkins` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `user_id` VARCHAR(64) NOT NULL,
    `discovery_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_discovery_id_idx`(`discovery_id`),
    PRIMARY KEY (`user_id`, `discovery_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `discoveries` ADD CONSTRAINT `discoveries_city_code_fkey` FOREIGN KEY (`city_code`) REFERENCES `cities`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_prices` ADD CONSTRAINT `fuel_prices_city_code_fkey` FOREIGN KEY (`city_code`) REFERENCES `cities`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fuel_stations` ADD CONSTRAINT `fuel_stations_city_code_fkey` FOREIGN KEY (`city_code`) REFERENCES `cities`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_discovery_id_fkey` FOREIGN KEY (`discovery_id`) REFERENCES `discoveries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
