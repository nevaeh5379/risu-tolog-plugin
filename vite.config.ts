// vite.config.ts
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import * as fs from 'fs'
import * as path from 'path'

// 주입할 안정성 패치 코드
const stabilityPatchCode = `if (globalThis.__pluginApis__ && globalThis.__pluginApis__.setArg) {
    const originalSetArg = globalThis.__pluginApis__.setArg;
    globalThis.__pluginApis__.setArg = function (arg, value) {
        if (typeof arg !== 'string') {
            console.warn('Hello React Plugin: A plugin called setArg with an invalid argument. Crash prevented. Arg:', arg);
            return;
        }
        return originalSetArg.call(this, arg, value);
    };
}
`;

function prependCodePlugin(codeToPrepend: string): Plugin {
  let outDir = '';
  
  return {
    name: 'vite-plugin-prepend-code',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      // 모든 빌드가 완료된 후 실행
      const filePath = path.join(outDir, 'plugin.js');
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(filePath, `${codeToPrepend}\n${content}`);
        console.log('✓ Stability patch prepended to plugin.js');
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    prependCodePlugin(stabilityPatchCode),
    cssInjectedByJsPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `plugin.js`,
        assetFileNames: `[name].[ext]`,
      },
    },
    modulePreload: {
      polyfill: false
    },
  },
  define: {
    '__NAME__': JSON.stringify('Hello React Plugin'),
    '__DISPLAY_NAME__': JSON.stringify('Hello React'),
    '__VERSION__': JSON.stringify('1.0'),
    '__DESCRIPTION__': JSON.stringify('A simple Hello World plugin for RisuAI using React and TypeScript.'),
  }
})