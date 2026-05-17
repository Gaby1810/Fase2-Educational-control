import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detección automática del host del backend.
 *
 * - Expo Go (desarrollo): toma la IP del host de Metro automáticamente.
 * - APK compilado: usa LAN_IP_FALLBACK → debe ser la IP del equipo
 *   donde corre el backend (laptop), y el celular en la misma WiFi.
 * - Web: localhost.
 *
 * ⚠️ ANTES DE GENERAR EL APK: pon en LAN_IP_FALLBACK la IP local
 *    del equipo que ejecuta el backend (ej: la que da `ipconfig`).
 */
const PORT = 3000;
const LAN_IP_FALLBACK = '192.168.1.106';

const getHostFromExpo = () => {
  // SDK 49+: hostUri tiene el formato "192.168.x.x:8081"
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoGoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoGo?.developer?.tool ||
    Constants?.manifest?.debuggerHost ||
    '';

  if (typeof hostUri === 'string' && hostUri.includes(':')) {
    return hostUri.split(':')[0];
  }
  return null;
};

const getBaseURL = () => {

  // 1. Desarrollo (Expo Go): Metro nos da la IP del host.
  //    Cubre tanto el emulador como el celular físico en Expo Go.
  const expoHost = getHostFromExpo();
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${PORT}/api`;
  }

  // 2. Web
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }

  // 3. APK compilado (sin Metro) → usa la IP LAN del backend.
  return `http://${LAN_IP_FALLBACK}:${PORT}/api`;
};

const API_BASE_URL = getBaseURL();

export default API_BASE_URL;
