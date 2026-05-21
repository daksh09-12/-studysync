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
    function checkSession() {
      try {
        const userJson = localStorage.getItem('studysync_user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (_) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const loginNickname = (nickname) => {
    setError('');
    const mockUser = {
      id:       nickname,
      username: nickname,
      email:    `${nickname}@studysync.local`,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('studysync_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  const login = async (emailOrUsername, password) => {
    return loginNickname(emailOrUsername);
  };

  const register = async (username, email, password) => {
    return loginNickname(username);
  };

  const logout = async () => {
    localStorage.removeItem('studysync_user');
    setUser(null);
  };

  const clearError = () => setError('');

  const value = {
    user,
    loading,
    error,
    login,
    register,
    loginNickname,
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
