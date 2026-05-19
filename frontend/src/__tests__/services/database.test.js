import {
    initDatabase,
    setCache,
    getCache,
    clearCache,
    addPendingAction,
    getPendingActions,
    removePendingAction,
    clearPendingActions,
} from '../../services/database';

// El mock de expo-sqlite está configurado en jest.setup.js
const { _mockDb } = require('expo-sqlite');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('database – initDatabase', () => {
    it('crea las tablas cache y pending_actions', () => {
        initDatabase();
        expect(_mockDb.execSync).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS cache')
        );
        expect(_mockDb.execSync).toHaveBeenCalledWith(
            expect.stringContaining('CREATE TABLE IF NOT EXISTS pending_actions')
        );
    });
});

describe('database – setCache / getCache', () => {
    it('guarda datos serializados con timestamp', () => {
        const data = { items: [1, 2, 3] };
        setCache('/api/test', data);
        expect(_mockDb.runSync).toHaveBeenCalledWith(
            'INSERT OR REPLACE INTO cache (key, data, ts) VALUES (?, ?, ?)',
            ['/api/test', JSON.stringify(data), expect.any(Number)]
        );
    });

    it('devuelve null cuando no hay fila en caché', () => {
        _mockDb.getFirstSync.mockReturnValueOnce(null);
        const result = getCache('/api/test');
        expect(result).toBeNull();
    });

    it('devuelve null cuando el caché expiró', () => {
        _mockDb.getFirstSync.mockReturnValueOnce({
            data: JSON.stringify({ ok: true }),
            ts: Date.now() - 10 * 60 * 1000, // 10 minutos atrás
        });
        const result = getCache('/api/test', 5 * 60 * 1000); // TTL 5 min
        expect(result).toBeNull();
    });

    it('devuelve datos cuando el caché está vigente', () => {
        const payload = { nombre: 'test' };
        _mockDb.getFirstSync.mockReturnValueOnce({
            data: JSON.stringify(payload),
            ts: Date.now() - 60 * 1000, // 1 minuto atrás
        });
        const result = getCache('/api/test', 5 * 60 * 1000);
        expect(result).toEqual(payload);
    });
});

describe('database – clearCache', () => {
    it('elimina una clave específica', () => {
        clearCache('/api/test');
        expect(_mockDb.runSync).toHaveBeenCalledWith(
            'DELETE FROM cache WHERE key = ?',
            ['/api/test']
        );
    });

    it('elimina todo el caché sin argumentos', () => {
        clearCache();
        expect(_mockDb.runSync).toHaveBeenCalledWith('DELETE FROM cache');
    });
});

describe('database – pending actions', () => {
    it('addPendingAction inserta la acción serializada', () => {
        const body = { titulo: 'Tarea 1' };
        addPendingAction('POST', '/api/tareas/crear', body);
        expect(_mockDb.runSync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO pending_actions'),
            ['POST', '/api/tareas/crear', JSON.stringify(body), expect.any(Number)]
        );
    });

    it('addPendingAction acepta body null', () => {
        addPendingAction('DELETE', '/api/tareas/1', undefined);
        expect(_mockDb.runSync).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO pending_actions'),
            ['DELETE', '/api/tareas/1', null, expect.any(Number)]
        );
    });

    it('getPendingActions devuelve lista de acciones', () => {
        const mockActions = [
            { id: 1, method: 'POST', endpoint: '/api/tareas/crear', body: null, created_at: 1000 },
        ];
        _mockDb.getAllSync.mockReturnValueOnce(mockActions);
        const result = getPendingActions();
        expect(result).toEqual(mockActions);
    });

    it('removePendingAction elimina por id', () => {
        removePendingAction(5);
        expect(_mockDb.runSync).toHaveBeenCalledWith(
            'DELETE FROM pending_actions WHERE id = ?',
            [5]
        );
    });

    it('clearPendingActions elimina todas', () => {
        clearPendingActions();
        expect(_mockDb.runSync).toHaveBeenCalledWith('DELETE FROM pending_actions');
    });
});
