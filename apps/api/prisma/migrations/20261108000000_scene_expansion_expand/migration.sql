-- CHG-SCENE-EXPANSION-001 · Expand 阶段
-- 只扩展枚举、增加可空列与索引；不删除 fish、不改写任何存量数据。
-- 生产执行前必须有备份点、dry-run 与针对目标/环境/动作的明确授权（本文件本身不执行）。
-- 回填由 apps/api/src/scripts/backfill-scene-play.ts 单独完成（Migrate 阶段）。

-- 1) 扩展业务场景枚举。顺序追加在尾部，保证既有值的存储编号不变。
ALTER TABLE `discoveries` MODIFY COLUMN `scene` ENUM('drive', 'fish', 'play', 'wash') NOT NULL;
ALTER TABLE `rankings` MODIFY COLUMN `scene` ENUM('drive', 'fish', 'play', 'wash') NOT NULL;

-- 2) 新增可空子类型列，旧行保持 NULL（幂等回填条件依赖这一点）。
ALTER TABLE `discoveries` ADD COLUMN `sub_type` ENUM('fishing', 'camping', 'checkin') NULL;

-- 3) 新增复合索引；旧索引保留，供旧版应用与回滚共存期继续使用。
ALTER TABLE `discoveries` ADD INDEX `discoveries_city_code_scene_sub_type_idx` (`city_code`, `scene`, `sub_type`);
