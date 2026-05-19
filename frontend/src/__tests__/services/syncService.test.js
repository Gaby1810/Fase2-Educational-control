import { syncPendingActions } from '../../services/syncService';

jest.mock('../../services/database', () => ({
    getPendingActions: jest.fn(),
    removePendingAction: jest.fn(),
}));

jest.mock('../../services/api', () => ({
    post: jest.fn(),
    put: jest.fn(),
    del: jest.fn(),
}));

const { getPendingActions, removePendingAction } = require('../../services/database');
const api = require('../../services/api');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('syncPendingActions', () => {
    it('no hace nada si no hay acciones pendientes', async () => {
        getPendingActions.mockReturnValue([]);
        await syncPendingActions();
        expect(api.post).not.toHaveBeenCalled();
        expect(api.put).not.toHaveBeenCalled();
    });

    it('ejecuta un POST pendiente y lo elimina de la cola', async () => {
        const action = {
            id: 1,
            method: 'POST',
            endpoint: '/api/tareas/crear',
            body: JSON.stringify({ titulo: 'Tarea test' }),
        };
        getPendingActions.mockReturnValue([action]);
        api.post.mockResolvedValueOnce({ ok: true });

        await syncPendingActions();

        expect(api.post).toHaveBeenCalledWith('/api/tareas/crear', { titulo: 'Tarea test' });
        expect(removePendingAction).toHaveBeenCalledWith(1);
    });

    it('ejecuta un PUT pendiente y lo elimina de la cola', async () => {
        const action = {
            id: 2,
            method: 'PUT',
            endpoint: '/api/auth/perfil',
            body: JSON.stringify({ nombre: 'Juan' }),
        };
        getPendingActions.mockReturnValue([action]);
        api.put.mockResolvedValueOnce({ ok: true });

        await syncPendingActions();

        expect(api.put).toHaveBeenCalledWith('/api/auth/perfil', { nombre: 'Juan' });
        expect(removePendingAction).toHaveBeenCalledWith(2);
    });

    it('mantiene la acción en cola cuando no hay red', async () => {
        const action = {
            id: 3,
            method: 'POST',
            endpoint: '/api/tareas/crear',
            body: null,
        };
        getPendingActions.mockReturnValue([action]);
        api.post.mockRejectedValueOnce(new Error('No hay conexión a internet'));

        await syncPendingActions();

        expect(removePendingAction).not.toHaveBeenCalled();
    });

    it('descarta la acción si el servidor devuelve error 4xx/5xx', async () => {
        const action = {
            id: 4,
            method: 'POST',
            endpoint: '/api/tareas/crear',
            body: null,
        };
        getPendingActions.mockReturnValue([action]);
        api.post.mockRejectedValueOnce(new Error('Error en la solicitud'));

        await syncPendingActions();

        expect(removePendingAction).toHaveBeenCalledWith(4);
    });

    it('procesa múltiples acciones en orden', async () => {
        const actions = [
            { id: 5, method: 'POST', endpoint: '/api/a', body: null },
            { id: 6, method: 'PUT', endpoint: '/api/b', body: null },
        ];
        getPendingActions.mockReturnValue(actions);
        api.post.mockResolvedValueOnce({ ok: true });
        api.put.mockResolvedValueOnce({ ok: true });

        await syncPendingActions();

        expect(removePendingAction).toHaveBeenCalledWith(5);
        expect(removePendingAction).toHaveBeenCalledWith(6);
    });
});
