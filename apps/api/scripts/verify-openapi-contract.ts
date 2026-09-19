import { NestFactory } from '@nestjs/core'
import { parse } from 'yaml'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { AppModule } from '../src/app.module'
import { configureApplication, createOpenApiDocument } from '../src/setup-application'

interface ContractOperation { operationId?: string }
interface ContractDocument {
  openapi?: string
  paths?: Record<string, Record<string, ContractOperation>>
}

const contractPaths = [
  '../../.harness/changes/admin-foundation/contracts/openapi.yaml',
  '../../.harness/changes/mobile-identity-foundation/contracts/openapi.yaml',
  '../../.harness/changes/mobile-discovery/contracts/openapi.yaml',
  '../../.harness/changes/prd-v1-1-rebuild/contracts/fuel-openapi.yaml',
]

function readContract(relativePath: string): ContractDocument {
  const contract = parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')) as ContractDocument
  if (!contract.openapi?.startsWith('3.') || !contract.paths || Object.keys(contract.paths).length === 0) {
    throw new Error(`OpenAPI contract is missing a valid version or paths: ${relativePath}`)
  }
  return contract
}

async function main() {
  const contracts = contractPaths.map(readContract)
  const app = await NestFactory.create(AppModule, { logger: false })
  try {
    configureApplication(app)
    const runtime = createOpenApiDocument(app)
    const missing: string[] = []
    const operationMismatches: string[] = []
    let operationCount = 0

    for (const contract of contracts) {
      for (const [route, operations] of Object.entries(contract.paths || {})) {
        for (const [method, expected] of Object.entries(operations).filter(([value]) => ['get', 'post', 'put', 'patch', 'delete'].includes(value))) {
          operationCount += 1
          const actual = runtime.paths[route]?.[method as keyof (typeof runtime.paths)[string]]
          if (!actual) {
            missing.push(`${method.toUpperCase()} ${route}`)
            continue
          }
          if (expected.operationId && actual.operationId !== expected.operationId) {
            operationMismatches.push(`${method.toUpperCase()} ${route}: ${String(actual.operationId)} != ${expected.operationId}`)
          }
        }
      }
    }

    if (missing.length > 0) throw new Error(`Runtime OpenAPI is missing contracted operations: ${missing.join(', ')}`)
    if (operationMismatches.length > 0) throw new Error(`Runtime OpenAPI operationId mismatch: ${operationMismatches.join(', ')}`)
    console.log(`OpenAPI contract passed for ${operationCount} operation(s) across ${contracts.length} contract(s).`)
  } finally {
    await app.close()
  }
}

void main()
