import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PORT = 3000;

const getBaseURL = () => {
  if (Constants.isDevice) {
    // 📱 Celular físico
    return "http://192.168.0.52:3000/api";
  }

  if (Platform.OS === 'android') {
    // 🤖 Emulador Android
    return "http://10.0.2.2:3000/api";
  }

  // 💻 Web o iOS
  return "http://localhost:3000/api";
};

const API_BASE_URL = getBaseURL();

export default API_BASE_URL;