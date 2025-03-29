// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Authentication
import AuthService from './services/auth.service';
import { setupInterceptors } from './services/api-interceptor';

// Layout
import Layout from './components/layout/Layout/Layout';

// Auth Pages
import LoginPage from './pages/Login/LoginPage';
import DomainSelectionPage from './pages/DomainSelection/DomainSelectionPage';

// Employee Pages
import EmployeeDashboardPage from './pages/Dashboard/EmployeeDashboardPage';
import AssessmentsPage from './pages/Assessment/AssessmentsPage';
import PreAssessmentPage from './pages/Assessment/PreAssessmentPage';
import LearningModulePage from './pages/Assessment/LearningModulePage';
import PostAssessmentPage from './pages/Assessment/PostAssessmentPage';
import CertificatesPage from './pages/Certificates/CertificatesPage';
import UserSettingsPage from './pages/Settings/UserSettingsPage';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagementPage from './pages/Admin/UserManagementPage';
import TrainingManagerPage from './pages/Admin/TrainingManagerPage';
import ModuleCreatorPage from './pages/Admin/ModuleCreatorPage';
import ReportsPage from './pages/Admin/ReportsPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';

// Error Page
import NotFoundPage from './pages/NotFound/NotFoundPage';

//Register
import RegisterPage from './pages/Register/RegisterPage';

// Import global styles
import './styles/global.scss';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = AuthService.getCurrentUser();

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Check if user has allowed role
  if (allowedRoles && !allowedRoles.includes(user.role.toUpperCase())) {
    // Redirect to appropriate dashboard if role is not allowed
    return user.role.toUpperCase() === 'ADMIN' 
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  useEffect(() => {
    // Set up axios interceptors
    setupInterceptors();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes - No Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/domains/:domainId" element={
  <ProtectedRoute>
    <MainLayout>
      <DomainModulesPage />
    </MainLayout>
  </ProtectedRoute>
} />
        <Route path="/domain-selection" element={<DomainSelectionPage />} />
        
        {/* Employee Routes - With Layout and Authentication */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assessments" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <AssessmentsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assessments/:moduleId/pre-assessment" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <PreAssessmentPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assessments/:moduleId/learning" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <LearningModulePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/assessments/:moduleId/post-assessment" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <PostAssessmentPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/certificates" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <CertificatesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <UserSettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes - With Layout and Authentication */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/training-manager" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TrainingManagerPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/training-manager/create" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ModuleCreatorPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Not Found */}
        <Route path="*" element={<NotFoundPage />} />
       <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
};

export default App;