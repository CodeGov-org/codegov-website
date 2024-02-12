const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [],
  theme: {
    colors: {
      white: colors.white,
      black: colors.black,
      slate: colors.slate,
      transparent: 'transparent',
      error: '#f43f53',
      primary: {
        50: '#f1f9fe',
        100: '#e2f2fc',
        200: '#bfe6f8',
        300: '#86d1f3',
        400: '#46baea',
        DEFAULT: '#29abe2',
        600: '#1082b9',
        700: '#0e6896',
        800: '#10577c',
        900: '#134967',
        950: '#0d2f44',
      },
    },
  },
};
