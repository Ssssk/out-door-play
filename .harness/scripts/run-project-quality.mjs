#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const repositoryRoot = fs.existsSync(path.join(process.cwd(), '.harness'))
  ? process.cwd()
  : path.basename(process.cwd()) === '.harness'
    ? path.dirname(process.cwd())
    : null;

if (!repositoryRoot) {
  console.error('ERROR: 请在仓库根目录或 .harness 目录执行。');
  process.exit(2);
}

const configFile = path.join(repositoryRoot, '.harness', 'project-quality.json');
const config = JSON.parse(fs.readFileSync(configFile, 'utf8').replace(/^\uFEFF/, ''));
const orderedGates = [
  'install', 'format_check', 'lint', 'typecheck', 'unit', 'build',
  'contract', 'integration', 'e2e', 'security'
];

if (config.mode === 'template') {
  console.log('Project quality mode: template');
  console.log('复制到真实项目后，配置 working_directory 和命令，并将 mode 改为 active。');
  process.exit(0);
}

if (config.mode !== 'active') {
  console.error(`ERROR: 不支持的 project quality mode: ${config.mode}`);
  process.exit(2);
}

const workingDirectory = path.resolve(repositoryRoot, config.working_directory ?? '.');
if (!workingDirectory.startsWith(repositoryRoot) || !fs.existsSync(workingDirectory)) {
  console.error(`ERROR: working_directory 无效或超出仓库: ${workingDirectory}`);
  process.exit(2);
}

for (const gate of orderedGates) {
  const command = config.commands?.[gate];
  if (!command) {
    console.error(`ERROR: active 模式缺少命令: ${gate}`);
    process.exit(2);
  }
  console.log(`QUALITY_GATE_START ${gate}`);
  if (process.env.HARNESS_QUALITY_INJECT_FAILURE === gate) {
    console.error(`QUALITY_GATE_INJECTED_FAILURE ${gate}`);
    process.exit(86);
  }
  const result = spawnSync(command, {
    cwd: workingDirectory,
    env: { ...process.env, HARNESS_QUALITY_GATE: gate },
    shell: true,
    stdio: 'inherit'
  });
  if (result.error) {
    console.error(`QUALITY_GATE_ERROR ${gate}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`QUALITY_GATE_FAILED ${gate}: exit=${result.status}`);
    process.exit(result.status ?? 1);
  }
  console.log(`QUALITY_GATE_PASSED ${gate}`);
}

console.log('PROJECT_QUALITY_GATES_PASSED');
