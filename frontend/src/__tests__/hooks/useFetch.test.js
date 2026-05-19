import { renderHook, act, waitFor } from '@testing-library/react-native';
import useFetch from '../../hooks/useFetch';

jest.mock('../../services/api', () => ({
    get: jest.fn(),
}));

jest.mock('../../services/database', () => ({
    getCache: jest.fn().mockReturnValue(null),
    setCache: jest.fn(),
}));

jest.mock('../../hooks/useNetworkStatus', () => jest.fn().mockReturnValue(true));

const { get } = require('../../services/api');
const { getCache, setCache } = require('../../services/database');
const useNetworkStatus = require('../../hooks/useNetworkStatus');

beforeEach(() => {
    jest.clearAllMocks();
    useNetworkStatus.mockReturnValue(true);
    getCache.mockReturnValue(null);
});

describe('useFetch – modo online', () => {
    it('carga datos al montar', async () => {
        get.mockResolvedValueOnce({ items: [1, 2] });

        const { result } = renderHook(() => useFetch('/api/items'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toEqual({ items: [1, 2] });
        expect(result.current.error).toBeNull();
        expect(result.current.fromCache).toBe(false);
    });

    it('guarda en caché la respuesta exitosa', async () => {
        get.mockResolvedValueOnce({ total: 5 });

        renderHook(() => useFetch('/api/stats'));

        await waitFor(() => expect(setCache).toHaveBeenCalled());
        expect(setCache).toHaveBeenCalledWith('/api/stats', { total: 5 });
    });

    it('expone error cuando la petición falla', async () => {
        get.mockRejectedValueOnce(new Error('Error del servidor'));

        const { result } = renderHook(() => useFetch('/api/fail'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Error del servidor');
    });

    it('no carga al montar cuando auto = false', () => {
        const { result } = renderHook(() => useFetch('/api/items', { auto: false }));
        expect(result.current.loading).toBe(false);
        expect(get).not.toHaveBeenCalled();
    });
});

describe('useFetch – modo offline', () => {
    beforeEach(() => {
        useNetworkStatus.mockReturnValue(false);
    });

    it('sirve datos del caché cuando no hay conexión', async () => {
        const cached = { items: ['cached'] };
        getCache.mockReturnValue(cached);

        const { result } = renderHook(() => useFetch('/api/items'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual(cached);
        expect(result.current.fromCache).toBe(true);
        expect(get).not.toHaveBeenCalled();
    });

    it('retorna error cuando no hay caché ni conexión', async () => {
        getCache.mockReturnValue(null);

        const { result } = renderHook(() => useFetch('/api/items'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('No hay conexión a internet');
    });

    it('usa el caché como fallback cuando get() falla por red', async () => {
        useNetworkStatus.mockReturnValue(true);
        get.mockRejectedValueOnce(new Error('No hay conexión a internet'));
        const cached = { fallback: true };
        getCache.mockReturnValue(cached);

        const { result } = renderHook(() => useFetch('/api/items'));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual(cached);
        expect(result.current.fromCache).toBe(true);
    });
});

describe('useFetch – refetch / refresh', () => {
    it('refetch vuelve a llamar la API', async () => {
        get.mockResolvedValue({ v: 1 });

        const { result } = renderHook(() => useFetch('/api/items'));
        await waitFor(() => expect(result.current.loading).toBe(false));

        get.mockResolvedValueOnce({ v: 2 });
        act(() => { result.current.refetch(); });

        await waitFor(() => expect(result.current.data).toEqual({ v: 2 }));
    });
});
