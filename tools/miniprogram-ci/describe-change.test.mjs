import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDescription, truncateDescription } from './describe-change.mjs'

test('builds a scoped description from the commit subject and changed paths', () => {
  assert.equal(
    buildDescription({
      subject: 'feat: update route cards',
      paths: [
        'apps/mobile/src/pages/routes/index.vue',
        '.github/workflows/deploy-miniprogram-experience.yml',
      ],
    }),
    'feat: update route cards（小程序、发布流程）',
  )
})

test('normalizes whitespace and caps the WeChat description at 128 characters', () => {
  const description = truncateDescription(`  ${'摘要 '.repeat(100)}  `)
  assert.equal(Array.from(description).length, 128)
  assert.equal(description.endsWith('…'), true)
})
