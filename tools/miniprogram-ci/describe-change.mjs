import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_DESCRIPTION_LENGTH = 128

export function buildDescription({ subject, paths = [] }) {
  const normalizedSubject = String(subject || '')
    .replace(/\s+/g, ' ')
    .trim()
  const summary = normalizedSubject || '小程序体验版更新'
  const scopes = detectScopes(paths)
  const scopedSummary = scopes.length > 0
    ? `${summary}（${scopes.join('、')}）`
    : summary

  return truncateDescription(scopedSummary)
}

export function truncateDescription(value) {
  const chars = Array.from(String(value).replace(/\s+/g, ' ').trim())
  if (chars.length <= MAX_DESCRIPTION_LENGTH) {
    return chars.join('')
  }

  return `${chars.slice(0, MAX_DESCRIPTION_LENGTH - 1).join('')}…`
}

function detectScopes(paths) {
  const normalizedPaths = paths.map((value) => String(value).replaceAll('\\', '/'))
  const scopes = []

  if (normalizedPaths.some((value) => value.startsWith('apps/mobile/'))) {
    scopes.push('小程序')
  }
  if (normalizedPaths.some((value) => value.startsWith('apps/admin/'))) {
    scopes.push('运营后台')
  }
  if (normalizedPaths.some((value) => value.startsWith('apps/api/'))) {
    scopes.push('API')
  }
  if (normalizedPaths.some((value) => (
    value.startsWith('tools/miniprogram-ci/')
    || value === '.github/workflows/deploy-miniprogram-experience.yml'
  ))) {
    scopes.push('发布流程')
  }

  return scopes
}

function gitOutput(args, sha) {
  return execFileSync('git', [...args, sha], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

function readOption(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function main() {
  const sha = readOption('--sha') || process.env.GITHUB_SHA || 'HEAD'
  const outputPath = readOption('--output')
  const subject = gitOutput(['show', '-s', '--format=%s'], sha)
  const changedPaths = gitOutput([
    'diff-tree', '--no-commit-id', '--name-only', '-r', '--root',
  ], sha)
    .split(/\r?\n/)
    .filter(Boolean)
  const description = buildDescription({ subject, paths: changedPaths })

  if (outputPath) {
    writeFileSync(path.resolve(outputPath), `${description}\n`, 'utf8')
  }
  console.log(description)
}

if (
  process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
}
