-- 新用户默认昵称候选池：注册时随机取一个未使用的名字，替代「户外玩家xxxx」占位昵称。

CREATE TABLE `nickname_pool` (
    `id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `used` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `nickname_pool_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
