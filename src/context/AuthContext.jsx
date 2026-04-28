import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    if (api.token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // Token invalid, clear it
      api.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    const data = await api.register(email, password, name);
    api.setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    api.setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}