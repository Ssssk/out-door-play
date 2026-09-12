import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const SHARED_PATHS = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'compose.prod.yaml',
  'docker/nginx/',
  '.github/workflows/ci-component-release.yml',
  '.github/workflows/deploy-production.yml',
]

function normalizeSha(value) {
  const sha = String(value || '').trim()
  return /^[0-9a-f]{40}$/i.test(sha) && !/^0+$/.test(sha) ? sha : ''
}

function changedPaths({ base, sha }) {
  const normalizedSha = normalizeSha(sha) || 'HEAD'
  const normalizedBase = normalizeSha(base)
  const args = normalizedBase
    ? ['diff', '--name-only', '--diff-filter=ACDMRTUXB', normalizedBase, normalizedSha]
    : ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', normalizedSha]

  return execFileSync('git', args, { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((path) => path.trim())
    .filter(Boolean)
}

function startsWithAny(path, prefixes) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(prefix))
}

export function detectComponents(paths) {
  const changed = new Set(paths)
  const all = paths.some((path) => startsWithAny(path, SHARED_PATHS))
  const components = {
    backend: all || paths.some((path) => startsWithAny(path, [
      'apps/api/',
      'docker/api.Dockerfile',
      'docker/compose/',
    ])),
    admin: all || paths.some((path) => startsWithAny(path, [
      'apps/admin/',
      'docker/admin.Dockerfile',
      'docker/nginx/',
      'website/',
    ])),
    mobile: all || paths.some((path) => startsWithAny(path, [
      'apps/mobile/',
      'tools/miniprogram-ci/',
      'project.config.json',
      '.github/workflows/deploy-miniprogram-experience.yml',
    ])),
  }

  return {
    ...components,
    paths: [...changed],
  }
}

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith('--')) args.set(argv[index], argv[index + 1] || '')
  }
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const paths = changedPaths({
    base: args.get('--base') || process.env.GITHUB_EVENT_BEFORE,
    sha: args.get('--sha') || process.env.GITHUB_SHA,
  })
  const result = detectComponents(paths)
  const output = [
    `backend=${result.backend}`,
    `admin=${result.admin}`,
    `mobile=${result.mobile}`,
    `changed_paths=${JSON.stringify(result.paths)}`,
  ].join('\n')
  const outputPath = args.get('--output')
  if (outputPath) writeFileSync(outputPath, `${output}\n`, 'utf8')
  process.stdout.write(`${output}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()

export { changedPaths, normalizeSha }
