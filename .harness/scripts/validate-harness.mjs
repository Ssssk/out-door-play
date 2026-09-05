#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const start = process.cwd();
const harness = fs.existsSync(path.join(start, '.harness'))
  ? path.join(start, '.harness')
  : path.basename(start) === '.harness'
    ? start
    : null;

if (!harness) {
  console.error('ERROR: 请在包含 .harness 的仓库根目录或 .harness 目录执行。');
  process.exit(2);
}

const errors = [];
const warnings = [];
let skillCount = 0;
let changeCount = 0;

const requiredDirs = ['rules', 'wiki', 'knowledge', 'agents', 'skills', 'changes', 'templates', 'schemas', 'scripts'];
const requiredTopFiles = ['README.md', 'manifest.yaml', 'sources.md'];
const repositoryRoot = path.dirname(harness);
const requiredAgentEntrypoints = [
  'AGENTS.md', 'CLAUDE.md', '.cursor/rules/harness.mdc', '.github/copilot-instructions.md'
];
const requiredChangeFiles = [
  'status.yaml', 'source-baseline.json', 'gate-decisions.json',
  '00-request.md', '01-clarification.md', '02-requirements.md',
  '03-acceptance-criteria.md', '04-impact-analysis.md', '05-design.md', '06-tasks.md',
  '07-knowledge.md',
  'verification/test-plan.md', 'verification/traceability-matrix.md',
  'verification/accessibility-test.md', 'verification/performance-test.md',
  'verification/product-uat.md', 'frontend/ui-ux-review.md',
  'security/supply-chain-review.md',
  'operations/operational-readiness.md', 'operations/slo.yaml',
  'operations/disaster-recovery.md', 'operations/incident-plan.md',
  'release/release-plan.md', 'release/rollback-plan.md', 'completion.md'
];
const states = new Set([
  'draft', 'clarifying', 'requirements_ready', 'design_ready', 'approved', 'implementing',
  'verifying', 'ready_for_release', 'released', 'completed', 'archived', 'cancelled'
]);
const traceabilityRequiredStates = new Set([
  'requirements_ready', 'design_ready', 'approved', 'implementing', 'verifying',
  'ready_for_release', 'released', 'completed', 'archived'
]);
const gateValues = new Set(['pending', 'passed', 'failed', 'not-required']);
const requiredGateNames = [
  'requirements', 'design', 'implementation', 'verification', 'security',
  'uat', 'operations', 'release', 'completion'
];
const requiredGatesByState = {
  requirements_ready: ['requirements'],
  design_ready: ['requirements', 'design'],
  approved: ['requirements', 'design'],
  implementing: ['requirements', 'design'],
  verifying: ['requirements', 'design', 'implementation'],
  ready_for_release: ['requirements', 'design', 'implementation', 'verification', 'security', 'uat', 'operations'],
  released: ['requirements', 'design', 'implementation', 'verification', 'security', 'uat', 'operations', 'release'],
  completed: requiredGateNames,
  archived: requiredGateNames
};
const changeTypes = new Set([
  'feature', 'bugfix', 'refactor', 'migration', 'hotfix', 'operation-campaign',
  'dependency', 'infrastructure', 'security', 'deprecation', 'documentation'
]);
const evidenceTypes = new Set([
  'static', 'unit', 'integration', 'contract', 'e2e', 'security', 'performance',
  'migration', 'deployment', 'uat', 'accessibility', 'supply-chain',
  'operational-readiness', 'backup-restore'
]);
const requiredSkillSections = [
  '触发条件', '不适用场景', '前置 Gate', '必读上下文', '输入', '执行步骤',
  '技术约束', '产物', '验证与证据', '停止与升级条件', '禁止事项', '完成定义'
];
const requiredRoleSections = [
  '使命', '触发条件', '必读', '输入', '输出', '权限边界', '交接与升级', '完成定义'
];

function rel(file) {
  return path.relative(path.dirname(harness), file).replaceAll('\\', '/');
}

