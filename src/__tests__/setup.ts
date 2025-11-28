// Jest setup file
// Add global test configurations here if needed

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs:
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error, // Keep errors visible
};
