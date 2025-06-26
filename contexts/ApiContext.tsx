import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface ApiContextType {
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const BASE_URL = 'http://192.168.18.153:3310'; 
  const { getValidToken } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const url = `${BASE_URL}${endpoint}`;
    
    const publicEndpoints = ['/login', '/register', '/refreshToken'];
    const isPublicEndpoint = publicEndpoints.includes(endpoint);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Only add authorization header for protected endpoints
    if (!isPublicEndpoint) {
      const token = await getValidToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // If we can't get a valid token, throw an error
        throw new Error('Authentication required');
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
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