// @ts-check
import skyEslintConfig from '@softsky/configs/eslint.config.mjs'

/** @type {import("typescript-eslint").Config} */
export default [
  ...skyEslintConfig,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': [
        2,
        {
          allowConstantLoopConditions: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        1,
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 0,
      'unicorn/expiring-todo-comments': 0,
    },
  },
]
