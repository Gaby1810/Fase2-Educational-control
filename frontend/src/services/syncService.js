import { getPendingActions, removePendingAction } from './database';
import * as api from './api';

const METHOD_MAP = {
    POST: (ep, body) => api.post(ep, body),
    PUT: (ep, body) => api.put(ep, body),
    DELETE: (ep) => api.del(ep),
};

/**
 * Intenta ejecutar todas las acciones que se encolaron mientras no había internet.
 * Las acciones exitosas se eliminan. Las que fallan por red permanecen en cola.
 * Las que fallan por error del servidor se descartan (no reintentables).
 */
export async function syncPendingActions() {
    const pending = getPendingActions();
    if (pending.length === 0) return;

    console.log(`[Sync] ${pending.length} acción(es) pendiente(s)`);

    for (const action of pending) {
        try {
            const body = action.body ? JSON.parse(action.body) : undefined;
            const fn = METHOD_MAP[action.method.toUpperCase()];

            if (!fn) {
                removePendingAction(action.id);
                continue;
            }

            await fn(action.endpoint, body);
            removePendingAction(action.id);
            console.log(`[Sync] OK: ${action.method} ${action.endpoint}`);
        } catch (e) {
            if (e.message === 'No hay conexión a internet') {
                // Sigue sin red — dejar en cola
                console.warn(`[Sync] Sin red, reintentando después`);
                break;
            }
            // Error del servidor (4xx/5xx) — descartar para no bloquear la cola
            console.warn(`[Sync] Descartando acción ${action.id}: ${e.message}`);
            removePendingAction(action.id);
        }
    }
}
