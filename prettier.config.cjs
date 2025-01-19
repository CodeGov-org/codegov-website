/** @type {import("prettier").Options} */
module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  htmlWhitespaceSensitivity: 'strict',
  plugins: ['prettier-plugin-astro', 'prettier-plugin-motoko'],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
