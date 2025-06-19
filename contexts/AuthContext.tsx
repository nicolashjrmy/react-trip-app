import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthResponse, User } from '../types';
import { useApi } from './ApiContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiCall } = useApi();

  useEffect(() => {
    checkAuthStatus();
  }, []);

const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      setUser({
        id: decoded.id,
        name: decoded.username || '',
        email: decoded.email || '',
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
  } finally {
    setLoading(false);
  }
};

const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await apiCall('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      const decoded: any = jwtDecode(response.token);
      setUser({
        id: decoded.id,
        name: decoded.username || '',
        email: decoded.email || '',
      });
      return { success: true };
    }
    return { success: false, error: 'Invalid response' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

  const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    try {
    const response = await apiCall('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
    });
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    setUser(null);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};