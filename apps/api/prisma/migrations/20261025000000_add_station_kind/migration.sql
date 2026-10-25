-- Add station kind discriminator (fuel | ev) so charging stations can share the table
-- with gas stations. Existing rows default to 'fuel'; new rows are set explicitly.

ALTER TABLE `fuel_stations` ADD COLUMN `kind` VARCHAR(8) NOT NULL DEFAULT 'fuel';

-- Composite index (city_code, kind) matching the schema @@index([cityCode, kind]).
-- The old single-column index (fuel_stations_city_code_idx) is intentionally kept for
-- backwards-compatible queries; this new index covers the common lookups.
CREATE INDEX `fuel_stations_city_code_kind_idx` ON `fuel_stations` (`city_code`, `kind`);
