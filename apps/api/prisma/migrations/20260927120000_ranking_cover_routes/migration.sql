-- 榜单封面路线：cover_route_ids 存 Discovery.id 数组（PRD web-rankings.md 双向同步口径）
ALTER TABLE `rankings`
  ADD COLUMN `cover_route_ids` JSON NULL AFTER `weight`;
