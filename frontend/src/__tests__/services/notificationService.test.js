import {
    registerForPushNotifications,
    savePushToken,
    scheduleLocalNotification,
} from '../../services/notificationService';

// Mocks configurados en jest.setup.js
const Notifications = require('expo-notifications');
const Device = require('expo-device');

jest.mock('../../services/api', () => ({
    put: jest.fn().mockResolvedValue({ ok: true }),
}));

const { put } = require('../../services/api');

beforeEach(() => {
    jest.clearAllMocks();
    Device.isDevice = true;
});

describe('registerForPushNotifications', () => {
    it('devuelve el token cuando los permisos están concedidos', async () => {
        const token = await registerForPushNotifications();
        expect(token).toBe('ExponentPushToken[test-token-123]');
        expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
    });

    it('solicita permisos cuando no están concedidos', async () => {
        Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
        const token = await registerForPushNotifications();
        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        expect(token).toBe('ExponentPushToken[test-token-123]');
    });

    it('devuelve null cuando el permiso es denegado', async () => {
        Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
        Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
        const token = await registerForPushNotifications();
        expect(token).toBeNull();
    });

    it('devuelve null en simulador (isDevice = false)', async () => {
        Device.isDevice = false;
        const token = await registerForPushNotifications();
        expect(token).toBeNull();
    });
});

describe('savePushToken', () => {
    it('llama al endpoint del backend con el token', async () => {
        await savePushToken('ExponentPushToken[abc]');
        expect(put).toHaveBeenCalledWith('/auth/push-token', { push_token: 'ExponentPushToken[abc]' });
    });

    it('no llama al backend si el token es null', async () => {
        await savePushToken(null);
        expect(put).not.toHaveBeenCalled();
    });

    it('no lanza error si el backend falla', async () => {
        put.mockRejectedValueOnce(new Error('Network error'));
        await expect(savePushToken('ExponentPushToken[abc]')).resolves.not.toThrow();
    });
});

describe('scheduleLocalNotification', () => {
    it('programa una notificación local', async () => {
        await scheduleLocalNotification('Título', 'Cuerpo', 10);
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
            content: {
                title: 'Título',
                body: 'Cuerpo',
                data: {},
                sound: true,
            },
            trigger: { seconds: 10 },
        });
    });
});
