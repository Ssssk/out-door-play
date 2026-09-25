-- 管理后台对齐 PRD：城市油价（auto/manual/failed）、用户运营备注、系统配置（小程序二维码）
ALTER TABLE `cities`
  ADD COLUMN `oil_price_92` DOUBLE NULL AFTER `scenes`,
  ADD COLUMN `oil_price_95` DOUBLE NULL AFTER `oil_price_92`,
  ADD COLUMN `oil_price_0` DOUBLE NULL AFTER `oil_price_95`,
  ADD COLUMN `oil_source` VARCHAR(8) NULL AFTER `oil_price_0`,
  ADD COLUMN `oil_updated_at` DATETIME(3) NULL AFTER `oil_source`,
  ADD COLUMN `oil_error` VARCHAR(255) NULL AFTER `oil_updated_at`;

ALTER TABLE `users`
  ADD COLUMN `admin_note` VARCHAR(255) NULL AFTER `checkins`;

CREATE TABLE `system_configs` (
  `key` VARCHAR(64) NOT NULL,
  `value` JSON NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
