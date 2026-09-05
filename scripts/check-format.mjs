import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const roots = ['apps', 'scripts', '.github']
const extensions = new Set(['.ts', '.vue', '.mjs', '.json', '.yaml', '.yml', '.scss', '.css', '.md'])
const excluded = new Set(['dist', 'node_modules', 'generated', 'evidence'])
const failures = []

function visit(relativePath) {
  const absolutePath = path.resolve(process.cwd(), relativePath)
  if (!fs.existsSync(absolutePath)) return
  const stat = fs.statSync(absolutePath)
  if (stat.isDirectory()) {
    if (excluded.has(path.basename(absolutePath))) return
    for (const entry of fs.readdirSync(absolutePath)) visit(path.join(relativePath, entry))
    return
  }
  if (!extensions.has(path.extname(absolutePath))) return
  const content = fs.readFileSync(absolutePath, 'utf8')
  if (content.startsWith('\uFEFF')) failures.push(`${relativePath}: unexpected UTF-8 BOM`)
  if (content.includes('\t')) failures.push(`${relativePath}: tab character`)
  if (!content.endsWith('\n')) failures.push(`${relativePath}: missing final newline`)
  content.split(/\r?\n/u).forEach((line, index) => {
    if (/[ \t]+$/u.test(line)) failures.push(`${relativePath}:${index + 1}: trailing whitespace`)
  })
}

for (const root of roots) visit(root)
for (const file of ['package.json', 'pnpm-workspace.yaml', 'compose.yaml', 'eslint.config.mjs']) visit(file)

if (failures.length > 0) {
  console.error(`Format policy failed with ${failures.length} issue(s):`)
  failures.slice(0, 100).forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Format policy passed.')
