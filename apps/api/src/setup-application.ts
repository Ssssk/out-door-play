import { Logger, UnprocessableEntityException, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import type { INestApplication } from '@nestjs/common'
import { AllExceptionsFilter } from './common/all-exceptions.filter'
import { ResponseInterceptor } from './common/response.interceptor'
import { allowedAdminOrigins } from './modules/admin-auth/admin-origin'

export function configureApplication(app: INestApplication): void {
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174').split(',')
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/u
  const allowDevelopmentOrigin = process.env.NODE_ENV !== 'production'
  app.enableCors({
    credentials: true,
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) =>
      callback(null, !origin || origins.includes(origin) || (allowDevelopmentOrigin && localOrigin.test(origin))),
  })
  if (process.env.NODE_ENV === 'production' && allowedAdminOrigins().size === 0) {
    new Logger('Bootstrap').warn('ADMIN_ALLOWED_ORIGINS 与 CORS_ORIGINS 均为空：后台管理请求将仅接受与 API 同源的 Origin。请在部署环境中显式配置域名白名单（例如 https://www.chumenliuliu.cloud）。')
  }
  app.setGlobalPrefix('v1')
  const httpAdapter = app.getHttpAdapter()
  if (!httpAdapter.useStaticAssets) throw new Error('当前 HTTP 适配器不支持静态文件服务')
  httpAdapter.useStaticAssets(process.env.UPLOAD_DIR || 'uploads', {
    prefix: '/v1/uploads',
    maxAge: '30d',
    index: false,
  })
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => new UnprocessableEntityException({
      code: 'COMMON_VALIDATION_FAILED',
      message: '请求参数不符合要求',
      details: errors.map((error) => ({ field: error.property, rules: Object.keys(error.constraints || {}) })),
    }),
  }))
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())
}

export function createOpenApiDocument(app: INestApplication, mount = false) {
  const config = new DocumentBuilder()
    .setTitle('粗门溜溜本地 API')
    .setDescription('小程序 v1 本地开发接口；数据由 MySQL + Prisma 持久化。')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'opaque' }, 'mobileBearer')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  if (mount) SwaggerModule.setup('v1/docs', app, document)
  return document
}
