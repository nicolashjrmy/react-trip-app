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

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      if (!refresh_token) return null;

      const response = await apiCall('/refreshToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });

      if (response.token) {
        await AsyncStorage.setItem('token', response.token);
        return response.token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  const getValidToken = async (): Promise<string | null> => {
    let token = await AsyncStorage.getItem('token');
    
    if (!token) return null;
    
    if (isTokenExpired(token)) {
      token = await refreshAccessToken();
    }
    
    return token;
  };

  const checkAuthStatus = async () => {
    try {
      const token = await getValidToken();
      if (token) {
        const decoded: any = jwtDecode(token);
        setUser({
          id: decoded.id,
          name: decoded.username || '',
          email: decoded.email || '',
        });
      } else {
        await AsyncStorage.multiRemove(['token', 'refresh_token']);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.multiRemove(['token', 'refresh_token']);
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

      if (response.token && response.refresh_token) {
        await AsyncStorage.multiSet([
          ['token', response.token],
          ['refresh_token', response.refresh_token]
        ]);

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
        body: JSON.stringify({ email, password, username: name, name })
      });
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      
      if (refresh_token) {
        await apiCall('/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token })
        });
      }

      await AsyncStorage.multiRemove(['token', 'refresh_token']);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      await AsyncStorage.multiRemove(['token', 'refresh_token']);
      setUser(null);
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