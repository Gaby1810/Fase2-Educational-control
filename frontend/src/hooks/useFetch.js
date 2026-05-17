import { useState, useEffect, useCallback } from 'react';
import { get } from '../services/api';

/**
 * Hook reutilizable para consumir endpoints GET de la API.
 *
 * Centraliza el patrón repetido en casi todas las pantallas:
 * estados de carga, error, datos y recarga (pull-to-refresh).
 *
 * Uso:
 *   const { data, loading, refreshing, error, refetch, refresh } = useFetch('/admin/stats');
 *
 * @param {string}  endpoint  Ruta de la API (ej: '/admin/reportes').
 * @param {object}  options   { auto: boolean } — si auto es false, no carga al montar.
 */
export default function useFetch(endpoint, { auto = true } = {}) {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(auto);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const ejecutar = useCallback(async (esRefresh = false) => {
    if (!endpoint) return;
    try {
      if (esRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await get(endpoint);
      setData(res);

    } catch (e) {
      setError(e.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (auto) ejecutar(false);
  }, [ejecutar, auto]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => ejecutar(false),  // recarga normal (con spinner)
    refresh: () => ejecutar(true),   // recarga para pull-to-refresh
  };
}
