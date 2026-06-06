import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { verifyToken } from './api/authApi';
import Sidebar from './components/Common/Sidebar';
import NotificationList from './components/Common/NotificationList';
import ErrorBoundary from './components/Common/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import AgentPage from './pages/AgentPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import { getRoleHomeRoute, type UserRole } from './auth/roles';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { token, user } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomeRoute(user.role)} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { token, user, setUser, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const result = await verifyToken();
          if (result.valid && result.user) {
            setUser(result.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, setLoading, setUser, logout]);

  const homeRoute = getRoleHomeRoute(user?.role);

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={['REQUESTOR']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PLATFORM_ADMIN', 'REAL_AGENT']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={['REAL_AGENT', 'PLATFORM_ADMIN']}>
                <AgentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to={homeRoute} replace />} />
          <Route path="*" element={<Navigate to={homeRoute} replace />} />
        </Routes>
        
        <NotificationList />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
