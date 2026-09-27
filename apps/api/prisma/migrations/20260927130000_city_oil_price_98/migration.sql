-- 城市油价补齐 98# 档（PRD mobile-fuel 四档油价：92/95/98/0）
ALTER TABLE `cities`
  ADD COLUMN `oil_price_98` DOUBLE NULL AFTER `oil_price_95`;
