import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext } from 'react';

interface ApiContextType {
  apiCall: (endpoint: string, options?: RequestInit & { body?: any }) => Promise<any>;
  BASE_URL: string;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const BASE_URL = 'http://localhost:3310'; // Replace with your API URL

  const apiCall = async (endpoint: string, options: RequestInit & { body?: any } = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    
    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      const formData = new URLSearchParams();
      Object.keys(options.body).forEach(key => {
        const value = options.body[key];
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      });
      config.body = formData.toString();
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return (
    <ApiContext.Provider value={{ apiCall, BASE_URL }}>
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