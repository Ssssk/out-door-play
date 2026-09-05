import { spawnSync } from 'node:child_process'

export const APPROVED_EXCEPTIONS = new Map([
  [
    'GHSA-c27g-q93r-2cwf',
    {
      moduleName: 'vite',
      expiresAt: '2026-09-15T15:59:59Z'
    }
  ],
  [
    'GHSA-fx2h-pf6j-xcff',
    {
      moduleName: 'vite',
      expiresAt: '2026-09-15T15:59:59Z'
    }
  ]
])

const blockingSeverities = new Set(['high', 'critical'])

export function evaluateAuditReport(report, now = new Date()) {
  const advisories = Object.values(report?.advisories ?? {})
  const accepted = []
  const blockers = []

  for (const advisory of advisories) {
    if (!blockingSeverities.has(advisory.severity)) continue

    const id = advisory.github_advisory_id
    const exception = APPROVED_EXCEPTIONS.get(id)
    if (!exception) {
      blockers.push(`${id || advisory.id || 'unknown'}: unapproved ${advisory.severity} advisory`)
      continue
    }
    if (advisory.severity !== 'high' || advisory.module_name !== exception.moduleName) {
      blockers.push(`${id}: approved exception does not match package or severity`)
      continue
    }
    if (now.getTime() > Date.parse(exception.expiresAt)) {
      blockers.push(`${id}: approved exception expired at ${exception.expiresAt}`)
      continue
    }
    accepted.push({ id, expiresAt: exception.expiresAt })
  }

  return { accepted, blockers }
}

function run() {
  const onWindows = process.platform === 'win32'
  const auditCommand = onWindows ? 'cmd.exe' : 'pnpm'
  const auditArguments = onWindows
    ? ['/d', '/s', '/c', 'pnpm audit --json --registry=https://registry.npmjs.org --prod --audit-level high']
    : ['audit', '--json', '--registry=https://registry.npmjs.org', '--prod', '--audit-level', 'high']
  const audit = spawnSync(
    auditCommand,
    auditArguments,
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  )

  if (audit.error) {
    console.error(`Dependency audit failed to start: ${audit.error.message}`)
    process.exit(1)
  }
  if (![0, 1].includes(audit.status)) {
    console.error(`Dependency audit failed unexpectedly with exit code ${audit.status}`)
    process.exit(1)
  }

  let report
  try {
    report = JSON.parse(audit.stdout)
  } catch {
    console.error('Dependency audit returned invalid JSON.')
    process.exit(1)
  }
  if (!report?.advisories || !report?.metadata?.vulnerabilities) {
    console.error('Dependency audit report is missing required fields.')
    process.exit(1)
  }

  const { accepted, blockers } = evaluateAuditReport(report)
  if (blockers.length > 0) {
    console.error('Dependency audit blocked:')
    blockers.forEach((blocker) => console.error(`- ${blocker}`))
    process.exit(1)
  }

  accepted.forEach(({ id, expiresAt }) => {
    console.log(`Accepted temporary exception: ${id}, expires ${expiresAt}`)
  })
  console.log('Dependency audit policy passed.')
}

if (process.argv[1]?.endsWith('audit-with-exceptions.mjs')) run()
