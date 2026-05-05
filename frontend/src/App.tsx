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
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
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
  const { token, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          await verifyToken();
        } catch (error) {
          console.error('Token verification failed:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, setLoading]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/agent"
            element={
              <ProtectedRoute>
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

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <NotificationList />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
