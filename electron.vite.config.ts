import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// Layout padrão do electron-vite: src/main, src/preload, src/renderer.
// O package.json não declara "type": "module"; por isso main e preload saem como
// CJS (exigido pelo preload sandboxed do Electron) e o renderer é empacotado como ESM.
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
