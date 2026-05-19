import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * URL del backend:
 * - Producción (APK/AAB): expo.extra.apiUrl o EXPO_PUBLIC_API_URL (Railway HTTPS)
 * - Expo Go: IP de Metro automáticamente
 * - Web: localhost
 */
const PORT = 3000;
const LAN_IP_FALLBACK = '192.168.1.106';

const productionUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants?.expoConfig?.extra?.apiUrl ||
  null;

const getHostFromExpo = () => {
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
  // 1. Producción: Railway u otro servidor público (APK compilado)
  if (productionUrl) {
    return productionUrl.replace(/\/$/, '');
  }

  // 2. Desarrollo (Expo Go): Metro nos da la IP del host
  const expoHost = getHostFromExpo();
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${PORT}/api`;
  }

  // 3. Web
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}/api`;
  }

  // 4. Fallback legacy (misma WiFi, backend local)
  return `http://${LAN_IP_FALLBACK}:${PORT}/api`;
};

const API_BASE_URL = getBaseURL();

export default API_BASE_URL;
