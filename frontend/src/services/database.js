import * as SQLite from 'expo-sqlite';

const DB_NAME = 'educationalcontrol.db';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos por defecto

let _db = null;

function getDB() {
    if (!_db) {
        _db = SQLite.openDatabaseSync(DB_NAME);
    }
    return _db;
}

/**
 * Inicializa las tablas locales. Llamar una vez al arrancar la app.
 */
export function initDatabase() {
    const db = getDB();
    db.execSync(`
        CREATE TABLE IF NOT EXISTS cache (
            key   TEXT    PRIMARY KEY,
            data  TEXT    NOT NULL,
            ts    INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pending_actions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            method     TEXT    NOT NULL,
            endpoint   TEXT    NOT NULL,
            body       TEXT,
            created_at INTEGER NOT NULL
        );
    `);
}

// =====================
// CACHÉ
// =====================

export function setCache(key, data) {
    const db = getDB();
    db.runSync(
        'INSERT OR REPLACE INTO cache (key, data, ts) VALUES (?, ?, ?)',
        [key, JSON.stringify(data), Date.now()]
    );
}

export function getCache(key, ttl = CACHE_TTL_MS) {
    const db = getDB();
    const row = db.getFirstSync('SELECT data, ts FROM cache WHERE key = ?', [key]);
    if (!row) return null;
    if (Date.now() - row.ts > ttl) return null;
    try {
        return JSON.parse(row.data);
    } catch {
        return null;
    }
}

export function clearCache(key) {
    const db = getDB();
    if (key) {
        db.runSync('DELETE FROM cache WHERE key = ?', [key]);
    } else {
        db.runSync('DELETE FROM cache');
    }
}

// =====================
// ACCIONES PENDIENTES (modo offline)
// =====================

export function addPendingAction(method, endpoint, body) {
    const db = getDB();
    db.runSync(
        'INSERT INTO pending_actions (method, endpoint, body, created_at) VALUES (?, ?, ?, ?)',
        [method, endpoint, body !== undefined ? JSON.stringify(body) : null, Date.now()]
    );
}

export function getPendingActions() {
    const db = getDB();
    return db.getAllSync('SELECT * FROM pending_actions ORDER BY created_at ASC');
}

export function removePendingAction(id) {
    const db = getDB();
    db.runSync('DELETE FROM pending_actions WHERE id = ?', [id]);
}

export function clearPendingActions() {
    const db = getDB();
    db.runSync('DELETE FROM pending_actions');
}
