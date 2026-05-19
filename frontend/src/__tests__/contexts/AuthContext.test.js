import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

jest.mock('../../services/api', () => ({
    saveToken: jest.fn().mockResolvedValue(undefined),
    removeToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/database', () => ({
    initDatabase: jest.fn(),
}));

jest.mock('../../services/notificationService', () => ({
    registerForPushNotifications: jest.fn().mockResolvedValue('ExponentPushToken[test]'),
    savePushToken: jest.fn().mockResolvedValue(undefined),
    setupNotificationListeners: jest.fn().mockReturnValue(jest.fn()),
}));

const { saveToken, removeToken } = require('../../services/api');
const { initDatabase } = require('../../services/database');
const notificationService = require('../../services/notificationService');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        require('@react-native-async-storage/async-storage').clear();
    });

    it('inicia con usuario null y loading true, luego false', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.usuario).toBeNull();
    });

    it('inicializa la base de datos al montar', async () => {
        renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(initDatabase).toHaveBeenCalled());
    });

    it('login guarda token y usuario, actualiza estado', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        const user = { id: 1, nombre: 'Ana', rol: 'estudiante' };

        await act(async () => {
            await result.current.login('jwt-token-123', user);
        });

        expect(saveToken).toHaveBeenCalledWith('jwt-token-123');
        expect(result.current.usuario).toEqual(user);
    });

    it('login registra el push token', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.login('jwt-token', { id: 2, rol: 'docente' });
        });

        // Esperar que fire-and-forget termine
        await waitFor(() =>
            expect(notificationService.registerForPushNotifications).toHaveBeenCalled()
        );
        await waitFor(() =>
            expect(notificationService.savePushToken).toHaveBeenCalledWith('ExponentPushToken[test]')
        );
    });

    it('logout limpia token y usuario', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.login('jwt-token', { id: 1 });
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(removeToken).toHaveBeenCalled();
        expect(result.current.usuario).toBeNull();
    });

    it('restaura la sesión desde AsyncStorage al montar', async () => {
        const savedUser = { id: 5, nombre: 'Carlos', rol: 'administrador' };
        await require('@react-native-async-storage/async-storage').setItem(
            'auth_user',
            JSON.stringify(savedUser)
        );

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.usuario).toEqual(savedUser);
    });

    it('lanza error si useAuth se usa fuera del provider', () => {
        // Silenciar el error de consola de React
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth debe usarse dentro de <AuthProvider>'
        );
        spy.mockRestore();
    });
});
