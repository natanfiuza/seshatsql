import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// electron-vite default layout: src/main, src/preload, src/renderer.
// package.json does not declare "type": "module"; therefore main and preload are
// emitted as CJS (required by Electron's sandboxed preload) and the renderer is bundled as ESM.
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [vue()]
  }
})
