import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateAuditReport } from './audit-with-exceptions.mjs'

function report(advisories) {
  return { advisories: Object.fromEntries(advisories.map((item, index) => [index, item])) }
}

const approved = [
  {
    github_advisory_id: 'GHSA-c27g-q93r-2cwf',
    module_name: 'vite',
    severity: 'high'
  },
  {
    github_advisory_id: 'GHSA-fx2h-pf6j-xcff',
    module_name: 'vite',
    severity: 'high'
  }
]

test('accepts only the two approved Vite advisories before expiry', () => {
  const decision = evaluateAuditReport(report(approved), new Date('2026-09-05T00:00:00Z'))
  assert.equal(decision.blockers.length, 0)
  assert.equal(decision.accepted.length, 2)
})

test('blocks an unapproved high advisory', () => {
  const decision = evaluateAuditReport(
    report([...approved, { github_advisory_id: 'GHSA-new-risk', module_name: 'other', severity: 'high' }]),
    new Date('2026-09-05T00:00:00Z')
  )
  assert.equal(decision.blockers.length, 1)
})

test('blocks approved advisories after expiry', () => {
  const decision = evaluateAuditReport(report(approved), new Date('2026-09-16T00:00:00Z'))
  assert.equal(decision.blockers.length, 2)
})

test('never accepts a critical advisory under a high-only exception', () => {
  const critical = [{ ...approved[0], severity: 'critical' }]
  const decision = evaluateAuditReport(report(critical), new Date('2026-09-05T00:00:00Z'))
  assert.equal(decision.blockers.length, 1)
})
