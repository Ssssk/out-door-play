import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureApplication, createOpenApiDocument } from './setup-application'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  configureApplication(app)
  app.enableShutdownHooks()
  createOpenApiDocument(app, true)

  await app.listen(Number(process.env.PORT || 3100), '0.0.0.0')
}

void bootstrap()
