// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth Context Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import global styles
import './styles/global.css';
import './styles/layout.css';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// User Pages
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import Reports from './pages/Reports';
import DomainView from './pages/DomainView';
import ModuleView from './pages/ModuleView';
import LearningMaterialsPage from './pages/LearningMaterialsPage';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ModuleManagement from './pages/admin/ModuleManagement';
import ModuleCreator from './pages/admin/ModuleCreator';
import AssessmentCreator from './pages/admin/AssessmentCreator';
import LearningMaterialManagement from './pages/admin/LearningMaterialManagement';
import UserManagement from './pages/admin/UserManagement';
import DomainManagement from './pages/admin/DomainManagement';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';

// Auth Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
          borderRadius: '4px',
        },
      },
    },
  },
});

// Protected route wrapper with role checking
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { currentUser, loading, isAdmin } = useAuth();
  
  // Show loading state while auth check is in progress
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Require admin but user is not admin
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* User routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute requireAdmin={false}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/domains/:domainId" element={<DomainView />} />
          <Route path="/modules/:moduleId" element={<ModuleView />} />
          <Route path="/learning-materials" element={<LearningMaterialsPage />} />
          <Route path="/modules/:moduleId/materials" element={<LearningMaterialsPage />} />
          <Route path="/modules/:moduleId/components/:componentId/materials" element={<LearningMaterialsPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="/admin/modules" element={<ModuleManagement />} />
          <Route path="/admin/modules/create" element={<ModuleCreator />} />
          <Route path="/admin/modules/edit/:moduleId" element={<ModuleCreator />} />
          <Route path="/admin/materials" element={<LearningMaterialManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/domains" element={<DomainManagement />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;