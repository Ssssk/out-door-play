# 验收标准

## AC-PROGRAM-001 Harness 可发现

- **关联需求**：FR-PROGRAM-001
- **GIVEN** 从仓库根目录启动新的执行者
- **WHEN** 读取仓库指令
- **THEN** 可定位 AGENTS、Rules、Skills、Wiki、Knowledge 和当前 Change
- **AND** Harness 校验无 error
- **验证方式**：自动化 + 新上下文人工抽查

## AC-SOURCE-001 最新版本来源固定

- **关联需求**：FR-SOURCE-001、NFR-TRACE-001
- **GIVEN** PRD 根目录同时存在根镜像、v1.0.0 和 v1.1.0
- **WHEN** 建立来源基线
- **THEN** v1.1.0 被识别为当前迭代，关键文件具有 SHA-256
- **AND** 根 v1.0.0 镜像不被误用为最新需求
- **验证方式**：哈希清单检查

## AC-SOURCE-002 冲突不被伪装为 READY

- **关联需求**：FR-SOURCE-001
- **GIVEN** 页面注册、需求版本、docs 镜像或 AC ID 存在冲突
- **WHEN** 检查 Requirements Gate
- **THEN** source verification 和 Gate 保持 pending
- **AND** 每个冲突有 Owner 与待裁决问题
- **验证方式**：Harness 状态/决策文件检查

## AC-ASIS-001 旧实现受到保护

- **关联需求**：FR-ASIS-001
- **GIVEN** apps 等主要实现未提交
- **WHEN** 接入 Harness 和生成基线文档
- **THEN** 不覆盖、不删除现有业务文件
- **AND** Git 状态仍能区分原有资产与新增 Harness 文件
- **验证方式**：Git 状态人工审查

## AC-ARCH-001 架构决策可执行

- **关联需求**：FR-ARCH-001
- **GIVEN** Prisma/TypeORM、Redis/MQ 和认证方案存在候选
- **WHEN** 架构 Owner 做出决定
- **THEN** 决策记录包含选项、理由、迁移/兼容、测试和回滚
- **AND** 后续 Change 能按决定实现而无需猜测
- **验证方式**：人工设计评审

## AC-PLAN-001 垂直切片可独立交付

- **关联需求**：FR-PLAN-001
- **GIVEN** 产品正式范围已经确认
- **WHEN** 生成后续 Change 列表
- **THEN** 每个 Change 有单一业务目标、来源、依赖、UAT 和回滚边界
- **AND** 不存在“实现全部 PRD”的无界任务
- **验证方式**：产品 + 架构评审

## AC-QUALITY-001 修改前基线真实

- **关联需求**：NFR-QUALITY-001
- **GIVEN** 旧项目当前代码和依赖
- **WHEN** 执行修改前质量命令
- **THEN** 测试、构建通过与类型检查失败分别如实记录
- **AND** 后台零测试和 Sass 警告没有被隐藏
- **验证方式**：命令退出码与日志

## AC-SEC-001 Secret 不进入仓库

- **关联需求**：NFR-SEC-001
- **GIVEN** 本地存在小程序私钥和环境配置
- **WHEN** 检查 Git 跟踪与 ignore
- **THEN** 私钥和本地环境值不被跟踪
- **AND** 文档和 Evidence 不输出其内容
- **验证方式**：git ls-files/check-ignore + Secret scan

## AC-CI-COMPONENT-001 组件 CI 按变更范围执行

- **关联需求**：FR-CI-001
- **GIVEN** 提交只修改 API、管理 Web、小程序中的一个组件
- **WHEN** `Component CI release` 在 `main` 上触发
- **THEN** 仅对应组件 Job 执行，其余组件 Job 跳过
- **AND** 共享依赖、Compose 或编排工作流变化触发全部组件
- **验证方式**：组件判定单测 + GitHub Actions 真实运行图

## AC-CI-ORDER-001 多组件 CI 串行

- **关联需求**：FR-CI-001
- **GIVEN** 同一提交同时修改多个组件
- **WHEN** 组件 CI 开始执行
- **THEN** 按 API → 管理 Web → 小程序顺序执行
- **AND** 前置组件失败时后置组件不执行
- **验证方式**：GitHub Actions run `34037029052` 作业开始/完成时间与结果

