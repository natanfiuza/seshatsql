import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Component tests import .vue files; the renderer build uses the same plugin.
  plugins: [vue()],
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.ts'],
    // Node by default; component tests opt into jsdom with a per-file docblock.
    environment: 'node'
  }
})
