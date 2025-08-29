// @ts-check
import skyEslintConfig from '@softsky/configs/eslint.config.mjs'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/** @type {import("typescript-eslint").Config} */
export default [
  ...skyEslintConfig,
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite,
  {
    rules: {
      'unicorn/explicit-length-check': 0,
      '@typescript-eslint/no-unsafe-assignment': 0, // Any is used sparingly
      '@typescript-eslint/no-empty-function': 0,
    },
  },
]
