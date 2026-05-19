import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { saveToken, removeToken } from '../services/api';
import { initDatabase } from '../services/database';
import {
    registerForPushNotifications,
    savePushToken,
    setupNotificationListeners,
} from '../services/notificationService';

const USER_KEY = 'auth_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    // Inicializar BD local + restaurar sesión al arrancar
    useEffect(() => {
        try {
            initDatabase();
        } catch (e) {
            console.warn('[DB] Error al inicializar:', e.message);
        }

        (async () => {
            try {
                const raw = await AsyncStorage.getItem(USER_KEY);
                if (raw) setUsuario(JSON.parse(raw));
            } catch {}
            setLoading(false);
        })();

        const tokenListener = DeviceEventEmitter.addListener('onTokenExpired', () => {
            logout();
        });

        // Listener de notificaciones (navegación al tocar una notificación)
        const cleanupNotifications = setupNotificationListeners({
            onResponse: (response) => {
                const data = response.notification.request.content.data;
                console.log('[Notification] Tapped:', data);
                // La navegación específica se puede agregar aquí con un ref al navigator
            },
        });

        return () => {
            tokenListener.remove();
            cleanupNotifications();
        };
    }, []);

    const login = async (token, user) => {
        await saveToken(token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        setUsuario(user);

        // Registrar push token después del login (fire-and-forget)
        registerForPushNotifications()
            .then(pushToken => savePushToken(pushToken))
            .catch(e => console.warn('[Push] Error en registro:', e.message));
    };

    const logout = async () => {
        await removeToken();
        await AsyncStorage.removeItem(USER_KEY);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}
