// vite.config.ts
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import * as fs from 'fs'
import * as path from 'path'

// 플러그인 메타데이터 헤더 (RisuAI 플러그인 시스템이 읽는 최상단 주석)
const PLUGIN_METADATA = `//@name log-plugin
//@display-name LOG Plugin
//@api 3.0
//@version 1.0.0
//@description RisuAI chat log exporter (image/HTML/markdown/text) with themes, headers, footers, filters, and replacement rules.
`

// 빌드된 plugin.js 최상단에 메타데이터 헤더를 주입하는 플러그인
function prependMetadataPlugin(metadata: string): Plugin {
  let outDir = ''

  return {
    name: 'vite-plugin-prepend-metadata',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const filePath = path.join(outDir, 'plugin.js')
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        // 중복 주입 방지
        if (content.startsWith('//@name')) return
        fs.writeFileSync(filePath, `${metadata}\n${content}`)
        console.log('✓ Plugin metadata header prepended to plugin.js')
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    prependMetadataPlugin(PLUGIN_METADATA),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `plugin.js`,
        assetFileNames: `[name].[ext]`,
        // 청크 분할 비활성화 (단일 파일로 번들링)
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    modulePreload: {
      polyfill: false
    },
  },
  define: {
    '__NAME__': JSON.stringify('log-plugin'),
    '__DISPLAY_NAME__': JSON.stringify('LOG Plugin'),
    '__VERSION__': JSON.stringify('1.0.0'),
    '__DESCRIPTION__': JSON.stringify('RisuAI chat log exporter with themes, filters, and multi-format export.'),
  }
})