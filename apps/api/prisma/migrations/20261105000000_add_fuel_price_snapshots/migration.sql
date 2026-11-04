-- Historical fuel price snapshots: the third-party province price sources only expose the
-- current price, so each newly observed adjustment date is persisted as one row per grade.
-- Unique on (region, grade, published_at) makes repeated writes idempotent.

CREATE TABLE `fuel_price_snapshots` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `region` VARCHAR(16) NOT NULL,
    `region_label` VARCHAR(32) NOT NULL,
    `grade` VARCHAR(16) NOT NULL,
    `price` DOUBLE NOT NULL,
    `change` DOUBLE NOT NULL,
    `published_at` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fuel_price_snapshots_region_grade_published_at_key`(`region`, `grade`, `published_at`),
    INDEX `fuel_price_snapshots_region_grade_published_at_idx`(`region`, `grade`, `published_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
