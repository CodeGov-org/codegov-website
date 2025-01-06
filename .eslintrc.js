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
    '**/loader/**',
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
      rules: {
        '@typescript-eslint/triple-slash-reference': 0,
      },
    },
    {
      files: ['src/frontend/**/*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
        'plugin:import/typescript',
        'prettier',
      ],
      plugins: ['import'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        project: ['./src/frontend/tsconfig.json'],
      },
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
          },
        },
        'import/internal-regex': '^(@cg/.*|~.*)',
      },
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
        '@typescript-eslint/array-type': [
          'error',
          { default: 'array-simple', readonly: 'array-simple' },
        ],
        '@typescript-eslint/consistent-indexed-object-style': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          { overrides: { constructors: 'no-public' } },
        ],
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: ['typeLike', 'enumMember'], format: ['PascalCase'] },
          {
            selector: 'variable',
            modifiers: ['exported', 'const'],
            format: ['UPPER_CASE'],
          },
        ],
        'import/order': [
          'error',
          {
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
            groups: [
              ['builtin', 'external'],
              ['internal', 'parent', 'sibling', 'index'],
            ],
            'newlines-between': 'always',
            pathGroups: [
              {
                pattern: '~/**',
                group: 'internal',
                position: 'before',
              },
              {
                pattern: './**',
                group: 'parent',
                position: 'after',
              },
            ],
            pathGroupsExcludedImportTypes: [],
            distinctGroup: false,
          },
        ],
      },
    },
  ],
};
