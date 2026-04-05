import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Mock user for UI verification
    if (import.meta.env.DEV) {
      setUser({
        id: 'mock-id',
        nombre: 'Administrador de Pruebas',
        email: 'admin@sunpartners.com',
        role: 'ADMIN'
      });
      setLoading(false);
    } else {
      checkAuth();
    }
  }, []);

  const login = async (identifier, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { identifier, password });
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await axios.post(`${API_URL}/auth/logout`);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
