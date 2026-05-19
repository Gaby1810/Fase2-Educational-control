import { useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncPendingActions } from '../services/syncService';

/**
 * Detecta si hay conexión a internet y dispara la sincronización
 * de acciones pendientes al recuperar la red.
 *
 * @returns {boolean} isConnected
 */
export default function useNetworkStatus() {
    const [isConnected, setIsConnected] = useState(true);
    const wasOffline = useRef(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = !!(state.isConnected && state.isInternetReachable !== false);

            setIsConnected(online);

            if (online && wasOffline.current) {
                syncPendingActions();
            }

            wasOffline.current = !online;
        });

        return () => unsubscribe();
    }, []);

    return isConnected;
}
