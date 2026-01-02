import React, { createContext, useContext, useState, useEffect } from 'react';
import MusicAPI from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const extractToken = (data) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (typeof data.token === 'string') return data.token;
    if (typeof data.access_token === 'string') return data.access_token;
    if (typeof data.jwt === 'string') return data.jwt;
    if (data.token && typeof data.token.token === 'string') return data.token.token;
    return null;
  };

  // When the provider mounts, check if there's a valid token and load the user profile.
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await MusicAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        // If the token is invalid (or expired), remove it.
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
        }
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      // Login returns a token
      const response = await MusicAPI.login(email, password);
      const token = extractToken(response.data);
      if (!token) {
        return {
          success: false,
          error: 'Login response did not include a token',
        };
      }

      localStorage.setItem('token', token);

      // Immediately fetch the user's profile to set the user state.
      const profileResponse = await MusicAPI.getProfile();
      setUser(profileResponse.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to login'
      };
    }
  };

  // The register function sends the registration data as proper JSON.
  const register = async (username, email, password) => {
    try {
      const response = await MusicAPI.register({ username, email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create account'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
