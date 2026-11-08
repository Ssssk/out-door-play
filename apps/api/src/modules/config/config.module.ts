import { Module } from '@nestjs/common'
import { ConfigController } from './config.controller'
import { SceneTabsConfigService } from './scene-tabs-config.service'

@Module({
  controllers: [ConfigController],
  providers: [SceneTabsConfigService],
  exports: [SceneTabsConfigService],
})
export class ConfigModule {}
