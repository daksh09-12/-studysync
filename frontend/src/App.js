/**
 * StudySync — App.js
 * CO5: React Router — SPA routing, React 18 functional component
 * Protected sessions integrated
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Room from './pages/Room';
import Auth from './pages/Auth';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Page */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected Main Pages */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/room/:roomId" 
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            } 
          />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
