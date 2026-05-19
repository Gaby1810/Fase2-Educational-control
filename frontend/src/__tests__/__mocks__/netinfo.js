const listeners = [];

const NetInfo = {
    addEventListener: jest.fn((cb) => {
        listeners.push(cb);
        // Simular conexión activa por defecto
        setTimeout(() => cb({ isConnected: true, isInternetReachable: true }), 0);
        return () => {
            const idx = listeners.indexOf(cb);
            if (idx !== -1) listeners.splice(idx, 1);
        };
    }),
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    _simulateChange: (state) => listeners.forEach(cb => cb(state)),
};

module.exports = NetInfo;
