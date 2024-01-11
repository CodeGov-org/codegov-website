/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'prettier'],
  ignorePatterns: [
    '**/dist/**',
    '**/build/**',
    '**/.docusaurus/**',
    '**/.dfx/**',
    'eslint.config.js',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.{js,cjs,mjs}'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
      env: {
        node: true,
      },
    },
    {
      files: ['**/*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
    },
    {
      files: ['src/{docs,marketing}/**/*.{js,jsx,ts,tsx}'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:mdx/recommended',
        'prettier',
      ],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        project: ['./src/{docs,marketing}/tsconfig.json'],
      },
    },
    {
      files: ['src/frontend/**/*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
        'prettier',
      ],
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
          },
        ],
      },
    },
  ],
};
