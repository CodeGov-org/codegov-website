module.exports = {
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', 'shim.js'],
  overrides: [
    {
      files: ['.eslintrc.{js,cjs}'],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: 'script',
      },
      rules: {},
    },
    {
      files: ['*.mjs'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: '2015',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      env: {
        browser: true,
        es2021: true,
      },
      extends: ['standard-with-typescript', 'plugin:react/recommended'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./src/*/tsconfig.json', './src/*/*/tsconfig.json'],
      },
      plugins: ['react'],
      rules: {
        '@typescript-eslint/semi': 'off',
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
        '@typescript-eslint/triple-slash-reference': 'off',
        '@typescript-eslint/space-before-function-paren': 'off',
        '@typescript-eslint/quotes': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        'import/first': 'off',
      },
    },
  ],
};
