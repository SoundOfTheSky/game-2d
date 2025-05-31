// @ts-check
import skyEslintConfig from '@softsky/configs/eslint.config.mjs'

/** @type {import("typescript-eslint").Config} */
export default [
  ...skyEslintConfig,
  {
    rules: {
      'unicorn/explicit-length-check': 0,
      '@typescript-eslint/no-unsafe-assignment': 0, // Any is used sparingly
      '@typescript-eslint/no-empty-function': 0,
    }
  }
]
