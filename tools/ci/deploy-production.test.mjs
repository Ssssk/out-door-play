import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workflowUrl = new URL('../../.github/workflows/deploy-production.yml', import.meta.url)

test('production deployment injects dedicated WeChat secrets without logging them', async () => {
  const workflow = await readFile(workflowUrl, 'utf8')

  assert.match(workflow, /WECHAT_APP_ID: \$\{\{ secrets\.WECHAT_APP_ID \}\}/)
  assert.match(workflow, /WECHAT_APP_SECRET: \$\{\{ secrets\.WECHAT_APP_SECRET \}\}/)
  assert.match(workflow, /CORS_ORIGINS: \$\{\{ secrets\.CORS_ORIGINS \}\}/)
  assert.match(workflow, /ADMIN_ALLOWED_ORIGINS: \$\{\{ secrets\.ADMIN_ALLOWED_ORIGINS \}\}/)
  assert.match(workflow, /ADMIN_COOKIE_SECURE: \$\{\{ secrets\.ADMIN_COOKIE_SECURE \}\}/)
  assert.match(workflow, /test -n "\$WECHAT_APP_ID"/)
  assert.match(workflow, /test -n "\$WECHAT_APP_SECRET"/)
  assert.match(workflow, /test -n "\$CORS_ORIGINS"/)
  assert.match(workflow, /test -n "\$ADMIN_ALLOWED_ORIGINS"/)
  assert.match(workflow, /test "\$ADMIN_COOKIE_SECURE" = "true"/)
  assert.match(workflow, /sed '[^']*\/\^WECHAT_APP_ID=\/d; \/\^WECHAT_APP_SECRET=\/d;/)
  assert.match(workflow, /\/\^CORS_ORIGINS=\/d; \/\^ADMIN_ALLOWED_ORIGINS=\/d; \/\^ADMIN_COOKIE_SECURE=\/d/)
  assert.match(workflow, /WECHAT_APP_ID=%s\\nWECHAT_APP_SECRET=%s/)
  assert.match(workflow, /CORS_ORIGINS=%s\\nADMIN_ALLOWED_ORIGINS=%s\\nADMIN_COOKIE_SECURE=%s/)
  assert.doesNotMatch(workflow, /echo "\$WECHAT_APP_(?:ID|SECRET)"/)
})

test('production smoke test rejects an invalid WeChat code instead of accepting provider unavailability', async () => {
  const workflow = await readFile(workflowUrl, 'utf8')

  assert.match(workflow, /auth\/wechat\/login/)
  assert.match(workflow, /AUTH_STATUS.*== '401'/)
  assert.match(workflow, /body\.get\('code'\) == 'AUTH_CODE_INVALID'/)
})
