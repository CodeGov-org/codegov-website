/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@cg/(.*)$': '<rootDir>/../../../lib/$1',
  },
};
