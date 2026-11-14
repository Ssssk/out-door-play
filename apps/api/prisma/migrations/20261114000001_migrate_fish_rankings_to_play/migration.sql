-- CHG-RANKING-SCENES · 榜单场景对齐三业务场景
-- 把存量 legacy 钓鱼榜单迁移到 粗门玩玩（scene=play）。
-- 其封面路线在场景扩展回填时已是 scene=play、subType=fishing，迁移后
-- validateCoverRoutes 的「封面路线场景须与榜单一致」校验可正常通过（play 混排）。
-- 生产执行前必须有备份点、dry-run 与针对目标/环境/动作的明确授权（本文件本身不执行）。

UPDATE `rankings` SET `scene` = 'play' WHERE `scene` = 'fish';
