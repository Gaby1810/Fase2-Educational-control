import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detección automática del host del backend.
 *
 * - Físico (Expo Go o build): toma la IP del host de Metro automáticamente.
 *   Si no la encuentra, cae al valor por defecto LAN_IP.
 * - Emulador Android: 10.0.2.2 → localhost del host.
 * - Web / iOS simulator: localhost.
 */
const PORT = 3000;
const LAN_IP_FALLBACK = '192.168.0.5';

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

  // 1. Si Metro nos dio la IP del host (caso típico Expo Go en celular)
  const expoHost = getHostFromExpo();
  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:${PORT}/api`;
  }

  // 2. Emulador Android
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}/api`;
  }

  // 3. Web / iOS simulator
  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    return `http://localhost:${PORT}/api`;
  }

  // 4. Último recurso
  return `http://${LAN_IP_FALLBACK}:${PORT}/api`;
};

const API_BASE_URL = getBaseURL();

export default API_BASE_URL;
