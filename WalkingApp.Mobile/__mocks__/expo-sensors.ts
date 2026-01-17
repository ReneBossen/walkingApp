export const Pedometer = {
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  isAvailableAsync: jest.fn(async () => true),
  getStepCountAsync: jest.fn(async () => ({ steps: 0 })),
  watchStepCount: jest.fn(() => ({ remove: jest.fn() })),
};

export default {
  Pedometer,
};
