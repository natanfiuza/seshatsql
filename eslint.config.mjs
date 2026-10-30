import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

// ESLint 10 only ships the JavaScript parser; .ts files require typescript-eslint.
export default tseslint.config(
  { ignores: ['node_modules/**', 'out/**', 'dist/**'] },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser }
    }
  }
)
