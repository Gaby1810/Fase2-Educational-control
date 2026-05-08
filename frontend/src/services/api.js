import API_BASE_URL from '../constants/api';

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
};

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