function requirePath(file, kind = 'file') {
  if (!fs.existsSync(file)) {
    errors.push(`缺少${kind}: ${rel(file)}`);
    return false;
  }
  return true;
}

function read(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function readJson(file, label) {
  try {
    return JSON.parse(read(file));
  } catch (error) {
    errors.push(`${label} JSON 无效 ${rel(file)}: ${error.message}`);
    return null;
  }
}

function yamlScalar(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*["']?([^"'\\r\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim();
}

for (const file of requiredTopFiles) requirePath(path.join(harness, file));
for (const file of requiredAgentEntrypoints) requirePath(path.join(repositoryRoot, file));
for (const dir of requiredDirs) {
  const target = path.join(harness, dir);
  if (requirePath(target, '目录') && !fs.statSync(target).isDirectory()) errors.push(`不是目录: ${rel(target)}`);
}

const projectQualityFile = path.join(harness, 'project-quality.json');
if (requirePath(projectQualityFile)) {
  const projectQuality = readJson(projectQualityFile, '项目质量配置');
  if (projectQuality) {
    if (!['template', 'active'].includes(projectQuality.mode)) errors.push('project-quality.json mode 必须为 template 或 active');
    const requiredCommands = ['install', 'format_check', 'lint', 'typecheck', 'unit', 'build', 'contract', 'integration', 'e2e', 'security'];
    for (const command of requiredCommands) {
      if (typeof projectQuality.commands?.[command] !== 'string' || !projectQuality.commands[command].trim()) {
        errors.push(`project-quality.json 缺少命令: ${command}`);
      }
    }
    if (projectQuality.mode === 'active') {
      const activeRoot = path.resolve(repositoryRoot, projectQuality.working_directory ?? '.');
      if (!activeRoot.startsWith(repositoryRoot) || !fs.existsSync(activeRoot)) {
        errors.push('active 项目质量配置的 working_directory 无效或超出仓库');
      }
    }
  }
}

const schemaDir = path.join(harness, 'schemas');
if (fs.existsSync(schemaDir)) {
  for (const entry of fs.readdirSync(schemaDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const file = path.join(schemaDir, entry.name);
    try { JSON.parse(read(file)); } catch (error) { errors.push(`JSON Schema 无效 ${rel(file)}: ${error.message}`); }
  }
}

const skillsDir = path.join(harness, 'skills');
if (fs.existsSync(skillsDir)) {
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    skillCount += 1;
    const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!requirePath(skillFile)) continue;
    const text = read(skillFile);
    const frontmatter = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
    if (!frontmatter) {
      errors.push(`Skill 缺少 YAML frontmatter: ${rel(skillFile)}`);
      continue;
    }
    const name = yamlScalar(frontmatter[1], 'name');
    const description = yamlScalar(frontmatter[1], 'description');
    if (name !== entry.name) errors.push(`Skill name 与目录不一致: ${rel(skillFile)} (${name ?? 'missing'})`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name) || entry.name.length > 64) {
      errors.push(`Skill 目录名不合法: ${entry.name}`);
    }
    if (!description || description.length < 12) errors.push(`Skill description 过短或缺失: ${rel(skillFile)}`);
    const body = text.slice(frontmatter[0].length).trim();
    if (body.length < 1200) errors.push(`Skill 正文不足以构成详细工程规程: ${rel(skillFile)} (${body.length} chars)`);
    for (const section of requiredSkillSections) {
      if (!new RegExp(`^##\\s+${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'm').test(body)) {
        errors.push(`Skill 缺少强制章节“${section}”: ${rel(skillFile)}`);
      }
    }
    if (/TODO|\[TODO\]|PLACEHOLDER/i.test(text)) errors.push(`Skill 含未完成占位符: ${rel(skillFile)}`);
  }
}

const roleDir = path.join(harness, 'agents');
if (fs.existsSync(roleDir)) {
  for (const entry of fs.readdirSync(roleDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const roleFile = path.join(roleDir, entry.name);
    const roleText = read(roleFile);
    if (roleText.trim().length < 300) errors.push(`Agent 角色约束过短: ${rel(roleFile)}`);
    for (const section of requiredRoleSections) {
      if (!new RegExp(`^##\\s+${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'm').test(roleText)) {
        errors.push(`Agent 缺少章节“${section}”: ${rel(roleFile)}`);
      }
    }
  }
}

const knowledgeDir = path.join(harness, 'knowledge');
if (fs.existsSync(knowledgeDir)) {
  requirePath(path.join(knowledgeDir, 'README.md'));
  const knowledgeIndex = path.join(knowledgeDir, 'index.yaml');
  if (requirePath(knowledgeIndex)) {
    const indexText = read(knowledgeIndex);
    if (!/^schema_version:\s*1\s*$/m.test(indexText)) errors.push(`知识索引 schema_version 缺失: ${rel(knowledgeIndex)}`);
    if (!/^entries:\s*(?:\[\]|\s*$)/m.test(indexText)) errors.push(`知识索引 entries 缺失: ${rel(knowledgeIndex)}`);
  }
}

const agentsFile = path.join(repositoryRoot, 'AGENTS.md');
if (fs.existsSync(agentsFile)) {
  const agentsText = read(agentsFile);
  const requiredAgentSections = [
    '项目技术基线', '权威顺序', 'AI 启动协议', 'Change 适用范围', '标准状态机与 Gate',
    '全局不可违反红线', '第二大脑协议', '证据与真实性', '权限与破坏性操作',
    '停止与升级条件', '文件索引', '完成定义'
  ];
  if (Buffer.byteLength(agentsText, 'utf8') > 32 * 1024) {
    errors.push(`AGENTS.md 超过默认 32 KiB 指令预算: ${Buffer.byteLength(agentsText, 'utf8')} bytes`);
  }
  for (const section of requiredAgentSections) {
    if (!new RegExp(`^##\\s+(?:\\d+\\.\\s+)?${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*$`, 'm').test(agentsText)) {
      errors.push(`AGENTS.md 缺少顶层章节“${section}”`);
    }
  }
}

const changesDir = path.join(harness, 'changes');
if (fs.existsSync(changesDir)) {
  for (const entry of fs.readdirSync(changesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'archive') continue;
    changeCount += 1;
    const base = path.join(changesDir, entry.name);
    for (const relative of requiredChangeFiles) requirePath(path.join(base, relative));
    const statusFile = path.join(base, 'status.yaml');
    if (!fs.existsSync(statusFile)) continue;
    const status = read(statusFile);
    const id = yamlScalar(status, 'id');
    const name = yamlScalar(status, 'name');
    const changeType = yamlScalar(status, 'change_type');
    const state = yamlScalar(status, 'state');
    if (!id || !/^CHG-[A-Z0-9-]+$/.test(id)) errors.push(`Change id 不合法: ${rel(statusFile)}`);
    if (name !== entry.name.replace(/^example-/, '') && !entry.name.startsWith('example-')) {
      errors.push(`Change name 与目录不一致: ${rel(statusFile)}`);
    }
    if (!state || !states.has(state)) errors.push(`Change state 不合法: ${rel(statusFile)} (${state ?? 'missing'})`);
    if (!changeType || !changeTypes.has(changeType)) errors.push(`Change type 不合法: ${rel(statusFile)} (${changeType ?? 'missing'})`);

    const gatesBlock = status.match(/^gates:\s*\r?\n((?:^[ \t]+.*\r?\n?)*)/m)?.[1] ?? '';
    const gatePairs = [...gatesBlock.matchAll(/^\s{2}([a-z_]+):\s*["']?([^"'\r\n]+)["']?\s*$/gm)];
    const gateMap = new Map(gatePairs.map(([, gate, valueRaw]) => [gate, valueRaw.trim()]));
    for (const gate of requiredGateNames) {
      if (!gateMap.has(gate)) errors.push(`Change 缺少 Gate: ${entry.name}.${gate}`);
    }
    for (const [, gate, valueRaw] of gatePairs) {
      const value = valueRaw.trim();
      if (!gateValues.has(value)) errors.push(`Gate 值不合法 ${entry.name}.${gate}: ${value}`);
    }
    for (const gate of requiredGatesByState[state] ?? []) {
      if (!['passed', 'not-required'].includes(gateMap.get(gate))) {
        errors.push(`状态 ${state} 的前置 Gate 未通过: ${entry.name}.${gate}`);
      }
    }

    const sourceBaselineFile = path.join(base, 'source-baseline.json');
    if (fs.existsSync(sourceBaselineFile)) {
      const sourceBaseline = readJson(sourceBaselineFile, '需求来源基线');
      if (sourceBaseline) {
        if (sourceBaseline.change_id !== id) errors.push(`需求来源基线 Change ID 不一致: ${entry.name}`);
        if (!['pending', 'verified', 'not-applicable'].includes(sourceBaseline.verification_status)) {
          errors.push(`需求来源基线状态不合法: ${entry.name}`);
        }
        if (!Array.isArray(sourceBaseline.sources) || sourceBaseline.sources.length === 0) {
          errors.push(`需求来源基线没有 sources: ${entry.name}`);
        }
        if (traceabilityRequiredStates.has(state) && sourceBaseline.verification_status === 'pending') {
          errors.push(`进入 ${state} 前需求来源基线仍为 pending: ${entry.name}`);
        }
      }
    }

    const gateDecisionsFile = path.join(base, 'gate-decisions.json');
    if (fs.existsSync(gateDecisionsFile)) {
      const gateDecisions = readJson(gateDecisionsFile, 'Gate 决策');
      if (gateDecisions) {
        if (gateDecisions.change_id !== id) errors.push(`Gate 决策 Change ID 不一致: ${entry.name}`);
        for (const gate of requiredGateNames) {
          const decision = gateDecisions.decisions?.[gate];
          if (!decision) {
            errors.push(`Gate 决策缺少条目: ${entry.name}.${gate}`);
            continue;
          }
          if (decision.status !== gateMap.get(gate)) {
            errors.push(`Gate 状态与决策不一致: ${entry.name}.${gate}`);
          }
          if (['passed', 'not-required'].includes(decision.status)) {
            if (!decision.approver || !decision.decided_at || !decision.reason || !Array.isArray(decision.evidence) || decision.evidence.length === 0) {
              errors.push(`已决策 Gate 缺少审批人、时间、理由或证据: ${entry.name}.${gate}`);
            }
            for (const evidencePath of decision.evidence ?? []) {
              const resolvedEvidence = path.resolve(base, evidencePath);
              if (!resolvedEvidence.startsWith(base) || !fs.existsSync(resolvedEvidence)) {
                errors.push(`Gate 决策证据路径无效: ${entry.name}.${gate} -> ${evidencePath}`);
              }
            }
          }
        }
      }
    }

    const evidenceDir = path.join(base, 'evidence');
    if (fs.existsSync(evidenceDir)) {
      for (const evidenceName of fs.readdirSync(evidenceDir)) {
        if (!evidenceName.endsWith('.evidence.json')) continue;
        const evidenceFile = path.join(evidenceDir, evidenceName);
        const evidence = readJson(evidenceFile, '执行证据');
        if (!evidence) continue;
        const requiredEvidenceFields = ['type', 'status', 'commit', 'environment', 'startedAt', 'finishedAt', 'command', 'exitCode', 'summary', 'runner'];
        for (const field of requiredEvidenceFields) {
          if (evidence[field] === undefined || evidence[field] === null || evidence[field] === '') {
            errors.push(`执行证据缺少字段 ${field}: ${rel(evidenceFile)}`);
          }
        }
        if (!evidenceTypes.has(evidence.type)) errors.push(`执行证据类型不合法: ${rel(evidenceFile)}`);
        if (!['passed', 'failed', 'not-run', 'blocked'].includes(evidence.status)) errors.push(`执行证据状态不合法: ${rel(evidenceFile)}`);
        if (!/^CHG-[A-Z0-9-]+$/.test(evidence.changeId ?? '') || evidence.changeId !== id) {
          errors.push(`执行证据 Change ID 无效: ${rel(evidenceFile)}`);
        }
        if (!Array.isArray(evidence.requirementIds) || !Array.isArray(evidence.acceptanceIds)) {
          errors.push(`执行证据缺少需求/验收追踪数组: ${rel(evidenceFile)}`);
        }
      }
    }

    const requirementsFile = path.join(base, '02-requirements.md');
    const acceptanceFile = path.join(base, '03-acceptance-criteria.md');
    const matrixFile = path.join(base, 'verification', 'traceability-matrix.md');
    if (traceabilityRequiredStates.has(state) && fs.existsSync(requirementsFile) && fs.existsSync(acceptanceFile) && fs.existsSync(matrixFile)) {
      const requirements = new Set(read(requirementsFile).match(/\b(?:FR|NFR)-[A-Z0-9]+-\d{3}\b/g) ?? []);
      const acceptance = new Set(read(acceptanceFile).match(/\bAC-[A-Z0-9]+-\d{3}\b/g) ?? []);
      const matrix = read(matrixFile);
      if (requirements.size === 0) errors.push(`没有需求 ID: ${rel(requirementsFile)}`);
      if (acceptance.size === 0) errors.push(`没有验收 ID: ${rel(acceptanceFile)}`);
      for (const item of requirements) if (!matrix.includes(item)) errors.push(`追踪矩阵缺少需求 ${item}: ${entry.name}`);
      for (const item of acceptance) if (!matrix.includes(item)) errors.push(`追踪矩阵缺少验收 ${item}: ${entry.name}`);
    }

    const openapi = path.join(base, 'contracts', 'openapi.yaml');
    if (fs.existsSync(openapi) && !/^openapi:\s*3\./m.test(read(openapi))) {
      errors.push(`OpenAPI 版本缺失或非 3.x: ${rel(openapi)}`);
    }

    if (state === 'completed' || state === 'archived') {
      const failedGate = gatePairs.find(([, , valueRaw]) => !['passed', 'not-required'].includes(valueRaw.trim()));
      if (failedGate) errors.push(`已完成 Change 仍有未通过 Gate: ${entry.name}.${failedGate[1]}`);
      if (!fs.existsSync(evidenceDir)) errors.push(`已完成 Change 缺少 evidence: ${entry.name}`);
      const machineEvidence = fs.existsSync(evidenceDir)
        ? fs.readdirSync(evidenceDir).filter((name) => name.endsWith('.evidence.json'))
        : [];
      if (machineEvidence.length === 0) errors.push(`已完成 Change 缺少机器可读 evidence: ${entry.name}`);
      const completion = path.join(base, 'completion.md');
      if (fs.existsSync(completion) && /未完成|not-run/i.test(read(completion))) {
        errors.push(`已完成 Change 的 completion 仍声明未完成/not-run: ${entry.name}`);
      }
    }
  }
}

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(file);
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      const text = read(file);
      if (text.trim().length < 20) warnings.push(`Markdown 内容过短: ${rel(file)}`);
      for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0];
        if (!target || /^(https?:|mailto:)/.test(target)) continue;
        const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
        if (!fs.existsSync(resolved)) errors.push(`失效本地链接: ${rel(file)} -> ${target}`);
      }
    }
  }
}
walkMarkdown(harness);

console.log(`Harness: ${harness}`);
console.log(`Skills: ${skillCount}`);
console.log(`Active example/changes: ${changeCount}`);
console.log(`Warnings: ${warnings.length}`);
for (const warning of warnings) console.warn(`WARN: ${warning}`);
console.log(`Errors: ${errors.length}`);
for (const error of errors) console.error(`ERROR: ${error}`);
process.exit(errors.length === 0 ? 0 : 1);
