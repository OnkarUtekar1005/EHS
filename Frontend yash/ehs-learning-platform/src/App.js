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
import Profile from './pages/Profile';
import MyCourses from './pages/users/MyCourses';
import CourseDetail from './pages/users/CourseDetail';
import CourseView from './pages/users/CourseView';
import MaterialView from './pages/users/MaterialView';
import AssessmentView from './pages/users/AssessmentView';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement/UserManagement';
import DomainManagement from './pages/admin/DomainManagement';
import CourseManagement from './pages/admin/CourseManagement/CourseManagement';
import MaterialsManagement from './pages/admin/MaterialsManagement';
import AssessmentManagement from './pages/admin/AssessmentManagement';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';

// Auth Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import CertificateVerification from './pages/CertificateVerification';

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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/certificate/verify/:certificateNumber" element={<CertificateVerification />} />
        
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/course/:courseId" element={<CourseView />} />
          <Route path="/course/:courseId/material/:componentId" element={<MaterialView />} />
          <Route path="/course/:courseId/assessment/:componentId" element={<AssessmentView />} />
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
          
          {/* User Management Routes */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/domains" element={<DomainManagement />} />
          <Route path="/admin/courses" element={<CourseManagement />} />
          <Route path="/admin/materials" element={<MaterialsManagement />} />
          <Route path="/admin/assessments" element={<AssessmentManagement />} />
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