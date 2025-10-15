/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test timeout for async operations (30 seconds)
jest.setTimeout(30 * 1000);

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSolanaAddress(): R;
      toBeValidURL(): R;
      toBeWithinRange(min: number, max: number): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidSolanaAddress(received: string) {
    try {
      const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(received);
      return {
        message: () => `expected ${received} to be a valid Solana address`,
        pass: isValid,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a string`,
        pass: false,
      };
    }
  },

  toBeValidURL(received: string) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },

  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    return {
      message: () => `expected ${received} to be within range ${min} - ${max}`,
      pass,
    };
  },
});

// Mock fetch for HTTP requests
global.fetch = jest.fn();

// Mock WebSocket for testing
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
}));

// Setup test logger
const testLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export { testLogger };
