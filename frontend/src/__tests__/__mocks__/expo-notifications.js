const AndroidImportance = { MAX: 5 };

module.exports = {
    AndroidImportance,
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test-token-123]' }),
    addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
};
