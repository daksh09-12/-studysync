/**
 * StudySync — AuthContext.js
 * Session state manager for authenticated user context
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe, loginUser, registerUser, logoutUser } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // ── Session Auto-Check on Mount (SSDLC: Secure state initialization) ─────
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await getMe();
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (_) {
        // Silent failure (unauthenticated is normal on first visit)
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const login = async (emailOrUsername, password) => {
    setError('');
    try {
      const res = await loginUser({ emailOrUsername, password });
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    setError('');
    try {
      const res = await registerUser({ username, email, password });
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError('');

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
