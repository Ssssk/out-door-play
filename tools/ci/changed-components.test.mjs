import test from 'node:test'
import assert from 'node:assert/strict'
import { detectComponents } from './changed-components.mjs'

test('detects only the component touched by a scoped change', () => {
  assert.deepEqual(detectComponents(['apps/api/src/main.ts']), {
    backend: true,
    admin: false,
    mobile: false,
    paths: ['apps/api/src/main.ts'],
  })
  assert.deepEqual(detectComponents(['apps/admin/src/App.vue']), {
    backend: false,
    admin: true,
    mobile: false,
    paths: ['apps/admin/src/App.vue'],
  })
  assert.deepEqual(detectComponents(['apps/mobile/src/pages/index.vue']), {
    backend: false,
    admin: false,
    mobile: true,
    paths: ['apps/mobile/src/pages/index.vue'],
  })
})

test('runs shared changes for all components', () => {
  assert.deepEqual(detectComponents(['pnpm-lock.yaml']), {
    backend: true,
    admin: true,
    mobile: true,
    paths: ['pnpm-lock.yaml'],
  })
})

test('does not classify unrelated documentation as an application change', () => {
  assert.deepEqual(detectComponents(['README.md']), {
    backend: false,
    admin: false,
    mobile: false,
    paths: ['README.md'],
  })
})
