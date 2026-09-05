#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const sourceRoot = fs.existsSync(path.join(process.cwd(), '.harness'))
  ? process.cwd()
  : path.basename(process.cwd()) === '.harness'
    ? path.dirname(process.cwd())
    : null;

if (!sourceRoot) {
  console.error('ERROR: 请在仓库根目录或 .harness 目录执行。');
  process.exit(2);
}

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-validator-'));
const cases = [];

function copyFixture(name) {
  const destination = path.join(scratch, name);
  fs.cpSync(sourceRoot, destination, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`)
  });
  return destination;
}

function runValidator(root) {
  return spawnSync(process.execPath, [path.join(root, '.harness', 'scripts', 'validate-harness.mjs')], {
    cwd: root,
    encoding: 'utf8'
  });
}

function fixtureChange(root) {
  const changesRoot = path.join(root, '.harness', 'changes');
  const changeName = fs.readdirSync(changesRoot, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name !== 'archive')?.name;
  if (!changeName) throw new Error('测试夹具中没有可用的 Change。');
  return path.join(changesRoot, changeName);
}

function expect(name, mutate, expectedExit, expectedText) {
  const fixture = copyFixture(name);
  mutate?.(fixture);
  const result = runValidator(fixture);
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const passed = result.status === expectedExit && output.includes(expectedText);
  cases.push({ name, passed, output });
}

try {
  expect('valid', null, 0, 'Errors: 0');

  expect('missing-source', (root) => {
    fs.rmSync(path.join(fixtureChange(root), 'source-baseline.json'));
  }, 1, 'source-baseline.json');

  expect('gate-mismatch', (root) => {
    const file = path.join(fixtureChange(root), 'gate-decisions.json');
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    value.decisions.requirements.status = 'failed';
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }, 1, 'Gate 状态与决策不一致');

  expect('invalid-state-prerequisite', (root) => {
    const file = path.join(fixtureChange(root), 'status.yaml');
    const value = fs.readFileSync(file, 'utf8').replace(/^state:\s*[^\r\n]+/m, 'state: "verifying"');
    fs.writeFileSync(file, value, 'utf8');
  }, 1, '前置 Gate 未通过');

  expect('invalid-evidence', (root) => {
    const file = path.join(fixtureChange(root), 'evidence', 'invalid.evidence.json');
    fs.writeFileSync(file, '{"type":"unknown"}\n', 'utf8');
  }, 1, '执行证据缺少字段');

  const failed = cases.filter((item) => !item.passed);
  for (const item of cases) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
  if (failed.length > 0) {
    for (const item of failed) console.error(item.output);
    process.exitCode = 1;
  }
} finally {
  const resolvedScratch = path.resolve(scratch);
  const resolvedTemp = path.resolve(os.tmpdir());
  if (!resolvedScratch.startsWith(resolvedTemp) || path.basename(resolvedScratch).length < 20) {
    throw new Error(`拒绝清理非预期临时目录: ${resolvedScratch}`);
  }
  fs.rmSync(resolvedScratch, { recursive: true, force: true });
}
