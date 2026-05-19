import { useState, useEffect, useCallback } from 'react';
import { get } from '../services/api';
import { getCache, setCache } from '../services/database';
import useNetworkStatus from './useNetworkStatus';

/**
 * Hook reutilizable para consumir endpoints GET de la API.
 * Cuando no hay conexión sirve datos del caché SQLite local.
 *
 * @param {string}  endpoint
 * @param {object}  options
 *   auto:      boolean — si false, no carga al montar (default true)
 *   cacheTTL:  number  — tiempo de vida del caché en ms (default 5 min)
 */
export default function useFetch(endpoint, { auto = true, cacheTTL } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(auto);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [fromCache, setFromCache] = useState(false);

    const isConnected = useNetworkStatus();

    const ejecutar = useCallback(async (esRefresh = false) => {
        if (!endpoint) return;

        try {
            if (esRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            if (!isConnected) {
                const cached = getCache(endpoint, cacheTTL);
                if (cached) {
                    setData(cached);
                    setFromCache(true);
                    return;
                }
                throw new Error('No hay conexión a internet');
            }

            const res = await get(endpoint);
            setCache(endpoint, res);
            setData(res);
            setFromCache(false);

        } catch (e) {
            // Fallback al caché si hay error de red
            if (
                e.message === 'No hay conexión a internet' ||
                e.message === 'Network request failed'
            ) {
                const cached = getCache(endpoint, cacheTTL);
                if (cached) {
                    setData(cached);
                    setFromCache(true);
                    setError(null);
                    return;
                }
            }
            setError(e.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [endpoint, isConnected, cacheTTL]);

    useEffect(() => {
        if (auto) ejecutar(false);
    }, [ejecutar, auto]);

    return {
        data,
        loading,
        refreshing,
        error,
        fromCache,
        refetch: () => ejecutar(false),
        refresh: () => ejecutar(true),
    };
}
