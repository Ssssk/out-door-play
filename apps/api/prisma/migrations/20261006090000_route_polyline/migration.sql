-- 「查看完整路线」：驾车规划轨迹缓存（高德路径规划一次生成，后续直接读缓存）
ALTER TABLE `discoveries`
  ADD COLUMN `route_polyline` JSON NULL AFTER `elevation_points`,
  ADD COLUMN `route_planned_at` DATETIME(3) NULL AFTER `route_polyline`;
