// Suppress console warnings in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
