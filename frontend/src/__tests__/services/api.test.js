import { get, post, put, del, saveToken, getToken, removeToken } from '../../services/api';

// Mock de AsyncStorage configurado en jest.setup.js
const AsyncStorage = require('@react-native-async-storage/async-storage');

global.fetch = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
});

const mockJsonResponse = (body, status = 200) =>
    Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        text: () => Promise.resolve(JSON.stringify(body)),
    });

describe('token helpers', () => {
    it('saveToken guarda el token en AsyncStorage', async () => {
        await saveToken('mi-jwt-123');
        const stored = await AsyncStorage.getItem('auth_token');
        expect(stored).toBe('mi-jwt-123');
    });

    it('getToken devuelve el token guardado', async () => {
        await AsyncStorage.setItem('auth_token', 'token-abc');
        const token = await getToken();
        expect(token).toBe('token-abc');
    });

    it('removeToken elimina el token', async () => {
        await AsyncStorage.setItem('auth_token', 'token-abc');
        await removeToken();
        const token = await getToken();
        expect(token).toBeNull();
    });
});

describe('GET request', () => {
    it('realiza la petición con header Authorization', async () => {
        await AsyncStorage.setItem('auth_token', 'bearer-token');
        fetch.mockImplementationOnce(() => mockJsonResponse({ data: 'ok' }));

        const result = await get('/api/test');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/test'),
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer bearer-token',
                }),
            })
        );
        expect(result).toEqual({ data: 'ok' });
    });

    it('lanza error con mensaje del servidor en respuesta no-ok', async () => {
        fetch.mockImplementationOnce(() => mockJsonResponse({ error: 'No autorizado' }, 401));
        await expect(get('/api/test')).rejects.toThrow('No autorizado');
    });

    it('lanza "No hay conexión a internet" cuando fetch falla por red', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Network request failed')));
        await expect(get('/api/test')).rejects.toThrow('No hay conexión a internet');
    });
});

describe('POST request', () => {
    it('envía body como JSON', async () => {
        fetch.mockImplementationOnce(() => mockJsonResponse({ ok: true }));

        await post('/api/login', { correo: 'a@b.com', password: '123456' });

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ correo: 'a@b.com', password: '123456' }),
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            })
        );
    });

    it('no incluye Content-Type cuando el body es FormData', async () => {
        fetch.mockImplementationOnce(() => mockJsonResponse({ ok: true }));
        const formData = new FormData();

        await post('/api/upload', formData);

        const callHeaders = fetch.mock.calls[0][1].headers;
        expect(callHeaders['Content-Type']).toBeUndefined();
    });
});
