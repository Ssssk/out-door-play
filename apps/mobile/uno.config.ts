import { defineConfig, transformerDirectives } from 'unocss'
import { presetWeapp } from 'unocss-preset-weapp'
import { transformerClass } from 'unocss-preset-weapp/transformer'

export default defineConfig({
  presets: [presetWeapp({ isH5: process.env.UNI_PLATFORM === 'h5', platform: 'uniapp', preflight: false })],
  transformers: [transformerDirectives(), transformerClass()],
  theme: { colors: { primary: 'var(--wot-color-theme, #ccff00)', ink: 'var(--chumen-ink, #1a1a1a)', canvas: 'var(--chumen-canvas, #fffef9)' } },
  shortcuts: { 'safe-bottom': 'pb-[constant(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)]', 'full-screen': 'min-h-screen h-[100vh] h-[100dvh]' },
})
