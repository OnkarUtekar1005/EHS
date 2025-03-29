// src/pages/Dashboard/EmployeeDashboardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import './EmployeeDashboardPage.scss';

// Import common components
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ModuleCard from '../../components/modules/ModuleCard/ModuleCard';

const EmployeeDashboardPage = () => {
  const [userData, setUserData] = useState(null);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [inProgressModules, setInProgressModules] = useState([]);
  const [completedModules, setCompletedModules] = useState([]);
  const [recommendedModules, setRecommendedModules] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [statistics, setStatistics] = useState({
    completed: 0,
    certificates: 0,
    upcomingDeadlines: 0,
    overallProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reference for the domain dropdown
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDomainDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user data and domains
  useEffect(() => {
    const fetchUserAndDomains = async () => {
      try {
        const user = AuthService.getCurrentUser();
        if (!user) {
          window.location.href = '/login';
          return;
        }
        setUserData(user);

        // Fetch domains
        // In production, replace with API call
        // const domainsResponse = await axios.get('/api/domains');
        // setDomains(domainsResponse.data);
        
        // Mock domains for development
        const mockDomains = [
          { id: '1', name: 'Fire Safety' },
          { id: '2', name: 'OSHA' },
          { id: '3', name: 'First Aid' },
          { id: '4', name: 'Environmental Compliance' }
        ];
        setDomains(mockDomains);
        
        // Set selected domain
        if (user.domainId) {
          const userDomain = mockDomains.find(d => d.id === user.domainId);
          if (userDomain) {
            setSelectedDomain(userDomain);
          } else {
            setSelectedDomain(mockDomains[0]);
          }
        } else {
          setSelectedDomain(mockDomains[0]);
        }
      } catch (err) {
        console.error('Error fetching user and domains:', err);
        setError('Failed to load user data. Please refresh or try again later.');
      }
    };
    
    fetchUserAndDomains();
  }, []);

  // Fetch dashboard data when selected domain changes
  useEffect(() => {
    if (!selectedDomain) return;
    
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real implementation, fetch data from the API
        // const response = await DashboardService.getDashboardByDomain(selectedDomain.id);
        // setModules(response.modules);
        // setRecentActivities(response.activities);
        // setStatistics(response.statistics);
        
        // Use mock data for now
        setTimeout(() => {
          // Mock modules data based on the technical specification
          const mockModules = [
            {
              id: '1',
              title: 'Fire Safety Basics',
              description: 'Learn the fundamentals of workplace fire safety including prevention, emergency procedures, and equipment handling.',
              status: 'IN_PROGRESS',
              progressPercentage: 45,
              estimatedDuration: 60,
              domainName: selectedDomain.name,
              totalQuestions: 20,
              preAssessmentCompleted: true,
              learningCompleted: false
            },
            {
              id: '2',
              title: 'Fire Extinguisher Training',
              description: 'Comprehensive training on proper use of fire extinguishers in different scenarios.',
              status: 'NOT_STARTED',
              progressPercentage: 0,
              estimatedDuration: 90,
              domainName: selectedDomain.name,
              totalQuestions: 25,
              preAssessmentCompleted: false,
              learningCompleted: false
            },
            {
              id: '3',
              title: 'Evacuation Procedures',
              description: 'Learn how to respond effectively to various workplace emergencies including evacuations and first aid.',
              status: 'COMPLETED',
              progressPercentage: 100,
              estimatedDuration: 45,
              domainName: selectedDomain.name,
              totalQuestions: 15,
              preAssessmentCompleted: true,
              learningCompleted: true
            }
          ];
          
          // Recent activities
          const mockActivities = [
            {
              id: '1',
              type: 'MODULE_STARTED',
              title: 'Fire Safety Basics',
              description: 'You started the training module',
              timestamp: new Date(Date.now() - 8600000).toISOString() // 2 hours 23 minutes ago
            },
            {
              id: '2',
              type: 'ASSESSMENT_COMPLETED',
              title: 'Pre-Assessment: Fire Safety Basics',
              description: 'You scored 75% on the pre-assessment',
              timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
            },
            {
              id: '3',
              type: 'MODULE_COMPLETED',
              title: 'Evacuation Procedures',
              description: 'You completed the training module with 92% overall score',
              timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            }
          ];
          
          // Statistics
          const mockStatistics = {
            completed: 1,
            certificates: 1,
            upcomingDeadlines: 1,
            overallProgress: 33
          };
          
          // Set data
          setModules(mockModules);
          setInProgressModules(mockModules.filter(module => module.status === 'IN_PROGRESS'));
          setCompletedModules(mockModules.filter(module => module.status === 'COMPLETED'));
          setRecommendedModules([mockModules[1]]); // Recommend not started modules
          setRecentActivities(mockActivities);
          setStatistics(mockStatistics);
          setIsLoading(false);
        }, 500);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please refresh or try again later.');
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedDomain]);

  const handleDomainChange = (domain) => {
    setSelectedDomain(domain);
    setDomainDropdownOpen(false);
    // In production, you would update user's selected domain in the backend
    // axios.put(`/api/users/${userData.id}/domains`, { domainId: domain.id });
  };

  const toggleDomainDropdown = () => {
    setDomainDropdownOpen(!domainDropdownOpen);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="employee-dashboard">
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userData?.username || 'User'}</h1>
          <div className="domain-selection" ref={dropdownRef}>
            <span>Domain:</span>
            <div className="domain-dropdown-container">
              <button 
                className="domain-dropdown-toggle" 
                onClick={toggleDomainDropdown}
              >
                {selectedDomain?.name}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`dropdown-arrow ${domainDropdownOpen ? 'open' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {domainDropdownOpen && (
                <div className="dropdown-menu">
                  {domains.map(domain => (
                    <div 
                      key={domain.id} 
                      className={`dropdown-item ${domain.id === selectedDomain?.id ? 'active' : ''}`}
                      onClick={() => handleDomainChange(domain)}
                    >
                      {domain.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="refresh-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"></polyline>
              <polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon completed">✓</div>
          <div className="stat-title">Completed</div>
          <div className="stat-value">{statistics.completed}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon certificates">🏆</div>
          <div className="stat-title">Certificates</div>
          <div className="stat-value">{statistics.certificates}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon deadlines">⏱️</div>
          <div className="stat-title">Deadlines</div>
          <div className="stat-value">{statistics.upcomingDeadlines}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon progress">📊</div>
          <div className="stat-title">Overall Progress</div>
          <div className="stat-value">{statistics.overallProgress}%</div>
        </div>
      </div>
      
      {/* In Progress Modules */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>In Progress</h2>
          <Link to="/assessments" className="view-all-link">View All</Link>
        </div>
        
        {inProgressModules.length === 0 ? (
          <div className="no-data-message">
            <p>You don't have any modules in progress.</p>
            <Link to="/assessments" className="start-module-link">Start a training module</Link>
          </div>
        ) : (
          <div className="module-cards">
            {inProgressModules.map(module => (
              <ModuleCard 
                key={module.id} 
                module={module} 
                actionText="Continue"
                actionPath={`/assessments/${module.id}`}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Module Selection (similar to Module Selection Screen in tech spec) */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Available Modules</h2>
        </div>
        
        <div className="module-cards">
          {modules.map(module => (
            <div key={module.id} className="module-selection-card">
              <div className="module-details">
                <h3>{module.title}</h3>
                <div className="module-meta">
                  <div className="meta-item">
                    <span className="meta-label">Duration:</span>
                    <span className="meta-value">{module.estimatedDuration} minutes</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className={`meta-value status-${module.status.toLowerCase()}`}>
                      {module.status === 'NOT_STARTED' ? 'Not Started' : 
                       module.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                </div>
                <p className="module-description">{module.description}</p>
                {module.progressPercentage > 0 && (
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${module.progressPercentage}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      Progress: {module.progressPercentage}%
                      {module.status === 'IN_PROGRESS' && module.preAssessmentCompleted && !module.learningCompleted && " (Pre-assessment completed)"}
                      {module.status === 'IN_PROGRESS' && module.learningCompleted && " (Learning materials completed)"}
                    </span>
                  </div>
                )}
              </div>
              <div className="module-action">
                <Link 
                  to={`/assessments/${module.id}`} 
                  className="action-button"
                >
                  {module.status === 'NOT_STARTED' ? 'Start' : 
                   module.status === 'IN_PROGRESS' ? 'Resume' : 'Review'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dashboard Widgets Section */}
      <div className="dashboard-widgets">
        {/* Recent Activity Widget */}
        <div className="dashboard-widget activity-widget">
          <div className="widget-header">
            <h2>Recent Activity</h2>
          </div>
          
          {recentActivities.length === 0 ? (
            <div className="no-data-message">
              <p>No recent activities.</p>
            </div>
          ) : (
            <div className="activity-feed">
              <ul className="activity-list">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.type.toLowerCase()}`}>
                      {activity.type === 'MODULE_STARTED' && (
                        <span>▶</span>
                      )}
                      {activity.type === 'ASSESSMENT_COMPLETED' && (
                        <span>✓</span>
                      )}
                      {activity.type === 'MODULE_COMPLETED' && (
                        <span>🏆</span>
                      )}
                    </div>
                    <div className="activity-content">
                      <h4 className="activity-title">{activity.title}</h4>
                      <p className="activity-description">{activity.description}</p>
                      <span className="activity-time">
                        {new Date(activity.timestamp).toLocaleDateString()} - 
                        {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Performance Summary Widget */}
        <div className="dashboard-widget chart-widget">
          <div className="widget-header">
            <h2>Performance Summary</h2>
          </div>
          
          <div className="performance-summary">
            <div className="chart-container">
              <div className="pre-post-chart">
                <div className="chart-bar-container">
                  <div className="chart-label">Pre-Assessment</div>
                  <div className="chart-bar">
                    <div className="chart-fill pre-fill" style={{ width: '70%' }}></div>
                    <span className="chart-value">70%</span>
                  </div>
                </div>
                
                <div className="chart-bar-container">
                  <div className="chart-label">Post-Assessment</div>
                  <div className="chart-bar">
                    <div className="chart-fill post-fill" style={{ width: '85%' }}></div>
                    <span className="chart-value">85%</span>
                  </div>
                </div>
              </div>
              
              <div className="improvement-summary">
                <div className="improvement-label">Average Improvement:</div>
                <div className="improvement-value">+15%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardPage;