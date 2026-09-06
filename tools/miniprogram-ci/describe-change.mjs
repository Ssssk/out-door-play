import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_DESCRIPTION_LENGTH = 128

const COMMIT_TYPE_LABELS = new Map([
  ['feat', '新增功能'],
  ['fix', '修复问题'],
  ['chore', '工程维护'],
  ['refactor', '重构优化'],
  ['docs', '文档更新'],
  ['test', '测试补充'],
  ['perf', '性能优化'],
  ['build', '构建调整'],
  ['ci', '发布流程调整'],
  ['style', '样式调整'],
  ['revert', '回滚变更'],
])

const KNOWN_DETAIL_TRANSLATIONS = new Map([
  ['update route cards', '更新路线卡片'],
  ['keep parent commit for release summary', '保留父提交生成发布摘要'],
  ['generate wechat release description from commit', '根据提交生成微信发布备注'],
  ['exit miniprogram upload on failure', '小程序上传失败时退出'],
  ['resolve upload payload from workspace', '从工作区解析上传载荷'],
  ['use provisioned node on upload runner', '上传任务使用预置运行环境'],
  ['route wechat upload through fixed runner', '通过固定出口执行微信上传'],
  ['initialize buildx before container checks', '容器检查前初始化构建环境'],
  ['provide isolated prisma urls', '提供隔离数据库配置'],
  ['allow release workflow artifact access', '允许发布流程读取制品'],
  ['run release checks by changed component', '按变更组件执行发布检查'],
  ['record component ci release evidence', '记录组件发布检查证据'],
  ['clarify experience upload boundary', '明确体验版上传边界'],
])

export function buildDescription({ subject, paths = [] }) {
  const normalizedSubject = String(subject || '')
    .replace(/\s+/g, ' ')
    .trim()
  const scopes = detectScopes(paths)
  const summary = toChineseSummary(normalizedSubject)
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
    scopes.push('后端')
  }
  if (normalizedPaths.some((value) => (
    value.startsWith('tools/miniprogram-ci/')
    || value === '.github/workflows/deploy-miniprogram-experience.yml'
  ))) {
    scopes.push('发布流程')
  }

  return scopes
}

function toChineseSummary(subject) {
  if (!subject) return '小程序体验版更新'

  const conventional = subject.match(/^([a-z]+)(?:\([^)]*\))?!?:\s*(.*)$/i)
  if (conventional) {
    const typeLabel = COMMIT_TYPE_LABELS.get(conventional[1].toLowerCase()) || '项目更新'
    const detail = toChineseDetail(conventional[2])
    return detail ? `${typeLabel}：${detail}` : typeLabel
  }

  return /[a-z]/i.test(subject) ? '小程序功能更新' : subject
}

function toChineseDetail(detail) {
  const normalized = detail.replace(/\s+/g, ' ').trim()
  const translated = KNOWN_DETAIL_TRANSLATIONS.get(normalized.toLowerCase()) || normalized
  return /[a-z]/i.test(translated) ? '' : translated
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
