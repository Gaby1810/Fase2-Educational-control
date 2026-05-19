import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { put } from './api';

// Configuración global: cómo se muestran las notificaciones en primer plano
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const EXPO_PROJECT_ID = 'dbebce6a-da6e-42ac-b1eb-b74d5378a175';

/**
 * Pide permiso y devuelve el Expo Push Token del dispositivo.
 * Devuelve null si no se puede obtener (simulador, permisos denegados, etc.).
 */
export async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.warn('[Notifications] Push no disponible en simulador');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permiso denegado');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'EducationalControl',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0D47A1',
        });
    }

    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID });
        return tokenData.data;
    } catch (e) {
        console.warn('[Notifications] No se pudo obtener token:', e.message);
        return null;
    }
}

/**
 * Guarda el push token en el backend para que el servidor pueda enviar notificaciones.
 */
export async function savePushToken(token) {
    if (!token) return;
    try {
        await put('/auth/push-token', { push_token: token });
    } catch (e) {
        console.warn('[Notifications] Error al guardar token:', e.message);
    }
}

/**
 * Configura los listeners de notificaciones y devuelve una función para limpiarlos.
 * - onReceived: se llama cuando llega una notificación mientras la app está abierta
 * - onResponse:  se llama cuando el usuario toca la notificación
 */
export function setupNotificationListeners({ onReceived, onResponse } = {}) {
    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
        onReceived?.(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
        onResponse?.(response);
    });

    return () => {
        receivedSub.remove();
        responseSub.remove();
    };
}

/**
 * Programa una notificación local (útil para recordatorios offline).
 */
export async function scheduleLocalNotification(title, body, secondsFromNow = 5, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: true },
        trigger: { seconds: secondsFromNow },
    });
}
