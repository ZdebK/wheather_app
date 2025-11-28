const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // By default, skip integration tests unless explicitly enabled
  testPathIgnorePatterns: runIntegration ? [] : ['/src/__tests__/integration/'],
  // Load env vars and reflect-metadata before tests
  setupFiles: ['dotenv/config', 'reflect-metadata'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
