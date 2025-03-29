// src/components/layout/Layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../../../services/auth.service';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import './Layout.scss';

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load full user profile
    const fetchUserProfile = async () => {
      try {
        const userProfile = await AuthService.getCurrentUserProfile();
        if (userProfile) {
          setUser({ ...currentUser, ...userProfile });
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(currentUser);
      }
    };

    fetchUserProfile();
    
    // Check if mobile on first load
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [navigate]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  if (!user) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar 
        user={user} 
        isOpen={sidebarOpen}
      />
      
      <div className="main-wrapper">
        <Header 
          user={user} 
          toggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;