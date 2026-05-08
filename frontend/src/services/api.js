import API_BASE_URL from '../constants/api';

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
};

export const post = (endpoint, body) =>
  request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });