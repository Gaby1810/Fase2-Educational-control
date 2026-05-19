// Extiende expect con matchers de @testing-library/jest-native
require('@testing-library/jest-native/extend-expect');

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock de NetInfo
jest.mock('@react-native-community/netinfo', () =>
    require('./src/__tests__/__mocks__/netinfo')
);

// Mocks de Expo
jest.mock('expo-notifications', () =>
    require('./src/__tests__/__mocks__/expo-notifications')
);

jest.mock('expo-device', () =>
    require('./src/__tests__/__mocks__/expo-device')
);

jest.mock('expo-sqlite', () =>
    require('./src/__tests__/__mocks__/expo-sqlite')
);

// Silenciar warnings esperados en tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
