import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import type { Plugin } from 'vite'

import { DEV_CSP } from './src/main/protocol/csp'

const CSP_META = /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/?>/i

/**
 * index.html ships the production policy. The dev server also needs the Vite
 * HMR WebSocket, so this replaces the meta tag with DEV_CSP while serving.
 * Production builds keep the file untouched, so `ws:` never ships.
 */
function devCspPlugin(): Plugin {
  return {
    name: 'seshat-dev-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      if (!CSP_META.test(html)) {
        throw new Error('index.html is missing the Content-Security-Policy meta tag')
      }
      return html.replace(CSP_META, `<meta http-equiv="Content-Security-Policy" content="${DEV_CSP}" />`)
    }
  }
}

// electron-vite default layout: src/main, src/preload, src/renderer.
// package.json does not declare "type": "module"; therefore main and preload are
// emitted as CJS (required by Electron's sandboxed preload) and the renderer is bundled as ESM.
export default defineConfig({
  main: {
    // yaml and zod are dependencies that main must bundle: electron-builder
    // excludes node_modules from the asar, so an external require would fail
    // in the packaged app. Everything else stays external.
    plugins: [externalizeDepsPlugin({ exclude: ['yaml', 'zod'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [vue(), devCspPlugin()]
  }
})
