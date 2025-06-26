import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthResponse, User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = 'http://192.168.18.153:3310'; 

  // Add a flag to prevent multiple refresh attempts
  let isRefreshing = false;
  let refreshPromise: Promise<string | null> | null = null;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      // Add 30 second buffer to avoid edge cases
      return decoded.exp <= (currentTime + 30);
    } catch {
      return true;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const refresh_token = await AsyncStorage.getItem('refresh_token');
        if (!refresh_token) {
          console.log('No refresh token found');
          return null;
        }

        console.log('Attempting to refresh access token...');
        const response = await fetch(`${BASE_URL}/refreshToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            console.log('Token refreshed successfully');
            await AsyncStorage.setItem('token', data.token);
            
            // Update user data with new token
            const decoded: any = jwtDecode(data.token);
            setUser({
              id: decoded.id,
              name: decoded.username || '',
              email: decoded.email || '',
            });
            
            return data.token;
          }
        } else {
          console.log('Token refresh failed with status:', response.status);
          // If refresh fails, clear all tokens and logout
          await AsyncStorage.multiRemove(['token', 'refresh_token']);
          setUser(null);
        }
        return null;
      } catch (error) {
        console.error('Token refresh error:', error);
        // Clear tokens on error
        await AsyncStorage.multiRemove(['token', 'refresh_token']);
        setUser(null);
        return null;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  const getValidToken = async (): Promise<string | null> => {
    try {
      let token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('No token found');
        return null;
      }
      
      if (isTokenExpired(token)) {
        console.log('Token expired, attempting refresh...');
        token = await refreshAccessToken();
      }
      
      return token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
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
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.multiRemove(['token', 'refresh_token']);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.refresh_token) {
          await AsyncStorage.multiSet([
            ['token', data.token],
            ['refresh_token', data.refresh_token]
          ]);

          const decoded: any = jwtDecode(data.token);
          setUser({
            id: decoded.id,
            name: decoded.username || '',
            email: decoded.email || '',
          });

          return { success: true };
        }
      }
      
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Login failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username: name, name })
      });

      if (response.ok) {
        return { success: true, message: 'Registration successful' };
      }
      
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Registration failed' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = async () => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      
      if (refresh_token) {
        await fetch(`${BASE_URL}/logout`, {
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
      logout,
      getValidToken
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