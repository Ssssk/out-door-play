import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const excludedDirectories = new Set(['.git', '.pnpm-store', 'dist', 'node_modules', 'generated', 'evidence'])
const excludedNames = new Set(['pnpm-lock.yaml'])
const allowedExtensions = new Set(['.ts', '.vue', '.mjs', '.js', '.json', '.yaml', '.yml', '.md', '.scss', '.css', '.prisma', '.sql'])
const findings = []
const patterns = [
  { name: 'private key material', value: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
  { name: 'GitHub token', value: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/u },
  { name: 'OpenAI key', value: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/u },
  { name: 'AWS access key', value: /\bAKIA[0-9A-Z]{16}\b/u },
]

function visit(relativePath) {
  const absolutePath = path.resolve(process.cwd(), relativePath)
  const stat = fs.statSync(absolutePath)
  if (stat.isDirectory()) {
    if (excludedDirectories.has(path.basename(absolutePath))) return
    for (const entry of fs.readdirSync(absolutePath)) {
      if (entry === '.env' || entry.startsWith('.env.')) continue
      visit(path.join(relativePath, entry))
    }
    return
  }
  if (excludedNames.has(path.basename(absolutePath)) || !allowedExtensions.has(path.extname(absolutePath))) return
  const content = fs.readFileSync(absolutePath, 'utf8')
  for (const pattern of patterns) {
    if (pattern.value.test(content)) findings.push(`${relativePath}: ${pattern.name}`)
  }
}

for (const root of ['apps', 'scripts', '.github', '.harness']) visit(root)
for (const file of ['package.json', 'compose.yaml', 'pnpm-workspace.yaml']) visit(file)

if (findings.length > 0) {
  console.error(`Secret scan failed with ${findings.length} finding(s). Values are intentionally not printed.`)
  findings.forEach((finding) => console.error(`- ${finding}`))
  process.exit(1)
}
console.log('Secret scan passed; local .env files were excluded without reading their contents.')
