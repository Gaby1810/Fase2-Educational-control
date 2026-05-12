import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../constants/api';

const TOKEN_KEY = 'auth_token';

// =====================
// HELPERS DE TOKEN
// =====================
export const saveToken = async (token) => {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// =====================
// REQUEST GENÉRICO
// =====================
const request = async (endpoint, options = {}) => {

  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const token = await getToken();

  const config = {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {

    const response = await fetch(url, config);
    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.log("RESPUESTA NO JSON:", text);
      throw new Error("El servidor no devolvió JSON");
    }

    if (!response.ok) {
      throw new Error(data.error || "Error en la solicitud");
    }

    return data;

  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
};

// =====================
// MÉTODOS PÚBLICOS
// =====================
export const post = (endpoint, body, options = {}) =>
  request(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });

export const get = (endpoint, options = {}) =>
  request(endpoint, {
    method: 'GET',
    ...options,
  });

export const put = (endpoint, body, options = {}) =>
  request(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options,
  });

export const del = (endpoint, options = {}) =>
  request(endpoint, { method: 'DELETE', ...options });
