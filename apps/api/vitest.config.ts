import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

/**
 * api 包的 vitest 配置。
 *
 * 为什么必须用 SWC 而不是默认 esbuild：esbuild 不支持 `emitDecoratorMetadata`，
 * 而集成测试会 `NestFactory.create(AppModule)` 走完整 Nest DI——
 * 没有装饰器元数据时 `FuelService(PrismaService, ...)` 等构造参数解析不到，
 * 直接 `UndefinedDependencyException` 崩掉整个 vitest worker（表现为 tinypool "Channel closed"）。
 * 单元测试直接 `new` 实例不走 DI，所以此前只有 integration/e2e 门禁会红。
 */
export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
  },
})
