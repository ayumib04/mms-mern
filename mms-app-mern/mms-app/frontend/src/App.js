// frontend/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/dashboard/Dashboard';
import EquipmentRegistry from './components/equipment/EquipmentRegistry';
import Inspections from './components/inspections/Inspections';
import Backlogs from './components/backlogs/Backlogs';
import WorkOrders from './components/workOrders/WorkOrders';
import PreventiveMaintenance from './components/preventiveMaintenance/PreventiveMaintenance';
import Analytics from './components/analytics/Analytics';
import UserManagement from './components/users/UserManagement';
import PrivateRoute from './components/auth/PrivateRoute';
import { initializeWebSocket } from './services/websocket';
import './App.css';

function AppContent() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      try {
        // Initialize WebSocket connection when user is authenticated
        const cleanup = initializeWebSocket(token, user.id);
        return cleanup;
      } catch (error) {
        console.error('WebSocket initialization error:', error);
        // App continues to work even if WebSocket fails
      }
    }
  }, [user, token]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="equipment" element={<EquipmentRegistry />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="backlogs" element={<Backlogs />} />
          <Route path="workorders" element={<WorkOrders />} />
          <Route path="preventive-maintenance" element={<PreventiveMaintenance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route 
            path="users" 
            element={
              <PrivateRoute roles={['Administrator']}>
                <UserManagement />
              </PrivateRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;