-- CHG-SCENE-EXPANSION-001 · 目的地型卡片指标补充
-- 新增 price_label 可空列，用于露营/打卡/洗车卡片与详情展示「门票/费用」。
-- 可空列，不回填、不改写存量数据；旧行该列为 NULL。
-- 生产执行前必须有备份点、dry-run 与针对目标/环境/动作的明确授权（本文件本身不执行）。

ALTER TABLE `discoveries` ADD COLUMN `price_label` VARCHAR(64) NULL;
