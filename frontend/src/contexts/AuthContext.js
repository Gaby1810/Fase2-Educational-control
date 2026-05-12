import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToken, removeToken } from '../services/api';

const USER_KEY = 'auth_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión persistida al iniciar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) setUsuario(JSON.parse(raw));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (token, user) => {
    await saveToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    setUsuario(user);
  };

  const logout = async () => {
    await removeToken();
    await AsyncStorage.removeItem(USER_KEY);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
