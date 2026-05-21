/**
 * StudySync — ProtectedRoute.js
 * Restricts route access to logged-in sessions only
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="room-loading">
        <div className="spinner" />
        <p>Verifying secure session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page if unauthenticated
    return <Navigate to="/auth" replace />;
  }

  return children;
}
