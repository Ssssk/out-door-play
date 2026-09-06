import { access, mkdir, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ci = require('miniprogram-ci')

const toolDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(toolDir, '../..')
const validateOnly = process.argv.includes('--validate-only')

const projectPath = resolveFromRepo(
  process.env.WECHAT_MINIPROGRAM_PROJECT_PATH
    || 'apps/mobile/dist/build/mp-weixin',
)
const privateKeyPath = path.resolve(requireEnv('WECHAT_MINIPROGRAM_PRIVATE_KEY_PATH'))
const configuredAppId = process.env.WECHAT_MINIPROGRAM_APPID?.trim()
const robot = parseRobot(process.env.WECHAT_MINIPROGRAM_ROBOT || '1')
const version = validateOnly
  ? 'validate-only'
  : validateVersion(requireEnv('WECHAT_MINIPROGRAM_VERSION'))
const description = validateOnly
  ? 'validate-only'
  : validateDescription(requireEnv('WECHAT_MINIPROGRAM_DESC'))
const qrCodePath = resolveFromRepo(
  process.env.WECHAT_MINIPROGRAM_QR_PATH
    || 'artifacts/wechat-preview-qrcode.jpg',
)

try {
  await validateFile(path.join(projectPath, 'app.json'), '小程序 app.json')
  const projectConfigPath = path.join(projectPath, 'project.config.json')
  await validateFile(projectConfigPath, '小程序 project.config.json')
  await validatePrivateKey(privateKeyPath)

  const projectConfig = JSON.parse(await readFile(projectConfigPath, 'utf8'))
  const appid = String(projectConfig.appid || '').trim()
  if (!/^wx[a-zA-Z0-9]{16}$/.test(appid)) {
    throw new Error('构建产物中的 AppID 无效')
  }
  if (configuredAppId && configuredAppId !== appid) {
    throw new Error('GitHub AppID 变量与构建产物 AppID 不一致')
  }

  const project = new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath,
    privateKeyPath,
    ignores: ['node_modules/**/*'],
  })

  if (validateOnly) {
    console.log(`小程序 CI 配置校验通过：${appid}`)
    process.exit(0)
  }

  const setting = {
    es6: true,
    es7: true,
    minify: true,
    codeProtect: false,
    autoPrefixWXSS: true,
  }

  console.log(`开始上传微信小程序开发版本：${version}（robot ${robot}）`)
  await ci.upload({
    project,
    version,
    desc: description,
    robot,
    setting,
  })
  console.log('微信小程序开发版本上传成功')

  await mkdir(path.dirname(qrCodePath), { recursive: true })
  console.log('开始生成体验预览二维码')
  await ci.preview({
    project,
    desc: description,
    robot,
    setting,
    qrcodeFormat: 'image',
    qrcodeOutputDest: qrCodePath,
  })
  console.log(`体验预览二维码已生成：${path.relative(repoRoot, qrCodePath)}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`微信小程序 CI 失败：${redactSensitiveText(message)}`)
  process.exit(1)
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`缺少必需环境变量 ${name}`)
  }
  return value
}

function resolveFromRepo(value) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value)
}

async function validateFile(filePath, label) {
  try {
    await access(filePath, constants.R_OK)
  } catch {
    throw new Error(`${label} 不存在或不可读：${filePath}`)
  }
}

async function validatePrivateKey(filePath) {
  await validateFile(filePath, '微信小程序上传私钥')
  const content = await readFile(filePath, 'utf8')
  if (!/^-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+-----END (?:RSA )?PRIVATE KEY-----\s*$/.test(content)) {
    throw new Error('微信小程序上传私钥格式无效')
  }
}

function parseRobot(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
    throw new Error('WECHAT_MINIPROGRAM_ROBOT 必须是 1 到 30 的整数')
  }
  return parsed
}

function validateVersion(value) {
  if (!/^[0-9A-Za-z._-]{1,64}$/.test(value)) {
    throw new Error('微信小程序版本号格式无效')
  }
  return value
}

function validateDescription(value) {
  if (value.length > 128) {
    throw new Error('微信小程序版本描述不能超过 128 个字符')
  }
  return value
}

function redactSensitiveText(value) {
  return value
    .replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/([?&](?:access_token|token|ticket|signature)=)[^&\s]+/gi, '$1[REDACTED]')
}
