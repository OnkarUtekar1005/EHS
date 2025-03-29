// src/components/layout/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.scss';

const Sidebar = ({ user, isOpen }) => {
  const location = useLocation();
  const [domains, setDomains] = useState([]);
  const [domainsExpanded, setDomainsExpanded] = useState(false);
  
  useEffect(() => {
    // Fetch available domains
    // This would be an API call in production
    const fetchDomains = async () => {
      // Mock data for now
      const mockDomains = [
        { id: '1', name: 'Fire Safety' },
        { id: '2', name: 'OSHA' },
        { id: '3', name: 'First Aid' },
        { id: '4', name: 'Environmental Compliance' }
      ];
      setDomains(mockDomains);
    };
    
    fetchDomains();
  }, []);
  
  const toggleDomainsExpanded = () => {
    setDomainsExpanded(!domainsExpanded);
  };

  const isActive = (path) => location.pathname === path;

  // Navigation items
  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"></rect>
          <rect x="14" y="3" width="7" height="5"></rect>
          <rect x="14" y="12" width="7" height="9"></rect>
          <rect x="3" y="16" width="7" height="5"></rect>
        </svg>
      )
    },
    {
      title: 'My Courses',
      path: '/assessments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-logo">EHS</div>
            <h2 className="brand-text">E-Learning</h2>
          </div>
        </div>
        
        <div className="sidebar-content">
          <nav className="sidebar-menu">
            <ul className="menu-section">
              {navItems.map((item, index) => (
                <li key={index} className={isActive(item.path) ? 'active' : ''}>
                  <NavLink to={item.path} className="sidebar-link">
                    <span className="link-icon">{item.icon}</span>
                    <span className="link-text">{item.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            
            {/* Domains section */}
            <div className="menu-title">
              <span>Domains</span>
              <button 
                className={`toggle-button ${domainsExpanded ? 'expanded' : ''}`}
                onClick={toggleDomainsExpanded}
                aria-label={domainsExpanded ? 'Collapse domains' : 'Expand domains'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            
            <ul className={`menu-section domains ${domainsExpanded ? 'expanded' : ''}`}>
              {domains.map(domain => (
                <li key={domain.id}>
                  <NavLink 
                    to={`/domains/${domain.id}`} 
                    className="sidebar-link domain-link"
                    activeClassName="active"
                  >
                    <span className="domain-icon">•</span>
                    <span className="link-text">{domain.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-role">{user?.role || 'Employee'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;