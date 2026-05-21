/**
 * StudySync — Auth.js
 * Choose Nickname UI (Bypassed Accounts)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const navigate = useNavigate();
  const { user, loginNickname, error, clearError, loading } = useAuth();

  const [nickname, setNickname] = useState('');
  const [formError, setFormError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Redirect if nickname already selected
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    const name = nickname.trim();
    if (!name) {
      setFormError('Please enter a display name.');
      return;
    }

    if (name.length < 3) {
      setFormError('Name must be at least 3 characters.');
      return;
    }

    if (name.length > 20) {
      setFormError('Name cannot exceed 20 characters.');
      return;
    }

    setSubmitLoading(true);
    try {
      loginNickname(name);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Failed to set display name.');
    } finally {
      setSubmitLoading(false);
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
            Enter a display name to start collaborating with peers in real-time.
          </p>
        </div>

        {/* Error Alerts */}
        {(formError || error) && (
          <div className="auth-error-alert" role="alert">
            <span>⚠️</span> {formError || error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <div className="auth-input-wrapper">
              <label htmlFor="nickname">Your Display Name</label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="e.g., Daksh, Alice"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                required
                autoFocus
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary auth-submit-btn"
            disabled={submitLoading}
          >
            {submitLoading && <span className="btn-spinner" />}
            {submitLoading ? 'Entering…' : 'Enter StudySync'}
          </button>
        </form>
      </div>
    </div>
  );
}
