module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },
  testEnvironment: 'node',
  testMatch: ['**/*.(test|spec).(ts|tsx)'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(tsx|ts|js)?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/', '/dist/', '^.+\\.module\\.(css|sass|scss)$'],
};
