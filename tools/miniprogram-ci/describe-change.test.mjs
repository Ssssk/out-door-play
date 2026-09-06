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
    '新增功能：更新路线卡片（小程序、发布流程）',
  )
})

test('keeps release remarks in Chinese for an unknown English subject', () => {
  const description = buildDescription({
    subject: 'fix: update an-untranslated-component',
    paths: ['apps/api/src/main.ts'],
  })
  assert.equal(description, '修复问题（后端）')
  assert.equal(/[a-z]/i.test(description), false)
})

test('preserves a Chinese commit subject', () => {
  assert.equal(
    buildDescription({ subject: '修复路线卡片显示', paths: ['apps/mobile/src/pages/routes/index.vue'] }),
    '修复路线卡片显示（小程序）',
  )
})

test('normalizes whitespace and caps the WeChat description at 128 characters', () => {
  const description = truncateDescription(`  ${'摘要 '.repeat(100)}  `)
  assert.equal(Array.from(description).length, 128)
  assert.equal(description.endsWith('…'), true)
})
