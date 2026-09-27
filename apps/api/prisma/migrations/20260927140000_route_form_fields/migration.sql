-- 路线表单对齐 PRD：难度等级（easy/normal/hard）+ 起点/终点坐标
ALTER TABLE `discoveries`
  ADD COLUMN `level` VARCHAR(16) NULL AFTER `difficulty`,
  ADD COLUMN `end_longitude` DOUBLE NULL AFTER `elevation_points`,
  ADD COLUMN `end_latitude` DOUBLE NULL AFTER `end_longitude`;
