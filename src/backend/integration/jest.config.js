/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@cg/(.*)$': '<rootDir>/../../../lib/$1',
  },
  globalSetup: '<rootDir>/src/global-setup.ts',
  globalTeardown: '<rootDir>/src/global-teardown.ts',
  testTimeout: 60_000,
  detectOpenHandles: true,
};
