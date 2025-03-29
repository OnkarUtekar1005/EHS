// src/pages/DomainSelection/DomainSelectionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import './DomainSelectionPage.scss';

// Mock domain data - replace with API call in production
const mockDomains = [
  {
    id: '1',
    name: 'Safety Officer',
    description: 'Specialized training for workplace safety officers focusing on hazard identification and risk assessment.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    )
  },
  {
    id: '2',
    name: 'Fire Safety',
    description: 'Training modules focusing on fire prevention, emergency procedures, and equipment handling.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
      </svg>
    )
  },
  {
    id: '3',
    name: 'Environmental Compliance',
    description: 'Training for environmental laws, regulations, and sustainable practices in the workplace.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    )
  },
  {
    id: '4',
    name: 'Health Management',
    description: 'Training on occupational health standards, first aid, and health emergency protocols.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
    )
  }
];

const DomainSelectionPage = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Fetch domains - Using mock data for now
    // In production, replace with an API call
    const fetchDomains = async () => {
      try {
        // const response = await fetch('/api/domains');
        // const data = await response.json();
        // setDomains(data);
        
        // Using mock data
        setTimeout(() => {
          setDomains(mockDomains);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching domains:', error);
        setLoading(false);
      }
    };

    fetchDomains();
  }, [navigate]);

  const handleDomainSelect = (domain) => {
    setSelectedDomain(domain);
  };

  const handleContinue = async () => {
    if (!selectedDomain) return;

    try {
      // In production, make an API call to update user domain
      // await fetch(`/api/users/${user.id}/domains`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${user.token}`
      //   },
      //   body: JSON.stringify({ domainId: selectedDomain.id })
      // });

      // Mock update - store in localStorage for now
      const updatedUser = {
        ...user,
        domains: [selectedDomain]
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Redirect to dashboard
      if (user.role?.toUpperCase() === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error updating domain:', error);
    }
  };

  if (loading) {
    return (
      <div className="domain-selection-page">
        <div className="loading-spinner">Loading domains...</div>
      </div>
    );
  }

  return (
    <div className="domain-selection-page">
      <div className="domain-selection-container">
        <div className="domain-selection-header">
          <h1>Select Your Domain</h1>
          <p>Choose the domain that best matches your role to access relevant training modules</p>
        </div>

        <div className="domain-cards">
          {domains.map((domain) => (
            <div 
              key={domain.id}
              className={`domain-card ${selectedDomain?.id === domain.id ? 'selected' : ''}`}
              onClick={() => handleDomainSelect(domain)}
            >
              <div className="domain-card-icon">
                {domain.icon}
              </div>
              <h3 className="domain-card-title">{domain.name}</h3>
              <p className="domain-card-description">{domain.description}</p>
              <div className="domain-card-select">
                {selectedDomain?.id === domain.id ? 'Selected' : 'Select Domain'}
              </div>
            </div>
          ))}
        </div>

        <div className="domain-selection-actions">
          <button 
            className="continue-button"
            disabled={!selectedDomain}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainSelectionPage;