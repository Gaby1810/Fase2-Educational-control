const mockDb = {
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn().mockReturnValue(null),
    getAllSync: jest.fn().mockReturnValue([]),
};

module.exports = {
    openDatabaseSync: jest.fn(() => mockDb),
    _mockDb: mockDb,
};
