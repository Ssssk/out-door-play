import path from 'node:path'
import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'
import AutoImport from 'unplugin-auto-import/vite'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UnoCSS from 'unocss/vite'

const uni = ((uniModule as unknown as { default?: typeof uniModule }).default || uniModule) as typeof uniModule

export default defineConfig({
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  server: { host: process.env.MOBILE_DEV_HOST || '127.0.0.1', port: 5173, strictPort: true },
  plugins: [
    AutoImport({ imports: ['vue', 'pinia', 'uni-app'], dts: 'src/types/auto-imports.d.ts' }),
    Components({ resolvers: [WotResolver()], dts: 'src/types/components.d.ts' }),
    UnoCSS(),
    uni(),
  ],
  build: { target: 'es2018', cssCodeSplit: true },
})
