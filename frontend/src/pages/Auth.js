/**
 * StudySync — Auth.js
 * Session Authentication UI (SSDLC)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const navigate = useNavigate();
  const { user, login, register, error, clearError, loading } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');

  // Input states
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formError, setFormError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Redirect if already logged in (SSDLC Session check)
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Clear errors when toggling modes
  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setFormError('');
    clearError();
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    // Front-end validations (SSDLC: Sanity checks)
    if (mode === 'login') {
      if (!emailOrUsername.trim() || !password) {
        setFormError('Please enter all credentials.');
        return;
      }
      
      setSubmitLoading(true);
      try {
        await login(emailOrUsername.trim(), password);
        navigate('/', { replace: true });
      } catch (err) {
        // Error is set in AuthContext
      } finally {
        setSubmitLoading(false);
      }
    } else {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        setFormError('Please fill in all fields.');
        return;
      }

      if (username.trim().length < 3) {
        setFormError('Username must be at least 3 characters.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setFormError('Please enter a valid email address.');
        return;
      }

      if (password.length < 8) {
        setFormError('Password must be at least 8 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }

      setSubmitLoading(true);
      try {
        await register(username.trim(), email.trim(), password);
        navigate('/', { replace: true });
      } catch (err) {
        // Error is set in AuthContext
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-background-effects">
        <div className="glow-circle glow-circle-1"></div>
        <div className="glow-circle glow-circle-2"></div>
      </div>

      <div className="auth-card glass-panel">
        <div className="auth-card__header">
          <h1 className="auth-card__brand">StudySync</h1>
          <p className="auth-card__subtitle">
            {mode === 'login' 
              ? 'Sign in to access your collaborative study rooms' 
              : 'Create a secure account to start collaborating'}
          </p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => handleToggleMode('login')}
          >
            Login
          </button>
          <button 
            type="button"
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => handleToggleMode('register')}
          >
            Register
          </button>
        </div>

        {/* Error Alerts */}
        {(formError || error) && (
          <div className="auth-error-alert" role="alert">
            <span>⚠️</span> {formError || error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'login' ? (
            /* LOGIN FIELDS */
            <div className="auth-form__group">
              <div className="auth-input-wrapper">
                <label htmlFor="emailOrUsername">Email or Username</label>
                <input
                  id="emailOrUsername"
                  type="text"
                  placeholder="name@example.com or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  maxLength={100}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          ) : (
            /* REGISTER FIELDS */
            <div className="auth-form__group">
              <div className="auth-input-wrapper">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="studysyncer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-input-wrapper">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary auth-submit-btn"
            disabled={submitLoading}
          >
            {submitLoading && <span className="btn-spinner" />}
            {submitLoading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}
