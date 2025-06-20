import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext } from 'react';

interface ApiContextType {
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const BASE_URL = 'http://192.168.18.153:3310'; 
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

      const response = await fetch(`${BASE_URL}/refreshToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
          return data.token;
        }
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

  const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const url = `${BASE_URL}${endpoint}`;
    
    const publicEndpoints = ['/login', '/register', '/refreshToken'];
    const isPublicEndpoint = publicEndpoints.includes(endpoint);
    
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

    if (!isPublicEndpoint) {
      const token = await getValidToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API call failed');
    }

    return response.json();
  };

  return (
    <ApiContext.Provider value={{ apiCall }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};